<template>
  <div class="file-manage-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>文件管理</span>
          <el-button type="primary" @click="handleUpload">
            <el-icon><Upload /></el-icon>
            上传文件
          </el-button>
        </div>
      </template>

      <el-table :data="fileList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="fileName" label="文件名" min-width="200" />
        <el-table-column prop="fileSize" label="文件大小" width="120">
          <template #="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column prop="fileType" label="文件类型" width="120" />
        <el-table-column prop="createdTime" label="上传时间" width="180">
          <template #="{ row }">
            {{ formatTimestamp(row.createdTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #="{ row }">
            <el-button type="primary" link @click="handleDownload(row)">下载</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination 
        v-model:current-page="pageNo" 
        v-model:page-size="pageSize" 
        :page-sizes="[3, 5, 7, 9]"
        background 
        layout="prev, pager, next, jumper,->, sizes,total" 
        :total="total" 
        @current-change="pagenav(pageNo)" 
        @size-change="pagenav()"
      />
    </el-card>

    <!-- 上传文件对话框 -->
    <el-dialog v-model="uploadVisible" title="上传文件" width="500">
      <div style="margin-bottom: 20px;">
        <span style="margin-right: 10px;">选择分类:</span>
        <el-select v-model="selectedCategory" placeholder="请选择文件分类" style="width: 200px;">
          <el-option v-for="category in categories" :key="category"  :label="category" :value="category" />
        </el-select>
      </div>
      <el-upload
        class="upload-demo"
        drag
        :action="uploadUrl"
        :headers="uploadHeaders"
        :data="{ category: category }"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :before-upload="beforeUpload"
        :show-file-list="false"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持上传任意类型文件，且不超过10MB
          </div>
        </template>
      </el-upload>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadVisible = false">取消</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, UploadFilled } from '@element-plus/icons-vue'
import  useUserStore  from '@/store/modules/user' // 假设这里是你的用户模块
import { formatTimestamp } from '@/utils/general'
import {
  ReqGetCategories
}from '@/api/files'
interface FileItem {
  id: number
  fileName: string
  fileSize: number
  fileType: string
  filePath: string
  createdTime: string
}

const loading = ref(false)
const fileList = ref<FileItem[]>([])
const pageNo = ref(1)
const pageSize = ref(5)
const total = ref(0)
const uploadVisible = ref(false)
const userStore = useUserStore() // 获取用户信息
const uploadUrl = ref('http://localhost:8080/api/files/upload')
const uploadHeaders = ref({
  Authorization: `Bearer ${userStore.token}`
})
const categories = ref('') // 文件分类
const selectedCategory = ref('') // 选中的分类
// 获取分类列表
const getCategories = async () => {
  try {
   const data = await ReqGetCategories()
    categories.value = data;

  }catch (error) {
    ElMessage.error('获取分类列表失败'); 
  }
    
}

// 获取文件列表
const getFileList = async () => {
  loading.value = true
  try {
    // 这里需要调用后端API获取文件列表
    // 模拟数据
    fileList.value = [
      {
        id: 1,
        fileName: 'example.pdf',
        fileSize: 1024 * 1024,
        fileType: 'PDF',
        filePath: '/files/example.pdf',
        createdTime: '2024-01-01T12:00:00'
      },
      {
        id: 2,
        fileName: 'image.png',
        fileSize: 512 * 1024,
        fileType: 'PNG',
        filePath: '/files/image.png',
        createdTime: '2024-01-02T14:30:00'
      }
    ]
    total.value = fileList.value.length
  } catch (error) {
    ElMessage.error('获取文件列表失败')
  } finally {
    loading.value = false
  }
}

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (size < 1024) {
    return size + ' B'
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + ' KB'
  } else {
    return (size / (1024 * 1024)).toFixed(2) + ' MB'
  }
}

// 分页导航
const pagenav = (page: number) => {
  pageNo.value = page
  getFileList()
}

// 打开上传对话框
const handleUpload = () => {
  uploadVisible.value = true
}

// 上传前检查
const beforeUpload = (file: File) => {
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过10MB!')
    return false
  }
  return true
}

// 上传成功处理
const handleUploadSuccess = (response: any) => {
  if (response.code === 200) {
    ElMessage.success('上传成功')
    uploadVisible.value = false
    getFileList() // 刷新列表
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

// 上传错误处理
const handleUploadError = () => {
  ElMessage.error('上传失败，请重试')
}


// 删除文件
const handleDelete = async (file: FileItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件"${file.fileName}"吗？此操作不可恢复。`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    
    ElMessage.success('删除成功')
    getFileList() // 刷新列表
  } catch (error) {
    ElMessage.info('已取消删除')
  }
}

onMounted(() => {
  getFileList()
  getCategories()
})
</script>

<style scoped>
.file-manage-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-demo {
  text-align: center;
}

.el-upload__tip {
  margin-top: 10px;
  color: #666;
  font-size: 12px;
}
</style>