<template>
  <div class="self-evaluation">
    <h2>已分配自评的学生</h2>

    <!-- 搜索框 -->
    <div class="search-container">
      <div class="search-item">
        <label for="nameQuery">姓名：</label>
        <el-input
          v-model="nameQuery"
          placeholder="搜索姓名"
          class="search-bar"
          clearable
          @input="handleSearch"
          style="width: 220px"
        ></el-input>
      </div>

      <div class="search-item">
        <label for="stuIndexQuery">学号：</label>
        <el-input
          v-model="stuIndexQuery"
          placeholder="搜索学号"
          class="search-bar"
          clearable
          @input="handleSearch"
          style="width: 220px"
        ></el-input>
      </div>
    </div>

    <!-- 成员列表 -->
    <el-table :data="paginatedMembers" class="members-table">
      <el-table-column
        prop="id"
        label="用户ID"
        header-align="center"
        align="center">
      </el-table-column>
      <el-table-column
        prop="studentId"
        label="学号"
        header-align="center"
        align="center">
      </el-table-column>
      <el-table-column
        prop="name"
        label="姓名"
        header-align="center"
        align="center">
      </el-table-column>
      <el-table-column
        prop="email"
        label="邮箱"
        header-align="center"
        align="center">
      </el-table-column>
      <el-table-column
        prop="mobile"
        label="手机号"
        header-align="center"
        align="center">
      </el-table-column>
    </el-table>

    <!-- 分页和总人数 -->
    <div class="pagination-container">
      <el-pagination
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page.sync="currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredMembers.length">
      </el-pagination>
    </div>
    <div class="total-info">
      总计 {{ filteredMembers.length }} 名学生
    </div>
  </div>
</template>

<script>
export default {
  name: 'SelfEvaluation',
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
      nameQuery: '',
      stuIndexQuery: '',
      filteredMembers: [],
      paginatedMembers: [],
      currentPage: 1,
      pageSize: 10,
    }
  },
  watch: {
    assignedStudents: {
      handler(newVal) {
        this.handleSearch()
      },
      immediate: true
    },
    activeTab: {
      handler(newTab) {
        if (newTab === 'self') {
          this.handleSearch()
        }
      }
    }
  },
  methods: {
    handleSearch() {
      this.filteredMembers = this.assignedStudents.filter(member => {
        const matchesName = !this.nameQuery ||
          (member.name && member.name.toLowerCase().includes(this.nameQuery.toLowerCase()))
        const matchesStudentId = !this.stuIndexQuery ||
          (member.studentId && member.studentId.toString().includes(this.stuIndexQuery))
        return matchesName && matchesStudentId
      })
      this.updatePagination()
    },

    handleSizeChange(val) {
      this.pageSize = val
      this.updatePagination()
    },

    handleCurrentChange(val) {
      this.currentPage = val
      this.updatePagination()
    },

    updatePagination() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      this.paginatedMembers = this.filteredMembers.slice(start, end)
    }
  }
}
</script>

<style scoped>
.self-evaluation {
  padding: 20px;
}

.members-table {
  margin: 15px 0;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.search-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

@media screen and (max-width: 768px) {
  .search-container {
    flex-direction: column;
    align-items: stretch;
  }

  .search-item {
    width: 100%;
  }

  .pagination-container {
    justify-content: center;
  }
}

.el-table__header-wrapper {
  background-color: #f5f5f5;
}
</style>
