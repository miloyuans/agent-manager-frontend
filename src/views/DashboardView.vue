<template>
  <el-row :gutter="20">
    <el-col :span="8">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span>活跃设备</span>
          </div>
        </template>
        <div class="card-content">
          <p class="count">128</p>
          <p class="description">当前在线设备数量</p>
        </div>
      </el-card>
    </el-col>
    <el-col :span="8">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span>绑定用户</span>
          </div>
        </template>
        <div class="card-content">
          <p class="count">{{ userStore.isAuthenticated ? userStore.userEmail : 'N/A' }}</p>
          <p class="description">您的登录邮箱</p>
        </div>
      </el-card>
    </el-col>
    <el-col :span="8">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span>今日请求数</span>
          </div>
        </template>
        <div class="card-content">
          <p class="count">1,234,567</p>
          <p class="description">通过代理的请求总量</p>
        </div>
      </el-card>
    </el-col>
  </el-row>

  <el-card style="margin-top: 20px;">
    <template #header>
      <div class="card-header">
        <span>系统概览</span>
      </div>
    </template>
    <el-empty description="此处将展示更多数据图表和概览信息"></el-empty>
  </el-card>
</template>

<script setup>
import { useUserStore } from '../stores/user'
const userStore = useUserStore()
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-content {
  text-align: center;
}
.card-content .count {
  font-size: 2.5em;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}
.card-content .description {
  font-size: 0.9em;
  color: #666;
}
</style>
