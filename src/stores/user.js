import { defineStore } from 'pinia'
import { authService } from '../services/auth' // 导入认证服务

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null, // 存储用户 Keycloak profile 信息
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    roles: []
  }),
  getters: {
    userName: (state) => state.user ? state.user.preferred_username : '访客',
    userEmail: (state) => state.user ? state.user.email : '',
    hasRole: (state) => (role) => state.roles.includes(role)
  },
  actions: {
    setUser(profile) {
      this.user = profile
      this.isAuthenticated = true
      // 从 profile 中提取角色，Keycloak 通常会在 access token 中返回 roles
      // 这里简化处理，实际需要解析 JWT 或者从 Keycloak UserInfo 端点获取
      this.roles = profile.realm_access?.roles || []
      localStorage.setItem('userProfile', JSON.stringify(profile)); // 存储到 localStorage
    },
    setTokens(accessToken, refreshToken) {
      this.accessToken = accessToken
      this.refreshToken = refreshToken
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
    },
    clearUser() {
      this.user = null
      this.isAuthenticated = false
      this.accessToken = null
      this.refreshToken = null
      this.roles = []
      localStorage.removeItem('userProfile');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
    async initAuth() {
      // 在应用启动时尝试从 localStorage 恢复认证状态
      const storedAccessToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const storedUserProfile = localStorage.getItem('userProfile');

      if (storedAccessToken && storedRefreshToken && storedUserProfile) {
        this.accessToken = storedAccessToken;
        this.refreshToken = storedRefreshToken;
        this.user = JSON.parse(storedUserProfile);
        this.isAuthenticated = true;
        // 尝试刷新 token 确保有效性
        try {
          await authService.refreshAccessToken();
          // 刷新成功，更新 token
          this.accessToken = localStorage.getItem('accessToken');
          this.refreshToken = localStorage.getItem('refreshToken');
        } catch (error) {
          console.error('Failed to refresh token during init:', error);
          this.clearUser(); // 刷新失败，清空用户状态
        }
      }
    }
  }
})
