<template>
  <div class="peer-review">
    <h2 class="peer-evaluation-title">互评分配信息</h2>

    <!-- 状态概览 -->
    <el-alert
      v-if="assignedStudents.length === 0"
      title="暂无已分配的学生"
      type="info"
      :closable="false"
      show-icon
      class="status-alert"
    />
    <el-alert
      v-else
      :title="`已分配学生总数：${assignedStudents.length} 人，来自 ${uniqueClassCount} 个班级`"
      type="success"
      :closable="false"
      show-icon
      class="status-alert"
    />

    <!-- 分配方式选择区域 -->
    <div class="allocation-section">
      <!-- 单学生自动自评提示 -->
      <el-alert
        v-if="assignedStudents.length === 1"
        title="当前只有一名学生，将自动设置为自我互评"
        type="warning"
        :closable="false"
        show-icon
        class="single-student-alert"
      />

      <!-- 正常分配选项 -->
      <template v-else>
        <div class="allocation-header">
          <h3>选择分配方式</h3>
        </div>

        <el-radio-group v-model="allocationMode" @change="handleAllocationModeChange">
          <el-tooltip content="在同一个班级内进行随机互评分配" placement="top">
            <el-radio label="auto">班内互评</el-radio>
          </el-tooltip>
          <el-tooltip content="手动选择不同班级间的互评分配" placement="top">
            <el-radio label="manual">跨班级互评</el-radio>
          </el-tooltip>
        </el-radio-group>

        <!-- 跨班级互评选择 -->
        <div v-if="allocationMode === 'manual'" class="manual-selection">
          <!-- 班级数量不足提示 -->
          <el-alert
            v-if="uniqueClassCount < 2"
            title="需要至少两个不同班级的学生才能进行跨班级互评"
            type="warning"
            :closable="false"
            show-icon
            class="class-warning"
          />

          <template v-else>
            <!-- 被评价班级选择 -->
            <div class="selection-group">
              <div class="selection-label">被评价班级：</div>
              <el-select
                v-model="selectedClass"
                placeholder="选择需要被评价的班级"
                class="selection-box"
                @change="handleClassChange"
              >
                <el-option
                  v-for="className in uniqueClasses"
                  :key="className"
                  :label="className"
                  :value="className"
                />
              </el-select>
            </div>

            <!-- 被评价学生选择 -->
            <div class="selection-group" v-if="selectedClass">
              <div class="selection-label">选择被评价学生：</div>
              <el-select
                v-model="selectedStudents"
                multiple
                placeholder="选择需要被评价的学生"
                class="selection-box"
                @change="validateSelections"
              >
                <el-option
                  v-for="student in classStudents"
                  :key="student.id"
                  :label="student.name"
                  :value="student.id"
                >
                  <span>{{ student.name }}</span>
                  <span class="student-id">({{ student.studentId }})</span>
                </el-option>
              </el-select>
            </div>

            <!-- 评价班级选择 -->
            <div class="selection-group">
              <div class="selection-label">评价班级：</div>
              <el-select
                v-model="reviewerClass"
                placeholder="选择评价班级"
                class="selection-box"
                @change="handleReviewerClassChange"
              >
                <el-option
                  v-for="className in availableReviewerClasses"
                  :key="className"
                  :label="className"
                  :value="className"
                />
              </el-select>
            </div>

            <!-- 评价学生选择 -->
            <div class="selection-group" v-if="reviewerClass">
              <div class="selection-label">选择评价人：</div>
              <el-select
                v-model="selectedReviewers"
                multiple
                placeholder="选择评价人"
                class="selection-box"
                @change="validateSelections"
              >
                <el-option
                  v-for="student in reviewerClassStudents"
                  :key="student.id"
                  :label="student.name"
                  :value="student.id"
                >
                  <span>{{ student.name }}</span>
                  <span class="student-id">({{ student.studentId }})</span>
                </el-option>
              </el-select>
            </div>
          </template>
        </div>
      </template>

      <!-- 分配按钮 -->
      <div class="action-section">
        <el-button
          type="primary"
          @click="allocateReviewers"
          :disabled="!canAllocate"
          :loading="loading.allocating"
        >
          {{ getAllocationButtonText }}
        </el-button>
      </div>
    </div>

    <!-- 分配结果区域 -->
    <div class="results-section">
      <div class="results-header">
        <div class="header-left">
          <h3>分配结果</h3>
          <!-- 班级筛选 -->
          <el-select
            v-model="filterClass"
            placeholder="按班级筛选"
            clearable
            @change="handleFilterChange"
            class="filter-select"
          >
            <el-option
              v-for="className in uniqueClasses"
              :key="className"
              :label="className"
              :value="className"
            />
          </el-select>
        </div>
        <el-button
          type="text"
          icon="el-icon-refresh"
          :loading="loading.table"
          @click="fetchPeerReviewAssignments"
        >
          刷新
        </el-button>
      </div>

      <!-- 结果表格 -->
      <el-table
        v-loading="loading.table"
        :data="filteredAssignments"
        border
        fit
        class="peer-assignments-table"
      >
        <el-table-column
          prop="student.studentId"
          label="学号"
          min-width="120"
          header-align="center"
          align="center"
        />
        <el-table-column
          prop="student.name"
          label="学生姓名"
          min-width="120"
          header-align="center"
          align="center"
        />
        <el-table-column
          prop="student.className"
          label="所属班级"
          min-width="150"
          header-align="center"
          align="center"
        />
        <el-table-column
          label="分配状态"
          min-width="100"
          header-align="center"
          align="center"
        >
          <template #default="scope">
            <el-tag
              :type="scope.row.reviewer ? 'success' : 'info'"
              effect="plain"
            >
              {{ scope.row.reviewer ? '已分配' : '未分配' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="reviewer.studentId"
          label="评价人学号"
          min-width="120"
          header-align="center"
          align="center"
        >
          <template #default="scope">
            <span v-if="scope.row.reviewer">{{ scope.row.reviewer.studentId }}</span>
            <span v-else class="unassigned">未分配</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="reviewer.name"
          label="评价人姓名"
          min-width="120"
          header-align="center"
          align="center"
        >
          <template #default="scope">
            <span v-if="scope.row.reviewer">{{ scope.row.reviewer.name }}</span>
            <span v-else class="unassigned">未分配</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="reviewer.className"
          label="评价人班级"
          min-width="150"
          header-align="center"
          align="center"
        >
          <template #default="scope">
            <span v-if="scope.row.reviewer">{{ scope.row.reviewer.className }}</span>
            <span v-else class="unassigned">未分配</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import { getTaskInfoById, setReviewStudents } from '@/api/homeworkManage/assignTask'

export default {
  name: 'PeerReview',
  props: {
    taskId: {
      type: String,
      required: true
    },
    activeTab: {
      type: String,
      required: true
    },
    assignedStudents: {
      type: Array,
      required: true,
      default: () => []
    }
  },

  data() {
    return {
      loading: {
        allocating: false,
        table: false
      },
      allocationMode: 'auto',
      selectedClass: '',      // 选中的被评价班级
      reviewerClass: '',      // 选中的评价班级
      selectedStudents: [],   // 选中的被评价学生
      selectedReviewers: [],  // 选中的评价人
      peerAssignments: [],    // 分配结果
      filterClass: ''         // 结果筛选的班级
    }
  },

  computed: {
    // 获取所有唯一的班级列表
    uniqueClasses() {
      return [...new Set(this.assignedStudents.map(student => student.className))].filter(Boolean)
    },

    // 班级数量
    uniqueClassCount() {
      return this.uniqueClasses.length
    },

    // 当前选中班级的学生
    classStudents() {
      return this.assignedStudents.filter(
        student => student.className === this.selectedClass
      )
    },

    // 可选的评价班级（排除当前选中的班级）
    availableReviewerClasses() {
      return this.uniqueClasses.filter(className => className !== this.selectedClass)
    },

    // 评价班级的学生
    reviewerClassStudents() {
      return this.assignedStudents.filter(
        student => student.className === this.reviewerClass
      )
    },

    // 是否可以进行分配
    canAllocate() {
      // 没有学生时不能分配
      if (this.assignedStudents.length === 0) return false

      // 只有一个学生时可以自动自评
      if (this.assignedStudents.length === 1) return true

      // 班内互评模式
      if (this.allocationMode === 'auto') {
        return this.uniqueClassCount > 0
      }

      // 跨班级互评模式
      if (this.allocationMode === 'manual') {
        // 需要至少两个班级
        if (this.uniqueClassCount < 2) return false

        // 需要选择了学生和评价人
        if (!this.selectedStudents.length || !this.selectedReviewers.length) return false

        // 评价人数量必须等于被评价学生数量（一对一）
        return this.selectedStudents.length === this.selectedReviewers.length
      }

      return false
    },

    // 按钮文本
    getAllocationButtonText() {
      if (this.loading.allocating) return '分配中...'
      if (this.assignedStudents.length === 1) return '设置自我互评'
      return this.allocationMode === 'auto' ? '分配班内互评' : '确认跨班级互评'
    },

    // 经过班级筛选的分配结果
    filteredAssignments() {
      if (!this.filterClass) return this.peerAssignments
      return this.peerAssignments.filter(
        assignment => assignment.student.className === this.filterClass
      )
    }
  },

  watch: {
    activeTab: {
      handler(newTab) {
        if (newTab === 'peer') {
          this.fetchPeerReviewAssignments()
        }
      },
      immediate: true
    },

    assignedStudents: {
      handler() {
        this.fetchPeerReviewAssignments()
        // 重置选择
        this.handleAllocationModeChange()
      },
      immediate: true
    },

    // 监听选中的评价人数量，确保一对一分配
    selectedReviewers: {
      handler(newVal) {
        if (newVal.length > this.selectedStudents.length) {
          this.selectedReviewers = newVal.slice(0, this.selectedStudents.length)
          this.$message.warning('评价人数量不能超过被评价学生数量')
        }
      }
    }
  },

  methods: {
    // 处理分配方式变更
    handleAllocationModeChange() {
      this.selectedClass = ''
      this.reviewerClass = ''
      this.selectedStudents = []
      this.selectedReviewers = []
    },

    // 处理班级选择变更
    handleClassChange() {
      this.selectedStudents = []
      this.reviewerClass = ''
      this.selectedReviewers = []
    },

    // 处理评价班级变更
    handleReviewerClassChange() {
      this.selectedReviewers = []
    },

    // 验证选择
    validateSelections() {
      if (this.selectedReviewers.length > this.selectedStudents.length) {
        this.selectedReviewers = this.selectedReviewers.slice(0, this.selectedStudents.length)
        this.$message.warning('评价人数量需要与被评价学生数量相同')
      }
    },

    // 获取互评分配信息
    async fetchPeerReviewAssignments() {
      if (!this.assignedStudents.length) return

      try {
        this.loading.table = true
        const response = await getTaskInfoById(this.taskId)
        if (response.code === 1) {
          const mulAccessIds = response.data.mulAccessIds || {}

          // 将id映射转换为完整的学生信息
          this.peerAssignments = Object.entries(mulAccessIds).map(([studentId, reviewerId]) => {
            const student = this.assignedStudents.find(s => s.id.toString() === studentId)
            const reviewer = reviewerId !== -1 ?
              this.assignedStudents.find(s => s.id.toString() === reviewerId.toString()) :
              null

            return {
              student: student || {},
              reviewer: reviewer || null
            }
          })
        } else {
          throw new Error(response.msg || '获取互评分配信息失败')
        }
      } catch (error) {
        this.$message.error('获取互评分配信息失败：' + error.message)
      } finally {
        this.loading.table = false
      }
    },

    // 分配互评人
    async allocateReviewers() {
      if (!this.canAllocate) return

      try {
        this.loading.allocating = true
        const requestPayload = {
          taskId: this.taskId,
          stuIds: [],
          allocateStudents: [],
          reAllocate: true
        }

        // 只有一个学生时自动设置为自我互评
        if (this.assignedStudents.length === 1) {
          const studentId = this.assignedStudents[0].id
          requestPayload.stuIds = [studentId]
          requestPayload.allocateStudents = [studentId]
        }
        // 班内互评模式
        else if (this.allocationMode === 'auto') {
          // 如果有选中班级，只分配该班级的学生
          const studentsToAllocate = this.selectedClass ?
            this.assignedStudents.filter(s => s.className === this.selectedClass) :
            this.assignedStudents

          requestPayload.stuIds = studentsToAllocate.map(s => s.id)
          // allocateStudents为空，由后端随机分配同班级内的评价人
        }
        // 跨班级互评模式
        else {
          requestPayload.stuIds = this.selectedStudents
          requestPayload.allocateStudents = this.selectedReviewers
        }

        const response = await setReviewStudents(requestPayload)
        if (response.code === 1) {
          this.$message.success('互评分配成功！')
          await this.fetchPeerReviewAssignments()
          // 清除选择
          this.handleAllocationModeChange()
        } else {
          throw new Error(response.msg || '分配失败')
        }
      } catch (error) {
        this.$message.error('分配失败：' + error.message)
      } finally {
        this.loading.allocating = false
      }
    },

    // 处理结果筛选
    handleFilterChange() {
      // 班级筛选变化时的处理
      // 如果需要可以在这里添加其他逻辑
    }
  }
}
</script>

<style scoped>
.peer-review {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 标题样式 */
.peer-evaluation-title {
  font-size: 22px;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #ebeef5;
}

/* 状态提示样式 */
.status-alert {
  margin-bottom: 20px;
}

.single-student-alert {
  margin-top: 10px;
  margin-bottom: 20px;
}

/* 分配区域样式 */
.allocation-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.allocation-header {
  margin-bottom: 15px;
}

.allocation-header h3 {
  font-size: 18px;
  color: #303133;
  margin: 0;
}

/* 手动分配选择区域 */
.manual-selection {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.selection-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.selection-label {
  min-width: 120px;
  color: #606266;
  font-weight: 500;
}

.selection-box {
  flex: 1;
}

.class-warning {
  margin: 10px 0;
}

/* 操作按钮区域 */
.action-section {
  margin-top: 20px;
  text-align: center;
}

/* 结果展示区域 */
.results-section {
  margin-top: 30px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.results-header h3 {
  font-size: 18px;
  color: #303133;
  margin: 0;
}

.filter-select {
  width: 200px;
}

/* 表格样式 */
.peer-assignments-table {
  width: 100%;
  margin-top: 10px;
}

.student-id {
  color: #909399;
  margin-left: 8px;
  font-size: 12px;
}

.unassigned {
  color: #909399;
  font-style: italic;
}

/* 响应式样式 */
@media screen and (max-width: 768px) {
  .selection-group {
    flex-direction: column;
    align-items: flex-start;
  }

  .selection-label {
    margin-bottom: 5px;
  }

  .selection-box {
    width: 100%;
  }

  .results-header {
    flex-direction: column;
    gap: 10px;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-select {
    width: 100%;
  }
}

/* Element UI 组件样式覆盖 */
/deep/ .el-table {
  margin-bottom: 20px;
}

/deep/ .el-table th {
  background-color: #f5f7fa;
}

/deep/ .el-table__empty-block {
  min-height: 100px;
}

/deep/ .el-select-dropdown__item {
  display: flex;
  align-items: center;
}

/deep/ .el-radio {
  margin-right: 30px;
  .el-radio__label {
    padding-left: 8px;
  }
}

/* 按钮样式微调 */
.el-button--text {
  padding: 0;
  font-size: 14px;
}

.el-button [class*="el-icon-"] + span {
  margin-left: 5px;
}
</style>
