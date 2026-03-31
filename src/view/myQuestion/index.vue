<template>
  <div class="user-questions-page">
  
    <!-- 问题列表主体 -->
    <div class="questions-list">
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
            {{ formatDate(scope.row.createdTime) }}
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
              @click="handleEditQuestion(scope.row.id)"
              class="operate-btn edit-btn"
            >
              修改
            </el-button>
            <el-button
              type="danger"
              size="small"
              icon="Delete"
              @click="handleDeleteQuestion(scope.row.id)"
              class="operate-btn delete-btn"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 无问题时展示空状态 -->
      <empty-box v-else title="暂无提问" />
    </div>

    <!-- 分页组件（有问题时展示） -->
    <div class="pagination-container" v-if="questionsList.length > 0">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="page"
        :page-sizes="[10, 20, 50]"
        :page-size="size"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
      >
      </el-pagination>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import EmptyBox from '../../components/EmptyBox/index.vue'
// 导入图标（修改、删除）
import { Edit, Delete } from '@element-plus/icons-vue'
// 导入获取用户问题的接口（对应你之前新增的 ReqGetUserOwnQuestions）
import { ReqGetUserOwnQuestions } from '../../api/question'
// 导入删除问题的接口（若未新增，可先预留，后续补充）
import { ReqDelAdminQuestion } from '../../api/question'
import useUserStore from '../../store/modules/user'
const UserStore = useUserStore();
const router = useRouter()
const userId =ref(UserStore.userInfo?.id);

// 分页参数
const page = ref(1)
const size = ref(10)
const total = ref(0)

// 问题列表数据
const questionsList = ref<any[]>([])

// 修改弹窗状态
const editDialogVisible = ref(false)
// 当前待修改的问题
const currentEditQuestion = reactive({
  id: 0,
  title: '',
  content: ''
})

// 格式化时间（简单封装，提升体验）
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取用户自身问题列表
const getUserOwnQuestions = async () => {
  try {
    // 这里替换为实际的当前登录用户ID（可从全局状态/本地存储中获取）
   if(!userId.value){
       ElMessage.error('请先登录')
      return;
      }
    const res = await ReqGetUserOwnQuestions(userId, page.value, size.value)
    if (res) {
              console.log("用户问题res:",res.data);

      questionsList.value = res.data || []
      console.log("用户问题为:",questionsList.value);
      total.value = res.data.totalElements || 0
    }
  } catch (error) {
    ElMessage.error('获取我的提问失败，请稍后重试')
    console.error('获取我的提问失败：', error)
  }
}

// 跳转到问题详情页
const goQuestionDetail = (questionId: number) => {
  router.push({
    path: '/question/detail',
    query: { id: questionId }
  })
}

// 处理修改问题
const handleEditQuestion = (questionId: Number) => {
  console.log("questionId:",questionId);
  if (!questionId) {
    ElMessage.warning("获取待修改问题数据失败");
    return;
  }
  // 跳转到问题编辑页，通过 query 传递问题ID
  router.push({
    path: '/questionEditor',
    query: { 
      id: questionId // 传递问题ID，编辑页通过ID查询完整详情
    }
  });
//   // 赋值给当前待修改问题
//   currentEditQuestion.id = question.id
//   currentEditQuestion.title = question.title
//   currentEditQuestion.content = question.content || ''
//   // 打开修改弹窗
//   editDialogVisible.value = true
}

// 处理删除问题（带确认弹窗，防止误删）
const handleDeleteQuestion = async (questionId: number) => {
  try {
    await ElMessageBox.confirm(
      '此操作将永久删除该问题，是否继续？',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    // 调用删除接口（这里暂时使用 ReqDelAdminQuestion，后续可替换为用户自身问题删除接口）
    await ReqDelAdminQuestion(questionId)
    ElMessage.success('问题删除成功')
    // 重新获取问题列表
    getUserOwnQuestions()
  } catch (error) {
    ElMessage.info('已取消删除')
    console.error('删除问题失败：', error)
  }
}

// 提交修改问题（暂时预留，后续完善表单后补充逻辑）
const submitEditQuestion = () => {
  // 后续补充修改接口调用逻辑
  ElMessage.success('问题修改成功（模拟）')
  // 关闭弹窗
  editDialogVisible.value = false
  // 重新获取问题列表
  getUserOwnQuestions()
}

// 分页：每页条数改变
const handleSizeChange = (val: number) => {
  size.value = val
  getUserOwnQuestions()
}

// 分页：当前页码改变
const handleCurrentChange = (val: number) => {
  page.value = val
  getUserOwnQuestions()
}

// 挂载时获取问题列表
onMounted(() => {
  getUserOwnQuestions()
})
</script>

<style scoped lang="scss">
.user-questions-page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 20px;
  h2 {
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
  }
}

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

.edit-form-container {
  padding: 10px 0;
  font-size: 14px;
  color: #666;
}
</style>