<template>
  <div>
    <!-- 筛选查询区域 -->
    <el-card style="margin-bottom: 10px;">
      <el-select v-model="statusFilter" style="width: 300px; margin-right: 10px;">
        <el-option value="全部">全部</el-option>
        <el-option value="待处理">待处理</el-option>
        <el-option value="举报通过">举报通过</el-option>
        <el-option value="举报驳回">举报驳回</el-option>
      </el-select>
      <el-button type="primary" @click="search(1, true)">查询</el-button>
    </el-card>

    <!-- 举报列表表格区域 -->
    <el-card>
      <el-table border style="margin-top: 10px; margin-bottom: 20px;" :data="articleReportList">
        <!-- 序号列 -->
        <el-table-column label="序号" width="100" align="center" type="index"></el-table-column>

        <!-- 被举报文章标题 -->
        <el-table-column label="文章标题" min-width="180">
          <template #="{ row }">
            <p style="width: 100%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
              {{ row.articleTitle }}
            </p>
          </template>
        </el-table-column>

        <!-- 文章作者昵称 -->
        <el-table-column label="文章作者昵称" width="150" align="center">
          <template #="{ row }">
            <pre>{{ row.articleAuthorName }}</pre>
          </template>
        </el-table-column>

        <!-- 举报人昵称 -->
        <el-table-column label="举报人昵称" width="150" align="center">
          <template #="{ row }">
            <pre>{{ row.reporterName }}</pre>
          </template>
        </el-table-column>

        <!-- 举报原因（文本直接展示） -->
        <el-table-column label="举报原因" width="150" align="center">
          <template #="{ row }">
            <pre>{{ row.reason }}</pre>
          </template>
        </el-table-column>

        <!-- 详细原因（可点击弹出弹窗） -->
        <el-table-column label="详细原因" min-width="200">
          <template #="{ row }">
            <span 
              style="color: #409EFF; cursor: pointer; text-decoration: underline;"
              @click="openDescriptionDialog(row.description, row.articleTitle)"
            >
              {{ row.description ? (row.description.length > 20 ? row.description.substring(0, 20) + '...' : row.description) : '无详细原因' }}
            </span>
          </template>
        </el-table-column>

        <!-- 举报时间（格式化） -->
        <el-table-column label="举报时间" width="180" align="center">
          <template #="{ row }">
            <pre>{{ formatTimestamp(row.reportTime) }}</pre>
          </template>
        </el-table-column>

        <!-- 举报状态（标签展示） -->
        <el-table-column label="举报状态" width="120" align="center">
          <template #="{ row }">
            <el-tag 
              :type="row.status === 'PENDING' ? 'success' : (row.status === 'APPROVED' ? 'danger' : 'primary')"
            >
              {{ row.status === 'PENDING' ? '待处理' : (row.status === 'APPROVED' ? '举报通过' : '举报驳回') }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 操作列（新增「查看」按钮，保留「处理」按钮） -->
        <el-table-column label="操作" width="200" align="center">
          <template #="{ row }">
            <!-- 新增：查看文章按钮 -->
            <el-button 
              type="default" 
              size="small" 
              style="margin-right: 10px;"
              @click="lookArticle(row.articleId)"
              :disabled="!row.articleId"
            >
              查看
            </el-button>
            <!-- 原有：处理举报按钮 -->
            <el-button 
              type="primary" 
              size="small"
              @click="handleReport(row)"
            >
              处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <el-pagination 
        v-model:current-page="pageNo" 
        v-model:page-size="pageSize" 
        :page-sizes="[5, 10, 20, 50]"
        background 
        layout="prev, pager, next, jumper,->, sizes, total" 
        :total="total" 
        @current-change="pageNav" 
        @size-change="pageNav"
      />
    </el-card>

    <!-- 处理举报弹窗 -->
    <el-dialog v-model="isHandleOpen" title="处理文章举报" width="600px" style="margin-top: 3%;">
      <el-form label-width="auto">
        <!-- 文章标题 -->
        <el-form-item label="文章标题:">
          <h4>{{ currentReport.articleTitle }}</h4>
        </el-form-item>

        <!-- 文章作者昵称 -->
        <el-form-item label="文章作者昵称:">
          <el-input :value="currentReport.articleAuthorName" disabled></el-input>
        </el-form-item>

        <!-- 举报人昵称 -->
        <el-form-item label="举报人昵称:">
          <el-input :value="currentReport.reporterName" disabled></el-input>
        </el-form-item>

        <!-- 举报原因 -->
        <el-form-item label="举报原因:">
          <el-input :value="currentReport.reason" disabled></el-input>
        </el-form-item>

        <!-- 详细原因 -->
        <el-form-item label="详细原因:">
          <div style="height: 120px; border: 1px solid #dcdfe6; border-radius: 4px; padding: 10px; overflow: auto;">
            {{ currentReport.description || '无详细原因' }}
          </div>
        </el-form-item>

        <!-- 举报时间 -->
        <el-form-item label="举报时间:">
          <el-input :value="formatTimestamp(currentReport.reportTime)" disabled></el-input>
        </el-form-item>

        <!-- 举报状态 -->
        <el-form-item label="当前状态:">
          <el-tag 
            :type="currentReport.status === 'PENDING' ? 'success' : (currentReport.status === 'APPROVED' ? 'danger' : 'primary')"
          >
            {{ currentReport.status === 'PENDING' ? '待处理' : (currentReport.status === 'APPROVED' ? '举报通过' : '举报驳回') }}
          </el-tag>
        </el-form-item>
      </el-form>

      <!-- 处理操作按钮 -->
      <div style="display: flex; gap: 10px;">
        <el-button 
          type="primary" 
          style="flex: 1;" 
          @click="isRejectOpen = true" 
          :disabled="currentReport.status !== 'PENDING'"
        >
          驳回
        </el-button>
        <el-button 
          type="danger" 
          style="flex: 1;" 
          @click="isApproveOpen = true" 
          :disabled="currentReport.status !== 'PENDING'"
        >
          确认通过
        </el-button>
        <el-button style="flex: 1;" @click="isHandleOpen = false">取消</el-button>
      </div>

      <!-- 驳回确认弹窗 -->
      <el-dialog 
        v-model="isRejectOpen" 
        title="提示" 
        width="250px"
        style="position: absolute; top: 30%; left: 50%; transform: translate(-50%, -50%);"
      >
        <div>你确认要驳回该举报吗？</div>
        <div style="display: flex; margin-top: 20px; gap: 10px;">
          <el-button type="primary" style="flex: 1;" @click="confirmHandle('REJECTED')">确定</el-button>
          <el-button style="flex: 1;" @click="isRejectOpen = false">取消</el-button>
        </div>
      </el-dialog>

      <!-- 确认通过弹窗 -->
      <el-dialog 
        v-model="isApproveOpen" 
        title="提示" 
        width="250px"
        style="position: absolute; top: 30%; left: 50%; transform: translate(-50%, -50%);"
      >
        <div>你确认要通过该举报吗？（将封禁对应文章）</div>
        <div style="display: flex; margin-top: 20px; gap: 10px;">
          <el-button type="primary" style="flex: 1;" @click="confirmHandle('APPROVED')">确定</el-button>
          <el-button style="flex: 1;" @click="isApproveOpen = false">取消</el-button>
        </div>
      </el-dialog>
    </el-dialog>

    <!-- 详细原因查看弹窗 -->
    <el-dialog 
      v-model="isDescriptionDialogOpen" 
      title="举报详细原因" 
      width="600px"
    >
      <div style="padding: 10px; min-height: 200px; max-height: 400px; overflow: auto; white-space: pre-wrap; word-break: break-all;">
        {{ currentDescriptionContent || '无详细原因描述' }}
      </div>
      <template #footer>
        <el-button @click="isDescriptionDialogOpen = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
// 新增：导入router（确保你的项目已配置路由实例）
import { useRouter } from 'vue-router'

// ******** 导入真实API接口（替换为你的实际文件路径）********
import { ReqGetArticleReport, ReqHandleArticleReport, ReqSearchArticleReport } from '../../../api/admin/report'

// 初始化router实例
const router = useRouter()

// 格式化时间工具函数（修复 LocalDateTime 未定义问题，适配后端返回的ISO格式时间字符串）
const formatTimestamp = (time: string | null | undefined) => {
  if (!time) return '未知时间'
  try {
    const date = new Date(time)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    return '格式错误'
  }
}

// ******** 响应式变量定义 ********
// 筛选条件
const statusFilter = ref('全部')

// 列表数据相关
const articleReportList = ref<any[]>([])
const total = ref(0)
const pageNo = ref(1)
const pageSize = ref(10)

// 弹窗相关
const isHandleOpen = ref(false)
const currentReport = ref({})
const isRejectOpen = ref(false)
const isApproveOpen = ref(false)

// 详细原因弹窗相关响应式变量
const isDescriptionDialogOpen = ref(false)
const currentDescriptionContent = ref('')
const currentDescriptionArticleTitle = ref('')

// ******** 核心业务逻辑 ********
/**
 * 处理举报（打开弹窗，赋值当前待处理数据）
 */
const handleReport = (row: any) => {
  currentReport.value = row
  isHandleOpen.value = true
}

/**
 * 打开详细原因弹窗
 * @param description 详细原因内容
 * @param articleTitle 文章标题（用于弹窗标题）
 */
const openDescriptionDialog = (description: string | undefined, articleTitle: string) => {
  currentDescriptionContent.value = description || ''
  currentDescriptionArticleTitle.value = articleTitle || '未知文章'
  isDescriptionDialogOpen.value = true
}

/**
 * 新增：查看文章详情（跳转路由）
 * @param articleId 文章ID
 */
const lookArticle = (articleId: number | undefined) => {
  // 校验文章ID是否有效
  if (!articleId) {
    ElMessage.warning('缺少有效文章ID，无法查看详情')
    return
  }
  const id = articleId;
  // 跳转至文章详情页，携带articleId查询参数
  router.push({
    path: '/articleDetail',
    query: {
      id
    }
  })
}

/**
 * 筛选查询
 * @param page 页码
 * @param show 是否显示提示信息
 */
const search = async (page = 1, show = false) => {
  pageNo.value = page
  // 转换筛选状态（对应后端 ReportStatus 枚举）
  let targetStatus: string | null = null
  if (statusFilter.value && statusFilter.value !== '全部') {
    targetStatus = statusFilter.value === '待处理' 
      ? 'PENDING' 
      : (statusFilter.value === '举报通过' ? 'APPROVED' : 'REJECTED')
  }

  try {
    // ******** 调用真实API接口（移除模拟数据）********
    let result: any = null
    if (targetStatus) {
      // 按状态筛选查询
      result = await ReqSearchArticleReport(pageNo.value, pageSize.value, targetStatus)
    } else {
      // 获取全部举报列表
      result = await ReqGetArticleReport(pageNo.value, pageSize.value)
    }

    // 适配后端返回的 ApiResponse 格式
    if (result ) {
      // 提取分页数据（对应 PageResponse 结构）
      articleReportList.value = result.data || []
      total.value = result.totalElements || 0
      if (show) ElMessage.success('查询文章举报列表成功')
      return 'ok'
    } else {
      throw new Error(result?.data?.message || '查询失败')
    }
  } catch (error) {
    if (show) ElMessage.error('查询文章举报列表失败')
    console.error('查询文章举报异常：', error)
    return Promise.reject('获取文章举报列表失败')
  }
}

/**
 * 确认处理举报（驳回/通过）
 * @param type 处理类型（REJECTED/APPROVED）
 */
const confirmHandle = async (type: string) => {
  // 校验举报ID
  if (!currentReport.value?.reportId) {
    ElMessage.warning('缺少有效举报ID')
    return
  }

  try {
    // ******** 调用真实处理接口 ********
    const approved = type === 'APPROVED' // true=通过（封禁），false=驳回
    const result: any = await ReqHandleArticleReport(currentReport.value.reportId, approved)

    // 适配后端返回格式
    if (result) {
      const tip = type === 'APPROVED' ? '通过举报成功' : '驳回举报成功'
      ElMessage.success(tip)

      // 关闭所有弹窗
      isRejectOpen.value = false
      isApproveOpen.value = false
      isHandleOpen.value = false

      // 刷新当前页列表
      pageNav(pageNo.value)
      return 'ok'
    } else {
      throw new Error(result?.data?.message || '处理失败')
    }
  } catch (error) {
    const tip = type === 'APPROVED' ? '通过举报失败' : '驳回举报失败'
    ElMessage.error(tip)
    console.error('处理文章举报异常：', error)
    // 关闭弹窗
    isRejectOpen.value = false
    isApproveOpen.value = false
    isHandleOpen.value = false
    return Promise.reject(tip)
  }
}

/**
 * 分页导航（页码/页大小变更）
 */
const pageNav = (page = 1) => {
  pageNo.value = page
  search(page)
}

// ******** 页面挂载时初始化列表 ********
onMounted(() => {
  search(1, true)
})
</script>

<style scoped>
/* 保持与参考页面一致的样式，无额外冗余样式 */
pre {
  margin: 0;
  white-space: pre-wrap;
}

/* 详细原因弹窗内容样式优化 */
:deep(.el-dialog__body) {
  padding: 20px;
}
</style>