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
        <el-button
          type="primary"
          :disabled="!selectedStudents.length"
          @click="handleAssign"
        >
          批量分配作业
        </el-button>
      </div>

      <el-table
        ref="studentTable"
        v-loading="loading"
        :data="studentList"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" :selectable="isSelectable" />
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
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button
              type="text"
              @click="handleSingleAssign(row)"
              :disabled="row.isAssigned"
            >
              {{ row.isAssigned ? '已分配' : '分配作业' }}
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
import {assignStudentsToTask} from '@/api/homeworkManage/assignTask'
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
      selectedStudents: [],
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

    async fetchStudents() {
      if (!this.selectedClassId) return

      this.loading = true
      try {
        // 获取学生列表
        const studentsResponse = await getClassMembers({
          classId: this.selectedClassId
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
        this.originalStudentList = studentsResponse.data.rows.map(student => ({
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
          // 同步到父组件
        this.$emit('update:classData', {
          ...this.classData,
          originalStudentList: this.originalStudentList  // 增加这行
        })
        // 更新显示数据
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

      // 添加日志便于调试
      console.log('搜索条件:', {
        name: searchName,
        id: searchId
      })
      console.log('过滤后的数据:', filteredData)
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

    // 控制复选框是否可选
    isSelectable(row) {
      return !row.isAssigned
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

    // 选择变更处理
    handleSelectionChange(selection) {
      this.selectedStudents = selection
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
      if (!this.selectedStudents.length) {
        this.$message.warning('请选择要分配的学生')
        return
      }

      try {
        // 获取选中学生的ID数组
        const selectedIds = this.selectedStudents.map(s => s.id)

        // 调用分配接口
        await assignStudentsToTask(this.taskId, selectedIds)

        // 更新本地状态
        selectedIds.forEach(id => this.assignedStudentIds.add(id))

        // 发送更新到父组件
        this.$emit('update:classData', {
          ...this.classData,
          assignedStudentIds: this.assignedStudentIds
        })

        // 更新表格数据
        await this.fetchStudents()

        // 清除选择
        this.$refs.studentTable.clearSelection()

        // 提示成功
        this.$message.success('分配成功')

        // 通知父组件更新
        this.$emit('update:assignedStudents', true)
      } catch (error) {
        console.error('批量分配失败:', error)
        this.$message.error('分配失败')
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

</style>
