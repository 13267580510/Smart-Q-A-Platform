<template>
    <div class="answer">
        <div class="left">
            <el-card>
                <!-- 新增：组合筛选栏（分类 + 解决状态，横向排列） -->
                <div class="filter-bar" style="margin-bottom: 16px; padding-left: 4px; display: flex; gap: 16px; align-items: center;">
                    <!-- 分类树形筛选 -->
                    <div class="category-filter" style="width: 280px;">
                        <el-tree-select
                            v-model="selectedCategoryId"
                            :data="categoryTree"
                            node-key="id"
                            placeholder="请选择问题分类"
                            style="width: 100%;"
                            :props="{ label: 'name', children: 'children' }"
                            @change="handleFilterChange"
                        ></el-tree-select>
                    </div>
                    <!-- 解决状态筛选 -->
                    <div class="status-filter" style="width: 200px;">
                        <el-select 
                            v-model="currentSolveStatus" 
                            placeholder="请选择问题状态" 
                            style="width: 100%;"
                            @change="handleFilterChange"
                        >
                            <el-option label="所有" value="ALL" />
                            <el-option label="已解决" value="SOLVED" />
                            <el-option label="未解决" value="UNSOLVED" />
                        </el-select>
                    </div>
                </div>

                <div class="infinite-container">
                    <ul v-infinite-scroll="load" class="list" :infinite-scroll-disabled="disabled">
                        <li v-for="(item, index) in questionList" :key="item.id">
                            <div class="item">
                                <div class="left-item">
                                    <div class="title" @click="goDetail(item.id)">{{ item.title }}</div>
                                    <div class="txt">
                                        {{ item.viewCount }} 浏览 · {{ item.answerCount }} 回答 · {{ formatTimestamp(item.createdTime) }}发布
                                        <!-- 新增：显示问题分类名称（可选，提升直观性） -->
                                        <span v-if="item.categoryName" class="category-txt">· {{ item.categoryName }}</span>
                                    </div>
                                    <!-- 解决状态标签 -->
                                    <div class="status-tag" v-if="item.isSolved">
                                        <el-tag type="success" size="small">已解决</el-tag>
                                    </div>
                                    <div class="status-tag" v-else>
                                        <el-tag type="info" size="small">未解决</el-tag>
                                    </div>
                                </div>
                                <div class="right-item" style="margin-right: 20px;">
                                    <el-button :icon="Edit" @click="answer(item)">写回答</el-button>
                                </div>
                            </div>
                        </li>
                    </ul>
                    <p v-if="loading" style="text-align: center;">加载中...</p>
                    <p v-if="noMore" style="text-align: center;">已经到低啦~</p>
                </div>
            </el-card>
        </div>
        <div class="right">
            <side-bar />
        </div>
    </div>
    <el-dialog v-model="isAnswer" title="回答问题" width="800">
        <div style="text-align: center;margin-bottom: 20px;">
            <h2>{{ questionObj.title }}</h2>
        </div>
        <div style="border: 1px solid #ccc">
            <Toolbar style="border-bottom: 1px solid #ccc" :editor="editorRef" :defaultConfig="toolbarConfig"
                :mode="mode" />
            <Editor style="height: 300px; overflow-y: hidden;" v-model="valueHtml" :defaultConfig="editorConfig"
                :mode="mode" @onCreated="handleCreated" />
        </div>
        <div style="margin-top: 30px; display: flex;">
            <el-button style="flex: 1;" @click="isAnswer = false">取消</el-button>
            <el-button type="primary" style="flex: 1;" @click="sendAnswer">确定</el-button>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import { DocumentAdd, Edit } from '@element-plus/icons-vue'
import SideBar from '../../layout/SideBar/index.vue'
import { useRouter } from 'vue-router'
import { ref, computed, onMounted, shallowRef, onBeforeUnmount } from 'vue';
import { ReqGetQuestionAll } from '../../api/question';
import { formatTimestamp } from '../../utils/general';
import '@wangeditor/editor/dist/css/style.css' // 引入 css
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { ReqSendAnswer, ReqUploadAnswerImg } from '../../api/answer';
import { ElMessage, ElTag, ElTreeSelect } from 'element-plus'; // 新增：导入 ElTreeSelect
import useUserStore from '../../store/modules/user';

// 新增：导入分类查询接口（和发布页一致）
import { ReqGetCategories } from '../../api/article';

const editorRef = shallowRef()
const valueHtml = ref('')
const toolbarConfig = {}
const editorConfig: any = { placeholder: '请输入内容...', MENU_CONF: {} }
const UserStore = useUserStore();
const $router = useRouter();
const isAnswer = ref(false)
const page = ref(0);
const questionList = ref([]);

// 1. 解决状态筛选相关（保留原有）
const currentSolveStatus = ref('ALL');
// 2. 分类筛选相关（复用发布页逻辑）
const selectedCategoryId = ref(''); // 选中的分类ID
const categoryTree = ref([]); // 分类树形数据
// 分页相关状态
const noMore = ref(false)
const loading = ref(false)
const disabled = computed(() => loading.value || noMore.value)

const goDetail = (id: number) => {
    $router.push({
        path: '/questionDetail',
        query: {
            id
        }
    })
}

const questionObj = ref({})
const answer = (item: any) => {
    questionObj.value = item;
    isAnswer.value = true
}

// 3. 组合筛选变更事件（任一筛选条件变化，都重置分页重新加载）
const handleFilterChange = () => {
    // 重置分页相关状态
    page.value = 0;
    questionList.value = [];
    noMore.value = false;
    // 重新加载第一页数据
    getQuestion();
}

const load = () => {
    loading.value = true
    setTimeout(() => {
        getQuestion();
        loading.value = false
    }, 2000)
}

const getQuestion = async () => {
    page.value++;
    console.log(page.value, '当前页码，分类：', selectedCategoryId.value, '解决状态：', currentSolveStatus.value)
    let result = await ReqGetQuestionAll(page.value, 10);
    console.log(result)
    if (result) {
        let filteredData = result.data;

        // 4. 组合筛选逻辑（先分类，后解决状态，顺序不影响结果，提升可读性）
        // 第一步：筛选分类（选中了分类才过滤）
        if (selectedCategoryId.value) {
            filteredData = filteredData.filter((item: any) => {
                // 匹配问题的 categoryId 和选中的分类ID（注意类型转换，避免字符串/数字不匹配）
                return String(item.categoryId) === String(selectedCategoryId.value);
            });
        }

        // 第二步：筛选解决状态（非 ALL 才过滤）
        if (currentSolveStatus.value !== 'ALL') {
            filteredData = filteredData.filter((item: any) => {
                if (currentSolveStatus.value === 'SOLVED') {
                    return !!item.isSolved; // 已解决：isSolved 存在
                } else if (currentSolveStatus.value === 'UNSOLVED') {
                    return !item.isSolved; // 未解决：isSolved 不存在
                }
                return true;
            });
        }

        // 处理筛选后的数据
        if (filteredData.length !== 0) {
            filteredData.forEach(item => questionList.value.push(item))
        } else {
            // 若当前页筛选后无数据，且是第一页，清空列表；否则标记无更多
            if (page.value === 1) {
                questionList.value = [];
            }
            noMore.value = true;
        }
    }
}

// 富文本图片上传配置（保留原有）
editorConfig.MENU_CONF['uploadImage'] = {
    async customUpload(file: any, insertFn: any) {
        const formData = new FormData();
        formData.append('file', file)
        let result = await ReqUploadAnswerImg(formData);
        let url;
        if (result.status == 201) {
            url = `http://127.0.0.1:8080${result.data}`
            ElMessage.success('上传回答图片成功');
        }
        console.log(url)
        insertFn(url, '', '')
    },
}

const sendAnswer = async () => {
    let data = {
        answerTime: new Date().toISOString(),
        questionId: questionObj.value.id,
        userId: UserStore.userInfo.id,
        content: valueHtml.value
    }
    let result = await ReqSendAnswer(data);
    if (result) {
        valueHtml.value = '';
        ElMessage.success('发布回答成功');
        isAnswer.value = false;
        // 发布成功后，刷新组合筛选列表
        handleFilterChange();
    } else {
        valueHtml.value = '';
        ElMessage.error('发布回答失败');
        isAnswer.value = false;
    }
}

// 5. 复用：获取分类树形数据（和发布页一致）
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

// 组件销毁时，销毁编辑器
onBeforeUnmount(() => {
    const editor = editorRef.value
    if (editor == null) return
    editor.destroy()
})

const handleCreated = (editor: any) => {
    editorRef.value = editor // 记录 editor 实例
}

onMounted(() => {
    // 先获取分类数据，再加载问题列表
    getCategoryData().then(() => {
        getQuestion();
    });
})
</script>

<style scoped lang="scss">
.answer {
    width: 100%;
    display: flex;

    .left {
        width: 100%;
        margin-right: 20px;

        .infinite-container {
            max-height: 100vh;
            overflow-y: auto;
        }

        /* 自定义滚动条样式 */
        .infinite-container::-webkit-scrollbar {
            width: 6px;
        }

        .infinite-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }

        .infinite-container::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 10px;
        }

        .infinite-container::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
        }

        .item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 20px 0;
            box-sizing: border-box;
            border-bottom: 1px solid #E9EAEB;

            .left-item {
                .title {
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-bottom: 8px;
                }

                .txt {
                    color: #9196A1;
                    font-size: 14px;
                    margin-bottom: 8px;

                    // 分类文本样式
                    .category-txt {
                        color: #606266;
                        font-size: 13px;
                    }
                }

                .status-tag {
                    margin-bottom: 4px;
                }
            }

            .right-item {
                display: flex;
                justify-content: end;
                margin-top: 4px;

                button:nth-child(2) {
                    background-color: #1772F6;
                    color: #fff;
                }

                button:nth-child(1) {
                    color: #1772F6;
                    border-color: #1772F6;
                }
            }
        }
    }

    .right {
        width: 600px;
    }
}

// 复用：优化树形选择组件样式（和发布页一致）
:deep(.el-tree-select) {
    .el-input__wrapper {
        padding: 0 11px;
    }
}
</style>