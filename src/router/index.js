import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import { useUserStore } from '../stores/user' // 假设有用户状态管理
import { authService } from '../services/auth' // 导入认证服务

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard', // 默认重定向到仪表盘
      component: AdminLayout,
      meta: { requiresAuth: true }, // 需要认证
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue')
        },
        {
          path: 'devices',
          name: 'devices',
          component: () => import('../views/DevicesView.vue')
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('../views/UsersView.vue')
        },
        {
          path: 'bindings',
          name: 'bindings',
          component: () => import('../views/BindingsView.vue')
        }
      ]
    },
    {
      path: '/login', // 登录页面（用户将被重定向到Keycloak）
      name: 'login',
      component: { template: '<div>Redirecting to Keycloak...</div>' } // 仅作占位
    },
    {
      path: '/callback', // Keycloak 回调路由
      name: 'callback',
      component: { template: '<div>Processing login...</div>' },
      beforeEnter: async (to, from, next) => {
        try {
          // 处理 Keycloak 回调，交换 token
          await authService.handleKeycloakCallback()
          const userStore = useUserStore()
          // 获取用户信息并存储
          const userProfile = await authService.getUserProfile()
          userStore.setUser(userProfile)
          next('/') // 登录成功，重定向到主页
        } catch (error) {
          console.error('Keycloak callback failed:', error)
          next('/login') // 失败重定向到登录页
        }
      }
    },
    {
      path: '/:pathMatch(.*)*', // 404 页面
      name: 'NotFound',
      component: { template: '<el-result icon="error" title="404 Not Found" sub-title="很抱歉，您访问的页面不存在"></el-result>' }
    }
  ]
})

// 路由守卫：检查认证状态
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth) {
    if (!userStore.isAuthenticated) {
      // 检查本地是否有 Token，尝试静默刷新或重新登录
      const token = authService.getAccessToken()
      if (token) {
        // 如果有 token，尝试获取用户信息并验证
        try {
          const userProfile = await authService.getUserProfile()
          userStore.setUser(userProfile)
          next()
        } catch (error) {
          // Token 可能过期或无效，重定向到 Keycloak 登录
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
