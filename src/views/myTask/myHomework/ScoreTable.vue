<template>
  <el-card class="score-card" shadow="hover">
    <div slot="header" class="card-header">
      <h4 class="card-title">我的成绩</h4>
      <div class="header-right">
        <div v-if="isGrading" class="grading-status">
          <i class="el-icon-loading"></i>
          <span>评分中...</span>
        </div>
        <el-button
          type="text"
          :loading="loading"
          @click="manualRefresh"
          icon="el-icon-refresh">
          刷新成绩
        </el-button>
      </div>
      <div class="score-legend" v-if="showLegend">
        <div class="legend-item">
          <span class="dot excellent"></span>
          <span>优秀 (≥90)</span>
        </div>
        <div class="legend-item">
          <span class="dot good"></span>
          <span>良好 (≥80)</span>
        </div>
        <div class="legend-item">
          <span class="dot pass"></span>
          <span>及格 (≥60)</span>
        </div>
        <div class="legend-item">
          <span class="dot fail"></span>
          <span>不及格 (<60)</span>
        </div>
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="scoreData"
      :header-cell-style="headerStyle"
      :row-style="rowStyle"
      :cell-style="cellStyle"
      :border="false"
    >
      <!-- 作业类型列 -->
      <el-table-column prop="type" label="作业类型" align="center" width="120">
        <template slot-scope="scope">
    <span
      :class="{
        'clickable-type': (scope.row.video !== null && scope.row.video !== '-') ||
                         (scope.row.audio !== null && scope.row.audio !== '-') ||
                         (scope.row.ppt !== null && scope.row.ppt !== '-') ||
                         (scope.row.speech !== null && scope.row.speech !== '-'),
        'disabled-type': !((scope.row.video !== null && scope.row.video !== '-') ||
                          (scope.row.audio !== null && scope.row.audio !== '-') ||
                          (scope.row.ppt !== null && scope.row.ppt !== '-') ||
                          (scope.row.speech !== null && scope.row.speech !== '-'))
      }"
      @click="handleTypeClick(scope.row.type, scope.row.total)"
    >
      {{ scope.row.type }}
    </span>
        </template>
      </el-table-column>

      <!-- 视频成绩列 -->
      <el-table-column
        prop="video"
        label="视频"
        align="center"
      >
        <template slot-scope="scope">
          <span class="score-text">{{ formatScore(scope.row.video) }}</span>
        </template>
      </el-table-column>

      <!-- 音频成绩列 -->
      <el-table-column
        prop="audio"
        label="音频"
        align="center"
      >
        <template slot-scope="scope">
          <span class="score-text">{{ formatScore(scope.row.audio) }}</span>
        </template>
      </el-table-column>

      <!-- PPT成绩列 -->
      <el-table-column
        prop="ppt"
        label="PPT"
        align="center"
      >
        <template slot-scope="scope">
          <span class="score-text">{{ formatScore(scope.row.ppt) }}</span>
        </template>
      </el-table-column>

      <!-- 演讲稿成绩列 -->
      <el-table-column
        prop="speech"
        label="文稿"
        align="center"
      >
        <template slot-scope="scope">
          <span class="score-text">{{ formatScore(scope.row.speech) }}</span>
        </template>
      </el-table-column>

      <!-- 总分列 -->
      <el-table-column
        prop="total"
        label="总分"
        align="center"
        width="100"
      >
        <template slot-scope="scope">
          <span :class="['total-score', getScoreClass(scope.row.total)]">
            {{ formatScore(scope.row.total) }}
          </span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 评分中提示信息 -->
    <div v-if="isGrading" class="grading-tip">
      <i class="el-icon-info"></i>
      {{ gradingMessage }}
    </div>
  </el-card>
</template>

<script>
import { mapGetters } from 'vuex';
import { getEvaluationByTaskIdAndStuId } from '@/api/myTask/myHomework/index';

export default {
  name: 'ScoreTable',
  props: {
    taskId: {
      type: String,
      required: true
    },
    submitId: {
      type: String,
      required: true
    },
    submissionStatus: {
      type: String,
      default: 'none',
      validator: value => ['none', 'submitted', 'completed'].includes(value)
    },
    taskDetails: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      scoreData: [],
      loading: false,
      pollTimer: null,
      pollCount: 0,
      maxPollCount: 5,
      baseInterval: 5000,
      showLegend: true,
      headerStyle: {
        background: '#f5f7fa',
        color: '#606266',
        fontWeight: '600',
        borderBottom: '2px solid #EBEEF5'
      },

    };
  },
  computed: {
    ...mapGetters(['userId']),
    isGrading() {
      return this.submissionStatus === 'submitted' &&
        !this.hasGrades &&
        this.pollCount < this.maxPollCount;
    },
    hasGrades() {
      return this.scoreData.some(row =>
        row.total !== null && row.total !== '-'
      );
    },

    gradingMessage() {
      if (this.pollCount >= this.maxPollCount) {
        return '评分可能需要较长时间，请稍后手动刷新查看';
      }
      return '系统正在评分中，请稍候...';
    }
  },
  watch: {
    submissionStatus: {
      handler(newStatus) {
        if (newStatus === 'submitted') {
          this.startGradingCheck();
        }
      },
      immediate: true
    }
  },
  mounted() {

  },
  methods: {

    formatScore(score) {
      // 判断score是否为有效数字
      if (score === null || score === undefined || score === '') {
        return '-';
      }
      // 确保score是数字
      const numScore = Number(score);
      if (isNaN(numScore)) {
        return '-';
      }
      return numScore.toFixed(2);
    },
    getScoreClass(score) {
      if (score === null) return 'score-empty';
      if (score >= 90) return 'excellent';
      if (score >= 80) return 'good';
      if (score >= 60) return 'pass';
      return 'fail';
    },

    rowStyle({rowIndex}) {
      return {
        backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#fafafa',
        borderBottom: 'none'
      };
    },

    cellStyle() {
      return {
        borderBottom: 'none',
        padding: '12px 0'
      };
    },

    async manualRefresh() {
      this.loading = true;
      await this.fetchScores();
      this.loading = false;
    },

    startGradingCheck() {
      this.pollCount = 0;
      this.schedulePoll();
    },

    schedulePoll() {
      if (this.pollTimer) {
        clearTimeout(this.pollTimer);
      }

      const interval = this.baseInterval * Math.pow(1.5, this.pollCount);

      if (this.pollCount < this.maxPollCount) {
        this.pollTimer = setTimeout(() => {
          this.checkGradingStatus();
        }, interval);
      }
    },

    async checkGradingStatus() {
      try {
        const response = await this.fetchScores();
        if (response?.data) {  // 添加可选链
          const hasNewGrades = this.checkForNewGrades(response.data);
          if (hasNewGrades) {
            this.$emit('grading-completed');
            if (this.pollTimer) {
              clearTimeout(this.pollTimer);
            }
          } else {
            this.pollCount++;
            if (this.pollCount < this.maxPollCount) {
              this.schedulePoll();
            }
          }
        } else {
          // 如果获取失败，也需要尝试下一次轮询
          this.pollCount++;
          if (this.pollCount < this.maxPollCount) {
            this.schedulePoll();
          }
        }
      } catch (error) {
        console.error('检查评分状态失败:', error);
        // 出错也继续轮询
        this.pollCount++;
        if (this.pollCount < this.maxPollCount) {
          this.schedulePoll();
        }
      }},

    checkForNewGrades(data) {
      const hasGrades = data.evaluationTypes.some(type =>
        type.evaluationContents.some(content =>
          content.finished && content.grade !== null && content.grade !== '-'  // 添加'-'的判断
        )
      );
      return hasGrades;
    },

    processEvaluationData(data) {
      const mapAudioScore = (score) => {
        if (score === null || score === undefined) return null;
        // 后端返回的音频分数已经是0-100分制，直接使用，确保为整数且在0-100之间
        return Math.min(Math.max(Math.round(Number(score)), 0), 100);
      };

      // 使用默认权重，与作业管理保持一致
      const weights = this.taskDetails?.weights || [25, 25, 25, 25];

      return data.evaluationTypes.map(type => {
        const row = {
          type: type.evaluationMethod,
          video: null,
          audio: null,
          ppt: null,
          speech: null,
          total: null
        };

        let totalScore = 0;
        let totalWeight = 0;

        type.evaluationContents.forEach(content => {
          // 只处理已完成的评估内容
          if (content.finished) {
            let score = content.grade;
            let weight = 0;

            switch (content.evaluationContent) {
              case '视频':
                row.video = score;
                weight = weights[0] || 0;
                if (score !== null && score !== undefined && score !== '-') {
                  totalScore += Number(score) * weight;
                  totalWeight += weight;
                }
                break;
              case '音频':
                score = mapAudioScore(score);
                row.audio = score;
                weight = weights[1] || 0;
                if (score !== null && score !== undefined && score !== '-') {
                  totalScore += Number(score) * weight;
                  totalWeight += weight;
                }
                break;
              case 'PPT':
                row.ppt = content.grade;
                score = content.grade; // 确保使用正确的分数
                weight = weights[2] || 0;
                if (score !== null && score !== undefined && score !== '-') {
                  totalScore += Number(score) * weight;
                  totalWeight += weight;
                }
                break;
              case '演讲稿':
                row.speech = content.grade;
                score = content.grade; // 确保使用正确的分数
                weight = weights[3] || 0;
                if (score !== null && score !== undefined && score !== '-') {
                  totalScore += Number(score) * weight;
                  totalWeight += weight;
                }
                break;
            }
          }
        });

        // 计算总分：只要有任何已完成的评估内容，就计算总分
        // 不需要等待所有文件都评估完成，只基于实际已评估的文件计算
        if (totalWeight > 0) {
          row.total = (totalScore / totalWeight).toFixed(2);
        } else {
          // 如果没有已完成的评估内容，总分显示为 null
          row.total = null;
        }

        return row;
      });
    },

    async fetchScores() {
      try {
        const response = await getEvaluationByTaskIdAndStuId(this.taskId, this.userId);
        if (response.code === 1) {
          this.scoreData = this.processEvaluationData(response.data);
          return response;
        } else {
          this.$message.error(response.msg || '获取成绩失败');
        }
      } catch (error) {
        console.error('获取成绩失败:', error);
        this.$message.error('获取成绩失败，请稍后重试');
        return null;
      }
    },
    handleTypeClick(type, total) {
      const routeMap = {
        '自评': 'showSelfReview',
        '机评': 'showmachineEvaluation',
        '互评': 'showMutualReview',
        '师评': 'showTeacherReview'
      };

      const routeName = routeMap[type];
      if (routeName) {
        // 检查该评估类型是否有已完成的评估内容
        const evaluationRow = this.scoreData.find(row => row.type === type);
        const hasFinishedContent = evaluationRow && (
          (evaluationRow.video !== null && evaluationRow.video !== '-') ||
          (evaluationRow.audio !== null && evaluationRow.audio !== '-') ||
          (evaluationRow.ppt !== null && evaluationRow.ppt !== '-') ||
          (evaluationRow.speech !== null && evaluationRow.speech !== '-')
        );

        // 如果有已完成的评估内容，允许跳转（即使没有总分）
        if (hasFinishedContent) {
          // 获取任务详情，用于传递权重等信息
          const taskDetails = this.taskDetails || {};
          
          this.$router.push({
            name: routeName, // 使用name进行跳转
            query: {
              taskId: this.taskId,
              submitId: this.submitId,
              // 传递 taskDetails，与作业管理保持一致
              taskDetails: JSON.stringify({
                taskName: taskDetails.taskName || '',
                taskId: this.taskId,
                weights: taskDetails.weights || [25, 25, 25, 25],
                submissionTypes: taskDetails.submissionTypes || []
              })
            }
          });
        } else {
          this.$message.warning('该评估维度尚未完成，无法查看详情');
        }
      }
    },
  },
  created() {
    this.fetchScores();  // 初始获取
    if (this.submissionStatus === 'submitted') {  // 添加这个判断
      this.startGradingCheck();  // 如果已是提交状态，开始轮询
    } 
  },
  beforeDestroy() {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }
  }
};
</script>

<style scoped>
.score-card {
  margin-top: 20px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.grading-status {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #e6a23c;
}

.el-icon-loading {
  font-size: 14px;
}

.score-legend {
  display: flex;
  gap: 15px;
  font-size: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.score-text {
  font-size: 14px;
  color: #606266;
}

.total-score {
  font-size: 15px;
  font-weight: 600;
}

.excellent {
  color: #67c23a;
}

.good {
  color: #409eff;
}

.pass {
  color: #e6a23c;
}

.fail {
  color: #f56c6c;
}

.score-empty {
  color: #909399;
}

.dot.excellent {
  background-color: #67c23a;
}

.dot.good {
  background-color: #409eff;
}

.dot.pass {
  background-color: #e6a23c;
}

.dot.fail {
  background-color: #f56c6c;
}

.grading-tip {
  margin-top: 15px;
  padding: 10px;
  background-color: #fdf6ec;
  color: #e6a23c;
  font-size: 13px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 5px;
}
.clickable-type {
  color: #409EFF;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.3s;
}

.clickable-type:hover {
  color: #66b1ff;
  text-decoration: underline;
}

.disabled-type {
  color: #909399;
  cursor: not-allowed;
}
:deep(.el-table__header-wrapper) {
  border-bottom: 1px solid #EBEEF5;
}

:deep(.el-table__body-wrapper) {
  background-color: #ffffff;
}

:deep(.el-table) {
  border: none;
}
</style>


