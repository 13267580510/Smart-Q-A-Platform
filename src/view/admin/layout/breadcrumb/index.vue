<template>
    <el-breadcrumb :separator-icon="ArrowRight" style="height: 100%;">
        <el-breadcrumb-item v-for="(item,index) in $route.matched" :key="index" :to="item.path" v-show="item.meta.title">
          <div style="display: flex;">
            <el-icon style="margin: 0 5px; vertical-align: middle;">
            <component :is="item.meta.icon"></component>
          </el-icon>
          <span>{{ item.meta.title }}</span>
          </div>
        </el-breadcrumb-item>
    </el-breadcrumb>
</template>

<script setup lang="ts">
import {ArrowRight} from '@element-plus/icons-vue'
import { useRoute } from 'vue-router';
const $route = useRoute();
console.log($route.matched);
</script>

<style scoped></style>