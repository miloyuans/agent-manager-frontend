// src/main.js

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import '@/assets/base.css'
import { useUserStore } from './stores/user' // 导入 user store

const app = createApp(App)
const pinia = createPinia() // 创建 pinia 实例

// --- 关键修改：先注册所有插件 ---
app.use(pinia) // 1. Pinia 必须先注册，这样 useUserStore() 才能正常工作
app.use(router) // 2. Vue Router 必须在应用挂载前注册
app.use(ElementPlus) // 3. Element Plus 也应该在挂载前注册

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
// --- 关键修改结束 ---


// 将所有的应用初始化和挂载逻辑放入一个立即执行的异步函数中
(async () => {
  // 此时，useUserStore() 就可以安全地被调用了
  const userStore = useUserStore()
  await userStore.initAuth() // 使用 await 确保异步操作完成

  // 最后，在所有初始化完成后挂载应用
  app.mount('#app')
})();
