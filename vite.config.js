import { fileURLToPath, URL } from 'node:url' // 辅助函数，用于处理路径
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue' // 导入 Vue 插件

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(), // 启用 Vue 插件，让 Vite 能够处理 .vue 单文件组件
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)) // 配置 @ 别名，指向 src 目录
    }
  }
})
