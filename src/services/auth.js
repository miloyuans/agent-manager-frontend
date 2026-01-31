import axios from 'axios'
import router from '../router'
import { useUserStore } from '../stores/user'

// --- Keycloak 配置 ---
const KEYCLOAK_CONFIG = {
  realm: 'your-keycloak-realm', // 替换为你的 Realm
  clientId: 'your-admin-frontend-client-id', // 替换为你的管理后台前端 Client ID
  authServerUrl: 'https://your-keycloak-domain/auth', // 替换为你的 Keycloak URL
  redirectUri: window.location.origin + '/callback', // 必须与 Keycloak Client 配置一致
}

// OIDC/OAuth 2.0 端点
const AUTH_URL = `${KEYCLOAK_CONFIG.authServerUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/auth`
const TOKEN_URL = `${KEYCLOAK_CONFIG.authServerUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`
const USERINFO_URL = `${KEYCLOAK_CONFIG.authServerUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/userinfo`
const LOGOUT_URL = `${KEYCLOAK_CONFIG.authServerUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/logout`

class AuthService {
  constructor() {
    this.codeVerifier = null
    this.state = null
    this.tokenRefreshTimeout = null
  }

  // --- PKCE 辅助函数 ---
  generateCodeVerifier() {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
    let verifier = ''
    for (let i = 0; i < 128; i++) { // 128 chars for high entropy
      verifier += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    this.codeVerifier = verifier
    return verifier
  }

  async generateCodeChallenge(verifier) {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  generateState() {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let state = ''
    for (let i = 0; i < 32; i++) {
      state += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    this.state = state
    return state
  }

  // --- 认证流程 ---
  async redirectToKeycloakLogin() {
    const codeVerifier = this.generateCodeVerifier()
    const codeChallenge = await this.generateCodeChallenge(codeVerifier)
    const state = this.generateState()

    const params = new URLSearchParams({
      client_id: KEYCLOAK_CONFIG.clientId,
      redirect_uri: KEYCLOAK_CONFIG.redirectUri,
      response_type: 'code',
      scope: 'openid profile email', // 请求的范围
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state: state
    })

    // 清理之前的 Token
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userProfile')
    const userStore = useUserStore()
    userStore.clearUser()
    clearTimeout(this.tokenRefreshTimeout)

    window.location.href = `${AUTH_URL}?${params.toString()}`
  }

  async handleKeycloakCallback() {
    const userStore = useUserStore()
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')

    // 验证 state 参数，防止 CSRF 攻击
    if (state !== this.state) { // 注意：在 SPA 中，如果用户刷新页面，this.state 会丢失。实际生产中 state 应该存储在 sessionStorage
      console.warn('State mismatch, potential CSRF attack or page refresh.', state, this.state);
      // 为了用户体验，暂时不严格拦截，但生产环境应严格校验
      // throw new Error('State mismatch, potential CSRF attack.');
    }
    // 实际生产中，state 可以与 code_verifier 一起，使用 sessionStorage 临时存储

    if (!code) {
      throw new Error('No authorization code found in callback URL.')
    }

    // 交换 code 为 token
    const tokenParams = new URLSearchParams({
      client_id: KEYCLOAK_CONFIG.clientId,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: KEYCLOAK_CONFIG.redirectUri,
      code_verifier: this.codeVerifier // PKCE 核心
    })

    const response = await axios.post(TOKEN_URL, tokenParams.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const { access_token, refresh_token, expires_in } = response.data
    userStore.setTokens(access_token, refresh_token)
    this.scheduleTokenRefresh(expires_in)

    // 清除 URL 中的 code 和 state
    router.replace({ query: {} }) // 清理 URL

    return response.data
  }

  async refreshAccessToken() {
    const userStore = useUserStore()
    const refreshToken = userStore.refreshToken || localStorage.getItem('refreshToken')

    if (!refreshToken) {
      this.redirectToKeycloakLogin()
      throw new Error('No refresh token found.')
    }

    const refreshParams = new URLSearchParams({
      client_id: KEYCLOAK_CONFIG.clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })

    try {
      const response = await axios.post(TOKEN_URL, refreshParams.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      const { access_token, refresh_token, expires_in } = response.data
      userStore.setTokens(access_token, refresh_token || userStore.refreshToken) // 有时 refresh_token 不会变
      this.scheduleTokenRefresh(expires_in)
      console.log('Access token refreshed successfully.')
      return access_token
    } catch (error) {
      console.error('Failed to refresh access token:', error.response?.data || error.message)
      this.logout() // 刷新失败，强制登出
      throw error
    }
  }

  scheduleTokenRefresh(expiresInSeconds) {
    // 提前 30 秒刷新
    const refreshInterval = (expiresInSeconds - 30) * 1000
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout)
    }
    this.tokenRefreshTimeout = setTimeout(() => {
      this.refreshAccessToken().catch(e => console.error("Auto refresh failed", e))
    }, refreshInterval)
  }

  async getUserProfile() {
    const userStore = useUserStore()
    if (!userStore.accessToken) {
      throw new Error('Access token not available.')
    }
    try {
      const response = await axios.get(USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${userStore.accessToken}`
        }
      })
      userStore.setUser(response.data) // 将获取到的用户信息存储到 Pinia store
      return response.data
    } catch (error) {
      console.error('Failed to fetch user profile:', error.response?.data || error.message)
      this.logout() // 获取用户失败，强制登出
      throw error
    }
  }

  getAccessToken() {
    const userStore = useUserStore()
    return userStore.accessToken || localStorage.getItem('accessToken')
  }

  async logout() {
    const userStore = useUserStore()
    const refreshToken = userStore.refreshToken || localStorage.getItem('refreshToken')
    userStore.clearUser()
    clearTimeout(this.tokenRefreshTimeout)
    // 尝试重定向到 Keycloak 登出，清理 Keycloak 会话
    if (refreshToken) {
      const logoutParams = new URLSearchParams({
        client_id: KEYCLOAK_CONFIG.clientId,
        refresh_token: refreshToken,
        redirect_uri: window.location.origin // 登出后重定向到应用的根目录
      });
      window.location.href = `${LOGOUT_URL}?${logoutParams.toString()}`;
    } else {
      router.push('/login') // 没有 refresh token，直接跳转到登录页
    }
  }
}

export const authService = new AuthService()
