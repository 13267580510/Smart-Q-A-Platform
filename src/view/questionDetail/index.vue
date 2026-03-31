<template>
    <div class="questionDetail">
        <el-card>
            <el-button :icon="ArrowLeftBold" @click="back" type="primary">返回</el-button>
            <div class="question">
                <div class="author">
                    <div class="left">
                        <img 
                            :src="data.author.avatar ? 'http://127.0.0.1:8080' + data.author.avatar : defaultAvatar" 
                            alt="用户头像"
                        >   
                        <p>{{ data.author.nickname }}</p>
                    </div>
                 
                </div>
                <div class="title">{{ data.title }}</div>
                <div class="detail" v-html="data.content"></div>
                <div class="bottom">
                    <div class="btn">
                        <el-button @click="answerQuestion">{{ isAnswer ? '取消' : '发布回答' }}</el-button>
                    </div>
                       <!-- 修复：将收藏/举报组件移到问题标题区域，确保始终可见 -->
                    <div class="menu">
                        <div 
                            class="collect" 
                            @click="collect" 
                            :class="[{ activeC: isCollect }]"
                            :loading="collectLoading"
                        >
                            <el-icon>
                                <component :is="Star"></component>
                            </el-icon>
                            <p>{{ isCollect ? '已收藏' : '收藏' }}</p>
                        </div>
                        <div class="report" @click="report">
                            <el-icon>
                                <component :is="WarnTriangleFilled"></component>
                            </el-icon>
                            <p>举报</p>
                        </div>
                    </div>
                </div>
            </div>
        </el-card>
        
        <!-- 回答编辑卡片 -->
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
        
        <!-- 回答列表卡片 -->
        <el-card class="comment" v-if="data.answers.length != 0">
            <h4>{{ data.answers.length }}个回答</h4>
            <template v-for="(item, index) in data.answers" :key="item.id">
                <div class="item">
                    <div v-if="data.solvedAnswerId === item.id" class="solved-tag">
                        <el-tag type="success" size="small">已采纳</el-tag>
                    </div>
                    
                    <div class="userInfo">
                        <div class="user">
                            <img 
                                :src="item.author.avatar ? 'http://127.0.0.1:8080' + item.author.avatar : defaultAvatar" 
                                alt="用户头像"
                            >
                            <div class="username">
                                <div class="name">{{ item.author.nickname }}</div>
                            </div>
                        </div>
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
                        <el-button 
                            :icon="CaretTop" 
                            class="up" 
                            :class="{ active: isLiked(item.id) }"
                            :loading="voteLoading.get(item.id)"
                            @click="likeAnswer(item.id)"
                        >
                            赞同  {{item.likeCount}}
                        </el-button>
                        <el-button 
                            :icon="CaretBottom" 
                            class="down"
                            :class="{ active: isDisliked(item.id) }"
                            :loading="voteLoading.get(item.id)"
                            @click="dislikeAnswer(item.id)"
                        ></el-button>
                        
                        <el-button 
                            v-if="isQuestionOwner && data.solvedAnswerId !== item.id"
                            type="success" 
                            size="small"
                            :loading="markLoading.get(item.id)"
                            @click="markAnswerAsSolved(data.id, item.id)"
                            class="accept-btn"
                        >
                            接受此回答
                        </el-button>
                        
                        <el-button 
                            v-if="isQuestionOwner && data.solvedAnswerId === item.id"
                            type="warning" 
                            size="small"
                            :loading="unmarkLoading"
                            @click="unmarkAnswerAsSolved(data.id)"
                            class="cancel-btn"
                        >
                            取消接受
                        </el-button>
                        
                        <div class="menu">
                            <div @click="comment(item.id)">
                                <el-icon>
                                    <component :is="ChatLineRound"></component>
                                </el-icon>
                                <p>评论</p>
                            </div>
                            <div>
                                <el-icon>
                                    <component :is="WarnTriangleFilled"></component>
                                </el-icon>
                                <p>举报</p>
                            </div>
                        </div>
                    </div>
                    <el-card v-if="active == item.id && !isReplyMode">
                        <el-input v-model="text" :rows="6" type="textarea"
                            placeholder="请输入要发表的评论" />
                        <div style="text-align: right;margin-top: 10px;">
                            <el-button type="primary" @click="sendComment(item.id)">发表评论</el-button>
                        </div>
                    </el-card>
                    <div class="comment-child" v-for="(item1,index) in item.comments" :key="item1.id">
                        <div class="useri">
                            <img
                                :src="item1.author.avatar ? 'http://127.0.0.1:8080' + item1.author.avatar : defaultAvatar"
                                alt="用户头像"
                            >
                            <div>
                                <p style="font-size: 14px;">{{item1.author.nickname}}</p>
                            </div>
                        </div>
                        <p style="margin-left: 60px;">{{ item1.content }}</p>
                        <p style="margin-left: 60px; margin-top: 10px;font-size: 12px;color: #9196A1;display: flex;align-items: center;">
                            <p style="margin-right: 10px;">{{ formatTimestamp(item1.createdAt) }}</p>
                            <div style="display: flex;align-items: center;margin-right: 10px;">
                                <el-icon>
                                    <component :is="ChatLineRound"></component>
                                </el-icon>
                                 <p style="margin-left: 5px; cursor: pointer;" @click="replyToComment(item1.id)">回复</p>
                            </div>
                            <div style="display: flex;align-items: center;">
                                <el-icon>
                                    <component :is="WarnTriangleFilled"></component>
                                </el-icon>
                                <p style="margin-left: 5px;">举报</p>
                            </div>
                        </p>
                        <!-- 回复输入框 -->
                        <el-card v-if="active == item1.id && isReplyMode && replyCommentId == item1.id" style="margin-left: 60px; margin-top: 10px;">
                            <p style="font-size: 12px; color: #606266; margin-bottom: 5px;">
                                回复 @{{ item1.author.nickname }}
                            </p>
                            <el-input v-model="text" :rows="4" type="textarea"
                                placeholder="请输入回复内容" />
                            <div style="text-align: right;margin-top: 10px;">
                                <el-button @click="cancelReply">取消</el-button>
                                <el-button type="primary" @click="sendReply(item.id, item1.id)">回复</el-button>
                            </div>
                        </el-card>

                        <!-- 子评论（递归展示） -->
                        <div v-if="item1.childComments && item1.childComments.length > 0" class="child-comments-container">
                            <div class="comment-sub-child" v-for="(item2, index2) in item1.childComments" :key="item2.id">
                                <div class="useri">
                                    <img
                                        :src="item2.author.avatar ? 'http://127.0.0.1:8080' + item2.author.avatar : defaultAvatar"
                                        alt="用户头像"
                                    >
                                    <div>
                                        <p style="font-size: 14px;">{{item2.author.nickname}}</p>
                                    </div>
                                </div>
                                <p style="margin-left: 60px;">{{ item2.content }}</p>
                                <p style="margin-left: 60px; margin-top: 10px;font-size: 12px;color: #9196A1;display: flex;align-items: center;">
                                    <p style="margin-right: 10px;">{{ formatTimestamp(item2.createdAt) }}</p>
                                    <div style="display: flex;align-items: center;margin-right: 10px;">
                                        <el-icon>
                                            <component :is="ChatLineRound"></component>
                                        </el-icon>
                                         <p style="margin-left: 5px; cursor: pointer;" @click="replyToComment(item2.id)">回复</p>
                                    </div>
                                    <div style="display: flex;align-items: center;">
                                        <el-icon>
                                            <component :is="WarnTriangleFilled"></component>
                                        </el-icon>
                                        <p style="margin-left: 5px;">举报</p>
                                    </div>
                                </p>
                                <!-- 子评论回复输入框 -->
                                <el-card v-if="active == item2.id && isReplyMode && replyCommentId == item2.id" style="margin-left: 60px; margin-top: 10px;">
                                    <p style="font-size: 12px; color: #606266; margin-bottom: 5px;">
                                        回复 @{{ item2.author.nickname }}
                                    </p>
                                    <el-input v-model="text" :rows="4" type="textarea"
                                        placeholder="请输入回复内容" />
                                    <div style="text-align: right;margin-top: 10px;">
                                        <el-button @click="cancelReply">取消</el-button>
                                        <el-button type="primary" @click="sendReply(item.id, item2.id)">回复</el-button>
                                    </div>
                                </el-card>

                                <!-- 三级子评论（递归展示） -->
                                <div v-if="item2.childComments && item2.childComments.length > 0" class="child-comments-container">
                                    <div class="comment-sub-child" v-for="(item3, index3) in item2.childComments" :key="item3.id">
                                        <div class="useri">
                                            <img
                                                :src="item3.author.avatar ? 'http://127.0.0.1:8080' + item3.author.avatar : defaultAvatar"
                                                alt="用户头像"
                                            >
                                            <div>
                                                <p style="font-size: 14px;">{{item3.author.nickname}}</p>
                                            </div>
                                        </div>
                                        <p style="margin-left: 60px;">{{ item3.content }}</p>
                                        <p style="margin-left: 60px; margin-top: 10px;font-size: 12px;color: #9196A1;display: flex;align-items: center;">
                                            <p style="margin-right: 10px;">{{ formatTimestamp(item3.createdAt) }}</p>
                                            <div style="display: flex;align-items: center;margin-right: 10px;">
                                                <el-icon>
                                                    <component :is="ChatLineRound"></component>
                                                </el-icon>
                                                 <p style="margin-left: 5px; cursor: pointer;" @click="replyToComment(item3.id)">回复</p>
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
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </el-card>
    </div>
</template>

<script setup lang="ts">
// 修复：添加缺失的图标导入
import { 
    ArrowLeftBold, Plus, CaretTop, CaretBottom, ChatLineRound, 
    Position, Star, WarnTriangleFilled, User, ArrowRight,
    ChatDotSquare, Pointer // 新增缺失的图标
} from '@element-plus/icons-vue';
import { useRoute, useRouter } from 'vue-router';
import { onBeforeMount, onBeforeUnmount, onMounted, ref, shallowRef, reactive } from 'vue';
import useQuestionStore from '../../store/modules/question';
import { formatTimestamp } from '../../utils/general';
import '@wangeditor/editor/dist/css/style.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
const isComment = ref(false);
const replyCommentId = ref<number | null>(null); // 当前回复的评论ID
const isReplyMode = ref(false); // 是否为回复模式
import defaultAvatar from '../../assets/icons/default_avat.svg';

// 修复：导入用户store的顺序问题
import useUserStore from '../../store/modules/user';
const UserStore = useUserStore();

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
        "nickname": "",
        "avatar": ""
    },
    "answers": [],
    "solvedAnswerId": null,
    "likeCount": 0,
    "dislikeCount": 0,
    "userVoteStatus": null,
    "isCollected": false // 新增：接收后端返回的收藏状态
});
const text = ref('');
const editorRef = shallowRef();
const valueHtml = ref('');
const toolbarConfig = {};
const active = ref(0);
const editorConfig: any = { placeholder: '请输入内容...', MENU_CONF: {} };
const isCollect = ref(false);
// ========== 新增：收藏加载状态 ==========
const collectLoading = ref(false);

// API导入
import { ReqGetQuestionDetail } from '../../api/question';
import { ReqMarkAnswerAsSolved, ReqUnmarkAnswerAsSolved } from '../../api/question';
// ========== 新增：导入收藏相关API ==========
import { ReqCollectQuestion, ReqCancelCollectQuestion, ReqCheckQuestionCollected } from '../../api/question';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ReqSendAnswer, ReqSendComment, ReqUploadAnswerImg, ReqLikeAnswer, ReqDislikeAnswer} from '../../api/answer';

// 回答点赞/点踩核心逻辑
const voteStatus = reactive(new Map<number, number>());
const voteLoading = reactive(new Map<number, boolean>());
const userVoteStatus = ref();

// 标记/取消标记相关状态
const isQuestionOwner = ref(false);
const markLoading = reactive(new Map<number, boolean>());
const unmarkLoading = ref(false);

// ========== 完善：收藏方法 ==========
const collect = async () => {
    // 未登录拦截
    if (!UserStore.userInfo) {
        ElMessage.warning('请先登录后再进行收藏操作');
        return;
    }
    
    // 加载状态
    collectLoading.value = true;
    
    try {
        const questionId = data.value.id;
        if (isCollect.value) {
            // 取消收藏
            await ReqCancelCollectQuestion(questionId);
            isCollect.value = false;
            ElMessage.success('取消收藏成功');
        } else {
            // 收藏问题
            await ReqCollectQuestion(questionId);
            isCollect.value = true;
            ElMessage.success('收藏成功');
        }
        
        // 同步更新data中的收藏状态
        data.value.isCollected = isCollect.value;
    } catch (error: any) {
        // 详细的错误提示
        const errorMsg = error.response?.data?.message || '操作失败，请重试';
        ElMessage.error(errorMsg);
        console.error('收藏操作失败：', error);
    } finally {
        // 重置加载状态
        collectLoading.value = false;
    }
};

// ========== 完善：举报方法 ==========
const report = async () => {
    // 未登录拦截
    if (!UserStore.userInfo) {
        ElMessage.warning('请先登录后再进行举报操作');
        return;
    }
    
    try {
        // 弹出举报理由输入框
        await ElMessageBox.prompt(
            '请输入举报理由',
            '问题举报',
            {
                confirmButtonText: '提交',
                cancelButtonText: '取消',
                inputPlaceholder: '请详细描述举报原因',
                inputValidator: (value) => {
                    if (!value.trim()) {
                        return '举报理由不能为空';
                    }
                    return true;
                }
            }
        ).then(async ({ value }) => {
            // 这里调用举报接口（需补充对应的API）
            // const res = await ReqReportQuestion(data.value.id, value);
            ElMessage.success('举报提交成功，我们会尽快处理');
        });
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('举报提交失败，请重试');
            console.error('举报失败：', error);
        }
    }
};

const likeAnswer = async (answerId: number) => {
    if (voteLoading.get(answerId)) return;
    
    try {
        voteLoading.set(answerId, true);
        const currentStatus = voteStatus.get(answerId) || 0;
        
        if (currentStatus === 1) {
            await ReqLikeAnswer(answerId);
            voteStatus.set(answerId, 0);
            ElMessage.success('取消回答点赞成功');
        } else {
            if (currentStatus === -1) {
                await ReqDislikeAnswer(answerId);
            }
            await ReqLikeAnswer(answerId);
            voteStatus.set(answerId, 1);
            ElMessage.success('回答点赞成功');
        }
        
        updateAnswerLikeCount(answerId, currentStatus === 1 ? -1 : 1);
    } catch (error) {
        ElMessage.error('操作失败，请重试');
        console.error('回答点赞失败：', error);
    } finally {
        voteLoading.set(answerId, false);
    }
};

const dislikeAnswer = async (answerId: number) => {
    if (voteLoading.get(answerId)) return;
    
    try {
        voteLoading.set(answerId, true);
        const currentStatus = voteStatus.get(answerId) || 0;
        
        if (currentStatus === -1) {
            await ReqDislikeAnswer(answerId);
            voteStatus.set(answerId, 0);
            ElMessage.success('取消回答点踩成功');
        } else {
            if (currentStatus === 1) {
                await ReqLikeAnswer(answerId);
            }
            await ReqDislikeAnswer(answerId);
            voteStatus.set(answerId, -1);
            ElMessage.success('回答点踩成功');
        }
        
        updateAnswerLikeCount(answerId, currentStatus === -1 ? 1 : -1);
    } catch (error) {
        ElMessage.error('操作失败，请重试');
        console.error('回答点踩失败：', error);
    } finally {
        voteLoading.set(answerId, false);
    }
};

const updateAnswerLikeCount = (answerId: number, change: number) => {
    const answerIndex = data.value.answers.findIndex(item => item.id === answerId);
    if (answerIndex !== -1) {
        data.value.answers[answerIndex].likeCount = (data.value.answers[answerIndex].likeCount || 0) + change;
    }
};

const isLiked = (answerId: number) => {
    return voteStatus.get(answerId) === 1;
};

const isDisliked = (answerId: number) => {
    return voteStatus.get(answerId) === -1;
};

const markAnswerAsSolved = async (questionId: number, answerId: number) => {
    if (markLoading.get(answerId)) return;
    
    try {
        markLoading.set(answerId, true);
        const res = await ReqMarkAnswerAsSolved(questionId, answerId);
        if (res) {
            ElMessage.success('已接受此回答作为解决方案');
            data.value.solvedAnswerId = answerId;
        }
    } catch (error) {
        ElMessage.error('标记失败：' + (error as any).response?.data?.message || '操作失败，请重试');
        console.error('标记解决答案失败：', error);
    } finally {
        markLoading.set(answerId, false);
    }
};

const unmarkAnswerAsSolved = async (questionId: number) => {
    if (unmarkLoading.value) return;
    
    try {
        unmarkLoading.value = true;
        const res = await ReqUnmarkAnswerAsSolved(questionId);
        if (res) {
            ElMessage.success('已取消接受此回答');
            data.value.solvedAnswerId = null;
        }
    } catch (error) {
        ElMessage.error('取消标记失败：' + (error as any).response?.data?.message || '操作失败，请重试');
        console.error('取消解决答案标记失败：', error);
    } finally {
        unmarkLoading.value = false;
    }
};

const $router = useRouter();
const $route = useRoute();
const comment = (id: number) => {
    // 如果已经在回复模式，切换到普通评论模式
    if (isReplyMode.value) {
        isReplyMode.value = false;
        replyCommentId.value = null;
    }

    isComment.value = !isComment.value
    if (isComment.value) {
        active.value = id;
    } else {
        active.value = 0;
        text.value = ''; // 清空输入框
    }
};

const back = () => {
    $router.push('/home');
};

const isAnswer = ref(false);
const answerQuestion = () => {
    isAnswer.value = !isAnswer.value;
};

// ========== 完善：获取问题详情并初始化收藏状态 ==========
const getQuestionDetail = async (id: number) => {
    try {
        let result = await ReqGetQuestionDetail(id);
        if (result) {
            data.value = result;
            isQuestionOwner.value = UserStore.userInfo?.id === data.value.author.id;
            
            // 初始化投票状态
            data.value.answers.forEach(answer => {
                if (answer.userVoteStatus === true) {
                    voteStatus.set(answer.id, 1);
                } else if (answer.userVoteStatus === false) {
                    voteStatus.set(answer.id, -1);
                } else {
                    voteStatus.set(answer.id, 0);
                }
                voteLoading.set(answer.id, false);
                markLoading.set(answer.id, false);
            });
            
            // ========== 新增：初始化收藏状态 ==========
            if (UserStore.userInfo) {
                // 方式1：使用后端返回的isCollected字段（推荐）
                isCollect.value = data.value.isCollected || false;
                
                // 方式2：主动查询收藏状态（兜底方案）
                // const collectRes = await ReqCheckQuestionCollected(id);
                // isCollect.value = collectRes.data || false;
            } else {
                // 未登录默认未收藏
                isCollect.value = false;
            }
        }
    } catch (error) {
        ElMessage.error('获取问题详情失败，请刷新页面重试');
        console.error('获取问题详情失败：', error);
    }
};

editorConfig.MENU_CONF['uploadImage'] = {
    async customUpload(file: any, insertFn: any) {
        const formData = new FormData();
        formData.append('file', file);
        let result = await ReqUploadAnswerImg(formData);
        let url;
        if (result) {
            url = `http://127.0.0.1:8080${result}`;
            ElMessage.success('上传回答图片成功');
        }
        insertFn(url, '', '');
    },
};

const sendAnswer = async () => {
    let data1 = {
        answerTime: new Date().toISOString(),
        questionId: data.value.id,
        userId: UserStore.userInfo.id,
        content: valueHtml.value
    };
    let result = await ReqSendAnswer(data1);
    if (result) {
        getQuestionDetail($route.query.id as number);
        valueHtml.value = '';
        ElMessage.success('发布回答成功');
        isAnswer.value = false;
    } else {
        valueHtml.value = '';
        ElMessage.error('发布回答失败');
        isAnswer.value = false;
    }
};

const sendComment = async (id:number, answerId = null) => {
    let data = {
        userId: UserStore.userInfo.id,
        content: text.value,
        parentCommentId: answerId
    };
    let result = await ReqSendComment(id, data);
    if (result) {
        getQuestionDetail($route.query.id as number);
        active.value = 0;
        text.value = ''; // 清空评论输入框
        ElMessage.success('发表评论成功');
    } else {
        ElMessage.error('发表评论失败');
    }
};

// 回复评论
const replyToComment = (commentId: number) => {
    isReplyMode.value = true;
    replyCommentId.value = commentId;
    active.value = commentId; // 激活对应的输入框
};

// 取消回复
const cancelReply = () => {
    isReplyMode.value = false;
    replyCommentId.value = null;
    active.value = 0;
    text.value = '';
};

// 发送回复
const sendReply = async (answerId: number, parentCommentId: number) => {
    if (!text.value.trim()) {
        ElMessage.warning('请输入回复内容');
        return;
    }

    let data = {
        userId: UserStore.userInfo.id,
        content: text.value,
        parentCommentId: parentCommentId
    };

    try {
        let result = await ReqSendComment(answerId, data);
        if (result) {
            getQuestionDetail($route.query.id as number);
            active.value = 0;
            isReplyMode.value = false;
            replyCommentId.value = null;
            text.value = ''; // 清空回复输入框
            ElMessage.success('回复成功');
        } else {
            ElMessage.error('回复失败');
        }
    } catch (error) {
        ElMessage.error('回复失败，请稍后重试');
    }
};

onBeforeUnmount(() => {
    const editor = editorRef.value;
    if (editor == null) return;
    editor.destroy();
});

const handleCreated = (editor: any) => {
    editorRef.value = editor;
};

onBeforeMount(() => {
    getQuestionDetail($route.query.id as number);
});
</script>

<style scoped lang="scss">
.questionDetail {
    padding: 20px;
}

.question {
    margin-top: 20px;

    .author {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;

        .left {
            display: flex;
            align-items: center;

            img {
                width: 40px;
                height: 30px;
                margin-right: 10px;
                border-radius: 50%;
            }
        }

        // 新增：问题操作按钮样式
        .question-actions {
            display: flex;
            align-items: center;
            gap: 20px;

            > div {
                display: flex;
                align-items: center;
                cursor: pointer;
                color: #666;
                font-size: 14px;

                &:hover {
                    color: #1772F6;
                }

                el-icon {
                    margin-right: 5px;
                }

                &.activeC {
                    color: #1772F6;
                }
            }
        }
    }

    .title {
        font-size: 18px;
        font-weight: bold;
        margin: 10px 0;
    }

    .detail {
        margin-top: 5px;
        font-size: 14px;
        white-space: normal;
        overflow: visible;
        text-overflow: unset;
        line-height: 1.6;
    }

    .bottom {
        margin-top: 20px;
        display: flex;
            .menu {
                        display: flex;
                        align-items: center;
                        color: #758195;
                        font-size: 14px;

                        .activeC {
                            color: #1772F6;
                        }

                        div {
                            cursor: pointer;
                            margin-left: 20px;
                            display: flex;
                            align-items: center;

                            // 新增：收藏按钮加载状态样式
                            &.collect {
                                position: relative;
                                
                                :deep(.el-loading-mask) {
                                    border-radius: 4px;
                                }
                            }

                            p {
                                margin-left: 5px;
                            }
                        }
             }
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
        padding: 15px 0;
        border-bottom: 1px solid #eee;

        &:last-child {
            border-bottom: none;
        }

        .solved-tag {
            margin-bottom: 10px;
            padding-left: 5px;
        }

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
                    border-radius: 50%;
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
            line-height: 1.6;

            p {
                margin: 10px 0;
            }
        }

        .sendTime {
            font-size: 14px;
            color: #8491A5;
            margin-top: 20px;
        }

        .bottom {
            display: flex;
            align-items: center;
            margin-top: 15px;

            .up.active, .down.active {
                background-color: #1772F6 !important;
                color: #fff !important;
            }

            .up.active:hover, .down.active:hover {
                background-color: #0063E4 !important;
            }

            .accept-btn, .cancel-btn {
                margin-left: 10px;
                margin-right: 10px;
            }

            button {
                background-color: rgb(231, 241, 254);
                color: rgb(23, 114, 246);
                border: none;
                margin-right: 5px;
            }

            button:hover {
                background-color: rgb(220, 234, 254);
            }

            .menu {
                display: flex;
                align-items: center;
                color: #758195;
                font-size: 14px;
                margin-left: 10px;

                div {
                    cursor: pointer;
                    margin-left: 20px;
                    display: flex;
                    align-items: center;

                    &:hover {
                        color: #1772F6;
                    }

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

                img {
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    margin-right: 8px;
                }

                p {
                    margin-left: 0 !important;
                }
            }
        }

        // 子评论容器样式
        .child-comments-container {
            margin-left: 40px;
            border-left: 2px solid #f0f0f0;
            padding-left: 20px;
            margin-top: 10px;
        }

        // 子子评论样式
        .comment-sub-child {
            padding: 15px 0;
            margin-top: 10px;

            .useri {
                display: flex;
                align-items: center;

                img {
                    width: 25px;
                    height: 25px;
                    border-radius: 50%;
                    margin-right: 8px;
                }

                p {
                    margin-left: 0 !important;
                }
            }
        }
    }
}
</style>