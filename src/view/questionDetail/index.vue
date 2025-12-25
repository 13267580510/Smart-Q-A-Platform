<template>
    <div class="questionDetail">
        <el-card>
            <el-button :icon="ArrowLeftBold" @click="back" type="primary">返回</el-button>
            <div class="question">
                <div class="author">
                    <div class="left">
                        <img src="https://img2.baidu.com/it/u=697497216,1465432348&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500"
                            alt="">
                        <p>{{ data.author.nickname }}</p>
                    </div>
                    <div class="right">
                        <el-button type="primary">举报</el-button>
                    </div>
                </div>
                <div class="title">{{ data.title }}</div>
                <div class="detail" v-html="data.content"></div>
                <div class="bottom">
                    <div class="btn">
                        <el-button @click="answerQuestion">{{ isAnswer ? '取消' : '发布回答' }}</el-button>
                    </div>
                </div>
            </div>
        </el-card>
        <el-card class="answer" v-if="isAnswer">
            <div style="border: 1px solid #ccc">
                <Toolbar style="border-bottom: 1px solid #ccc" :editor="editorRef" :defaultConfig="toolbarConfig"
                    :mode="mode" />
                <Editor style="height: 300px; overflow-y: hidden;" v-model="valueHtml" :defaultConfig="editorConfig"
                    :mode="mode" @onCreated="handleCreated" />
            </div>
            <div class="btn" style="text-align: right;margin-top: 10px;">
                <el-button type="primary" @click="sendAnswer">发布回答</el-button>
            </div>
        </el-card>
        <el-card class="comment" v-if="data.answers.length != 0">
            <h4>1392个回答</h4>
            <template v-for="(item, index) in data.answers">
                <div class="item">
                    <div class="userInfo">
                        <div class="user">
                            <img src="https://img02.sogoucdn.com/app/a/100520093/ae588be27ee085c4-fd668f66a830d70e-24b46b127c1c13c86a5320324f49613b.jpg"
                                alt="">
                            <div class="username">
                                <div class="name">{{ item.author.nickname }}</div>
                                <div class="like">喜欢甜文</div>
                            </div>
                        </div>
                        <el-button class="followBtn">举报</el-button>
                    </div>
                    <div class="up">
                        <div>有{{ item.likeCount }}赞同了该回答</div>
                        <el-icon>
                            <ArrowRight />
                        </el-icon>
                    </div>
                    <div class="content" v-html="item.content">

                    </div>
                    <div class="sendTime">
                        编辑于 · {{ formatTimestamp(item.createdTime) }} · 广东
                    </div>
                    <div class="bottom">
                        <el-button :icon="CaretTop" class="up">赞同</el-button>
                        <el-button :icon="CaretBottom" class="down"></el-button>
                        <div class="menu">
                            <div @click="comment(item.id)">
                                <el-icon>
                                    <component :is="ChatLineRound"></component>
                                </el-icon>
                                <p>评论</p>
                            </div>
                            <div>
                                <el-icon>
                                    <component :is="Star"></component>
                                </el-icon>
                                <p>收藏</p>
                            </div>
                            <div>
                                <el-icon>
                                    <component :is="WarnTriangleFilled"></component>
                                </el-icon>
                                <p>举报</p>
                            </div>
                        </div>
                    </div>
                    <el-card v-if="active == item.id">
                        <el-input v-model="text" :rows="6" type="textarea"
                            placeholder="请输入要发表的评论" />
                        <div style="text-align: right;margin-top: 10px;"><el-button type="primary" @click="sendComment(item.id)">发表评论</el-button>
                        </div>
                    </el-card>
                    <div class="comment-child" v-for="(item1,index) in item.comments" :key="item1.id">
                        <div class="useri">
                            <img :src="'http://img.wxcha.com/m00/73/a9/a9d773e6fa81bad515c31254418fd514.jpg'" alt=""
                                style="width: 50px; height: 50px;">
                            <div>
                                <p style="font-size: 14px;">{{item1.author.nickname}}</p>
                                <p style=" color: #535861;font-size: 12px;">喜欢研究</p>
                            </div>
                        </div>
                        <p style="margin-left: 60px;">{{ item1.content }}</p>
                        <p
                            style="margin-left: 60px; margin-top: 10px;font-size: 12px;color: #9196A1;display: flex;align-items: center;">
                        <p style="margin-right: 10px;">2025年5月20日 发表</p>
                        <div style="display: flex;align-items: center;margin-right: 10px;">
                            <el-icon>
                                <component :is="ChatLineRound"></component>
                            </el-icon>
                        </div>
                        <div style="display: flex;align-items: center;">
                            <el-icon>
                                <component :is="WarnTriangleFilled"></component>
                            </el-icon>
                            <p style="margin-left: 5px;">举报</p>
                        </div>
                        </p>
                        
                    </div>
                </div>
            </template>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ArrowLeftBold, Plus, CaretTop, CaretBottom, ChatLineRound, Position, Star, WarnTriangleFilled, User } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router';
import { onBeforeMount, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import useQuestionStore from '../../store/modules/question'
import { formatTimestamp } from '../../utils/general'
import '@wangeditor/editor/dist/css/style.css' // 引入 css
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
const isComment = ref(false)
const data = ref({
    "id": 0,
    "title": "",
    "content": "",
    "createdTime": "",
    "updatedTime": "",
    "viewCount": 0,
    "categoryId": 0,
    "author": {
        "id": 0,
        "username": "",
        "nickname": ""
    },
    "answers": []
});
const text = ref('');
const editorRef = shallowRef()
const valueHtml = ref('')
const toolbarConfig = {}
const active = ref(0);
const editorConfig: any = { placeholder: '请输入内容...', MENU_CONF: {} }
const UserStore = useUserStore();
import { ReqGetQuestionDetail } from '../../api/question';
import useUserStore from '../../store/modules/user';
import { ElMessage } from 'element-plus';
import { ReqSendAnswer, ReqSendComment, ReqUploadAnswerImg } from '../../api/answer';
const $router = useRouter();
const $route = useRoute();
const comment = (id: number) => {
    isComment.value = !isComment.value
    if (isComment.value) {
        active.value = id;
    } else {
        active.value = 0;
    }
}
const back = () => {
    $router.push('/home')
}
const isAnswer = ref(false);
const answerQuestion = () => {
    isAnswer.value = !isAnswer.value;
}
const getQuestionDetail = async (id: number) => {
    let result = await ReqGetQuestionDetail(id);
    if (result.status == 200) {
        data.value = result.data
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
    let data1 = {
        answerTime: new Date().toISOString(),
        questionId: data.value.id,
        userId: UserStore.userInfo.id,
        content: valueHtml.value
    }
    let result = await ReqSendAnswer(data1);
    if (result.status == 200) {
        getQuestionDetail($route.query.id)
        valueHtml.value = '';
        ElMessage.success('发布回答成功');
        isAnswer.value = false;
    } else {
        valueHtml.value = '';
        ElMessage.error('发布回答失败');
        isAnswer.value = false;
    }
}

const sendComment = async (id:number,answerId = null)=>{
    let data = {
        userId:UserStore.userInfo.id,
        content:text.value,
        parentCommentId:answerId
    }
    let result = await ReqSendComment(id,data);
    if(result.status == 200){
        getQuestionDetail($route.query.id)
        active.value = 0
        ElMessage.success('发表评论成功');
    }else{
        ElMessage.error('发表评论失败');
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
onBeforeMount(() => {
    getQuestionDetail($route.query.id)
})
</script>

<style scoped lang="scss">
.question {
    margin-top: 20px;

    .author {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .left {
            display: flex;
            align-items: center;

            img {
                width: 40px;
                margin-right: 10px;
            }
        }

        margin-bottom: 10px;
    }

    .title {
        font-size: 18px;
        font-weight: bold;
    }

    .detail {
        margin-top: 5px;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .bottom {
        margin-top: 20px;

        .btn {
            button:nth-child(1) {
                background-color: #1772F6;
                color: #fff;
            }

            button:nth-child(1):hover {
                background-color: #0063E4;
            }

            button:nth-child(2) {
                color: #1772F6;
                border: 1px solid #1772F6;
            }
        }
    }
}

.answer {
    margin-top: 10px;
}

.comment {
    margin-top: 10px;

    h4 {
        margin-bottom: 20px;
    }

    .item {
        .userInfo {
            display: flex;
            align-items: center;
            justify-content: space-between;

            .user {
                display: flex;
                align-items: center;

                img {
                    width: 40px;
                    height: 40px;
                }

                .username {
                    margin-left: 10px;

                    .name {
                        font-size: 14px;
                    }

                    .like {
                        color: #535861;
                        font-size: 12px;
                    }
                }
            }

            .followBtn {
                color: #1772F6;
                background-color: #E7F1FE;
                border: none;
            }

            .followBtn:hover {
                background-color: #DCEAFE;
            }
        }

        .up {
            color: #8491A5;
            font-size: 14px;
            margin: 20px 0;
            display: flex;
            align-items: center;
            cursor: pointer;

        }

        .content {
            font-size: 15px;

            p {
                margin: 10px 0;
            }
        }

        .sendTime {
            font-size: 14px;
            color: #8491A5;
            // margin: 10px 0;
            margin-top: 20px;
        }

        .bottom {
            display: flex;
            align-items: center;

            button {
                background-color: rgb(231, 241, 254);
                color: rgb(23, 114, 246);
                border: none;
            }

            button:hover {
                background-color: rgb(220, 234, 254);
            }

            .menu {
                display: flex;
                align-items: center;
                color: #758195;
                font-size: 14px;

                div {
                    cursor: pointer;
                    margin-left: 20px;
                    display: flex;
                    align-items: center;

                    p {
                        margin-left: 5px;
                    }
                }
            }


        }

        .comment-child {
            padding: 20px 0;
            margin-left: 50px;

            .useri {
                display: flex;
                align-items: center;

                p {
                    margin-left: 10px;
                }

            }
        }
    }

}
</style>