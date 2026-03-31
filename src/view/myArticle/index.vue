<template>
  <div class="my-articles-container">
    <!-- 文章列表区域 -->
    <div v-if="articleList.length > 0" class="article-list">
      <!-- 单个文章项 -->
      <div v-for="article in articleList" :key="article.id" class="article-item">
        <!-- 文章基本信息 -->
        <div class="article-header">
          <h3 class="article-title">{{ article.title }}</h3>
          <div class="article-status" :class="article.status.toLowerCase()">
            {{ formatStatus(article.status) }}
          </div>
        </div>

        <div class="article-meta">
          <span class="article-time">{{ formatTime(article.createdAt) }}</span>
          <span class="article-view">阅读量：{{ article.viewCount || 0 }}</span>
        </div>

        <p class="article-summary">{{ article.summary || "无摘要" }}</p>

        <!-- 文章操作按钮 -->
        <div class="article-actions">
          <button @click="toEditArticle(article.id)" class="btn edit-btn">编辑</button>
          <button @click="handleDeleteArticle(article.id)" class="btn delete-btn">删除</button>
        </div>
      </div>
    </div>

    <!-- 空状态（无文章时显示） -->
    <empty-box v-else title="暂时没有文章" />

    <!-- 分页组件（有文章时显示） -->
    <div v-if="articleList.length > 0 && total > size" class="pagination">
      <button 
        @click="changePage(page - 1)" 
        class="page-btn" 
        :disabled="page <= 1"
      >
        上一页
      </button>
      <span class="page-info">第 {{ page }} 页 / 共 {{ totalPage }} 页</span>
      <button 
        @click="changePage(page + 1)" 
        class="page-btn" 
        :disabled="page >= totalPage"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import EmptyBox from '../../components/EmptyBox/index.vue'
import { ReqGetMyArticles, ReqDeleteArticle } from '../../api/article'
import useUserStore from '../../store/modules/user'
const router = useRouter()
const UserStore = useUserStore();

// ========== 响应式数据 ==========
const articleList = ref<any[]>([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
const status = ref("ALL")
const keyword = ref("")
const loading = ref(false)

// ========== 计算属性 ==========
const totalPage = computed(() => Math.ceil(total.value / size.value))

// ========== 辅助函数 ==========
const formatStatus = (status: string) => {
  switch (status.toUpperCase()) {
    case "PUBLISHED":
      return "已发布"
    case "DRAFT":
      return "草稿"
    case "AUDITING":
      return "审核中"
    case "REJECTED":
      return "审核驳回"
    default:
      return "全部"
  }
}

const formatTime = (time: string) => {
  if (!time) return ""
  return new Date(time).toLocaleString()
}

// ========== 核心业务逻辑 ==========
const getMyArticles = async () => {
  try {
    loading.value = true
    const userId = Number(UserStore.userInfo?.id);
    console.log("UserStore.userinfo:", UserStore.userInfo);
    
    if (!userId) {
      console.error("用户ID不存在，请先登录")
      return
    }
    
    const res = await ReqGetMyArticles(
      userId,
      page.value,
      size.value,
      status.value,
      keyword.value
    )
    
    if (res) {
      articleList.value = res.data || []
      total.value = res.data.totalElements || 0
    }
  } catch (error) {
    console.error("获取我的文章列表失败：", error)
  } finally {
    loading.value = false
  }
}

const changePage = (newPage: number) => {
  if (newPage < 1 || newPage > totalPage.value) return
  page.value = newPage
  getMyArticles()
}

const toEditArticle = (articleId: number) => {
  router.push({
    path: '/articleEditor',
    query: { id: articleId }
  })
}

const handleDeleteArticle = async (articleId: number) => {
  if (!confirm("确定要删除这篇文章吗？删除后无法恢复！")) return
  try {
    const res = await ReqDeleteArticle(articleId)
    if (res.code === 200) {
      alert("删除成功")
      getMyArticles()
    } else {
      alert("删除失败：" + (res.msg || "未知错误"))
    }
  } catch (error) {
    console.error("删除文章失败：", error)
    alert("删除失败，请稍后重试")
  }
}

// ========== 生命周期 ==========
onMounted(() => {
  getMyArticles()
})
</script>

<style scoped lang="scss">
.my-articles-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

.article-list {
  gap: 16px;
  display: flex;
  flex-direction: column;
}

.article-item {
  padding: 20px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.article-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer; /* 添加光标指示可点击 */
  transition: all 0.2s ease; /* 添加过渡效果 */
  
  /* 修复：使用正确的 SCSS 嵌套语法 */
  &:hover {
    text-decoration: underline;
    color: #1677ff; /* 悬停时变为蓝色，与编辑按钮颜色一致 */
  }
}

.article-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;

  &.published {
    background: #f0f9ff;
    color: #1677ff;
  }

  &.draft {
    background: #f5f5f5;
    color: #666;
  }

  &.auditing {
    background: #fffbe6;
    color: #faad14;
  }

  &.rejected {
    background: #fff2f0;
    color: #ff4d4f;
  }
}

.article-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #999;
}

.article-summary {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.article-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &.edit-btn {
    background: #e6f7ff;
    color: #1677ff;

    &:hover {
      background: #bae0ff;
    }
  }

  &.delete-btn {
    background: #fff2f0;
    color: #ff4d4f;

    &:hover {
      background: #ffccc7;
    }
  }
}

.pagination {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: #666;
}

.page-btn {
  padding: 6px 12px;
  border: 1px solid #dcdcdc;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    color: #dcdcdc;
    background: #f5f5f5;
  }

  &:not(:disabled):hover {
    border-color: #1677ff;
    color: #1677ff;
  }
}
</style>