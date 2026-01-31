<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>用户设备绑定</span>
        <el-button type="primary" :icon="Plus" @click="openAddBindingDialog">添加绑定</el-button>
      </div>
    </template>
    <el-table :data="bindings" v-loading="loading" style="width: 100%">
      <el-table-column prop="user_keycloak_id" label="用户ID" width="250" />
      <el-table-column prop="device_id" label="设备ID" width="250" />
      <el-table-column prop="device_hostname" label="设备主机名" />
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
            {{ scope.row.status === 'active' ? '活跃' : '非活跃' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="bound_at" label="绑定时间" width="180" />
      <el-table-column label="操作" width="120">
        <template #default="scope">
          <el-button type="danger" :icon="Close" size="small" @click="deleteBinding(scope.row)">解绑</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <!-- 添加绑定对话框 -->
  <el-dialog v-model="addBindingDialogVisible" title="添加用户设备绑定" width="500px">
    <el-form :model="newBindingForm" label-width="100px">
      <el-form-item label="选择用户">
        <el-select v-model="newBindingForm.user_keycloak_id" placeholder="请选择用户" filterable>
          <el-option
            v-for="user in availableUsers"
            :key="user.id"
            :label="`${user.preferred_username} (${user.email})`"
            :value="user.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="选择设备">
        <el-select v-model="newBindingForm.device_id" placeholder="请选择设备" filterable>
          <el-option
            v-for="device in availableDevices"
            :key="device.id"
            :label="`${device.hostname} (${device.unique_hardware_id})`"
            :value="device.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="addBindingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAddBinding">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiService } from '../services/api'

const bindings = ref([])
const loading = ref(false)

const addBindingDialogVisible = ref(false)
const newBindingForm = ref({
  user_keycloak_id: '',
  device_id: ''
})
const availableUsers = ref([])
const availableDevices = ref([])

const fetchBindings = async () => {
  loading.value = true
  try {
    const response = await apiService.getBindings()
    bindings.value = response.data
  } catch (error) {
    console.error('获取绑定列表失败:', error)
    ElMessage.error('获取绑定列表失败')
  } finally {
    loading.value = false
  }
}

const fetchAvailableUsersAndDevices = async () => {
  try {
    const [usersRes, devicesRes] = await Promise.all([
      apiService.getUsers(),
      apiService.getDevices()
    ])
    // 假设这些 API 返回的结构与 UsersView 和 DevicesView 中使用的匹配
    availableUsers.value = usersRes.data.map(u => ({
      id: u.id,
      preferred_username: u.username,
      email: u.email
    }))
    availableDevices.value = devicesRes.data
  } catch (error) {
    console.error('获取可选用户和设备失败:', error)
    ElMessage.error('获取可选用户和设备失败')
  }
}

const openAddBindingDialog = () => {
  newBindingForm.value = { user_keycloak_id: '', device_id: '' } // 重置表单
  fetchAvailableUsersAndDevices() // 获取最新可选数据
  addBindingDialogVisible.value = true
}

const submitAddBinding = async () => {
  if (!newBindingForm.value.user_keycloak_id || !newBindingForm.value.device_id) {
    ElMessage.warning('请选择用户和设备')
    return
  }
  try {
    await apiService.createBinding(newBindingForm.value.user_keycloak_id, newBindingForm.value.device_id)
    ElMessage.success('绑定添加成功')
    addBindingDialogVisible.value = false
    await fetchBindings() // 重新加载绑定列表
  } catch (error) {
    console.error('添加绑定失败:', error)
    ElMessage.error('添加绑定失败')
  }
}

const deleteBinding = (row) => {
  ElMessageBox.confirm(`确定要解除用户 ${row.user_keycloak_id} 与设备 ${row.device_hostname} 的绑定吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await apiService.deleteBinding(row.id) // 假设后端有删除绑定的 API
        ElMessage.success('绑定解除成功')
        await fetchBindings() // 重新加载列表
      } catch (error) {
        console.error('解除绑定失败:', error)
        ElMessage.error('解除绑定失败')
      }
    })
    .catch(() => {
      ElMessage.info('已取消解除绑定')
    })
}

onMounted(() => {
  fetchBindings()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
