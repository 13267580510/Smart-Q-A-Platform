// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

// 手动定义 __dirname（适配 ESM 模块环境）
const __filename = fileURLToPath(import.meta.url)
// 去掉错误的 Type 注解，让 TS 自动推导类型
const __dirname = resolve(__filename, '..')

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    open: true,
    // 新增：配置代理转发，解决跨域并指向后端 localhost:8080
    proxy: {
      // 匹配所有以 /api 开头的请求路径（对应 Axios 中的 baseURL: '/api'）
      '/api': {
        target: 'http://localhost:8080', // 后端接口的基础地址
        changeOrigin: true, // 开启跨域模拟（关键配置）
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src') 
    }
  }
})