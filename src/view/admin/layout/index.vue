<template>
    <div class="admin">
        <div class="menuBox" :class="[{fold:LayoutSetting.isCollapse}]">
            <div class="header">
                <img src="../../../assets/image/logo.png" alt="">
                <p>问答后台管理系统</p>
            </div>
            <el-scrollbar class="menu">
                <el-menu background-color="#001529" text-color="white"  :default-active="$route.path" router style="border: none;" :collapse="LayoutSetting.isCollapse">
                    <Menu></Menu>
                </el-menu>
            </el-scrollbar>
        </div>
        <div class="tabBar" :class="[{mfold:LayoutSetting.isCollapse}]">
            <Tabbar />
        </div>
        <div class="main" :class="[{mfold:LayoutSetting.isCollapse}]">
            <Main></Main>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import Main from '../layout/main/index.vue'
import Menu from '../layout/menu/index.vue'
import Tabbar from './tabbar/index.vue'
import useLayoutSetting from '../../../store/layoutSetting';
const $route = useRoute();
const LayoutSetting = useLayoutSetting();
</script>

<style scoped lang="scss">
.admin{
    width: 100vw;
    height: 100vh;
    .menuBox{
        width: 220px;
        height: 100%;
        background-color: rgb(0, 21, 43);
        position: absolute;
        top: 0;
        left: 0;
        transition: all .5s;
        .header{
            width: 100%;
            height: 50px;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            img{
                width: 40px;
                height: 40px;
                margin-right: 10px;
            }
        }
        .menu{
            height: calc(100% - 50px)
        }
    }
    .fold{
        width: 70px;
        p{
            display: none;
        }
    }
    .tabBar{
        width: calc(100% - 220px);
        height: 50px;
        position: absolute;
        top: 0;
        left: 220px;
        border-bottom: 1px solid #ccc;
        transition: all .5s;
    }
    .main{
        width: calc(100% - 220px);
        height: calc(100%  - 50px);
        position: absolute;
        top: 50px;
        left: 220px;
        padding: 20px;
        box-sizing: border-box;
        transition: all .5s;
        overflow: auto;
    }
    .mfold{
        width: calc(100% - 70px);
        left: 70px;
    }
}
</style>