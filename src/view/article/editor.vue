<template>
    <div class="container">
        <div class="left">
            <el-card>
                <el-form>
                    <el-form-item label="标题:">
                        <el-input placeholder="请输入文章标题" v-model="title"></el-input>
                    </el-form-item>
                    <el-form-item label="摘要:">
                        <el-input 
                            type="textarea" 
                            :rows="3" 
                            placeholder="请输入文章摘要（简要概括文章内容，便于读者快速了解）" 
                            v-model="summary"
                        ></el-input>
                    </el-form-item>
                    <!-- 分类选择组件 -->
                    <el-form-item label="分类:">
                        <el-tree-select
                            v-model="selectedCategoryId"
                            :data="categoryTree"
                            node-key="id"
                            placeholder="请选择文章分类"
                            style="width: 100%;"
                            :props="{ label: 'name', children: 'children' }"
                            @change="handleCategoryChange"
                        ></el-tree-select>
                    </el-form-item>
                    <!-- ========== 新增：封面上传 ========== -->
                    <el-form-item label="封面图:">
                        <el-upload
                            class="avatar-uploader"
                            action="#"
                            :show-file-list="false"
                            :before-upload="beforeUploadCover"
                            :http-request="uploadCoverHandler"
                        >
                            <img v-if="coverImage" :src="coverImage" class="avatar" alt="文章封面" />
                            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
                        </el-upload>
                    </el-form-item>
                    <!-- ========== 新增：文章可见性 ========== -->
                    <el-form-item label="可见性:">
                        <el-radio-group v-model="visibility" style="display: flex; gap: 20px;">
                            <el-radio label="1">公开（所有用户可查看）</el-radio>
                            <el-radio label="0">私密（仅自己可查看）</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <!-- ========== 新增：原创/转载 ========== -->
                    <el-form-item label="文章类型:">
                        <el-radio-group v-model="isOriginal" style="display: flex; gap: 20px;" @change="handleArticleTypeChange">
                            <el-radio :label="true">原创</el-radio>
                            <el-radio :label="false">转载</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <!-- 转载地址：仅当选择"转载"时显示 -->
                    <el-form-item 
                        label="转载地址:" 
                        v-if="!isOriginal"
                        :rules="[{ required: true, message: '请输入转载地址', trigger: 'blur' }]"
                    >
                        <el-input 
                            placeholder="请输入原文完整地址" 
                            v-model="originalUrl"
                        ></el-input>
                    </el-form-item>
                </el-form>
                <p style="margin-bottom: 10px; font-size: 14px; color: #606266;">正文：</p>
                <div style="border: 1px solid #ccc">
                    <Toolbar style="border-bottom: 1px solid #ccc" :editor="editorRef" :defaultConfig="toolbarConfig"
                        :mode="mode" />
                    <Editor style="height: 500px; overflow-y: hidden;" v-model="valueHtml" :defaultConfig="editorConfig"
                        :mode="mode" @onCreated="handleCreated" />
                </div>
                <div class="btn">
                    <!-- 变更：按钮文字改为"修改文章"，绑定新的修改方法 -->
                    <el-button type="primary" @click="updateArticle">修改文章</el-button>
                </div>
            </el-card>
        </div>
        <div class="right">
            <side-bar />
        </div>
    </div>
</template>

<script setup>
import { onBeforeUnmount, ref, shallowRef, onMounted } from 'vue';
import {useRouter, useRoute } from 'vue-router'; // 新增：引入路由，获取传递的文章ID
import SideBar from '../../layout/SideBar/index.vue'
import '@wangeditor/editor/dist/css/style.css' // 引入 wangeditor css
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import useUserStore from '../../store/modules/user';
// 新增：引入获取文章详情、修改文章的接口，保留原有其他接口
import { ReqGetArticleDetail, ReqUpdateArticle, ReqUploadArticleImg, ReqGetCategories, ReqUploadArticleCover } from '../../api/article';
import { ElMessage, ElTreeSelect } from 'element-plus';
import { Plus } from '@element-plus/icons-vue'; // 新增：封面上传图标

// 新增：获取路由实例，提取URL中的文章ID
const router = useRouter();
const route = useRoute();
const articleId = ref(); // 存储当前编辑的文章ID

// 文章表单数据
const title = ref('');
const summary = ref('');
const valueHtml = ref('<p></p>');
const selectedCategoryId = ref('');
const categoryTree = ref([]);

// ========== 新增：补充缺失参数 ==========
const coverImage = ref(''); // 封面图片地址
const visibility = ref('1'); // 可见性：1=公开（默认），0=私密（int类型，用字符串过渡，提交时转数字）
const isOriginal = ref(true); // 是否原创：true=原创（默认），false=转载
const originalUrl = ref(''); // 转载地址

// 编辑器相关
const editorRef = shallowRef()
const toolbarConfig = {}
const editorConfig = { 
    placeholder: '请输入文章正文内容...',
    MENU_CONF: {}
}

// 用户仓库
const UserStore = useUserStore();

// 富文本图片上传配置
editorConfig.MENU_CONF['uploadImage'] = {
  async customUpload(file, insertFn) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        let result = await ReqUploadArticleImg(formData);
        let url;
        if (result) {
            url = `http://127.0.0.1:8080${result}`;
            ElMessage.success('上传文章图片成功');
        }
        insertFn(url, '', '')
    } catch (error) {
        ElMessage.error('上传文章图片失败');
        console.error('图片上传异常：', error);
    }
  },
}

// ========== 新增：分类相关逻辑 ==========
const getCategoryData = async () => {
    try {
        const result = await ReqGetCategories();
        if (result) {
            categoryTree.value = result;
        }
    } catch (error) {
        ElMessage.error('获取分类列表失败');
        console.error('分类获取异常：', error);
    }
}

const handleCategoryChange = (val) => {
    console.log('选中的分类ID：', val);
}

// ========== 新增：封面上传相关逻辑 ==========
/**
 * 封面上传前校验（格式、大小）
 */
const beforeUploadCover = (file) => {
    // 校验图片格式
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
        ElMessage.error('请上传图片格式文件！');
        return false;
    }
    // 校验图片大小（5M以内，可调整）
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
        ElMessage.error('封面图片大小不能超过5MB！');
        return false;
    }
    return true;
}

/**
 * 封面上传核心处理（调用后端接口）
 */
const uploadCoverHandler = async (options) => {
    const file = options.file;
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const result = await ReqUploadArticleCover(formData);
        console.log("外层result:",result);
        if (result) {
            console.log("内层result:",result);
            // 拼接完整封面地址（和正文图片格式保持一致）
            coverImage.value = `http://127.0.0.1:8083${result}`;
            ElMessage.success('封面上传成功');
        }
    } catch (error) {
        ElMessage.error('封面上传失败');
        console.error('封面上传异常：', error);
    }
}

// ========== 新增：文章类型（原创/转载）变更回调 ==========
const handleArticleTypeChange = (val) => {
    // 选择"原创"时，清空转载地址（符合业务要求）
    if (val) {
        originalUrl.value = '';
    }
}

// ========== 新增：获取文章详情（编辑页核心） ==========
/**
 * 根据文章ID获取详情并回显表单
 */
const getArticleDetail = async () => {
    // 校验文章ID是否有效
    if (!articleId.value) {
        ElMessage.error('文章ID无效，无法获取详情');
        return;
    }

    try {
        const res = await ReqGetArticleDetail(articleId.value);
        if (res) { // 适配接口返回格式，确保数据有效
            console.log("res:",res);
            const article = res;
            // 1. 回显基础表单数据
            title.value = article.title || '';
            summary.value = article.summary || '';
            valueHtml.value = article.content || '<p></p>';
            selectedCategoryId.value = article.categoryId || '';
            // 2. 回显新增参数
            coverImage.value = "http://127.0.0.1:8083"+article.coverImage || '';
            visibility.value = article.visibility ? '1' : '0'; // 转为字符串，匹配单选框绑定值
            isOriginal.value = article.isOriginal || true;
            originalUrl.value = article.originalUrl || '';
        } else {
            ElMessage.error('获取文章详情失败');
        }
    } catch (error) {
        ElMessage.error('获取文章详情异常，请稍后重试');
        console.error('文章详情获取失败：', error);
    }
}

// ========== 改造：原发布文章改为修改文章（核心逻辑） ==========
/**
 * 修改文章核心逻辑
 */
const updateArticle = async () => {
    // 1. 表单校验（和创建页保持一致，确保数据完整）
    if (!title.value.trim()) {
        ElMessage.warning('请输入文章标题');
        return;
    }
    if (!summary.value.trim()) {
        ElMessage.warning('请输入文章摘要');
        return;
    }
    if (!valueHtml.value.trim() || valueHtml.value === '<p></p>') {
        ElMessage.warning('请输入文章正文内容');
        return;
    }
    if (!selectedCategoryId.value) {
        ElMessage.warning('请选择文章分类');
        return;
    }
    if (!coverImage.value) { // 封面非空校验（可根据业务调整为可选）
        ElMessage.warning('请上传文章封面');
        return;
    }
    // 转载类型时，校验转载地址
    if (!isOriginal.value && !originalUrl.value.trim()) {
        ElMessage.warning('请输入转载地址');
        return;
    }
    // 2. 校验文章ID是否有效
    if (!articleId.value) {
        ElMessage.error('文章ID无效，无法修改文章');
        return;
    }

    // 3. 构造提交数据（和创建页格式一致，补充所有参数）
    let data = {
        title: title.value.trim(),
        summary: summary.value.trim(),
        content: valueHtml.value,
        username: UserStore.userInfo.username,
        categoryId: selectedCategoryId.value,
        coverImage: coverImage.value,
        visibility: Number(visibility.value), // 转为int类型（1/0）
        isOriginal: isOriginal.value,
        originalUrl: isOriginal.value ? '' : originalUrl.value.trim() // 原创时置为空字符串
    }

    // 4. 调用修改文章接口
    try {
        const result = await ReqUpdateArticle(articleId.value, data);
        if (result) {
            ElMessage.success('修改文章成功');
            router.push('/my/myArticle');
        } else {
            ElMessage.error('修改文章失败：' + (result?.msg || '未知错误'));
        }
    } catch (error) {
        ElMessage.error('修改文章异常，请稍后重试');
        console.error('文章修改失败：', error);
    }
}

// ========== 生命周期 ==========
onMounted(() => {
    // 1. 提取路由中的文章ID（从query中获取）
    const id = route.query.id;
    if (id && !isNaN(Number(id))) {
        console.log("editor:",id);
        articleId.value = Number(id);
    }
    // 2. 获取分类数据
    getCategoryData();
    // 3. 获取文章详情并回显（需在分类数据后执行，确保分类选择正常回显）
    setTimeout(() => {
        getArticleDetail();
    }, 100); // 轻微延时，确保分类数据加载完成
})

onBeforeUnmount(() => {
    const editor = editorRef.value
    if (editor == null) return
    editor.destroy()
})
</script>

<style scoped lang="scss">
// 原有样式保留
.container {
    display: flex;

    .left {
        width: 100%;
        margin-right: 20px;

        .btn {
            display: flex;
            align-items: center;
            justify-content: end;
            margin-top: 20px;
        }
    }

    .right {
        width: 600px;
    }
}

// ========== 新增：封面上传组件样式 ==========
.avatar-uploader {
    width: 200px;
    height: 120px;
    position: relative;

    .avatar-uploader-icon {
        font-size: 28px;
        color: #8c939d;
        width: 200px;
        height: 120px;
        line-height: 120px;
        text-align: center;
        border: 1px dashed #d9d9d9;
        border-radius: 6px;
        cursor: pointer;
    }

    .avatar {
        width: 200px;
        height: 120px;
        border-radius: 6px;
        object-fit: cover;
    }
}

// 树形选择组件样式优化
:deep(.el-tree-select) {
    .el-input__wrapper {
        padding: 0 11px;
    }
}
</style>