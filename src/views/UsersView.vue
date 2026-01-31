<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>用户列表</span>
        <el-button type="primary" :icon="RefreshRight" @click="fetchUsers">刷新</el-button>
      </div>
    </template>
    <el-table :data="users" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="Keycloak ID" width="250" />
      <el-table-column prop="preferred_username" label="用户名" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-tag :type="scope.row.enabled ? 'success' : 'danger'">
            {{ scope.row.enabled ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button type="primary" :icon="InfoFilled" size="small" @click="viewUser(scope.row)">详情</el-button>
          <el-button type="warning" :icon="Remove" size="small" @click="disableUser(scope.row)" v-if="scope.row.enabled">禁用</el-button>
          <el-button type="success" :icon="CircleCheck" size="small" @click="enableUser(scope.row)" v-else>启用</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RefreshRight, InfoFilled, Remove, CircleCheck } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiService } from '../services/api'

const users = ref([])
const loading = ref(false)

const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await apiService.getUsers() // 假设后端能从 Keycloak 获取用户列表
    // 假设后端返回的数据结构与 Keycloak user 的部分字段匹配
    users.value = response.data.map(u => ({
      id: u.id,
      preferred_username: u.username, // Keycloak 常用 username
      email: u.email,
      enabled: u.enabled, // 用户是否启用
      // ... 其他字段
    }))
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const viewUser = (row) => {
  ElMessage.info(`查看用户: ${row.preferred_username} (ID: ${row.id})`)
  // 实际会打开一个对话框显示用户详细信息
}

const disableUser = (row) => {
  ElMessageBox.confirm(`确定要禁用用户 ${row.preferred_username} 吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        // await apiService.disableUser(row.id) // 假设后端有禁用用户的 API，会调用 Keycloak Admin API
        ElMessage.success('用户禁用成功')
        await fetchUsers()
      } catch (error) {
        console.error('禁用用户失败:', error)
        ElMessage.error('禁用用户失败')
      }
    })
    .catch(() => {
      ElMessage.info('已取消禁用')
    })
}

const enableUser = (row) => {
  ElMessageBox.confirm(`确定要启用用户 ${row.preferred_username} 吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
  })
    .then(async () => {
      try {
        // await apiService.enableUser(row.id) // 假设后端有启用用户的 API
        ElMessage.success('用户启用成功')
        await fetchUsers()
      } catch (error) {
        console.error('启用用户失败:', error)
        ElMessage.error('启用用户失败')
      }
    })
    .catch(() => {
      ElMessage.info('已取消启用')
    })
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
