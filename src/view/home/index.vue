<template>
    <div class="home">
        <div class="left">
            <div class="header">
                <img src="../../assets/image/top.jpeg" alt="">
            </div>
            <el-card class="question-box">
                <div class="infinite-container">
                    <ul v-infinite-scroll="load" class="list" :infinite-scroll-disabled="disabled">
                        <li class="item" v-for="(item, index) in questionList" :key="item.id">
                            <div class="question">
                                <div class="title" @click="goQuestionDetail(item.id)">{{ item.title }}?</div>
                                <div class="detail">
                                    {{ item.content }}
                                </div>
                            </div>
                            <div class="bottom">
                                <el-button :icon="CaretTop" class="up" :class="[{ active: isLiked(item.id) }]" @click="toggleLike(item.id)">赞同</el-button>
                                <el-button :icon="CaretBottom" class="down" :class="[{ active: isDisliked(item.id) }]"
                                    @click="toggleDislike(item.id)"></el-button>
                                <div class="menu">
                                    <div class="collect" @click="collect" :class="[{ activeC: isCollect }]">
                                        <el-icon>
                                            <component :is="Star"></component>
                                        </el-icon>
                                        <p>收藏</p>
                                    </div>
                                    <div class="answer">
                                        <el-icon>
                                            <component :is="ChatDotSquare"></component>
                                        </el-icon>
                                        <p>回答数 {{ item.answerCount }}</p>
                                    </div>
                                    <div class="report" @click="report">
                                        <el-icon>
                                            <component :is="Pointer"></component>
                                        </el-icon>
                                        <p>举报</p>
                                    </div>
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
    <el-dialog v-model="isReport" title="举报问题" width="600">
        <div class="quest" style="text-align: center;margin-bottom: 20px;">
            <h2>有没有先婚后爱的甜宠文？</h2>
        </div>
        <div class="report" style="margin-top: 10px;">
            <el-form>
                <el-form-item label="举报类型">
                    <el-select v-model="reportType">
                        <el-option value="垃圾内容">垃圾内容</el-option>
                        <el-option value="冒犯性内容">冒犯性内容</el-option>
                        <el-option value="不适当内容">不适当内容</el-option>
                        <el-option value="其他">其他</el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="举报原因">
                    <el-input v-model="textarea" :rows="4" type="textarea" placeholder="请输入举报原因" maxlength="200"
                        show-word-limit />
                </el-form-item>
            </el-form>
        </div>
        <div class="btn" style="display: flex;margin-bottom: 10px;">
            <el-button style="flex:1" @click="cancelReport">取消</el-button>
            <el-button type="primary" style="flex:1" @click="confirmReport">确定</el-button>
        </div>
    </el-dialog>
</template>

<script setup>
import { CaretTop, CaretBottom, ChatLineRound, Pointer, Star, ChatDotSquare } from '@element-plus/icons-vue'
import SvgIcon from '../../components/SvgIcon/index.vue'
import SideBar from '../../layout/SideBar/index.vue'
import { useRouter } from 'vue-router'
import { onMounted, ref, computed,reactive } from 'vue'
import { ReqDislikeQuestion, ReqGetQuestionAll, ReqLikeQuestion } from '../../api/question'
import { tr } from 'element-plus/es/locales.mjs'
import { ElMessage } from 'element-plus'
const isReport = ref(false)
const $router = useRouter();
const reportType = ref('')
const isUp = ref(false)
const isDown = ref(false)
const isCollect = ref(false)
const questionList = ref([]);
const page = ref(1)
const loading = ref(false)
const noMore = ref(false)
const disabled = computed(() => loading.value || noMore.value)
const likeStatus = reactive(new Map());
const toggleLike = (questionId) => {
  const current = likeStatus.get(questionId) || 0;
  
  if (current === 1) {
    // 取消点赞
    likeStatus.set(questionId, 0);
    likeQuestion(questionId)
    // 调用API取消点赞
  } else {
    // 点赞
    likeStatus.set(questionId, 1);
    likeQuestion(questionId)
    // 如果之前已踩，取消踩
    if (current === -1) {
      likeStatus.set(questionId, 1);
      // 调用API取消踩
      dislikeQuestion(questionId)
    }
    // 调用API点赞
    likeQuestion(questionId)
  }
};
const toggleDislike = (questionId) => {
  const current = likeStatus.get(questionId) || 0;
  if (current === -1) {
    // 取消踩
    likeStatus.set(questionId, 0);
    dislikeQuestion(questionId)
    // 调用API取消踩
  } else {
    // 踩
    likeStatus.set(questionId, -1);
    // 如果之前已赞，取消赞
    if (current === 1) {
      likeStatus.set(questionId, -1);
      likeQuestion(questionId)
      // 调用API取消赞
    }
    dislikeQuestion(questionId)
    // 调用API踩
  }
};
// 计算属性：检查是否已点赞
const isLiked = (questionId) => {
  return likeStatus.get(questionId) === 1;
};

// 计算属性：检查是否已踩
const isDisliked = (questionId) => {
  return likeStatus.get(questionId) === -1;
};
const up = (id) => {
    isDown.value = false;
    isUp.value = !isUp.value;
}
const collect = () => {
    isCollect.value = !isCollect.value;
}
const down = () => {
    isDown.value = !isDown.value;
    isUp.value = false;
}
const goQuestionDetail = (id) => {
    $router.push({
        path: '/questionDetail',
        query: {
            id
        }
    })
}
const likeQuestion = async (id)=>{
    let result = await ReqLikeQuestion(id);
    if(result.status == 200){
        ElMessage.success(result.message)
    }else{
        ElMessage.error('点赞失败');
    }
}
const dislikeQuestion = async (id)=>{
    let result = await ReqDislikeQuestion(id);
    if(result.status == 200){
        ElMessage.success(result.message)
    }else{
        ElMessage.error('点踩失败');
    }
}
const report = () => {
    isReport.value = true;
}
const cancelReport = () => {
    isReport.value = false;
}
const confirmReport = () => {
    isReport.value = false;
}
const getQuestionAll = async () => {
    let result = await ReqGetQuestionAll(1, 10);
    console.log(result)
    questionList.value = result.data;
    return 'ok'
}
const getQuestion = async () => {
    page.value++;
    console.log(page.value)
    let result = await ReqGetQuestionAll(page.value, 10);
    console.log(result)
    if (result.status === 200) {
        if (result.data.data.length != 0) {
            result.data.data.forEach(item => questionList.value.push(item))
        }else{
            noMore.value = true;
        }
    }
}
const debounce = (fn, t) => {
    let timer = null;
    return function () {
        if (timer) clearTimeout(timer);
        timer = setTimeout(function () {
            fn();
        }, t)
    }
}
const load = () => {
    loading.value = true
    setTimeout(() => {
        getQuestion();
        loading.value = false
    }, 2000)
}
onMounted(() => {
    getQuestionAll();
})
</script>

<style lang="scss" scoped>
.home {
    width: 100%;
    height: 100%;
    display: flex;

    .left {
        width: 100%;
        margin-right: 20px;

        .header {
            margin-bottom: 10px;

            img {
                width: 100%;
                height: 100px;
            }
        }

        .question-box {
            .infinite-container {
                max-height: calc(100vh - 160px);
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
                margin-bottom: 20px;

                .title {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }

                .question {
                    margin-bottom: 20px;

                    .title {
                        font-size: 20px;
                        cursor: pointer;
                    }

                    .title:hover {
                        color: rgb(9, 64, 142);
                    }

                    .detail {
                        width: 100%;
                        height: 50px;
                        display: -webkit-box;
                        overflow: hidden;
                        -webkit-box-orient: vertical;
                        -webkit-line-clamp: 2;
                        text-overflow: ellipsis;
                    }

                }

                .bottom {
                    display: flex;
                    align-items: center;

                    button {
                        background-color: rgb(231, 241, 254);
                        color: rgb(23, 114, 246);
                        border: none;
                    }

                    .active {
                        background-color: #1772F6;
                        color: #fff;
                    }

                    .active:hover {
                        background-color: #1772F6;
                        color: #fff;
                    }

                    button:hover {
                        background-color: rgb(220, 234, 254);
                    }

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

                            p {
                                margin-left: 5px;
                            }
                        }
                    }
                }
            }
        }

    }

    .right {
        width: 600px;
    }
}
</style>