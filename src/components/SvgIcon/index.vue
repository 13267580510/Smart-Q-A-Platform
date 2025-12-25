<template>
    <svg>
        <use :xlink:href="profix + name" :fill="fillColor" :style="{width,height}">
        </use>
    </svg>
</template>

<script setup lang="ts">
    defineProps({
        profix:{
            type:String,
            default:"#icon-"
        },
        name:String,
        width:{
            type:String,
            default:"16px"
        },
        height:{
            type:String,
            default:"16px"
        },
        fillColor:String
    })
</script>

<style scoped>

</style>