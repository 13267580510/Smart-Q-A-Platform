<template>
    <div class="layout-header">
        <div class="left">
            <div class="logo">
                问答
            </div>
            <el-menu mode="horizontal" class="menu" router :default-active="$route.path">
                <el-menu-item index="/home">首页</el-menu-item>
                <el-menu-item index="/answer">等你来答</el-menu-item>
                <el-menu-item index="ask">提问</el-menu-item>
                <el-menu-item index="/ai-chat">AI对话</el-menu-item>
                <el-menu-item index="/articles">文章专栏</el-menu-item>
                <el-menu-item index="/files">资源站</el-menu-item>
                
            </el-menu>
            <div class="search">
                <div style="display: flex; align-items: center;">
                    <el-input placeholder="请输入搜索内容" style="width: 300px;" v-model="keyWord"></el-input>
                    <el-button style="margin-left: 10px;height: 30px;" type="primary" @click="search">搜索</el-button>
                </div>
            </div>
        </div>
        <div class="right">
            <div class="user">
                <el-popover class="box-item" placement="bottom" icon="Bell" title="通知" width="400" trigger="click">
                    <template #reference>
                        <div class="message" style="position: relative;">
                            <el-icon>
                                <Bell />
                            </el-icon>
                            <p>消息</p>
                            <div style="width: 5px;height: 5px;background-color: red; border-radius: 50%;position: absolute;top: 3px;right:8px;"></div>
                        </div>
                    </template>
                    <template #default>
                        <div class="noticeMain" style="overflow: auto;">
                            <ul v-infinite-scroll="load" class="list" :infinite-scroll-disabled="disabled">
                                <template v-for="(item,index) in noticeList" :key="item.id">
                                    <div style="padding: 20px;box-sizing: border-box; border: 1px solid #ccc;margin-bottom: 10px;">
                                    <div class="title">通知内容：{{item.notificationContent}}</div>
                                    <div style="margin-top: 10px;">发送者：管理员</div>
                                    <div style="margin-top: 10px;">发布时间: {{ formatTimestamp(item.notificationTime) }}</div>
                                </div>
                                </template>
                            </ul>
                            <p v-if="loading" style="text-align: center;">加载中...</p>
                            <p v-if="noMore" style="text-align: center;">已经到低啦~</p>
                        </div>
                    </template>
                </el-popover>
                <div class="userBox">
                        <div class="avatar-container" @click="handleAvatarClick">
                        <img 
                        :src="defaultAvatar"
                        class="user-avatar"
                        ref="avatarImg"
                        >
                        </div>
                        <el-dropdown>
                        <span class="el-dropdown-link">
                            {{ UserStore.userInfo?.nickname || '登录' }}
                            <el-icon class="el-icon--right">
                            <arrow-down />
                            </el-icon>
                        </span>
                        <template #dropdown>
                            <el-dropdown-menu>
                            <el-dropdown-item @click="goMy">我的主页</el-dropdown-item>
                            <el-dropdown-item @click="exit">退出登录</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                        </el-dropdown>
                    </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router';
import useUserStore from '../../store/modules/user';
import { ReqGetUserNotice } from '../../api/noctice';
import { formatTimestamp } from '../../utils/general';
import notLoginAvatar from '../../assets/icons/not_login_avat.svg';
import defaultAvatar from '../../assets/icons/default_avat.svg'
const $router = useRouter()
const $route = useRoute()
const UserStore = useUserStore();
const page = ref(0);
const loading = ref(false)
const noticeList = ref([])
const noMore = ref(false)
const disabled = computed(() => loading.value || noMore.value)
const getNotice = async () => {
    page.value++;
    console.log(page.value)
    let result = await ReqGetUserNotice(page.value, 5);
    console.log(result)
    if (result.status === 200) {
        if (result.data.data.length != 0) {
            result.data.data.forEach(item => noticeList.value.push(item))
        }else{
            noMore.value = true;
        }
    }
}
const load = () => {
  loading.value = true
  setTimeout(() => {
    getNotice();
    loading.value = false
  }, 2000)
}

const state1 = ref('')
const keyWord = ref('')
const restaurants = ref<RestaurantItem[]>([])
let timer: any = null;
const querySearch = (queryString: string, cb: any) => {
    console.log(queryString)
    const results = queryString
        ? restaurants.value.filter(createFilter(queryString))
        : restaurants.value
    // call callback function to return suggestions
    cb(results)
}
const createFilter = (queryString: string) => {
    return (restaurant: RestaurantItem) => {
        return (
            restaurant.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0
        )
    }
}
const inpKeyword = () => {
    console.log(state1.value)
}
const loadAll = () => {
    // let result = await ReqSearchQuestion(1,5,'j');
    return [
        { value: 'vue' },
        { value: 'element' },
        { value: 'cooking' },
        { value: 'mint-ui' },
        { value: 'vuex' },
        { value: 'vue-router' },
        { value: 'babel' },
    ]
}

// const getSearchQuestionList = async ()=>{
//     let result = await ReqSearchQuestion(1,5,'j');
//     if(result.status == 200){
//         let list = [];
//         result.data.data.forEarch((item:any)=>{
//             list.push({value:item.questionTitle,data:item})
//             restaurants.value = list;
//         })

//     }
// }

const handleSelect = (item: Record<string, any>) => {
    console.log(item)
}


const search = () => {
    $router.push({
        path:'/search',
        query:{
            keyword:keyWord.value
        }
    })
}
const goMy = () => {
    $router.push('/my')
}
const exit = () => {
    UserStore.exitLogin();
    $router.push('/login')
}



// 处理头像点击事件
const handleAvatarClick = () => {
  // 检查是否登录（通过token判断）
  if (UserStore.isLoggedIn) {
    // 已登录：跳转到个人中心
    UserStore.goToUserCenter();
  } else {
    // 未登录：跳转到登录页
    UserStore.goToLogin();
    // 可以添加一个提示信息
    ElMessage({
      message: '请先登录',
      type: 'warning',
      duration: 1500
    });
  }
};
// 头像计算属性
const userAvatar = computed(() => {
    if (!UserStore.isLoggedIn) {
        return notLoginAvatar;
    }
    
    if (!UserStore.userInfo?.avatarPath) {
        return defaultAvatar;
    }
    
    // 调用函数处理路径
    const completePath = getCompleteImageUrl(UserStore.userInfo.avatarPath);
    console.log('计算头像路径:', {
        originalPath: UserStore.userInfo.avatarPath,
        completePath: completePath,
        isLoggedIn: UserStore.isLoggedIn
    });
    return completePath;
});

// 图片加载错误处理
const handleAvatarError = (event: Event) => {
    console.error('头像加载失败:', event);
    const img = event.target as HTMLImageElement;
    
    // 如果当前不是默认头像，尝试使用默认头像
    if (img.src !== defaultAvatar) {
        img.src = defaultAvatar;
        // 防止默认头像也出错时的递归
        img.onerror = null;
    }
};

// 获取完整图片URL的函数
const IMAGE_PREFIX = 'http://127.0.0.1:8080';
const getCompleteImageUrl = (imagePath) => {
    console.log("获取图片URL - 输入路径:", imagePath);
    
    // 如果是undefined或null，返回空字符串
    if (!imagePath || imagePath === 'undefined' || imagePath === 'null') {
        console.log("图片路径为空，返回空字符串");
        return '';
    }
    
    // 如果已经是完整URL，直接返回
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        console.log("已经是完整URL:", imagePath);
        return imagePath;
    }
    
    // 处理可能的路径格式
    let processedPath = imagePath;
    // 如果路径不以斜杠开头，添加斜杠
    if (!processedPath.startsWith('/')) {
        processedPath = '/' + processedPath;
    }
    
    const completeUrl = IMAGE_PREFIX + processedPath;
    console.log("生成的完整URL:", completeUrl);
    return completeUrl;
};

onMounted(() => {
    console.log('组件挂载完成');
    
  //    getSearchQuestionList();
    getNotice();
    
})
</script>

<style scoped lang="scss">
.el-menu--horizontal {
    --el-menu-horizontal-height: 80px;
}

.layout-header {
    width: 100%;
    height: 80px;
    padding: 0 140px;
    background-color: #fff;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .left {
        display: flex;
        align-items: center;

        .logo {
            font-size: 40px;
            color: #1772F6;
        }

        .menu {
            margin-left: 30px;
            width: 350px;
        }

        .search {
            height: 30px;

            .search-inp {
                width: 400px;
                height: 30px;

                .el-input__inner {
                    border-radius: px;
                }
            }

            .search-show {
                width: 400px;
                margin-top: 10px;
                position: absolute;
                z-index: 999;

                .title {
                    font-size: 12px;
                    padding: 0 0 10px 0;
                    color: #8491A5;
                    border-bottom: 1px solid #EBECED;
                }

                .item {
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    font-size: 14px;
                    padding: 10px 0;

                    div {
                        margin-left: 10px;
                    }
                }

                .item:hover {
                    background-color: #F8F8FA;
                }

            }

            .search-content {
                width: 400px;
                margin-top: 10px;
                position: absolute;
                z-index: 999;

                .item {
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    font-size: 14px;
                    padding: 10px 0;

                    div {
                        margin-left: 10px;
                    }
                }

                .item:hover {
                    background-color: #F8F8FA;
                }

            }
        }

    }

    .right {
        .user {
            display: flex;
            align-items: center;
            margin-left: 50px;
            text-align: center;
            color: #8491A5;

            div {
                margin-left: 20px;
                font-size: 14px;
            }

            .message,
            .talk {
                cursor: pointer;
            }

            .userBox {
                display: flex;
                align-items: center;

                img {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                }
            }
        }
    }
}
.noticeMain{
    margin-top: 10px;
    height: 300px;
    overflow: auto;
}
/* 原有样式基础上，确保头像样式正确 */
.user-avatar {
  width: 40px !important;
  height: 40px !important;
  border-radius: 50%;
  cursor: pointer;
  display: block !important;
  object-fit: cover !important; /* 确保图片按比例缩放填充 */
  border: 2px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}
/* 调试用样式，确保元素可见 */
.avatar-container {
  display: block;
  visibility: visible !important;
  opacity: 1 !important;
}
</style>