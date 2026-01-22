<template>
  <div class="task-detail" v-loading="loading">
    <!-- 提醒对话框 -->
    <el-dialog
      title="温馨提示"
      :visible.sync="showReminderDialog"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="reminder-content">
        <div style="line-height: 1.8; color: #ff4444; font-size: 14px;">
          <p style="margin: 8px 0;">1. 学生提交完相关材料后，方可显示；</p>
          <p style="margin: 8px 0;">2. 可以搜索查看学生作业；</p>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-checkbox v-model="dontShowAgain">不再提醒</el-checkbox>
        <el-button type="primary" @click="handleReminderConfirm">我知道了</el-button>
      </div>
    </el-dialog>

    <!-- 左侧菜单栏 -->
    <div class="sidebar">
      <el-menu
        :default-active="currentTaskType"
        class="el-menu-vertical-demo"
        @select="handleMenuClick"
      >
        <!-- 学生端菜单 -->
        <template v-if="!isTeacher">
          <el-menu-item index="all">
            <i class="el-icon-document"></i>
            <span>全部任务</span>
          </el-menu-item>
          <el-menu-item index="自评">
            <i class="el-icon-edit-outline"></i>
            <span>自评任务</span>
          </el-menu-item>
          <el-menu-item index="互评">
            <i class="el-icon-user"></i>
            <span>互评任务</span>
          </el-menu-item>
          <el-menu-item index="completed">
            <i class="el-icon-success"></i>
            <span>已完成任务</span>
          </el-menu-item>
        </template>
        
        <!-- 教师端菜单 -->
        <template v-else>
          <el-menu-item index="师评">
            <i class="el-icon-s-custom"></i>
            <span>师评任务</span>
          </el-menu-item>
          <el-menu-item index="incomplete">
            <i class="el-icon-warning"></i>
            <span>未完成任务</span>
          </el-menu-item>
          <el-menu-item index="completed">
            <i class="el-icon-success"></i>
            <span>已完成任务</span>
          </el-menu-item>
        </template>
      </el-menu>
    </div>

    <!-- 右侧内容 -->
    <div class="content">
      <!-- 统计信息 -->
      <el-card class="stats-card">
        <div class="stats">
          <!-- 学生端统计 -->
          <template v-if="!isTeacher">
            您还有
            <span class="highlight-text">{{ taskCounts.自评 }}</span> 个自评任务，
            <span class="highlight-text">{{ taskCounts.互评 }}</span> 个互评任务待评价~
          </template>
          <!-- 教师端统计 -->
          <template v-else>
            您还有
            <span class="highlight-text">{{ taskCounts.师评 }}</span> 个师评任务待评价~
          </template>
        </div>
      </el-card>

      <!-- 搜索框 -->
      <el-card class="search-card">
        <el-input
          v-model="searchName"
          placeholder="请输入学生姓名进行搜索"
          prefix-icon="el-icon-search"
          clearable
          style="width: 300px;"
          @input="handleSearch"
        />
      </el-card>

      <!-- 任务列表 -->
      <div class="task-list">
        <el-card
          v-for="(assignment, index) in filteredAssignments"
          :key="`${assignment.id}-${index}`"
          class="assignment-card"
          shadow="always"
        >
          <div class="card-content-wrapper">
            <!-- 左侧内容区域 -->
            <div class="card-left">
          <!-- 作业信息 -->
          <div class="card-header">
                <div class="task-name">
              作业名称：<span>{{ assignment.name }}</span>
            </div>
            <el-tag class="task-type" type="primary">{{ assignment.type }}</el-tag>
          </div>

          <div class="submitter">
            提交人姓名：<span>{{ assignment.submitter }}</span>
          </div>

          <div class="task-info-grid" v-if="assignment.createTime">
            <div>
              <p>创建时间：{{ formatCreateTime(assignment.createTime) }}</p>
            </div>
          </div>

          <div class="card-body">
            <div class="score-section">
              <el-tag
                v-for="type in ['视频', '音频', '演讲稿', 'PPT']"
                :key="type"
                :class="[
        'custom-tag',
        evaluationStatus(assignment, type).isCompleted ? 'is-completed' : 'not-completed'
      ]"
              >
                {{ formatScoreTag(type, evaluationStatus(assignment, type).score) }}
              </el-tag>
            </div>
          </div>

          <!-- 总分 -->
          <div class="card-footer">
                <div class="score-info">
            总分：<span class="total-score">{{ calculateTotalScore(assignment) }}分</span>
                </div>
              </div>
            </div>

            <!-- 右侧评价按钮 -->
            <div class="card-right">
              <el-button
                type="primary"
                icon="el-icon-edit"
                @click="handleClick(assignment.type, assignment)"
                :class="{
                  'evaluate-btn': true,
                  'completed-btn': isTaskCompleted(assignment)
                }"
                size="medium"
              >
                {{ isTaskCompleted(assignment) ? '查看评价' : '开始评价' }}
              </el-button>
            </div>
          </div>
        </el-card>

        <!-- 无数据提示 -->
        <el-empty
          v-if="!loading && filteredAssignments.length === 0"
          :description="searchName ? '未找到匹配的作业' : '暂无数据'"
        ></el-empty>
      </div>
    </div>
  </div>
</template>


<script>
import { mapGetters } from "vuex";
import {
  getReviewTaskByStuId,
  getTaskInfoById,
  getStuByIds,
  getEvaluationByTaskIdAndStuId,
  getSubmissionByTaskIdAndStudentId,
} from "@/api/myTask/myEvaluation/index";
import {getAllGradesByTaskId} from '@/api/homeworkManage/index'
export default {
  name: "ReviewTasks",
  data() {
    return {
      assignments: [],
      currentTaskType: "all", // 将在mounted中根据角色设置
      loading: false,
      cache: new Map(), // 缓存Map
      requestQueue: [], // 请求队列
      maxConcurrent: 3, // 最大并发数
      running: 0, // 当前运行的请求数
      cacheExpireTime: 5 * 60 * 1000, // 缓存过期时间5分钟
      pendingRequests: new Map(), // 添加这一行
      searchName: "", // 搜索姓名
      showReminderDialog: false, // 控制提醒对话框显示
      dontShowAgain: false // 不再提醒复选框
    };
  },
  computed: {
    ...mapGetters(["userId", "roles"]),
    // 判断是否是教师
    isTeacher() {
      return this.roles && this.roles.includes('admin');
    },
    filteredAssignments() {
      let filtered = this.assignments;
      
      // 按任务类型过滤
      if (this.currentTaskType === "all") {
        filtered = this.assignments;
      } else if (this.currentTaskType === "completed") {
        filtered = this.assignments.filter((assignment) =>
          this.isTaskCompleted(assignment)
        );
      } else if (this.currentTaskType === "incomplete") {
        // 未完成任务：显示未完成师评的任务
        filtered = this.assignments.filter((assignment) =>
          !this.isTaskCompleted(assignment) && assignment.type === '师评'
        );
      } else {
        filtered = this.assignments.filter(
        (assignment) => assignment.type === this.currentTaskType
      );
      }
      
      // 按学生姓名搜索过滤
      if (this.searchName && this.searchName.trim()) {
        const searchKeyword = this.searchName.trim().toLowerCase();
        filtered = filtered.filter((assignment) => {
          const submitterName = (assignment.submitter || "").toLowerCase();
          return submitterName.includes(searchKeyword);
        });
      }
      
      return filtered;
    },
    taskCounts() {
      const counts = { 自评: 0, 师评: 0, 互评: 0 };
      this.assignments.forEach((assignment) => {
        if (!this.isTaskCompleted(assignment)) {
          counts[assignment.type] += 1;
        }
      });
      return counts;
    },
    evaluationStatus() {
      return (assignment, type) => {
        if (!assignment || !assignment.reviews) {
          return {
            isCompleted: false,
            score: null,
            hasScore: false
          };
        }

        const score = assignment[`${type}Score`];
        // 使用 reviewContent 而不是 type 来匹配
        const review = assignment.reviews.find(r => r.reviewContent === type);

        return {
          isCompleted: review?.finished || false,
          score: score,
          hasScore: score !== null && score !== undefined
        };
      };
    }

  },
  methods: {
    // 优化的缓存处理


    getCache(key) {
      const cached = this.cache.get(key);
      if (!cached) return null;

      if (Date.now() > cached.expireTime) {
        this.cache.delete(key);
        return null;
      }

      return cached.data;
    },

    setCache(key, value) {
      this.cache.set(key, {
        data: value,
        expireTime: Date.now() + this.cacheExpireTime
      });
    },

    // 优化的队列系统
    async enqueue(task, key) {
      // 如果已经有相同的请求在进行中，直接返回该请求的Promise
      if (this.pendingRequests.has(key)) {
        return this.pendingRequests.get(key);
      }

      const promise = new Promise((resolve, reject) => {
        const queueTask = async () => {
          try {
            this.running++;
            const result = await task();
            resolve(result);
            return result;
          } catch (error) {
            reject(error);
            throw error;
          } finally {
            this.running--;
            this.pendingRequests.delete(key);
            this.processQueue();
          }
        };

        if (this.running < this.maxConcurrent) {
          queueTask();
        } else {
          this.requestQueue.push(queueTask);
        }
      });

      // 存储进行中的请求
      this.pendingRequests.set(key, promise);
      return promise;
    },

    processQueue() {
      while (this.requestQueue.length > 0 && this.running < this.maxConcurrent) {
        const nextTask = this.requestQueue.shift();
        nextTask();
      }
    },


    async fetchAssignments() {
      if (this.loading) return; // 防止重复调用
      this.loading = true;
      try {
        // 1. 获取评审任务列表
        const { data } = await getReviewTaskByStuId(this.userId);
        if (!data?.rows?.length) return;

        // 2. 提取唯一的taskId和studentId
        const uniqueTaskIds = new Set();
        const uniqueStudentIds = new Set();

        data.rows.forEach(item => {
          uniqueTaskIds.add(item.taskId);
          uniqueStudentIds.add(item.studentId);
        });

        // 3. 批量获取任务信息、学生信息、成绩和学生提交信息
        const [taskInfos, studentInfo, allGrades, allSubmissions] = await Promise.all([
          // 获取任务信息
          Promise.all(
            Array.from(uniqueTaskIds).map(async taskId => {
              const cacheKey = `task_${taskId}`;
              const cached = this.getCache(cacheKey);
              if (cached) return cached;

              const result = await getTaskInfoById(taskId);
              if (result) this.setCache(cacheKey, result);
              return result;
            })
          ),
          // 获取学生信息
          getStuByIds({
            stuIds: Array.from(uniqueStudentIds),
            page: 1,
            pageSize: uniqueStudentIds.size
          }),
          // 获取所有成绩
          Promise.all(
            Array.from(uniqueTaskIds).map(async taskId => {
              const cacheKey = `grades_${taskId}`;
              const cached = this.getCache(cacheKey);
              if (cached) return cached;

              const result = await getAllGradesByTaskId(taskId, 1, 999);
              if (result) this.setCache(cacheKey, result);
              return { taskId, grades: result };
            })
          ),
          // 批量获取学生提交信息
          Promise.all(
            data.rows.map(async item => {
              const cacheKey = `submission_${item.taskId}_${item.studentId}`;
              const cached = this.getCache(cacheKey);
              if (cached) return cached;

              try {
                const result = await getSubmissionByTaskIdAndStudentId(item.taskId, item.studentId);
                if (result) this.setCache(cacheKey, result);
                return { taskId: item.taskId, studentId: item.studentId, submission: result };
              } catch (error) {
                console.warn(`获取提交信息失败 taskId: ${item.taskId}, studentId: ${item.studentId}`, error);
                return { taskId: item.taskId, studentId: item.studentId, submission: null };
              }
            })
          )
        ]);

        // 4. 建立查找映射
        const taskInfoMap = new Map(
          taskInfos.map(info => [info.data.id, info.data])
        );
        const gradesMap = new Map(
          allGrades.map(({ taskId, grades }) => [taskId, grades])
        );
        const studentMap = new Map(
          studentInfo.data.rows.map(student => [student.userId, student])
        );
        const submissionMap = new Map(
          allSubmissions.map(({ taskId, studentId, submission }) => [
            `${taskId}_${studentId}`,
            submission?.data || submission
          ])
        );

        // 5. 组装最终数据，并过滤未完成提交的任务
        this.assignments = data.rows
          .map(item => {
          const taskInfo = taskInfoMap.get(item.taskId);
          const student = studentMap.get(item.studentId);
          const taskGrades = gradesMap.get(item.taskId);
          const studentGrades = taskGrades?.data?.rows?.find(
            g => g.studentId === item.studentId
          );
            const studentSubmission = submissionMap.get(`${item.taskId}_${item.studentId}`);

          const scores = this.extractScores(studentGrades, item.reviewType);

          return {
            id: item.id,
            taskId: item.taskId,
            name: taskInfo?.taskName || '',
            submitter: student?.nickName || '',
            type: item.reviewType,
            weights: taskInfo?.weights || [],
            ...scores,
            reviews: item.reviews,
            reviewerId: item.reviewerId,
            studentId: item.studentId,
              createTime: taskInfo?.createTime || null,  // 添加创建时间用于排序
              taskInfo: taskInfo,  // 保存任务信息用于检查提交完整性
              studentSubmission: studentSubmission  // 保存学生提交信息用于检查提交完整性
          };
          })
          .filter(assignment => {
            // 只有当所有要求的提交内容都已完成时，才显示在列表中
            return this.checkSubmissionComplete(assignment.taskInfo, assignment.studentSubmission);
        });

        // 6. 按创建时间倒序排列（最新的在最上面）
        this.assignments.sort((a, b) => {
          if (!a.createTime || !b.createTime) return 0;
          return new Date(b.createTime) - new Date(a.createTime);
        });

      } catch (error) {
        console.error("获取任务失败:", error);
        this.$message.error("获取任务失败");
      } finally {
        this.loading = false;
      }
    },

    // 检查学生是否已完成所有要求的提交内容
    checkSubmissionComplete(taskInfo, studentSubmission) {
      // 如果没有任务信息或学生提交信息，不显示
      if (!taskInfo?.submissionTypes || !studentSubmission?.taskInfos) {
        return false;
      }
      
      // 获取任务要求的提交类型（如：["PPT", "演讲稿"]）
      const requiredTypes = taskInfo.submissionTypes || [];
      
      // 如果没有要求提交内容，则显示（兼容旧数据）
      if (requiredTypes.length === 0) {
        return true;
      }
      
      // 获取学生已提交并完成的类型
      const submittedTypes = studentSubmission.taskInfos
        .filter(info => info.finished === true)
        .map(info => info.submissionType);
      
      // 检查所有要求的类型是否都已提交完成
      const allCompleted = requiredTypes.every(type => submittedTypes.includes(type));
      
      return allCompleted;
    },

    extractScores(grade, reviewType) {  // 添加reviewType参数
      const scores = {
        视频Score: null,
        音频Score: null,
        演讲稿Score: null,
        PPTScore: null,
      };

      if (!grade?.evaluationTypes) return scores;

      // 找到对应评价类型的评分
      const targetEvaluation = grade.evaluationTypes.find(
        type => type.evaluationMethod === reviewType
      );

      if (!targetEvaluation) return scores;

      // 只处理对应评价类型的分数
      targetEvaluation.evaluationContents.forEach(content => {
        if (content.finished && content.grade !== null) {
          scores[`${content.evaluationContent}Score`] = content.grade;
        }
      });

      return scores;
    },

    calculateTotalScore(assignment) {
      let totalScore = 0;
      let totalWeight = 0;

      ["视频", "音频", "演讲稿", "PPT"].forEach((type, index) => {
        const score = assignment[`${type}Score`];
        if (score !== null && score !== undefined) {
          const weight = assignment.weights[index] || 25; // 如果没有权重默认25%
          totalScore += score * (weight / 100);
          totalWeight += weight / 100;
        }
      });

      return totalWeight > 0
        ? Number((totalScore / totalWeight).toFixed(2))
        : "0.00";
    },
    isTaskCompleted(assignment) {
      return assignment.reviews.every((review) => review.finished);
    },

    handleMenuClick(taskType) {
      this.currentTaskType = taskType;
    },
    handleClick(taskType, task) {
      console.log('Task Clicked:', taskType, task);
      let targetPath = '';
      switch (taskType) {
        case '自评':
          targetPath = '/myEvaluation/selfReview'; // 自评页面路径
          break;
        case '互评':
          targetPath = '/myEvaluation/mutualReview'; // 互评页面路径
          break;
        case '师评':
          targetPath = '/myEvaluation/teacherReview'; // 师评页面路径
          break;
        default:
          targetPath = '/myEvaluation/index';
      }
      console.log('Redirecting to:', targetPath);
      console.log('Task Object:', task);
      this.$router.push({
        path: targetPath,
        query: {
          taskId: task.taskId,
          homeworkTitle: task.name,
          submitter: task.submitter,
          currentProcess: task.type,
          reviewerId: task.reviewerId, // 传递 reviewerId
          studentId: task.studentId, // 传递 studentId
        },
      });
    },
    getScoreTagType(finished) {
      return finished ? "success" : "info";
    },

    // 格式化显示内容
    formatScoreTag(type, score) {
      // 将"演讲稿"显示为"文稿"
      const displayType = type === '演讲稿' ? '文稿' : type;
      if (score !== null && score !== undefined) {
        return `已评价 ${displayType}(${score}分)`;
      }
      return `未评价 ${displayType}`;
    },
    // 格式化创建时间
    formatCreateTime(createTime) {
      if (!createTime) return '';
      const date = new Date(createTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    // 处理搜索
    handleSearch() {
      // 搜索逻辑已在 filteredAssignments 计算属性中实现
      // 这里可以添加其他搜索相关的逻辑，如防抖等
    },

    // 检查提醒状态
    checkReminderStatus() {
      // 使用用户ID区分不同用户的提醒状态
      const reminderKey = `evaluationReminderDontShow_${this.userId}`;
      const dontShow = localStorage.getItem(reminderKey);
      if (!dontShow || dontShow !== 'true') {
        this.showReminderDialog = true;
      }
    },

    // 处理提醒确认
    handleReminderConfirm() {
      if (this.dontShowAgain) {
        // 使用用户ID区分不同用户的提醒状态
        const reminderKey = `evaluationReminderDontShow_${this.userId}`;
        localStorage.setItem(reminderKey, 'true');
      }
      this.showReminderDialog = false;
    }
  },
  created() {
    this.fetchAssignments();
  },
  mounted() {
    // 根据角色设置默认选中的菜单项
    if (this.isTeacher) {
      this.currentTaskType = '师评';
    } else {
      this.currentTaskType = 'all';
    }
    // 检查是否需要显示提醒
    this.checkReminderStatus();
  },
  beforeDestroy() {
    this.cache.clear();
    this.requestQueue = [];
    this.pendingRequests.clear();
  },

// 添加路由守卫，防止重复加载
  beforeRouteUpdate(to, from, next) {
    // 只有在确实需要重新加载数据时才调用
    if (to.query.reload || to.params.reload) {
      this.fetchAssignments();
    }
    next();
  },
};
</script>


<style>
.task-detail {
  display: flex;
  height: 100%;
  background-color: #f9f9f9;
  padding: 20px;
}

.sidebar {
  width: 200px;
  border-right: 1px solid #ebedf0;
  padding: 10px 0;
}

.sidebar .el-menu {
  border-right: none;
}

.content {
  flex: 1;
  padding-left: 20px;
}

.stats-card {
  margin-bottom: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  padding: 10px;
}

.search-card {
  margin-bottom: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  padding: 15px;
}

.stats {
  font-size: 14px;
  font-weight: bold;
  color: #606266;
}

.highlight-text {
  color: #f56c6c;
  font-weight: bold;
}

.task-list {
  display: flex;
  flex-direction: column; /* 垂直排列任务卡片 */
  gap: 20px; /* 增加卡片间距 */
}

.assignment-card {
  padding: 15px;
  border-radius: 8px;
  background-color: #ffffff;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
  width: 100%; /* 保证卡片占满容器宽度 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

}
.assignment-card:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
  pointer-events: all;
}

.card-content-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.card-left {
  flex: 1;
  min-width: 0;
}

.card-right {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding-left: 20px;
  border-left: 1px solid #f0f0f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.task-name {
  font-weight: bold;
  font-size: 18px;
  color: #303133;
}

.submitter {
  font-size: 16px;
  margin-bottom: 10px;
  color: #606266;
}

.task-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
}

.task-info-grid p {
  font-size: 14px;
  margin: 0;
  color: #606266;
  margin-bottom: 40px;
}

.task-type {
  font-size: 14px;
  padding: 5px 12px;
}

.card-body {
  margin-bottom: 10px;
}

.score-section {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
}
.score-section {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
}

/* 基础标签样式 */
.score-section .custom-tag {
  font-size: 15px;
  padding: 8px 16px;
  border: 0 !important;
  border-radius: 4px;
  font-weight: 500;
}

/* 已评价状态 */
.score-section .custom-tag.is-completed {
  background-color: rgba(82, 196, 26, 0.15) !important;
  color: #52c41a !important;
}

/* 未评价状态 */
.score-section  .custom-tag.not-completed {
  background-color: rgba(144, 147, 153, 0.1) !important;
  color: grey !important;
}

/* 总分样式 */
.card-footer {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.score-info {
  font-size: 16px;
  font-weight: 500;
}

.score-info .total-score {
  color: #F56C6C;
  font-weight: bold;
  font-size: 18px;
}

/* 评价按钮样式 */
.evaluate-btn {
  min-width: 150px;
  height: 52px;
  font-size: 17px;
  font-weight: 600;
  white-space: nowrap;
  padding: 14px 28px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

.evaluate-btn i {
  font-size: 18px;
  margin-right: 6px;
}

.evaluate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.5);
}

.evaluate-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.evaluate-btn.completed-btn {
  background-color: #67c23a;
  border-color: #67c23a;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

.evaluate-btn.completed-btn:hover {
  background-color: #85ce61;
  border-color: #85ce61;
  box-shadow: 0 6px 20px rgba(103, 194, 58, 0.5);
}

.evaluate-btn.completed-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3);
}
/* 响应式设计 */
@media screen and (max-width: 768px) {
  .task-detail {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #ebedf0;
  }

  .content {
    padding-left: 0;
  }

  .card-content-wrapper {
    flex-direction: column;
  }

  .card-right {
    border-left: none;
    border-top: 1px solid #f0f0f0;
    padding-left: 0;
    padding-top: 15px;
    margin-top: 15px;
    width: 100%;
  }

  .evaluate-btn {
    width: 100%;
  }
}

/* 提醒对话框样式 */
.reminder-content {
  padding: 10px 0;
}

.reminder-content /deep/ .el-alert__content {
  padding-left: 0;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

</style>
