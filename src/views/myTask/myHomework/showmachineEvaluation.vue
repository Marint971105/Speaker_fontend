<template>
  <div class="homework-evaluation">
    <!-- 顶部作业信息栏 -->
    <el-row class="header-row">
      <el-col :span="24">
        <div class="header">
          <span class="info-text">题目：{{ taskDetails.taskName }}</span>
          <span class="info-text">姓名：{{ taskDetails.ownerName }}</span>
          <span class="info-text">评价流程：机评</span>
          <span class="info-text">评分人：评估模型</span>
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
            <div class="video-section" v-loading="loading.video">
              <video
                ref="videoElement"
                controls
                class="video-player"
                :src="fileUrls.video"
                @error="handleFileError('video')"
              ></video>
            </div>

            <!-- 右侧评分维度区域 -->
            <div class="dimension-section">
              <div class="section-header">
                <i class="el-icon-s-operation"></i>
                <span>评价</span>
              </div>
              <el-card class="dimension-card">

                <div class="emotion-score-container">
                  <div class="emotion-icon">
                    <svg class="emotion-svg" viewBox="0 0 100 100">
                      <!-- 底部圆脸 -->
                      <circle cx="50" cy="50" r="45" :fill="getFaceColor" />

                      <!-- 左眼 -->
                      <g class="eye left">
                        <circle cx="35" cy="40" r="5" fill="white" class="eye-open" />
                        <line x1="30" y1="40" x2="40" y2="40"
                              stroke="white"
                              stroke-width="3"
                              class="eye-closed">
                          <animate
                            attributeName="opacity"
                            values="0;0;1;0;0"
                            dur="4s"
                            repeatCount="indefinite"
                            begin="0s;blink.end+3s"
                            id="blink"
                          />
                        </line>
                        <animate
                          attributeName="transform"
                          type="translate"
                          values="0 0; 0 1; 0 0"
                          dur="2s"
                          repeatCount="indefinite"
                          begin="0s"
                        />
                      </g>

                      <!-- 右眼 -->
                      <g class="eye right">
                        <circle cx="65" cy="40" r="5" fill="white" class="eye-open" />
                        <line x1="60" y1="40" x2="70" y2="40"
                              stroke="white"
                              stroke-width="3"
                              class="eye-closed">
                          <animate
                            attributeName="opacity"
                            values="0;0;1;0;0"
                            dur="4s"
                            repeatCount="indefinite"
                            begin="0s;blink.end+3s"
                          />
                        </line>
                        <animate
                          attributeName="transform"
                          type="translate"
                          values="0 0; 0 1; 0 0"
                          dur="2s"
                          repeatCount="indefinite"
                          begin="0s"
                        />
                      </g>

                      <!-- 嘴巴 - 根据分数不同显示不同形状 -->
                      <g v-if="videoScore >= 90">
                        <path d="M 30 60 Q 50 80 70 60"
                              stroke="white"
                              stroke-width="4"
                              fill="none">
                          <animate
                            attributeName="d"
                            values="M 30 60 Q 50 80 70 60;M 30 60 Q 50 82 70 60;M 30 60 Q 50 80 70 60"
                            dur="3s"
                            repeatCount="indefinite"
                          />
                        </path>
                        <g class="stars" v-if="videoScore >= 95">
                          <path d="M85,35 L87,40 L92,40 L88,44 L90,49 L85,46 L80,49 L82,44 L78,40 L83,40 Z"
                                fill="#FFD700">
                            <animate
                              attributeName="opacity"
                              values="0;1;0"
                              dur="2s"
                              repeatCount="indefinite"
                            />
                          </path>
                        </g>
                      </g>
                      <path v-else-if="videoScore >= 80"
                            d="M 30 60 Q 50 75 70 60"
                            stroke="white"
                            stroke-width="4"
                            fill="none">
                        <animate
                          attributeName="d"
                          values="M 30 60 Q 50 75 70 60;M 30 60 Q 50 77 70 60;M 30 60 Q 50 75 70 60"
                          dur="3s"
                          repeatCount="indefinite"
                        />
                      </path>
                      <line v-else-if="videoScore >= 60"
                            x1="30" y1="60" x2="70" y2="60"
                            stroke="white"
                            stroke-width="4">
                        <animate
                          attributeName="y1"
                          values="60;61;60"
                          dur="3s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="y2"
                          values="60;61;60"
                          dur="3s"
                          repeatCount="indefinite"
                        />
                      </line>
                      <path v-else
                            d="M 30 70 Q 50 55 70 70"
                            stroke="white"
                            stroke-width="4"
                            fill="none">
                        <animate
                          attributeName="d"
                          values="M 30 70 Q 50 55 70 70;M 30 70 Q 50 53 70 70;M 30 70 Q 50 55 70 70"
                          dur="3s"
                          repeatCount="indefinite"
                        />
                      </path>
                    </svg>
                  </div>

                  <!-- 分数显示 -->
                  <div class="score-display">
                    <div class="score-number">{{ videoScore }}分</div>
                    <div class="score-text">{{ getLevelText }}</div>
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
                  readonly
                ></el-input>

                <!-- 评分和提交按钮 -->
                <div class="score-submit">
                  <div class="score-container">
                    <span class="score-label">视频总分：</span>
                    <el-input class="score-input" :value="calculateTotalScore('video')" readonly></el-input>
                    <span class="score-unit">分</span>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </div>

        <div v-else-if="type === '音频'" class="tab-content">
          <!-- 第一行：音频和评分维度 -->
          <div class="first-row">
            <!-- 左侧音频播放区域 -->
            <div class="audio-section" v-loading="loading.audio">  <!-- 可以复用video-section的样式 -->
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
                    <div
                      v-for="(info, infoIndex) in dimension.evaluationInfos || []"
                      :key="infoIndex"
                      class="info-item"
                    >
                      <span class="dimension-title">{{ info }}:</span>
                      <span class="score-text">{{ (ratings.audio[index][infoIndex] * 2).toFixed(1) }}分</span>
                    </div>
                  </div>
                </div>
              </el-card>
            </div>
          </div>

          <!-- 第二行：雷达图和评语 -->
          <div class="second-row">
            <div class="audio-comment-section">
              <div class="section-header">
                <i class="el-icon-chat-line-square"></i>
                <span>发音准确度</span>
              </div>
              <el-card class="comment-visualization-card">
                <div class="audio-comment-container">
                  <div class="audio-comment-visualization">
                    <template v-if="comments.audio">
              <span
                v-for="item in parseAudioComment(comments.audio)"
                :key="item.position"
                class="audio-word"
                :style="{
                  color: getColorByScore(item.score),
                  fontSize: '16px',
                  fontWeight: 'bold'
                }"
              >
                {{ item.text }}
              </span>
                    </template>
                  </div>
                </div>
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
                  placeholder=""
                  rows="4"
                  class="comment-input"
                  readonly
                ></el-input>

                <!-- 评分和提交按钮 -->
                <div class="score-submit">
                  <div class="score-container">
                    <span class="score-label">音频总分：</span>
                    <el-input class="score-input" :value="calculateTotalScore('audio')" readonly></el-input>
                    <span class="score-unit">分</span>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </div>

        <div v-else-if="type === 'PPT'" class="tab-content">
          <div class="content-wrapper">
            <!-- 左侧 PPT 展示区域 -->
            <div class="left-section">
              <div class="ppt-document-section" v-loading="loading.ppt">
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
                      <div
                        v-for="(score, index) in ratings.ppt[0] || []"
                        :key="index"
                        class="info-item"
                      >
                        <span class="dimension-title">{{ dimension.evaluationInfos[index] }}</span>
                        <el-rate
                          v-model="ratings.ppt[0][index]"
                          :max="10"
                          disabled
                          show-score
                          text-color="#ff9900"
                        />
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
                    v-model="comments.ppt"
                    rows="4"
                    class="comment-input"
                    readonly
                  />
                  <div class="score-submit">
                    <div class="score-container">
                      <span class="score-label">PPT总分：</span>
                      <el-input 
                        class="score-input" 
                        :value="totalScores.ppt" 
                        readonly
                      />
                      <span class="score-unit">分</span>
                    </div>
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
              <div class="word-document-section"  v-loading="loading.word || convertLoading"
                   element-loading-text="正在转换文档...">
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
                      <div
                        v-for="(info, infoIndex) in dimension.evaluationInfos || []"
                        :key="infoIndex"
                        class="info-item"
                      >
                        <span class="dimension-title" >{{ info }}:</span>
                        <span class="score-text">{{ ratings.word[index][infoIndex] * 2 }}分</span>
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
                    readonly
                  ></el-input>

                  <!-- 评分总分和按钮 -->
                  <div class="score-submit">
                    <div class="score-container">
                      <span class="score-label">演讲稿总分：</span>
                      <el-input class="score-input" :value="calculateTotalScore('word')" readonly></el-input>
                      <span class="score-unit">分</span>
                    </div>
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
import {getEvaluationByTaskIdAndStuId, getTaskInfoById, showFile} from "@/api/myTask/myEvaluation/index";
import { getSubmissionInfoById} from "@/api/myTask/myHomework/machineEvaluation";
import * as echarts from 'echarts';
import { Loading } from 'element-ui';
import mammoth from 'mammoth';
import PdfViewer from './PDFViewer.vue'
export default {
  name: "showmachineEvaluation",
  directives: {
    loading: Loading
  },
  props: {
    taskId: {
      type: String,
      required: true,
    },
    submitId:{
      type: String,
      required: true,
    },
    taskDetails: {
      type: Object,
      required: true,
    }
  },
  data() {
    return {
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
      isPlaying:false,
      pdfData: null,
      fixedTabOrder: ["视频", "音频", "PPT", "演讲稿"],
      audioMetricsMap: {
        'fluency_score': '流利度',
        'integrity_score': '完整度',
        'accuracy_score': '准确度'
      },
      audioMetricsOrder: ['fluency_score', 'integrity_score', 'accuracy_score'], // 保持固定顺序
      totalScores: {
        video: 0,
        audio: 0,
        word: 0,
        ppt: 0
      }
    };
  },
  computed: {
    videoScore() {
      return this.calculateTotalScore('video')
    },
    getLevelText() {
      if (this.videoScore >= 90) return '非常出色！'
      if (this.videoScore >= 80) return '表现优秀！'
      if (this.videoScore >= 60) return '继续加油'
      return '需要改进'
    },
    getFaceColor() {
      if (this.videoScore >= 80) return '#67C23A'  // 绿色
      if (this.videoScore >= 60) return '#E6A23C'  // 黄色
      return '#F56C6C'  // 红色
    },
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


  },
  components: {
    'pdf-viewer': PdfViewer
  },
  methods: {
    // 获取任务信息
    async fetchTaskData() {
      try {
        // 1. 获取评估数据
        const res = await getEvaluationByTaskIdAndStuId(this.taskId, this.taskDetails.ownerId);
        if (!res?.data) {
          this.$message.error('获取评估信息失败');
          return;
        }

        // 2. 找到机评数据
        const machineEvaluation = res.data.evaluationTypes.find(
          type => type.evaluationMethod === "机评"
        );

        if (!machineEvaluation) {
          this.$message.warning('未找到机评数据');
          return;
        }

        // 3. 处理可用的提交类型（按固定顺序过滤）
        const finishedContents = machineEvaluation.evaluationContents.filter(
          content => content.finished
        );
        this.submissionTypes = ['视频', '音频', 'PPT', '演讲稿'].filter(
          type => finishedContents.some(content => content.evaluationContent === type)
        );

        // 4. 初始化评估数据结构
        this.evaluationData = {
          // 视频部分只保留固定的evaluationInfos
          video: [{
            evaluationInfos: ["演讲焦虑程度"]
          }],

          // PPT部分保持不变
          ppt: [{
            evaluationInfos: [""]
          }]
        };

        // 5. 初始化ratings和comments
        this.ratings = {
          video: [[0]],
          audio: [],
          ppt: [],
          word: []
        };

        this.comments = {
          video: '',
          audio: '',
          ppt: '',
          word: ''
        };

        // 6. 处理每个模态的具体数据

        machineEvaluation.evaluationContents.forEach(content => {
          if (!content.finished) return;

          switch (content.evaluationContent) {
            case '视频':
              // 设置5星评分（用于显示星星）
              this.ratings.video = [[content.grade / 20]];

              // 设置总分（使用原始grade）
              this.totalScores = {
                ...this.totalScores,
                video: content.grade || 0
              };

              // 设置评语
              this.comments.video = content.evaluationTitle || '';
              break;

            case '演讲稿':
              if (content.evaluationDimensions) {
                // 设置评价维度
                const dimensions = content.evaluationDimensions.map(dim => {
                  const [title] = Object.keys(dim);
                  return title;
                });

                this.$set(this.evaluationData, 'word', [{
                  evaluationInfos: dimensions
                }]);

                // 设置评分
                this.ratings.word = [content.evaluationDimensions.map(dim => {
                  const score = Number(Object.values(dim)[0]);
                  return score;
                })];
                // 直接使用接口返回的grade作为总分
                this.totalScores = {
                  ...this.totalScores,
                  word: content.grade || 0
                };
                this.comments.word = content.evaluationTitle || '';
              }
              break;

            case '音频':
              if (content.evaluationDimensions) {
                // 设置评价维度
                const dimensions = this.audioMetricsOrder.map(key => this.audioMetricsMap[key]);

                this.$set(this.evaluationData, 'audio', [{
                  evaluationInfos: dimensions
                }]);

                // 设置评分
                const scores = this.audioMetricsOrder.map(key => {
                  const dimension = content.evaluationDimensions.find(dim => key in dim);
                  return dimension ? Number(dimension[key]) : 0;
                });

                this.ratings.audio = [scores];
                // 直接使用接口返回的grade作为总分
                this.totalScores = {
                  ...this.totalScores,
                  audio: content.grade || 0
                };
                this.comments.audio = content.evaluationTitle || '';
              }
              break;

            case 'PPT':
            if (content.evaluationDimensions) {
                // 设置评价维度
                const dimensions = content.evaluationDimensions.map(dim => {
                  const [title] = Object.keys(dim);
                  return title;
                });

                this.$set(this.evaluationData, 'ppt', [{
                  evaluationInfos: dimensions
                }]);

                // 设置评分
                this.ratings.ppt = [content.evaluationDimensions.map(dim => {
                  const score = Number(Object.values(dim)[0]);
                  return score;
                })];
                // 直接使用接口返回的grade作为总分
                this.totalScores = {
                  ...this.totalScores,
                  ppt: content.grade || 0
                };
                this.comments.ppt = content.evaluationTitle || '';
              }
              break;
          }
        });

        // 7. 设置默认激活标签页
        this.activeTab = this.submissionTypes[0] || '';

        // 8. 初始化雷达图
        this.$nextTick(() => {
          this.initRadarChart();
        });

      } catch (error) {
        console.error("获取任务信息失败：", error);
        this.$message.error('获取任务信息失败');
      }
    },

    // 初始化评分数据
    initializeEvaluationData(data) {
      if (!data?.evaluationDimensions) return;

      const evaluation = data.evaluationDimensions.find(
        (item) => item?.evaluationMethods === "自评"
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


    calculateTotalScore(type) {
      // 获取接口返回的总分
      let score = this.totalScores[type] || 0;
      if (type === 'audio' && score !== null) {
        // 把0-5分映射到0-100分，并提高分数
        score = score * 20 + 10;
        // 确保分数不超过100且为整数
        score = Math.min(Math.round(score), 100);
      }
      // 找到对应的中文类型
      const chineseType = Object.keys(this.typeMapping).find(key =>
        this.typeMapping[key] === type
      );

      // 更新dimensionScores和雷达图
      if (chineseType) {
        this.$set(this.dimensionScores, chineseType, score);
        // 更新所有雷达图
        Object.keys(this.radarCharts).forEach(chartType => {
          this.updateRadarChart(chartType);
        });
      }

      return score;
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
        const {data} = await getSubmissionInfoById(this.submitId);
        if (!data?.taskInfos?.length) {
          throw new Error('No submissions found');
        }

        // 从已完成的提交中获取submissionTypes
        const finishedSubmissions = data.taskInfos.filter(info => info.finished);
        const availableTypes = finishedSubmissions.map(info => info.submissionType);
        this.submissionTypes = this.fixedTabOrder.filter(type =>
          availableTypes.includes(type)
        );

        // 处理每个已完成的提交
        for (const fileInfo of finishedSubmissions) {
          const type = fileInfo.submissionType;
          const typeKey = this.typeMapping[type];
          this.loading[typeKey] = true;

          try {
            if (fileInfo.fileName) {
              const response = await showFile(typeKey, fileInfo.fileName);
              const mimeType = this.getMimeType(typeKey, fileInfo.fileName);

              // Word文档特殊处理
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
                this.pdfData = response;
              } else {
                const blob = new Blob([response], {type: mimeType});
                const url = URL.createObjectURL(blob);

                this._blobUrls = this._blobUrls || [];
                this._blobUrls.push(url);

                this.$set(this.fileUrls, typeKey, url);

                const element = this.$refs[`${typeKey}Element`];
                if (element) {
                  element.src = url;
                }
              }
            }
          } catch (err) {
            console.error(`Error loading ${type} file:`, err);
          } finally {
            this.loading[typeKey] = false;
          }
        }


        // 如果有可用的标签页，设置第一个为激活状态
        if (this.submissionTypes.length > 0) {
          this.activeTab = this.submissionTypes[0];
        }

      } catch (err) {
        console.error('Error loading submissions:', err);
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

    handlePlay(){
      this.isPlaying=true;
    },

    handlePause(){
      this.isPlaying = false;
    },

    parseAudioComment(comment) {
      try {
        const parsed = JSON.parse(comment);
        return Object.entries(parsed)
          .map(([key, score]) => {
            const [text, position] = key.split('-');
            return {
              text,
              position: parseInt(position),
              score: parseFloat(score)
            };
          })
          .sort((a, b) => a.position - b.position);
      } catch (error) {
        console.error('解析音频评语失败:', error);
        return [];
      }
    },

    getColorByScore(score) {
      // 将分数限制在0-5之间
      const limitedScore = Math.max(0, Math.min(5, score));

      // 2.5分为中点
      if (limitedScore <= 2.5) {
        // 红到黄的过渡
        const ratio = limitedScore / 2.5;
        const red = 255;
        const green = Math.round(255 * ratio);
        return `rgb(${red}, ${green}, 0)`;
      } else {
        // 黄到绿的过渡
        const ratio = (limitedScore - 2.5) / 2.5;
        const red = Math.round(255 * (1 - ratio));
        const green = 255;
        return `rgb(${red}, ${green}, 0)`;
      }
    }



  },
  async created() {
    this.submissionTypes.forEach(type => {
      this.$set(this.dimensionScores, type, 0);
    });
    await this.fetchTaskData().then(() => {
      if (!this.activeTab) {
        const firstTab = Object.keys(this.evaluationData)[0];
        this.activeTab = firstTab || "视频";
      }

      this.$nextTick(() => {
        this.initRadarChart(this.activeTab);
      });
    });
    await this.loadFiles();
  },
  mounted() {
    console.log(this.$route.query);  // 打印 query 参数
    console.log(this.taskId, this.submitId, this.taskDetails);  // 打印传递的参数
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

.video-player {
  width: 100%;
  height: 400px;
  object-fit: contain;
  background: #000;
}
.audio-section{
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
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
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
  background: linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent);
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
  margin-bottom: 0px;
}
.score-text {
  color:grey;
  font-size: 12px;
}
.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px; /* 增加内容之间的垂直间距 */
}
.info-item span {
  font-size: 14px;
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
  width: 100%;
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
  width: 100px; /* 固定输入框宽度 */
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
.ppt-document-section{
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
  width: 100%;
  height: 600px; /* 固定高度，可根据需要调整 */
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

.audio-comment-section {
  width: 45%;
  height: 100%;
  margin-top: 20px;
  overflow-y: auto; /* 纵向滚动 */
  /* 隐藏滚动条但保持功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}
/* 为Webkit浏览器隐藏滚动条 */
.audio-comment-container::-webkit-scrollbar {
  display: none;
}
.comment-visualization-card {
  padding: 20px;
}

.audio-comment-visualization {
  display: flex;
  flex-wrap: wrap; /* 允许换行 */
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  padding: 20px;
  min-height: 100%;
  row-gap: 20px; /* 行间距 */
}

.audio-word {
  transition: color 0.3s ease;
  margin-right: 10px;
  margin-bottom: 10px;
  line-height: 1.5;
}
/* 防止最后一个词的margin-right产生不必要的空间 */
.audio-word:last-child {
  margin-right: 0;
}

.emotion-score-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.emotion-icon {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

.emotion-svg {
  width: 100%;
  height: 100%;
}

.score-display {
  text-align: center;
}

.score-number {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}

.score-text {
  font-size: 18px;
  color: #666;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.eye-open {
  animation: twinkle 4s infinite;
}

.eye-closed {
  opacity: 0;
}

@keyframes twinkle {
  0%, 90%, 100% {
    transform: scaleY(1);
  }
  95% {
    transform: scaleY(0.1);
  }
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
