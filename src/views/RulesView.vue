<!-- src/views/RulesView.vue -->
<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>规则管理</span>
        <el-button type="primary" :icon="Plus">添加规则</el-button>
      </div>
    </template>
    <el-empty description="此处将展示代理规则列表和管理功能"></el-empty>
    <!-- 实际的规则表格和操作将在这里实现 -->
  </el-card>
</template>

<script setup>
import { Plus } from '@element-plus/icons-vue'
// 可以在这里添加获取规则、添加/编辑/删除规则的逻辑
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
