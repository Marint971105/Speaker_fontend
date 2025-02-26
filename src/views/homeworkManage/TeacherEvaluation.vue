<template>
  <div class="teacher-evaluation">
    <h2 class="evaluation-title">教师评阅分配</h2>

    <!-- 状态概览卡片 -->
    <el-card class="status-card" :body-style="{ padding: '15px' }">
      <div class="status-overview">
        <div class="status-item">
          <span class="label">当前已分配教师：</span>
          <span class="value" :class="{
          'text-danger': assignedTeachers.length === 0,
          'text-success': assignedTeachers.length > 0
        }">{{ assignedTeachers.length }} 人</span>
        </div>
      </div>
    </el-card>

    <!-- 教师选择区域 -->
    <el-card class="selection-card">
      <div slot="header" class="card-header">
        <span>选择评阅教师</span>
        <el-button
          type="text"
          @click="clearSelection"
          :disabled="!form.selectedTeachers.length"
        >
          清空选择
        </el-button>
      </div>

      <!-- 搜索和筛选 -->
      <div class="search-area">
        <el-input
          v-model="searchQuery"
          placeholder="搜索教师姓名/邮箱"
          prefix-icon="el-icon-search"
          clearable
          @input="handleSearch"
          class="search-input"
        />
      </div>

      <!-- 教师选择表格 -->
      <el-table
        ref="teacherTable"
        v-loading="loading.teachers"
        :data="filteredTeachers"
        @selection-change="handleSelectionChange"
        class="teacher-table"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="nickName" label="教师姓名" min-width="120">
          <template slot-scope="scope">
            <el-tooltip :content="scope.row.userName" placement="top">
              <span>{{ scope.row.nickName }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="userName" label="邮箱" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag
              :type="isTeacherAssigned(scope.row.userId) ? 'success' : 'info'"
              size="small"
            >
              {{ isTeacherAssigned(scope.row.userId) ? '已分配' : '待分配' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template slot-scope="scope">
            <el-button
              type="text"
              @click="handleSingleAssign(scope.row)"
              :disabled="isTeacherAssigned(scope.row.userId)"
              :loading="loading.single === scope.row.userId"
            >
              {{ isTeacherAssigned(scope.row.userId) ? '已分配' : '分配' }}
            </el-button>
            <el-tooltip
              v-if="isTeacherAssigned(scope.row.userId)"
              content="该教师已分配，无需重复分配"
              placement="top"
            >
              <i class="el-icon-info" style="margin-left: 5px; color: #909399;"></i>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分配按钮 -->
      <div class="action-area">
        <el-button
          type="primary"
          @click="submitTeacherEvaluation"
          :disabled="!form.selectedTeachers.length"
          :loading="loading.submit"
        >
          批量分配所选教师
        </el-button>
      </div>
    </el-card>

    <!-- 已分配教师列表 -->
    <el-card class="assigned-card" v-loading="loading.table">
      <div slot="header" class="card-header">
        <span>已分配教师列表</span>
        <el-button
          type="text"
          icon="el-icon-refresh"
          @click="fetchAssignedTeachers"
          :loading="loading.table"
        >
          刷新
        </el-button>
      </div>

      <el-table
        :data="assignedTeachers"
        class="assigned-teachers-table"
        v-if="assignedTeachers.length"
      >
        <el-table-column prop="nickName" label="教师姓名" min-width="120" />
        <el-table-column prop="userName" label="邮箱" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="100" align="center">
        </el-table-column>
      </el-table>

      <el-empty v-else description="暂无已分配教师" />
    </el-card>
  </div>
</template>

<script>
import { getMembers } from '@/api/memeberManage/member'
import { setReviewTeachers } from '@/api/homeworkManage/assignTask'
import { getTaskInfoById } from '@/api/homeworkManage/assignTask'
import { getUserProfile } from '@/api/system/user'

export default {
  name: 'TeacherEvaluation',
  props: {
    taskId: {
      type: String,
      required: true
    }
  },

  data() {
    return {
      form: {
        selectedTeachers: []
      },
      teachers: [],
      assignedTeachers: [],
      searchQuery: '',

      loading: {
        teachers: false,
        submit: false,
        table: false,
        single: null // 用于存储正在分配的单个教师ID
      }
    }
  },

  computed: {
    // 根据搜索过滤教师列表
    filteredTeachers() {
      if (!this.searchQuery) return this.teachers

      const query = this.searchQuery.toLowerCase()
      return this.teachers.filter(teacher =>
        teacher.nickName.toLowerCase().includes(query) ||
        teacher.userName.toLowerCase().includes(query)
      )
    }
  },

  created() {
    this.initialize()
  },

  methods: {
    // 初始化数据
    async initialize() {
      await Promise.all([
        this.fetchTeachers(),
        this.fetchAssignedTeachers(),
        this.fetchTaskInfo()
      ])
    },

    // 获取任务信息
    async fetchTaskInfo() {
      try {
        const response = await getTaskInfoById(this.taskId)
        if (response.code === 1 && response.data) {
          this.totalAssignments = response.data.assignedStudents?.length || 0
        }
      } catch (error) {
        this.$message.error('获取任务信息失败：' + error.message)
      }
    },

    // 获取教师列表
    async fetchTeachers() {
      try {
        this.loading.teachers = true
        const response = await getMembers({})
        this.teachers = response.data.rows.filter(member => member.roleId === 1)
      } catch (error) {
        this.$message.error('获取教师列表失败：' + error.message)
      } finally {
        this.loading.teachers = false
      }
    },

    // 修改 fetchAssignedTeachers 方法
    async fetchAssignedTeachers() {
      try {
        this.loading.table = true
        const response = await getTaskInfoById(this.taskId)
        if (response.code === 1 && response.data.reviewTeachers?.length) {
          // 获取唯一的教师ID数组
          const uniqueTeacherIds = [...new Set(response.data.reviewTeachers)]

          // 获取教师信息
          const teacherInfo = await Promise.all(
            uniqueTeacherIds.map(id => getUserProfile(id))
          )

          // 过滤无效数据并去重
          this.assignedTeachers = teacherInfo
            .map(res => res.data)
            .filter(Boolean)
            // 使用userId作为唯一标识去重
            .filter((teacher, index, self) =>
              index === self.findIndex(t => t.userId === teacher.userId)
            )
        } else {
          this.assignedTeachers = []
        }
      } catch (error) {
        this.$message.error('获取已分配教师失败：' + error.message)
      } finally {
        this.loading.table = false
      }
    },

    // 检查教师是否已分配
    isTeacherAssigned(teacherId) {
      return this.assignedTeachers.some(t => t.userId === teacherId)
    },

    handleSelectionChange(selection) {
      // 直接获取选中教师的ID数组
      this.form.selectedTeachers = selection.map(teacher => teacher.userId)
    },

    // 处理搜索
    handleSearch() {
      this.$refs.teacherTable.clearSelection()
      this.form.selectedTeachers = []
    },

    clearSelection() {
      if (this.$refs.teacherTable) {
        this.$refs.teacherTable.clearSelection()
      }
      this.form.selectedTeachers = []
    },

    // 单个教师分配
    async handleSingleAssign(teacher) {
      if (this.isTeacherAssigned(teacher.userId)) {
        return // 如果已分配则不执行
      }

      try {
        this.loading.single = teacher.userId
        const response = await setReviewTeachers(
          this.taskId,
          [...this.assignedTeachers.map(t => t.userId), teacher.userId]
        )

        if (response.code === 1) {
          this.$message.success(`已成功分配教师 ${teacher.nickName}`)
          await this.fetchAssignedTeachers()
        } else {
          throw new Error(response.msg || '分配失败')
        }
      } catch (error) {
        this.$message.error('分配失败：' + error.message)
      } finally {
        this.loading.single = null
      }
    },

// 修改 submitTeacherEvaluation 方法
    async submitTeacherEvaluation() {
      if (!this.form.selectedTeachers || this.form.selectedTeachers.length === 0) {
        this.$message.warning('请选择要分配的教师')
        return
      }

      try {
        this.loading.submit = true
        const response = await setReviewTeachers(
          this.taskId,
          this.form.selectedTeachers // 直接使用选中的教师ID数组
        )

        if (response.code === 1) {
          this.$message.success('教师分配成功！')
          await this.fetchAssignedTeachers()
          this.clearSelection()
        } else {
          throw new Error(response.msg || '分配失败')
        }
      } catch (error) {
        this.$message.error('分配失败：' + error.message)
      } finally {
        this.loading.submit = false
      }
    }


  }
}
</script>

<style scoped>
.teacher-evaluation {
  padding: 20px;
}

.evaluation-title {
  font-size: 22px;
  color: #303133;
  margin-bottom: 20px;
  font-weight: 500;
}

.status-card {
  margin-bottom: 20px;
}

.status-overview {
  display: flex;
  gap: 40px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-item .label {
  color: #606266;
}

.status-item .value {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.status-item .value.highlight {
  color: #409EFF;
}

.selection-card,
.assigned-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-area {
  margin-bottom: 15px;
}

.search-input {
  width: 300px;
}

.teacher-table,
.assigned-teachers-table {
  margin-bottom: 15px;
}

.action-area {
  text-align: center;
  padding-top: 15px;
  border-top: 1px solid #EBEEF5;
}

.text-danger {
  color: #F56C6C;
  font-weight: bold;
}

.text-success {
  color: #67C23A;
  font-weight: bold;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-item .label {
  color: #606266;
  font-size: 15px;
}

.status-item .value {
  font-size: 16px;
}
.el-button[disabled] {
  cursor: not-allowed;
}

/* 已分配按钮样式 */
.el-button[disabled].el-button--text {
  color: #909399;
}

/* 优化提示图标样式 */
.el-icon-info {
  font-size: 14px;
}

/* Tooltip样式优化 */
/deep/ .el-tooltip__popper {
  font-size: 12px;
  padding: 8px 12px;
}
.danger-text {
  color: #F56C6C;
}

.danger-text:hover {
  color: #f78989;
}

.primary-text {
  color: #409EFF;
}

.primary-text:hover {
  color: #66b1ff;
}

/* Element UI 组件样式覆盖 */
/deep/ .el-card__header {
  padding: 15px 20px;
}

/deep/ .el-table {
  margin-bottom: 20px;
}

/deep/ .el-table th {
  background-color: #f5f7fa;
}

/deep/ .el-table .cell {
  white-space: nowrap;
}

/* 响应式样式 */
@media screen and (max-width: 768px) {
  .status-overview {
    flex-direction: column;
    gap: 15px;
  }

  .search-input {
    width: 100%;
  }

  .selection-card,
  .assigned-card {
    margin-bottom: 15px;
  }
}
</style>
