// src/stores/user.js

import { defineStore } from 'pinia'
import { authService } from '../services/auth'

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
      this.roles = profile.realm_access?.roles || profile.roles || [] // 从 profile 或模拟数据中获取角色
      localStorage.setItem('userProfile', JSON.stringify(profile));
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
      // 如果在开发模式且跳过认证，则直接设置模拟用户
      if (import.meta.env.VITE_SKIP_AUTH === 'true') {
        const storedProfile = localStorage.getItem('userProfile');
        const storedAccessToken = localStorage.getItem('accessToken');
        if (storedProfile && storedAccessToken) {
          this.user = JSON.parse(storedProfile);
          this.accessToken = storedAccessToken;
          this.isAuthenticated = true;
          this.roles = this.user.roles || []; // 确保模拟用户的角色被设置
        } else {
          // 如果没有存储，则设置一个临时的模拟用户
          this.setUser({
            preferred_username: 'dev_user',
            email: 'dev@hubx.com',
            sub: 'dev_user_id_123',
            roles: ['admin', 'operator']
          });
          this.setTokens('dummy_access_token', 'dummy_refresh_token');
        }
        return; // 开发模式下，不执行后续的真实认证逻辑
      }

      // 以下是真实的认证恢复逻辑
      const storedAccessToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const storedUserProfile = localStorage.getItem('userProfile');

      if (storedAccessToken && storedRefreshToken && storedUserProfile) {
        this.accessToken = storedAccessToken;
        this.refreshToken = storedRefreshToken;
        this.user = JSON.parse(storedUserProfile);
        this.isAuthenticated = true;

        try {
          // 尝试刷新 token 确保有效性
          await authService.refreshAccessToken();
          // 刷新成功，更新 token
          this.accessToken = localStorage.getItem('accessToken');
          this.refreshToken = localStorage.getItem('refreshToken');
          const userProfile = await authService.getUserProfile(); // 刷新后重新获取用户信息以更新
          this.setUser(userProfile);
        } catch (error) {
          console.error('Failed to refresh token during init:', error);
          this.clearUser(); // 刷新失败，清空用户状态
        }
      }
    }
  }
})
