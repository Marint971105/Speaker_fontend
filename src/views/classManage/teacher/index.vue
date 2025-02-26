<template>
  <div class="class-management">
    <h2>班级管理</h2>

    <!-- 创建班级表单 -->
    <el-card class="box-card" shadow="always">
      <div slot="header" class="clearfix">
        <span>创建新班级</span>
      </div>
      <el-form :model="newClass" label-width="120px" class="class-form">
        <el-form-item label="班级名称">
          <el-input v-model="newClass.className" placeholder="请输入班级名称" />
        </el-form-item>
        <el-form-item label="班级介绍">
          <el-input v-model="newClass.classIntroduction" type="textarea" placeholder="请输入班级介绍" />
        </el-form-item>
        <el-form-item label="班级目标">
          <el-input v-model="newClass.classTarget" placeholder="请输入班级目标" />
        </el-form-item>
        <el-form-item label="学期">
          <el-select v-model="newClass.term" placeholder="请选择学期">
            <el-option label="春季学期" value="春季学期" />
            <el-option label="秋季学期" value="秋季学期" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="newClass.startTime" type="datetime" placeholder="选择开始时间" />
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker v-model="newClass.deadline" type="datetime" placeholder="选择截止日期" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="createClass">创建班级</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 班级列表展示 -->
    <el-card class="box-card" shadow="always" style="margin-top: 20px;">
      <div slot="header" class="clearfix">
        <span>已创建班级</span>
      </div>
      <el-table :data="classes" v-if="classes.length > 0" class="class-table">
        <el-table-column prop="className" label="班级名称" align="center" />
        <el-table-column prop="term" label="学期" align="center" />
        <el-table-column prop="startTime" label="开始时间" align="center">
          <template slot-scope="scope">
            {{ formatDate(scope.row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="deadline" label="截止日期" align="center">
          <template slot-scope="scope">
            {{ formatDate(scope.row.deadline) }}
          </template>
        </el-table-column>
        <el-table-column prop="enable" label="开课状态" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.enable ? 'success' : 'info'">
              {{ scope.row.enable ? '开课' : '已结课' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="查看学生" align="center">
          <template slot-scope="scope">
            <el-button type="primary" @click="viewMembers(scope.row.classId)" size="small">查看学生</el-button>
          </template>
        </el-table-column>

        <el-table-column label="查看申请" align="center">
          <template slot-scope="scope">
            <el-button type="primary" @click="viewApplications(scope.row.classId)" size="small">
              查看申请
              <span v-if="unprocessedApplicationsCount(scope.row.classId) > 0" class="unprocessed-count">
        ({{ unprocessedApplicationsCount(scope.row.classId) }})
      </span>
            </el-button>
          </template>
        </el-table-column>


        <el-table-column label="删除" align="center">
          <template slot-scope="scope">
            <el-button type="danger" @click="deleteClass(scope.row.classId)" size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-else>暂无班级信息</div>
    </el-card>


    <el-dialog title="学生信息" :visible.sync="dialogVisible" width="60%">
      <el-form inline>
        <el-form-item label="学号">
          <el-input v-model="filters.stuIndex" placeholder="输入学号" clearable />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="filters.name" placeholder="输入姓名" clearable />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="filters.mail" placeholder="输入邮箱" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchMembers">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="members" style="width: 100%; margin-top: 20px;">
        <el-table-column prop="studentId" label="学号" align="center" />
        <el-table-column prop="nickName" label="姓名" align="center" />
        <el-table-column prop="userName" label="邮箱" align="center" />
        <el-table-column prop="mobile" label="手机号" align="center" />
        <el-table-column prop="school" label="学校" align="center" />
        <el-table-column prop="major" label="专业" align="center" />
      </el-table>
      <span slot="footer" class="dialog-footer">
    <el-button @click="closeMembersDialog">关闭</el-button>
  </span>



    </el-dialog>



  </div>
</template>

<script>

  import { createClass, getClasses, deleteClass, getClassMembers, listApplications } from "@/api/classManage/teacher/index";
  import { mapGetters } from "vuex";
  import { getUserProfile } from "@/api/system/user";

  export default {
  name: "ClassManagement",
  data() {
        return {
        newClass: {
        className: "",
        classIntroduction: "",
        classTarget: "",
        term: "",
        startTime: null,
        deadline: null,
      },
        classes: [], // 存储教师已创建的班级列表
        dialogVisible: false, // 控制弹窗显示
        members: [], // 当前班级的学生列表
        currentClassId: null, // 当前查看的班级ID
        filters: { stuIndex: "", name: "", mail: "" }, // 查询条件
        applicationsByClass: {}, // 按班级分类的申请列表
      };
},
  computed: {
  ...mapGetters(["userId", "name"]),
},
  created() {
    if (this.userId) {
    this.fetchClasses();
    this.fetchApplications();
  } else {
    this.$message.error("无法获取教师ID，请重新登录！");
  }
},
  methods: {
  async fetchClasses() {
    try {
    const response = await getClasses(this.userId);
    if (response.code === 1) {
    this.classes = response.data.rows;
  } else {
    this.$message.error("获取班级信息失败：" + response.msg);
  }
  } catch (error) {
    this.$message.error("获取班级信息失败：" + error.message);
  }
},
  async createClass() {
  try {
  const classData = { ...this.newClass, teacherId: this.userId, teacherName: this.name };
  const response = await createClass(classData);
  if (response.code === 1) {
  this.$message.success("班级创建成功！");
  this.fetchClasses();
  this.resetForm();
} else {
  this.$message.error("班级创建失败：" + response.msg);
}
} catch (error) {
  this.$message.error("班级创建失败：" + error.message);
}
},
  resetForm() {
  this.newClass = { className: "", classIntroduction: "", classTarget: "", term: "", startTime: null, deadline: null };
},
  async deleteClass(classId) {
  try {
  const response = await deleteClass(classId);
  if (response.code === 1) {
  this.$message.success("班级删除成功！");
  this.fetchClasses();
} else {
  this.$message.error("班级删除失败：" + response.msg);
}
} catch (error) {
  this.$message.error("班级删除失败：" + error.message);
}
},
  formatDate(dateString) {
  return new Date(dateString).toLocaleString();
},
  async viewMembers(classId) {
  this.currentClassId = classId;
  this.dialogVisible = true;
  await this.fetchMembers();
},
  async fetchMembers() {
  try {
  const response = await getClassMembers({ classId: this.currentClassId, ...this.filters });
  if (response.code === 1) {
  this.members = response.data.rows;
} else {
  this.$message.error("获取学生信息失败：" + response.msg);
}
} catch (error) {
  this.$message.error("获取学生信息失败：" + error.message);
}
},
  resetFilters() {
  this.filters = { stuIndex: "", name: "", mail: "" };
  this.fetchMembers();
},
  async fetchApplications() {
  try {
  const response = await listApplications({ teacherId: this.userId });
  if (response.code === 1) {
  const applicationsByClass = {};
  for (const app of response.data.rows) {
  if (!applicationsByClass[app.classId]) applicationsByClass[app.classId] = [];
  const studentProfileResponse = await getUserProfile(app.studentId);
  if (studentProfileResponse.code === 1) {
  applicationsByClass[app.classId].push({ ...app, studentInfo: studentProfileResponse.data });
}
}
  this.applicationsByClass = applicationsByClass;
} else {
  this.$message.error("获取申请列表失败：" + response.msg);
}
} catch (error) {
  this.$message.error("获取申请列表时出错：" + error.message);
}
},
  unprocessedApplicationsCount(classId) {
  const classApplications = this.applicationsByClass[classId] || [];
  return classApplications.filter(app => app.applicationStatus === 'pending').length;
},
  closeMembersDialog() {
  this.dialogVisible = false;
  this.members = [];
},
  viewApplications(classId) {
  this.$router.push({ name: 'classapplication', params: { classId } });
},
},
};
</script>



<style scoped>
.class-management {
  padding: 20px;
}
.box-card {
  margin-bottom: 20px;
}
.class-form {
  max-width: 600px;
}
.class-table {
  width: 100%;
}
.unprocessed-count {
  color: red; /* 未处理申请数量显示为红色 */
  font-weight: bold; /* 加粗字体 */
}
</style>
