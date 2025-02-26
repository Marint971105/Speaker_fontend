<template>
  <el-card class="homework-management">
    <div class="header">
      <el-button type="primary" size="mini" @click="createHomework">创建作业</el-button>
      <el-button type="danger" size="mini" @click="confirmDeleteSelected">删除作业</el-button>
    </div>
    <el-table :data="tableData" style="width: 100%" :border="false" :header-cell-class-name="'headercell'" @selection-change="handleSelectionChange"
              ref="multipleTable">
      <el-table-column type="selection" width="55" align="center"></el-table-column>
      <el-table-column prop="serialNumber" label="序号" width="80" align="center"></el-table-column>
      <el-table-column prop="name" label="名称" align="center"></el-table-column>
      <el-table-column prop="process" label="流程" align="center"></el-table-column>
      <el-table-column prop="creationTime" label="创建时间" align="center"></el-table-column>
      <el-table-column prop="deadline" label="截止日期" align="center"></el-table-column>
      <el-table-column prop="creator" label="创建人" align="center"></el-table-column>
      <el-table-column prop="completionProgress" label="完成进度" align="center">
        <template slot-scope="scope">
        <el-progress
          :percentage="parseInt(scope.row.completionProgress)"
          :format="percent => `${percent}%`"
        />
      </template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center">
        <template slot-scope="scope">
          <el-tooltip class="item" effect="dark" content="操作" placement="top">
            <el-popover
              placement="bottom"
              width="200"
              v-model="scope.row.visible"
              @mouseenter="scope.row.visible = true"
              @mouseleave="scope.row.visible = false">
              <el-button type="text" icon="el-icon-view" @click="viewHomework(scope.row)">查看</el-button>
              <el-button type="text" icon="el-icon-edit" @click="editHomework(scope.row)">编辑</el-button>
              <el-button type="text" icon="el-icon-delete" @click="deleteSingleHomework(scope.row)">删除</el-button>
              <el-button slot="reference" icon="el-icon-more" circle></el-button>
            </el-popover>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      title="任务详情"
      :visible.sync="showDialog"
      width="70%"
      @close="handleDialogClose"
      class="task-detail-dialog"
    >
      <div class="dialog-content">
        <el-row :gutter="20">
          <el-col :span="12">
            <p><strong>名称：</strong>{{ dialogData.name }}</p>
            <p><strong>流程：</strong>{{ dialogData.process }}</p>
            <p><strong>创建时间：</strong>{{ dialogData.creationTime }}</p>
            <p><strong>任务要求：</strong><span v-html="dialogData.taskRequirements"></span></p>
          </el-col>
          <el-col :span="12">
            <p><strong>截止日期：</strong>{{ dialogData.deadline }}</p>
            <p><strong>创建人：</strong>{{ dialogData.creator }}</p>
            <p><strong>完成进度：</strong>{{ dialogData.completionProgress }}</p>
            <p v-if="dialogData.weights && dialogData.weights.length"><strong>模态权重：</strong>视频: {{ dialogData.weights[0] }}%, 音频: {{ dialogData.weights[1] }}%, 演讲稿: {{ dialogData.weights[2] }}%, PPT: {{ dialogData.weights[3] }}%</p>
          </el-col>
        </el-row>

<!--        <div>-->
<!--          <pre>{{ dialogData }}</pre> &lt;!&ndash; JSON 格式显示 dialogData &ndash;&gt;-->
<!--          &lt;!&ndash; 其他内容 &ndash;&gt;-->
<!--        </div>-->

        <!-- 分配的学生列表 -->
        <div style="margin-top: 20px">
        <el-table :data="paginatedStudentDetails" v-if="studentDetails.length>0" style="margin-top: 20px" border>
          <el-table-column prop="nickName" label="学生姓名"  header-align="center" align="center"></el-table-column>
          <el-table-column prop="userName" label="邮箱"  header-align="center" align="center"></el-table-column>
          <el-table-column prop="studentId" label="学号"  header-align="center" align="center"></el-table-column>
          <el-table-column prop="dept" label="专业"  header-align="center" align="center"></el-table-column>
        </el-table>
        <p v-else>未分配学生任务</p>

        <!-- 分页组件 -->
        <el-pagination
          v-if="studentDetails.length > pageSize"
          style="text-align: center; margin-top: 20px"
          background
          layout="prev, pager, next"
          :page-size="pageSize"
          :current-page="currentPage"
          :total="studentDetails.length"
          @current-change="handlePageChange"
        />
        </div>

        <!-- 评阅老师列表 -->
        <div style="margin-top: 20px">
        <el-table :data="teacherDetails" v-if="teacherDetails.length>0" style="margin-top: 20px" border>
          <el-table-column prop="nickName" label="老师姓名"  header-align="center" align="center"></el-table-column>
          <el-table-column prop="userName" label="邮箱"  header-align="center" align="center"></el-table-column>
          <el-table-column prop="mobile" label="手机号"  header-align="center" align="center"></el-table-column>
        </el-table>
          <p v-else>未安排师评老师</p>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showDialog = false" type="primary">关闭</el-button>
      </span>
    </el-dialog>

  </el-card>
</template>
<script>
import { getAllSubmitsByTaskId,deleteTeacherTask, getHomeworkData } from '@/api/homeworkManage/index';
import { getUserProfile,getUserProfiles } from '@/api/system/user';
export default {
  data() {
    return {
      tableData: [],
      selectedRows: [], // 用于存储选中的行
      showDialog: false, // 控制弹出窗口显示
      dialogData: {
        weights: [0, 0, 0, 0], // 初始化权重为 0
        assignedStudents: [],
        reviewTeachers: [],
      }, // 存储当前任务的详细信息
      studentDetails: [], // 存储学生详细信息
      teacherDetails: [], // 存储评阅老师详细信息
      currentPage: 1, // 当前页
      pageSize: 10, // 每页显示的条数
      progressCache: new Map(), // 用于缓存进度数据
      pendingRequests: new Map(), // 用于追踪正在进行的请求
    };
  },
  created() {
    this.fetchHomeworkData(); // 页面加载时获取作业数据
  },
  computed: {
    paginatedStudentDetails() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.studentDetails.slice(start, end);
    },
  },
  methods: {
    // 修改fetchHomeworkData方法,添加完成进度获取

    async fetchHomeworkData() {
      try {
        const ownerId = this.$store.getters.userId;
        const response = await getHomeworkData(ownerId);

        if (response.data && Array.isArray(response.data)) {
          // 分批处理数据
          const batchSize = 3; // 每批处理3个
          const results = [];

          for (let i = 0; i < response.data.length; i += batchSize) {
            const batch = response.data.slice(i, i + batchSize);
            const batchResults = await Promise.all(
              batch.map(async (item, index) => {
                const progress = await this.fetchCompletionProgress(item.id);
                return {
                  serialNumber: i + index + 1,
                  id: item.id,
                  name: item.taskName,
                  process: item.evaluationMethods.join(" - "),
                  creationTime: new Date(item.createTime).toLocaleString(),
                  deadline: new Date(item.deadline).toLocaleString(),
                  creator: item.ownerName,
                  completionProgress: progress,
                  visible: false,
                  taskRequirements: item.taskRequirements,
                  weights: item.weights,
                  assignedStudents: item.assignedStudents,
                  reviewTeachers: item.reviewTeachers,
                  evaluationDimensions: item.evaluationDimensions,
                  submissionTypes: item.submissionTypes,
                };
              })
            );
            results.push(...batchResults);
          }

          this.tableData = results;
        }
      } catch (error) {
        console.error("Error fetching homework data:", error);
        this.$message.error("获取任务数据失败");
      }
    },



    createHomework() {
      // 跳转到创建作业页面的逻辑
      this.$router.push({ name: 'createHomework' });
    },

    // 修改批量删除的方法
    async confirmDeleteSelected() {
      if (this.selectedRows.length === 0) {
        this.$message({ type: "warning", message: "请先选择要删除的作业" });
        return;
      }

      try {
        await this.$confirm('确定要删除选中的作业吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
      } catch (err) {
        return;
      }

      const loadingInstance = this.$loading({
        text: '正在删除...',
        background: 'rgba(0, 0, 0, 0.7)'
      });

      let successCount = 0;
      let failCount = 0;

      try {
        for (const row of this.selectedRows) {
          try {
            const response = await deleteTeacherTask(row.id);
            if (response.code === 1 && response.msg === 'success') {
              successCount++;
            } else {
              failCount++;
              console.error(`删除作业 ${row.id} 失败:`, response.msg);
            }
          } catch (error) {
            failCount++;
            console.error(`删除作业 ${row.id} 出错:`, error);
          }
        }

        if (successCount > 0) {
          this.$message({
            type: 'success',
            message: `成功删除 ${successCount} 个作业${failCount > 0 ? `，${failCount} 个删除失败` : ''}`
          });
          // 重新获取数据
          await this.fetchHomeworkData();
        } else {
          this.$message({
            type: 'error',
            message: '删除失败'
          });
        }

        // 清空选中状态
        this.selectedRows = [];
        this.$refs.multipleTable.clearSelection();

      } catch (error) {
        this.$message({
          type: 'error',
          message: '删除操作发生错误'
        });
        console.error("批量删除错误:", error);
      } finally {
        loadingInstance.close();
      }
    },

    // 修改单个删除的方法
    async deleteSingleHomework(row) {
      try {
        await this.$confirm('确定要删除该作业吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });

        const response = await deleteTeacherTask(row.id);
        if (response.code === 1 && response.msg === 'success') {
          this.$message({ type: 'success', message: '已删除作业' });
          // 重新获取数据
          await this.fetchHomeworkData();
        } else {
          this.$message({ type: 'error', message: response.msg || '删除失败' });
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message({ type: 'error', message: '删除操作失败' });
          console.error("删除任务错误:", error);
        }
      }
    },

    async fetchProgressFromServer(taskId) {
      try {
        const response = await getAllSubmitsByTaskId(taskId, 1, 999);
        if (response.code === 1 && response.data) {
          const completedCount = response.data.rows.filter(student =>
            student.taskInfos.every(task => task.finished === true)
          ).length;

          const totalStudents = response.data.total;
          const progressPercentage = totalStudents > 0
            ? Math.round((completedCount / totalStudents) * 100)
            : 0;

          return `${progressPercentage}%`;
        }
        return '0%';
      } catch (error) {
        console.error('Error getting completion progress:', error);
        return '0%';
      }
    },
    async fetchCompletionProgress(taskId) {
      // 检查缓存
      const now = Date.now();
      const cached = this.progressCache.get(taskId);
      if (cached && now - cached.timestamp < 5*60*1000) { // 5分钟缓存
        return cached.progress;
      }

      // 检查是否已有相同的请求在进行中
      if (this.pendingRequests.has(taskId)) {
        return this.pendingRequests.get(taskId);
      }

      // 创建新的请求
      const requestPromise = this.fetchProgressFromServer(taskId);
      this.pendingRequests.set(taskId, requestPromise);

      try {
        const progress = await requestPromise;
        // 更新缓存
        this.progressCache.set(taskId, {
          progress,
          timestamp: now
        });
        return progress;
      } catch (error) {
        console.error('Error fetching progress:', error);
        return '0%';
      } finally {
        // 清除pending状态
        this.pendingRequests.delete(taskId);
      }
    },



    async viewHomework(row) {
      this.dialogData = {
        ...row,
        weights: row.weights || [0, 0, 0, 0],
        assignedStudents: Array.isArray(row.assignedStudents) ? Array.from(new Set(row.assignedStudents)) : [],
        reviewTeachers: Array.isArray(row.reviewTeachers) ? Array.from(new Set(row.reviewTeachers)) : []
      };
      this.studentDetails = [];
      this.teacherDetails = [];
      this.showDialog = true;

      try {
        // 合并所有用户ID到一个数组
        const allUserIds = [
          ...this.dialogData.assignedStudents,
          ...this.dialogData.reviewTeachers
        ];

        // 只有当有用户ID时才发送请求
        if (allUserIds.length > 0) {
          // 只调用一次 getUserProfiles
          const response = await getUserProfiles(allUserIds);

          if (response && response.data && response.data.rows) {
            // 根据原始ID数组分类用户数据
            this.studentDetails = response.data.rows.filter(user =>
              this.dialogData.assignedStudents.includes(user.userId)
            );
            this.teacherDetails = response.data.rows.filter(user =>
              this.dialogData.reviewTeachers.includes(user.userId)
            );
          }
        }
      } catch (error) {
        console.error("Error fetching user profiles:", error);
        this.$message.error('获取用户信息失败');
      }
    },

    handleDialogClose() {
      this.dialogData = {}; // 关闭窗口时清空数据
      this.studentDetails = [];
      this.teacherDetails = [];
    },

    handlePageChange(page) {
      this.currentPage = page;
    },
    editHomework(row) {
      // 跳转到编辑作业页面的逻辑
      this.$router.push({ name: 'homeWorkDetail', params: {ownerId: this.$store.getters.userId ,assignmentId: row.id} });
    },
    handleSelectionChange(val) {
      this.selectedRows = val; // 更新选中的行
    }
  }
};
</script>
<style scoped>
.homework-management {
  width: 100%;
}
.header {
  display: flex;
  margin-bottom: 10px;
}
.homework-management /deep/ .el-table .el-table__body-wrapper tbody td {
  border-bottom: none;
}
.homework-management /deep/ .el-table .el-table__header-wrapper thead th {
  border-bottom: none;
}
.headercell {
  background-color: rgba(201, 3, 3, 0.98); /* 你可以选择你想要的颜色 */
  color: #bb1919; /* 表头文字颜色 */
}
.task-detail-dialog {
  border-radius: 8px;
}
.dialog-content {
  padding: 20px;
  font-size: 16px;
  color: #333;
  line-height: 1.6;
}
.dialog-content p {
  margin: 10px 0;
  display: flex;
  align-items: center;
}
.dialog-content strong {
  color: #409eff;
}
.dialog-footer {
  text-align: right;
  padding: 15px 0;
}
.task-detail-dialog .el-dialog__header {
  background-color: #f5f7fa;
  font-weight: bold;
  color: #333;
  border-bottom: none;
  text-align: center;
}
.task-detail-dialog .el-dialog__title {
  font-size: 20px;
}
.task-detail-dialog .el-dialog__footer {
  background-color: #f5f7fa;
  padding: 10px 20px;
}
.el-button--primary {
  background-color: #409eff;
  border-color: #409eff;
}
.el-button--primary:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}
</style>
