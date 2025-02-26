<template>
  <div class="application-list">
    <h2>班级 {{ classId }} 的申请列表</h2>

    <!-- 批量操作按钮 -->
    <div style="margin-bottom: 20px;">
      <el-button type="success" @click="batchApprove">批量同意</el-button>
      <el-button type="danger" @click="batchReject">批量拒绝</el-button>
    </div>

    <el-table :data="applications" style="width: 100%; margin-top: 20px;">
      <!-- 学号 -->
      <el-table-column label="学号" align="center">
        <template slot-scope="scope">
          {{ scope.row.studentInfo.studentId }}
        </template>
      </el-table-column>

      <!-- 姓名 -->
      <el-table-column label="姓名" align="center">
        <template slot-scope="scope">
          {{ scope.row.studentInfo.nickName }}
        </template>
      </el-table-column>

      <!-- 邮箱 -->
      <el-table-column label="邮箱" align="center">
        <template slot-scope="scope">
          {{ scope.row.studentInfo.userName }}
        </template>
      </el-table-column>

      <!-- 状态 -->
      <el-table-column label="状态" align="center">
        <template slot-scope="scope">
          <div v-if="scope.row.applicationStatus === 'approved'">
            已同意
          </div>
          <div v-else-if="scope.row.applicationStatus === 'rejected'">
            已拒绝
          </div>
          <el-select
            v-else
            v-model="scope.row.updatedStatus"
            placeholder="请选择状态"
          >
            <el-option label="批准" value="approved"></el-option>
            <el-option label="拒绝" value="rejected"></el-option>
          </el-select>
        </template>
      </el-table-column>
    </el-table>

    <span slot="footer" class="dialog-footer">
      <el-button type="primary" @click="submitApplicationChanges">提交更改</el-button>
    </span>
  </div>
</template>

<script>
import { getUserProfile } from "@/api/system/user";
import { approveApplications } from "@/api/classManage/teacher/index";
import { getApplicationsByClassId } from "@/api/classManage/student/index";

export default {
  props: ['classId'],
  data() {
    return {
      applications: [] // 存储当前班级的申请列表
    };
  },
  async created() {
    await this.fetchApplications(); // 页面加载时获取申请列表
  },
  methods: {
    async fetchApplications() {
      try {
        const response = await getApplicationsByClassId({ classId: this.classId });
        if (response.code === 1) {
          const applicationsMap = new Map(); // 使用 Map 存储唯一的学生申请

          for (const app of response.data) {
            // 检查 Map 中是否已有该学生的申请，如果没有则添加
            if (!applicationsMap.has(app.studentId)) {
              const studentProfileResponse = await getUserProfile(app.studentId);
              if (studentProfileResponse.code === 1) {
                applicationsMap.set(app.studentId, {
                  ...app,
                  studentInfo: studentProfileResponse.data,
                  updatedStatus: app.applicationStatus // 初始化状态
                });
              }
            }
          }

          // 将 Map 转换为数组并赋值给 applications
          this.applications = Array.from(applicationsMap.values());
        } else {
          this.$message.error("获取申请列表失败：" + response.msg);
        }
      } catch (error) {
        this.$message.error("获取申请列表时出错：" + error.message);
      }
    },

    async submitApplicationChanges() {
      const changes = this.applications
        .filter(app => app.applicationStatus !== app.updatedStatus)
        .map(app => ({
          applicationId: app.applicationId,
          approvalStatus: app.updatedStatus
        }));

      if (changes.length === 0) {
        this.$message.info("没有更改，无需提交。");
        return;
      }

      try {
        const response = await approveApplications(changes);
        if (response.code === 1) {
          this.$message.success("申请状态更新成功！");
          await this.fetchApplications(); // 重新获取申请列表以刷新状态
        } else {
          this.$message.error("申请状态更新失败：" + response.msg);
        }
      } catch (error) {
        this.$message.error("申请状态更新失败：" + error.message);
      }
    },

    // 批量同意
    batchApprove() {
      this.applications.forEach(app => {
        if (app.applicationStatus === 'pending') {
          app.updatedStatus = 'approved';
        }
      });
    },

    // 批量拒绝
    batchReject() {
      this.applications.forEach(app => {
        if (app.applicationStatus === 'pending') {
          app.updatedStatus = 'rejected';
        }
      });
    }
  }
};
</script>

<style scoped>
.application-list {
  padding: 20px;
}
</style>
