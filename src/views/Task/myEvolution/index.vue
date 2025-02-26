<template>
  <el-card class="main-card" shadow="always">
    <div class="main-container">
      <!-- 左侧菜单栏 -->
      <div class="sidebar">
        <el-menu
          :default-active="currentTaskType"
          class="el-menu-vertical-demo"
          @select="handleMenuClick"
        >
          <el-menu-item index="all">
            <i class="el-icon-document"></i>
            <span slot="title">全部任务</span>
          </el-menu-item>
          <el-menu-item index="自评">
            <i class="el-icon-edit-outline"></i>
            <span slot="title">自评任务</span>
          </el-menu-item>
          <el-menu-item index="互评">
            <i class="el-icon-user"></i>
            <span slot="title">互评任务</span>
          </el-menu-item>
          <el-menu-item index="师评">
            <i class="el-icon-s-custom"></i>
            <span slot="title">师评任务</span>
          </el-menu-item>
          <el-menu-item index="completed">
            <i class="el-icon-success"></i>
            <span slot="title">已完成任务</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 右侧内容卡片区域 -->
      <div class="content">
        <!-- 在el-card上面添加一行加粗的字 -->
        <div class="pending-tasks">
          <strong>
            您还有<span :class="{'taskHighlight': taskHighlight.self}">{{ taskCounts.自评 }}</span>个自评任务，
            <span :class="{'taskHighlight': taskHighlight.teacher}">{{ taskCounts.师评}}</span>个师评任务，
            <span :class="{'taskHighlight': taskHighlight.mutual}">{{ taskCounts.互评 }}</span>个互评任务待评价~
          </strong>
        </div>
        <el-card
          v-for="assignment in filteredAssignments"
          :key="assignment.id"
          class="assignment-card"
          @click="goToDetails(assignment.id)"
          shadow="hover"
        >
          <div class="card-header">
            <div>
              作业名称：<span>{{ assignment.name }}</span>
            </div>
            <div>
              提交人姓名：<span>{{ assignment.submitter }}</span>
            </div>
          </div>
          <div class="card-body">
            <div class="score-section">
              <el-tag
                :type="assignment.videoScore ? 'success' : 'info'"
                @click.stop="handleClick('video', assignment.id)"
              >
                {{ assignment.videoScore ? `已评价 视频分数(${assignment.videoScore})` : '未评价 视频分数' }}
              </el-tag>
              <el-tag
                :type="assignment.audioScore ? 'success' : 'info'"
                @click.stop="handleClick('audio', assignment.id)"
              >
                {{ assignment.audioScore ? `已评价 音频分数(${assignment.audioScore})` : '未评价 音频分数' }}
              </el-tag>
              <el-tag
                :type="assignment.textScore ? 'success' : 'info'"
                @click.stop="handleClick('text', assignment.id)"
              >
                {{ assignment.textScore ? `已评价 演讲稿分数(${assignment.textScore})` : '未评价 演讲稿分数' }}
              </el-tag>
              <el-tag
                :type="assignment.pptScore ? 'success' : 'info'"
                @click.stop="handleClick('ppt', assignment.id)"
              >
                {{ assignment.pptScore ? `已评价 PPT分数(${assignment.pptScore})` : '未评价 PPT分数' }}
              </el-tag>
            </div>
            <div class="task-type">
              <el-tag type="primary">{{ assignment.type }}</el-tag>
            </div>
            <div class="total-score">
              总分：{{ calculateTotalScore(assignment) | round(2) }}分
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </el-card>
</template>

<script>
import { getStuSelfEvolutionAssignments } from "@/api/task/myEvolution"; // 获取作业信息的API
export default {
  data() {
    return {
      assignments: [{
        id: 1,
        name: "英语口语练习",
        submitter: "张三",
        completed: true,
        type: "自评",
        videoScore: 85,
        audioScore: null,
        textScore: 90,
        pptScore: 88
      },
        {
          id: 2,
          name: "数学作业讲解",
          submitter: "李四",
          completed: false,
          type: "互评",
          videoScore: null,
          audioScore: 75,
          textScore: null,
          pptScore: 82
        },
        {
          id: 3,
          name: "化学实验报告",
          submitter: "王五",
          completed: true,
          type: "师评",
          videoScore: 92,
          audioScore: 85,
          textScore: 88,
          pptScore: 95
        }], // 作业列表，从后端获取
      currentTaskType: 'all',// 当前选择的任务类型，默认是全部任务
      pendingReviews: {
        self: 0,
        teacher: 0,
        mutual: 0
      }
    };
  },
  filters: {
    round(value) {
      return Number(value).toFixed(2);
    }
    },
  computed: {
    // 根据当前任务类型过滤作业列表
    filteredAssignments() {
      if (this.currentTaskType === 'all') {
        return this.assignments;
      } else if (this.currentTaskType === 'completed') {
        // 过滤已完成任务
        return this.assignments.filter(assignment => assignment.completed);
      } else {
        // 过滤自评、互评、师评任务
        return this.assignments.filter(
          assignment => assignment.type === this.currentTaskType
        );
      }
    },
    taskCounts() {
      // 遍历任务列表，统计每种类型未评价的任务数量
      let counts = { 自评: 0, 师评: 0, 互评: 0 };
      this.assignments.forEach(assignment => {
        if (!assignment.videoScore || !assignment.audioScore || !assignment.textScore || !assignment.pptScore) {
          counts[assignment.type] += 1;
        }
      });
      return counts;
    },
    taskHighlight() {
      return {
        self: this.taskCounts.自评 > 0,
        teacher: this.taskCounts.师评 > 0,
        mutual: this.taskCounts.互评 > 0
      };
    }
  },
  created() {
    // this.fetchAssignments();
  },
  methods: {
    // fetchAssignments() {
    //   // 获取作业数据
    //   getStuSelfEvolutionAssignments().then((response) => {
    //     this.assignments = response.data;
    //   });
    // },
    handleMenuClick(taskType) {
      // 切换任务类型
      this.currentTaskType = taskType;
    },
    // 计算总分的方法
    calculateTotalScore(assignment) {
      const scores = [assignment.videoScore, assignment.audioScore, assignment.textScore, assignment.pptScore];
      const total = scores.reduce((acc, score) => acc + (score || 0), 0); // 将未打分的按0分计算
      return (total / scores.length) || 0; // 计算平均分
    },
    handleClick(type, id) {
      // 阻止事件冒泡并处理点击事件
      this.$router.push(`/task/score/${type}/${id}`);
    },
    goToDetails(id) {
      // 跳转到作业详情页面
      this.$router.push(`/task/myHomework-detail/index/${id}`);
    }
  }
};
</script>

<style scoped>
.main-container {
  display: flex;
}
.main-card{
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1); /* 添加阴影 */
  border-radius: 8px; /* 圆角 */
}
.sidebar {
  width: 200px;
  margin-right: 20px;
}

.content {
  flex: 1;
}
.pending-tasks {
  margin-bottom: 20px;
  font-weight: bold;
}
.taskHighlight{
  color: red;
}
.assignment-card {
  position: relative;
  margin-bottom: 20px;
  transition: border-color 0.3s ease;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1); /* 添加阴影 */
  border-radius: 8px; /* 圆角 */
}

.assignment-card:hover {
  border-color: #409eff; /* 鼠标悬停时边框变蓝 */
}

.card-header {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
}
.card-header > div:first-child {
  margin-bottom: 20px; /* 增加第一个div（作业名称）的底部外边距 */
}

.card-header > div:last-child {
  margin-top: 20px; /* 增加最后一个div（提交人姓名）的顶部外边距 */
  margin-bottom: 30px;
}
.card-header span {
  font-weight: normal; /* 提交人信息的具体内容不加粗 */

}

.card-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.score-section {
  display: flex;
  gap: 10px;
}

.task-type {
  position: absolute;
  top: 10px; /* 根据需要调整 */
  right: 10px; /* 根据需要调整 */
  font-size: 14px;
  color: #999;
}
.total-score {
  position: absolute;
  top: 45px; /* 根据需要调整 */
  right: 10px; /* 根据需要调整 */
  font-size: 13px; /* 根据需要调整 */
  color: #2b2bea; /* 根据需要调整 */
  font-weight: bold;
}
</style>
