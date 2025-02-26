<template>
  <div class="student-class-application">
    <h2 class="title">申请加入班级</h2>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="filters.teacherName"
        placeholder="搜索教师姓名"
        clearable
        class="search-input"
        @input="filterClasses"
      />
      <el-input
        v-model="filters.className"
        placeholder="搜索班级名称"
        clearable
        class="search-input"
        @input="filterClasses"
      />
    </div>

    <!-- 教师班级展示区 -->
    <div v-for="(teacherClasses, teacher) in filteredClasses" :key="teacher" class="teacher-section">
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

            </span>
      </div>
        </el-card>
      </div>
    </div>

    <el-dialog title="班级成员" :visible.sync="membersDialogVisible" width="50%">
      <el-table :data="members" style="width: 100%">
        <el-table-column prop="studentId" label="学号" align="center" />
        <el-table-column prop="nickName" label="姓名" align="center" />
        <el-table-column prop="userName" label="邮箱" align="center" />
        <el-table-column prop="mobile" label="手机号" align="center" />
        <el-table-column prop="school" label="学校" align="center" />
        <el-table-column prop="major" label="专业" align="center" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="membersDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getAllClasses, getClassMembers, applyClass ,searchApplicationStatus } from "@/api/classManage/student";
import { mapGetters } from "vuex";
export default {
  data() {
    return {
      classes: [],
      filteredClasses: {},
      filters: { teacherName: "", className: "" },
      membersDialogVisible: false,
      selectedClassId: null,
      members: [],
      applicationStatus: {}, // 新增：存储班级的申请状态
    };
  },
  created() {
    this.fetchClasses();
    this.fetchApplicationStatus(); // 新增：页面加载时检查申请状态
  },
  computed: {
    ...mapGetters(["userId"]),
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
        this.filteredClasses = this.classes;
      }
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleString();
    },
    async viewMembers(classId) {
      this.selectedClassId = classId;
      this.membersDialogVisible = true;
      try {
        const response = await getClassMembers({
          classId: this.selectedClassId,
          stuIndex: "",
          name: "",
          mail: "",
        });
        if (response.code === 1) {
          this.members = response.data.rows;
        } else {
          this.$message.error("获取成员信息失败：" + response.msg);
        }
      } catch (error) {
        this.$message.error("获取成员信息失败：" + error.message);
      }
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
          this.applicationStatus[classId] = "pending"; // 更新状态为已申请
        } else {
          this.$message.error("申请发送失败：" + response.msg);
        }
      } catch (error) {
        this.$message.error("申请发送失败：" + error.message);
      }
    },
    filterClasses() {
      const { teacherName, className } = this.filters;
      this.filteredClasses = Object.keys(this.classes).reduce((acc, teacher) => {
        if (teacher.toLowerCase().includes(teacherName.toLowerCase())) {
          acc[teacher] = this.classes[teacher].filter((classItem) =>
            classItem.className.toLowerCase().includes(className.toLowerCase())
          );
        }
        return acc;
      }, {});
    },

    async fetchApplicationStatus() {
      try {
        const response = await searchApplicationStatus({ stuId: this.userId });
        if (response.code === 1) {
          response.data.forEach((item) => {
            if (item.applicationStatus === "pending" || item.applicationStatus === "approved") {
              this.applicationStatus[item.classId] = item.applicationStatus;
            }
          });
        }
      } catch (error) {
        this.$message.error("获取申请状态失败：" + error.message);
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
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}
.search-input {
  width: 200px;
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
