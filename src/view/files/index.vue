<template>
    <div class="files-container">
        <el-card style="margin-bottom: 20px;">
            <div class="search-header">
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
                
                <el-button type="primary" @click="loadFiles(1, true)">查询</el-button>
            </div>
        </el-card>

        <el-card>
            <el-table :data="fileList" border style="width: 100%; margin-bottom: 20px;">
                <el-table-column label="文件名" min-width="200">
                    <template #="{ row }">
                        <span class="file-name" @click="showFileDetail(row)">{{ row.fileName }}</span>
                    </template>
                </el-table-column>
                
                <el-table-column label="分类" width="120">
                    <template #="{ row }">
                        <el-tag>{{ row.category }}</el-tag>
                    </template>
                </el-table-column>
                
                <el-table-column label="文件类型" width="100">
                    <template #="{ row }">
                        <span class="file-type">{{ row.fileType }}</span>
                    </template>
                </el-table-column>
                
                <el-table-column label="大小" width="100">
                    <template #="{ row }">
                        {{ formatFileSize(row.fileSize) }}
                    </template>
                </el-table-column>
                
                <el-table-column label="上传时间" width="150">
                    <template #="{ row }">
                        {{ formatTime(row.createTime) }}
                    </template>
                </el-table-column>
                
                <el-table-column label="下载次数" width="100" align="center">
                    <template #="{ row }">
                        {{ row.downloadCount }}
                    </template>
                </el-table-column>
                
                <el-table-column label="操作" width="120" align="center">
                    <template #="{ row }">
                        <el-button type="primary" size="small" @click="downloadFile(row)">下载</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="totalElements"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
            />
        </el-card>

        <!-- 文件详情对话框 -->
        <el-dialog v-model="detailVisible" title="文件详情" width="600px">
            <div v-if="currentFile">
                <el-descriptions :column="1" border>
                    <el-descriptions-item label="文件名">{{ currentFile.fileName }}</el-descriptions-item>
                    <el-descriptions-item label="分类">{{ currentFile.category }}</el-descriptions-item>
                    <el-descriptions-item label="文件类型">{{ currentFile.fileType }}</el-descriptions-item>
                    <el-descriptions-item label="文件大小">{{ formatFileSize(currentFile.fileSize) }}</el-descriptions-item>
                    <el-descriptions-item label="MD5">{{ currentFile.md5 }}</el-descriptions-item>
                    <el-descriptions-item label="上传时间">{{ formatTime(currentFile.createTime) }}</el-descriptions-item>
                    <el-descriptions-item label="下载次数">{{ currentFile.downloadCount }}</el-descriptions-item>
                    <el-descriptions-item label="上传者IP">{{ currentFile.uploaderIp }}</el-descriptions-item>
                </el-descriptions>
                
                <div style="margin-top: 20px; text-align: center;">
                    <el-button type="primary" @click="downloadFile(currentFile)">下载文件</el-button>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { 
    ReqGetCategories, 
    ReqGetFileList, 
    ReqSearchFiles, 
    ReqGetFileDetail 
} from '../../api/files'

// 响应式数据
const categories = ref<string[]>([])
const selectedCategory = ref('')
const searchKeyword = ref('')
const fileList = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalElements = ref(0)
const detailVisible = ref(false)
const currentFile = ref(null)

// 生命周期
onMounted(() => {
    loadCategories()
    loadFiles(1)
})

// 加载分类
const loadCategories = async () => {
    try {
        const data = await ReqGetCategories()
        categories.value = data;
        selectedCategory.value = 'all'
        console.log("分类加载成功:", selectedCategory.value) // 调试信息，查看分类
    } catch (error) {
        ElMessage.error('获取分类失败：网络异常')
    }
}

// 加载文件列表
const loadFiles = async (page: number, showMessage = false) => {
    try {
        const params: any = {
            page: page - 1,
            size: pageSize.value
        }
        console.log("selectedCategory.value 的值是",selectedCategory.value)
        if (!selectedCategory.value) { // 匹配：null/undefined/''/0/false/NaN 等假值
                console.log("selectedCategory.value 为空，赋值为 all");
                selectedCategory.value = 'all';
            }
         params.category = selectedCategory.value
        
        console.log("准备获取文件列表，参数为:",params)
        const data = await ReqGetFileList(params)
            console.log("获取文件列表成功:", data) // 调试信息，查看返回数据
            fileList.value = data.content;
            totalElements.value = data.totalElements;
            
    } catch (error) {
        ElMessage.error('获取文件列表失败：网络异常')
    }
}

// 搜索文件
const handleSearch = async () => {
    if (!searchKeyword.value.trim()) {
        ElMessage.warning('请输入搜索关键词')
        return
    }
    
    try {
        const response = await ReqSearchFiles(searchKeyword.value.trim())
        if (response.data.success) {
            fileList.value = response.data.data
            totalElements.value = response.data.data.length
            ElMessage.success('搜索成功')
        } else {
            ElMessage.error('搜索失败：' + response.data.message)
        }
    } catch (error) {
        ElMessage.error('搜索失败：网络异常')
    }
}

// 显示文件详情
const showFileDetail = async (file: any) => {
    try {
        const response = await ReqGetFileDetail(file.fileKey)
        if (response.data.success) {
            currentFile.value = response.data.data
            detailVisible.value = true
        } else {
            ElMessage.error('获取文件详情失败：' + response.data.message)
        }
    } catch (error) {
        ElMessage.error('获取文件详情失败：网络异常')
    }
}

// 下载文件
const downloadFile = async (file: any) => {
    try {
        // 这里需要实现文件下载逻辑
        // 由于下载是文件流，需要特殊处理
        ElMessageBox.confirm(
            `确定要下载文件 "${file.fileName}" 吗？`,
            '下载确认',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        ).then(async () => {
            // 实际下载逻辑需要根据后端API实现
            // 这里先模拟下载成功
            ElMessage.success('开始下载文件：' + file.fileName)
        }).catch(() => {
            // 用户取消下载
        })
    } catch (error) {
        ElMessage.error('下载文件失败：网络异常')
    }
}

// 分类切换处理
const handleCategoryChange = () => {
    currentPage.value = 1
    loadFiles(1, true)
}

// 分页处理
const handleSizeChange = (size: number) => {
    pageSize.value = size
    loadFiles(1)
}

const handleCurrentChange = (page: number) => {
    currentPage.value = page
    loadFiles(page)
}

// 工具函数
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatTime = (timeString: string): string => {
    return timeString // 这里可以添加时间格式化逻辑
}
</script>

<style scoped>
.files-container {
    padding: 20px;
}

.search-header {
    display: flex;
    align-items: center;
    gap: 10px;
}

.file-name {
    color: #409EFF;
    cursor: pointer;
    text-decoration: underline;
}

.file-name:hover {
    color: #67C23A;
}

.file-type {
    font-weight: bold;
    color: #909399;
}
</style>