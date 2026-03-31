<template>
  <div class="article-audit-page">
    <div class="container">
      <!-- 左侧主体内容（审核核心：文章正文） -->
      <div class="main-content">
        <!-- 文章头部（补充审核状态标签） -->
        <div class="article-header">
          <div class="header-top">
            <h1 class="article-title">{{ article.title }}</h1>
            <!-- 管理员专属：文章状态标签 -->
            <el-tag :type="getStatusTagType(article.status)" size="large">
              {{ getStatusText(article.status) }}
            </el-tag>
          </div>

          <!-- 作者信息（简化，保留核心审核所需信息） -->
          <div class="author-bar">
            <div class="author-info">
              <img
                class="avatar"
                :src="getCompleteImageUrl(article.author.avatar)"
                alt="作者头像"
              />
              <div class="author-meta">
                <div class="author-name">{{ article.author.nickname }}</div>
                <div class="author-id">作者ID：{{ article.userId }}</div>
                <div class="create-time">创建时间：{{ formatDateTime(article.createdAt) }}</div>
              </div>
            </div>
          </div>

          <!-- 文章核心元数据（审核所需：浏览数、点赞数 + 新增封面展示） -->
          <div class="article-meta">
            <div class="meta-item">浏览数：{{ article.viewCount || 0 }}</div>
            <div class="meta-item">点赞数：{{ article.likeCount || 0 }}</div>
          </div>

          <!-- 文章内容（优化样式，更适合审核阅读） -->
          <div class="article-content">
            <div class="content-html" v-html="article.content"></div>
          </div>
        </div>

        <!-- 管理员专属：审核操作栏（底部固定，方便操作） -->
        <div class="audit-action-bar">
          <el-button type="success" @click="passAudit" :disabled="isAuditing">审核通过</el-button>
          <el-button type="danger" @click="rejectAudit" :disabled="isAuditing">审核驳回</el-button>
          <el-button @click="goBack" :disabled="isAuditing">返回列表</el-button>
        </div>
      </div>

      <!-- 右侧侧边栏（补充审核辅助信息，移除无用热搜） -->
      <div class="sidebar">
        <!-- 文章审核概要卡片（新增：封面大图展示） -->
        <el-card class="audit-summary-card" header="文章审核概要">
          <div class="summary-item">
            <span class="label">文章ID：</span>
            <span class="value">{{ article.id || '未知' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">标题长度：</span>
            <span class="value">{{ article.title ? article.title.length : 0 }} 字</span>
          </div>
          <!-- 新增：封面完整展示（侧边栏，清晰查看） -->
          <div class="summary-item cover-summary-item">
            <span class="label">文章封面：</span>
            <div class="cover-container">
              <el-image
                v-if="article.coverImage"
                :src="'http://127.0.0.1:8083'+article.coverImage"
                style="width: 100%; height: 180px; object-fit: cover;"
                preview-src-list="[getCompleteImageUrl(article.coverImage)]"
                fit="cover"
                class="cover-summary"
              >
              </el-image>
              <span v-else class="no-cover-summary">无封面图片</span>
            </div>
          </div>
          <div class="summary-item">
            <span class="label">是否有封面：</span>
            <span class="value">{{ article.coverImage ? '有' : '无' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">内容长度：</span>
            <span class="value">{{ article.content ? stripHtml(article.content).length : 0 }} 字（纯文本）</span>
          </div>
        </el-card>

      </div>
    </div>

    <!-- 审核驳回弹窗 -->
    <el-dialog v-model="rejectDialogVisible" title="审核驳回" width="400px" :close-on-click-modal="false">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="驳回原因" required>
          <el-select v-model="rejectForm.reason" placeholder="请选择驳回原因" style="width: 100%;">
            <el-option label="内容违规" value="content_illegal"></el-option>
            <el-option label="标题违规" value="title_illegal"></el-option>
            <el-option label="重复内容" value="duplicate_content"></el-option>
            <el-option label="其他原因" value="other"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="详细说明">
          <el-input
            v-model="rejectForm.remark"
            type="textarea"
            rows="4"
            placeholder="请输入详细驳回说明（可选）"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject" :loading="isAuditing">确认驳回</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElTag } from "element-plus";
import { ReqGetArticleDetail } from "../../../api/article/index";
// 导入审核相关接口（后续替换为你的实际接口）
import { ReqReviewArticle} from "../../../api/admin/article";

const route = useRoute();
const $router = useRouter();

// ========== 核心状态定义（适配审核场景） ==========
// 文章详情数据（简化，保留审核所需字段）
const article = ref({
  id: null,
  title: "加载中...",
  userId: null,
  content: "",
  coverImage: "",
  viewCount: 0,
  likeCount: 0,
  createdAt: null,
  status: null,
  author: {
    nickname: "加载中",
    avatar: "",
    description: "暂无简介",
  },
});

// 审核相关状态
const isAuditing = ref(false); // 审核操作加载中
const rejectDialogVisible = ref(false); // 驳回弹窗开关
const rejectForm = ref({ // 驳回表单数据
  reason: "",
  remark: ""
});

// ========== 管理员专属：工具方法 ==========
// 图片路径拼接前缀（避免硬编码，便于维护）
const IMAGE_PREFIX = 'http://127.0.0.1:8083';
const getCompleteImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  console.log("imagePath:",imagePath);
  console.log("IMAGE_PREFIX + imagePath:",IMAGE_PREFIX + imagePath);
  return IMAGE_PREFIX + imagePath;
};

// 时间格式化（审核所需，显示创建时间）
const formatDateTime = (dateStr) => {
  if (!dateStr) return '未知时间';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 移除HTML标签（统计纯文本内容长度）
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '');
};

// 文章状态文字转换（适配审核场景）
const getStatusText = (status) => {
  if (!status) return '未知状态';
  const statusMap = {
    'DRAFT': '草稿',
    'AUDITING': '审核中',
    'PUBLISHED': '已发布',
    'AUDIT_FAILED': '审核失败',
    'DELETED': '已删除'
  };
  return statusMap[status] || '未知状态';
};

// 文章状态标签类型转换（管理员视觉区分）
const getStatusTagType = (status) => {
  if (!status) return 'info';
  const tagMap = {
    'DRAFT': 'primary',
    'AUDITING': 'info', // 审核中（重点，浅蓝色）
    'PUBLISHED': 'success',
    'AUDIT_FAILED': 'warning',
    'DELETED': 'danger'
  };
  return tagMap[status] || 'info';
};

// ========== 管理员专属：审核操作逻辑 ==========
// 审核通过（补充：传递 approved=true 适配后端接口）
const passAudit = async () => {
  if (!article.value.id) {
    ElMessage.error('文章ID不存在，无法审核');
    return;
  }
  if (article.value.status !== 'AUDITING') {
    ElMessage.warning(`当前文章状态为「${getStatusText(article.value.status)}」，无需重复审核`);
    return;
  }

  isAuditing.value = true;
  try {
    // 注意：这里需要传递第二个参数 approved=true（适配后端接口）
    const result = await ReqReviewArticle(article.value.id, true);
    if (result) {
      ElMessage.success('审核通过成功');
      article.value.status = 'PUBLISHED'; // 本地更新状态，无需刷新页面
      // 可选：返回文章审核列表
      // goBack();
    }
  } catch (error) {
    ElMessage.error('审核通过失败，请重试');
    console.error('审核通过失败：', error);
  } finally {
    isAuditing.value = false;
  }
};

// 打开驳回弹窗
const rejectAudit = () => {
  if (!article.value.id) {
    ElMessage.error('文章ID不存在，无法驳回');
    return;
  }
  if (article.value.status !== 'AUDITING') {
    ElMessage.warning(`当前文章状态为「${getStatusText(article.value.status)}」，无法驳回`);
    return;
  }
  // 重置表单
  rejectForm.value = { reason: '', remark: '' };
  rejectDialogVisible.value = true;
};

// 确认驳回（补充：传递 approved=false 适配后端接口）
const confirmReject = async () => {
  if (!rejectForm.value.reason) {
    ElMessage.error('请选择驳回原因');
    return;
  }
  if (!article.value.id) {
    ElMessage.error('文章ID不存在，无法驳回');
    return;
  }
  if (article.value.status !== 'AUDITING') {
    ElMessage.warning(`当前文章状态为「${getStatusText(article.value.status)}」，无法驳回`);
    return;
  }

  isAuditing.value = true;
  try {
    // 注意：这里调用 ReqReviewArticle 传递 approved=false（审核驳回）
    const result = await ReqReviewArticle(article.value.id, false);
    if (result) {
      ElMessage.success('审核驳回成功');
      article.value.status = 'AUDIT_FAILED'; // 本地更新状态
      rejectDialogVisible.value = false;
      // 可选：返回文章审核列表
      // goBack();
    }
  } catch (error) {
    ElMessage.error('审核驳回失败，请重试');
    console.error('审核驳回失败：', error);
  } finally {
    isAuditing.value = false;
  }
};

// 返回文章审核列表
const goBack = () => {
  $router.push({ path: '/adminArticleManage/article' });
};

// ========== 核心方法：获取文章详情（适配审核场景） ==========
const getArticleDetail = async () => {
  try {
    const id = route.query.articleId;
    if (!id) {
      ElMessage.error('文章ID不存在');
      // goBack();
      // return;
    }
    const res = await ReqGetArticleDetail(id);
    if (res) {
      article.value = res;
    }
  } catch (err) {
    ElMessage.error('加载文章失败，请返回重试');
    console.error('加载文章失败：', err);
    // goBack();
  }
};

// ========== 挂载初始化 ==========
onMounted(() => {
  getArticleDetail();
});
</script>

<style lang="scss" scoped>
.article-audit-page {
  width: 100%;
  padding: 20px;
  background-color: #f6f7f9;
  min-height: 100vh;

  .container {
    display: flex;
    gap: 20px;
    max-width: 1400px;
    margin: 0 auto;

    .main-content {
      flex: 1;
      background: #fff;
      padding: 32px;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
      position: relative;
    }

    .sidebar {
      width: 360px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  }
}

// 文章头部（优化审核场景）
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.article-title {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.4;
  color: #1a1a1a;
  margin: 0;
  flex: 1;
  margin-right: 20px;
}

// 作者信息（简化，突出审核所需ID和时间）
.author-bar {
  margin-bottom: 16px;

  .author-info {
    display: flex;
    align-items: center;
    gap: 12px;

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

      .author-id, .create-time {
        font-size: 13px;
        color: #6e6e73;
        margin-top: 2px;
      }
    }
  }
}

// 文章元数据（审核所需，简洁展示 + 新增封面样式）
.article-meta {
  display: flex;
  flex-wrap: wrap; /* 新增：自动换行，避免封面超出容器 */
  gap: 20px;
  color: #6e6e73;
  font-size: 14px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  align-items: center; /* 新增：垂直居中，美观性更好 */

  .meta-item {
    display: flex;
    align-items: center;
  }

  // 新增：封面预览样式（元数据区域）
  .cover-preview-item {
    .cover-label {
      margin-right: 8px;
    }

    .cover-preview {
      border: 1px solid #f0f0f0;
      border-radius: 4px;
      cursor: zoom-in;
    }

    .no-cover {
      color: #858585;
      font-size: 13px;
    }
  }
}

// 文章内容（优化审核阅读体验，增大行高、优化图片样式）
.article-content {
  margin-bottom: 40px;

  .content-html {
    font-size: 16px;
    line-height: 2; /* 增大行高，便于长时间审核阅读 */
    color: #333;
    letter-spacing: 0.5px;

    img {
      max-width: 100%;
      border-radius: 6px;
      margin: 20px 0;
      border: 1px solid #f0f0f0;
    }

    p {
      margin: 1.2em 0;
    }

    h1, h2, h3 {
      margin: 1.5em 0 0.8em;
      color: #1a1a1a;
    }

    pre, code {
      background-color: #f6f7f9;
      padding: 2px 6px;
      border-radius: 4px;
    }

    pre {
      padding: 16px;
      margin: 1em 0;
      overflow-x: auto;
    }
  }
}

// 管理员专属：审核操作栏（底部固定，方便操作）
.audit-action-bar {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
  justify-content: center;
  margin: 20px -32px -32px -32px;

  button {
    min-width: 120px;
    height: 40px;
  }
}

// 右侧：审核概要卡片 + 新增封面样式
.audit-summary-card {
  .summary-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px dashed #f0f0f0;
    align-items: flex-start; /* 调整：垂直顶端对齐，适配封面容器 */
    flex-wrap: wrap; /* 新增：自动换行 */

    &:last-child {
      border-bottom: none;
    }

    .label {
      color: #6e6e73;
      font-size: 14px;
      width: 80px; /* 新增：固定标签宽度，排版更整齐 */
      flex-shrink: 0; /* 新增：标签不收缩 */
    }

    .value {
      color: #1a1a1a;
      font-size: 14px;
      font-weight: 500;
      flex: 1; /* 新增：内容占满剩余空间 */
      margin-left: 8px;
    }
  }

  // 新增：封面概要样式（侧边栏完整展示）
  .cover-summary-item {
    .cover-container {
      flex: 1;
      margin-left: 8px;
      width: 100%;
      max-width: 250px; /* 新增：限制最大宽度，避免超出卡片 */

      .cover-summary {
        border: 1px solid #f0f0f0;
        border-radius: 6px;
        cursor: zoom-in;
        width: 100%;
        height: 180px;
      }

      .no-cover-summary {
        color: #858585;
        font-size: 13px;
        text-align: center;
        padding: 80px 0;
        border: 1px dashed #f0f0f0;
        border-radius: 6px;
        width: 100%;
        height: 180px;
        box-sizing: border-box;
      }
    }
  }
}

// 右侧：作者信息卡片
.author-card {
  .author-card-content {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;

    .avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: cover;
    }

    .author-meta {
      .author-name {
        font-size: 16px;
        font-weight: 600;
        color: #1a1a1a;
      }

      .author-id, .author-desc {
        font-size: 13px;
        color: #6e6e73;
        margin-top: 4px;
      }
    }
  }
}

// 驳回弹窗样式
.dialog-footer {
  text-align: right;
}
</style>