<template>
    <div class="emptyBox">
        <img src="../../assets/image/i-404.png" alt="">
        <p>{{title}}</p>
    </div>
</template>

<script setup lang="ts">
defineProps(['title'])
</script>

<style scoped lang="scss">
.emptyBox{
    text-align: center;
    margin: 40px 0;
}
</style>