<template>
  <div class="task-detail" v-loading="loading">
    <!-- 左侧菜单栏 -->
    <div class="sidebar">
      <el-menu
        :default-active="currentTaskType"
        class="el-menu-vertical-demo"
        @select="handleMenuClick"
      >
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
        <el-menu-item index="师评">
          <i class="el-icon-s-custom"></i>
          <span>师评任务</span>
        </el-menu-item>
        <el-menu-item index="completed">
          <i class="el-icon-success"></i>
          <span>已完成任务</span>
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 右侧内容 -->
    <div class="content">
      <!-- 统计信息 -->
      <el-card class="stats-card">
        <div class="stats">
          您还有
          <span class="highlight-text">{{ taskCounts.自评 }}</span> 个自评任务，
          <span class="highlight-text">{{ taskCounts.师评 }}</span> 个师评任务，
          <span class="highlight-text">{{ taskCounts.互评 }}</span> 个互评任务待评价~
        </div>
      </el-card>

      <!-- 任务列表 -->
      <div class="task-list">
        <el-card
          v-for="(assignment, index) in filteredAssignments"
          :key="`${assignment.id}-${index}`"
          class="assignment-card"
          shadow="always"
        >
          <!-- 作业信息 -->
          <div class="card-header">
            <div class="task-name" @click="handleClick(assignment.type, assignment)">
              作业名称：<span>{{ assignment.name }}</span>
            </div>
            <el-tag class="task-type" type="primary">{{ assignment.type }}</el-tag>
          </div>

          <div class="submitter">
            提交人姓名：<span>{{ assignment.submitter }}</span>
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
            总分：<span class="total-score">{{ calculateTotalScore(assignment) }}分</span>
          </div>
        </el-card>

        <!-- 无数据提示 -->
        <el-empty
          v-if="!loading && filteredAssignments.length === 0"
          description="暂无数据"
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
} from "@/api/myTask/myEvaluation/index";
import {getAllGradesByTaskId} from '@/api/homeworkManage/index'
export default {
  name: "ReviewTasks",
  data() {
    return {
      assignments: [],
      currentTaskType: "all",
      loading: false,
      cache: new Map(), // 缓存Map
      requestQueue: [], // 请求队列
      maxConcurrent: 3, // 最大并发数
      running: 0, // 当前运行的请求数
      cacheExpireTime: 5 * 60 * 1000, // 缓存过期时间5分钟
      pendingRequests: new Map() // 添加这一行
    };
  },
  computed: {
    ...mapGetters(["userId"]),
    filteredAssignments() {
      if (this.currentTaskType === "all") return this.assignments;
      if (this.currentTaskType === "completed") {
        return this.assignments.filter((assignment) =>
          this.isTaskCompleted(assignment)
        );
      }
      return this.assignments.filter(
        (assignment) => assignment.type === this.currentTaskType
      );
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

        // 3. 批量获取任务信息和学生信息
        const [taskInfos, studentInfo, allGrades] = await Promise.all([
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

        // 5. 组装最终数据
        this.assignments = data.rows.map(item => {
          const taskInfo = taskInfoMap.get(item.taskId);
          const student = studentMap.get(item.studentId);
          const taskGrades = gradesMap.get(item.taskId);
          const studentGrades = taskGrades?.data?.rows?.find(
            g => g.studentId === item.studentId
          );

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
            studentId: item.studentId
          };
        });

      } catch (error) {
        console.error("获取任务失败:", error);
        this.$message.error("获取任务失败");
      } finally {
        this.loading = false;
      }
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
      if (score !== null && score !== undefined) {
        return `已评价 ${type}(${score}分)`;
      }
      return `未评价 ${type}`;
    },

    beforeDestroy() {
      this.cache.clear();
      this.requestQueue = [];
    }
  },
  created() {
    this.fetchAssignments();
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.task-name {
  cursor: pointer; /* 鼠标变为手势 */
  font-weight: bold;
  font-size: 14px;
  color: #303133;
}

.submitter {
  font-size: 12px;
  color: #606266;
  margin-bottom: 40px;
}

.task-type {
  font-size: 12px;
  padding: 3px 8px;
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
  font-size: 13px;
  padding: 6px 12px;
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
  text-align: right;
  font-size: 14px;
}

.card-footer .total-score {
  color: #F56C6C;
  font-weight: bold;
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
}


</style>
