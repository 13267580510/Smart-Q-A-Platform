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
            <!-- ========== 修改：绑定编辑按钮点击事件 ========== -->
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
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

    <!-- ========== 新增：修改分类对话框 ========== -->
    <el-dialog v-model="editVisible" title="修改文件分类" width="400px">
      <div style="padding: 10px 0;">
        <el-form label-width="80px" :model="editForm">
          <el-form-item label="文件名：">
            <el-input v-model="editForm.fileName" disabled />
          </el-form-item>
          <el-form-item label="当前分类：">
            <el-input v-model="editForm.oldCategory" disabled />
          </el-form-item>
          <el-form-item label="新分类：" required>
            <el-select 
              v-model="editForm.newCategory" 
              placeholder="请选择新分类" 
              style="width: 100%;"
              @change="validateEditForm"
            >
              <el-option 
                v-for="category in categories" 
                :key="category" 
                :label="category" 
                :value="category" 
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleConfirmEdit"
          :disabled="!editForm.newCategory || editForm.newCategory === editForm.oldCategory"
        >
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, UploadFilled, Search } from '@element-plus/icons-vue' // 新增：导入Search图标
import type { UploadInstance, UploadFile } from 'element-plus'
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
  deleteFile,
  // ========== 新增：导入修改分类接口 ==========
  ReqUpdateFileCategory,
  UpdateFileCategoryParams
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
  createTime: string
  category: string // 补充：文件分类字段
}

// ========== 新增：编辑表单类型 ==========
interface EditForm {
  fileId: number
  fileName: string
  oldCategory: string
  newCategory: string
}

// 状态管理
const loading = ref(false)
const fileList = ref<FileItem[]>([])
const currentPage = ref(1)
const pageSize = ref(5)
const total = ref(0)
const searchKeyword = ref('')

const uploadVisible = ref(false)
// ========== 新增：编辑弹窗状态 ==========
const editVisible = ref(false)
const editForm = ref<EditForm>({
  fileId: 0,
  fileName: '',
  oldCategory: '',
  newCategory: ''
})

const userStore = useUserStore()
const uploadRef = ref<UploadInstance>()
const categories = ref<string[]>([])
const selectedCategory = ref('')
const selectedFile = ref<File | null>(null)
const uploadFiles  = ref<UploadFile[]>()
const isUploading = ref<boolean>(false)

// 获取分类列表
const getCategories = async () => {
  try {
    const data = await ReqGetCategories()
    categories.value = data || [];
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
            page: page,
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
  selectedFile.value = null
  selectedCategory.value = ''
}

// 文件选择变化事件
const handleFileChange = (uploadFile: UploadFile, uploadFilesParam: UploadFile[]) => {
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
  if (!selectedCategory.value) {
    ElMessage.error('请先选择文件分类！')
    return false
  }
  
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    uploadLargeFile(file)
    return false
  }
  return true
}

// 确认上传处理
const handleConfirmUpload = async () => {
  console.log("uploadRef",selectedFile.value);
  if (selectedFile.value && uploadFiles.value?.length > 0) {
      isUploading.value = true
    resetUploadProgress()
    try{
      const fileInfo:FileInfo = {
          fileName: selectedFile.value?.name || '',
          fileSize: selectedFile.value?.size || 0,
          md5:'' ,
          category: selectedCategory.value,
          userId: userStore.userInfo.id,
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
        if(result){ // 修复：变量名拼写错误 ruslt -> result
          ElMessage.success('上传成功')
        }else{
          ElMessage.error('上传失败')
        }
      }
  }catch(error){
    console.error('上传失败:', error)
    ElMessage.error(`上传失败：${(error as Error).message || '未知错误'}`)
  }finally{
     isUploading.value = false
  }
  } else {
    ElMessage.error('请先选择要上传的文件！')
  }
}

// 取消上传
const handleCancelUpload = () => {
  uploadVisible.value = false
  selectedFile.value = null
  selectedCategory.value = ''
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

// 删除文件
const handleDelete = async (file: FileItem) => {
  console.log("file",file);
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

    await deleteFile(file.id);

    ElMessage.success(`文件"${file.fileName}"删除成功`);
    getFileList(1);
  } catch (error: any) {
    if (error.name === 'CanceledError') {
      ElMessage.info('已取消删除');
    } else {
      ElMessage.error(`删除失败：${error.message || '服务器异常，请稍后重试'}`);
      console.error('文件删除接口调用失败：', error);
    }
  }
}

// ========== 新增：编辑相关方法 ==========
// 打开编辑弹窗
const handleEdit = (row: FileItem) => {
  // 初始化编辑表单
  editForm.value = {
    fileId: row.id,
    fileName: row.fileName,
    oldCategory: row.category,
    newCategory: row.category // 默认选中当前分类
  }
  editVisible.value = true
}

// 验证编辑表单（判断新分类是否和原分类一致）
const validateEditForm = () => {
  if (editForm.value.newCategory === editForm.value.oldCategory) {
    ElMessage.warning('新分类不能和原分类相同')
  }
}

// 确认修改分类
const handleConfirmEdit = async () => {
  try {
    // 构建请求参数
    const params: UpdateFileCategoryParams = {
      fileId: editForm.value.fileId,
      newCategory: editForm.value.newCategory
    }

    // 调用修改分类接口
    await ReqUpdateFileCategory(params)

    // 关闭弹窗 + 刷新列表
    editVisible.value = false
    getFileList(currentPage.value)
  } catch (error) {
    console.error('修改分类失败:', error)
    // 不关闭弹窗，让用户重新操作
    ElMessage.error('修改分类失败，请重试')
  }
}

// 大文件上传（原有方法补充，避免报错）
const uploadLargeFile = (file: File) => {
  ElMessage.info('大文件将进行分片上传，请点击确认上传按钮')
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

/* 新增：编辑弹窗样式优化 */
:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-form-item) {
  margin-bottom: 15px;
}
</style>