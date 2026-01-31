<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>设备列表</span>
        <el-button type="primary" :icon="Plus" @click="addDevice">添加设备</el-button>
      </div>
    </template>
    <el-table :data="devices" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="180" />
      <el-table-column prop="unique_hardware_id" label="硬件ID" />
      <el-table-column prop="os_type" label="操作系统" />
      <el-table-column prop="hostname" label="主机名" />
      <el-table-column prop="last_seen_at" label="最后在线" />
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button type="primary" :icon="Edit" size="small" @click="editDevice(scope.row)">编辑</el-button>
          <el-button type="danger" :icon="Delete" size="small" @click="deleteDevice(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiService } from '../services/api' // 引入 API 服务

const devices = ref([])
const loading = ref(false)

const fetchDevices = async () => {
  loading.value = true
  try {
    const response = await apiService.getDevices()
    devices.value = response.data // 假设后端返回的数据在 data 字段
  } catch (error) {
    console.error('获取设备列表失败:', error)
    ElMessage.error('获取设备列表失败')
  } finally {
    loading.value = false
  }
}

const addDevice = () => {
  ElMessage.info('添加设备功能待实现...')
  // 实际会打开一个对话框或跳转到添加页面
}

const editDevice = (row) => {
  ElMessage.info(`编辑设备: ${row.hostname} (ID: ${row.id})`)
  // 实际会打开一个对话框或跳转到编辑页面，加载设备数据
}

const deleteDevice = (row) => {
  ElMessageBox.confirm(`确定要删除设备 ${row.hostname} (ID: ${row.id}) 吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        // await apiService.deleteDevice(row.id) // 假设后端有删除设备的 API
        ElMessage.success('设备删除成功')
        await fetchDevices() // 重新加载列表
      } catch (error) {
        console.error('删除设备失败:', error)
        ElMessage.error('删除设备失败')
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

onMounted(() => {
  fetchDevices()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
