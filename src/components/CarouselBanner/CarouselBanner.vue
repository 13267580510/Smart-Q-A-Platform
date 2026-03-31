<template>
  <div class="carousel-banner-container" :style="{ height: bannerHeight }">
    <el-carousel
      :height="bannerHeight"
      indicator-position="bottom"
      autoplay
      :interval="autoplayInterval"
      arrow="hover"
      class="carousel-wrapper"
    >
      <el-carousel-item v-for="(img, index) in carouselImages" :key="index">
        <img :src="img" alt="轮播图" class="carousel-img" />
      </el-carousel-item>
    </el-carousel>
  </div>
</template>

<script setup>
import { ElCarousel, ElCarouselItem } from 'element-plus';
import { defineProps, ref } from 'vue';

import l1 from '../../assets/image/l1.jpg';
import l2 from '../../assets/image/l2.jpg';
import l3 from '../../assets/image/l3.jpg';
import l4 from '../../assets/image/l4.jpg';
import l5 from '../../assets/image/l5.jpg';

const carouselImages = ref([
  l1, l2, l3, l4, l5
]);

// 直接在运行时对象 props 中设置 default，不使用 withDefaults（无 TS 也可运行）
const props = defineProps({
  // 轮播图高度（默认100px）
  bannerHeight: {
    type: String,
    default: '100px'
  },
  // 自动轮播间隔（默认3000毫秒）
  autoplayInterval: {
    type: Number,
    default: 3000
  }
});
</script>

<style lang="scss" scoped>
.carousel-banner-container {
  width: 100%;
  margin: 0;
  padding: 0;
}

.carousel-wrapper {
  width: 100%;
  height: 100%;
}

.carousel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}
</style>