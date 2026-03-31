<template>
  <div class="user-collection-page">
    <!-- 页面头部：标题 + 下拉选择器 -->
    <div class="page-header">
      <h2>我的收藏</h2>
      <el-select
        v-model="activeCollectionType"
        placeholder="请选择收藏类型"
        size="default"
        @change="handleCollectionTypeChange"
      >
        <el-option label="收藏问题" value="question" />
        <el-option label="收藏文章" value="article" />
      </el-select>
    </div>

    <!-- 收藏问题：表格列表展示（默认） -->
    <div v-if="activeCollectionType === 'question'" class="questions-list">
      <!-- 有问题时展示列表 -->
      <el-table
        v-if="questionsList.length > 0"
        :data="questionsList"
        border
        stripe
        style="width: 100%"
      >
        <!-- 问题标题列 -->
        <el-table-column
          prop="title"
          label="问题标题"
          min-width="300"
          align="left"
        >
          <template #default="scope">
            <el-link
              type="primary"
              @click="goQuestionDetail(scope.row.id)"
              class="question-title-link"
            >
              {{ scope.row.title }}
            </el-link>
          </template>
        </el-table-column>

        <!-- 问题创建时间列 -->
        <el-table-column
          prop="createdTime"
          label="创建时间"
          width="200"
          align="center"
        >
          <template #default="scope">
            {{ formatTimestamp(scope.row.createdTime) }}
          </template>
        </el-table-column>

        <!-- 问题状态列（可选，如：已解决/未解决） -->
        <el-table-column
          label="问题状态"
          width="120"
          align="center"
        >
          <template #default="scope">
            <el-tag
              :type="scope.row.solved ? 'success' : 'info'"
              size="small"
            >
              {{ scope.row.solved ? '已解决' : '未解决' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 操作列（修改、删除） -->
        <el-table-column
          label="操作"
          width="180"
          align="center"
        >
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              icon="Edit"
              @click="goQuestionDetail(scope.row.id)"
              class="operate-btn edit-btn"
            >
              查看
            </el-button>
            <el-button
              type="danger"
              size="small"
              icon="Delete"
              @click="cancelQuestionCollection(scope.row.id)"
              class="operate-btn delete-btn"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 无问题时展示空状态 -->
      <empty-box v-else title="暂无收藏问题" />
    </div>

    <!-- 收藏问题分页组件（有问题时展示） -->
    <div v-if="activeCollectionType === 'question' && questionsList.length > 0" class="pagination-container">
      <el-pagination
        @size-change="handleQuestionSizeChange"
        @current-change="handleQuestionCurrentChange"
        :current-page="questionPage"
        :page-sizes="[10, 20, 50]"
        :page-size="questionSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="questionTotal"
      >
      </el-pagination>
    </div>

    <!-- 收藏文章：卡片展示 -->
    <div v-if="activeCollectionType === 'article'" class="my-articles-container">
      <!-- 文章列表区域 -->
      <div v-if="articleList.length > 0" class="article-list">
        <!-- 单个文章项 -->
        <div v-for="data in articleList" :key="data.article.id" class="article-item">
          <!-- 文章基本信息 -->
          <div class="article-header">
            <h3 class="article-title" @click="goArticleDetail(data.article.id)">{{data.article.title }}</h3>
          </div>

          <div class="article-meta">
            <span class="article-time">{{ formatTimestamp(data.article.createdAt) }}</span>
            <span class="article-view">阅读量：{{ data.article.viewCount || 0 }}</span>
          </div>

          <p class="article-summary">{{ data.article.summary || "无摘要" }}</p>

          <!-- 文章操作按钮 -->
          <div class="article-actions">
            <button @click="goArticleDetail(data.article.id)" class="btn edit-btn">查看</button>
            <button @click="cancelArticleCollection(data.id)" class="btn delete-btn">删除</button>
          </div>
        </div>
      </div>

      <!-- 空状态（无文章时显示） -->
      <empty-box v-else title="暂时没有收藏文章" />

      <!-- 分页组件（有文章时显示） -->
      <div v-if="activeCollectionType === 'article' && articleList.length > 0 && articleTotal > articleSize" class="pagination">
        <button
          @click="handleArticlePageChange(articlePage - 1)"
          class="page-btn"
          :disabled="articlePage <= 1"
        >
          上一页
        </button>
        <span class="page-info">第 {{ articlePage }} 页 / 共 {{ articleTotalPage }} 页</span>
        <button
          @click="handleArticlePageChange(articlePage + 1)"
          class="page-btn"
          :disabled="articlePage >= articleTotalPage"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ElMessage,ElMessageBox  } from 'element-plus';
// 引入接口请求方法
import { ReqGetCollectedQuestions } from '../../api/question'; // 请替换为你的实际接口文件路径
import { ReqGetCollectedArticles,ReqCancelCollectArticle } from '../../api/article'; // 请替换为你的实际接口文件路径

// 引入EmptyBox组件（确保你的项目中已存在该组件）
import EmptyBox from '../../components/EmptyBox/index.vue'
import useUserStore from '../../store/modules/user'
import { formatTimestamp } from '../../utils/general';
const UserStore = useUserStore();
import { useRouter } from 'vue-router'
const router = useRouter()
// 定义当前登录用户ID（请根据你的项目实际情况获取，比如从vuex/pinia/localStorage中获取）
const currentUserId = ref(Number(UserStore.userInfo?.id)); // 示例值，需替换为真实用户ID

// 收藏类型：question（问题，默认）、article（文章）
const activeCollectionType = ref<string>('question');

// ---------- 收藏问题相关数据 ----------
const questionsList = ref<any[]>([]);
const questionPage = ref<number>(1);
const questionSize = ref<number>(10);
const questionTotal = ref<number>(0);

// ---------- 收藏文章相关数据 ----------
const articleList = ref<any[]>([]);
const articlePage = ref<number>(1);
const articleSize = ref<number>(10);
const articleTotal = ref<number>(0);
// 文章总页数（计算属性）
const articleTotalPage = computed(() => {
  return Math.ceil(articleTotal.value / articleSize.value);
});

// ---------- 通用方法：日期格式化 ----------

// ---------- 收藏文章：状态格式化 ----------
const formatStatus = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'published':
      return '已发布';
    case 'draft':
      return '草稿';
    case 'auditing':
      return '审核中';
    case 'rejected':
      return '审核驳回';
    default:
      return status || '未知状态';
  }
};

// ---------- 收藏问题：接口请求 ----------
const getCollectedQuestions = async () => {
  try {
    const res = await ReqGetCollectedQuestions(currentUserId.value, questionPage.value, questionSize.value);
    if (res) { // 适配你的ApiResponse返回格式
        console.log("收藏问题请求：",res.data);
      questionsList.value = res.data
      questionTotal.value = res.totalElements || 0; // 适配PageResponse的total字段
      console.log("questionTotal:", res.totalElements);
    } else {
      ElMessage.error(res.data.message || '查询收藏问题失败');
    }
  } catch (error) {
    console.error('查询收藏问题异常：', error);
    ElMessage.error('查询收藏问题异常，请稍后重试');
  }
};

/**
 * 取消问题收藏
 * @param questionId 问题ID
 */
const cancelQuestionCollection = async (questionId: number) => {
  try {
    // 1. 弹出确认框，询问用户是否确定取消收藏
    await ElMessageBox.confirm(
      '确定要取消该问题的收藏吗？',
      '取消收藏确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    // 2. 调用取消问题收藏的API
  const result =  await ReqCancelCollectQuestion(questionId);
    if(result){
    ElMessage.success('取消问题收藏成功');
    }
    // 3. 操作成功，给出提示

    // 4. 刷新收藏问题列表（保持当前分页，用户体验更好）
    getCollectedQuestions();
  } catch (error) {
    // 分两种情况处理异常：1. 用户取消弹窗 2. API调用失败
    if (error !== 'cancel') { // element-plus的MessageBox取消时会抛出字符串'cancel'
      console.error('取消问题收藏失败：', error);
      ElMessage.error('取消问题收藏异常，请稍后重试');
    }
  }
};

// ---------- 收藏文章：接口请求 ----------
const getCollectedArticles = async () => {
  try {
    const res = await ReqGetCollectedArticles(currentUserId.value, articlePage.value, articleSize.value);
    console.log("收藏文章请求：",res);
    if (res) { // 适配你的ApiResponse返回格式
      articleList.value = res.content || []; // 适配PageResponse的records字段
      articleTotal.value = res.totalElements || 0; // 适配PageResponse的total字段
      
    } else {
      ElMessage.error(res.data.message || '查询收藏文章失败');
    }
  } catch (error) {
    console.error('查询收藏文章异常：', error);
    ElMessage.error('查询收藏文章异常，请稍后重试');
  }
};


/**
 * 取消文章收藏
 * @param articleId 文章ID
 */
const cancelArticleCollection = async (Id: number) => {
  try {
    // 1. 弹出确认框，询问用户是否确定取消收藏
    await ElMessageBox.confirm(
      '确定要取消该文章的收藏吗？',
      '取消收藏确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    // 2. 调用取消文章收藏的API
  
  const result =  await ReqCancelCollectArticle(Id);
    if(result){
    ElMessage.success('取消文章收藏成功');
    }
    // 3. 操作成功，给出提示

    // 4. 刷新收藏文章列表（保持当前分页，用户体验更好）
    getCollectedArticles();
  } catch (error) {
    // 分两种情况处理异常：1. 用户取消弹窗 2. API调用失败
    if (error !== 'cancel') { // element-plus的MessageBox取消时会抛出字符串'cancel'
      console.error('取消文章收藏失败：', error);
      ElMessage.error('取消文章收藏异常，请稍后重试');
    }
  }
};
// ---------- 下拉选择器切换收藏类型 ----------
const handleCollectionTypeChange = () => {
  // 切换时重置对应分页，并重查数据
  if (activeCollectionType.value === 'question') {
    questionPage.value = 1;
    getCollectedQuestions();
  } else {
    articlePage.value = 1;
    getCollectedArticles();
  }
};

// ---------- 收藏问题：分页事件 ----------
// 每页条数改变
const handleQuestionSizeChange = (newSize: number) => {
  questionSize.value = newSize;
  questionPage.value = 1; // 条数改变重置页码为1
  getCollectedQuestions();
};

// 当前页码改变
const handleQuestionCurrentChange = (newPage: number) => {
  questionPage.value = newPage;
  getCollectedQuestions();
};

// ---------- 收藏文章：分页事件 ----------
const handleArticlePageChange = (newPage: number) => {
  if (newPage < 1 || newPage > articleTotalPage.value) return;
  articlePage.value = newPage;
  getCollectedArticles();
};

// ---------- 收藏问题：跳转详情、编辑、删除 ----------
// 跳转到问题详情页
const goQuestionDetail = (questionId: number) => {
  router.push({
    path: '/question/detail',
    query: { id: questionId }
  })
}

const handleDeleteQuestion = (questionId: number) => {
  console.log('删除问题：', questionId);
  // 实现删除收藏问题的逻辑（可先弹确认框，再调用删除接口）
};

// ---------- 收藏文章：跳转详情、编辑、删除 ----------
const goArticleDetail = (id) => {
  router.push({
    path: '/articleDetail',
    query: {
      id
    }
  })
}


// ---------- 组件挂载时：默认查询收藏问题 ----------
onMounted(() => {
  getCollectedQuestions();
});
</script>

<style scoped lang="scss">
// 页面整体样式
.user-collection-page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

// 头部样式（标题 + 下拉选择器）
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
  }

  :deep(.el-select) {
    width: 200px;
  }
}

// ---------- 收藏问题：表格列表样式 ----------
.questions-list {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.question-title-link {
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }
}

.operate-btn {
  margin: 0 4px;

  &.edit-btn {
    background-color: #409eff;
    border-color: #409eff;
  }

  &.delete-btn {
    background-color: #f56c6c;
    border-color: #f56c6c;
  }
}

/* 分页容器样式 - 方案一 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  width: 100%;
}

/* 深度选择器修改 el-pagination 内部样式 */
:deep(.el-pagination) {
  display: flex !important;
  flex-wrap: nowrap !important;
  align-items: center;
  white-space: nowrap;
}

/* 调整分页内部元素的显示 */
:deep(.el-pagination__total),
:deep(.el-pagination__sizes),
:deep(.el-pagination__jump) {
  flex-shrink: 0;
  white-space: nowrap;
}

:deep(.el-pagination__pager) {
  flex-shrink: 0;
  display: inline-flex !important;
}

:deep(.el-pagination__editor) {
  width: 50px !important;
}

/* 确保在较小屏幕上也能正确显示 */
@media screen and (max-width: 768px) {
  .pagination-container {
    overflow-x: auto;
    padding-bottom: 5px;
  }
  
  :deep(.el-pagination) {
    padding: 0 10px;
  }
}

// ---------- 收藏文章：卡片样式 ----------
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