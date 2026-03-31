<template>
    <div class="container">
        <div class="left">
            <el-card>
                <el-form>
                    <el-form-item label="标题:">
                        <el-input placeholder="请输入标题" v-model="title"></el-input>
                    </el-form-item>
                    <!-- 移植：分类树形选择组件 -->
                    <el-form-item label="分类:">
                        <el-tree-select
                            v-model="selectedCategoryId"
                            :data="categoryTree"
                            node-key="id"
                            placeholder="请选择问题分类"
                            style="width: 100%;"
                            :props="{ label: 'name', children: 'children' }"
                            @change="handleCategoryChange"
                        ></el-tree-select>
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
                    <el-button type="primary" @click="sendAsk">发布问题</el-button>
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
import SideBar from '../../layout/SideBar/index.vue'
import '@wangeditor/editor/dist/css/style.css' // 引入 css
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import useUserStore from '../../store/modules/user';
import CarouselBanner from '../../components/CarouselBanner/CarouselBanner.vue'

// 移植：导入分类查询接口（和文章发布页一致）
import { ReqAskQuestion, ReqUploadQuestionImg } from '../../api/question';
import { ReqGetCategories } from '../../api/question';
// 移植：导入 ElTreeSelect 组件和 ElMessage（补充缺失）
import { ElMessage, ElTreeSelect } from 'element-plus';

// 原有响应式变量
const title = ref('');
const editorRef = shallowRef()
const valueHtml = ref('<p></p>')
const UserStore = useUserStore();
const toolbarConfig = {}
const editorConfig = { placeholder: '请输入内容...', MENU_CONF: {} }

// 移植：新增分类相关响应式变量（和文章发布页一致）
const selectedCategoryId = ref(''); // 选中的分类ID
const categoryTree = ref([]); // 分类树形数据

// 富文本图片上传配置（保留原有逻辑）
editorConfig.MENU_CONF['uploadImage'] = {
  // 自定义上传
  async customUpload(file, insertFn) {
    const formData = new FormData();
    formData.append('file', file)
    try {
      let result = await ReqUploadQuestionImg(formData);
      let url;
      if (result) {
        url = `http://127.0.0.1:8082${result}`
        ElMessage.success('上传问题图片成功');
        // 插入图片到富文本
        insertFn(url, '', '')
      }
    } catch (error) {
      ElMessage.error('上传问题图片失败');
      console.error('图片上传异常：', error);
    }
  },
}

// 移植：新增分类相关逻辑（和文章发布页一致）
/**
 * 获取分类树形数据
 */
const getCategoryData = async () => {
  try {
    const result = await ReqGetCategories();
    if (result) {
      categoryTree.value = result; // 赋值树形分类数据
    }
  } catch (error) {
    ElMessage.error('获取分类列表失败');
    console.error('分类获取异常：', error);
  }
}

/**
 * 分类变更回调（可选，用于打印日志或额外处理）
 */
const handleCategoryChange = (val) => {
  console.log('选中的问题分类ID：', val);
}

// 编辑器创建回调（保留原有逻辑）
const handleCreated = (editor) => {
  editorRef.value = editor // 记录 editor 实例，重要！
}

// 优化：发布问题核心逻辑（替换硬编码的 categoryId，使用选中的分类ID）
const sendAsk = async () => {
  // 新增：表单校验 - 校验分类是否选中
  if (!title.value.trim()) {
    ElMessage.warning('请输入问题标题');
    return;
  }
  if (!selectedCategoryId.value) {
    ElMessage.warning('请选择问题分类');
    return;
  }
  if (!valueHtml.value.trim() || valueHtml.value === '<p></p>') {
    ElMessage.warning('请输入问题正文内容');
    return;
  }

  // 构造提交数据（替换硬编码的 categoryId 为选中的 selectedCategoryId）
  let data = {
    title: title.value.trim(),
    content: valueHtml.value,
    username: UserStore.userInfo.username,
    categoryId: selectedCategoryId.value // 使用选中的分类ID，不再硬编码为 '1'
  }

  try {
    let result = await ReqAskQuestion(data);
    if (result) {
      // 重置表单数据
      title.value = ''
      valueHtml.value = '<p></p>'
      selectedCategoryId.value = '' // 重置选中的分类
      ElMessage.success('提问问题成功');
    } else {
      ElMessage.error('提问问题失败')
    }
  } catch (error) {
    ElMessage.error('提问问题失败');
    console.error('发布问题异常：', error);
  }
}

// 生命周期：保留原有销毁逻辑，新增挂载时获取分类数据
onMounted(() => {
  // 移植：页面挂载时获取分类树形数据
  getCategoryData();
})

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})
</script>

<style scoped lang="scss">
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

// 移植：优化树形选择组件样式（和文章发布页一致，提升视觉体验）
:deep(.el-tree-select) {
  .el-input__wrapper {
    padding: 0 11px;
  }
}
</style>