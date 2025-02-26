<template>
  <div class="assignment-page">
    <!-- 作业信息卡片 -->
    <el-card class="box-card">
      <div slot="header" class="header">
        <span class="AssignTasktitle">任务详情</span>
      </div>

      <el-form label-width="100px" class="task-form">
        <!-- 作业信息部分保持不变 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="作业名称:">
              <span>{{ taskData.taskName }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止日期:">
              <span>{{ formatDate(taskData.deadline) }}</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="提交类型:">
              <span>{{ taskData.submissionTypes && taskData.submissionTypes.join('、') }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="评阅流程:">
              <span>{{ taskData.evaluationMethods && taskData.evaluationMethods.join('、') }}</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="评阅设置:">
              <span>{{ taskData.reviewSettings && taskData.reviewSettings.join('、') }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="作业描述:">
              <div v-html="taskData.taskRequirements"></div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 配置标签页 -->
    <el-card class="config-card">
      <div class="card-header-wrapper">
        <!-- 警告提示 -->
        <el-alert
          v-if="!hasAssignedStudents && activeTab !== 'assign'"
          title="请先完成学生分配"
          type="warning"
          show-icon
          :closable="false"
          class="alert-message"
        />

        <!-- 提交按钮 -->
        <el-button
          type="primary"
          @click="handleSubmitTaskSettings"
          :loading="submitting"
          class="submit-button"
        >
          提交所有任务设置
        </el-button>
      </div>

      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <!-- 分配学生标签页 - 始终显示且可用 -->
        <el-tab-pane label="分配作业" name="assign">
          <assign-students
            :task-id="taskId"
            :class-data="classData"
            @update:assignedStudents="handleStudentsAssigned"
            @update:classData="updateClassData"
            ref="AssignStudents"
          />
        </el-tab-pane>

        <!-- 评价维度设置标签页 - 始终显示 -->
        <el-tab-pane label="评价维度设置" name="dimensions">
          <set-evaluation-dimensions
            :task-id="taskId"
            :disabled="!hasAssignedStudents"
          />
        </el-tab-pane>

        <!-- 自评标签页 - 条件显示 -->
        <el-tab-pane
          v-if="hasEvaluationMethod('自评')"
          :disabled="!hasAssignedStudents"
          :assigned-students="assignedStudentsInfo"
          label="自评"
          name="self"
        >
          <div v-if="hasAssignedStudents">
            <self-evaluation
              :task-id="taskId"
              :assigned-students="assignedStudentsInfo"
              :active-tab="activeTab" />
          </div>
          <el-empty v-else description="请先完成学生分配" />
        </el-tab-pane>

        <!-- 互评标签页 - 条件显示 -->
        <el-tab-pane
          v-if="hasEvaluationMethod('互评')"
          :disabled="!hasAssignedStudents"
          :assigned-students="assignedStudentsInfo"
          label="互评"
          name="peer"
        >
          <div v-if="hasAssignedStudents">
            <peer-evaluation
              :task-id="taskId"
              :assigned-students="assignedStudentsInfo"
              :active-tab="activeTab"/>
          </div>
          <el-empty v-else description="请先完成学生分配" />
        </el-tab-pane>

        <!-- 师评标签页 - 条件显示 -->
        <el-tab-pane
          v-if="hasEvaluationMethod('师评')"
          :disabled="!hasAssignedStudents"
          label="师评"
          name="teacher"
        >
          <div v-if="hasAssignedStudents">
            <teacher-evaluation :task-id="taskId" />
          </div>
          <el-empty v-else description="请先完成学生分配" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import AssignStudents from './AssignStudents.vue'
import SetEvaluationDimensions from './SetEvaluationDimensions.vue'
import SelfEvaluation from './SelfEvaluation.vue'
import PeerEvaluation from './PeerEvaluation.vue'
import TeacherEvaluation from './TeacherEvaluation.vue'
import {getTaskInfoById} from '@/api/homeworkManage/assignTask'
export default {
  name: 'AssignTask',

  components: {
    AssignStudents,
    SetEvaluationDimensions,
    SelfEvaluation,
    PeerEvaluation,
    TeacherEvaluation
  },

  data() {
    return {
      taskId: '',
      taskData: {},
      activeTab: 'assign',
      hasAssignedStudents: false, // 是否已分配学生的标记
      assignedStudentsInfo: [], // 存储已分配学生的完整信息
      // 新增属性用于保存班级和学生数据
      classData: {
        classList: [],
        originalStudentList: [],
        selectedClassId: '',
        assignedStudentIds: new Set()
      },
      submitting: false
    }
  },
  watch: {
    // 监控整个classData的变化
    classData: {
      deep: true,
      handler(newVal, oldVal) {
        console.group('父组件 - classData变化')
        console.log('新的classData:', {
          classList: [...(newVal.classList || [])],
          selectedClassId: newVal.selectedClassId,
          assignedStudentIds: [...(newVal.assignedStudentIds || new Set())]
        })
        console.log('旧的classData:', {
          classList: [...(oldVal.classList || [])],
          selectedClassId: oldVal.selectedClassId,
          assignedStudentIds: [...(oldVal.assignedStudentIds || new Set())]
        })
        console.groupEnd()
      }
    },

    // 单独监控已分配学生的变化
    'classData.assignedStudentIds': {
      deep: true,
      handler(newVal) {
        console.group('父组件 - assignedStudentIds变化')
        console.log('新的已分配学生IDs:', [...(newVal || new Set())])
        console.log('当前已分配学生数量:', newVal ? newVal.size : 0)
        console.groupEnd()
        this.updateAssignedStudentsInfo()
      }
    },

    // 监控任务数据的变化
    taskData: {
      deep: true,
      handler(newVal, oldVal) {
        console.group('父组件 - taskData变化')
        console.log('新的taskData:', {
          taskName: newVal.taskName,
          assignedStudents: newVal.assignedStudents,
          evaluationMethods: newVal.evaluationMethods
        })
        console.log('旧的taskData:', {
          taskName: oldVal.taskName,
          assignedStudents: oldVal.assignedStudents,
          evaluationMethods: oldVal.evaluationMethods
        })
        console.groupEnd()
      }
    },

    // 监控分配状态的变化
    hasAssignedStudents(newVal, oldVal) {
      console.group('父组件 - hasAssignedStudents变化')
      console.log('分配状态变化:', {
        from: oldVal,
        to: newVal
      })
      console.log('当前classData状态:', {
        selectedClassId: this.classData.selectedClassId,
        assignedStudentIds: [...this.classData.assignedStudentIds]
      })
      console.groupEnd()
    },

    // 监控选中班级的变化
    'classData.selectedClassId'(newVal, oldVal) {
      console.group('父组件 - selectedClassId变化')
      console.log('班级ID变化:', {
        from: oldVal,
        to: newVal
      })
      console.log('当前班级学生分配状态:', {
        assignedStudentIds: [...this.classData.assignedStudentIds]
      })
      console.groupEnd()
    },

    'classData.originalStudentList': {
      handler(newList) {
        if (newList?.length && this.hasAssignedStudents) {
          this.updateAssignedStudentsInfo()
          console.log('学生列表更新后的已分配学生信息:', this.assignedStudentsInfo)
        }
      }
    }
  },
  async created() {
    // 获取任务ID
    this.taskId = this.$route.params.taskId
    // await this.initializeTaskData(),
    await this.refreshAssignmentStatus()
    this.updateAssignedStudentsInfo()
  },

  methods: {

    // 日期格式化
    formatDate(dateStr) {
      if (!dateStr) return ''
      try {
        const date = new Date(dateStr)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day} ${hours}:${minutes}`
      } catch (error) {
        return dateStr
      }
    },

    hasEvaluationMethod(method) {
      return this.taskData.evaluationMethods &&
        this.taskData.evaluationMethods.includes(method)
    },

    handleTabClick(tab) {
      if (!this.hasAssignedStudents && tab.name !== 'assign') {
        this.$message.warning('请先完成学生分配')
        this.activeTab = 'assign'
        return false
      }
    },


    updateClassData(newData) {
      console.group('父组件 - 更新ClassData')
      console.log('更新前的数据:', this.classData)
      console.log('接收的新数据:', newData)

      this.classData = {
        ...this.classData,
        classList: newData.classList || this.classData.classList,
        originalStudentList: newData.originalStudentList || this.classData.originalStudentList,
        selectedClassId: newData.selectedClassId || this.classData.selectedClassId,
        assignedStudentIds: newData.assignedStudentIds || this.classData.assignedStudentIds
      }

      console.log('更新后的数据:', this.classData)
      console.groupEnd()

      // 如果学生列表更新了，重新计算已分配学生信息
      if (newData.originalStudentList) {
        this.updateAssignedStudentsInfo()
      }
    },


    async refreshAssignmentStatus() {
      try {
        const response = await getTaskInfoById(this.taskId)
        if (response.code === 1 && response.data) {
          this.taskData = response.data
          const assignedStudents = response.data.assignedStudents || []
          this.hasAssignedStudents = !!(response.data.assignedStudents && response.data.assignedStudents.length)
          this.classData.assignedStudentIds = new Set(response.data.assignedStudents || [])
          console.group('刷新分配状态')
          console.log('更新后的任务数据:', this.taskData)
          console.log('已分配学生数量:', assignedStudents.length)
          console.log('分配状态:', this.hasAssignedStudents)
          console.log('已分配学生IDs:', [...this.classData.assignedStudentIds])
          console.groupEnd()
        }
      } catch (error) {
        console.error('刷新分配状态失败:', error)
        this.$message.error('刷新分配状态失败')
      }
    },
    // 更新已分配学生的完整信息
    updateAssignedStudentsInfo() {
      // 从 originalStudentList 中筛选出已分配的学生
      this.assignedStudentsInfo = this.classData.originalStudentList.filter(student =>
        this.classData.assignedStudentIds.has(student.id)
      )

      // 打印日志查看
      console.group('父组件 - 已分配学生信息更新')
      console.log('已分配学生数量:', this.assignedStudentsInfo.length)
      console.log('已分配学生详细信息:', this.assignedStudentsInfo)
      console.groupEnd()
    },

    // 修改现有的handleStudentsAssigned方法
    async handleStudentsAssigned(hasStudents) {
      this.hasAssignedStudents = hasStudents
      await this.refreshAssignmentStatus()
      if (hasStudents) {
        this.updateAssignedStudentsInfo() // 更新已分配学生信息
        this.$message.success('学生分配完成')
      }
    },

// 检查评价维度是否设置
    checkEvaluationDimensions(taskData) {
      const { evaluationMethods, evaluationDimensions } = taskData
      // 检查每个评价方法是否都有对应的维度设置
      return evaluationMethods.every(method => {
        const dimensions = evaluationDimensions.find(d => d.evaluationMethods === method)
        return dimensions && dimensions.evaluationTypes.length > 0
      })
    },
    // 检查互评分配
    checkPeerEvaluation(taskData) {
      if (!taskData.evaluationMethods.includes('互评')) return true

      const { mulAccessIds, assignedStudents } = taskData
      // 检查所有被分配的学生是否都有互评人且不为-1
      return assignedStudents.every(studentId =>
        mulAccessIds[studentId] && mulAccessIds[studentId] !== -1
      )
    },

    // 检查师评分配
    checkTeacherEvaluation(taskData) {
      if (!taskData.evaluationMethods.includes('师评')) return true

      return taskData.reviewTeachers && taskData.reviewTeachers.length > 0
    },

    // 检查学生分配
    checkStudentAssignment(taskData) {
      return taskData.assignedStudents && taskData.assignedStudents.length > 0
    },

    // 提交任务设置
    async handleSubmitTaskSettings() {
      try {
        this.submitting = true

        // 获取最新任务数据
        const response = await getTaskInfoById(this.taskId)
        if (response.code !== 1 || !response.data) {
          throw new Error('获取任务数据失败')
        }

        const taskData = response.data

        // 检查学生分配（必检）
        if (!this.checkStudentAssignment(taskData)) {
          this.$message.warning('请先完成学生分配')
          this.activeTab = 'assign'
          return
        }

        // 检查评价维度
        if (!this.checkEvaluationDimensions(taskData)) {
          this.$message.warning('请完善所有评价方法的评价维度设置')
          this.activeTab = 'dimensions'
          return
        }

        // 检查互评分配
        if (!this.checkPeerEvaluation(taskData)) {
          this.$message.warning('请完成互评分配')
          this.activeTab = 'peer'
          return
        }

        // 检查师评分配
        if (!this.checkTeacherEvaluation(taskData)) {
          this.$message.warning('请完成教师分配')
          this.activeTab = 'teacher'
          return
        }

        // 全部检查通过
        this.$message.success('任务设置已完成，即将返回')

        setTimeout(() => {
          this.$router.go(-2) // 返回上级页面
        }, 1500)

      } catch (error) {
        this.$message.error('提交失败：' + error.message)
      } finally {
        this.submitting = false
      }
    }



  }
}
</script>

<style scoped>
.assignment-page {
  padding: 20px;
}

.box-card,
.config-card {
  margin-bottom: 20px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.header {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  padding-bottom: 10px;
}

.AssignTasktitle {
  font-size: 20px;
  color: #333;
  text-align: left;
}

.task-form {
  font-size: 14px;
  line-height: 1.8;
}
/* 其他原有样式保持不变... */

/* 使用Vue2的深度选择器修改tab-pane的样式 */
/deep/ .el-tabs__content {
  overflow: visible !important;
}

/deep/ .el-tab-pane {
  width: 100%;
  min-width: 1200px;
  overflow-x: auto;
}

.el-form-item {
  margin-bottom: 12px;
}

.alert-message {
  margin-bottom: 15px;
}
.card-header-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.alert-message {
  flex: 1;
  margin-right: 20px;
  margin-bottom: 0;
}

.submit-button {
  margin-left: 1500px;

}
/* 禁用状态的标签样式 */
.el-tabs__item.is-disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}
</style>
