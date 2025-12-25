<template>
    <router-view v-slot="{Component}">
        <transition name="fade">
            <component :is="Component" v-if="flag"></component>
        </transition>
    </router-view>
</template>

<script setup lang="ts">
import { ref ,watch ,nextTick} from 'vue';
import useLayoutSetting from '../../../../store/layoutSetting';
let flag = ref(true);
let LayOutSettingStore = useLayoutSetting();
watch(()=>LayOutSettingStore.refresh,()=>{
    flag.value = false;
    nextTick(()=>{
        flag.value = true
    })
})
</script>

<style scoped lang="scss">
    .fade-enter-from{
        opacity: 0;
        transform: scale(0);
    }
    .fade-enter-active{
        transition: all 1s;
    }
    .fade-enter-to{
        opacity: 1;
        transform: scale(1);
    }
</style>