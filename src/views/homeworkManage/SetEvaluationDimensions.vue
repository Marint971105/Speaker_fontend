<template>
  <div class="evaluation-dimensions bg-gray-50 min-h-screen p-6">
    <!-- Top Bar -->
    <el-card class="mb-6">
      <div class="top-section">
        <div class="left-section">
          <h2 class="page-title">评价维度设置</h2>
          <div class="evaluation-tabs">
            <button
              v-for="method in evaluationMethods"
              :key="method"
              class="evaluation-tab-btn"
              :class="{ active: activeMethod === method }"
              @click="activeMethod = method"
            >
              {{ method }}
            </button>
          </div>
        </div>

        <div class="right-section">
          <div class="template-buttons">
            <el-button-group>
              <el-button
                size="small"
                type="primary"
                plain
                @click="applyBasicTemplate"
              >基础模板</el-button>
              <el-button
                size="small"
                type="primary"
                plain
                @click="startCustomTemplate"
              >自定义模板</el-button>
            </el-button-group>
          </div>
          <!-- 保存按钮部分 -->
          <el-button
            type="primary"
            size="small"
            @click="submitEvaluationDimensions"
            :loading="loading"
          >提交评价维度</el-button>
        </div>
      </div>
    </el-card>

    <!-- Content Types Grid -->
    <div class="types-grid">
      <el-card v-for="type in modalTypes" :key="type" class="type-card">
        <div class="type-header">
          <span class="title-text">{{ type }}</span>
        </div>

        <div class="dimensions-container">
          <!-- 评价维度列表 -->
          <div
            v-for="(dimension, index) in getDimensionsByType(type)"
            :key="index"
            class="dimension-block"
          >
            <!-- 评价维度标题区域 -->
            <div class="dimension-title-area">
              <div class="dimension-title-left" @click.stop="toggleDimension(type, index)">
                <i 
                  :class="['el-icon-arrow-down', 'expand-icon', { 'expanded': isDimensionExpanded(type, index) }]"
                ></i>
              </div>
              <div class="dimension-input-group" @click.stop>
                <el-input
                  v-model="dimension.evaluationTitle"
                  :disabled="activeMethod === '机评'"
                  size="small"
                  placeholder="请输入标题"
                >
                </el-input>
                <el-button
                  v-if="activeMethod !== '机评'"
                  type="text"
                  icon="el-icon-delete"
                  class="delete-btn"
                  @click.stop="removeDimension(type, index)"
                ></el-button>
              </div>
            </div>

            <!-- 评价维度列表 - 可折叠 -->
            <div 
              v-show="isDimensionExpanded(type, index)"
              class="points-container"
            >
              <div class="points-title">评价维度</div>
              <div class="points-list">
                <div
                  v-for="(point, pIndex) in dimension.evaluationInfos"
                  :key="pIndex"
                  class="point-item"
                >
                  <el-input
                    v-model="dimension.evaluationInfos[pIndex]"
                    :disabled="activeMethod === '机评'"
                    size="small"
                    placeholder="请输入评价维度描述"
                  >
                  </el-input>
                  <el-button
                    v-if="activeMethod !== '机评'"
                    type="text"
                    icon="el-icon-delete"
                    class="delete-btn"
                    @click="removePoint(dimension, pIndex)"
                  ></el-button>
                </div>
              </div>

              <!-- 添加评价维度按钮 -->
              <el-button
                v-if="activeMethod !== '机评'"
                type="text"
                size="small"
                class="add-btn add-point-btn"
                @click="addPoint(dimension)"
              >
                <i class="el-icon-plus"></i> 添加评价维度
              </el-button>
            </div>
          </div>

          <!-- 添加评价维度按钮 -->
          <el-button
            v-if="activeMethod !== '机评'"
            type="text"
            size="small"
            class="add-btn add-dimension-btn"
            @click="addDimension(type)"
          >
            <i class="el-icon-plus"></i> 添加评价维度
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import defaultTemplate from './defaultTemplate'
import { setTaskEvaluation, getTaskInfoById } from '@/api/homeworkManage/assignTask'

export default {
  name: 'SetEvaluationDimensions',

  props: {
    taskId: {
      type: String,
      required: true
    },
    hasAssignedStudents: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      loading: false,
      activeMethod: '师评',
      evaluationMethods: ['师评', '互评', '自评', '机评'],
      modalTypes: ['视频', '音频', 'PPT', '演讲稿'],
      evaluationData: [],
      hasAutoAppliedTemplate: false, // 标记是否已自动应用基础模板
      expandedDimensions: {} // 存储每个评价维度的展开状态，格式：{ 'type-method-index': true/false }
    }
  },

  created() {
    this.initializeData()
  },
  
  watch: {
    // 监听是否有学生分配，如果有学生分配且没有评价维度数据，自动应用基础模板
    async hasAssignedStudents(newVal) {
      if (newVal && !this.hasAutoAppliedTemplate) {
        // 检查是否已有评价维度数据（从后端获取）
        try {
          const taskResponse = await getTaskInfoById(this.taskId)
          if (taskResponse && taskResponse.data && taskResponse.data.evaluationDimensions && 
              Array.isArray(taskResponse.data.evaluationDimensions) && 
              taskResponse.data.evaluationDimensions.length > 0) {
            // 如果后端已有评价维度数据，不自动应用
            return
          }
        } catch (error) {
          console.error('检查评价维度数据失败:', error)
        }
        
        // 检查本地存储
        const stored = localStorage.getItem(`evaluation_${this.taskId}`)
        if (!stored) {
          // 如果没有存储的评价维度数据，自动应用基础模板（会自动提交）
          this.hasAutoAppliedTemplate = true
          await this.applyBasicTemplate()
        }
      }
    }
  },

  methods: {
    // 初始化数据
    async initializeData() {
      const stored = localStorage.getItem(`evaluation_${this.taskId}`)
      if (stored) {
        this.evaluationData = JSON.parse(stored)
      } else {
        // 如果有学生分配，自动应用基础模板；否则等待学生分配后再应用
        if (this.hasAssignedStudents && !this.hasAutoAppliedTemplate) {
          this.hasAutoAppliedTemplate = true
          await this.applyBasicTemplate()
        }
      }
    },

    // 获取指定类型的维度列表
    getDimensionsByType(type) {
      const method = this.evaluationData.find(m => m.evaluationMethods === this.activeMethod)
      if (!method) return []

      const modalType = method.evaluationTypes.find(t => t.evaluationContent === type)
      return modalType ? modalType.evaluationTitles : []
    },

    // 获取评价维度的唯一键
    getDimensionKey(type, index) {
      return `${this.activeMethod}-${type}-${index}`
    },

    // 检查评价维度是否展开
    isDimensionExpanded(type, index) {
      const key = this.getDimensionKey(type, index)
      // 默认折叠，如果已设置则使用设置的值
      return this.expandedDimensions[key] === true
    },

    // 切换评价维度的展开/折叠状态
    toggleDimension(type, index) {
      const key = this.getDimensionKey(type, index)
      this.$set(this.expandedDimensions, key, !this.expandedDimensions[key])
    },

    // 应用模板
    // 直接应用基础模板
    async applyBasicTemplate() {
      this.evaluationData = _.cloneDeep(defaultTemplate)
      this.saveToLocal()
      // 自动应用基础模板后，自动提交
      try {
        await this.submitEvaluationDimensions()
        // 提交成功消息在 submitEvaluationDimensions 中已显示
      } catch (error) {
        console.error('自动提交基础模板失败:', error)
        this.$message.warning('已应用基础模板，但自动提交失败，请手动点击"提交"按钮')
      }
    },
// 开始自定义模板
    startCustomTemplate() {
      // 清空现有数据，创建空白模板
      this.evaluationData = this.evaluationMethods.map(method => ({
        evaluationMethods: method,
        evaluationTypes: this.modalTypes.map(type => ({
          evaluationContent: type,
          evaluationTitles: []
        }))
      }))
      this.saveToLocal()
      this.$message.success('已切换到自定义模板模式')
    },
    // 保存到本地
    saveToLocal() {
      localStorage.setItem(
        `evaluation_${this.taskId}`,
        JSON.stringify(this.evaluationData)
      )
    },

    // 添加维度
    addDimension(type) {
      const method = this.evaluationData.find(m => m.evaluationMethods === this.activeMethod)
      const modalType = method.evaluationTypes.find(t => t.evaluationContent === type)

      modalType.evaluationTitles.push({
        evaluationTitle: '',
        evaluationInfos: []
      })
    },

    // 删除维度
    removeDimension(type, index) {
      this.$confirm('确认删除此评价维度？', '提示', {
        type: 'warning'
      }).then(() => {
        const method = this.evaluationData.find(m => m.evaluationMethods === this.activeMethod)
        const modalType = method.evaluationTypes.find(t => t.evaluationContent === type)
        modalType.evaluationTitles.splice(index, 1)
      }).catch(() => {})
    },

    // 添加评价点
    addPoint(dimension) {
      dimension.evaluationInfos.push('')
    },

    // 删除评价点
    removePoint(dimension, index) {
      this.$confirm('确认删除此评价点？', '提示', {
        type: 'warning'
      }).then(() => {
        dimension.evaluationInfos.splice(index, 1)
      }).catch(() => {})
    },

    // 验证数据
    validateData() {
      let isValid = true
      let message = ''

      for (const method of this.evaluationData) {
        if (method.evaluationMethods === '机评') continue

        for (const type of method.evaluationTypes) {
          for (const title of type.evaluationTitles) {
            if (!title.evaluationTitle?.trim()) {
              isValid = false
              message = `${method.evaluationMethods}的${type.evaluationContent}中存在未填写的维度标题`
              break
            }

            if (!title.evaluationInfos?.length) {
              isValid = false
              message = `${method.evaluationMethods}的${type.evaluationContent}中的"${title.evaluationTitle}"没有评价点`
              break
            }

            if (title.evaluationInfos.some(info => !info?.trim())) {
              isValid = false
              message = `${method.evaluationMethods}的${type.evaluationContent}中的"${title.evaluationTitle}"存在空的评价点`
              break
            }
          }

          if (!isValid) break
        }

        if (!isValid) break
      }

      return { isValid, message }
    },

    // 提交评价维度
    async submitEvaluationDimensions() {
      try {
        // 先验证数据
        const { isValid, message } = this.validateData()
        if (!isValid) {
          this.$message.error(message)
          return
        }

        // 设置loading状态
        this.loading = true

        // 准备提交的数据
        const submitData = {
          taskId: this.taskId,
          evaluationDimensions: this.evaluationData
        }

        // 调用接口
        const response = await setTaskEvaluation(submitData)

        if (response.code === 1) {
          // 提交成功
          this.$message.success('提交成功')

          // 用返回的数据更新页面
          if (response.data && response.data.evaluationDimensions) {
            // 保存当前选中的评价方式
            const currentMethod = this.activeMethod

            // 更新数据
            this.evaluationData = response.data.evaluationDimensions

            // 恢复选中的评价方式
            this.activeMethod = currentMethod

            // // 保存到本地存储
            // this.saveToLocal()
          }
        } else {
          // 提交失败
          throw new Error(response.msg || '提交失败')
        }
      } catch (error) {
        this.$message.error('提交失败：' + error.message)
      } finally {
        // 取消loading状态
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.evaluation-dimensions {
  min-width: 1200px;
  padding: 20px;
}

/* 顶部区域样式 */
.top-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 24px;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

/* 评价方式按钮组样式 */
.evaluation-tabs {
  display: flex;
  gap: 8px;
  padding: 4px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.evaluation-tab-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  border: none;
  background: none;
  cursor: pointer;
  color: #606266;
  transition: all 0.3s ease;
}

.evaluation-tab-btn:hover {
  color: #409EFF;
  background-color: #ecf5ff;
}

.evaluation-tab-btn.active {
  background-color: #409EFF;
  color: white;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
}

/* 类型网格布局 */
.types-grid {
  display: flex;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  gap: 16px;
  margin-top: 16px;
  width: 100%;
}

.type-card {
  flex: 1 1 0 !important;
  min-width: 280px !important;
  max-width: calc(25% - 12px) !important;
  box-sizing: border-box;
}

/* 类型卡片头部 */
.type-header {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.title-text {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

/* 维度容器 */
.dimensions-container {
  padding: 16px;
  overflow-y: auto;
  max-height: calc(100vh - 300px);
}

/* 维度块样式 */
.dimension-block {
  background-color: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
}

.dimension-title-area {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  background-color: #fafafa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  transition: background-color 0.2s;
}

.dimension-title-area:hover {
  background-color: #f0f2f5;
}

.dimension-title-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-right: 12px;
  cursor: pointer;
}

.expand-icon {
  font-size: 14px;
  color: #606266;
  transition: transform 0.3s ease;
  cursor: pointer;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.expand-icon:hover {
  color: #409EFF;
}

.dimension-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  user-select: none;
  margin-bottom: 0;
}

.dimension-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

/* 评价点容器 */
.points-container {
  padding: 0 8px;
}

.points-title {
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
  font-weight: 500;
}

.points-list {
  margin-bottom: 12px;
}

/* 评价点条目 */
.point-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.point-item:last-child {
  margin-bottom: 0;
}

/* 按钮样式 */
.add-btn {
  color: #409eff;
}

.add-point-btn {
  margin-left: 8px;
  padding: 4px 0;
}

.add-dimension-btn {
  width: 100%;
  margin-top: 16px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn {
  color: #f56c6c;
  padding: 4px;
}

.delete-btn:hover {
  color: #f78989;
}

/* Element UI 组件样式覆盖 */
::v-deep .el-card__body {
  padding: 0;
  height: 100%;
}

::v-deep .el-input__inner {
  font-size: 13px;
}

::v-deep .el-button--text {
  padding: 0;
}

/* 确保父组件不会限制宽度 */
::v-deep .el-tabs__content {
  overflow: visible !important;
}

::v-deep .el-tab-pane {
  min-width: 1200px !important;
}
</style>
