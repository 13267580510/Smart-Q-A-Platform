<template>
    <div class="home">
        <div class="left">
              <div class="header">
                <CarouselBanner banner-height="200px" :autoplay-interval="5000" />
            </div>
            <el-card class="article-box">
                <div class="infinite-container">
                    <ul v-infinite-scroll="load" class="list" :infinite-scroll-disabled="disabled">
                        <li class="item" v-for="(item, index) in articleList" :key="item.id">
                            <div class="article">
                                <div class="title" @click="goArticleDetail(item.id)">{{ item.title }}</div>
                                <div class="summary">
                                    {{ item.summary }}
                                </div>
                            </div>
                            <div class="bottom">
                                <el-button :icon="CaretTop" class="up" :class="[{ active: isLiked(item.id) }]" @click="toggleLike(item.id)">点赞 {{ item.likeCount }}</el-button>
                                <el-button :icon="CaretBottom" class="down" :class="[{ active: isDisliked(item.id) }]"
                                    @click="toggleDislike(item.id)"></el-button>
                                <div class="menu">
                                    <div class="view" @click="goArticleDetail(item.id)">
                                        <el-icon>
                                            <component :is="View"></component>
                                        </el-icon>
                                        <p>浏览量 {{ item.viewCount }}</p>
                                    </div>

                                    <div class="collect" @click="toggleCollect(item.id)" :class="[{ activeC: isCollected(item.id) }]">
                                        <el-icon>
                                            <component :is="Star"></component>
                                        </el-icon>
                                        <p>收藏</p>
                                    </div>
                                    <div class="comment">
                                        <el-icon>
                                            <component :is="ChatDotSquare"></component>
                                        </el-icon>
                                        <p>评论数 {{ item.commentCount || 0 }}</p> <!-- 补充默认值，避免空显示 -->
                                    </div>
                                    <div class="report" @click="report(item.id, item.title)"> <!-- 修复：传递文章标题 -->
                                        <el-icon>
                                            <component :is="WarnTriangleFilled"></component>
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
    <el-dialog v-model="isReport" title="举报文章" width="600">
        <div class="quest" style="text-align: center;margin-bottom: 20px;">
            <h2>{{ currentArticleTitle }}</h2>
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
import { CaretTop, CaretBottom, ChatDotSquare, View, Star, WarnTriangleFilled } from '@element-plus/icons-vue'
import SvgIcon from '../../components/SvgIcon/index.vue'
import SideBar from '../../layout/SideBar/index.vue'
import { useRouter } from 'vue-router'
import { onMounted, ref, computed, reactive } from 'vue'
import { ReqDislikeArticle, ReqGetArticleAll, ReqLikeArticle, ReqCollectArticle, ReqCancelCollectArticle, ReqCheckArticleCollected,ReqReportArticle } from '../../api/article'
import { ElMessage } from 'element-plus'
import CarouselBanner from '../../components/CarouselBanner/CarouselBanner.vue'

// 举报相关
const isReport = ref(false)
const reportType = ref('')
const textarea = ref('')
const currentArticleTitle = ref('')

// 路由
const $router = useRouter();

// 文章列表相关
const articleList = ref([]);
const page = ref(1)
const loading = ref(false)
const noMore = ref(false)
const disabled = computed(() => loading.value || noMore.value)
const currentArticleId = ref(0) // 新增：保存被举报文章的ID，用于调用举报接口

// 点赞/点踩状态管理（1=点赞，-1=点踩，0=无状态）
const voteStatus = reactive(new Map());
// 收藏状态管理
const collectStatus = reactive(new Map());

// ========== 点赞/点踩逻辑（保留原有，无修改） ==========
const toggleLike = (articleId) => {
  const current = voteStatus.get(articleId) || 0;
  if (current === 1) {
    // 取消点赞
    voteStatus.set(articleId, 0);
    likeArticle(articleId);
  } else {
    // 点赞
    voteStatus.set(articleId, 1);
    // 如果之前已踩，先取消踩
    if (current === -1) {
      dislikeArticle(articleId);
    }
    likeArticle(articleId);
  }
};

const toggleDislike = (articleId) => {
  const current = voteStatus.get(articleId) || 0;
  if (current === -1) {
    // 取消点踩
    voteStatus.set(articleId, 0);
    dislikeArticle(articleId);
  } else {
    // 点踩
    voteStatus.set(articleId, -1);
    // 如果之前已赞，取消赞
    if (current === 1) {
      voteStatus.set(articleId, -1);
      likeArticle(articleId);
    }
    dislikeArticle(articleId);
  }
};

// 计算属性：检查是否已点赞
const isLiked = (articleId) => {
  return voteStatus.get(articleId) === 1;
};

// 计算属性：检查是否已点踩
const isDisliked = (articleId) => {
  return voteStatus.get(articleId) === -1;
};

// ========== 收藏逻辑（保留原有，无修改） ==========
const toggleCollect = async (articleId) => {
  const current = collectStatus.get(articleId) || false;
  if (current) {
    // 取消收藏
    const result = await ReqCancelCollectArticle(articleId);
    if (result) {
      ElMessage.success("取消收藏成功");
      collectStatus.set(articleId, false);
    } else {
      ElMessage.error("取消收藏失败");
    }
  } else {
    // 收藏文章
    const result = await ReqCollectArticle(articleId);
    if (result) {
      ElMessage.success("收藏成功");
      collectStatus.set(articleId, true);
    } else {
      ElMessage.error("收藏失败");
    }
  }
};

// 检查是否已收藏
const isCollected = (articleId) => {
  return collectStatus.get(articleId) || false;
};

// ========== 页面跳转（保留原有，无修改） ==========
const goArticleDetail = (id) => {
  $router.push({
    path: '/articleDetail',
    query: {
      id
    }
  })
}

// ========== 接口请求（保留原有，仅优化更新点赞数逻辑） ==========
// 点赞文章
const likeArticle = async (id) => {
  try {
    let result = await ReqLikeArticle(id);
    if (result) {
      // 更新列表中的点赞数
      updateArticleLikeCount(id, voteStatus.get(id) === 1 ? 1 : -1); // 优化：根据当前状态更新加减
      ElMessage.success(voteStatus.get(id) === 1 ? "点赞成功" : "取消点赞成功");
    }
  } catch (error) {
    ElMessage.error('点赞操作失败');
  }
}

// 点踩文章
const dislikeArticle = async (id) => {
  try {
    let result = await ReqDislikeArticle(id);
    if (result) {
      ElMessage.success(voteStatus.get(id) === -1 ? "点踩成功" : "取消点踩成功");
    }
  } catch (error) {
    ElMessage.error('点踩操作失败');
  }
}

// 更新文章点赞数（本地列表）
const updateArticleLikeCount = (id, type) => {
  const article = articleList.value.find(item => item.id === id);
  if (article) {
    if (type === 1) {
      article.likeCount = (article.likeCount || 0) + 1;
    } else {
      article.likeCount = Math.max(0, (article.likeCount || 0) - 1);
    }
  }
}

// ========== 核心修改：优化状态初始化方法（同时初始化收藏+点赞状态） ==========
/**
 * 从后端返回数据初始化文章的收藏和点赞状态
 * @param {Object} article 后端返回的文章对象（包含 collected、liked 字段）
 */
const initArticleStatus = (article) => {
  if (!article || !article.id) return;
  
  // 初始化收藏状态（优先取后端返回的 collected 字段）
  const isCollected = article.collected === true;
  collectStatus.set(article.id, isCollected);
  
  // 初始化点赞状态（优先取后端返回的 liked 字段，liked=true → 1，否则 0）
  const isLiked = article.liked === true;
  voteStatus.set(article.id, isLiked ? 1 : 0);
  
  // 可选：如果需要支持点踩状态的后端返回，可后续补充 article.disliked 字段
}

// ========== 举报相关（修复：传递文章标题） ==========
/**
 * 打开举报弹窗
 * @param {number} articleId 被举报文章的ID（必传，用于后续接口调用）
 * @param {string} articleTitle 被举报文章的标题（用于弹窗展示）
 */
const report = (articleId, articleTitle) => {
  // 1. 参数校验：文章ID合法性判断
  if (!articleId || typeof articleId !== 'number' || articleId <= 0) {
    ElMessage.warning('文章信息异常，无法发起举报');
    return;
  }

  // 2. 保存被举报文章的ID和标题（ID用于接口请求，标题用于弹窗展示）
  currentArticleId.value = articleId;
  currentArticleTitle.value = articleTitle || "未知文章";

  // 3. 重置之前的举报表单数据（避免弹窗复用上次的输入内容）
  reportType.value = '';
  textarea.value = '';

  // 4. 打开举报弹窗
  isReport.value = true;
};



// ========== 举报相关（完善：确认举报，调用后端接口） ==========
const confirmReport = async () => {
  console.log("准备提交举报");
  // 1. 表单校验：举报类型和原因不能为空
  if (!reportType.value) {
            console.log("举报类型");

    ElMessage.warning('请选择举报类型');
    return;
  }
  if (!textarea.value || textarea.value.trim() === '') {
        console.log("举报原因");

    ElMessage.warning('请输入举报原因');
    return;
  }

  // 2. 再次校验文章ID（双重保障，避免异常）
  if (!currentArticleId.value || currentArticleId.value <= 0) {
    console.log("文章信息异常");
    ElMessage.warning('文章信息异常，无法提交举报');
    isReport.value = false;
    return;
  }

  try {
    console.log("准备发送请求");
    // 3. 调用举报接口，传递文章ID和举报数据
    const result = await ReqReportArticle(currentArticleId.value, {
      reason: reportType.value, // 举报类型（对应后端的reason参数）
      description: textarea.value.trim() // 举报详细原因（对应后端的description参数）
    });
    console.log("发送请求结束");

    // 4. 提交成功处理
    if (result) {
      ElMessage.success("举报提交成功，我们将尽快处理");
      isReport.value = false; // 关闭弹窗
      // 重置表单数据
      resetReportForm();
    }
  } catch (error) {
    // 5. 异常处理（捕获接口请求失败/后端返回的业务异常）
    const errorMsg = error.response?.data?.message || "举报提交失败，请稍后再试";
    ElMessage.error(errorMsg);
  }
};

// 新增：重置举报表单（抽离公共逻辑，便于复用）
const resetReportForm = () => {
  reportType.value = '';
  textarea.value = '';
  currentArticleId.value = 0;
  currentArticleTitle.value = '';
};

// 优化：取消举报时也调用重置表单
const cancelReport = () => {
  isReport.value = false;
  resetReportForm();
};

// ========== 文章列表加载（修改：调用 initArticleStatus 初始化状态） ==========
const getArticleAll = async () => {
  try {
    let result = await ReqGetArticleAll(1, 10);
    console.log("result", result);
    if (result && result.content) {
      articleList.value = result.content;
      // 初始化每篇文章的 收藏+点赞 状态（替换原有仅初始化收藏的逻辑）
      articleList.value.forEach(item => {
        initArticleStatus(item);
      });
    }
  } catch (error) {
    ElMessage.error("获取文章列表失败");
  }
}

const getArticle = async () => {
  page.value++;
  try {
    let result = await ReqGetArticleAll(page.value, 10);
    if (result && result.data) {
      if (result.data.length !== 0) {
        result.data.forEach(item => {
          articleList.value.push(item);
          // 新增文章也初始化 收藏+点赞 状态
          initArticleStatus(item);
        });
      } else {
        noMore.value = true;
      }
    }
  } catch (error) {
    ElMessage.error("加载更多文章失败");
    loading.value = false;
  }
}

const load = () => {
  loading.value = true;
  setTimeout(() => {
    getArticle();
    loading.value = false;
  }, 2000)
}

// ========== 挂载初始化（保留原有，无修改） ==========
onMounted(() => {
  getArticleAll();
})
</script>

<style lang="scss" scoped>
// 样式部分完全保留，无修改
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

    .article-box {
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
        padding-bottom: 20px;
        border-bottom: 1px solid #f0f0f0;

        .article {
          margin-bottom: 20px;

          .title {
            font-size: 20px;
            font-weight: 500;
            cursor: pointer;
            color: #1772F6;
          }

          .title:hover {
            color: rgb(9, 64, 142);
            text-decoration: underline;
          }

          .summary {
            width: 100%;
            height: 50px;
            display: -webkit-box;
            overflow: hidden;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            text-overflow: ellipsis;
            color: #666;
            font-size: 14px;
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

              &:hover {
                color: #1772F6;
              }

              p {
                margin-left: 5px;
                margin-bottom: 0;
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