// src/main.js

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import '@/assets/base.css'
import { useUserStore } from './stores/user'

const app = createApp(App)
const pinia = createPinia() // 创建 pinia 实例

app.use(pinia) // 注册 pinia

// 将所有的应用初始化和挂载逻辑放入一个立即执行的异步函数中
(async () => {
  // 在应用挂载前初始化用户认证状态
  // 这确保了在路由守卫执行时，用户状态是已知的
  const userStore = useUserStore()
  await userStore.initAuth() // 现在这个 await 是在一个 async 函数内部

  app.use(router)
  app.use(ElementPlus)

  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }

  app.mount('#app')
})(); // 立即执行这个异步函数
