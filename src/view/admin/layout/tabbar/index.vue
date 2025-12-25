<template>
    <div class="tabbar">
        <div class="left">
            <el-icon @click="changeCollapse" style="margin-right: 20px;">
                <component :is="LayoutSetting.isCollapse ? Fold : Expand"></component>
            </el-icon>
            <Breadcrumb />
        </div>
        <div class="right">
            <el-button icon="FullScreen" circle @click="fullScreen"></el-button>
            <el-button icon="Refresh" circle  @click="updateRefresh"></el-button>
            <img :src="UserStore.userInfo.avatarPath?'http://127.0.0.1:8080' + UserStore.userInfo.avatarPath:'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif'" alt="">
            <el-dropdown>
                <span class="el-dropdown-link">
                    {{ UserStore.userInfo.nickname }}
                    <el-icon class="el-icon--right">
                        <arrow-down />
                    </el-icon>
                </span>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item @click="exitLogin">退出登录</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Expand, Fold } from '@element-plus/icons-vue'
import useLayoutSetting from '../../../../store/layoutSetting'
import Breadcrumb from '../breadcrumb/index.vue'
import useUserStore from '../../../../store/modules/user'
import { useRoute, useRouter } from 'vue-router'
const $router = useRouter();
const $route = useRoute()
const UserStore = useUserStore()
const LayoutSetting = useLayoutSetting();
const changeCollapse = () => {
    LayoutSetting.isCollapse = !LayoutSetting.isCollapse
}
const updateRefresh = ()=>{
  LayoutSetting.refresh = !LayoutSetting.refresh
}
const fullScreen = ()=>{
  let full = document.fullscreenElement;
  if(!full){
    document.documentElement.requestFullscreen()
  }else{
    document.exitFullscreen();
  }
}
const exitLogin = ()=>{
    UserStore.exitLogin();
    $router.push({
        path:'/adminLogin',
        query:{
            redirect:$route.path
        }
    })
}
</script>

<style scoped lang="scss">
.tabbar {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    box-sizing: border-box;

    .left {
        display: flex;
        align-items: center;
    }

    .right {
        display: flex;
        align-items: center;

        img {
            margin-left: 30px;
            margin-right: 10px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
        }
    }
}
</style>