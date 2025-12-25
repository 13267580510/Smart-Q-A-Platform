<template>
    <div class="layout">
        <layout-header />
        <div class="layout-main">
            <router-view></router-view>
        </div>
    </div>
</template>

<script setup lang="ts">
import useUserStore from '../store/modules/user';
import LayoutHeader from './LayoutHeader/index.vue'
let UserStore = useUserStore();
let menuList = UserStore.menuList;
console.log(menuList);
</script>

<style scoped lang="scss">
.el-menu--horizontal {
    --el-menu-horizontal-height: 80px;
}

.layout {
    width: 100vw;
    height: 100vh;
    overflow: auto;
    background-color: rgb(244, 246, 249);

    .layout-main {
        margin-top: 20px;
        width: 100vw;
        padding: 0 250px;
        box-sizing: border-box;

    }
}
</style>