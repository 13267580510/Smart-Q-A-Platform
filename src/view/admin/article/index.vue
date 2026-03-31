<template>
    <div>
        <!-- 筛选查询卡片 -->
        <el-card style="margin-bottom: 10px;">
            <el-select v-model="status" style="width: 300px; margin-right: 10px;">
                <el-option value="全部">全部</el-option>
                <el-option value="草稿">草稿</el-option>
                <el-option value="已发布">已发布</el-option>
                <el-option value="审核中">审核中</el-option>
                <el-option value="审核失败">审核失败</el-option>
                <el-option value="已删除">已删除</el-option>
            </el-select>
            <el-button type="primary" @click="search(1, true)">查询</el-button>
        </el-card>

        <!-- 文章列表卡片 -->
        <el-card>
            <el-table border="1" style="margin-top: 10px;margin-bottom: 20px;" :data="articleAllList">
                <el-table-column label="序号" width="100" align="center" type="index"></el-table-column>
                
                <el-table-column label="文章标题" width="200">
                    <template #="{ row }">
                        <p style="width: 100%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;">
                            {{ row.title }}
                        </p>
                    </template>
                </el-table-column>
                
                <el-table-column label="文章摘要" width="300">
                    <template #="{ row }">
                        <p style="width: 100%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;">
                            {{ row.summary || '无摘要' }}
                        </p>
                    </template>
                </el-table-column>
                
                <el-table-column label="封面图片" width="120" align="center">
                    <template #="{ row }">
                        <el-image 
                            v-if="row.coverImage" 
                            :src="getCompleteImageUrl(row.coverImage)" 
                            style="width: 80px; height: 50px; object-fit: cover;"
                            preview-src-list="[row.coverImage]"
                            fit="cover">
                        </el-image>
                        <span v-else>无封面</span>
                    </template>
                </el-table-column>
                
                <el-table-column label="发布者" width="150">
                    <template #="{ row }">
                        <p style="width: 100%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;">
                            {{ row.authorName || '未知用户' }}
                        </p>
                    </template>
                </el-table-column>
                
                <el-table-column label="点赞数" width="80" align="center">
                    <template #="{ row }">
                        <pre>{{ row.likeCount || 0 }}</pre>
                    </template>
                </el-table-column>
                
                <el-table-column label="浏览数" width="80" align="center">
                    <template #="{ row }">
                        <pre>{{ row.viewCount || 0 }}</pre>
                    </template>
                </el-table-column>
                
                <el-table-column label="创建时间" width="180" align="center">
                    <template #="{ row }">
                        <p>{{ row.createdAt ? formatDateTime(row.createdAt) : '无记录' }}</p>
                    </template>
                </el-table-column>
                
                <el-table-column label="状态" width="100" align="center">
                    <template #="{ row }">
                        <el-tag :type="getStatusTagType(row.status)">
                            {{ getStatusText(row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                
                <el-table-column label="操作" width="200" align="center">
                    <template #="{ row }">
                        <el-button type="primary" size="small" @click="lookArticle(row.id)">查看</el-button>
                        <el-popconfirm 
                            class="box-item" 
                            title="你确认要删除该文章吗？" 
                            placement="bottom" 
                            width="200" 
                            @confirm="delArticle(row.id)">
                            <template #reference>
                                <el-button type="danger" size="small">删除</el-button>
                            </template>
                        </el-popconfirm>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页组件 -->
            <el-pagination 
                v-model:current-page="pageNo" 
                v-model:page-size="pageSize" 
                :page-sizes="[5, 10, 20, 50]"
                background 
                layout="prev, pager, next, jumper,->, sizes,total" 
                :total="total" 
                @current-change="pagenav" 
                @size-change="pagenav"/>
        </el-card>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ReqGetAdminArticleAll, ReqSearchAdminArticle, ReqDelAdminArticle } from '../../../api/article/index'
import { useRoute, useRouter } from "vue-router";
const router =useRouter();
// 响应式数据定义
const isLook = ref(false)          // 查看文章弹窗开关
const innerConfirm = ref(false)    // 确认删除弹窗开关
const total = ref(0)               // 总记录数
const pageNo = ref(1)              // 当前页码
const pageSize = ref(5)            // 每页条数
const articleAllList = ref([])     // 文章列表数据
const lookInfo = ref({})           // 查看的文章详情
const status = ref('全部')         // 筛选状态


const IMAGE_PREFIX = 'http://127.0.0.1:8083'

// 拼接图片完整路径的工具方法
const getCompleteImageUrl = (imagePath) => {
  if (!imagePath) return ''
  // 避免重复拼接（如果后端返回的路径已经带了前缀）
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  console.log("文章封面：",IMAGE_PREFIX + imagePath);
  return IMAGE_PREFIX + imagePath
}

// 格式化时间（将LocalDateTime转换为友好显示格式）
const formatDateTime = (dateStr) => {
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

// 获取文章状态对应的文字显示
const getStatusText = (status) => {
    if (!status) return '未知状态'
    const statusMap = {
        'DRAFT': '草稿',
        'PUBLISHED': '已发布',
        'AUDITING': '审核中',
        'AUDIT_FAILED': '审核失败',
        'DELETED': '已删除'
    }
    return statusMap[status] || '未知状态'
}

// 获取文章状态对应的标签类型
const getStatusTagType = (status) => {
    if (!status) return 'info'
    const tagMap = {
        'DRAFT': 'primary',      // 草稿-蓝色
        'PUBLISHED': 'success',  // 已发布-绿色
        'AUDITING': 'info',      // 审核中-浅蓝色
        'AUDIT_FAILED': 'warning',// 审核失败-黄色
        'DELETED': 'danger'      // 已删除-红色
    }
    return tagMap[status] || 'info'
}

// 获取文章列表（通用方法）
const getArticleAll = async (page = 1, show = false, search = false) => {
    pageNo.value = page
    try {
        const result = await ReqGetAdminArticleAll(pageNo.value, pageSize.value)
        if (result) {
            articleAllList.value = result.data || []
            total.value = result.total || 0
            console.log("res:",res);
            if (show) {
                ElMessage.success('获取文章列表成功')
            } else if (search) {
                ElMessage.success('查询文章成功')
            }
            return 'ok'
        }
    } catch (error) {
        console.error('获取文章列表失败：', error)
        ElMessage.error('获取文章列表失败')
    }
}

// 删除文章
const delArticle = async (id) => {
    if (!id) return Promise.reject('文章ID不能为空')
    try {
        const result = await ReqDelAdminArticle(id)
        if (result) {
            ElMessage.success('删除文章成功')
            // 刷新列表（保持当前筛选状态）
            if (status.value === '全部') {
                getArticleAll(pageNo.value)
            } else {
                search(pageNo.value)
            }
            // 关闭弹窗
            innerConfirm.value = false
            isLook.value = false
            return 'ok'
        }
    } catch (error) {
        console.error('删除文章失败：', error)
        ElMessage.error('删除文章失败')
        innerConfirm.value = false
        isLook.value = false
        return Promise.reject('删除文章失败')
    }
}

// 查看文章详情
const lookArticle = (articleId) => {
  router.push({
    path: '/reviewArticle',
    query: {
      articleId
    }
  })
}

// 分页切换
const pagenav = (page = 1) => {
    pageNo.value = page
    if (status.value === '全部') {
        getArticleAll(pageNo.value)
    } else {
        search(pageNo.value)
    }
}

// 筛选查询
const search = async (page = 1, show = false) => {
    pageNo.value = page
    // 全部状态直接调用通用查询
    if (status.value === '全部') {
        await getArticleAll(page, false, true)
        return
    }

    // 对应状态转换为后端枚举值
    let state = ''
    switch (status.value) {
        case '草稿':
            state = 'DRAFT'
            break
        case '已发布':
            state = 'PUBLISHED'
            break
        case '审核中':
            state = 'AUDITING'
            break
        case '审核失败':
            state = 'AUDIT_FAILED'
            break
        case '已删除':
            state = 'DELETED'
            break
        default:
            state = ''
    }

    try {
        const result = await ReqSearchAdminArticle(pageNo.value, pageSize.value, state)
        if (result) {
            articleAllList.value = result.data || []
            total.value = result.total || 0
            if (show) {
                ElMessage.success('查询文章成功')
            }
        }
    } catch (error) {
        console.error('查询文章失败：', error)
        ElMessage.error('查询文章失败')
    }
}

// 页面挂载时初始化获取文章列表
onMounted(() => {
    getArticleAll(1, true)
})
</script>

<style lang="scss" scoped>
// 复用问题管理页面的样式，补充少量适配样式
.box {
    img {
        height: 50px;
    }
}

.content {
    display: flex;
    font-size: 16px;
    margin-top: 10px;

    .label {
        width: 100px;
        text-align: right;
        font-weight: bold;
        margin-right: 10px;
    }

    .main {
        flex: 1;
        word-wrap: break-word;
        word-break: break-all;
    }
}

// 表格图片样式优化
:deep(.el-image) {
    border: 1px solid #ebeef5;
    border-radius: 4px;
}

// 分页组件样式优化
:deep(.el-pagination) {
    margin-top: 20px;
    text-align: right;
}
</style>