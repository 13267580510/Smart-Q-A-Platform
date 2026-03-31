<template>
  <div class="article-detail-page">
    <div class="container">
      <!-- 左侧主体内容 -->
      <div class="main-content">
        <!-- 文章头部 -->
        <div class="article-header">
          <h1 class="article-title">{{ article.title }}</h1>

          <!-- 作者信息（文章头部） -->
          <div class="author-bar">
            <div class="author-info" @click="goAuthorPage(article.userId)">
              <img
                class="avatar"
                :src="'http://127.0.0.1:8080'+article.author.avatar"
                alt="avatar"
              />
              <div class="author-meta">
                <div class="author-name">{{ article.author.nickname }}</div>
                <div class="author-desc">{{ article.author.description }}</div>
              </div>
            </div>
            <el-button
              type="primary"
              plain
              class="follow-btn"
              @click="followAuthor"
            >
              + 关注
            </el-button>
          </div>

          <!-- 互动数据 -->
          <div class="article-meta">
            <span class="like-count">{{ article.likeCount }} 赞同</span>
            <span class="comment-count">{{ article.commentCount || 0 }} 条评论</span>
            <span class="collect-count">{{ article.collectCount }} 收藏</span>
            <span class="view-count">{{ article.viewCount }} 浏览</span>
          </div>
        </div>

        <!-- 文章内容 -->
        <div class="article-content">
          <div
            class="content-html"
            v-html="article.content"
          ></div>
        </div>

        <!-- 移植：底部互动栏（点赞、点踩、收藏、举报等） -->
        <div class="article-actions">
          <!-- 点赞、点踩 -->
          <div class="vote-group">
            <el-button 
              :icon="CaretTop" 
              class="up" 
              :class="[{ active: isLiked(article.id) }]" 
              @click="toggleLike(article.id)"
            >
              点赞 {{ article.likeCount }}
            </el-button>
            <el-button 
              :icon="CaretBottom" 
              class="down" 
              :class="[{ active: isDisliked(article.id) }]"
              @click="toggleDislike(article.id)"
            >
              点踩
            </el-button>
          </div>

          <!-- 收藏、评论、举报 -->
          <div class="menu">
            <div class="collect" @click="toggleCollect(article.id)" :class="[{ activeC: isCollected(article.id) }]">
              <el-icon>
                <component :is="Star"></component>
              </el-icon>
              <p>收藏</p>
            </div>
            <div class="comment" @click="goComment">
              <el-icon>
                <component :is="ChatDotSquare"></component>
              </el-icon>
              <p>评论数 {{ article.commentCount || 0 }}</p>
            </div>
            <div class="report" @click="report(article.title)">
              <el-icon>
                <component :is="WarnTriangleFilled"></component>
              </el-icon>
              <p>举报</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧边栏 -->
      <div class="sidebar">
        <!-- 作者介绍 -->
        <el-card class="author-card">
          <div class="author-card-header">
            <img
              class="avatar"
              :src="'http://127.0.0.1:8080'+article.author.avatar"
              alt="avatar"
            />
            <div class="author-meta">
              <div class="author-name">{{ article.author.nickname }}</div>
              <div class="author-desc">{{ article.author.description }}</div>
            </div>
          </div>

          <div class="author-stats">
            <div class="stat-item">
              <div class="num">{{ authorStats.answer }}</div>
              <div class="label">回答</div>
            </div>
            <div class="stat-item">
              <div class="num">{{ authorStats.article }}</div>
              <div class="label">文章</div>
            </div>
            <div class="stat-item">
              <div class="num">{{ authorStats.follower }}</div>
              <div class="label">关注者</div>
            </div>
          </div>

          <el-button
            type="primary"
            block
            class="follow-btn"
            @click="followAuthor"
          >
            + 关注
          </el-button>
        </el-card>

        <!-- 大家都在搜 -->
        <el-card class="trending-card" shadow="hover">
          <div class="card-header">
            <span>大家都在搜</span>
            <el-link type="primary" @click="refreshTrending">换一换</el-link>
          </div>
          <ul class="trending-list">
            <li
              v-for="(item, idx) in trendingList"
              :key="idx"
              class="trending-item"
              @click="search(item.keyword)"
            >
              <span class="rank">{{ idx + 1 }}</span>
              <span class="keyword">{{ item.keyword }}</span>
              <span class="hot">{{ item.hot }}</span>
            </li>
          </ul>
        </el-card>
      </div>
    </div>
  </div>

  <!-- 移植：举报弹窗（完整复制首页） -->
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
import { ref, onMounted, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
// 移植：导入首页的所有图标（替换原有错误图标）
import { CaretTop, CaretBottom, ChatDotSquare, Star, WarnTriangleFilled } from '@element-plus/icons-vue';
// 移植：导入首页的所有接口
import { ReqDislikeArticle, ReqLikeArticle, ReqCollectArticle, ReqCancelCollectArticle } from "@/api/article";
// 详情页原有接口
import { ReqGetArticleDetail } from "@/api/article";

const route = useRoute();
const $router = useRouter();

// ========== 移植：举报相关状态（完整复制首页） ==========
const isReport = ref(false);
const reportType = ref('');
const textarea = ref('');
const currentArticleTitle = ref('');

// ========== 移植：状态管理（完整复制首页） ==========
// 点赞/点踩状态管理（1=点赞，-1=点踩，0=无状态）
const voteStatus = reactive(new Map());
// 收藏状态管理
const collectStatus = reactive(new Map());

// ========== 文章详情数据 ==========
const article = ref({
  id: null,
  title: "加载中...",
  userId: null,
  content: "",
  likeCount: 0,
  commentCount: 0,
  collectCount: 0,
  viewCount: 0,
  liked: false,
  collected: false,
  author: {
    nickname: "加载中",
    avatar: "",
    description: "暂无简介",
  },
});

// 作者统计数据
const authorStats = ref({
  answer: 0,
  article: 0,
  follower: 0,
});

// 大家都在搜
const trendingList = ref([
  { keyword: "现货黄金大幅跳水后再反弹", hot: "412万" },
  { keyword: "警方通报「金晨被曝肇事」", hot: "366万" },
  { keyword: "宝可梦在靖国神社举办活动", hot: "363万" },
]);

// ========== 移植：点赞/点踩逻辑（完整复制首页，无修改） ==========
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

// ========== 移植：收藏逻辑（完整复制首页，无修改） ==========
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

// ========== 移植：接口请求（完整复制首页，优化 updateArticleLikeCount 适配详情页） ==========
// 点赞文章
const likeArticle = async (id) => {
  try {
    let result = await ReqLikeArticle(id);
    if (result) {
      // 更新详情页的点赞数
      updateArticleLikeCount(id, voteStatus.get(id) === 1 ? 1 : -1);
      ElMessage.success(voteStatus.get(id) === 1 ? "点赞成功" : "取消点赞成功");
    }
  } catch (error) {
    ElMessage.error('点赞操作失败');
  }
};

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
};

// 优化：更新详情页的文章点赞数（适配单篇文章，而非列表）
const updateArticleLikeCount = (id, type) => {
  if (article.value.id === id) {
    if (type === 1) {
      article.value.likeCount = (article.value.likeCount || 0) + 1;
    } else {
      article.value.likeCount = Math.max(0, (article.value.likeCount || 0) - 1);
    }
  }
};

// ========== 移植：初始化文章状态（适配详情页单篇文章） ==========
/**
 * 从后端返回数据初始化文章的收藏和点赞状态
 * @param {Object} article 后端返回的文章对象（包含 collected、liked 字段）
 */
const initArticleStatus = (article) => {
  if (!article || !article.id) return;
  
  // 初始化收藏状态（优先取后端返回的 collected 字段）
  const isCollected = article.isCollected === true;
  collectStatus.set(article.id, isCollected);
  
  // 初始化点赞状态（优先取后端返回的 liked 字段，liked=true → 1，否则 0）
  const isLiked = article.isLiked === true;
  voteStatus.set(article.id, isLiked ? 1 : 0);
};

// ========== 移植：举报相关方法（完整复制首页） ==========
const report = (title) => {
  currentArticleTitle.value = title || "未知文章";
  isReport.value = true;
};

const cancelReport = () => {
  isReport.value = false;
  textarea.value = '';
  reportType.value = '';
};

const confirmReport = () => {
  // 可补充举报接口请求逻辑
  isReport.value = false;
  textarea.value = '';
  reportType.value = '';
  ElMessage.success("举报提交成功，我们将尽快处理");
};

// ========== 详情页原有方法 ==========
// 获取文章详情
const getArticleDetail = async () => {
  try {
    const id = route.query.id;
    const res = await ReqGetArticleDetail(id);
    if (res) {
      article.value = res;
      // 初始化当前文章的点赞/收藏状态
      initArticleStatus(article.value);
    }
  } catch (err) {
    ElMessage.error("加载文章失败");
    console.error(err);
  }
};

// 关注作者
const followAuthor = () => {
  ElMessage.success("关注成功");
};

// 跳转到作者主页
const goAuthorPage = (userId) => {
  $router.push({ path: "/author", query: { id: userId } });
};

// 跳转到评论区
const goComment = () => {
  ElMessage.info("评论区功能开发中~");
};

// 搜索关键词
const search = (keyword) => {
  $router.push({
    path: "/search",
    query: { q: keyword },
  });
};

// 刷新热搜
const refreshTrending = () => {
  ElMessage.success("刷新成功");
};

// ========== 挂载初始化 ==========
onMounted(() => {
  getArticleDetail();
});
</script>

<style lang="scss" scoped>
.article-detail-page {
  width: 100%;
  padding: 20px;
  background-color: #f6f7f9;
  min-height: 100vh;

  .container {
    display: flex;
    gap: 20px;
    max-width: 1200px;
    margin: 0 auto;

    .main-content {
      flex: 1;
      background: #fff;
      padding: 32px;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    }

    .sidebar {
      width: 360px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  }
}

// 文章标题
.article-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 20px;
  line-height: 1.4;
  color: #1a1a1a;
}

// 作者头部信息
.author-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .author-info {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;

    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }

    .author-meta {
      .author-name {
        font-size: 16px;
        font-weight: 600;
        color: #1a1a1a;
      }

      .author-desc {
        font-size: 13px;
        color: #6e6e73;
      }
    }
  }

  .follow-btn {
    height: 36px;
  }
}

.article-meta {
  display: flex;
  gap: 20px;
  color: #6e6e73;
  font-size: 14px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

// 文章内容
.article-content {
  margin-bottom: 32px;

  .content-html {
    font-size: 16px;
    line-height: 1.8;
    color: #333;

    img {
      max-width: 100%;
      border-radius: 6px;
      margin: 16px 0;
    }

    p {
      margin: 1em 0;
    }

    h1,
    h2,
    h3 {
      margin: 1.2em 0 0.6em;
    }
  }
}

// ========== 移植：底部互动栏样式（适配详情页，保留首页风格） ==========
.article-actions {
  display: flex;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
// 点赞点踩组（水平并列）
.vote-group {
  display: flex;
  flex-direction: row; // 改为水平排列（默认值也可以省略，flex 默认就是 row）
  gap: 8px; // 水平方向间距（可根据需要调整，比如 12px 更宽松）

  button {
    background-color: rgb(231, 241, 254);
    color: rgb(23, 114, 246);
    border: none;
    width: 80px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
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
}

  // 菜单（收藏、评论、举报）
  .menu {
    display: flex;
    align-items: center;
    color: #758195;
    font-size: 14px;
    margin-left: 40px;

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

// ===== 右侧作者卡片 =====
.author-card {
  .author-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;

    .avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: cover;
    }

    .author-meta {
      .author-name {
        font-size: 18px;
        font-weight: 600;
      }

      .author-desc {
        font-size: 13px;
        color: #6e6e73;
        margin-top: 4px;
      }
    }
  }

  .author-stats {
    display: flex;
    justify-content: space-around;
    margin: 16px 0;

    .stat-item {
      text-align: center;

      .num {
        font-size: 18px;
        font-weight: 600;
        color: #1a1a1a;
      }

      .label {
        font-size: 13px;
        color: #6e6e73;
        margin-top: 2px;
      }
    }
  }

  .follow-btn {
    margin-top: 8px;
  }
}

// ===== 大家都在搜 =====
.trending-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-weight: 600;
  }

  .trending-list {
    list-style: none;
    padding: 0;
    margin: 0;

    .trending-item {
      display: flex;
      align-items: center;
      padding: 10px 0;
      cursor: pointer;
      font-size: 14px;

      &:hover {
        color: #1772f6;
      }

      .rank {
        width: 20px;
        color: #858585;
        font-size: 13px;
      }

      .keyword {
        flex: 1;
      }

      .hot {
        color: #858585;
        font-size: 12px;
      }
    }
  }
}
</style>