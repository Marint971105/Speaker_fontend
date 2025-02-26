<template>
  <div class="homework-evaluation">
    <!-- 顶部作业信息栏 -->
    <el-row class="header-row">
      <el-col :span="24">
        <div class="header">
          <span class="info-text">题目：{{ homeworkTitle }}</span>
          <span class="info-text">姓名：{{ userName }}</span>
          <span class="info-text">当前流程：{{ currentProcess }}</span>
          <span class="info-text">评分人：{{ reviewer }}</span>
        </div>
      </el-col>
    </el-row>

    <!-- 导航标签 -->
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="视频" name="video">
        <!-- 视频播放区 -->
        <el-row>
          <el-col :span="24">
            <el-card class="media-card">
              <video controls width="100%" height="400" :src="videoSrc"></video>
            </el-card>
          </el-col>
        </el-row>

        <!-- 评价和雷达图 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <!-- 评价模块 -->
            <el-card class="evaluation-card">
              <h3>评价</h3>
              <div>
                <p>演讲自信程度 (Self-confidence in Public Speaking)</p>
                <el-rate v-model="selfConfidence"></el-rate>
                <p>{{ selfConfidence }} 分</p>

                <!-- 评价子模块 -->
                <p>演讲开场阶段：</p>
                <el-rate v-model="beginningStage"></el-rate>
                <p>{{ beginningStage }} 分</p>

                <p>演讲进行过程：</p>
                <el-rate v-model="bodyStage"></el-rate>
                <p>{{ bodyStage }} 分</p>

                <p>演讲结束阶段：</p>
                <el-rate v-model="endingStage"></el-rate>
                <p>{{ endingStage }} 分</p>

                <!-- 一键评分 -->
                <el-slider v-model="autoRating" :min="0" :max="5" step="1" show-tooltip></el-slider>
              </div>
            </el-card>
          </el-col>

          <!-- 雷达图模块 -->
          <el-col :span="12">
            <el-card class="radar-chart-card">
              <h3>评价雷达图</h3>
              <RadarChart :data="videoRadarData" />
            </el-card>
          </el-col>
        </el-row>

        <!-- 评语模块 -->
        <el-row>
          <el-col :span="24">
            <el-card class="comment-card">
              <h3>评语</h3>
              <el-input type="textarea" v-model="comment" placeholder="请输入评语"></el-input>
              <div class="score-submit">
                <el-input v-model="totalScore" placeholder="总评分" disabled class="total-score-input"></el-input>
                <el-button type="primary" @click="submitEvaluation">提交分数</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!--音频模块-->
      <el-tab-pane label="音频" name="audio">
        <!-- 音频播放区 -->
        <el-row>
          <el-col :span="24">
            <el-card class="media-card">
              <audio controls width="100%" :src="audioSrc"></audio>
            </el-card>
          </el-col>
        </el-row>
        <!-- 评价和雷达图 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <!-- 评价模块 -->
            <el-card class="evaluation-card">
              <h3>评价</h3>
              <div>
                <p>演讲自信程度 (Self-confidence in Public Speaking)</p>
                <el-rate v-model="selfConfidence"></el-rate>
                <p>{{ selfConfidence }} 分</p>

                <!-- 评价子模块 -->
                <p>演讲开场阶段：</p>
                <el-rate v-model="beginningStage"></el-rate>
                <p>{{ beginningStage }} 分</p>

                <p>演讲进行过程：</p>
                <el-rate v-model="bodyStage"></el-rate>
                <p>{{ bodyStage }} 分</p>

                <p>演讲结束阶段：</p>
                <el-rate v-model="endingStage"></el-rate>
                <p>{{ endingStage }} 分</p>

                <!-- 一键评分 -->
                <el-slider v-model="autoRating" :min="0" :max="5" step="1" show-tooltip></el-slider>
              </div>
            </el-card>
          </el-col>

          <!-- 雷达图模块 -->
          <el-col :span="12">
            <el-card class="radar-chart-card">
              <h3>评价雷达图</h3>
              <RadarChart :data="videoRadarData" />
            </el-card>
          </el-col>
        </el-row>

        <!-- 评语模块 -->
        <el-row>
          <el-col :span="24">
            <el-card class="comment-card">
              <h3>评语</h3>
              <el-input type="textarea" v-model="comment" placeholder="请输入评语"></el-input>
              <div class="score-submit">
                <el-input v-model="totalScore" placeholder="总评分" disabled class="total-score-input"></el-input>
                <el-button type="primary" @click="submitEvaluation">提交分数</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>

      </el-tab-pane>
      <el-tab-pane label="PPT" name="ppt">
        <!-- PPT展示区 -->
        <el-row>
          <el-col :span="24">
            <el-card class="media-card">
              <div class="ppt-container">
                <img :src="pptSrc" alt="PPT" class="ppt-image" />
                <div class="ppt-controls">
                  <el-button type="primary" size="small" icon="el-icon-arrow-left">上一页</el-button>
                  <span class="page-info">第 1 页 / 共 10 页</span>
                  <el-button type="primary" size="small" icon="el-icon-arrow-right">下一页</el-button>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 评分区域 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card class="evaluation-card">
              <h3>评价</h3>
              <div>
                <p>视觉材料辅助效果 (Visual Aids)</p>
                <el-rate v-model="pptRatings.visualAids"></el-rate>
                <p>结构合理 (Organization)</p>
                <el-rate v-model="pptRatings.organization"></el-rate>
                <p>内容丰富 (Content)</p>
                <el-rate v-model="pptRatings.content"></el-rate>
                <p>整体呈现简洁 (Brevity)</p>
                <el-rate v-model="pptRatings.brevity"></el-rate>
                <p>字体大小合理 (Font)</p>
                <el-rate v-model="pptRatings.font"></el-rate>
                <p>图文并茂，展示效果好 (Illustration)</p>
                <el-rate v-model="pptRatings.illustration"></el-rate>
              </div>
            </el-card>
          </el-col>

          <!-- 雷达图 -->
          <el-col :span="12">
            <el-card class="radar-chart-card">
              <h3>评价雷达图</h3>
              <RadarChart :data="pptRadarData" />
            </el-card>
          </el-col>
        </el-row>

        <!-- 评语区域 -->
        <el-row>
          <el-col :span="24">
            <el-card class="comment-card">
              <h3>评语</h3>
              <el-input type="textarea" v-model="pptComment" placeholder="请输入评语"></el-input>
              <div class="score-submit">
                <el-input v-model="pptTotalScore" placeholder="PPT总评分" disabled class="total-score-input"></el-input>
                <el-button type="primary">提交评分</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="演讲稿" name="speech">
        <!-- 演讲稿展示区 -->
        <el-row>
          <el-col :span="24">
            <el-card class="media-card">
              <div class="speech-text-container">
                <div class="speech-text">
                  {{ speechText }}
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 评分区域 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card class="evaluation-card">
              <h3>评价</h3>
              <div>
                <p>演讲稿写作质量 (Competence in Drafting a Speech)</p>
                <el-rate v-model="speechRatings.competence"></el-rate>
                <p>体裁适宜 (Literary styles)</p>
                <el-rate v-model="speechRatings.literaryStyle"></el-rate>
                <p>语言表达地道 (Idiomaticity)</p>
                <el-rate v-model="speechRatings.idiomaticity"></el-rate>
                <p>逻辑完整 (Logic)</p>
                <el-rate v-model="speechRatings.logic"></el-rate>
                <p>句子简明扼要 (Conciseness)</p>
                <el-rate v-model="speechRatings.conciseness"></el-rate>
                <p>无拼写错误 (Spelling)</p>
                <el-rate v-model="speechRatings.spelling"></el-rate>
              </div>
            </el-card>
          </el-col>

          <!-- 雷达图 -->
          <el-col :span="12">
            <el-card class="radar-chart-card">
              <h3>评价雷达图</h3>
              <RadarChart :data="speechRadarData" />
            </el-card>
          </el-col>
        </el-row>

        <!-- 评语区域 -->
        <el-row>
          <el-col :span="24">
            <el-card class="comment-card">
              <h3>评语</h3>
              <el-input type="textarea" v-model="speechComment" placeholder="请输入评语"></el-input>
              <div class="score-submit">
                <el-input v-model="speechTotalScore" placeholder="演讲稿总评分" disabled class="total-score-input"></el-input>
                <el-button type="primary">提交评分</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import RadarChart from "@/views/radarChart"; // 雷达图组件
import { getHomeworkInfo, submitEvaluation } from "@/api/task/selfEvolution"

export default {
  components: {
    RadarChart
  },
  data() {
    return {
      activeTab: "video", // 默认选中的标签
      homeworkTitle: "寒假作业",  // 作业标题
      userName: "name",       // 用户姓名
      currentProcess: "自评", // 当前流程
      reviewer: "匿名",       // 评分人
      videoSrc: "./9.mp4",       // 视频链接
      audioSrc: "",       // 音频链接
      pptSrc: "",         // PPT图片链接
      speechText: "",     // 演讲稿内容
      speakingCompetence: 0, // 口头表达能力评分
      accuracyRating: 0,     // 准确性评分
      fluencyRating: 0,      // 流畅性评分
      standardnessRating: 0, // 标准性评分
      integrityRating: 0,    // 完整性评分
      totalScore: 0,         // 总分
      comment: "",           // 评语

      // 雷达图数据
      videoRadarData: {
        labels: ["口头表达能力", "准确性", "流畅性", "标准性", "完整性"],
        datasets: [{
          label: "评分",
          data: [0, 0, 0, 0, 0],
          backgroundColor: "rgba(34, 202, 236, .2)",
          borderColor: "rgba(34, 202, 236, 1)",
          borderWidth: 2
        }]
      },
      audioRadarData: {
        labels: ["口头表达能力", "准确性", "流畅性", "标准性", "完整性"],
        datasets: [{
          label: "评分",
          data: [0, 0, 0, 0, 0],
          backgroundColor: "rgba(34, 202, 236, .2)",
          borderColor: "rgba(34, 202, 236, 1)",
          borderWidth: 2
        }]
      },
      pptRatings: {
        visualAids: 0,
        organization: 0,
        content: 0,
        brevity: 0,
        font: 0,
        illustration: 0
      },
      pptComment: '',
      pptTotalScore: 0,
      pptRadarData: {
        labels: ["视觉效果", "结构", "内容", "简洁", "字体", "图文"],
        datasets: [{
          label: "评分",
          data: [0, 0, 0, 0, 0, 0],
          backgroundColor: "rgba(34, 202, 236, .2)",
          borderColor: "rgba(34, 202, 236, 1)",
          borderWidth: 2
        }]
      },

      // 演讲稿相关数据
      speechRatings: {
        competence: 0,
        literaryStyle: 0,
        idiomaticity: 0,
        logic: 0,
        conciseness: 0,
        spelling: 0
      },
      speechComment: '',
      speechTotalScore: 0,
      speechRadarData: {
        labels: ["写作质量", "体裁", "表达", "逻辑", "简明", "拼写"],
        datasets: [{
          label: "评分",
          data: [0, 0, 0, 0, 0, 0],
          backgroundColor: "rgba(34, 202, 236, .2)",
          borderColor: "rgba(34, 202, 236, 1)",
          borderWidth: 2
        }]
      }
    };
  },
  created() {
    this.fetchHomeworkInfo();
  },
  methods: {
    // 从后端获取作业和媒体信息
    ffetchHomeworkInfo() {
      getHomeworkInfo()
        .then(response => {
          const data = response.data;
          this.homeworkTitle = data.homeworkTitle;
          this.userName = data.userName;
          this.currentProcess = data.currentProcess;
          this.reviewer = data.reviewer;
          this.videoSrc = data.videoSrc;
          this.audioSrc = data.audioSrc;
          this.pptSrc = data.pptSrc;
          this.speechText = data.speechText;
        })
        .catch(error => {
          console.error('获取作业信息失败:', error);
        });
    },
    // 动态计算总分并更新雷达图数据
    updateTotalScore() {
      this.totalScore = (
        this.speakingCompetence +
        this.accuracyRating +
        this.fluencyRating +
        this.standardnessRating +
        this.integrityRating
      ) / 5;

      // 更新雷达图数据
      this.videoRadarData.datasets[0].data = [
        this.speakingCompetence,
        this.accuracyRating,
        this.fluencyRating,
        this.standardnessRating,
        this.integrityRating
      ];
    },
    // 提交评分和评语
    submitEvaluation() {
      const evaluationData = {
        speakingCompetence: this.speakingCompetence,
        accuracyRating: this.accuracyRating,
        fluencyRating: this.fluencyRating,
        standardnessRating: this.standardnessRating,
        integrityRating: this.integrityRating,
        totalScore: this.totalScore,
        comment: this.comment
      };

      submitEvaluation(evaluationData)
        .then(response => {
          alert('评分提交成功');
        })
        .catch(error => {
          console.error('评分提交失败:', error);
        });
    }
  }
};
</script>

<style scoped>
.homework-evaluation {
  padding: 20px;
}

.header-row {
  margin-bottom: 20px;
}

.media-card {
  margin-bottom: 20px;
}

.evaluation-section {
  margin-top: 20px;
}

.submit-section {
  margin-top: 30px;
}

.centered {
  text-align: center;
}
.score-submit {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.total-score-input {
  width: 150px;
}

.info-text {
  font-size: 15px;  /* 调整字体大小 */
  font-weight: normal;  /* 取消粗体效果，normal 表示正常粗细 */
  margin-right: 50px; /* 增加每个信息之间的间距 */
  color: #666;  /* 设置灰色字体 */
}
/* PPT相关样式 */
.ppt-container {
  text-align: center;
}

.ppt-image {
  max-width: 100%;
  height: auto;
  margin-bottom: 20px;
}

.ppt-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.page-info {
  font-size: 14px;
  color: #606266;
}

/* 演讲稿相关样式 */
.speech-text-container {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.speech-text {
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
}
</style>
