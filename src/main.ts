// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import store from './store';
import router from './router'
import "./styles/index.scss"; // 确保 src/styles/index.scss 已创建

// 新版 Element Plus 推荐的样式路径（Windows 兼容）
import 'element-plus/theme-chalk/index.css'

// @ts-ignore 临时忽略 TypeScript 类型报错（先启动项目）
import ElementPlus from 'element-plus';
// @ts-ignore
import { zhCn } from 'element-plus/es/locales.mjs';

import globalComponent from './components/index'

const app = createApp(App);
app.use(ElementPlus, {
    locale: zhCn
});

// import "./permission"; // 仍注释（文件未创建，后续补）
app.use(store);
app.use(router)
app.use(globalComponent)
app.mount('#app')