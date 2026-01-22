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
      <el-table-column prop="taskRequirements" label="任务要求" align="center" width="200">
        <template slot-scope="scope">
          <div class="task-requirements-cell">
            {{ scope.row.taskRequirements || '暂无' }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="process" label="流程" align="center"></el-table-column>
      <el-table-column prop="creationTime" label="创建时间" align="center"></el-table-column>
      <el-table-column prop="deadline" label="截止日期" align="center"></el-table-column>
      <!-- <el-table-column prop="creator" label="创建人" align="center"></el-table-column> -->
      <el-table-column prop="completionProgress" label="完成进度" align="center">
        <template slot-scope="scope">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <div style="width: 100%;">
              <div style="font-size: 12px; color: #909399; margin-bottom: 4px;">提交进度</div>
        <el-progress
          :percentage="parseInt(scope.row.completionProgress)"
          :format="percent => `${percent}%`"
                :stroke-width="12"
              />
            </div>
            <div style="width: 100%;">
              <div style="font-size: 12px; color: #909399; margin-bottom: 4px;">评价进度</div>
              <el-progress
                :percentage="parseInt(scope.row.evaluationProgress)"
                :format="percent => `${percent}%`"
                :color="'#67C23A'"
                :stroke-width="12"
              />
            </div>
          </div>
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
              <el-button type="text" icon="el-icon-download" @click="exportGradeSheet(scope.row)">导出成绩单</el-button>
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
            <p v-if="dialogData.weights && dialogData.weights.length"><strong>模态权重：</strong>视频: {{ dialogData.weights[0] }}%, 音频: {{ dialogData.weights[1] }}%, 文稿: {{ dialogData.weights[2] }}%, PPT: {{ dialogData.weights[3] }}%</p>
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
          <el-table-column label="完成进度"  header-align="center" align="center" width="450">
            <template slot-scope="scope">
              <div style="display: flex; flex-direction: row; align-items: center; gap: 12px; white-space: nowrap;">
                <div style="display: inline-flex; align-items: center;">
                  <span style="font-size: 12px; color: #909399; margin-right: 4px;">提交进度：</span>
                  <el-tag :type="scope.row.submissionCompleted ? 'success' : 'info'" size="small">
                    {{ scope.row.submissionCompleted ? '已完成' : '未完成' }}
                  </el-tag>
                </div>
                <div style="display: inline-flex; align-items: center;">
                  <span style="font-size: 12px; color: #909399; margin-right: 4px;">评价进度：</span>
                  <el-tag :type="scope.row.evaluationCompleted ? 'success' : 'info'" size="small">
                    {{ scope.row.evaluationCompleted ? '已完成' : '未完成' }}
                  </el-tag>
                </div>
                <div v-if="scope.row.submissionCompleted" style="display: inline-flex; align-items: center; margin-left: 8px;">
                  <span style="font-size: 12px; color: #909399; margin-right: 4px;">教师评价：</span>
                  <el-button 
                    type="primary" 
                    size="mini"
                    @click="goToTeacherReviewFromStudent(scope.row)"
                  >
                    评价
                  </el-button>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="学生评估详情"  header-align="center" align="center" width="400">
            <template slot-scope="scope">
              <div v-if="scope.row.evaluationCompleted && scope.row.evaluationDetails && scope.row.evaluationDetails.length > 0">
                <div v-for="(evaluation, index) in scope.row.evaluationDetails" :key="index" style="margin-bottom: 8px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <el-link 
                      type="primary" 
                      @click="viewEvaluationDetail(scope.row, evaluation)"
                      style="font-weight: 500;"
                      :disabled="!evaluation.total || evaluation.total === '-' || evaluation.total === null">
                      {{ evaluation.method || evaluation.type }}：{{ evaluation.total ? parseFloat(evaluation.total).toFixed(2) : '-' }}分
                    </el-link>
                    <span style="font-size: 12px; color: #909399;">
                      ({{ evaluation.contentTypes && evaluation.contentTypes.length > 0 ? evaluation.contentTypes.join('、') : '无' }})
                    </span>
                  </div>
                </div>
              </div>
              <div v-else style="color: #909399; font-size: 14px;">
                评估尚未完成
              </div>
            </template>
          </el-table-column>
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
          <div style="margin-bottom: 10px; padding: 10px; background-color: #f0f9ff; border-left: 4px solid #409eff; color: #606266; font-size: 14px;">
            <i class="el-icon-info" style="margin-right: 5px;"></i>
            提示：当学生提交相关内容后，方可对学生内容进行师评
          </div>
        <el-table :data="teacherDetails" v-if="teacherDetails.length>0" style="margin-top: 20px" border>
            <el-table-column prop="nickName" label="教师姓名"  header-align="center" align="center" width="150"></el-table-column>
            <el-table-column label="学生评价" header-align="center" align="left">
            <template slot-scope="scope">
                <div v-if="scope.row.students && scope.row.students.length > 0" class="student-evaluation-list">
                  <div 
                    v-for="student in scope.row.students" 
                    :key="student.studentId"
                    class="student-evaluation-item"
                  >
                    <span class="student-name">{{ student.nickName }}</span>
                    <el-button 
                      type="primary" 
                      size="mini"
                      @click="goToTeacherReview(student, scope.row.userId)"
                    >
                      评价
                    </el-button>
                  </div>
                </div>
                <div v-else class="no-students-text">
                  暂无待评价学生
                </div>
            </template>
          </el-table-column>
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
import { getAllSubmitsByTaskId,deleteTeacherTask, getHomeworkData, getAllGradesByTaskId, getEvaluationByTaskIdAndStudId } from '@/api/homeworkManage/index';
import { getTaskInfoById } from '@/api/homeworkManage/assignTask';
import { getUserProfile,getUserProfiles } from '@/api/system/user';
import { getSubmissionByTaskIdAndStudentId } from '@/api/myTask/myEvaluation/index';
import * as XLSX from 'xlsx';
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
                const evaluationProgress = await this.fetchEvaluationProgress(item.id, item.evaluationMethods);
                return {
                  serialNumber: i + index + 1,
                  id: item.id,
                  name: item.taskName,
                  process: item.evaluationMethods.join(" - "),
                  creationTime: new Date(item.createTime).toLocaleString(),
                  deadline: new Date(item.deadline).toLocaleString(),
                  creator: item.ownerName,
                  completionProgress: progress,
                  evaluationProgress: evaluationProgress,
                  visible: false,
                  taskRequirements: item.taskRequirements,
                  weights: item.weights,
                  assignedStudents: item.assignedStudents,
                  reviewTeachers: item.reviewTeachers,
                  evaluationDimensions: item.evaluationDimensions,
                  submissionTypes: item.submissionTypes,
                  evaluationMethods: item.evaluationMethods,
                };
              })
            );
            results.push(...batchResults);
          }

          // 倒序排列，最新的作业显示在最前面
          results.reverse();
          
          // 重新计算序号（倒序后序号需要重新分配）
          results.forEach((item, index) => {
            item.serialNumber = index + 1;
          });

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

      // 保存要删除的作业ID列表（在清空selectedRows之前）
      const deletedIds = this.selectedRows.map(row => row.id);
      
      try {
        for (const row of this.selectedRows) {
          try {
            const response = await deleteTeacherTask(row.id);
            // 判断删除是否成功：code === 1 表示成功（与单个删除保持一致）
            if (response.code === 1) {
              successCount++;
            } else {
              failCount++;
              console.error(`删除作业 ${row.id} 失败:`, response.msg || '未知错误');
            }
          } catch (error) {
            failCount++;
            console.error(`删除作业 ${row.id} 出错:`, error);
          }
        }

        // 清空选中状态
        this.selectedRows = [];
        this.$refs.multipleTable.clearSelection();

        if (successCount > 0) {
          // 删除成功，显示绿色成功消息
          this.$message.success(`成功删除 ${successCount} 个作业${failCount > 0 ? `，${failCount} 个删除失败` : ''}`);
          // 从表格数据中移除已删除的作业，立即更新界面
          this.tableData = this.tableData.filter(item => !deletedIds.includes(item.id));
          // 重新计算序号
          this.tableData.forEach((item, idx) => {
            item.serialNumber = idx + 1;
          });
          // 重新获取数据以确保数据同步
          await this.fetchHomeworkData();
        } else {
          // 删除失败，显示红色错误消息
          this.$message.error('删除失败');
        }

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
        // 判断删除是否成功：code === 1 表示成功
        if (response.code === 1) {
          // 删除成功，显示绿色成功消息
          this.$message.success('删除成功');
          // 从表格数据中移除已删除的作业，立即更新界面
          const index = this.tableData.findIndex(item => item.id === row.id);
          if (index !== -1) {
            this.tableData.splice(index, 1);
            // 重新计算序号
            this.tableData.forEach((item, idx) => {
              item.serialNumber = idx + 1;
            });
          }
          // 同时重新获取数据以确保数据同步
          await this.fetchHomeworkData();
        } else {
          // 删除失败，显示红色错误消息
          this.$message.error(response.msg || '删除失败');
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除操作失败');
          console.error("删除任务错误:", error);
        }
      }
    },

    async fetchProgressFromServer(taskId) {
      try {
        // 获取任务信息，获取实际分配的学生数
        const taskResponse = await getTaskInfoById(taskId);
        if (taskResponse.code !== 1 || !taskResponse.data) {
          return '0%';
        }
        
        const assignedStudents = taskResponse.data.assignedStudents || [];
        const totalStudents = assignedStudents.length;
        
        if (totalStudents === 0) {
          return '0%';
        }

        // 获取提交记录
        const response = await getAllSubmitsByTaskId(taskId, 1, 999);
        if (response.code === 1 && response.data) {
          // 只统计实际分配的学生中已完成的数量
          const assignedStudentIds = new Set(assignedStudents);
          const completedCount = response.data.rows.filter(student =>
            assignedStudentIds.has(student.studentId) && // 只统计实际分配的学生
            student.taskInfos && 
            student.taskInfos.every(task => task.finished === true)
          ).length;

          const progressPercentage = Math.round((completedCount / totalStudents) * 100);
          return `${progressPercentage}%`;
        }
        return '0%';
      } catch (error) {
        console.error('Error getting completion progress:', error);
        return '0%';
      }
    },
    async fetchEvaluationProgress(taskId, evaluationMethods) {
      try {
        // 获取任务信息，获取实际分配的学生数
        const taskResponse = await getTaskInfoById(taskId);
        if (taskResponse.code !== 1 || !taskResponse.data) {
          return '0%';
        }
        
        const assignedStudents = taskResponse.data.assignedStudents || [];
        const totalStudents = assignedStudents.length;
        
        if (totalStudents === 0 || !evaluationMethods || evaluationMethods.length === 0) {
          return '0%';
        }

        // 使用与学生端相同的逻辑：为每个学生调用 getEvaluationByTaskIdAndStudId API
        // 这样可以保证数据格式的一致性
        let completedCount = 0;
        
        // 并行获取所有学生的评价数据
        const evaluationPromises = assignedStudents.map(async (studentId) => {
          try {
            const evalResponse = await getEvaluationByTaskIdAndStudId(taskId, studentId);
            if (evalResponse.code === 1 && evalResponse.data) {
              // 使用与学生端相同的处理逻辑
              const processedData = this.processEvaluationDataForStudent(evalResponse.data, taskResponse.data.weights);
              
              // 检查是否完成了所有分配的评价维度
              // 需要确保所有评价维度都存在且有总分
              const allCompleted = processedData.length === evaluationMethods.length && 
                processedData.every(item => {
                  // 检查该评价维度是否在分配的评价方法中
                  const methodInList = evaluationMethods.includes(item.method || item.type);
                  // 检查是否有总分
                  const hasTotal = item.total !== null && item.total !== '-' && item.total !== undefined;
                  return methodInList && hasTotal;
                });
              
              return allCompleted;
            }
          } catch (error) {
            console.error(`获取学生 ${studentId} 的评估数据失败:`, error);
          }
          return false;
        });

        const evaluationResults = await Promise.all(evaluationPromises);
        completedCount = evaluationResults.filter(result => result === true).length;

        const progressPercentage = Math.round((completedCount / totalStudents) * 100);
        return `${progressPercentage}%`;
      } catch (error) {
        console.error('Error getting evaluation progress:', error);
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
            const allStudents = response.data.rows.filter(user =>
              this.dialogData.assignedStudents.includes(user.userId)
            );
            this.teacherDetails = response.data.rows.filter(user =>
              this.dialogData.reviewTeachers.includes(user.userId)
            );

            // 获取提交和评价完成状态
            const taskId = row.id;
            const evaluationMethods = row.evaluationMethods || [];

            // 获取提交记录
            const submissionResponse = await getAllSubmitsByTaskId(taskId, 1, 999);
            const submissionMap = new Map();
            if (submissionResponse.code === 1 && submissionResponse.data && submissionResponse.data.rows) {
              submissionResponse.data.rows.forEach(submission => {
                if (this.dialogData.assignedStudents.includes(submission.studentId)) {
                  const allFinished = submission.taskInfos && 
                    submission.taskInfos.every(task => task.finished === true);
                  submissionMap.set(submission.studentId, allFinished);
                }
              });
            }

            // 获取评价记录和详细数据
            const evaluationMap = new Map();
            const evaluationDetailsMap = new Map();
            const submissionIdMap = new Map(); // 存储学生的submissionId
            
            // 获取submissionId映射
            if (submissionResponse.code === 1 && submissionResponse.data && submissionResponse.data.rows) {
              submissionResponse.data.rows.forEach(submission => {
                if (this.dialogData.assignedStudents.includes(submission.studentId)) {
                  submissionIdMap.set(submission.studentId, submission.id);
                }
              });
            }

            // 使用学生端相同的逻辑：为每个学生调用 getEvaluationByTaskIdAndStudId API
            if (evaluationMethods.length > 0) {
              const evaluationPromises = allStudents.map(async (student) => {
                try {
                  const evalResponse = await getEvaluationByTaskIdAndStudId(taskId, student.userId);
                  if (evalResponse.code === 1 && evalResponse.data) {
                    // 使用学生端相同的处理逻辑
                    const processedData = this.processEvaluationDataForStudent(evalResponse.data, this.dialogData.weights);
                    
                    // 检查是否完成了所有分配的评价维度
                    const allCompleted = processedData.length === evaluationMethods.length && 
                      processedData.every(item => item.total !== null && item.total !== '-');
                    
                    return {
                      studentId: student.userId,
                      allCompleted,
                      evaluationDetails: processedData
                    };
                  }
                } catch (error) {
                  console.error(`获取学生 ${student.userId} 的评估数据失败:`, error);
                }
                return {
                  studentId: student.userId,
                  allCompleted: false,
                  evaluationDetails: []
                };
              });

              const evaluationResults = await Promise.all(evaluationPromises);
              
              evaluationResults.forEach(result => {
                evaluationMap.set(result.studentId, result.allCompleted);
                evaluationDetailsMap.set(result.studentId, result.evaluationDetails);
              });
            }

            // 合并学生信息和完成状态
            this.studentDetails = allStudents.map(student => ({
              ...student,
              submissionCompleted: submissionMap.get(student.userId) || false,
              evaluationCompleted: evaluationMap.get(student.userId) || false,
              evaluationDetails: evaluationDetailsMap.get(student.userId) || [],
              submissionId: submissionIdMap.get(student.userId) || null
            }));

            // 为每个老师处理学生列表（已完成提交但未进行师评的学生）
            await this.processTeacherStudents(taskId, allStudents, submissionMap, evaluationDetailsMap);
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
    viewEvaluationDetail(student, evaluation) {
      // 跳转到对应的评估详情页面（与学生端逻辑一致）
      const routeMap = {
        '自评': 'showSelfReview',
        '机评': 'showmachineEvaluation',
        '互评': 'showMutualReview',
        '师评': 'showTeacherReview'
      };

      const method = evaluation.method || evaluation.type;
      const routeName = routeMap[method];
      
      // 如果没有总分，不允许跳转
      if (!evaluation.total || evaluation.total === '-' || evaluation.total === null) {
        return;
      }
      
      if (routeName && student.submissionId) {
        this.$router.push({
          name: routeName,
          query: {
            taskId: this.dialogData.id,
            submitId: student.submissionId,
            taskDetails: JSON.stringify({
              taskName: this.dialogData.name,
              taskId: this.dialogData.id,
              weights: this.dialogData.weights
            })
          }
        });
      } else {
        this.$message.warning('无法跳转到评估详情页面');
      }
    },
    editHomework(row) {
      // 跳转到作业分配/编辑页面（AssignTask）
      this.$router.push({ name: 'AssignTask', params: { taskId: row.id } });
    },
    handleSelectionChange(val) {
      this.selectedRows = val; // 更新选中的行
    },
    // 处理学生评估数据，与学生端逻辑一致
    processEvaluationDataForStudent(data, taskDetails) {
      const mapAudioScore = (score) => {
        if (score === null || score === undefined) return null;
        return Math.min(Math.max(Math.round(Number(score)), 0), 100);
      };

      return data.evaluationTypes.map(type => {
        const row = {
          type: type.evaluationMethod,
          method: type.evaluationMethod, // 兼容 method 和 type
          video: null,
          audio: null,
          ppt: null,
          speech: null,
          total: null,
          contentTypes: [] // 记录已完成的评价内容类型
        };

        let totalScore = 0;
        let totalWeight = 0;
        const weights = taskDetails?.weights || [25, 25, 25, 25]; // 使用任务的权重

        type.evaluationContents.forEach(content => {
          if (content.finished) {
            let score = content.grade;
            let weight = 0;

            switch (content.evaluationContent) {
              case '视频':
                row.video = score;
                row.contentTypes.push('视频');
                weight = weights[0] || 0;
                if (score !== null && score !== '-') {
                  totalScore += Number(score) * weight;
                  totalWeight += weight;
                }
                break;
              case '音频':
                score = mapAudioScore(score);
                row.audio = score;
                row.contentTypes.push('音频');
                weight = weights[1] || 0;
                if (score !== null && score !== '-') {
                  totalScore += Number(score) * weight;
                  totalWeight += weight;
                }
                break;
              case 'PPT':
                row.ppt = content.grade;
                row.contentTypes.push('PPT');
                weight = weights[2] || 0;
                if (score !== null && score !== '-') {
                  totalScore += Number(score) * weight;
                  totalWeight += weight;
                }
                break;
              case '演讲稿':
                row.speech = score;
                row.contentTypes.push('演讲稿');
                weight = weights[3] || 0;
                if (score !== null && score !== '-') {
                  totalScore += Number(score) * weight;
                  totalWeight += weight;
                }
                break;
            }
          }
        });

        if (totalWeight > 0) {
          row.total = (totalScore / totalWeight).toFixed(2);
        }

        return row;
      });
    },

    // 处理每个老师的学生列表
    async processTeacherStudents(taskId, allStudents, submissionMap, evaluationDetailsMap) {
      // 获取任务信息，用于检查提交类型
      const taskResponse = await getTaskInfoById(taskId);
      if (taskResponse.code !== 1 || !taskResponse.data) {
        return;
      }
      const taskInfo = taskResponse.data;

      // 为每个老师处理学生列表
      this.teacherDetails = await Promise.all(
        this.teacherDetails.map(async (teacher) => {
          const students = [];

          // 遍历所有学生
          for (const student of allStudents) {
            // 检查学生是否已完成提交
            const submissionCompleted = submissionMap.get(student.userId) || false;
            
            // 如果已完成提交，检查是否完成所有要求的提交类型
            if (submissionCompleted) {
              try {
                const submissionResponse = await getSubmissionByTaskIdAndStudentId(taskId, student.userId);
                if (submissionResponse.code === 1 && submissionResponse.data) {
                  const isComplete = this.checkSubmissionComplete(taskInfo, submissionResponse.data);
                  
                  if (isComplete) {
                    // 检查任务是否包含师评方法
                    const hasTeacherEvaluation = taskInfo.evaluationMethods && taskInfo.evaluationMethods.includes('师评');
                    
                    if (hasTeacherEvaluation) {
                      // 检查是否未进行师评
                      const evaluationDetails = evaluationDetailsMap.get(student.userId) || [];
                      const teacherEvaluation = evaluationDetails.find(evaluation => evaluation.method === '师评' || evaluation.type === '师评');
                      
                      // 如果师评记录不存在，或者存在但未完成（没有总分），都添加到待评价列表
                      if (!teacherEvaluation || (!teacherEvaluation.total || teacherEvaluation.total === '-' || teacherEvaluation.total === null)) {
                        students.push({
                          studentId: student.userId,
                          userId: student.userId,
                          nickName: student.nickName
                        });
                      }
                    }
                  }
                }
              } catch (error) {
                console.error(`获取学生 ${student.userId} 的提交信息失败:`, error);
              }
            }
          }

          return {
            ...teacher,
            students: students
          };
        })
      );
    },

    // 检查学生是否已完成所有要求的提交内容
    checkSubmissionComplete(taskInfo, studentSubmission) {
      if (!taskInfo?.submissionTypes || !studentSubmission?.taskInfos) {
        return false;
      }
      
      const requiredTypes = taskInfo.submissionTypes || [];
      
      if (requiredTypes.length === 0) {
        return true;
      }
      
      const submittedTypes = studentSubmission.taskInfos
        .filter(info => info.finished === true)
        .map(info => info.submissionType);
      
      return requiredTypes.every(type => submittedTypes.includes(type));
    },

    // 跳转到师评页面
    goToTeacherReview(student, reviewerId) {
      this.$router.push({
        path: '/myEvaluation/teacherReview',
        query: {
          taskId: this.dialogData.id,
          homeworkTitle: this.dialogData.name,
          submitter: student.nickName || '',
          currentProcess: '师评',
          reviewerId: reviewerId,
          studentId: student.userId || student.studentId
        }
      });
    },

    // 从学生列表跳转到师评页面（使用当前登录用户作为评价教师）
    goToTeacherReviewFromStudent(student) {
      const currentUserId = this.$store.getters.userId;
      this.$router.push({
        path: '/myEvaluation/teacherReview',
        query: {
          taskId: this.dialogData.id,
          homeworkTitle: this.dialogData.name,
          submitter: student.nickName || '',
          currentProcess: '师评',
          reviewerId: currentUserId,
          studentId: student.userId || student.studentId
        }
      });
    },
    
    // 导出成绩单
    async exportGradeSheet(row) {
      try {
        this.$message.info('正在生成成绩单，请稍候...');
        
        // 1. 获取作业详情（包含评价维度和评阅流程）
        const taskResponse = await getTaskInfoById(row.id);
        if (taskResponse.code !== 1 || !taskResponse.data) {
          this.$message.error('获取作业信息失败');
          return;
        }
        
        const taskInfo = taskResponse.data;
        const evaluationMethods = taskInfo.evaluationMethods || [];
        // 按照固定顺序排序提交类型：视频、音频、PPT、文稿
        const submissionTypeOrder = ['视频', '音频', 'PPT', '演讲稿'];
        const submissionTypes = (taskInfo.submissionTypes || []).sort((a, b) => {
          const indexA = submissionTypeOrder.indexOf(a);
          const indexB = submissionTypeOrder.indexOf(b);
          // 如果不在预定义顺序中，排在后面
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
        const evaluationDimensions = taskInfo.evaluationDimensions || [];
        const assignedStudents = taskInfo.assignedStudents || [];
        
        if (assignedStudents.length === 0) {
          this.$message.warning('该作业未分配学生，无法导出成绩单');
          return;
        }
        
        // 2. 获取所有学生信息
        const userResponse = await getUserProfiles(assignedStudents);
        if (!userResponse || !userResponse.data || !userResponse.data.rows) {
          this.$message.error('获取学生信息失败');
          return;
        }
        
        const studentMap = new Map();
        userResponse.data.rows.forEach(student => {
          studentMap.set(student.userId, student);
        });
        
        // 3. 获取所有学生的评价数据
        const studentEvaluations = new Map();
        const evaluationPromises = assignedStudents.map(async (studentId) => {
          try {
            const evalResponse = await getEvaluationByTaskIdAndStudId(row.id, studentId);
            if (evalResponse.code === 1 && evalResponse.data) {
              studentEvaluations.set(studentId, evalResponse.data);
            }
          } catch (error) {
            console.error(`获取学生 ${studentId} 的评价数据失败:`, error);
          }
        });
        
        await Promise.all(evaluationPromises);
        
        // 4. 创建Excel工作簿
        const workbook = XLSX.utils.book_new();
        
        // 5. 创建总分表
        this.createTotalScoreSheet(workbook, assignedStudents, studentMap, studentEvaluations, evaluationMethods, submissionTypes, taskInfo.weights);
        
        // 6. 根据评阅流程创建对应的工作表
        const methodMap = {
          '机评': '机评',
          '师评': '师评',
          '互评': '互评',
          '自评': '自评'
        };
        
        for (const method of evaluationMethods) {
          if (methodMap[method]) {
            this.createEvaluationDetailSheet(
              workbook,
              method,
              assignedStudents,
              studentMap,
              studentEvaluations,
              submissionTypes,
              evaluationDimensions
            );
          }
        }
        
        // 7. 导出Excel文件
        // 使用本地时间格式化日期
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const fileName = `${row.name}_成绩单_${year}-${month}-${day}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        
        this.$message.success('成绩单导出成功');
      } catch (error) {
        console.error('导出成绩单失败:', error);
        this.$message.error('导出成绩单失败：' + (error.message || '未知错误'));
      }
    },
    
    // 创建总分表
    createTotalScoreSheet(workbook, assignedStudents, studentMap, studentEvaluations, evaluationMethods, submissionTypes, weights) {
      const headers = ['姓名'];
      const submissionTypeMap = {
        '视频': 'video',
        '音频': 'audio',
        'PPT': 'ppt',
        '演讲稿': 'speech'
      };
      // 显示名称映射：将"演讲稿"显示为"文稿"
      const displayNameMap = {
        '演讲稿': '文稿'
      };
      
      // 根据评阅流程生成表头：每个评阅流程先有总分，再有各提交内容分数
      // 同一评阅流程内挨着，不同评阅流程之间空一列
      const methodOrder = ['机评', '师评', '互评', '自评'];
      for (let i = 0; i < methodOrder.length; i++) {
        const method = methodOrder[i];
        if (evaluationMethods.includes(method)) {
          // 该评阅流程的总分
          headers.push(`${method}总分`);
          
          // 该评阅流程的各提交内容分数（挨着，没有空列）
          for (const subType of submissionTypes) {
            const typeKey = submissionTypeMap[subType];
            if (typeKey) {
              // 使用显示名称映射
              const displayName = displayNameMap[subType] || subType;
              headers.push(`${method}${displayName}分`);
            }
          }
          
          // 检查后面是否还有其他的评阅流程
          const hasNextMethod = methodOrder.slice(i + 1).some(m => evaluationMethods.includes(m));
          if (hasNextMethod) {
            headers.push('');
          }
        }
      }
      
      // 创建数据行
      const data = [headers];
      
      for (const studentId of assignedStudents) {
        const student = studentMap.get(studentId);
        if (!student) continue;
        
        const row = [student.nickName || student.name || `学生${studentId}`];
        const evaluation = studentEvaluations.get(studentId);
        
        // 按照评阅流程顺序填充数据
        for (let i = 0; i < methodOrder.length; i++) {
          const method = methodOrder[i];
          if (evaluationMethods.includes(method)) {
            // 获取该评价方法的数据
            const methodData = this.getEvaluationMethodData(evaluation, method, submissionTypes, weights);
            
            // 该评阅流程的总分
            row.push(methodData.total !== null && methodData.total !== '-' ? parseFloat(methodData.total).toFixed(2) : '-');
            
            // 该评阅流程的各提交内容分数（挨着，没有空列）
            for (const subType of submissionTypes) {
              const typeKey = submissionTypeMap[subType];
              const score = methodData[typeKey];
              row.push(score !== null && score !== '-' && score !== undefined ? parseFloat(score).toFixed(2) : '-');
            }
            
            // 检查后面是否还有其他的评阅流程
            const hasNextMethod = methodOrder.slice(i + 1).some(m => evaluationMethods.includes(m));
            if (hasNextMethod) {
              row.push('');
            }
          }
        }
        
        data.push(row);
      }
      
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, '总分表');
    },
    
    // 创建评价详情工作表
    createEvaluationDetailSheet(workbook, method, assignedStudents, studentMap, studentEvaluations, submissionTypes, evaluationDimensions) {
      const headers = ['姓名'];
      
      // 为每个提交类型创建列：提交类型总分 + 各评价维度分数
      const submissionTypeMap = {
        '视频': 'video',
        '音频': 'audio',
        'PPT': 'ppt',
        '演讲稿': 'speech'
      };
      // 显示名称映射：将"演讲稿"显示为"文稿"
      const displayNameMap = {
        '演讲稿': '文稿'
      };
      
      // 在不同提交类型之间添加空列区分
      for (let i = 0; i < submissionTypes.length; i++) {
        const subType = submissionTypes[i];
        // 使用显示名称映射
        const displayName = displayNameMap[subType] || subType;
        headers.push(`${displayName}总分`);
        // 获取该提交类型的评价维度
        const dimensions = this.getDimensionsForSubmissionType(evaluationDimensions, subType);
        for (const dim of dimensions) {
          headers.push(`${displayName}_${dim}`);
        }
        // 如果不是最后一个提交类型，添加一个空列
        if (i < submissionTypes.length - 1) {
          headers.push('');
        }
      }
      
      const data = [headers];
      
      for (const studentId of assignedStudents) {
        const student = studentMap.get(studentId);
        if (!student) continue;
        
        const row = [student.nickName || student.name || `学生${studentId}`];
        const evaluation = studentEvaluations.get(studentId);
        
        if (!evaluation || !evaluation.evaluationTypes) {
          // 如果没有评价数据，填充空值，在不同提交类型之间添加空列
          for (let i = 0; i < submissionTypes.length; i++) {
            const subType = submissionTypes[i];
            const dimensions = this.getDimensionsForSubmissionType(evaluationDimensions, subType);
            row.push('-'); // 总分
            for (let j = 0; j < dimensions.length; j++) {
              row.push('-');
            }
            // 如果不是最后一个提交类型，添加一个空列
            if (i < submissionTypes.length - 1) {
              row.push('');
            }
          }
          data.push(row);
          continue;
        }
        
        // 找到对应评价方法的数据
        const methodType = evaluation.evaluationTypes.find(et => et.evaluationMethod === method);
        
        if (!methodType || !methodType.evaluationContents) {
          // 如果没有该评价方法的数据，填充空值，在不同提交类型之间添加空列
          for (let i = 0; i < submissionTypes.length; i++) {
            const subType = submissionTypes[i];
            const dimensions = this.getDimensionsForSubmissionType(evaluationDimensions, subType);
            row.push('-');
            for (let j = 0; j < dimensions.length; j++) {
              row.push('-');
            }
            // 如果不是最后一个提交类型，添加一个空列
            if (i < submissionTypes.length - 1) {
              row.push('');
            }
          }
          data.push(row);
          continue;
        }
        
        // 按提交类型顺序填充数据，在不同提交类型之间添加空列
        for (let i = 0; i < submissionTypes.length; i++) {
          const subType = submissionTypes[i];
          const typeKey = submissionTypeMap[subType];
          const content = methodType.evaluationContents.find(ec => ec.evaluationContent === subType);
          
          if (content && content.finished) {
            // 总分
            const totalScore = content.grade !== null && content.grade !== undefined ? parseFloat(content.grade).toFixed(2) : '-';
            row.push(totalScore);
            
            // 各评价维度分数
            const dimensions = this.getDimensionsForSubmissionType(evaluationDimensions, subType);
            if (content.evaluationDimensions && content.evaluationDimensions.length > 0) {
              const dimMap = new Map();
              content.evaluationDimensions.forEach(dim => {
                const key = Object.keys(dim)[0];
                const value = Object.values(dim)[0];
                dimMap.set(key, value);
              });
              
              for (const dim of dimensions) {
                const score = dimMap.get(dim);
                // 将星星评分转换为百分制
                const convertedScore = this.convertStarScoreToPercentage(score);
                row.push(convertedScore !== null && convertedScore !== undefined ? parseFloat(convertedScore).toFixed(2) : '-');
              }
            } else {
              // 如果没有维度数据，填充空值
              for (let i = 0; i < dimensions.length; i++) {
                row.push('-');
              }
            }
          } else {
            // 如果没有该提交类型的评价数据
            const dimensions = this.getDimensionsForSubmissionType(evaluationDimensions, subType);
            row.push('-'); // 总分
            for (let j = 0; j < dimensions.length; j++) {
              row.push('-');
            }
          }
          // 如果不是最后一个提交类型，添加一个空列
          if (i < submissionTypes.length - 1) {
            row.push('');
          }
        }
        
        data.push(row);
      }
      
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, method);
    },
    
    // 获取评价方法的数据（用于总分表）
    getEvaluationMethodData(evaluation, method, submissionTypes, weights) {
      const result = {
        total: null,
        video: null,
        audio: null,
        ppt: null,
        speech: null
      };
      
      if (!evaluation || !evaluation.evaluationTypes) {
        return result;
      }
      
      const methodType = evaluation.evaluationTypes.find(et => et.evaluationMethod === method);
      if (!methodType || !methodType.evaluationContents) {
        return result;
      }
      
      const submissionTypeMap = {
        '视频': 'video',
        '音频': 'audio',
        'PPT': 'ppt',
        '演讲稿': 'speech'
      };
      
      let totalScore = 0;
      let totalWeight = 0;
      
      methodType.evaluationContents.forEach(content => {
        if (content.finished) {
          const typeKey = submissionTypeMap[content.evaluationContent];
          if (typeKey) {
            const score = content.grade !== null && content.grade !== undefined ? Number(content.grade) : null;
            result[typeKey] = score;
            
            // 计算加权总分
            if (score !== null && weights) {
              let weight = 0;
              switch (content.evaluationContent) {
                case '视频':
                  weight = weights[0] || 0;
                  break;
                case '音频':
                  weight = weights[1] || 0;
                  break;
                case '演讲稿':
                  weight = weights[2] || 0;
                  break;
                case 'PPT':
                  weight = weights[3] || 0;
                  break;
              }
              
              if (weight > 0) {
                totalScore += score * (weight / 100);
                totalWeight += weight;
              }
            }
          }
        }
      });
      
      // 计算总分
      if (totalWeight > 0) {
        result.total = (totalScore / totalWeight) * 100;
      } else {
        // 如果没有权重，使用简单平均
        const scores = [result.video, result.audio, result.ppt, result.speech].filter(s => s !== null);
        if (scores.length > 0) {
          result.total = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        }
      }
      
      return result;
    },
    
    // 将星星评分（0-5）转换为百分制
    convertStarScoreToPercentage(starScore) {
      if (starScore === null || starScore === undefined || starScore === '-') {
        return null;
      }
      const score = parseFloat(starScore);
      if (isNaN(score)) {
        return null;
      }
      // 如果分数已经在0-100范围内，可能是已经转换过的，直接返回
      if (score >= 0 && score <= 100 && score > 5) {
        return score;
      }
      // 如果是0-5的星星评分，转换为百分制：(分数 / 5) * 100
      // 如果为0星，也视为未评分，返回null
      if (score > 0 && score <= 5) {
        return (score / 5) * 100;
      }
      // 0星或无效值返回null
      return null;
    },
    
    // 获取指定提交类型的评价维度
    getDimensionsForSubmissionType(evaluationDimensions, submissionType) {
      if (!evaluationDimensions || !Array.isArray(evaluationDimensions)) {
        return [];
      }
      
      // evaluationDimensions的结构：每个元素包含evaluationMethods和evaluationTypes
      // 我们需要从所有评价方法中提取该提交类型的维度
      const dimensions = new Set();
      
      for (const evalDim of evaluationDimensions) {
        if (evalDim.evaluationTypes && Array.isArray(evalDim.evaluationTypes)) {
          for (const evalType of evalDim.evaluationTypes) {
            if (evalType.evaluationContent === submissionType && evalType.evaluationTitles) {
              // 提取所有评价维度名称（从evaluationInfos中）
              evalType.evaluationTitles.forEach(title => {
                if (title.evaluationInfos && Array.isArray(title.evaluationInfos)) {
                  title.evaluationInfos.forEach(info => {
                    if (info && typeof info === 'string') {
                      dimensions.add(info);
                    }
                  });
                }
              });
            }
          }
        }
      }
      
      return Array.from(dimensions);
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
.homework-management /deep/ .el-table .el-table__body-wrapper tbody tr.even-row:hover {
  background-color: #e6ebf0;
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

/* 任务要求单元格样式 */
.task-requirements-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  vertical-align: middle;
}

.task-requirements-cell:hover {
  overflow: visible;
  white-space: normal;
  word-break: break-all;
}

/* 学生评价列表样式 */
.student-evaluation-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  padding: 5px 0;
}

.student-evaluation-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  white-space: nowrap;
}

.student-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.no-students-text {
  color: #909399;
  font-size: 14px;
  padding: 10px;
  text-align: center;
}
</style>
