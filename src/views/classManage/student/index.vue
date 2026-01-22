<template>
  <div class="student-class-application">
    <h2 class="title">班级管理</h2>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <h3 style="margin: 0; color: #303133; font-size: 18px;">我的班级</h3>
      <div style="display: flex; gap: 10px; flex: 1; justify-content: flex-end;">
      <el-input
        v-model="filters.teacherName"
          placeholder="搜索教师姓名（可搜索所有班级）"
        clearable
        class="search-input"
          @input="handleSearch"
          @clear="handleSearch"
      />
      <el-input
        v-model="filters.className"
          placeholder="搜索班级名称（可搜索所有班级）"
        clearable
        class="search-input"
          @input="handleSearch"
          @clear="handleSearch"
        />
      </div>
    </div>

    <!-- 加载提示 -->
    <div v-if="isLoading" class="loading-state" v-loading="true" element-loading-text="正在加载班级信息..." style="min-height: 300px;"></div>

    <!-- 空状态提示 -->
    <div v-else-if="Object.keys(filteredClasses).length === 0" class="empty-state">
      <el-empty 
        :description="hasSearchCondition ? '暂无符合条件的班级' : '您还没有加入任何班级，可以通过搜索查找并申请加入其他班级'"
      >
        <template v-if="!hasSearchCondition">
          <p style="margin-top: 10px; color: #909399;">
            💡 提示：使用上方搜索框搜索班级名称或教师姓名，即可查看并申请加入班级
          </p>
        </template>
      </el-empty>
    </div>

    <!-- 教师班级展示区 -->
    <div v-if="!isLoading" v-for="(teacherClasses, teacher) in filteredClasses" :key="teacher" class="teacher-section">
      <h3 class="teacher-name">{{ teacher }}</h3>
      <div class="class-cards">
        <!-- 增加表头样式 -->
        <div class="class-table-header">
          <span>班级名称</span>
          <span>班级介绍</span>
          <span>班级目标</span>
          <span>学期</span>
          <span>开始时间</span>
          <span>截止日期</span>
          <span>操作</span>
        </div>

        <!-- 班级卡片展示 -->
        <el-card v-for="classItem in teacherClasses" :key="classItem.classId" class="class-card">
          <div class="class-row">
            <span>{{ classItem.className }}</span>
            <span>{{ classItem.classIntroduction }}</span>
            <span>{{ classItem.classTarget }}</span>
            <span>{{ classItem.term }}</span>
            <span>{{ formatDate(classItem.startTime) }}</span>
            <span>{{ formatDate(classItem.deadline) }}</span>
            <span class="actions">
              <el-button type="primary" size="small" @click="viewMembers(classItem.classId)">查看成员</el-button>
             <el-button
               :type="getButtonType(classItem.classId)"
               size="small"
               :disabled="isButtonDisabled(classItem.classId)"
               @click="applyClass(classItem.classId, classItem.teacherId)"
             >
              {{ getButtonText(classItem.classId) }}
             </el-button>
             <!-- 已加入班级时显示退出按钮 -->
             <el-button
               v-if="isInClass(classItem.classId)"
               type="danger"
               size="small"
               icon="el-icon-remove"
               @click="handleLeaveClass(classItem.classId, classItem.className)"
             >
              退出班级
             </el-button>
            </span>
      </div>
        </el-card>
      </div>
    </div>

    <el-dialog title="班级成员" :visible.sync="membersDialogVisible" width="50%">
      <el-table :data="members" style="width: 100%">
        <el-table-column prop="nickName" label="姓名" align="center" />
        <el-table-column label="班级" align="center">
          <template slot-scope="scope">
            {{ currentClassName }}
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页组件 -->
      <div style="margin-top: 20px; text-align: right;">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper">
        </el-pagination>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="membersDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getAllClasses, getClassMembers, applyClass, searchApplicationStatus, leaveClass } from "@/api/classManage/student";
import { mapGetters } from "vuex";
export default {
  data() {
    return {
      classes: [],
      filteredClasses: {},
      filters: { teacherName: "", className: "" },
      displayMode: 'myClasses', // 显示模式：myClasses(我的班级) / allClasses(所有班级)
      membersDialogVisible: false,
      selectedClassId: null,
      members: [],
      currentClassName: '', // 当前查看的班级名称
      pagination: { // 分页信息
        page: 1,
        pageSize: 10,
        total: 0
      },
      applicationStatus: {}, // 存储班级的申请状态
      isLoading: true, // 添加加载状态，避免初始显示空状态
    };
  },
  created() {
    this.fetchClasses();
  },
  mounted() {
    // 确保 userId 已加载后再获取申请状态
    if (this.userId) {
      this.fetchApplicationStatus();
    } else {
      // 如果 userId 还未准备好，等待一下再尝试
      this.$nextTick(() => {
        if (this.userId) {
          this.fetchApplicationStatus();
        }
      });
    }
  },
  watch: {
    // 监听 userId 变化，当 userId 有值时自动获取申请状态
    userId: {
      handler(newVal) {
        if (newVal && Object.keys(this.applicationStatus).length === 0) {
          this.fetchApplicationStatus();
        }
      },
      immediate: true
    }
  },
  computed: {
    ...mapGetters(["userId"]),
    // 判断是否有搜索条件
    hasSearchCondition() {
      return this.filters.teacherName || this.filters.className;
    }
  },
  methods: {
    async fetchClasses() {
      const response = await getAllClasses({ page: 1, pageSize: 100 });
      if (response.code === 1) {
        const data = response.data.rows;
        this.classes = data.reduce((acc, classItem) => {
          const teacherName = classItem.teacherName;
          if (!acc[teacherName]) acc[teacherName] = [];
          acc[teacherName].push(classItem);
          return acc;
        }, {});
        // 不立即显示所有班级，等待申请状态加载完成后再过滤
        // 避免初始显示所有班级造成混乱
        this.filteredClasses = {};
      }
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleString();
    },
    async viewMembers(classId) {
      this.selectedClassId = classId;
      // 查找班级名称
      this.currentClassName = '';
      for (const teacher in this.classes) {
        const classItem = this.classes[teacher].find(c => c.classId === classId);
        if (classItem) {
          this.currentClassName = classItem.className;
          break;
        }
      }
      // 重置分页
      this.pagination.page = 1;
      this.pagination.pageSize = 10;
      this.membersDialogVisible = true;
      await this.fetchMembers();
    },
    async fetchMembers() {
      try {
        const response = await getClassMembers({
          classId: this.selectedClassId,
          page: this.pagination.page,
          pageSize: this.pagination.pageSize,
          stuIndex: "",
          name: "",
          mail: "",
        });
        if (response.code === 1) {
          this.members = response.data.rows || [];
          this.pagination.total = response.data.total || 0;
        } else {
          this.$message.error("获取成员信息失败：" + response.msg);
        }
      } catch (error) {
        this.$message.error("获取成员信息失败：" + error.message);
      }
    },
    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.pagination.page = 1; // 重置到第一页
      this.fetchMembers();
    },
    handleCurrentChange(val) {
      this.pagination.page = val;
      this.fetchMembers();
    },
    async applyClass(classId, teacherId) {
      try {
        const formData = new FormData();
        formData.append("teacherId", teacherId);
        formData.append("studentId", this.userId);  // 使用 Vuex 获取的 studentId
        formData.append("classId", classId);
        const response = await applyClass(formData);
        if (response.code === 1) {
          this.$message.success("申请已发送！");
          // 使用 $set 确保响应式更新
          this.$set(this.applicationStatus, classId, "pending");
        } else {
          this.$message.error("申请发送失败：" + response.msg);
        }
      } catch (error) {
        this.$message.error("申请发送失败：" + error.message);
      }
    },
    handleSearch() {
      // 当有搜索条件时，自动切换到显示所有班级模式（内部逻辑，用户看不到）
      if (this.filters.teacherName || this.filters.className) {
        this.displayMode = 'allClasses';
      } else {
        // 清空搜索条件时，切换回"我的班级"模式
        this.displayMode = 'myClasses';
      }
      this.filterClasses();
    },

    filterClasses() {
      const { teacherName, className } = this.filters;
      
      this.filteredClasses = Object.keys(this.classes).reduce((acc, teacher) => {
        if (teacher.toLowerCase().includes(teacherName.toLowerCase())) {
          let filteredClassItems = this.classes[teacher].filter((classItem) =>
            classItem.className.toLowerCase().includes(className.toLowerCase())
          );

          // 如果是"我的班级"模式，只显示已加入的班级
          if (this.displayMode === 'myClasses') {
            filteredClassItems = filteredClassItems.filter(classItem => 
              this.applicationStatus[classItem.classId] === 'approved'
            );
          }

          // 只有当该教师下有班级时，才添加到结果中
          if (filteredClassItems.length > 0) {
            acc[teacher] = filteredClassItems;
          }
        }
        return acc;
      }, {});
    },

    async fetchApplicationStatus() {
      // 确保 userId 有值
      if (!this.userId) {
        console.warn('fetchApplicationStatus: userId 未准备好，跳过获取申请状态');
        this.isLoading = false; // 即使没有userId也要结束加载状态
        return;
      }
      try {
        const response = await searchApplicationStatus({ stuId: this.userId });
        if (response.code === 1 && response.data) {
          // 使用 $set 确保响应式更新
          response.data.forEach((item) => {
            if (item.applicationStatus === "pending" || item.applicationStatus === "approved") {
              this.$set(this.applicationStatus, item.classId, item.applicationStatus);
            }
          });
          // 强制更新视图
          this.$forceUpdate();
          // 重新过滤班级列表（应用"我的班级"模式）
          this.filterClasses();
        }
      } catch (error) {
        console.error('获取申请状态失败:', error);
        this.$message.error("获取申请状态失败：" + error.message);
      } finally {
        // 数据加载完成，结束加载状态
        this.isLoading = false;
      }
    },
    getButtonType(classId) {
      const status = this.applicationStatus[classId];
      return status === "approved" ? "default" : status === "pending" ? "info" : "success";
    },
    getButtonText(classId) {
      const status = this.applicationStatus[classId];
      return status === "approved"
        ? "已加入班级"
        : status === "pending"
          ? "已申请等待加入"
          : "加入班级";
    },

    isButtonDisabled(classId) {
      const status = this.applicationStatus[classId];
      return status === "approved" || status === "pending";
    },

    // 判断学生是否已加入班级
    isInClass(classId) {
      const status = this.applicationStatus[classId];
      return status === "approved";
    },
    
    // 退出班级
    handleLeaveClass(classId, className) {
      this.$confirm(`确定要退出班级"${className}"吗？退出后将无法访问该班级的相关内容。`, "退出班级确认", {
        confirmButtonText: "确定退出",
        cancelButtonText: "取消",
        type: "warning",
        dangerouslyUseHTMLString: false
      }).then(async () => {
        try {
          const response = await leaveClass({
            classId: classId,
            studentId: this.userId
          });
          if (response.code === 1) {
            this.$message.success("退出班级成功");
            // 更新申请状态（退出后可以重新申请）
            this.$delete(this.applicationStatus, classId);
            // 重新过滤班级列表
            this.filterClasses();
            // 刷新申请状态列表
            this.fetchApplicationStatus();
          } else {
            this.$message.error("退出班级失败：" + response.msg);
          }
        } catch (error) {
          this.$message.error("退出班级失败：" + error.message);
        }
      }).catch(() => {
        // 用户取消操作
      });
    },




  },
};
</script>

<style scoped>
.student-class-application {
  padding: 20px;
  background: #f5f7fa;
}
.title {
  font-size: 28px;
  text-align: center;
  font-weight: 600;
  margin-bottom: 30px;
}
.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.08);
}
.search-input {
  width: 240px;
}
.empty-state {
  margin: 60px 0;
  text-align: center;
}
.teacher-section {
  margin-bottom: 40px;
}
.teacher-name {
  font-size: 22px;
  color: #2d5f9a;
  font-weight: 600;
  margin-bottom: 15px;
}
.class-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.class-table-header,
.class-card .class-row {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr 1fr 1fr 1fr 1fr; /* 确保每列宽度一致 */
  align-items: center;
  text-align: center;
  padding: 10px;
}
.class-table-header {
  background-color: #e6e6e6;
  font-weight: bold;
  border-radius: 5px;
}
.class-card {
  background: #fff;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-top: 5px;
  padding: 0;
}
.class-row span {
  display: flex;
  align-items: center;
  justify-content: center;
}
.actions {
  display: flex;
  gap: 5px;
  justify-content: center;
}
.el-button--primary {
  background: linear-gradient(45deg, #4e89fc, #56b4ef);
  border: none;
}
.el-button--success {
  background: linear-gradient(45deg, #28a745, #67c67a);
  border: none;
}
</style>
