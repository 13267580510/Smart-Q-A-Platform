<template>
    <div class="container">
        <div class="left">
            <el-card>
                <!-- 标题修改：发布问题 → 保存修改 -->
                <el-form :model="questionForm" label-width="80px">
                    <el-form-item label="标题:">
                        <el-input placeholder="请输入标题" v-model="questionForm.title"></el-input>
                    </el-form-item>
                </el-form>
                    <!-- 移植：分类树形选择组件 -->
                    <el-form-item label="分类:">
                        <el-tree-select
                            v-model="questionForm.categoryId"
                            :data="categoryTree"
                            node-key="id"
                            placeholder="请选择问题分类"
                            style="width: 100%;"
                            :props="{ label: 'name', children: 'children' }"
                            @change="handleCategoryChange"
                        ></el-tree-select>
                    </el-form-item>
                <p style="margin-bottom: 10px; font-size: 14px; color: #606266;">正文：</p>
                <div style="border: 1px solid #ccc">
                    <Toolbar style="border-bottom: 1px solid #ccc" :editor="editorRef" :defaultConfig="toolbarConfig"
                        :mode="mode" />
                    <Editor style="height: 500px; overflow-y: hidden;" v-model="questionForm.content" :defaultConfig="editorConfig"
                        :mode="mode" @onCreated="handleCreated" />
                </div>
                <div class="btn">
                    <!-- 按钮文案修改：发布问题 → 保存修改；新增取消按钮 -->
                    <el-button @click="handleCancel">取消</el-button>
                    <el-button type="primary" @click="sendEditQuestion">保存修改</el-button>
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
import { useRouter, useRoute } from 'vue-router'; // 新增：路由相关，获取问题ID、返回上一页
import RichTextEditor from '../../components/RichTextEditor/index.vue';
import SideBar from '../../layout/SideBar/index.vue'
import '@wangeditor/editor/dist/css/style.css' // 引入 css
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import useUserStore from '../../store/modules/user';
import { ElMessage } from 'element-plus';
// 新增：导入获取问题详情、修改问题的接口（根据你的实际接口调整，若未新增修改接口，先预留）
import { ReqGetQuestionDetail, ReqUploadQuestionImg, ReqEditQuestion, ReqGetCategories } from '../../api/question';

const router = useRouter();
const route = useRoute();
const UserStore = useUserStore();

// 新增：修改为表单对象，统一管理问题数据（包含id，用于提交修改）
const questionForm = ref({
    id: 0, // 问题ID，必传，用于后端识别要修改的问题
    title: '', // 问题标题
    content: '<p>请编辑问题内容...</p>', // 问题正文（富文本）
    categoryId: ''//问题分类ID
});

// 移植：新增分类相关响应式变量（和文章发布页一致）
const categoryTree = ref([]); // 分类树形数据

const editorRef = shallowRef()
const toolbarConfig = {}
const editorConfig = { placeholder: '请输入内容...', MENU_CONF: {} }

// 原有：图片上传逻辑（保持不变，复用即可）
editorConfig.MENU_CONF['uploadImage'] = {
    // 自定义上传
    async customUpload(file, insertFn) {
        const formData = new FormData();
        formData.append('file', file)
        let result = await ReqUploadQuestionImg(formData);
        let url;
        if (result.status == 201) {
            url = `http://127.0.0.1:8082${result.data}`
            ElMessage.success('上传问题图片成功');
        }
        insertFn(url, '', '')
    },
}

// 组件销毁时，销毁编辑器（保持不变）
onBeforeUnmount(() => {
    const editor = editorRef.value
    if (editor == null) return
    editor.destroy()
})

// 编辑器创建完成（保持不变）
const handleCreated = (editor) => {
    editorRef.value = editor // 记录 editor 实例，重要！
}


/**
 * 分类变更回调（可选，用于打印日志或额外处理）
 */
const handleCategoryChange = (val) => {
  console.log('选中的问题分类ID：', val);
}
const getCategoryData = async () => {
  try {
    const result = await ReqGetCategories();
    if (result) {
      categoryTree.value = result; // 赋值树形分类数据
    }
  } catch (error) {
    ElMessage.error('获取分类列表失败');
    console.error('分类获取异常：', error);
  }
}

// 新增：获取问题详情，回显到表单中
const getQuestionDetail = async () => {
    try {
        // 从路由参数中获取问题ID（假设路由传参为 id，如 /question/edit?id=1001）
        const questionId = Number(route.query.id);
        if (!questionId) {
            ElMessage.error('缺少问题ID，无法编辑');
            router.go(-1); // 返回上一页
            return;
        }
        
        getCategoryData();

        // 调用问题详情接口，获取原有数据
        const res = await ReqGetQuestionDetail(questionId);
        console.log("问题编辑页:",res)

        if (res) {
            // 回显数据到表单
            questionForm.value.id = questionId;
            questionForm.value.title = res.title || '';
            questionForm.value.categoryId = res.categoryId || '';
            questionForm.value.content = res.content || '<p>请编辑问题内容...</p>';
        }
    } catch (error) {
        ElMessage.error('获取问题详情失败，无法编辑');
        console.error('获取问题详情失败：', error);
        router.go(-1); // 返回上一页
    }
}

// 修改：提交修改（替代原有发送提问）
const sendEditQuestion = async () => {
    // 表单校验
    if (!questionForm.value.title.trim()) {
        ElMessage.warning('请输入问题标题');
        return;
    }
    if (!questionForm.value.content.trim() || questionForm.value.content === '<p>请编辑问题内容...</p>') {
        ElMessage.warning('请输入问题正文');
        return;
    }

    try {
        // 构造修改请求参数（补充用户信息，与后端接口对齐）
        const editData = {
            id: questionForm.value.id,
            title: questionForm.value.title,
            content: questionForm.value.content,
            username: UserStore.userInfo.username, // 用于后端权限校验
            categoryId: questionForm.value.categoryId, // 若分类可修改，可改为双向绑定，此处保持原有默认值
        };
        console.log("问题",questionForm.value);
        // 调用修改问题接口（ReqEditQuestion 需你后端新增对应接口）
        
        const result = await ReqEditQuestion(questionForm.value.id,editData);
        if (result) {
            ElMessage.success('问题修改成功');
            router.push('/my/myQuestion'); // 跳转回我的问题列表页（根据你的路由调整）
        }
    } catch (error) {
        ElMessage.error('问题修改失败，请稍后重试');
        console.error('问题修改失败：', error);
    }
}

// 新增：取消修改，返回上一页
const handleCancel = () => {
    router.go(-1);
}

// 新增：挂载时获取问题详情，回显数据
onMounted(() => {
    getQuestionDetail();
})
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
            // 新增：调整按钮间距
            > button {
                margin-left: 10px;
            }
        }
    }

    .right {
        width: 600px;
    }
}
</style>