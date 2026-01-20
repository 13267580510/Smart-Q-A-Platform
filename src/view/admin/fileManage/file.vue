<template>
  <div class="file-manage-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>文件管理</span>
          <el-select v-model="selectedCategory" placeholder="选择分类" style="width: 200px; margin-right: 10px;" @change="handleCategoryChange">
                    <el-option label="全部" value="all"></el-option>
                    <el-option v-for="category in categories" :key="category" :label="category" :value="category"></el-option>
          </el-select>
          <el-input v-model="searchKeyword" placeholder="搜索文件名或分类" style="width: 300px; margin-right: 10px;">
                    <template #append>
                        <el-button @click="handleSearch">
                            <el-icon><Search /></el-icon>
                        </el-button>
                    </template>
                </el-input>
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
        <el-table-column prop="category" label="文件类型" width="120" />
        <el-table-column prop="createTime" label="上传时间" width="180"/>
        <el-table-column label="操作" width="200">
          <template #="{ row }">
            <el-button type="primary" link @click="handleDownload(row)">下载</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination 
        v-model:current-page="currentPage" 
        v-model:page-size="pageSize" 
        :page-sizes="[3, 5, 7, 9]"
        background 
        layout="prev, pager, next, jumper,->, sizes,total" 
        :total="total" 
        @current-change="pagenav" 
        @size-change="pagenav"
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
      
      <!-- 新增：显示已选择的文件信息 -->
      <div v-if="selectedFile" class="selected-file-info" style="margin: 15px 0; padding: 10px; border: 1px solid #e4e7ed; border-radius: 4px;">
        <p>已选择文件：{{ selectedFile.name }}</p>
        <p>文件大小：{{ formatFileSize(selectedFile.size) }}</p>
      </div>

      <!-- 新增：上传进度条 -->
      <div v-if="isUploading" style="margin: 15px 0;">
        <p>上传进度：{{ uploadProgress }}%</p>
        <el-progress 
          :percentage="uploadProgress" 
          :status="uploadProgress === 100 ? 'success' : 'normal'"
          stroke-width="10"
        />
        <p v-if="uploadTotalChunks > 0" style="margin-top: 8px; font-size: 12px; color: #666;">
          已上传 {{ uploadCurrentChunk }} / {{ uploadTotalChunks }} 分片
        </p>
      </div>

      <el-upload
        class="upload-demo"
        drag
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :before-upload="beforeUpload"
        :on-change="handleFileChange"  
        :show-file-list="false"
        :auto-upload="false"
        ref="uploadRef"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击选择</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持上传任意类型文件，且不超过10MB
          </div>
          <div class="el-upload__tip" style="color: #409EFF;">
            超过10MB的文件将自动启用分片上传
          </div>
        </template>
      </el-upload>
      
      <div style="text-align: center; margin-top: 20px;">
        <el-button 
          type="primary" 
          @click="handleConfirmUpload"
          :disabled="!selectedFile || !selectedCategory"  
        >
          确认上传
        </el-button>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancelUpload">取消</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, UploadFilled } from '@element-plus/icons-vue'
import type { UploadInstance, UploadFile } from 'element-plus'  // 新增：导入上传组件类型
import useUserStore from '@/store/modules/user'
import { formatTimestamp } from '@/utils/general'
import { 
  ReqGetCategories,
  ReqUploadFile,
  ReqUploadChunk, 
  uploadProgress, 
  uploadTotalChunks, 
  uploadCurrentChunk, 
  resetUploadProgress,
  ReqSearchFiles,
  ReqGetFileList,
  deleteFile
} from '@/api/files'
import {FileCheckRequest} from  '@/model/file/fileCheckRequest'
import { FileInfo } from '@/model/file/fileInfo'
import {CheckUploadRequest}  from '@/model/file/chunkUploadRequest'
import {calculateFileMD5,calculateLargeFileMD5} from  '@/utils/computeMD5'
// 定义接口
interface FileItem {
  id: number
  fileName: string
  fileSize: number
  fileType: string
  filePath: string
  createdTime: string
}

// 状态管理
const loading = ref(false)
const fileList = ref<FileItem[]>([])
const currentPage = ref(1)
const pageSize = ref(5)
const total = ref(0)
const searchKeyword = ref('')

const uploadVisible = ref(false)
const userStore = useUserStore()
const uploadRef = ref<UploadInstance>()  // 修改：指定上传组件类型
const categories = ref<string[]>([])  // 修改：改为数组类型
const selectedCategory = ref('')
const selectedFile = ref<File | null>(null)  // 新增：存储选中的文件
const uploadFiles  = ref<UploadFile[]>()
const isUploading = ref<boolean>(false)//上传状态控制

// 获取分类列表
const getCategories = async () => {
  try {
    const data = await ReqGetCategories()
    categories.value = data || [];  // 确保是数组
  } catch (error) {
    ElMessage.error('获取分类列表失败'); 
  }
}

// 分类切换处理
const handleCategoryChange = () => {
    currentPage.value = 1
    getFileList(1, true)
}

// 搜索文件
const handleSearch = async () => {
    if (!searchKeyword.value.trim()) {
        ElMessage.warning('请输入搜索关键词')
        return
    }
    
    try {
        const response = await ReqSearchFiles(searchKeyword.value.trim())
        // 注意：根据你的API返回结构调整
        if (Array.isArray(response)) {
            fileList.value = response
            total.value = response.length
            ElMessage.success('搜索成功')
        } else if (response?.data) {
            fileList.value = response.data
            total.value = response.data.length
            ElMessage.success('搜索成功')
        } else {
            fileList.value = []
            total.value = 0
            ElMessage.success('搜索完成，未找到相关文件')
        }
    } catch (error) {
        console.error('搜索失败:', error)
        ElMessage.error('搜索失败：网络异常')
    }
}

// 获取文件列表
const getFileList = async (page: number, showMessage = false) => {
  loading.value = true
  try {
        const params: any = {
            page: page - 1,
            size: pageSize.value
        }
        console.log("selectedCategory.value:", selectedCategory.value)
        if (!selectedCategory.value) {
            console.log("selectedCategory.value 为空，赋值为 all")
            selectedCategory.value = 'all'
            params.category = selectedCategory.value
        }else{
            params.category = selectedCategory.value
        }        
        console.log("准备获取文件列表，参数为:", params)
        const data = await ReqGetFileList(params)
        console.log("获取文件列表成功:", data)
        
        if (data && data.content) {
            fileList.value = data.content
            total.value = data.totalElements
        } else {
            fileList.value = []
            total.value = 0
        }
        
    } catch (error) {
        console.error('加载文件列表失败:', error)
        ElMessage.error('获取文件列表失败：网络异常')
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
const pagenav = () => {
  getFileList(currentPage.value)
}

// 打开上传对话框
const handleUpload = () => {
  uploadVisible.value = true
  // 重置状态
  selectedFile.value = null
  selectedCategory.value = ''
}

// 新增：文件选择变化事件
const handleFileChange = (uploadFile: UploadFile, uploadFilesParam: UploadFile[]) => {
  // 存储选中的文件
  if (uploadFilesParam.length > 0) {
    selectedFile.value = uploadFile.raw as File
    uploadFiles.value = uploadFilesParam;
    ElMessage.success(`已选择文件：${uploadFile.name}`)
    console.log('选中的文件信息：', selectedFile.value)
  } else {
    selectedFile.value = null
  }
}

// 上传前检查
const beforeUpload = (file: File) => {
  // 检查是否选择分类
  if (!selectedCategory.value) {
    ElMessage.error('请先选择文件分类！')
    return false
  }
  
  // 大文件判断（修改：10MB作为分片上传阈值，与提示文本一致）
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    // 直接触发分片上传，阻止普通上传
    uploadLargeFile(file)
    return false
  }
  return true
}

// 确认上传处理
const handleConfirmUpload = async () => {
  console.log("uploadRef",selectedFile.value);
  if (selectedFile.value && uploadFiles.value?.length > 0) {
      // 标记上传中
      isUploading.value = true
    // 重置进度
    resetUploadProgress()
    try{
      const fileInfo:FileInfo = {
          fileName: selectedFile.value?.name || '',  // 确保文件名存在
          fileSize: selectedFile.value?.size || 0,  // 确保文件大小存在
          md5:'' ,  // 假设需要计算MD5，这里可以留空
          category: selectedCategory.value,  // 确保分类存在
          userId: userStore.userInfo.id,  // 确保用户ID存在
          clientIp:'127.0.01'
        }
      if(selectedFile.value.size < 100 * 1024 * 1024){
        fileInfo.md5 = await calculateFileMD5(selectedFile.value)
      }else{
        fileInfo.md5 = await calculateLargeFileMD5(selectedFile.value)
      }
      console.log("计算MD5结束，开始文件检查");
      const checkFileresult =await  ReqUploadFile(fileInfo);
      if(checkFileresult.skipUpload==true){
        ElMessage.success('已经上传过了，无需重复上传')
        uploadVisible.value = false
        getFileList()
      }else{
        const result = await ReqUploadChunk(checkFileresult,selectedFile.value);
        console.log("result",result);
      }
  }catch(error){
    console.error('上传失败:', error)
    ElMessage.error(`上传失败：${(error as Error).message || '未知错误'}`)
  }finally{
     // 无论成功失败，都标记上传结束
     isUploading.value = false
  }
  } else {
    ElMessage.error('请先选择要上传的文件！')
  }
}

// 取消上传
const handleCancelUpload = () => {
  uploadVisible.value = false
  // 重置状态
  selectedFile.value = null
  selectedCategory.value = ''
  // 清空上传组件的文件列表
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

// 上传成功处理
const handleUploadSuccess = (response: any) => {
  if (response.code === 200) {
    ElMessage.success('文件上传成功')
    uploadVisible.value = false
    getFileList()
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

// 上传错误处理
const handleUploadError = () => {
  ElMessage.error('上传失败，请重试')
}

const handleDelete = async (file: FileItem) => {
  console.log("file",file);
  try {
    // 1. 弹出确认框，等待用户确认
    await ElMessageBox.confirm(
      `确定要删除文件"${file.fileName}"吗？此操作不可恢复。`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 2. 用户确认后，调用删除接口（核心新增逻辑）
    await deleteFile(file.id); // 假设FileItem中有fileId字段，需和实际字段名匹配

    // 3. 接口调用成功，提示并刷新文件列表
    ElMessage.success(`文件"${file.fileName}"删除成功`);
    getFileList(1); // 刷新列表，展示最新数据
  } catch (error: any) {
    // 分两种异常处理：用户取消操作 / 接口调用失败
    if (error.name === 'CanceledError') {
      // 用户点击取消按钮，友好提示
      ElMessage.info('已取消删除');
    } else {
      // 接口调用失败（网络错误/服务端报错等），提示错误
      ElMessage.error(`删除失败：${error.message || '服务器异常，请稍后重试'}`);
      console.error('文件删除接口调用失败：', error); // 控制台打印详细错误，便于排查
    }
  }
}


onMounted(() => {
  getFileList(1)
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