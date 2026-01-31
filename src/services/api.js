import axios from 'axios'
import { authService } from './auth'
import router from '../router'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api' // 你的 Go 后端 API 地址

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10秒超时
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：在每个请求中注入 Access Token
api.interceptors.request.use(
  async (config) => {
    const token = authService.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：处理 token 过期和错误
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    // 检查是否是 401 Unauthorized 错误，并且不是刷新 Token 的请求本身
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true // 标记为已重试过一次

      try {
        await authService.refreshAccessToken() // 尝试刷新 Token
        const newAccessToken = authService.getAccessToken()
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest) // 使用新 Token 重新发送请求
      } catch (refreshError) {
        // 刷新 Token 失败 (例如 refresh token 也过期了)
        console.error('API call failed and refresh token failed:', refreshError)
        authService.logout() // 强制登出
        return Promise.reject(refreshError)
      }
    }

    // 其他错误直接拒绝
    return Promise.reject(error)
  }
)

// --- 示例 API 调用函数 ---
export const apiService = {
  getDevices() {
    return api.get('/devices')
  },
  getUsers() {
    // 假设你的 Go 后端会从 Keycloak 同步用户或者提供用户列表
    return api.get('/users')
  },
  getBindings() {
    return api.get('/bindings')
  },
  createBinding(userId, deviceId) {
    return api.post('/bindings', { user_id: userId, device_id: deviceId })
  },
  deleteBinding(bindingId) {
    return api.delete(`/bindings/${bindingId}`)
  },
  // ... 其他管理操作 (创建/编辑/删除设备/用户/规则等)
}
