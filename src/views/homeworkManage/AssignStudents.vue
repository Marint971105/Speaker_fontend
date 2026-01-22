<template>
  <div class="assign-task-container">
    <!-- 顶部操作区 -->
    <div class="header-section">
      <el-row :gutter="20" type="flex" align="middle">
        <!-- 班级选择 -->
        <el-col :span="6">
          <el-select
            v-model=" selectedClassId"
            placeholder="请选择班级"
            class="full-width"
            @change="handleClassChange"
          >
            <el-option
              v-for="item in classList"
              :key="item.classId"
              :label="item.className"
              :value="item.classId"
            />
          </el-select>
        </el-col>

        <!-- 搜索区域 -->
        <el-col :span="18">
          <el-form :inline="true" class="search-form">
            <el-form-item>
              <el-input
                v-model="searchForm.name"
                placeholder="学生姓名"
                clearable
                @input="handleSearch"
                @clear="handleSearch"
                @keyup.enter.native="handleSearch"
              >
                <template #prefix>
                  <i class="el-icon-user"></i>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-input
                v-model="searchForm.studentId"
                placeholder="学号"
                clearable
                @input="handleSearch"
                @clear="handleSearch"
                @keyup.enter.native="handleSearch"
              >
                <template #prefix>
                  <i class="el-icon-notebook-2"></i>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">搜索</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>
    </div>

    <!-- 学生列表 -->
    <div class="table-section">
      <div class="table-header">
        <span>学生列表（共 {{ total }} 人）</span>
        <div class="batch-actions">
          <el-button
            type="primary"
            :disabled="selectedUnassignedCount === 0"
            @click="handleAssign"
          >
            批量分配{{ selectedUnassignedCount > 0 ? `（${selectedUnassignedCount} 人）` : '' }}
          </el-button>
          <el-button
            type="danger"
            :disabled="selectedAssignedCount === 0"
            @click="handleUnassign"
          >
            批量取消分配{{ selectedAssignedCount > 0 ? `（${selectedAssignedCount} 人）` : '' }}
          </el-button>
          <span v-if="selectedStudentIds.size > 0" class="selection-hint">
            已选 {{ selectedStudentIds.size }} 人
          </span>
        </div>
      </div>

      <el-table
        ref="studentTable"
        v-loading="loading"
        :data="studentList"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="studentId" label="学号" width="120" align="center" />
        <el-table-column prop="name" label="姓名" width="120" align="center" />
        <el-table-column prop="className" label="班级" width="120" align="center" />
        <el-table-column prop="email" label="邮箱" min-width="200" align="center" />
        <el-table-column prop="assignStatus" label="分配状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isAssigned ? 'success' : 'info'">
              {{ row.isAssigned ? '已分配' : '未分配' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template #default="{ row }">
            <el-button
              v-if="!row.isAssigned"
              type="text"
              @click="handleSingleAssign(row)"
            >
              分配作业
            </el-button>
            <el-button
              v-else
              type="text"
              style="color: #f56c6c"
              @click="handleSingleUnassign(row)"
            >
              取消分配
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页器 -->
      <div class="pagination-container">
        <el-pagination
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { getClasses, getClassMembers } from '@/api/classManage/teacher'
import {assignStudentsToTask, unassignStudentsFromTask} from '@/api/homeworkManage/assignTask'
import {getTaskInfoById} from '@/api/homeworkManage/assignTask'
import { mapGetters } from 'vuex'
export default {
  name: 'AssignStudents',

  props: {
    taskId: {
      type: String,
      required: true
    },
    classData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      selectedClassId: '',
      classList: [], // 保存所有班级信息
      originalStudentList: [], // 保存原始学生数据
      studentList: [], // 用于显示的筛选后的学生数据
      selectedStudents: [], // 当前页选中的学生（用于显示）
      selectedStudentIds: new Set(), // 所有选中的学生ID（跨页保存）
      total: 0,
      searchForm: {
        name: '',
        studentId: ''
      },
      currentPage: 1,
      pageSize: 10,
      loading: false,
      assignedStudentIds: new Set()
    }
  },
  computed: {
    ...mapGetters(['userId']), // 从 Vuex 映射 userId
    // 将 Set 转换为数组以便响应式追踪
    selectedStudentIdsArray() {
      return Array.from(this.selectedStudentIds)
    },
    // 计算已选中的未分配学生数量
    selectedUnassignedCount() {
      return this.selectedStudentIdsArray.filter(id => {
        // 先从 originalStudentList 查找
        let student = this.originalStudentList.find(s => s.id === id)
        // 如果找不到，从 studentList 查找（可能在不同页）
        if (!student) {
          student = this.studentList.find(s => s.id === id)
        }
        // 如果还是找不到，尝试从 assignedStudentIds 判断
        if (!student) {
          return !this.assignedStudentIds.has(id)
        }
        return student && !student.isAssigned
      }).length
    },
    // 计算已选中的已分配学生数量
    selectedAssignedCount() {
      return this.selectedStudentIdsArray.filter(id => {
        // 先从 originalStudentList 查找
        let student = this.originalStudentList.find(s => s.id === id)
        // 如果找不到，从 studentList 查找（可能在不同页）
        if (!student) {
          student = this.studentList.find(s => s.id === id)
        }
        // 如果还是找不到，尝试从 assignedStudentIds 判断
        if (!student) {
          return this.assignedStudentIds.has(id)
        }
        return student && student.isAssigned
      }).length
    }
  },
  async created() {
    await this.fetchClassList()
    if (this.classData.selectedClassId) {
      this.selectedClassId = this.classData.selectedClassId
      await this.fetchStudents()
    }
  },
  watch: {
    'searchForm': {
      deep: true,
      handler() {
        this.handleSearch()
      }
    },
    'classData': {
      immediate: true,
      deep: true,
      handler(newData) {
        if (newData.selectedClassId) {
          this.selectedClassId = newData.selectedClassId
        }
        if (newData.assignedStudentIds) {
          this.assignedStudentIds = new Set(newData.assignedStudentIds)
        }
      }
    },
    // 监听已分配学生ID的变化，自动选择包含这些学生的班级
    'classData.assignedStudentIds': {
      handler(newVal, oldVal) {
        // 当从空变为有值，且还没有选择班级时，自动选择班级
        if (newVal && newVal.size > 0 && !this.selectedClassId && this.classList.length > 0) {
          this.autoSelectClassWithAssignedStudents()
        }
      },
      deep: true
    },
  },
  methods: {
    async fetchClassList() {
      this.loading = true
      try {
        const response = await getClasses(this.userId)
        if (response.code === 1 && response.data) {
          this.classList = response.data.rows
          // 同步到父组件
          this.$emit('update:classData', {
            ...this.classData,
            classList: response.data.rows
          })
        } else {
          throw new Error(response.msg || '获取班级列表失败')
        }
      } catch (error) {
        console.error('获取班级列表失败:', error)
        this.$message.error(error.message || '获取班级列表失败')
      } finally {
        this.loading = false
      }
    },

    // 自动选择包含已分配学生的班级
    async autoSelectClassWithAssignedStudents() {
      if (!this.classList.length || !this.classData.assignedStudentIds.size) return

      try {
        // 遍历所有班级，找到包含已分配学生的班级
        for (const classItem of this.classList) {
          const studentsResponse = await getClassMembers({
            classId: classItem.classId,
            page: 1,
            pageSize: 9999 // 获取所有学生
          })

          if (studentsResponse?.data?.rows) {
            const classStudentIds = new Set(
              studentsResponse.data.rows.map(s => s.userId)
            )
            
            // 检查这个班级是否包含已分配的学生
            const hasAssignedStudents = Array.from(this.classData.assignedStudentIds).some(
              id => classStudentIds.has(id)
            )

            if (hasAssignedStudents) {
              // 找到包含已分配学生的班级，自动选择
              this.selectedClassId = classItem.classId
              this.$emit('update:classData', {
                ...this.classData,
                selectedClassId: classItem.classId
              })
              await this.fetchStudents()
              return // 找到第一个就返回
            }
          }
        }
      } catch (error) {
        console.error('自动选择班级失败:', error)
      }
    },

    async fetchStudents() {
      if (!this.selectedClassId) return

      this.loading = true
      try {
        // 获取学生列表 - 传递一个很大的pageSize以获取所有学生数据，然后在前端进行分页
        const studentsResponse = await getClassMembers({
          classId: this.selectedClassId,
          page: 1,
          pageSize: 10000  // 设置一个很大的值以获取所有学生
        })

        if (!studentsResponse?.data?.rows) {
          throw new Error('获取学生数据失败')
        }

        // 获取作业分配状态
        const taskResponse = await getTaskInfoById(this.taskId)
        if (taskResponse.code === 1 && taskResponse.data) {
          this.assignedStudentIds = new Set(taskResponse.data.assignedStudents || [])
          // 同步到父组件
          this.$emit('update:classData', {
            ...this.classData,
            assignedStudentIds: this.assignedStudentIds
          })
        }

        // 处理学生数据
        const currentClassStudents = studentsResponse.data.rows.map(student => ({
          id: student.userId,
          studentId: student.studentId,
          name: student.nickName,
          className: this.getClassName(this.selectedClassId),
          email: student.userName,
          mobile: student.mobile,
          school: student.school,
          major: student.major,
          dept: student.dept,
          sex: student.sex,
          isAssigned: this.assignedStudentIds.has(student.userId)
        }))
        
        // 更新当前班级的学生列表
        this.originalStudentList = currentClassStudents
        
        // 同步到父组件（包含当前班级的学生列表）
        this.$emit('update:classData', {
          ...this.classData,
          originalStudentList: this.originalStudentList
        })
        // 更新显示数据（filterAndPaginateData中会处理选中状态的恢复）
        this.filterAndPaginateData()
        
        console.log('获取到的原始学生列表:', this.originalStudentList)
      } catch (error) {
        console.error('获取数据失败:', error)
        this.$message.error(error.message || '获取数据失败')
      } finally {
        this.loading = false
      }
    },


    filterAndPaginateData() {
      // 先复制原始数据
      let filteredData = [...this.originalStudentList]

      const searchName = this.searchForm.name.trim().toLowerCase()
      const searchId = this.searchForm.studentId.trim().toLowerCase()

      // 如果有搜索条件才进行过滤
      if (searchName || searchId) {
        filteredData = filteredData.filter(student => {
          const matchName = searchName ?
            (student.name || '').toLowerCase().includes(searchName) :
            true
          const matchId = searchId ?
            (student.studentId || '').toLowerCase().includes(searchId) :
            true

          // 如果输入了名字和学号，需要同时匹配
          // 如果只输入了其中一个，只需匹配输入的那个
          return matchName && matchId
        })
      }

      // 更新总数和分页数据
      this.total = filteredData.length

      // 计算分页
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize

      // 更新显示的数据
      this.studentList = filteredData.slice(start, end)

      // 恢复选中状态（根据跨页保存的选中ID）
      // 收集需要选中的学生ID集合
      const shouldBeSelected = new Set()
      
      // 跨页选中的学生（包括已分配和未分配的）都要选中
      this.studentList.forEach(student => {
        if (this.selectedStudentIds.has(student.id)) {
          shouldBeSelected.add(student.id)
        }
      })
      
      // 更新当前页的选中列表（用于显示）
      this.selectedStudents = this.studentList.filter(student => 
        shouldBeSelected.has(student.id)
      )
      
      // 使用nextTick确保DOM更新完成后再恢复选中状态
      this.$nextTick(() => {
        if (this.$refs.studentTable) {
          // 先清空当前页的选中状态
          this.$refs.studentTable.clearSelection()
          
          // 延迟一下确保清空操作完成，然后恢复选中状态
          setTimeout(() => {
            // 恢复选中状态
            this.studentList.forEach(student => {
              if (shouldBeSelected.has(student.id)) {
                try {
                  this.$refs.studentTable.toggleRowSelection(student, true)
                } catch (e) {
                  console.warn('恢复选中状态失败:', student.id, e)
                }
              }
            })
          }, 100)
        }
      })

      // 添加日志便于调试
      console.log('搜索条件:', {
        name: searchName,
        id: searchId
      })
      console.log('过滤后的数据:', filteredData)
      console.log('当前选中的学生ID:', Array.from(this.selectedStudentIds))
    },

    // 检查作业分配状态
    async checkAssignmentStatus() {
      try {
        const response = await getTaskInfoById(this.$route.params.taskId)

        if (response.code === 1 && response.data) {
          // 获取已分配的学生ID列表(去重)
          const assignedStudentIds = [...new Set(response.data.assignedStudents)]

          // 更新学生列表的分配状态
          this.studentList = this.studentList.map(student => ({
            ...student,
            isAssigned: assignedStudentIds.includes(student.id)
          }))
        }
      } catch (error) {
        this.$message.error('获取分配状态失败')
      }
    },


    // 获取班级名称
    getClassName(classId) {
      const classInfo = this.classList.find(c => c.classId === classId)
      return classInfo ? classInfo.className : ''
    },

    // 班级变更处理
    async handleClassChange(classId) {
      this.selectedClassId = classId
      this.$emit('update:classData', {
        ...this.classData,
        selectedClassId: classId
      })
      // 切换班级时清空选中状态
      this.selectedStudentIds.clear()
      this.selectedStudents = []
      this.currentPage = 1
      await this.fetchStudents()
    },

    // 搜索处理 - 直接使用本地数据
    handleSearch() {
      this.currentPage = 1
      this.filterAndPaginateData()
    },


    resetSearch() {
      // 重置搜索表单
      this.searchForm = {
        name: '',
        studentId: ''
      }
      // 重置页码
      this.currentPage = 1
      // 重新获取数据
      this.filterAndPaginateData()
    },

    // 选择变更处理 - 支持跨页选取（包括已分配和未分配的学生）
    handleSelectionChange(selection) {
      // 获取当前页所有学生的ID集合
      const currentPageAllIds = new Set(
        this.studentList.map(s => s.id)
      )
      
      // 获取当前页选中学生的ID集合
      const selectedIds = new Set(selection.map(s => s.id))
      
      // 更新跨页选中集合：
      // 1. 当前页选中的学生，添加到跨页选中集合
      // 2. 当前页取消选中的学生，从跨页选中集合中移除
      currentPageAllIds.forEach(id => {
        if (selectedIds.has(id)) {
          // 当前页选中，添加到跨页选中集合
          this.selectedStudentIds.add(id)
        } else {
          // 当前页未选中，从跨页选中集合中移除
          this.selectedStudentIds.delete(id)
        }
      })
      
      // 更新当前页的选中列表
      this.selectedStudents = selection
      
      // 触发响应式更新：通过重新赋值 Set 来触发计算属性更新
      const newSet = new Set(this.selectedStudentIds)
      this.$set(this, 'selectedStudentIds', newSet)
    },

    // 分页改变
    handleSizeChange(val) {
      this.pageSize = val
      this.filterAndPaginateData()
    },

    handleCurrentChange(val) {
      this.currentPage = val
      this.filterAndPaginateData()
    },

    // 分配后更新状态
    async handleSingleAssign(student) {
      try {
        await assignStudentsToTask(this.taskId, [student.id])

        // 更新本地状态
        this.assignedStudentIds.add(student.id)
        this.$emit('update:classData', {
          ...this.classData,
          assignedStudentIds: this.assignedStudentIds
        })

        // 更新表格数据
        await this.fetchStudents()
        this.$message.success('分配成功')
        this.$emit('update:assignedStudents', true)
      } catch (error) {
        console.error('分配失败:', error)
        this.$message.error('分配失败')
      }
    },

    async handleAssign() {
      // 筛选出未分配的学生ID
      const unassignedIds = Array.from(this.selectedStudentIds).filter(id => {
        // 先从 originalStudentList 查找
        let student = this.originalStudentList.find(s => s.id === id)
        // 如果找不到，从 studentList 查找
        if (!student) {
          student = this.studentList.find(s => s.id === id)
        }
        // 如果还是找不到，从 assignedStudentIds 判断
        if (!student) {
          return !this.assignedStudentIds.has(id)
        }
        return student && !student.isAssigned
      })
      
      console.log('准备分配的学生ID:', unassignedIds)
      console.log('选中的学生ID:', Array.from(this.selectedStudentIds))
      
      if (unassignedIds.length === 0) {
        this.$message.warning('请选择要分配的学生')
        return
      }

      try {
        // 调用分配接口
        await assignStudentsToTask(this.taskId, unassignedIds)

        // 更新本地状态
        unassignedIds.forEach(id => this.assignedStudentIds.add(id))

        // 发送更新到父组件
        this.$emit('update:classData', {
          ...this.classData,
          assignedStudentIds: this.assignedStudentIds
        })

        // 从选中集合中移除已分配的学生
        unassignedIds.forEach(id => this.selectedStudentIds.delete(id))

        // 更新表格数据
        await this.fetchStudents()

        // 清除选择
        this.$nextTick(() => {
          if (this.$refs.studentTable) {
            this.$refs.studentTable.clearSelection()
          }
        })

        // 提示成功
        this.$message.success(`成功分配 ${unassignedIds.length} 名学生`)

        // 通知父组件更新
        this.$emit('update:assignedStudents', true)
      } catch (error) {
        console.error('批量分配失败:', error)
        this.$message.error('分配失败：' + (error.message || '未知错误'))
      }
    },

    // 批量取消分配
    async handleUnassign() {
      // 筛选出已分配的学生ID
      const assignedIds = Array.from(this.selectedStudentIds).filter(id => {
        // 先从 originalStudentList 查找
        let student = this.originalStudentList.find(s => s.id === id)
        // 如果找不到，从 studentList 查找
        if (!student) {
          student = this.studentList.find(s => s.id === id)
        }
        // 如果还是找不到，从 assignedStudentIds 判断
        if (!student) {
          return this.assignedStudentIds.has(id)
        }
        return student && student.isAssigned
      })
      
      console.log('准备取消分配的学生ID:', assignedIds)
      console.log('选中的学生ID:', Array.from(this.selectedStudentIds))
      
      if (assignedIds.length === 0) {
        this.$message.warning('请选择要取消分配的学生')
        return
      }

      try {
        // 调用取消分配接口
        await unassignStudentsFromTask(this.taskId, assignedIds)

        // 更新本地状态
        assignedIds.forEach(id => this.assignedStudentIds.delete(id))

        // 发送更新到父组件
        this.$emit('update:classData', {
          ...this.classData,
          assignedStudentIds: this.assignedStudentIds
        })

        // 从选中集合中移除已取消分配的学生
        assignedIds.forEach(id => this.selectedStudentIds.delete(id))

        // 更新表格数据
        await this.fetchStudents()

        // 清除选择
        this.$nextTick(() => {
          if (this.$refs.studentTable) {
            this.$refs.studentTable.clearSelection()
          }
        })

        // 提示成功
        this.$message.success(`成功取消分配 ${assignedIds.length} 名学生`)

        // 通知父组件更新
        this.$emit('update:assignedStudents', true)
      } catch (error) {
        console.error('批量取消分配失败:', error)
        this.$message.error('取消分配失败：' + (error.message || '未知错误'))
      }
    },

    // 单个取消分配
    async handleSingleUnassign(student) {
      try {
        await unassignStudentsFromTask(this.taskId, [student.id])

        // 更新本地状态
        this.assignedStudentIds.delete(student.id)
        this.$emit('update:classData', {
          ...this.classData,
          assignedStudentIds: this.assignedStudentIds
        })

        // 更新表格数据
        await this.fetchStudents()
        this.$message.success('取消分配成功')
        this.$emit('update:assignedStudents', true)
      } catch (error) {
        console.error('取消分配失败:', error)
        this.$message.error('取消分配失败')
      }
    }
  }
}
</script>

<style scoped>

.assign-task-container {
  padding: 20px;
}

.header-section {
  margin-bottom: 20px;
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.full-width {
  width: 100%;
}

.search-form {
  display: flex;
  justify-content: flex-end;
}

.table-section {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 500;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.selection-hint {
  color: #909399;
  font-size: 14px;
  margin-left: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

</style>
