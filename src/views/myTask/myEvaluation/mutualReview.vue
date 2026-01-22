<template>
  <div class="homework-evaluation">
    <!-- 顶部作业信息栏 -->
    <el-row class="header-row">
      <el-col :span="12">
        <div class="header">
          <span class="info-text">题目：{{ homeworkTitle }}</span>
          <span class="info-text">姓名：{{ submitter }}</span>
          <span class="info-text">评价流程：{{ currentProcess }}</span>
          <span class="info-text">评分人：{{ reviewer }}</span>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="submit-all-wrapper">
          <el-button
            type="primary"
            @click="handleSubmitAll"
            :loading="submitting"
            :disabled="submitting"
          >
            {{ submitting ? '提交中...' : '提交所有评分' }}
          </el-button>
        </div>
      </el-col>
    </el-row>

    <!-- 顶部标签页 -->
    <el-tabs v-model="activeTab" type="card" class="tabs-container">
      <el-tab-pane v-for="type in submissionTypes" :key="type" :name="type" :label="type">
        <div v-if="type === '视频'" class="tab-content">
          <!-- 第一行：视频和评分维度 -->
          <div class="first-row">
            <!-- 左侧视频播放区域 -->
            <div class="video-section">
              <div class="video-wrapper">
                <video
                  ref="videoElement"
                  controls
                  class="video-player"
                  :src="fileUrls.video"
                  @loadstart="handleVideoLoadStart"
                  @waiting="handleVideoWaiting"
                  @canplay="handleVideoCanPlay"
                  @canplaythrough="handleVideoCanPlay"
                  @error="handleFileError('video')"
                ></video>
                <!-- 自定义加载遮罩层 -->
                <div v-if="loading.video" class="custom-loading-overlay">
                  <div class="loading-content">
                    <div class="loading-spinner">
                      <i class="el-icon-loading"></i>
                    </div>
                    <div class="loading-text">视频加载中...</div>
                    <div class="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 右侧评分维度区域 -->
            <div class="dimension-section">
              <div class="section-header">
                <i class="el-icon-s-operation"></i>
                <span>评价</span>
              </div>
              <el-card class="dimension-card">
                <div class="dimension-content">
                  <div
                    v-for="(dimension, index) in evaluationData.video || []"
                    :key="index"
                    class="dimension-item"
                  >
                    <p class="dimension-title">
                      <b>{{ dimension.evaluationTitle }}</b>
                    </p>
                    <div
                      v-for="(info, infoIndex) in dimension.evaluationInfos || []"
                      :key="infoIndex"
                      class="info-item"
                    >
                      <span>{{ info }}</span>
                      <el-rate
                        v-model="ratings.video[index][infoIndex]"
                        :max="5"
                        allow-half
                      ></el-rate>
                    </div>
                  </div>
                </div>
              </el-card>
            </div>
          </div>

          <!-- 第二行：雷达图和评语 -->
          <div class="second-row">
            <!-- 左侧雷达图 -->
            <div class="radar-section">
              <div class="section-header">
                <i class="el-icon-data-analysis"></i>
                <span>评价雷达图</span>
              </div>
              <el-card class="radar-chart">
                <!-- 雷达图将在这里渲染 -->
                <div :ref="`radarContainer-${type}`" class="radar-container"></div>
              </el-card>
            </div>

            <!-- 右侧评语和评分 -->
            <div class="comment-section">
              <div class="section-header">
                <i class="el-icon-edit"></i>
                <span>评语</span>
              </div>
              <el-card class="comment-card">
                <el-input
                  type="textarea"
                  placeholder="请输入评语"
                  rows="4"
                  class="comment-input"
                  v-model="comments.video"
                ></el-input>

                <!-- 评分和提交按钮 -->
                <div class="score-submit">
                  <div class="score-container">
                    <span class="score-label">视频总分：</span>
                    <el-input
                      v-model="manualScores.video"
                      type="number"
                      :min="0"
                      :max="100"
                      size="small"
                      class="score-input"
                      :placeholder="calculateTotalScore('video').toString()"
                      @blur="handleScoreChange('video')"
                      @input="validateScore('video', $event)"
                    ></el-input>
                    <span class="score-unit">分</span>
                  </div>
                  <el-button
                    type="primary"
                    size="small"
                    @click="handleNextTab"
                  >确定下一个评价对象</el-button>
                </div>
              </el-card>
            </div>
          </div>
        </div>

        <div v-else-if="type === '音频'" class="tab-content">
          <!-- 第一行：音频和评分维度 -->
          <div class="first-row">
            <!-- 左侧音频播放区域 -->
            <div class="audio-section" v-loading="loading.audio" element-loading-text="音频加载中..." element-loading-spinner="el-icon-loading">  <!-- 可以复用video-section的样式 -->
              <div class="audio-player-container">
                <!-- 音频播放器背景 -->
                <div class="audio-bg">
                  <!-- 旋转的音乐图标 -->
                  <div class="music-icon" :class="{ 'is-playing': isPlaying }">
                    <i class="el-icon-headset"></i>
                  </div>
                  <!-- 音符装饰 -->
                  <div class="music-notes">
                    <i class="el-icon-music"></i>
                    <i class="el-icon-bell"></i>
                    <i class="el-icon-mic"></i>
                  </div>
                </div>
                <audio
                  ref="audioElement"
                  v-show="!loading.audio"
                  controls
                  class="audio-player"
                  :src="fileUrls.audio"
                  @loadstart="handleAudioLoadStart"
                  @waiting="handleAudioWaiting"
                  @canplay="handleAudioCanPlay"
                  @canplaythrough="handleAudioCanPlay"
                  @play="handlePlay"
                  @pause="handlePause"
                  @ended = 'handlePause'
                  @error="handleFileError('audio')"
                ></audio>

              </div>
            </div>
            <!-- 右侧评分维度区域 -->
            <div class="dimension-section">
              <div class="section-header">
                <i class="el-icon-s-operation"></i>
                <span>评价</span>
              </div>
              <el-card class="dimension-card">
                <div class="dimension-content">
                  <div
                    v-for="(dimension, index) in evaluationData.audio || []"
                    :key="index"
                    class="dimension-item"
                  >
                    <p class="dimension-title">
                      <b>{{ dimension.evaluationTitle }}</b>
                    </p>
                    <div
                      v-for="(info, infoIndex) in dimension.evaluationInfos || []"
                      :key="infoIndex"
                      class="info-item"
                    >
                      <span>{{ info }}</span>
                      <el-rate
                        v-model="ratings.audio[index][infoIndex]"
                        :max="5"
                        allow-half
                        @change="handleRatingChange('audio', index, infoIndex)"
                      ></el-rate>
                    </div>
                  </div>
                </div>
              </el-card>
            </div>
          </div>

          <!-- 第二行：雷达图和评语 -->
          <div class="second-row">
            <!-- 左侧雷达图 -->
            <div class="radar-section">
              <div class="section-header">
                <i class="el-icon-data-analysis"></i>
                <span>评价雷达图</span>
              </div>
              <el-card class="radar-chart">
                <!-- 雷达图内容 -->
                <div :ref="`radarContainer-${type}`" class="radar-container"></div>
              </el-card>
            </div>

            <!-- 右侧评语和评分 -->
            <div class="comment-section">
              <div class="section-header">
                <i class="el-icon-edit"></i>
                <span>评语</span>
              </div>
              <el-card class="comment-card">
                <el-input
                  type="textarea"
                  placeholder="请输入评语"
                  rows="4"
                  class="comment-input"
                  v-model="comments.audio"
                ></el-input>

                <!-- 评分和提交按钮 -->
                <div class="score-submit">
                  <div class="score-container">
                    <span class="score-label">音频总分：</span>
                    <el-input
                      v-model="manualScores.audio"
                      type="number"
                      :min="0"
                      :max="100"
                      size="small"
                      class="score-input"
                      :placeholder="calculateTotalScore('audio').toString()"
                      @blur="handleScoreChange('audio')"
                      @input="validateScore('audio', $event)"
                    ></el-input>
                    <span class="score-unit">分</span>
                  </div>
                  <el-button
                    type="primary"
                    size="small"
                    @click="handleNextTab"
                  >确定下一个评价对象</el-button>
                </div>
              </el-card>
            </div>
          </div>
        </div>

        <div v-else-if="type === 'PPT'" class="tab-content">
          <div class="content-wrapper">
            <!-- 左侧 PPT 展示区域 -->
            <div class="left-section">
              <div class="ppt-document-section" v-loading="loading.ppt" element-loading-text="PPT加载中..." element-loading-spinner="el-icon-loading">
                <pdf-viewer
                  v-if="pdfData"
                  :pdf-data="pdfData"
                  class="pdf-viewer"
                />
              </div>
            </div>

            <!-- 右侧评价和评语 -->
            <div class="right-section">
              <!-- 评分维度区域 -->
              <div class="ppt-dimension-section">
                <div class="section-header">
                  <i class="el-icon-s-operation"></i>
                  <span>评价</span>
                </div>
                <el-card class="dimension-card">
                  <div class="dimension-content">
                    <div
                      v-for="(dimension, index) in evaluationData.ppt || []"
                      :key="index"
                      class="dimension-item"
                    >
                      <p class="dimension-title">
                        <b>{{ dimension.evaluationTitle }}</b>
                      </p>
                        <div
                          v-for="(info, infoIndex) in dimension.evaluationInfos || []"
                          :key="infoIndex"
                          class="info-item"
                        >
                          <span>{{ info }}</span>
                          <el-rate
                            v-model="ratings.ppt[index][infoIndex]"
                            :max="5"
                            allow-half
                            @change="handleRatingChange('ppt', index, infoIndex)"
                          ></el-rate>
                        </div>
                    </div>
                  </div>
                </el-card>
              </div>

              <!-- 评语区域 -->
              <div class="comment-section">
                <div class="section-header">
                  <i class="el-icon-edit"></i>
                  <span>评语</span>
                </div>
                <el-card class="comment-card">
                  <el-input
                    type="textarea"
                    placeholder="请输入评语"
                    rows="4"
                    class="comment-input"
                    v-model="comments.ppt"
                  ></el-input>

                  <!-- 评分总分和按钮 -->
                  <div class="score-submit">
                    <div class="score-container">
                      <span class="score-label">PPT总分：</span>
                      <el-input
                        v-model="manualScores.ppt"
                        type="number"
                        :min="0"
                        :max="100"
                        size="small"
                        class="score-input"
                        :placeholder="calculateTotalScore('ppt').toString()"
                        @blur="handleScoreChange('ppt')"
                        @input="validateScore('ppt', $event)"
                      ></el-input>
                      <span class="score-unit">分</span>
                    </div>
                    <el-button
                      type="primary"
                      size="small"
                      @click="handleNextTab"
                    >确定下一个评价对象</el-button>
                  </div>
                </el-card>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="type === '演讲稿'" class="tab-content">
          <div class="content-wrapper">
            <!-- 左侧 Word 展示区域 -->
            <div class="left-section">
              <div class="word-document-section" v-loading="loading.word || convertLoading"
                   element-loading-text="文稿加载中...">
                <!-- Word 文档内容 -->
                <div v-if="wordContent" class="word-content">
                  <div v-html="wordContent"></div>
                </div>
                <div v-else-if="!loading.word && !convertLoading" class="preview-placeholder">
                  <i class="el-icon-document"></i>
                  <p>Word 文档加载失败</p>
                  <el-button
                    type="primary"
                    size="small"
                    @click="loadFiles"
                  >
                    重试
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 右侧评价和评语 -->
            <div class="right-section">
              <!-- 评分维度区域 -->
              <div class="word-dimension-section">
                <div class="section-header">
                  <i class="el-icon-s-operation"></i>
                  <span>评价</span>
                </div>
                <el-card class="dimension-card">
                  <div class="dimension-content">
                    <div
                      v-for="(dimension, index) in evaluationData.word || []"
                      :key="index"
                      class="dimension-item"
                    >
                      <p class="dimension-title">
                        <b>{{ dimension.evaluationTitle }}</b>
                      </p>
                        <div
                          v-for="(info, infoIndex) in dimension.evaluationInfos || []"
                          :key="infoIndex"
                          class="info-item"
                        >
                          <span>{{ info }}</span>
                          <el-rate
                            v-model="ratings.word[index][infoIndex]"
                            :max="5"
                            allow-half
                            @change="handleRatingChange('word', index, infoIndex)"
                          ></el-rate>
                        </div>
                    </div>
                  </div>
                </el-card>
              </div>

              <!-- 评语区域 -->
              <div class="comment-section">
                <div class="section-header">
                  <i class="el-icon-edit"></i>
                  <span>评语</span>
                </div>
                <el-card class="comment-card">
                  <el-input
                    type="textarea"
                    placeholder="请输入评语"
                    rows="4"
                    class="comment-input"
                    v-model="comments.word"
                  ></el-input>

                  <!-- 评分总分和按钮 -->
                  <div class="score-submit">
                    <div class="score-container">
                      <span class="score-label">文稿总分：</span>
                      <el-input
                        v-model="manualScores.word"
                        type="number"
                        :min="0"
                        :max="100"
                        size="small"
                        class="score-input"
                        :placeholder="calculateTotalScore('word').toString()"
                        @blur="handleScoreChange('word')"
                        @input="validateScore('word', $event)"
                      ></el-input>
                      <span class="score-unit">分</span>
                    </div>
                    <el-button
                      type="primary"
                      size="small"
                      @click="handleNextTab"
                    >确定下一个评价对象</el-button>
                  </div>
                </el-card>
              </div>
            </div>
          </div>
        </div>

      </el-tab-pane>
    </el-tabs>
  </div>
</template>


<script>
import { getTaskInfoById, submitEvaluation ,getSubmissionsByStuId,showFile, getEvaluationByTaskIdAndStuId} from "@/api/myTask/myEvaluation/index";
import * as echarts from 'echarts';
import { Loading } from 'element-ui';
import mammoth from 'mammoth';
import AudioVisualizer from './AudioVisualizer.vue';
import PdfViewer from './PDFViewer.vue'
export default {
  name: "mutualReview",
  directives: {
    loading: Loading
  },
  props: {
    taskId: {
      type: String,
      required: true,
    },
    homeworkTitle: {
      type: String,
      required: true,
    },
    submitter: {
      type: String,
      required: true,
    },
    currentProcess: {
      type: String,
      required: true,
    },
    reviewerId: {
      type: String,
      required: true,
    },
    studentId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      reviewer: "匿名", // 可从后端获取
      activeTab: "视频", // 当前激活的模态
      submissionTypes: [], // 存储模态类型
      submitting: false,
      evaluationData: {
        video: [], // 视频的评价维度数据
        audio: [],
        ppt: [],
        word: [],
      },
      ratings: {
        video: [], // 视频评分数据
        audio: [],
        ppt: [],
        word: [],
      },
      comments: {
        video: "",
        audio: "",
        ppt: "",
        word: "",
      },
      manualScores: {
        video: null, // 手动输入的总分
        audio: null,
        ppt: null,
        word: null,
      },
      typeMapping: {
        '视频': 'video',
        '音频': 'audio',
        'PPT': 'ppt',
        '演讲稿': 'word'
      },
      radarChart: null, // 保存图表实例
      radarCharts: {}, // 用于存储不同tab的雷达图实例
      dimensionScores: {
        '视频': 0,
        '音频': 0,
        'PPT': 0,
        '演讲稿': 0
      },
      fileUrls: {
        video: '',
        audio: '',
        ppt: '',
        word: ''
      },
      loading: {
        video: false,
        audio: false,
        ppt: false,
        word: false
      },
      currentTaskInfo: null, // 当前任务的详细信息
      _blobUrls: [], // 用于管理blob URLs
      wordContent: '', // 用于存储转换后的 HTML 内容
      convertLoading: false, // 转换加载状态
      isPlaying: false,
      pdfData: null,
    };
  },
  computed: {
    // 计算雷达图所需的数据
    radarData() {
      return this.submissionTypes.map(type => {
        const key = this.typeMapping[type];
        return {
          name: type,
          value: this.calculateTotalScore(key)
        };
      });
    },

    // 生成雷达图的指示器配置
    radarIndicator() {
      return this.submissionTypes.map(type => ({
        name: type,
        max: 100 // 满分100分
      }));
    }
  },
  watch: {
    // 监听标签页切换
    activeTab: {
      handler(newTab) {
        this.$nextTick(() => {
          this.initRadarChart(newTab);
        });
      }
    },
    immediate: true,
    // 监听评分变化
    ratings: {
      deep: true,
      handler(newRatings, oldRatings) {
        // 如果 oldRatings 不存在（初始化时），跳过
        if (!oldRatings) return;
        
        // 遍历所有评分类型
        Object.keys(newRatings).forEach(type => {
          const newTypeRatings = newRatings[type];
          const oldTypeRatings = oldRatings[type];
          
          // 检查该类型的评分是否有变化
          const newStr = JSON.stringify(newTypeRatings);
          const oldStr = JSON.stringify(oldTypeRatings);
          
          if (newStr !== oldStr) {
            // 当星星评分变化时，总是根据星星评分更新分数显示
            // 直接根据星星评分计算总分（不依赖 manualScores）
            if (!newTypeRatings || !newTypeRatings.length) {
              this.$set(this.manualScores, type, 0);
              return;
            }
            const totalScore = newTypeRatings
              .flat()
              .reduce((sum, score) => sum + score, 0);
            const itemCount = newTypeRatings.flat().length;
            const calculatedScore = itemCount > 0 ? Math.round((totalScore / (itemCount * 5)) * 100) : 0;
            
            // 强制更新 manualScores 以显示在输入框中（覆盖手动输入的值）
            this.$set(this.manualScores, type, calculatedScore);
          }
        });
        
        // 更新所有维度的分数
        this.submissionTypes.forEach(type => {
          this.updateDimensionScore(type);
        });
      }
    }

  },
  mounted() {
    // this.$nextTick(() => {
    //   // 初始化当前激活标签页的雷达图
    //   this.initRadarChart(this.activeTab);
    // });
  },
  components: {
    AudioVisualizer,
    'pdf-viewer': PdfViewer
  },
  methods: {
    // 获取任务信息
    async fetchTaskData() {
      try {
        // 获取任务信息
        const res = await getTaskInfoById(this.taskId);

        // 添加数据校验
        if (!res || !res.data) {
          this.$message.error('获取任务信息失败');
          return;
        }

        const data = res.data;

        // 固定模态顺序
        const fixedOrder = ["视频", "音频", "PPT", "演讲稿"];

        // 从返回值中筛选并排序模态
        this.submissionTypes = fixedOrder.filter((type) =>
          data.submissionTypes?.includes(type)
        );

        // 初始化模态数据
        if (data.evaluationDimensions) {
          this.initializeEvaluationData(data);
        }

        // 设置默认激活的第一个模态
        this.activeTab = this.submissionTypes[0] || "";

        // 在数据初始化完成后初始化图表
        this.$nextTick(() => {
          this.initRadarChart();
        });

      } catch (error) {
        console.error("获取任务信息失败：", error);
        this.$message.error('获取任务信息失败');
      }
    },


    // 修改nextTab方法
    async nextTab() {
      // 保存当前评分信息
      await this.saveCurrentEvaluation();

      // 切换到下一个标签页
      const currentIndex = this.submissionTypes.indexOf(this.activeTab);
      const nextIndex = (currentIndex + 1) % this.submissionTypes.length;
      this.activeTab = this.submissionTypes[nextIndex];
    },

    // 切换到下一个标签页
    async handleNextTab() {
      const isCurrentComplete = this.saveCurrentTabEvaluation();

      if (!isCurrentComplete) {
        this.$message({
          message: '请完成所有评分项',
          type: 'warning',
          duration: 2000
        });
        return;
      }

      // 切换到下一个标签
      const currentIndex = this.submissionTypes.indexOf(this.activeTab);
      const nextIndex = (currentIndex + 1) % this.submissionTypes.length;
      this.activeTab = this.submissionTypes[nextIndex];

      // 如果已经完成所有评分，提示可以提交
      if (this.checkAllEvaluationsComplete()) {
        this.$message({
          message: '所有评分已完成，可以提交总评',
          type: 'success',
          duration: 2000
        });
      }
    },

    // 初始化评分数据
    initializeEvaluationData(data) {
      if (!data?.evaluationDimensions) return;

      // 修正：互评页面应该查找"互评"而不是"自评"
      const evaluation = data.evaluationDimensions.find(
        (item) => item?.evaluationMethods === "互评"
      );

      if (evaluation?.evaluationTypes) {
        evaluation.evaluationTypes.forEach((type) => {
          const key = this.typeMapping[type.evaluationContent];

          if (key) {
            // 初始化评价维度
            this.$set(this.evaluationData, key, type.evaluationTitles || []);

            // 初始化评分数据
            const dimensionRatings = type.evaluationTitles.map((dimension) =>
              dimension.evaluationInfos ? Array(dimension.evaluationInfos.length).fill(0) : []
            );
            this.$set(this.ratings, key, dimensionRatings);

            // 初始化评语
            this.$set(this.comments, key, '');
          }
        });
      }
    },

    // 加载已有的互评数据
    async loadExistingEvaluation() {
      try {
        const response = await getEvaluationByTaskIdAndStuId(this.taskId, this.studentId);
        
        if (response.code === 1 && response.data) {
          // 查找互评数据
          const mutualEvaluation = response.data.evaluationTypes.find(
            type => type.evaluationMethod === '互评'
          );
          
          if (mutualEvaluation && mutualEvaluation.evaluationContents) {
            // 遍历每个评价内容（视频、音频、PPT、演讲稿）
            mutualEvaluation.evaluationContents.forEach(content => {
              const key = this.typeMapping[content.evaluationContent];
              
              if (key) {
                // 加载评语 - 评语存储在 evaluationTitle 字段中
                if (content.evaluationTitle) {
                  this.$set(this.comments, key, content.evaluationTitle);
                }
                
                // 加载手动输入的总分 - 总分存储在 grade 字段中
                if (content.grade !== null && content.grade !== undefined) {
                  const gradeValue = Number(content.grade);
                  this.$set(this.manualScores, key, gradeValue);
                  // 立即更新维度分数
                  const chineseType = Object.keys(this.typeMapping).find(k =>
                    this.typeMapping[k] === key
                  );
                  if (chineseType) {
                    this.$set(this.dimensionScores, chineseType, gradeValue);
                  }
                }
                
                // 加载评分数据
                if (content.evaluationDimensions && content.evaluationDimensions.length > 0) {
                  const evaluationData = this.evaluationData[key];
                  if (evaluationData && evaluationData.length > 0) {
                    // 重新构建 ratings 数组
                    const newRatings = evaluationData.map((dimension, dimensionIndex) => {
                      const dimensionRatings = [];
                      
                      if (dimension.evaluationInfos) {
                        dimension.evaluationInfos.forEach((info, infoIndex) => {
                          // 从 evaluationDimensions 中查找对应的评分
                          const evalDim = content.evaluationDimensions.find(dim => {
                            return dim.hasOwnProperty(info);
                          });
                          
                          if (evalDim && evalDim[info]) {
                            dimensionRatings.push(Number(evalDim[info]));
                          } else {
                            dimensionRatings.push(0);
                          }
                        });
                      }
                      
                      return dimensionRatings;
                    });
                    
                    this.$set(this.ratings, key, newRatings);
                  }
                }
              }
            });
            
            // 更新所有维度分数
            this.submissionTypes.forEach(type => {
              this.updateDimensionScore(type);
            });
            
            // 更新雷达图
            this.$nextTick(() => {
              Object.keys(this.radarCharts).forEach(chartType => {
                this.updateRadarChart(chartType);
              });
            });
          }
        }
      } catch (error) {
        console.error('加载已有互评数据失败:', error);
        // 不显示错误提示，保持静默失败，使用初始化的空数据
      }
    },

    calculateTotalScore(type) {
      // 如果手动输入了总分，优先使用手动输入的值
      if (this.manualScores[type] !== null && this.manualScores[type] !== undefined) {
        const score = this.manualScores[type];
        const chineseType = Object.keys(this.typeMapping).find(key =>
          this.typeMapping[key] === type
        );
        if (chineseType) {
          this.$set(this.dimensionScores, chineseType, score);
        }
        return score;
      }
      
      // 否则根据星星评分计算总分
      if (!this.ratings[type] || !this.ratings[type].length) return 0;
      const totalScore = this.ratings[type]
        .flat()
        .reduce((sum, score) => sum + score, 0);
      const itemCount = this.ratings[type].flat().length;
      const score = itemCount > 0 ? Math.round((totalScore / (itemCount * 5)) * 100) : 0;

      // 找到对应的中文类型
      const chineseType = Object.keys(this.typeMapping).find(key =>
        this.typeMapping[key] === type
      );
      if (chineseType) {
        this.$set(this.dimensionScores, chineseType, score);
        // 更新所有雷达图
        Object.keys(this.radarCharts).forEach(chartType => {
          this.updateRadarChart(chartType);
        });
      }

      return score;
    },
    
    // 验证分数输入
    validateScore(type, value) {
      if (value === '' || value === null || value === undefined) {
        // 清空输入框时，设置为 null，让 watcher 根据星星评分更新
        this.$set(this.manualScores, type, null);
        // 立即根据星星评分更新分数显示
        this.$nextTick(() => {
          const calculatedScore = this.calculateTotalScore(type);
          this.$set(this.manualScores, type, calculatedScore);
        });
        return;
      }
      
      const numValue = Number(value);
      if (isNaN(numValue)) {
        this.$set(this.manualScores, type, null);
        // 立即根据星星评分更新分数显示
        this.$nextTick(() => {
          const calculatedScore = this.calculateTotalScore(type);
          this.$set(this.manualScores, type, calculatedScore);
        });
        return;
      }
      
      // 限制在 0-100 范围内
      if (numValue < 0) {
        this.$set(this.manualScores, type, 0);
      } else if (numValue > 100) {
        this.$set(this.manualScores, type, 100);
      } else {
        this.$set(this.manualScores, type, Math.round(numValue));
      }
    },
    
    // 处理星星评分变化
    handleRatingChange(type, dimensionIndex, infoIndex) {
      // 直接根据星星评分计算总分并更新显示
      if (!this.ratings[type] || !this.ratings[type].length) {
        this.$set(this.manualScores, type, 0);
        return;
      }
      
      const totalScore = this.ratings[type]
        .flat()
        .reduce((sum, score) => sum + score, 0);
      const itemCount = this.ratings[type].flat().length;
      const calculatedScore = itemCount > 0 ? Math.round((totalScore / (itemCount * 5)) * 100) : 0;
      
      // 强制更新 manualScores 以显示在输入框中（覆盖手动输入的值）
      this.$set(this.manualScores, type, calculatedScore);
      
      // 更新维度分数和雷达图
      const chineseType = Object.keys(this.typeMapping).find(key =>
        this.typeMapping[key] === type
      );
      if (chineseType) {
        this.$set(this.dimensionScores, chineseType, calculatedScore);
        // 更新所有雷达图
        this.$nextTick(() => {
          Object.keys(this.radarCharts).forEach(chartType => {
            this.updateRadarChart(chartType);
          });
        });
      }
    },
    
    // 处理总分变化
    handleScoreChange(type) {
      const chineseType = Object.keys(this.typeMapping).find(key =>
        this.typeMapping[key] === type
      );
      if (chineseType && this.manualScores[type] !== null && this.manualScores[type] !== undefined) {
        this.$set(this.dimensionScores, chineseType, this.manualScores[type]);
        // 更新雷达图
        Object.keys(this.radarCharts).forEach(chartType => {
          this.updateRadarChart(chartType);
        });
      }
    },

    saveCurrentTabEvaluation() {
      const currentType = this.activeTab;

      // Use the existing checkTypeComplete method instead of the undefined checkEvaluationComplete
      const isComplete = this.checkTypeComplete(currentType);

      if (isComplete) {
        this.$message({
          message: '当前评分已保存',
          type: 'success',
          duration: 2000
        });
      }

      return isComplete;
    },


    // The existing checkTypeComplete method is correct and working:
    checkTypeComplete(type) {
      const key = this.typeMapping[type];

      // 如果手动输入了总分，则不需要完成星星评分
      if (this.manualScores[key] !== null && this.manualScores[key] !== undefined) {
        return true;
      }

      // 否则检查星星评分是否完成
      const hasAllRatings = this.ratings[key] &&
        this.ratings[key].every(dimensionRatings =>
          dimensionRatings.every(stars => stars > 0 && stars <= 5)
        );

      return hasAllRatings;
    },
    // 检查所有评分是否完整
    checkAllEvaluationsComplete() {
      const incompleteTypes = this.submissionTypes.filter(type =>
        !this.checkTypeComplete(type)
      );

      if (incompleteTypes.length > 0) {
        this.$message.warning(
          `以下内容的评分未完成：${incompleteTypes.join('、')}\n` +
          '请确保所有评分维度都已评分'
        );
        return false;
      }
      return true;
    },

    async handleSubmitAll() {
      // Keep your existing validation
      if (!this.checkAllEvaluationsComplete()) {
        return;
      }

      try {
        await this.$confirm(
          `确认提交所有评分和评语？\n提交后将无法修改。\n\n各部分得分：\n${
            this.submissionTypes.map(type =>
              `${type}：${this.calculateTotalScore(this.typeMapping[type])}分`
            ).join('\n')
          }`,
          '提交确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        await this.submitEvaluations();
      } catch (err) {
        if (err !== 'cancel') {
          console.error('提交评分失败：', err);
          this.$message.error('提交失败，请重试');
        }
      }
    },

    async submitEvaluations() {
      try {
        this.submitting = true;

        // Transform the ratings and comments into the required format
        const evaluationContents = this.submissionTypes.map(type => {
          const key = this.typeMapping[type];

          // Get the evaluation dimensions data for this type
          const dimensionsData = this.evaluationData[key];

          // Create evaluationDimensions array with proper naming
          const evaluationDimensions = [];
          dimensionsData.forEach((dimension, dimensionIndex) => {
            // 确保 evaluationInfos 存在且是数组
            if (dimension.evaluationInfos && Array.isArray(dimension.evaluationInfos)) {
              dimension.evaluationInfos.forEach((info, infoIndex) => {
                // 确保 info 是字符串类型，如果不是则跳过
                if (typeof info !== 'string' || !info || info.trim() === '') {
                  console.warn(`跳过无效的评价维度: ${info}, 类型: ${typeof info}`);
                  return;
                }
                // Use the actual evaluation info text as the key
                const rating = this.ratings[key][dimensionIndex][infoIndex];
                // 确保 rating 是数字类型
                const ratingValue = typeof rating === 'number' ? rating : (typeof rating === 'string' ? parseFloat(rating) : 0);
                evaluationDimensions.push({
                  [info]: String(ratingValue) // 后端期望 Map<String,String>，所以转换为字符串
                });
              });
            } else {
              console.warn(`评价维度 ${dimension.evaluationTitle} 的 evaluationInfos 无效:`, dimension.evaluationInfos);
            }
          });

          // 使用手动输入的总分（如果有），否则使用计算的总分
          const finalScore = this.manualScores[key] !== null && this.manualScores[key] !== undefined 
            ? this.manualScores[key] 
            : this.calculateTotalScore(key);
          
          return {
            evaluationContent: type,
            finished: true,
            evaluationTitle: this.comments[key],
            grade: finalScore,
            evaluationDimensions
          };
        });

        // 确保 stuId 和 reviewerId 是数字类型
        const stuIdNum = typeof this.studentId === 'string' ? parseInt(this.studentId, 10) : this.studentId;
        const reviewerIdNum = typeof this.reviewerId === 'string' ? parseInt(this.reviewerId, 10) : this.reviewerId;
        
        // 验证转换是否成功
        if (isNaN(stuIdNum) || isNaN(reviewerIdNum)) {
          throw new Error(`无效的ID值: studentId=${this.studentId}, reviewerId=${this.reviewerId}`);
        }
        
        const submitData = {
          taskId: this.taskId,
          stuId: stuIdNum, // 确保是数字类型
          evaluationType: {
            evaluationMethod: "互评",
            reviewerId: reviewerIdNum, // 确保是数字类型
            evaluationContents
          }
        };

        // Log the complete submission data
        console.log('Submitting evaluation data:', JSON.stringify(submitData, null, 2));

        // Make the API call
        await submitEvaluation(submitData);

        this.$message.success('评分提交成功！');
        this.$emit('evaluation-submitted');
        setTimeout(() => {
          // 返回上一页
          this.$router.back();

          // 如果需要刷新上一页数据，可以通过路由传参或者vuex来处理
          // 例如：触发父组件的刷新方法
        }, 1500); // 延迟1.5秒后返回，让用户能看到成功提示
      } catch (error) {
        console.error('提交评分失败：', error);
        this.$message.error('提交失败，请重试');
      } finally {
        this.submitting = false;
      }
    },

    initRadarChart(type) {
      const container = this.$refs[`radarContainer-${type}`]?.[0];
      if (!container) return;

      if (this.radarCharts[type]) {
        this.radarCharts[type].dispose();
      }

      this.radarCharts[type] = echarts.init(container);
      this.updateRadarChart(type);
    },

    // 更新图表数据
    // 更新特定类型的雷达图
    updateRadarChart(type) {
      const chart = this.radarCharts[type];
      if (!chart) return;

      const option = {
        title: {
          text: '能力评分雷达图',
          left: 'center',
          top: 10,
          textStyle: {
            fontSize: 14,
            color: '#666'
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            const dimensionName = this.submissionTypes[params.dimensionIndex];
            return `${dimensionName}: ${this.dimensionScores[dimensionName]}分`;
          }
        },
        radar: {
          indicator: this.submissionTypes.map(type => ({
            name: type,
            max: 100
          })),
          shape: 'circle',
          radius: '65%',
          splitNumber: 5,
          name: {
            textStyle: {
              color: '#666',
              fontSize: 12
            }
          },
          splitArea: {
            areaStyle: {
              color: ['#f3f6f9', '#e9ecf2']
            }
          }
        },
        series: [{
          type: 'radar',
          name: '能力评分',
          data: [{
            value: this.submissionTypes.map(type => this.dimensionScores[type]),
            name: '当前评分',
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: {
              width: 2,
              color: '#409EFF'
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                offset: 0,
                color: 'rgba(64, 158, 255, 0.3)'
              }, {
                offset: 1,
                color: 'rgba(64, 158, 255, 0.1)'
              }])
            },
            itemStyle: {
              color: '#409EFF'
            }
          }]
        }]
      };

      chart.setOption(option);
    },
    updateDimensionScore(type) {
      const key = this.typeMapping[type];
      const score = this.calculateTotalScore(key);
      this.$set(this.dimensionScores, type, score);

      // 更新所有tab的雷达图
      Object.keys(this.radarCharts).forEach(chartType => {
        this.updateRadarChart(chartType);
      });
    },
    // 处理评分变化
    handleScoreChange() {
      this.$nextTick(() => {
        // 更新当前激活tab的雷达图
        this.updateRadarChart(this.activeTab);
      });
    },

    getMimeType(typeKey, fileName) {

      const mimeTypes = {
        'video': 'video/mp4',
        'audio': 'audio/mpeg',
        'ppt': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'word': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };

      // 如果是文档类型，检查文件扩展名
      if (typeKey === 'word' || typeKey === 'ppt') {
        if (fileName.toLowerCase().endsWith('.pdf')) {
          return 'application/pdf';
        }
        // 可以添加更多扩展名判断
      }

      return mimeTypes[typeKey] || 'application/octet-stream';
    },

    async loadFiles() {
      try {
        const {data} = await getSubmissionsByStuId(this.studentId);
        if (!data?.rows?.length) {
          throw new Error('No submissions found');
        }

        const currentTask = data.rows.find(task => task.taskId === this.taskId);
        if (!currentTask?.taskInfos) {
          throw new Error(`Task ${this.taskId} not found`);
        }

        // 收集未提交和未完成的类型
        const unsubmittedTypes = [];
        const unfinishedTypes = [];

        for (const type of this.submissionTypes) {
          const typeKey = this.typeMapping[type];

          try {

            const fileInfo = currentTask.taskInfos.find(
              info => info.submissionType === type
            );


            if (!fileInfo || !fileInfo.fileName) {
              unsubmittedTypes.push(type);
              continue;
            }

            if (!fileInfo.finished) {
              unfinishedTypes.push(type);
              continue;
            }

            if (fileInfo.fileName) {
              // 对于视频和音频，在文件下载开始前就设置loading，确保用户能看到加载提示
              if (typeKey === 'video' || typeKey === 'audio') {
                // 先设置loading状态，确保遮罩层立即显示
                this.loading[typeKey] = true;
                // 等待DOM更新，确保加载遮罩立即显示（避免黑屏）
                await this.$nextTick();
              } else {
                // 对于其他类型，在下载开始时设置loading
                this.loading[typeKey] = true;
              }

              const response = await showFile(typeKey, fileInfo.fileName);

              // 根据文件类型设置正确的 MIME 类型
              const mimeType = this.getMimeType(typeKey, fileInfo.fileName);


              // Word 文档特殊处理
              if (typeKey === 'word') {
                this.convertLoading = true;
                try {
                  const result = await mammoth.convertToHtml(
                    {arrayBuffer: response},
                    {
                      styleMap: [
                        "p[style-name='Title'] => h1:fresh",
                        "p[style-name='Heading 1'] => h2:fresh",
                        "p[style-name='Heading 2'] => h3:fresh",
                        "p[style-name='Quote'] => blockquote:fresh",
                        "r[style-name='Strong'] => strong",
                        "r[style-name='Emphasis'] => em"
                      ]
                    }
                  );
                  this.wordContent = result.value;

                  // 仍然创建 Blob，保持与其他文件类型一致的处理逻辑
                  const blob = new Blob([response], {type: mimeType});
                  const url = URL.createObjectURL(blob);
                  this._blobUrls = this._blobUrls || [];
                  this._blobUrls.push(url);
                  this.$set(this.fileUrls, typeKey, url);
                } catch (error) {
                  console.error('Word conversion failed:', error);
                  this.$message.error('Word文档转换失败');
                  this.wordContent = '';
                } finally {
                  this.convertLoading = false;
                }
              } else if (typeKey === 'ppt') {
                // 直接使用PDF数据
                this.pdfData = response;
              } else {
                // 创建 Blob 对象
                const blob = new Blob([response], {type: mimeType});
                const url = URL.createObjectURL(blob);

                // 保存 URL 以便后续清理
                this._blobUrls = this._blobUrls || [];
                this._blobUrls.push(url);

                // 更新视图元素
                const element = this.$refs[`${typeKey}Element`];
                if (element) {
                  // 对于视频和音频，loading状态已经在下载前设置，这里直接设置src
                  if (typeKey === 'video' || typeKey === 'audio') {
                    // 先直接设置element.src（避免Vue响应式更新导致video元素重新渲染出现黑屏）
                    element.src = url;
                    // 再次等待DOM更新，确保element.src的设置已经生效
                    await this.$nextTick();
                    // 然后再更新fileUrls（此时video已经有src了，Vue的更新不会触发重新加载）
                    this.$set(this.fileUrls, typeKey, url);
                  } else {
                    // 其他类型直接设置src和URL
                    element.src = url;
                    this.$set(this.fileUrls, typeKey, url);
                    this.loading[typeKey] = false;
                  }
                  // 对于视频和音频，等待媒体元素加载完成后再关闭loading
                  // loading状态会在 @canplay 事件中关闭
                } else {
                  // 如果没有对应的元素引用，直接更新URL并关闭loading
                  this.$set(this.fileUrls, typeKey, url);
                  this.loading[typeKey] = false;
                }
              }
            }

          } catch (err) {
            console.error(`Error loading ${type} file:`, err);
            this.loading[typeKey] = false;
            // this.$message.error(`${type}文件加载失败`);
          }
          // 注意：视频和音频的loading状态在 @canplay 事件中关闭，不在这里关闭
          if (typeKey !== 'video' && typeKey !== 'audio') {
            this.loading[typeKey] = false;
          }
        }

        // 合并提示信息
        const messages = [];
        if (unsubmittedTypes.length > 0) {
          messages.push(`未提交：${unsubmittedTypes.join('、')}`);
        }
        if (unfinishedTypes.length > 0) {
          messages.push(`未完成：${unfinishedTypes.join('、')}`);
        }

        // 显示合并后的提示
        if (messages.length > 0) {
          this.$message({
            message: messages.join('\n'),
            type: 'warning',
            duration: 5000
          });
        }

      } catch (err) {
        console.error('Error loading submissions:', err);
        // this.$message.error(err.message || 'Failed to load submissions');
      }
    },

    handleFileError(type) {
      this.loading[type] = false;
      // this.$message.error(`${type}文件加载失败`);
    },
    // 清理Blob URLs
    clearBlobUrls() {
      this._blobUrls.forEach(url => URL.revokeObjectURL(url));
      this._blobUrls = [];
    },

    handlePlay() {
      this.isPlaying = true;
    },

    handlePause() {
      this.isPlaying = false;
    },

    // 处理视频加载开始
    handleVideoLoadStart() {
      this.loading.video = true;
    },

    // 处理视频等待缓冲
    handleVideoWaiting() {
      this.loading.video = true;
    },

    // 处理视频可以播放（加载完成）
    handleVideoCanPlay() {
      // 延迟一点关闭loading，确保视频真正可以播放
      this.$nextTick(() => {
        const video = this.$refs.videoElement;
        if (video && video.readyState >= 3) { // HAVE_FUTURE_DATA 或更高
          this.loading.video = false;
        } else {
          // 如果还没准备好，继续等待
          setTimeout(() => {
            this.loading.video = false;
          }, 500);
        }
      });
    },

    // 处理音频加载开始
    handleAudioLoadStart() {
      this.loading.audio = true;
    },

    // 处理音频等待缓冲
    handleAudioWaiting() {
      this.loading.audio = true;
    },

    // 处理音频可以播放（加载完成）
    handleAudioCanPlay() {
      // 延迟一点关闭loading，确保音频真正可以播放
      this.$nextTick(() => {
        const audio = this.$refs.audioElement;
        if (audio && audio.readyState >= 3) { // HAVE_FUTURE_DATA 或更高
          this.loading.audio = false;
        } else {
          // 如果还没准备好，继续等待
          setTimeout(() => {
            this.loading.audio = false;
          }, 500);
        }
      });
    },


  },
  async created() {
    await this.fetchTaskData().then(() => {
      if (!this.activeTab) {
        const firstTab = Object.keys(this.evaluationData)[0];
        this.activeTab = firstTab || "视频";
      }
      // 初始化所有维度分数为0
      this.submissionTypes.forEach(type => {
        this.$set(this.dimensionScores, type, 0);
      });
      this.$nextTick(() => {
        this.initRadarChart(this.activeTab);
      });
    });
    if (this.submissionTypes.length === 0) {
      this.$message.warning('未找到可评价的内容');
      return;
    }

    // 加载已有的互评数据
    await this.loadExistingEvaluation();

    await this.loadFiles();
  },
  beforeDestroy() {
    // 清理所有图表实例
    if (this.radarCharts) {
      Object.keys(this.radarCharts).forEach(type => {
        if (this.radarCharts[type]) {
          this.radarCharts[type].dispose();
        }
      });
    }

    // 清理 blob URLs
    if (this._blobUrls && Array.isArray(this._blobUrls)) {
      this._blobUrls.forEach(url => URL.revokeObjectURL(url));
      this._blobUrls = [];
    }
  }
};
</script>

<style scoped>
.homework-evaluation {
  padding: 20px;
}

.header-row {
  margin-bottom: 20px; /* 减少标题区域与下方内容的间距 */
}

.header {
  display: flex;
  flex-wrap: wrap; /* 允许内容自动换行 */
  justify-content: flex-start; /* 左对齐布局 */
  align-items: center; /* 垂直居中 */
  gap: 30px; /* 缩短每个信息块之间的间距 */
}

.info-text {
  margin-right: 0; /* 去掉多余的右间距 */
  font-size: 12px; /* 缩小字体大小 */
  color: #666; /* 设置灰色字体 */
  white-space: nowrap; /* 防止文本换行 */
}

.submit-all-wrapper {
  display: flex; /* 使用flex布局 */
  justify-content: flex-end; /* 按钮靠右 */
  align-items: center; /* 垂直居中 */
}

.modal-tabs :deep(.el-tabs__nav) {
  border-bottom: none;
}

/* 第一行布局 */
.first-row {
  display: flex;
  gap: 40px;
  margin-bottom: 20px;
}

/* 视频区域 */
.video-section {
  flex: 1;
  max-width: 45%;
}

/* 视频包装器 */
.video-wrapper {
  position: relative;
  width: 100%;
  height: 400px;
  background: #000;
  border-radius: 4px;
  overflow: hidden;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

/* 自定义加载遮罩层 - 非常醒目 */
.custom-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  /* 移除淡入动画，确保遮罩层立即完全不透明，避免任何可能的黑屏 */
  opacity: 1;
}

/* 加载内容容器 */
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

/* 加载动画图标 */
.loading-spinner {
  font-size: 60px;
  color: #409EFF;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 加载文字 */
.loading-text {
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  letter-spacing: 2px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

/* 加载点动画 */
.loading-dots {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}

.loading-dots span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #409EFF;
  animation: bounce 1.4s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.6);
}

.loading-dots span:nth-child(1) {
  animation-delay: 0s;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.7;
  }
  40% {
    transform: translateY(-15px) scale(1.2);
    opacity: 1;
  }
}

.audio-section {
  flex: 1;
  max-width: 45%;
  height: 300px;
}

.audio-player {
  width: 100%;
  margin-top: 0px;
}

.audio-player-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.audio-bg {
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, #409EFF 0%, #53a8ff 100%);
  border-radius: 8px;
  margin-bottom: 20px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.music-icon {
  font-size: 60px;
  color: #fff;
  transition: all 0.3s ease;
}

.music-icon.is-playing {
  animation: rotate 5s linear infinite;
}

.music-notes {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 15px;
}

.music-notes i {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.8);
  animation: float 2s ease-in-out infinite;
}

.music-notes i:nth-child(2) {
  animation-delay: 0.5s;
}

.music-notes i:nth-child(3) {
  animation-delay: 1s;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* 添加波浪动画背景 */
.audio-bg::before {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 20%;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.2) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.2) 75%, transparent 75%, transparent);
  background-size: 20px 20px;
  animation: wave 10s linear infinite;
}

@keyframes wave {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 50px 0;
  }
}


/* 评分维度区域 */
.dimension-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 45%;
}

.dimension-card {
  flex: 1;
  margin: 0;
  height: 300px;
}

.dimension-content {
  height: 300px; /* 固定高度 */
  overflow-y: auto; /* 启用垂直滚动条 */
  padding: 30px;
  border: 1px solid #dcdcdc; /* 添加边框 */
  border-radius: 8px; /* 圆角边框 */
  background-color: #f9f9f9; /* 背景颜色 */
}

/* 自定义滚动条样式（可选） */
.dimension-content::-webkit-scrollbar {
  width: 8px; /* 滚动条宽度 */
}

.dimension-content::-webkit-scrollbar-thumb {
  background: #b3b3b3; /* 滚动条颜色 */
  border-radius: 4px; /* 滚动条圆角 */
}

.dimension-content::-webkit-scrollbar-thumb:hover {
  background: #999; /* 悬停颜色 */
}

.dimension-content::-webkit-scrollbar-track {
  background: #f1f1f1; /* 滚动条轨道颜色 */
}

.dimension-item {
  margin-bottom: 15px;
}

.dimension-title {
  font-weight: bold;
  margin-bottom: 25px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px; /* 增加内容之间的垂直间距 */
}

.info-item span {
  font-size: 12px;
}



/* 第二行布局 */
.second-row {
  display: flex;
  gap: 40px;
}

/* 雷达图区域 */
.radar-section {
  width: 45%;
}

.radar-chart {
  height: 300px;
  margin: 0;
}

/* 评语区域 */
.comment-section {
  flex: 1;
}

.comment-card {
  margin: 0;
}

.comment-input {
  width: 80%;
  margin-bottom: 15px;
}

/* 通用头部样式 */
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  font-weight: bold;
  font-size: 14px;
  border-left: 4px solid #409EFF;
  padding-left: 10px;
}

.section-header i {
  color: #409EFF;
}

/* 评分和提交区域 */
.score-submit {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  font-size: 12px;
}

.score-container {
  display: flex; /* 使用Flex布局 */
  align-items: center; /* 垂直居中对齐 */
  gap: 5px; /* 调整间距为更小的值，例如5px */
}

.score-label {
  font-size: 12px; /* 调整文字大小 */
  line-height: 1; /* 确保文本与输入框垂直居中 */
}

.score-input {
  width: 120px; /* 固定输入框宽度 */
  height: 32px; /* 确保与其他表单元素高度一致 */
  line-height: 1;
  font-size: 12px;
}

.score-unit {
  font-size: 12px; /* 调整文字大小 */
  line-height: 1; /* 确保单位与输入框垂直居中 */
}

/* 移除 el-card 的默认边距 */
:deep(.el-card__body) {
  padding: 15px;
}

/* PPT 展示样式 */
.content-wrapper {
  display: flex;
  height: 100%;
}

.left-section {
  flex: 1; /* 左侧占一半宽度 */
  padding-right: 5px; /* 与右侧分开一点间距 */
  display: flex;
  justify-content: center;
  align-items: center;
}

.ppt-document-section {
  width: 100%;
  height: 100%;
}

.pdf-viewer {
  width: 100%;
  height: 100%;
}

/* 右侧区域 */
.right-section {
  flex: 1; /* 右侧占一半宽度 */
  display: flex;
  flex-direction: column; /* 垂直排列评分维度和评语 */
  gap: 5px; /* 两部分之间的间距 */
}

/* 演讲稿展示样式 */

.word-document-section{
  width: 800px;
  height: 800px; /* 固定高度，可根据需要调整 */
  overflow-y: auto; /* 启用垂直滚动 */
  position: relative;

}
.word-content {
  padding: 20px;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  height:100%;
  box-sizing: border-box;
  overflow-y: auto;
}

.word-content :deep(h1) {
  font-size: 24px;
  margin-bottom: 20px;
  color: #303133;
}

.word-content :deep(h2) {
  font-size: 20px;
  margin: 16px 0;
  color: #303133;
}

.word-content :deep(h3) {
  font-size: 18px;
  margin: 14px 0;
  color: #303133;
}

.word-content :deep(p) {
  margin: 12px 0;
  line-height: 1.6;
  color: #606266;
}

.word-content :deep(blockquote) {
  margin: 16px 0;
  padding: 0 12px;
  color: #666;
  border-left: 4px solid #dcdfe6;
}

.word-content :deep(ul),
.word-content :deep(ol) {
  padding-left: 24px;
  margin: 12px 0;
}

.word-content :deep(li) {
  margin: 6px 0;
  color: #606266;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  background: #f5f7fa;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
}

.preview-placeholder i {
  font-size: 48px;
  color: #909399;
  margin-bottom: 20px;
}

.preview-placeholder p {
  color: #606266;
  margin-bottom: 20px;
}


.radar-chart {
  height: 300px; /* 保持固定高度 */
  margin: 0;
  position: relative;
}

.radar-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

/* 确保echarts容器填充整个card */
.radar-chart :deep(.el-card__body) {
  height: 100%;
  padding: 0;
}

/* 评语区域 */
.comment-area {
  margin-top: 20px;
}

/* element-ui 滚动条样式优化 */
:deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}

:deep(.el-scrollbar__bar.is-horizontal) {
  display: none;
}

.loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
}

.document-frame {
  width: 100%;
  height: 600px; /* 根据页面需求调整 */
  border: none;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  background: #f5f7fa;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
}

.preview-placeholder i {
  font-size: 48px;
  color: #909399;
  margin-bottom: 20px;
}

.preview-placeholder p {
  color: #606266;
  margin-bottom: 20px;
}


/* 响应式处理 */
@media screen and (max-width: 992px) {
  .first-row,
  .second-row {
    flex-direction: column;
  }

  .video-section {
    max-width: 100%;
  }

  .radar-section {
    width: 100%;
  }
}
</style>
