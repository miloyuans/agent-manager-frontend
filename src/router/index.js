// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import { useUserStore } from '../stores/user'
import { authService } from '../services/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
      component: AdminLayout,
      meta: { requiresAuth: true, title: '首页' }, // 添加 title 便于面包屑显示
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
          meta: { title: '仪表盘' }
        },
        {
          path: 'devices',
          name: 'devices',
          component: () => import('../views/DevicesView.vue'),
          meta: { title: '设备管理' }
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('../views/UsersView.vue'),
          meta: { title: '用户管理' }
        },
        {
          path: 'bindings',
          name: 'bindings',
          component: () => import('../views/BindingsView.vue'),
          meta: { title: '绑定管理' }
        },
        {
          path: 'rules',
          name: 'rules',
          component: () => import('../views/RulesView.vue'), // 假设您会创建此视图
          meta: { title: '规则管理' }
        }
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: { template: '<div>Redirecting to Keycloak...</div>' },
      meta: { title: '登录' }
    },
    {
      path: '/callback',
      name: 'callback',
      component: { template: '<div>Processing login...</div>' },
      meta: { title: '认证回调' },
      beforeEnter: async (to, from, next) => {
        try {
          await authService.handleKeycloakCallback()
          const userStore = useUserStore()
          const userProfile = await authService.getUserProfile()
          userStore.setUser(userProfile)
          next('/')
        } catch (error) {
          console.error('Keycloak callback failed:', error)
          // 提示错误信息
          alert('登录失败，请重试。' + error.message);
          next('/login')
        }
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: { template: '<el-result icon="error" title="404 Not Found" sub-title="很抱歉，您访问的页面不存在"></el-result>' },
      meta: { title: '页面未找到' }
    }
  ]
})

// 路由守卫：检查认证状态
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  // --- 开发模式跳过认证 ---
  if (import.meta.env.VITE_SKIP_AUTH === 'true' && to.meta.requiresAuth) {
    if (!userStore.isAuthenticated) {
      // 在开发模式下，如果未认证，则模拟一个用户状态
      userStore.setUser({
        preferred_username: 'dev_user',
        email: 'dev@hubx.com',
        sub: 'dev_user_id_123',
        roles: ['admin', 'operator'] // 模拟赋予一些角色
      });
      userStore.setTokens('dummy_access_token', 'dummy_refresh_token');
    }
    console.warn('开发模式：跳过认证，直接进入页面。')
    return next()
  }
  // --- 开发模式跳过认证 结束 ---


  if (to.meta.requiresAuth) {
    if (!userStore.isAuthenticated) {
      const token = authService.getAccessToken()
      if (token) {
        try {
          // 尝试获取用户信息，如果 token 有效则会更新用户状态
          const userProfile = await authService.getUserProfile()
          userStore.setUser(userProfile) // 确保用户状态被更新
          next()
        } catch (error) {
          // Token 可能过期或无效，重定向到 Keycloak 登录
          console.error('Token is invalid or expired, redirecting to login:', error)
          authService.redirectToKeycloakLogin()
        }
      } else {
        // 没有 Token，重定向到 Keycloak 登录
        authService.redirectToKeycloakLogin()
      }
    } else {
      next() // 已认证，继续
    }
  } else {
    next() // 不需要认证的页面，继续
  }
})

export default router
