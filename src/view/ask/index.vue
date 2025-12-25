<template>
    <div class="container">
        <div class="left">
            <el-card>
                <el-form>
                    <el-form-item label="标题:">
                        <el-input placeholder="请输入标题" v-model="title"></el-input>
                    </el-form-item>
                </el-form>
                <p style="margin-bottom: 10px; font-size: 14px; color: #606266;">正文：</p>
                <div style="border: 1px solid #ccc">
                    <Toolbar style="border-bottom: 1px solid #ccc" :editor="editorRef" :defaultConfig="toolbarConfig"
                        :mode="mode" />
                    <Editor style="height: 500px; overflow-y: hidden;" v-model="valueHtml" :defaultConfig="editorConfig"
                        :mode="mode" @onCreated="handleCreated" />
                </div>
                <div class="btn">
                    <el-button type="primary" @click="sendAsk">发布问题</el-button>
                </div>
            </el-card>
        </div>
        <div class="right">
            <side-bar />
        </div>
    </div>
</template>

<script setup>
import { onBeforeUnmount, ref, shallowRef, onMounted } from 'vue';
import RichTextEditor from '../../components/RichTextEditor/index.vue';
import SideBar from '../../layout/SideBar/index.vue'
import '@wangeditor/editor/dist/css/style.css' // 引入 css
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import useUserStore from '../../store/modules/user';
import { ReqAskQuestion, ReqUploadQuestionImg } from '../../api/question';
import { ElMessage } from 'element-plus';
const title = ref('');
const editorRef = shallowRef()
const valueHtml = ref('<p>hello</p>')
const UserStore = useUserStore();
const toolbarConfig = {}
const editorConfig = { placeholder: '请输入内容...',MENU_CONF: {}}


editorConfig.MENU_CONF['uploadImage'] = {
  // 自定义上传
  async customUpload(file, insertFn) {
    // TS 语法
    const formData = new FormData();
    formData.append('file',file)
    let result  = await ReqUploadQuestionImg(formData);
    let url;
    if(result.status == 201){
        url = `http://127.0.0.1:8080${result.data}`
        ElMessage.success('上传问题图片成功');
    }
    console.log(url)
    insertFn(url, '', '')
  },
}



// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
    const editor = editorRef.value
    if (editor == null) return
    editor.destroy()
})

const handleCreated = (editor) => {
    editorRef.value = editor // 记录 editor 实例，重要！
}

const sendAsk = async () => {
    let data = {
        title:title.value,
        content:valueHtml.value,
        username:UserStore.userInfo.username,
        categoryId:'1'
    }
    let result = await ReqAskQuestion(data);
    if(result.status == 201){
        title.value = ''
        valueHtml.value = ''
        ElMessage.success('提问问题成功');
    }else{
        ElMessage.error('提问问题失败')
    }
}

</script>
<style scoped lang="scss">
.container {
    display: flex;

    .left {
        width: 100%;
        margin-right: 20px;

        .btn {
            display: flex;
            align-items: center;
            justify-content: end;
            margin-top: 20px;
        }
    }

    .right {
        width: 600px;
    }
}
</style>