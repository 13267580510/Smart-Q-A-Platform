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
                            :src="avatarUrl"
                            alt="用户头像"
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
// 添加图片加载和错误处理
const avatarImg = ref<HTMLImageElement | null>(null);

onMounted(() => {
    console.log('组件挂载完成');
    
  //    getSearchQuestionList();
    getNotice();
    
  // 检查样式
  setTimeout(() => {
    if (avatarImg.value) {
      const style = window.getComputedStyle(avatarImg.value);
      console.log('头像元素样式:', {
        display: style.display,
        visibility: style.visibility,
        width: style.width,
        height: style.height,
        opacity: style.opacity,
        position: style.position,
        zIndex: style.zIndex
      });
    }
  }, 100);

  if(!UserStore.isLoggedIn){
    console.log("用户未登录");
      avatarImg.value.src = notLoginAvatar;
    console.log('头像元素:', avatarImg.value.src);
  }else{
     if (!UserStore.userInfo?.avatarPath) {
        // 如果没有头像，返回默认头像
        avatarImg.value.src = defaultAvatar;
    }else{
         avatarImg.value.src = UserStore.userInfo.avatarPath
    }
  }
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
.user-avatar {
  width: 40px !important;
  height: 40px !important;
  border-radius: 50%;
  cursor: pointer;
  display: block; /* 重要：确保是块级显示 */
  visibility: visible !important; /* 确保可见 */
  opacity: 1 !important; /* 确保不透明 */
  border: 1px solid #ccc; /* 添加边框以便调试 */
  background-color: #f0f0f0; /* 添加背景色以便调试 */
}
</style>