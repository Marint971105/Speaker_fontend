<template>
  <div class="application-list">
    <h2>班级 {{ classId }} 的申请列表</h2>

    <!-- 批量操作按钮 -->
    <div style="margin-bottom: 20px;">
      <el-button type="success" @click="batchApprove">批量同意</el-button>
      <el-button type="danger" @click="batchReject">批量拒绝</el-button>
      <el-button type="primary" @click="submitApplicationChanges">提交所有更改</el-button>
      <span style="margin-left: 20px; color: #606266; font-size: 14px; font-weight: 500;">
        已选择：<span style="color: #409EFF;">{{ getChangedCount() }}</span> 条申请
      </span>
    </div>

    <el-table :data="paginatedApplications" style="width: 100%; margin-top: 20px;">
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
          {{ scope.row.studentInfo.userName && scope.row.studentInfo.userName.includes('@') ? scope.row.studentInfo.userName : '未设置' }}
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
            @change="handleStatusChange(scope.row)"
          >
            <el-option label="批准" value="approved"></el-option>
            <el-option label="拒绝" value="rejected"></el-option>
          </el-select>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <div style="margin-top: 20px; text-align: right;">
      <el-pagination
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalApplications"
      />
    </div>
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
      applications: [], // 存储所有申请列表
      applicationStatusMap: new Map(), // 存储所有申请的状态变更（applicationId -> updatedStatus），用于跨页保存
      currentPage: 1, // 当前页码
      pageSize: 10, // 每页显示数量
      statusMapVersion: 0, // 用于触发响应式更新
    };
  },
  computed: {
    // 计算总申请数
    totalApplications() {
      return this.applications.length;
    },
    // 计算当前页显示的申请列表
    paginatedApplications() {
      // 依赖 statusMapVersion 来触发响应式更新
      const _ = this.statusMapVersion;
      
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      const paginated = this.applications.slice(start, end);
      
      // 为当前页的申请恢复之前保存的状态
      return paginated.map(app => {
        const savedStatus = this.applicationStatusMap.get(app.applicationId);
        if (savedStatus !== undefined) {
          return {
            ...app,
            updatedStatus: savedStatus
          };
        }
        return {
          ...app,
          updatedStatus: app.applicationStatus // 如果没有保存的状态，使用原始状态
        };
      });
    }
  },
  async created() {
    await this.fetchApplications(); // 页面加载时获取申请列表
  },
  methods: {
    async fetchApplications() {
      try {
        const response = await getApplicationsByClassId({ classId: this.classId });
        if (response.code === 1 && response.data) {
          const applicationsMap = new Map(); // 使用 Map 存储唯一的学生申请
          const applicationsData = Array.isArray(response.data) ? response.data : [];

          // 后端已按 ApplicationDate DESC 排序，最新的申请在前面
          // 先收集所有需要获取学生信息的学生ID（去重）
          const studentIdsToFetch = new Set();
          for (const app of applicationsData) {
            if (!applicationsMap.has(app.studentId)) {
              applicationsMap.set(app.studentId, app); // 先保存申请记录
              studentIdsToFetch.add(app.studentId);
            }
          }

          // 并发获取所有学生的详细信息
          const studentProfilePromises = Array.from(studentIdsToFetch).map(async (studentId) => {
            try {
              const studentProfileResponse = await getUserProfile(studentId);
              return {
                studentId,
                success: studentProfileResponse.code === 1,
                data: studentProfileResponse.data
              };
            } catch (error) {
              console.error(`获取学生${studentId}的信息失败:`, error);
              return {
                studentId,
                success: false,
                data: null
              };
            }
          });

          const studentProfiles = await Promise.all(studentProfilePromises);
          
          // 创建学生信息映射
          const studentInfoMap = new Map();
          studentProfiles.forEach(({ studentId, success, data }) => {
            if (success && data) {
              studentInfoMap.set(studentId, data);
            }
          });

          // 构建最终的申请列表
          const newApplications = Array.from(applicationsMap.values()).map(app => ({
                  ...app,
            studentInfo: studentInfoMap.get(app.studentId) || null,
                  updatedStatus: app.applicationStatus // 初始化状态
          })).filter(app => app.studentInfo !== null); // 只保留成功获取学生信息的申请

          // 保留之前保存的状态变更（如果有）
          const oldStatusMap = new Map(this.applicationStatusMap);
          this.applicationStatusMap.clear();
          
          newApplications.forEach(app => {
            // 如果之前有保存的状态，保留它；否则使用原始状态
            const savedStatus = oldStatusMap.get(app.applicationId);
            if (savedStatus !== undefined) {
              this.applicationStatusMap.set(app.applicationId, savedStatus);
            } else {
              // 如果没有保存的状态，初始化为原始状态
              this.applicationStatusMap.set(app.applicationId, app.applicationStatus);
            }
          });

          this.applications = newApplications;
          console.log(`成功加载 ${this.applications.length} 条申请记录`);
          
          // 如果当前页超出范围，重置到第一页
          const maxPage = Math.ceil(this.applications.length / this.pageSize);
          if (this.currentPage > maxPage && maxPage > 0) {
            this.currentPage = maxPage;
          }
        } else {
          this.$message.error("获取申请列表失败：" + (response.msg || '未知错误'));
          this.applications = [];
        }
      } catch (error) {
        console.error("获取申请列表时出错：", error);
        this.$message.error("获取申请列表时出错：" + error.message);
        this.applications = [];
      }
    },

    // 处理状态变更，保存到状态Map中
    handleStatusChange(row) {
      this.applicationStatusMap.set(row.applicationId, row.updatedStatus);
      // 触发响应式更新
      this.statusMapVersion++;
    },

    // 获取所有有变更的申请数量
    getChangedCount() {
      let count = 0;
      this.applications.forEach(app => {
        const savedStatus = this.applicationStatusMap.get(app.applicationId);
        if (savedStatus !== undefined && savedStatus !== app.applicationStatus) {
          count++;
        }
      });
      return count;
    },

    async submitApplicationChanges() {
      // 收集所有有变更的申请（跨页）
      const changes = [];
      this.applications.forEach(app => {
        const savedStatus = this.applicationStatusMap.get(app.applicationId);
        if (savedStatus !== undefined && savedStatus !== app.applicationStatus) {
          changes.push({
          applicationId: app.applicationId,
            approvalStatus: savedStatus
          });
        }
      });

      if (changes.length === 0) {
        this.$message.info("没有更改，无需提交。");
        return;
      }

      try {
        const response = await approveApplications(changes);
        if (response.code === 1) {
          this.$message.success(`成功更新 ${changes.length} 条申请状态！`);
          // 清空状态Map，因为已经提交了
          this.applicationStatusMap.clear();
          await this.fetchApplications(); // 重新获取申请列表以刷新状态
          // 发送事件通知父组件刷新申请列表
          this.$bus.$emit('refreshApplicationList');
        } else {
          this.$message.error("申请状态更新失败：" + response.msg);
        }
      } catch (error) {
        this.$message.error("申请状态更新失败：" + error.message);
      }
    },

    // 批量同意（所有待处理的申请）
    batchApprove() {
      let count = 0;
      this.applications.forEach(app => {
        if (app.applicationStatus === 'pending') {
          this.applicationStatusMap.set(app.applicationId, 'approved');
          count++;
        }
      });
      
      // 触发响应式更新
      this.statusMapVersion++;
      
      if (count > 0) {
        this.$message.success(`已选择 ${count} 条申请待同意`);
      } else {
        this.$message.info("没有待处理的申请");
      }
    },

    // 批量拒绝（所有待处理的申请）
    batchReject() {
      let count = 0;
      this.applications.forEach(app => {
        if (app.applicationStatus === 'pending') {
          this.applicationStatusMap.set(app.applicationId, 'rejected');
          count++;
        }
      });
      
      // 触发响应式更新
      this.statusMapVersion++;
      
      if (count > 0) {
        this.$message.success(`已选择 ${count} 条申请待拒绝`);
      } else {
        this.$message.info("没有待处理的申请");
      }
    },

    // 分页大小改变
    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1; // 重置到第一页
    },

    // 当前页改变
    handleCurrentChange(val) {
      this.currentPage = val;
    },

    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
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
