<template>
  <el-container class="admin-layout">
    <el-aside width="200px" class="admin-sidebar">
      <div class="logo-container">
        <el-icon :size="24"><Cpu /></el-icon>
        <span>Agent Manager</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical-demo"
        @select="handleMenuSelect"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Monitor /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/devices">
          <el-icon><DataBoard /></el-icon>
          <span>设备管理</span>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/bindings">
          <el-icon><Link /></el-icon>
          <span>绑定管理</span>
        </el-menu-item>
        <!-- 可以添加更多菜单项，例如规则管理 -->
        <el-menu-item index="/rules">
          <el-icon><Document /></el-icon>
          <span>规则管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="admin-header">
        <div class="header-left">
          <!-- 面包屑导航或其他组件 -->
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentRouteName }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown>
            <span class="el-dropdown-link">
              <el-icon><UserFilled /></el-icon>
              {{ userStore.userName }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人中心</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="admin-main">
        <router-view />
      </el-main>
      <el-footer class="admin-footer">
        © 2026 Agent Manager by HubX Team
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { authService } from '../services/auth'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const currentRouteName = computed(() => route.name ? router.currentRoute.value.meta.title || route.name.toString() : '未知页面')


const handleMenuSelect = (index) => {
  router.push(index)
}

const handleLogout = async () => {
  await authService.logout()
}

onMounted(() => {
  // 可以在布局组件挂载时，初始化用户状态
  userStore.initAuth();
})

</script>

<style scoped>
.admin-layout {
  height: 100vh;
  background-color: #f0f2f5; /* 背景色 */
}

.admin-sidebar {
  background-color: #304156;
  color: #bfcbd9;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
  display: flex;
  flex-direction: column;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2em;
  font-weight: bold;
  color: #fff;
  border-bottom: 1px solid #283748;
}
.logo-container .el-icon {
  margin-right: 10px;
}


.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
  min-height: 400px;
  border-right: none; /* 移除 Element Plus 菜单的右边框 */
}
.el-menu-item {
  color: #bfcbd9;
}
.el-menu-item.is-active {
  background-color: #263445 !important;
  color: #409EFF !important;
}

.admin-header {
  background-color: #fff;
  color: #333;
  line-height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-right .el-dropdown-link {
  cursor: pointer;
  color: #409EFF;
  display: flex;
  align-items: center;
}
.header-right .el-icon {
  margin-right: 5px;
}

.admin-main {
  padding: 20px;
  background-color: #f0f2f5;
  overflow-y: auto; /* 允许内容滚动 */
}

.admin-footer {
  text-align: center;
  line-height: 60px;
  color: #999;
  font-size: 0.9em;
  background-color: #fff;
  border-top: 1px solid #e0e0e0;
}
</style>
