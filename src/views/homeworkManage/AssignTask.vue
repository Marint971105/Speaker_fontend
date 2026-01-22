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
              <el-date-picker
                v-model="deadlineValue"
                type="datetime"
                placeholder="选择截止日期"
                format="yyyy-MM-dd HH:mm:ss"
                value-format="yyyy-MM-dd HH:mm:ss"
                @change="handleDeadlineChange"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="提交类型:">
              <span>{{ formatSubmissionTypes(taskData.submissionTypes) }}</span>
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
              <div style="margin-top: 5px;">
                <span style="color: #909399; font-size: 12px;">需填写作业描述以区分相同名称的不同作业</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 作业附件上传 -->
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="作业附件:">
              <el-upload
                class="upload-demo"
                :file-list="attachmentFileList"
                :on-preview="handlePreview"
                :on-remove="handleRemove"
                :before-upload="beforeUpload"
                :http-request="handleCustomUpload"
                multiple
                :limit="10"
                :show-file-list="true"
              >
                <el-button size="small" type="primary">点击上传附件</el-button>
                <div slot="tip" class="el-upload__tip">支持上传多个附件，单个文件不超过100MB</div>
              </el-upload>
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
            :has-assigned-students="hasAssignedStudents"
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
import {getTaskInfoById, updateTaskAttachments, updateTaskDeadline} from '@/api/homeworkManage/assignTask'
import {getClassMembers} from '@/api/classManage/teacher'
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
        originalStudentList: [], // 当前班级的学生列表
        allStudentsList: [], // 所有已加载班级的学生列表（用于跨班级查找）
        selectedClassId: '',
        assignedStudentIds: new Set()
      },
      submitting: false,
      attachmentFileList: [], // 附件列表
      deadlineValue: null, // 截止日期值
      deadlineSaving: false // 截止日期保存状态
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

      // 如果更新了学生列表，需要合并到所有学生列表中
      if (newData.originalStudentList && newData.originalStudentList.length > 0) {
        const existingAllStudents = this.classData.allStudentsList || []
        const newStudents = newData.originalStudentList
        
        // 合并学生列表，避免重复
        const mergedStudents = [...existingAllStudents]
        newStudents.forEach(newStudent => {
          const exists = mergedStudents.find(s => s.id === newStudent.id)
          if (!exists) {
            mergedStudents.push(newStudent)
          } else {
            // 更新已存在的学生信息（可能分配状态有变化）
            const index = mergedStudents.findIndex(s => s.id === newStudent.id)
            mergedStudents[index] = { ...newStudent }
          }
        })
        
        this.classData.allStudentsList = mergedStudents
      }

      this.classData = {
        ...this.classData,
        classList: newData.classList || this.classData.classList,
        originalStudentList: newData.originalStudentList || this.classData.originalStudentList,
        selectedClassId: newData.selectedClassId || this.classData.selectedClassId,
        assignedStudentIds: newData.assignedStudentIds || this.classData.assignedStudentIds,
        allStudentsList: this.classData.allStudentsList || []
      }

      console.log('更新后的数据:', this.classData)
      console.groupEnd()

      // 如果学生列表更新了，重新计算已分配学生信息
      if (newData.originalStudentList || newData.assignedStudentIds) {
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
          // 更新截止日期值
          if (this.taskData.deadline) {
            // 将后端返回的日期字符串转换为日期选择器需要的格式
            const deadlineDate = new Date(this.taskData.deadline)
            const year = deadlineDate.getFullYear()
            const month = String(deadlineDate.getMonth() + 1).padStart(2, '0')
            const day = String(deadlineDate.getDate()).padStart(2, '0')
            const hours = String(deadlineDate.getHours()).padStart(2, '0')
            const minutes = String(deadlineDate.getMinutes()).padStart(2, '0')
            const seconds = String(deadlineDate.getSeconds()).padStart(2, '0')
            this.deadlineValue = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
          }
          // 加载附件列表
          this.loadAttachmentFiles()
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
    async updateAssignedStudentsInfo() {
      // 优先从所有已加载的学生列表中查找（包含所有班级的学生）
      const allStudents = this.classData.allStudentsList || []
      
      // 从所有学生列表中筛选出已分配的学生
      let assignedStudents = allStudents.filter(student =>
        this.classData.assignedStudentIds.has(student.id)
      )
      
      // 如果从已加载列表中找不到所有已分配学生，尝试从后端获取
      if (assignedStudents.length < this.classData.assignedStudentIds.size) {
        try {
          const response = await getTaskInfoById(this.taskId)
          if (response.code === 1 && response.data && response.data.assignedStudents) {
            const assignedIds = response.data.assignedStudents || []
            
            // 如果已加载列表中没有某些学生，需要获取这些学生的详细信息
            const missingIds = assignedIds.filter(id => 
              !allStudents.find(s => s.id === id)
            )
            
            if (missingIds.length > 0) {
              // 从所有班级中查找缺失的学生
              const allClassIds = this.classData.classList.map(c => c.classId)
              for (const classId of allClassIds) {
                try {
                  const studentsResponse = await getClassMembers({
                    classId: classId,
                    page: 1,
                    pageSize: 10000
                  })
                  
                  if (studentsResponse?.data?.rows) {
                    const classStudents = studentsResponse.data.rows.map(student => ({
                      id: student.userId,
                      studentId: student.studentId,
                      name: student.nickName,
                      className: this.classData.classList.find(c => c.classId === classId)?.className || '',
                      email: student.userName,
                      mobile: student.mobile,
                      school: student.school,
                      major: student.major,
                      dept: student.dept,
                      sex: student.sex,
                      isAssigned: this.classData.assignedStudentIds.has(student.userId)
                    }))
                    
                    // 添加到所有学生列表
                    classStudents.forEach(s => {
                      if (!allStudents.find(existing => existing.id === s.id)) {
                        allStudents.push(s)
                      }
                    })
                  }
                } catch (error) {
                  console.warn(`获取班级 ${classId} 的学生失败:`, error)
                }
              }
              
              // 更新所有学生列表
              this.classData.allStudentsList = allStudents
              
              // 重新筛选已分配学生
              assignedStudents = allStudents.filter(student =>
                this.classData.assignedStudentIds.has(student.id)
              )
            }
          }
        } catch (error) {
          console.error('获取已分配学生信息失败:', error)
        }
      }
      
      this.assignedStudentsInfo = assignedStudents

      // 打印日志查看
      console.group('父组件 - 已分配学生信息更新')
      console.log('已分配学生ID数量:', this.classData.assignedStudentIds.size)
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
      // 如果 evaluationDimensions 为 null 或 undefined，返回 false
      if (!evaluationDimensions || !Array.isArray(evaluationDimensions)) {
        return false
      }
      // 检查每个评价方法是否都有对应的维度设置
      return evaluationMethods.every(method => {
        const dimensions = evaluationDimensions.find(d => d.evaluationMethods === method)
        return dimensions && dimensions.evaluationTypes && dimensions.evaluationTypes.length > 0
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
    
    // 加载附件列表
    loadAttachmentFiles() {
      if (this.taskData.attachmentFiles && this.taskData.attachmentFiles.length > 0) {
        this.attachmentFileList = this.taskData.attachmentFiles.map((storedPath, index) => {
          // 从attachmentFileNames映射中获取原始文件名，如果没有则使用存储路径的文件名
          const originalName = (this.taskData.attachmentFileNames && this.taskData.attachmentFileNames[storedPath]) 
            ? this.taskData.attachmentFileNames[storedPath]
            : storedPath.split('/').pop() || storedPath
          return {
            name: originalName, // 显示原始文件名
            url: storedPath, // 存储路径用于下载
            uid: Date.now() + index,
            status: 'success' // 设置为success状态，确保显示删除按钮
          }
        })
      } else {
        this.attachmentFileList = []
      }
    },
    
    // 文件预览/下载
    async handlePreview(file) {
      try {
        const storedPath = file.url || file.name
        // 从attachmentFileNames映射中获取原始文件名
        const originalFileName = (this.taskData && this.taskData.attachmentFileNames && this.taskData.attachmentFileNames[storedPath])
          ? this.taskData.attachmentFileNames[storedPath]
          : storedPath.split('/').pop() || 'file'
        
        // 直接调用file-service的接口（8082端口）
        const fileServiceUrl = `http://localhost:8082/file/showFile?fileType=teacherTask&fileName=${encodeURIComponent(storedPath)}`
        
        // 使用axios下载文件，添加token认证
        const axios = require('axios')
        const response = await axios.get(fileServiceUrl, {
          responseType: 'blob',
          timeout: 60000,
          headers: {
            'token': this.$store.getters.token || ''
          }
        })
        
        // 创建blob对象并下载
        const blob = new Blob([response.data])
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', originalFileName)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        this.$message.success('文件下载成功')
      } catch (error) {
        console.error('下载附件失败:', error)
        this.$message.error('下载附件失败，请稍后重试')
      }
    },
    
    // 文件移除
    async handleRemove(file, fileList) {
      this.attachmentFileList = fileList
      // 计算要保留的文件路径（已存在的文件，不包括新上传但未保存的）
      const keepFilePaths = fileList
        .filter(f => f.url) // 只保留已有URL的文件（已保存的文件）
        .map(f => f.url)
      
      // 新上传的文件（还没有URL的）
      const newFiles = fileList
        .filter(f => f.raw && !f.url)
        .map(f => f.raw)
      
      try {
        // 传递要保留的文件路径和新上传的文件
        await updateTaskAttachments(this.taskId, newFiles, keepFilePaths)
        this.$message.success('已移除附件')
        // 刷新附件列表
        await this.refreshAssignmentStatus()
      } catch (error) {
        console.error('移除附件失败:', error)
        this.$message.error('移除附件失败')
      }
    },
    
    // 上传前验证
    beforeUpload(file) {
      const isValidSize = file.size / 1024 / 1024 < 100
      if (!isValidSize) {
        this.$message.error('文件大小不能超过100MB')
        return false
      }
      return true
    },
    
    // 自定义上传
    async handleCustomUpload(options) {
      const { file } = options
      try {
        // 获取当前已保存的文件路径（不包括新上传的文件）
        const keepFilePaths = this.attachmentFileList
          .filter(f => f.url && !f.raw) // 只保留已保存的文件
          .map(f => f.url)
        
        const response = await updateTaskAttachments(this.taskId, [file], keepFilePaths)
        if (response.code === 1) {
          this.$message.success('附件上传成功')
          // 刷新附件列表
          await this.refreshAssignmentStatus()
        } else {
          this.$message.error(response.msg || '附件上传失败')
        }
      } catch (error) {
        this.$message.error('附件上传失败，请重试')
        console.error('上传失败:', error)
      }
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
    },

    // 格式化提交类型，将"演讲稿"显示为"文稿"
    formatSubmissionTypes(submissionTypes) {
      if (!submissionTypes || !Array.isArray(submissionTypes)) {
        return '';
      }
      return submissionTypes.map(type => type === '演讲稿' ? '文稿' : type).join('、');
    },
    
    // 处理截止日期变更
    async handleDeadlineChange(value) {
      if (!value) {
        return
      }
      
      // 检查日期是否改变
      if (this.taskData.deadline) {
        const oldDeadline = new Date(this.taskData.deadline).getTime()
        const newDeadline = new Date(value).getTime()
        if (oldDeadline === newDeadline) {
          return // 日期没有改变，不需要保存
        }
      }
      
      this.deadlineSaving = true
      try {
        const response = await updateTaskDeadline(this.taskId, value)
        if (response.code === 1) {
          this.$message.success('截止日期更新成功')
          // 刷新任务数据
          await this.refreshAssignmentStatus()
        } else {
          throw new Error(response.msg || '更新失败')
        }
      } catch (error) {
        console.error('更新截止日期失败:', error)
        this.$message.error('更新截止日期失败：' + (error.message || '未知错误'))
        // 恢复原值
        if (this.taskData.deadline) {
          const deadlineDate = new Date(this.taskData.deadline)
          const year = deadlineDate.getFullYear()
          const month = String(deadlineDate.getMonth() + 1).padStart(2, '0')
          const day = String(deadlineDate.getDate()).padStart(2, '0')
          const hours = String(deadlineDate.getHours()).padStart(2, '0')
          const minutes = String(deadlineDate.getMinutes()).padStart(2, '0')
          const seconds = String(deadlineDate.getSeconds()).padStart(2, '0')
          this.deadlineValue = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
        }
      } finally {
        this.deadlineSaving = false
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
::v-deep .el-tabs__content {
  overflow: visible !important;
}

::v-deep .el-tab-pane {
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
