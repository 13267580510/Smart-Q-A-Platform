<template>
    <div class="answer">
        <div class="left">
            <el-card>
                <div class="infinite-container">
                    <ul v-infinite-scroll="load" class="list" :infinite-scroll-disabled="disabled">
                        <li v-for="(item, index) in questionList" :key="item.id">
                            <div class="item">
                                <div class="left-item">
                                    <div class="title" @click="goDetail(item.id)">{{ item.title }}</div>
                                    <div class="txt">{{ item.viewCount }} 浏览 · {{ answerCount }} 回答 · {{
                                        formatTimestamp(item.createdTime) }}发布</div>
                                </div>
                                <div class="right-item" style="margin-right: 20px;">
                                    <el-button :icon="Edit" @click="answer(item)">写回答</el-button>
                                </div>
                            </div>
                        </li>
                    </ul>
                    <p v-if="loading" style="text-align: center;">加载中...</p>
                    <p v-if="noMore" style="text-align: center;">已经到低啦~</p>
                </div>
            </el-card>
        </div>
        <div class="right">
            <side-bar />
        </div>
    </div>
    <el-dialog v-model="isAnswer" title="回答问题" width="800">
        <div style="text-align: center;margin-bottom: 20px;">
            <h2>{{ questionObj.title }}</h2>
        </div>
        <div style="border: 1px solid #ccc">
            <Toolbar style="border-bottom: 1px solid #ccc" :editor="editorRef" :defaultConfig="toolbarConfig"
                :mode="mode" />
            <Editor style="height: 300px; overflow-y: hidden;" v-model="valueHtml" :defaultConfig="editorConfig"
                :mode="mode" @onCreated="handleCreated" />
        </div>
        <div style="margin-top: 30px; display: flex;">
            <el-button style="flex: 1;" @click="isAnswer = false">取消</el-button>
            <el-button type="primary" style="flex: 1;" @click="sendAnswer">确定</el-button>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import { DocumentAdd, Edit } from '@element-plus/icons-vue'
import SideBar from '../../layout/SideBar/index.vue'
import { useRouter } from 'vue-router'
import { ref, computed, onMounted, shallowRef, onBeforeUnmount } from 'vue';
import { ReqGetQuestionAll } from '../../api/question';
import { formatTimestamp } from '../../utils/general';
import '@wangeditor/editor/dist/css/style.css' // 引入 css
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { ReqSendAnswer, ReqUploadAnswerImg } from '../../api/answer';
import { ElMessage } from 'element-plus';
import useUserStore from '../../store/modules/user';

const editorRef = shallowRef()
const valueHtml = ref('')
const toolbarConfig = {}
const editorConfig: any = { placeholder: '请输入内容...', MENU_CONF: {} }
const UserStore = useUserStore();
const $router = useRouter();
const isAnswer = ref(false)
const page = ref(0);
const questionList = ref([]);
const goDetail = (id: number) => {
    $router.push({
        path: '/questionDetail',
        query: {
            id
        }
    })
}
const questionObj = ref({})
const answer = (item: any) => {
    questionObj.value = item;
    isAnswer.value = true
}
const loading = ref(false)
const noMore = ref(false)
const disabled = computed(() => loading.value || noMore.value)
const load = () => {
    loading.value = true
    setTimeout(() => {
        getQuestion();
        loading.value = false
    }, 2000)
}

const getQuestion = async () => {
    page.value++;
    console.log(page.value)
    let result = await ReqGetQuestionAll(page.value, 10);
    console.log(result)
    if (result.status === 200) {
        if (result.data.data.length != 0) {
            result.data.data.forEach(item => questionList.value.push(item))
        } else {
            noMore.value = true;
        }
    }
}
editorConfig.MENU_CONF['uploadImage'] = {
    // 自定义上传
    async customUpload(file: any, insertFn: any) {
        // TS 语法
        const formData = new FormData();
        formData.append('file', file)
        let result = await ReqUploadAnswerImg(formData);
        let url;
        if (result.status == 201) {
            url = `http://127.0.0.1:8080${result.data}`
            ElMessage.success('上传回答图片成功');
        }
        console.log(url)
        insertFn(url, '', '')
    },
}

const sendAnswer = async () => {
    let data = {
        answerTime: new Date().toISOString(),
        questionId: questionObj.value.id,
        userId: UserStore.userInfo.id,
        content: valueHtml.value
    }
    let result = await ReqSendAnswer(data);
    if (result.status == 200) {
        valueHtml.value = '';
        ElMessage.success('发布回答成功');
        isAnswer.value = false;
    } else {
        valueHtml.value = '';
        ElMessage.error('发布回答失败');
        isAnswer.value = false;
    }
}


// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
    const editor = editorRef.value
    if (editor == null) return
    editor.destroy()
})

const handleCreated = (editor: any) => {
    editorRef.value = editor // 记录 editor 实例，重要！
}


onMounted(() => {
    getQuestion();
})
</script>

<style scoped lang="scss">

.answer {
    width: 100%;
    display: flex;

    .left {
        width: 100%;
        margin-right: 20px;

        .infinite-container {
            max-height: 100vh;
            overflow-y: auto;
        }

        /* 自定义滚动条样式 */
        .infinite-container::-webkit-scrollbar {
            width: 6px;
        }

        .infinite-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }

        .infinite-container::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 10px;
        }

        .infinite-container::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
        }

        .item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 0;
            box-sizing: border-box;
            border-bottom: 1px solid #E9EAEB;

            .left-item {
                .title {
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                }

                .txt {
                    color: #9196A1;
                    font-size: 14px;
                }
            }

            .right-item {
                display: flex;
                justify-content: end;

                button:nth-child(2) {
                    background-color: #1772F6;
                    color: #fff;
                }

                button:nth-child(1) {
                    color: #1772F6;
                    border-color: #1772F6;
                }
            }
        }
    }

    .right {
        width: 600px;
    }
}
</style>