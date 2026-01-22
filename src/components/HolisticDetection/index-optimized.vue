<!-- 优化版 HolisticDetection 组件 -->
<template>
  <div class="container">
    <!-- 错误状态 -->
    <div v-if="error" class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      {{ error }}
      <button @click="resetError" class="error-retry-btn">重试</button>
    </div>
    
    <!-- MediaPipe 和 FFmpeg 加载状态 -->
    <div v-else-if="!isMediaPipeReady" class="loading-container">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>正在初始化系统...</p>
        <div class="loading-details">
          <div class="loading-item">
            <span :class="{'loading-done': isMediaPipeReady}">MediaPipe 姿态分析</span>
            <i v-if="isMediaPipeReady" class="fas fa-check"></i>
          </div>
          <div class="loading-item">
            <span :class="{'loading-done': isFFmpegReady}">FFmpeg 音画同步</span>
            <i v-if="isFFmpegReady" class="fas fa-check"></i>
          </div>
        </div>
        <p class="loading-subtitle">首次加载可能需要一些时间，请耐心等待</p>
      </div>
    </div>
    
    <!-- 主要内容 -->
    <div v-else class="content-wrapper">
      <!-- 第一行：录制和分析 -->
      <div class="card-row" :class="{ 'single-analysis': !showRecording && (showPostureAnalysis || showEmotionAnalysis) && !(showPostureAnalysis && showEmotionAnalysis) }">
        <!-- 视频录制区域 - 仅在全模式显示 -->
        <div v-if="showRecording" class="feature-card">
          <div class="card-header">
            <h3><i class="fas fa-video"></i> 视频录制</h3>
            <div class="recording-status">
              <span v-if="!recordingConfirmed && !isProcessingVideo" class="status-badge waiting">等待录制</span>
              <span v-else-if="isProcessingVideo" class="status-badge processing">FFmpeg处理中</span>
              <span v-else class="status-badge ready">录制完成</span>
              
              <!-- 显示录制方案 -->
              <span v-if="isRecording" class="recording-method">
                {{ recordRTC ? 'RecordRTC模式' : 'MediaRecorder模式' }}
              </span>
            </div>
          </div>
          
          <!-- 录制控制 -->
          <div class="recording-controls">
            <button 
              v-if="!cameraActive && !recordingConfirmed"
              @click="startCamera"
              class="btn btn-primary"
              :disabled="isRecording"
            >
              <i class="fas fa-video"></i>
              开启摄像头
            </button>
            
            <button 
              v-if="cameraActive && !isRecording"
              @click="startRecording"
              class="btn btn-record"
            >
              <i class="fas fa-circle"></i>
              开始录制
            </button>
            
            <button 
              v-if="isRecording"
              @click="stopRecording"
              class="btn btn-stop"
            >
              <i class="fas fa-stop"></i>
              停止录制 ({{ recordingTime }}s)
            </button>
            
            <button 
              v-if="cameraActive && !isRecording && !recordingConfirmed"
              @click="stopCamera"
              class="btn btn-secondary"
            >
              <i class="fas fa-video-slash"></i>
              关闭摄像头
            </button>
            
            <!-- 录制完成后的控制 -->
            <template v-if="recordingConfirmed">
              <button 
                @click="playRecordedVideo"
                class="btn btn-primary"
              >
                <i :class="videoRunning ? 'fas fa-pause' : 'fas fa-play'"></i>
                {{ videoRunning ? '暂停' : '播放' }}
              </button>
              
              <button 
                @click="downloadRecordedVideo"
                class="btn btn-download"
              >
                <i class="fas fa-download"></i>
                下载视频
              </button>
              
              <button 
                @click="testVideoSync"
                class="btn btn-test"
              >
                <i class="fas fa-stethoscope"></i>
                测试同步
              </button>
              
              <button 
                @click="clearRecording"
                class="btn btn-danger"
              >
                <i class="fas fa-trash"></i>
                重新录制
              </button>
            </template>
          </div>

          <!-- 视频显示区域 -->
          <div class="video-container">
            <!-- 摄像头预览 -->
            <video
              v-if="cameraActive && !recordedVideoUrl"
              ref="cameraVideo"
              class="video-display camera-preview"
              autoplay
              muted
              playsinline
            />
            
            <!-- 录制的视频 (Video.js) -->
            <video
              v-if="recordedVideoUrl"
              ref="recordedVideo"
              class="video-js vjs-default-skin video-display"
              controls
              preload="auto"
              data-setup="{}"
            ></video>
            
            <!-- 录制状态指示器 -->
            <div v-if="isRecording" class="recording-indicator">
              <div class="recording-dot"></div>
              <span>录制中 {{ recordingTime }}s</span>
            </div>
            
            <!-- 空状态占位符 -->
            <div v-if="!cameraActive && !recordedVideoUrl" class="video-placeholder">
              <i class="fas fa-video"></i>
              <p>点击"开启摄像头"开始录制</p>
            </div>
          </div>
        </div>

        <!-- MediaPipe 分析区域 - 显示姿态和表情分析 -->
        <div v-if="showPostureAnalysis || showEmotionAnalysis" class="feature-card">
          <div class="card-header">
            <h3>
              <i class="fas fa-user"></i> 
              {{ analysisMode === 'posture' ? '专项姿态分析' : 
                 analysisMode === 'emotion' ? '专项表情分析' : '姿态分析' }}
            </h3>
            <div class="processing-status">
              <span v-if="!isMediaPipeActive" class="status-badge waiting">等待启动</span>
              <span v-else class="status-badge active">分析中</span>
            </div>
          </div>
          
          <div class="analysis-controls">
            <button 
              @click="toggleMediaPipe"
              :disabled="!recordingConfirmed"
              class="btn btn-analysis"
            >
              <i :class="isMediaPipeActive ? 'fas fa-pause' : 'fas fa-play'"></i>
              {{ isMediaPipeActive ? '暂停分析' : '开始分析' }}
            </button>
          </div>

          <div class="video-container">
            <canvas 
              ref="outputCanvas" 
              class="analysis-canvas"
              :width="640"
              :height="480"
            />
            <div v-if="!recordingConfirmed" class="video-placeholder">
              <i class="fas fa-chart-line"></i>
              <p>请先录制视频</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 第二行：高级分析功能 -->
      <div class="card-row" :class="{ 'single-analysis': (showAnxietyAnalysis || showAudioAnalysis) && !(showAnxietyAnalysis && showAudioAnalysis) }">
        <!-- 焦虑分析 -->
        <div v-if="showAnxietyAnalysis" class="feature-card">
          <div class="card-header">
            <h3><i class="fas fa-brain"></i> 焦虑分析</h3>
            <div class="analysis-status">
              <span v-if="!anxietyResult && !isAnalyzing" class="status-badge waiting">等待分析</span>
              <span v-else-if="isAnalyzing" class="status-badge analyzing">分析中</span>
              <span v-else class="status-badge completed">分析完成</span>
            </div>
          </div>
          
          <div class="analysis-controls">
            <button 
              @click="analyzeAnxiety"
              :disabled="!recordingConfirmed || isAnalyzing"
              class="btn btn-anxiety"
            >
              <i class="fas fa-brain"></i>
              开始分析
            </button>
          </div>

          <div class="analysis-content">
            <!-- 分析中状态 -->
            <div v-if="isAnalyzing" class="analyzing-state">
              <div class="loading-spinner"></div>
              <p>正在分析焦虑程度...</p>
              <div class="progress-bar">
                <div class="progress" :style="{width: `${analysisProgress}%`}"></div>
              </div>
            </div>
            
            <!-- 分析结果 - 优化后的布局 -->
            <div v-else-if="anxietyResult && !anxietyResult.error" class="anxiety-result-container">
              <!-- 简洁的头部信息 -->
              <div class="anxiety-header">
                <div class="header-info">
                  <div class="analysis-title">
                    <i class="fas fa-brain"></i>
                    <span>焦虑分析</span>
                    <span class="status-indicator">
                      <i class="fas fa-check-circle"></i>
                      分析完成
                    </span>
                  </div>
                  <div class="confidence-display">
                    <span class="confidence-label">置信度</span>
                    <span class="confidence-value">{{ anxietyResult.confidence_score ? anxietyResult.confidence_score.toFixed(1) : '0.0' }}%</span>
                  </div>
                </div>
              </div>

              <!-- 主要内容区域 -->
              <div class="anxiety-main-content">
                <!-- 分数和状态展示 -->
                <div class="anxiety-score-section">
                  <div class="anxiety-score-circle" :class="anxietyLevelClass">
                    <div class="score-inner">
                      <span class="score-value">{{ formattedScore }}</span>
                      <span class="score-label">自信指数</span>
                    </div>
                  </div>
                  <div class="anxiety-status-info">
                    <div class="anxiety-level">
                      <span class="anxiety-level-text" :class="anxietyLevelClass">
                        {{ anxietyLevelText }}
                      </span>
                    </div>
                    <p class="anxiety-description">{{ anxietyDescription }}</p>
                  </div>
                </div>

                <!-- 建议区域 -->
                <div class="anxiety-recommendations">
                  <div class="recommendations-header">
                    <i class="fas fa-lightbulb"></i>
                    <h4>个性化建议</h4>
                  </div>
                  <div class="anxiety-tips-list">
                    <div 
                      v-for="(tip, index) in anxietyTips" 
                      :key="index"
                      class="anxiety-tip-item"
                    >
                      {{ tip }}
                    </div>
                  </div>
                </div>

                <!-- 底部信息 -->
                <div class="anxiety-footer">
                  <div class="analysis-time">
                    <i class="fas fa-clock"></i>
                    <span>分析时间: {{ analysisTime }}</span>
                  </div>
                  <div class="analysis-details">
                    <span>处理时间: {{ anxietyResult.processing_time ? anxietyResult.processing_time.toFixed(2) : '0.00' }}s</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 错误状态 -->
            <div v-else-if="anxietyResult && anxietyResult.error" class="error-result">
              <i class="fas fa-exclamation-triangle"></i>
              <p>{{ anxietyResult.message }}</p>
              <button @click="analyzeAnxiety" class="btn btn-retry">重试分析</button>
            </div>
            
            <!-- 空状态 -->
            <div v-else class="empty-state">
              <i class="fas fa-brain"></i>
              <p>录制视频后点击"开始分析"</p>
            </div>
          </div>
        </div>

        <!-- 音频分析 -->
        <div v-if="showAudioAnalysis" class="feature-card">
          <div class="card-header">
            <h3><i class="fas fa-music"></i> 音频分析</h3>
            <div class="audio-status">
              <span v-if="!isAudioVisualizationActive" class="status-badge waiting">等待启动</span>
              <span v-else class="status-badge active">分析中</span>
            </div>
          </div>
          
          <div class="analysis-controls">
            <button 
              @click="toggleAudioVisualization"
              :disabled="!recordingConfirmed"
              class="btn btn-audio"
            >
              <i :class="isAudioVisualizationActive ? 'fas fa-pause' : 'fas fa-play'"></i>
              {{ isAudioVisualizationActive ? '暂停分析' : '开始分析' }}
            </button>
          </div>

          <div class="audio-content">
            <div v-if="!recordingConfirmed" class="empty-state">
              <i class="fas fa-music"></i>
              <p>录制视频后查看音频频谱</p>
            </div>
            
            <div v-else class="spectrum-display">
              <canvas ref="audioCanvas" class="audio-canvas"></canvas>
              <div v-if="audioAnalysisStats" class="audio-stats">
                <div class="stat">
                  <span>主频率:</span>
                  <span class="value">{{ audioAnalysisStats.dominantFrequency }} Hz</span>
                </div>
                <div class="stat">
                  <span>音量:</span>
                  <span class="value">{{ audioAnalysisStats.volume }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  Holistic,
  POSE_CONNECTIONS,
  FACEMESH_TESSELATION,
  FACEMESH_RIGHT_EYE,
  FACEMESH_LEFT_EYE,
  FACEMESH_FACE_OVAL
} from '@mediapipe/holistic'

import {
  drawConnectors,
  drawLandmarks
} from '@mediapipe/drawing_utils'

import axios from 'axios'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'
import RecordRTC from 'recordrtc'

export default {
  name: 'HolisticDetectionOptimized',
  
  props: {
    // 预加载的视频对象
    preloadedVideo: {
      type: Object,
      default: null
    },
    // 分析模式：'posture', 'emotion', 'anxiety', 'audio', 'all'
    analysisMode: {
      type: String,
      default: 'all'
    },
    // 是否自动开始分析
    autoStart: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    console.log('🔍 [DEBUG] HolisticDetection data() 开始初始化')
    console.log('🔍 [DEBUG] 当前环境:', process.env.NODE_ENV)
    console.log('🔍 [DEBUG] 所有环境变量:', {
      NODE_ENV: process.env.NODE_ENV,
      VUE_APP_ANALYSIS_API: process.env.VUE_APP_ANALYSIS_API,
      BASE_URL: process.env.BASE_URL,
      VUE_APP_BASE_URL: process.env.VUE_APP_BASE_URL
    })
    
    const apiBaseUrl = process.env.VUE_APP_ANALYSIS_API || '/analysis-api'
    console.log('🔍 [DEBUG] 计算得到的 apiBaseUrl:', apiBaseUrl)
    console.log('🔍 [DEBUG] apiBaseUrl 类型:', typeof apiBaseUrl)
    console.log('🔍 [DEBUG] 当前页面 URL:', window.location.href)
    console.log('🔍 [DEBUG] 当前页面协议:', window.location.protocol)
    console.log('🔍 [DEBUG] 当前页面主机:', window.location.host)
    
    return {
      // MediaPipe 相关
      holistic: null,
      isMediaPipeReady: false,
      isMediaPipeActive: false,
      
      // 录制相关 - 简化版本
      cameraActive: false,
      isRecording: false,
      recordingTime: 0,
      recordingTimer: null,

      recordingConfirmed: false,
      
      // 流和录制器
      cameraStream: null,
      mediaRecorder: null, // 保留用于兼容性
      recordRTC: null,     // 🎬 RecordRTC实例
      recordedChunks: [],
      recordedVideoUrl: null,
      
      // 视频播放状态
      videoRunning: false,
      
      // Video.js 实例
      videoPlayer: null,
      
      // FFmpeg 实例
      ffmpeg: null,
      isFFmpegReady: false,
      isProcessingVideo: false,
      
      // 焦虑分析
      isAnalyzing: false,
      analysisProgress: 0,
      anxietyResult: null,
      analysisTime: '',
      // apiBaseUrl: 'http://10.120.48.67:8000',
      apiBaseUrl: apiBaseUrl,
      // 音频分析
      audioContext: null,
      audioSource: null,
      audioAnalyser: null,
      audioCanvasCtx: null,
      audioDataArray: null,
      isAudioVisualizationActive: false,
      audioAnimationFrameId: null,
      audioAnalysisStats: null,
      currentAudioVideo: null, // 跟踪当前连接的视频元素
      
      // 时长异常视频监控
      infinityDurationMonitor: null,
      
      // 错误状态
      error: null
    }
  },
  
  computed: {
    // 根据分析模式控制显示的内容
    showRecording() {
      return this.analysisMode === 'all'
    },
    showPostureAnalysis() {
      return this.analysisMode === 'all' || this.analysisMode === 'posture'
    },
    showEmotionAnalysis() {
      return this.analysisMode === 'all' || this.analysisMode === 'emotion'
    },
    showAnxietyAnalysis() {
      return this.analysisMode === 'all' || this.analysisMode === 'anxiety'
    },
    showAudioAnalysis() {
      return this.analysisMode === 'all' || this.analysisMode === 'audio'
    },
    
    // 焦虑分析计算属性 - 根据prediction值优化显示
    formattedScore() {
      if (!this.anxietyResult || this.anxietyResult.error) return '0';
      // 使用confidence_score作为显示分数，分数越高代表越自信不焦虑
      return this.anxietyResult.confidence_score ? this.anxietyResult.confidence_score.toFixed(1) : '0';
    },
    anxietyLevelClass() {
      if (!this.anxietyResult || this.anxietyResult.error) return '';
      
      // 根据prediction值判断焦虑等级
      const prediction = this.anxietyResult.prediction;
      
      if (prediction === 0) {
        return 'level-excellent'; // 非常自信
      } else if (prediction === 1) {
        return 'level-good'; // 轻微焦虑
      } else if (prediction === 2) {
        return 'level-medium'; // 中度焦虑
      } else if (prediction === 3) {
        return 'level-warning'; // 较严重焦虑
      } else if (prediction === 4) {
        return 'level-danger'; // 严重焦虑
      } else {
        return 'level-unknown';
      }
    },
    anxietyLevelText() {
      if (!this.anxietyResult || this.anxietyResult.error) return '未知';
      
      // 根据prediction值显示对应的文本
      const prediction = this.anxietyResult.prediction;
      const predictionTexts = {
        0: '非常自信（无焦虑）',
        1: '轻微焦虑',
        2: '中度焦虑',
        3: '较严重焦虑',
        4: '严重焦虑'
      };
      
      return predictionTexts[prediction] || '未知';
    },
    anxietyDescription() {
      if (!this.anxietyResult || this.anxietyResult.error) return '';
      
      const prediction = this.anxietyResult.prediction;
      const confidenceScore = this.anxietyResult.confidence_score;
      
      const descriptions = {
        0: `分析结果显示您在演讲过程中非常自信，完全没有焦虑表现，演讲状态极佳。`,
        1: `分析结果显示您在演讲过程中存在轻微焦虑，整体表现良好，仅有轻微紧张。`,
        2: `分析结果显示您在演讲过程中存在中度焦虑，可能影响部分表现，需要适当调整。`,
        3: `分析结果显示您在演讲过程中存在较严重焦虑，明显影响演讲效果，建议采取改善措施。`,
        4: `分析结果显示您在演讲过程中存在严重焦虑，严重影响演讲表现，需要重点关注和改善。`
      };
      
      return descriptions[prediction] || '分析结果异常，请重试。';
    },
    anxietyTips() {
      if (!this.anxietyResult || this.anxietyResult.error) return [];
      
      const prediction = this.anxietyResult.prediction;
      
      const tipsByLevel = {
        0: [
          '🎉 恭喜！您的演讲状态非常优秀',
          '💡 可以尝试挑战更高难度的演讲内容',
          '🌟 考虑增加与听众的互动环节',
          '📚 可以分享更多个人经验和故事',
          '🎯 尝试在演讲中加入更多创意元素'
        ],
        1: [
          '😌 演讲前进行简单的深呼吸练习',
          '🎵 听一些轻松的音乐缓解紧张',
          '💪 增加演讲彩排次数增强信心',
          '👥 多与朋友练习演讲技巧',
          '🌱 保持积极的心态和自信'
        ],
        2: [
          '🧘 演讲前进行5-10分钟冥想放松',
          '🫁 练习正念呼吸，缓解紧张情绪',
          '😄 可考虑适当的幽默缓解紧张氛围',
          '🏠 提前熟悉演讲环境减少不确定性',
          '⏸️ 演讲中允许自己短暂停顿，不必急于填满每一秒'
        ],
        3: [
          '🆘 建议寻求专业演讲指导',
          '🧠 学习压力管理和放松技巧',
          '📖 阅读演讲技巧相关书籍',
          '🎭 从简单的演讲场景开始练习',
          '💊 考虑咨询心理医生或专业教练',
          '🏃 通过运动释放压力和紧张情绪'
        ],
        4: [
          '🚨 强烈建议寻求专业帮助',
          '👨‍⚕️ 咨询心理医生或专业治疗师',
          '📚 系统学习焦虑管理技巧',
          '🏥 考虑参加焦虑管理课程',
          '🤝 寻找演讲伙伴或支持小组',
          '⏰ 给自己充足的时间来改善',
          '💝 记住：改善需要时间和耐心'
        ]
      };
      
      return tipsByLevel[prediction] || ['请重试分析'];
    }
  },
  
  watch: {
    // 监听预加载视频的变化
    preloadedVideo: {
      handler(newVideo) {
        if (newVideo) {
          this.loadPreloadedVideo()
        }
      },
      immediate: true,
      deep: true
    }
  },
  
  async mounted() {
    console.log('🔍 [DEBUG] HolisticDetection mounted() 开始')
    console.log('🔍 [DEBUG] mounted() 时的 apiBaseUrl:', this.apiBaseUrl)
    console.log('🔍 [DEBUG] mounted() 时的环境变量:', {
      VUE_APP_ANALYSIS_API: process.env.VUE_APP_ANALYSIS_API,
      NODE_ENV: process.env.NODE_ENV
    })
    
    try {
      // 并行初始化 MediaPipe 和 FFmpeg
      await Promise.all([
        this.initializeHolistic(),
        this.initializeFFmpeg()
      ])
      
      // 如果有预加载的视频，设置并自动开始分析
      if (this.preloadedVideo) {
        this.loadPreloadedVideo()
      }
    } catch (err) {
      this.error = '初始化失败: ' + err.message
      console.error('初始化失败:', err)
    }
  },
  
  beforeDestroy() {
    this.cleanup()
    // 销毁 Video.js 实例
    if (this.videoPlayer) {
      this.videoPlayer.dispose()
      this.videoPlayer = null
    }
  },
  
  methods: {
    // 加载预设视频
    loadPreloadedVideo() {
      console.log('加载预设视频:', this.preloadedVideo)
      
      if (this.preloadedVideo && this.preloadedVideo.url) {
        this.recordedVideoUrl = this.preloadedVideo.url
        this.recordingConfirmed = true
        
        // 等待DOM更新后初始化Video.js播放器
        this.$nextTick(async () => {
          await this.initializeVideoPlayer()
          
          // 如果设置了自动开始，则自动启动分析
          if (this.autoStart) {
            // 启动视频播放
            if (this.videoPlayer && !this.videoRunning) {
              this.videoPlayer.play()
              this.videoRunning = true
            }
            
            setTimeout(() => {
              this.autoStartAnalysis()
            }, 1000) // 延迟启动分析，确保视频开始播放
          }
        })
        
        // 触发分析完成事件，让父组件知道视频已加载
        this.$emit('videoLoaded', this.preloadedVideo)
      }
    },
    
    // 根据分析模式自动启动对应的分析
    autoStartAnalysis() {
      console.log('自动启动分析，模式:', this.analysisMode)
      
      switch (this.analysisMode) {
        case 'posture':
        case 'emotion':
          if (this.toggleMediaPipe) {
            setTimeout(() => this.toggleMediaPipe(), 500)
          }
          break
        case 'anxiety':
          if (this.analyzeAnxiety) {
            setTimeout(() => this.analyzeAnxiety(), 500)
          }
          break
        case 'audio':
          if (this.toggleAudioVisualization) {
            setTimeout(() => this.toggleAudioVisualization(), 500)
          }
          break
        case 'all':
          // 全模式时不自动启动，让用户选择
          break
      }
    },
    
    // MediaPipe 初始化 (保持原有逻辑)
    async initializeHolistic() {
      try {
        this.holistic = new Holistic({
          locateFile: (file) => {
            const basePath = process.env.NODE_ENV === 'production' 
              ? `${process.env.BASE_URL}mediapipe/`
              : '/mediapipe/'
            return `${basePath}${file}`
          }
        })

        await this.holistic.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: true,
          refineFaceLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        })

        this.holistic.onResults((results) => {
          this.onResults(results)
        })

        this.isMediaPipeReady = true
      } catch (err) {
        console.error('初始化 MediaPipe 失败:', err)
        throw new Error('您的浏览器不支持所需的功能，请使用最新版本的 Chrome/Firefox/Edge 浏览器')
      }
    },
    
    // 🎬 初始化 FFmpeg (适配0.10.x版本)
    async initializeFFmpeg() {
      try {
        console.log('🎬 开始初始化 FFmpeg.wasm...')
        
        // 使用0.10.x版本API创建FFmpeg实例
        this.ffmpeg = createFFmpeg({
          log: true,
          corePath: 'https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js',
        })
        
        // 加载FFmpeg
        await this.ffmpeg.load()
        
        this.isFFmpegReady = true
        console.log('✅ FFmpeg.wasm 初始化成功')
        
      } catch (error) {
        console.error('❌ FFmpeg 初始化失败:', error)
        this.isFFmpegReady = false
        // FFmpeg初始化失败不影响其他功能
        console.warn('⚠️ FFmpeg功能不可用，将跳过音画同步处理')
      }
    },
    
    // 简化的录制方法
    async startCamera() {
      try {
        this.error = null
        this.cameraActive = true
        
        await this.$nextTick()
        
        // 检查摄像头可用性
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('您的浏览器不支持摄像头功能')
        }
        
        // 添加超时控制
        const timeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('摄像头启动超时，请检查设备或权限')), 10000) // 10秒超时
        })
        
        // 🔧 多级降级配置策略（兼容老框架）
        const cameraConfigs = [
          // 高质量配置
          {
            video: {
              width: { ideal: 1280, min: 640, max: 1920 },
              height: { ideal: 720, min: 480, max: 1080 },
              facingMode: 'user',
              frameRate: { ideal: 30, min: 15 }
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          },
          // 中等质量配置  
          {
            video: {
              width: { ideal: 960, min: 480 },
              height: { ideal: 540, min: 360 },
              facingMode: 'user'
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true
            }
          },
          // 基础配置
          {
            video: {
              width: 640,
              height: 480,
              facingMode: 'user'
            },
            audio: true
          },
          // 最低配置（只有视频）
          {
            video: true,
            audio: false
          }
        ]
        
        let stream = null
        let lastError = null
        
        console.log('📷 开始尝试启动摄像头...')
        
        // 尝试不同配置直到成功
        for (let i = 0; i < cameraConfigs.length; i++) {
          try {
            console.log(`尝试摄像头配置 ${i + 1}/${cameraConfigs.length}:`, cameraConfigs[i])
            
            const getUserMediaPromise = navigator.mediaDevices.getUserMedia(cameraConfigs[i])
            stream = await Promise.race([getUserMediaPromise, timeout])
            
            console.log('✅ 摄像头启动成功，配置:', cameraConfigs[i])
            break
            
          } catch (error) {
            lastError = error
            console.warn(`⚠️ 配置 ${i + 1} 失败:`, error.message)
            
            // 如果是权限被拒绝，直接抛出错误
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
              throw new Error('摄像头权限被拒绝，请在浏览器设置中允许访问摄像头')
            }
            
            // 如果是设备不存在，直接抛出错误
            if (error.name === 'NotFoundError' || error.name === 'DeviceNotFoundError') {
              throw new Error('未找到摄像头设备，请检查摄像头是否正确连接')
            }
            
            // 继续尝试下一个配置
            continue
          }
        }
        
        if (!stream) {
          throw lastError || new Error('无法启动摄像头，已尝试所有配置')
        }
        
        // 检查设备信息
        const videoTrack = stream.getVideoTracks()[0]
        const audioTrack = stream.getAudioTracks()[0]
        
        if (videoTrack) {
          const settings = videoTrack.getSettings()
          console.log('📹 摄像头设备信息:', {
            label: videoTrack.label,
            width: settings.width,
            height: settings.height,
            frameRate: settings.frameRate,
            facingMode: settings.facingMode
          })
        }
        
        if (audioTrack) {
          const audioSettings = audioTrack.getSettings()
          console.log('🎤 音频设备信息:', {
            label: audioTrack.label,
            sampleRate: audioSettings.sampleRate,
            channelCount: audioSettings.channelCount
          })
        }
        
        this.cameraStream = stream
        
        const video = this.$refs.cameraVideo
        if (video) {
          video.srcObject = stream
        }
        
        this.$message?.({
          message: '摄像头已开启',
          type: 'success'
        })
        
      } catch (error) {
        console.error('开启摄像头失败:', error)
        this.error = '无法访问摄像头: ' + error.message
        this.cameraActive = false
        
        // 提供详细的解决建议
        if (error.message.includes('权限')) {
          this.error = '摄像头权限被拒绝。请点击地址栏的摄像头图标，选择"始终允许"'
        } else if (error.message.includes('占用') || error.message.includes('busy')) {
          this.error = '摄像头正被其他应用使用。请关闭其他使用摄像头的程序后重试'
        } else if (error.message.includes('超时')) {
          this.error = '摄像头启动超时。请检查摄像头连接，或尝试重启浏览器'
        } else if (error.message.includes('设备')) {
          this.error = '未找到摄像头设备。请检查摄像头是否正确连接'
        }
      }
    },
    
    // 🎬 使用RecordRTC进行高质量录制（解决时间戳问题）
    async startRecording() {
      if (!this.cameraStream) {
        this.$message?.({
          message: '请先开启摄像头',
          type: 'warning'
        })
        return
      }
      
      try {
        console.log('🎬 开始RecordRTC录制...')
        this.error = null
        this.recordedChunks = []
        
        // 检查摄像头流状态
        const videoTrack = this.cameraStream.getVideoTracks()[0]
        const audioTrack = this.cameraStream.getAudioTracks()[0]
        console.log('📹 摄像头状态:', {
          video: videoTrack ? videoTrack.readyState : '无',
          audio: audioTrack ? audioTrack.readyState : '无',
          videoSettings: videoTrack ? videoTrack.getSettings() : null
        })
        
        // 🎯 简化的RecordRTC配置（兼容老框架）
        const options = {
          type: 'video',
          // 🔧 不强制MP4，让RecordRTC自动选择最兼容的格式
          // mimeType: 'video/mp4',  
          videoBitsPerSecond: 1000000,  // 降低比特率提高兼容性
          audioBitsPerSecond: 64000,    // 降低音频比特率
          // 🎬 简化配置，避免复杂选项导致的兼容性问题
          disableLogs: false,
          checkForInactiveTracks: false,  // 关闭可能导致问题的检查
          // 让RecordRTC自动选择最佳录制器类型
          // recorderType: RecordRTC.MediaStreamRecorder,
        }
        
        // 🔍 检查RecordRTC兼容性
        console.log('🔍 RecordRTC兼容性检查:', {
          RecordRTCAvailable: typeof RecordRTC !== 'undefined',
          version: RecordRTC.version,
          MediaRecorderSupported: typeof MediaRecorder !== 'undefined',
          getUserMediaSupported: !!navigator.mediaDevices?.getUserMedia,
          webkitGetUserMediaSupported: !!navigator.webkitGetUserMedia,
          mozGetUserMediaSupported: !!navigator.mozGetUserMedia
        })
        
        // 检查浏览器API支持
        const browserInfo = {
          userAgent: navigator.userAgent,
          webkitSupport: !!window.webkitRTCPeerConnection,
          mozSupport: !!window.mozRTCPeerConnection,
          msSupport: !!window.RTCPeerConnection
        }
        console.log('🌐 浏览器兼容性:', browserInfo)
        
        // 尝试创建RecordRTC实例，失败时使用备用方案
        try {
          this.recordRTC = new RecordRTC(this.cameraStream, options)
          
          console.log('🎙️ RecordRTC 创建成功:', {
            version: RecordRTC.version,
            type: options.type,
            state: this.recordRTC.getState?.()
          })
          
          // 配置RecordRTC事件
          this.recordRTC.onStateChanged = (state) => {
            console.log('🔄 RecordRTC 状态变化:', state)
          }
          
          // 开始RecordRTC录制
          this.recordRTC.startRecording()
          this.isRecording = true
          this.recordingTime = 0
          
          this.recordingTimer = setInterval(() => {
            this.recordingTime++
            console.log(`⏱️ RecordRTC录制进行中: ${this.recordingTime}秒`)
          }, 1000)
          
          console.log('✅ RecordRTC录制已开始')
          
          this.$message?.({
            message: '开始录制 (RecordRTC兼容模式)',
            type: 'success',
            duration: 2000
          })
          
        } catch (recordRTCError) {
          console.warn('⚠️ RecordRTC失败，切换到备用录制方案:', recordRTCError.message)
          
          // 🔄 备用方案：使用优化的原生MediaRecorder
          await this.startFallbackRecording()
        }
        
      } catch (error) {
        console.error('❌ 录制启动失败:', error)
        this.handleRecordingError(error)
      }
    },
    
    // 🔄 备用录制方案（优化的原生MediaRecorder，兼容老框架）
    async startFallbackRecording() {
      try {
        console.log('🔄 启动备用录制方案...')
        
        // 🎯 针对老框架优化的MediaRecorder配置
        const supportedMimeTypes = [
          'video/webm;codecs=vp8,opus',    // 最广泛支持
          'video/webm;codecs=vp9,opus',    // 较新浏览器
          'video/webm',                    // 基础支持
          'video/mp4',                     // 如果支持的话
        ]
        
        let selectedMimeType = 'video/webm' // 默认
        for (const mimeType of supportedMimeTypes) {
          if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mimeType)) {
            selectedMimeType = mimeType
            console.log('✅ 选择录制格式:', mimeType)
            break
          }
        }
        
        // 简化的MediaRecorder配置（兼容性优先）
        const mediaRecorderOptions = {
          mimeType: selectedMimeType,
          videoBitsPerSecond: 800000,   // 较低比特率确保兼容性
          audioBitsPerSecond: 64000     // 较低音频比特率
        }
        
        console.log('🎙️ 备用录制配置:', mediaRecorderOptions)
        
        this.recordedChunks = []
        this.mediaRecorder = new MediaRecorder(this.cameraStream, mediaRecorderOptions)
        
        // 配置事件处理
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            this.recordedChunks.push(event.data)
            console.log(`📦 备用录制数据块 #${this.recordedChunks.length}: ${this.formatFileSize(event.data.size)}`)
          }
        }
        
        this.mediaRecorder.onstop = async () => {
          console.log('🛑 备用录制停止，开始处理数据...')
          await new Promise(resolve => setTimeout(resolve, 100)) // 短暂等待
          await this.processFallbackRecording()
        }
        
        this.mediaRecorder.onerror = (error) => {
          console.error('❌ 备用录制错误:', error)
          this.handleRecordingError(error)
        }
        
        // 开始录制（较长的时间片，提高兼容性）
        this.mediaRecorder.start(500) // 每500ms收集一次
        this.isRecording = true
        this.recordingTime = 0
        
        this.recordingTimer = setInterval(() => {
          this.recordingTime++
          console.log(`⏱️ 备用录制进行中: ${this.recordingTime}秒, 已收集 ${this.recordedChunks.length} 个数据块`)
        }, 1000)
        
        console.log('✅ 备用录制已开始')
        
        this.$message?.({
          message: `开始录制 (兼容模式: ${selectedMimeType})`,
          type: 'success',
          duration: 2000
        })
        
      } catch (error) {
        console.error('❌ 备用录制方案也失败了:', error)
        throw error
      }
    },
    
    // 🎬 智能停止录制（支持RecordRTC和备用方案）
    stopRecording() {
      if (!this.isRecording) {
        console.warn('⚠️ 当前没有进行录制')
        return
      }
      
      this.isRecording = false
      
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer)
        this.recordingTimer = null
      }
      
      // 判断使用的录制方案
      if (this.recordRTC) {
        // RecordRTC方案
        console.log('🛑 停止RecordRTC录制...')
        console.log('📊 RecordRTC状态:', {
          recordingTime: this.recordingTime,
          recordRTCState: this.recordRTC.getState()
        })
        
        this.recordRTC.stopRecording(async () => {
          console.log('🛑 RecordRTC 录制停止，开始处理数据...')
          await this.processRecordRTCVideo()
        })
        
        console.log('✅ RecordRTC停止命令已发送...')
        
      } else if (this.mediaRecorder) {
        // 备用MediaRecorder方案
        console.log('🛑 停止备用录制...')
        console.log('📊 备用录制状态:', {
          recordingTime: this.recordingTime,
          chunksCollected: this.recordedChunks.length,
          mediaRecorderState: this.mediaRecorder.state
        })
        
        this.mediaRecorder.stop()
        console.log('✅ 备用录制停止命令已发送，等待处理...')
        
      } else {
        console.warn('⚠️ 无法停止录制：没有找到活跃的录制实例')
        this.$message?.({
          message: '录制状态异常，请刷新页面重试',
          type: 'warning'
        })
      }
    },
    
    // 🎬 处理RecordRTC录制的视频（解决时间戳问题）
    async processRecordRTCVideo() {
      try {
        console.log('🎬 开始处理RecordRTC录制数据...')
        
        if (!this.recordRTC) {
          throw new Error('RecordRTC实例不存在')
        }
        
        // 获取RecordRTC录制的blob
        const recorderBlob = this.recordRTC.getBlob()
        console.log('📁 RecordRTC录制文件大小:', this.formatFileSize(recorderBlob.size))
        console.log('📄 RecordRTC录制格式:', recorderBlob.type)
        
        let finalBlob = recorderBlob
        
        // 🎬 如果需要，可以使用FFmpeg进一步优化（通常RecordRTC已经处理好了时间戳）
        if (this.isFFmpegReady && recorderBlob.size > 0) {
          console.log('🎬 使用FFmpeg进行额外优化...')
          try {
            finalBlob = await this.processVideoWithFFmpeg(recorderBlob, recorderBlob.type)
            console.log('✅ FFmpeg额外优化完成')
          } catch (error) {
            console.warn('⚠️ FFmpeg额外优化失败，使用RecordRTC原始录制:', error.message)
            finalBlob = recorderBlob // 使用原始录制
          }
        } else {
          console.log('✅ 直接使用RecordRTC录制结果（已优化时间戳）')
        }
        
        // 清理旧的 URL
        if (this.recordedVideoUrl) {
          URL.revokeObjectURL(this.recordedVideoUrl)
        }
        
        // 创建视频 URL
        this.recordedVideoUrl = URL.createObjectURL(finalBlob)
        console.log('🔗 视频 URL 创建成功')
        
        // 等待 DOM 更新
        await this.$nextTick()
        
        // 初始化 Video.js 实例
        await this.initializeVideoPlayer()
        
        // 设置状态
        this.recordingConfirmed = true
        this.stopCamera()
        
                 // 清理RecordRTC实例
         if (this.recordRTC) {
           try {
             this.recordRTC.destroy()
             console.log('✅ RecordRTC实例已销毁')
           } catch (e) {
             console.warn('⚠️ RecordRTC销毁时出现警告:', e.message)
           }
           this.recordRTC = null
         }
        
        console.log('✅ RecordRTC录制处理完成')
        
        this.$message?.({
          message: `录制成功！时长: ${this.recordingTime}秒, 大小: ${this.formatFileSize(finalBlob.size)}`,
          type: 'success',
          duration: 3000
        })
        
      } catch (error) {
        console.error('❌ RecordRTC录制处理失败:', error)
        this.handleRecordingError(error)
             }
     },
     
     // 🔄 处理备用录制的数据（兼容老框架）
     async processFallbackRecording() {
       try {
         console.log('🔄 开始处理备用录制数据...')
         
         if (this.recordedChunks.length === 0) {
           throw new Error('没有录制到数据')
         }
         
         // 获取MIME类型
         const mimeType = this.mediaRecorder?.mimeType || 'video/webm'
         console.log('📦 备用录制数据:', this.recordedChunks.length, '个数据块, 格式:', mimeType)
         
         // 创建录制的 blob
         let recorderBlob = new Blob(this.recordedChunks, { type: mimeType })
         console.log('📁 备用录制文件大小:', this.formatFileSize(recorderBlob.size))
         
         let finalBlob = recorderBlob
         
         // 🎬 对于老框架，只有在WebM格式且FFmpeg可用时才进行转换
         if (this.isFFmpegReady && mimeType.includes('webm') && recorderBlob.size > 0) {
           console.log('🎬 WebM格式检测到，尝试FFmpeg优化...')
           try {
             finalBlob = await this.processVideoWithFFmpeg(recorderBlob, mimeType)
             console.log('✅ FFmpeg优化完成，可能改善兼容性')
           } catch (error) {
             console.warn('⚠️ FFmpeg优化失败，使用原始录制:', error.message)
             finalBlob = recorderBlob // 使用原始录制
           }
         } else {
           console.log('✅ 直接使用备用录制结果')
           if (!this.isFFmpegReady) {
             console.log('ℹ️ FFmpeg不可用，跳过后处理')
           }
         }
         
         // 清理旧的 URL
         if (this.recordedVideoUrl) {
           URL.revokeObjectURL(this.recordedVideoUrl)
         }
         
         // 创建视频 URL
         this.recordedVideoUrl = URL.createObjectURL(finalBlob)
         console.log('🔗 视频 URL 创建成功')
         
         // 等待 DOM 更新
         await this.$nextTick()
         
         // 初始化 Video.js 实例
         await this.initializeVideoPlayer()
         
         // 设置状态
         this.recordingConfirmed = true
         this.stopCamera()
         
         // 清理录制数据
         this.recordedChunks = []
         this.mediaRecorder = null
         
         console.log('✅ 备用录制处理完成')
         
         this.$message?.({
           message: `备用录制成功！格式: ${mimeType.includes('webm') ? 'WebM' : 'MP4'}, 时长: ${this.recordingTime}秒`,
           type: 'success',
           duration: 3000
         })
         
       } catch (error) {
         console.error('❌ 备用录制处理失败:', error)
         this.handleRecordingError(error)
       }
     },
         
         // 🆕 简洁的录制处理方法（参考示例）
    async processRecordingSimple() {
      try {
        console.log('🎬 开始简洁录制处理...')
        
        if (this.recordedChunks.length === 0) {
          throw new Error('没有录制到数据')
        }
        
        const mimeType = this.mediaRecorder?.mimeType || 'video/webm'
        console.log('📦 录制数据:', this.recordedChunks.length, '个数据块, 格式:', mimeType)
        
        // 创建录制的 blob
        let recorderBlob = new Blob(this.recordedChunks, { type: mimeType })
        console.log('📁 原始录制文件大小:', this.formatFileSize(recorderBlob.size))
        
        // 🎬 使用FFmpeg进行音画同步处理（如果可用）
        if (this.isFFmpegReady) {
          console.log('🎬 开始FFmpeg音画同步处理...')
          try {
            recorderBlob = await this.processVideoWithFFmpeg(recorderBlob, mimeType)
            console.log('✅ FFmpeg音画同步处理完成')
          } catch (error) {
            console.warn('⚠️ FFmpeg处理失败，使用原始录制:', error.message)
            // 处理失败时继续使用原始录制
          }
        } else {
          console.log('⚠️ FFmpeg不可用，跳过音画同步处理')
          if (mimeType.includes('mp4')) {
            console.log('✅ 使用MP4格式')
          } else if (mimeType.includes('webm')) {
            console.log('⚠️ 使用WebM格式，可能存在同步问题')
          }
        }
        
        // 清理旧的 URL
        if (this.recordedVideoUrl) {
          URL.revokeObjectURL(this.recordedVideoUrl)
        }
        
        // 创建视频 URL
        this.recordedVideoUrl = URL.createObjectURL(recorderBlob)
        console.log('🔗 视频 URL 创建成功')
        
        // 等待 DOM 更新
        await this.$nextTick()
        
        // 初始化 Video.js 实例
        await this.initializeVideoPlayer()
        
        // 设置状态
        this.recordingConfirmed = true
        this.stopCamera()
        
        // 清理录制数据
        this.recordedChunks = []
        this.mediaRecorder = null

        
        console.log('✅ 录制处理完成')
        
        this.$message?.({
          message: `录制成功！格式: ${mimeType.includes('mp4') ? 'MP4' : 'WebM'}, 时长: ${this.recordingTime}秒`,
          type: 'success',
          duration: 3000
        })
        
      } catch (error) {
        console.error('❌ 录制处理失败:', error)
        this.handleRecordingError(error)
      }
    },
    
    // 🎬 使用FFmpeg处理音画同步 (适配0.10.x版本)
    async processVideoWithFFmpeg(inputBlob, inputMimeType) {
      if (!this.isFFmpegReady) {
        throw new Error('FFmpeg未初始化')
      }
      
      try {
        this.isProcessingVideo = true
        
        console.log('🎬 开始FFmpeg处理:', {
          inputSize: this.formatFileSize(inputBlob.size),
          inputType: inputMimeType,
          recordingDuration: this.recordingTime
        })
        
        // 显示处理进度
        this.$message?.({
          message: '🎬 正在使用FFmpeg优化音画同步...',
          type: 'info',
          duration: 0 // 不自动关闭
        })
        
        // 确定输入文件格式
        const inputExt = inputMimeType.includes('mp4') ? 'mp4' : 'webm'
        const inputFileName = `input.${inputExt}`
        const outputFileName = 'output.mp4' // 统一输出为MP4
        
        // 使用fetchFile处理输入文件
        this.ffmpeg.FS('writeFile', inputFileName, await fetchFile(inputBlob))
        console.log('✅ 输入文件已写入FFmpeg文件系统')
        
        // 🎯 构建FFmpeg命令进行音画同步处理（优化版）
        const ffmpegArgs = [
          '-i', inputFileName,               // 输入文件
          '-c:v', 'libx264',                // 视频编码：H.264
          '-c:a', 'aac',                    // 音频编码：AAC
          '-preset', 'fast',                // 🎬 平衡速度和质量
          '-crf', '20',                     // 🎬 提高视频质量 (18-28, 越小越好)
          '-r', '30',                       // 帧率：30fps
          '-g', '60',                       // 🎬 GOP大小，提高同步稳定性
          '-async', '1',                    // 🎬 音频同步：自动修复音视频时间戳差异
          '-vsync', 'cfr',                  // 🎬 视频同步：恒定帧率输出
          '-af', 'aresample=async=1000:first_pts=0', // 🎬 更强的音频同步修复
          '-vf', 'setpts=PTS-STARTPTS',     // 🎬 重置视频时间戳，从0开始
          '-max_muxing_queue_size', '2048', // 🎬 增大混流队列，避免丢帧
          '-avoid_negative_ts', 'make_zero', // 🎬 避免负时间戳，从0开始
          '-fflags', '+genpts+discardcorrupt', // 🎬 生成精确PTS并丢弃损坏帧
          '-start_at_zero',                 // 🎬 强制从零开始
          '-copyts',                        // 🎬 复制时间戳
          '-y',                             // 覆盖输出文件
          outputFileName                    // 输出文件
        ]
        
        console.log('🎬 FFmpeg命令:', ffmpegArgs.join(' '))
        
        // 执行FFmpeg命令 (使用run方法)
        await this.ffmpeg.run(...ffmpegArgs)
        
        // 读取处理后的文件
        const outputData = this.ffmpeg.FS('readFile', outputFileName)
        const outputBlob = new Blob([outputData.buffer], { type: 'video/mp4' })
        
        // 清理临时文件
        try {
          this.ffmpeg.FS('unlink', inputFileName)
          this.ffmpeg.FS('unlink', outputFileName)
          console.log('✅ 临时文件已清理')
        } catch (cleanupError) {
          console.warn('⚠️ FFmpeg文件清理失败:', cleanupError.message)
        }
        
        console.log('🎬 FFmpeg处理完成:', {
          inputSize: this.formatFileSize(inputBlob.size),
          outputSize: this.formatFileSize(outputBlob.size),
          compressionRatio: ((inputBlob.size - outputBlob.size) / inputBlob.size * 100).toFixed(1) + '%'
        })
        
        this.$message?.({
          message: `✅ 音画同步优化完成！文件大小: ${this.formatFileSize(outputBlob.size)}`,
          type: 'success',
          duration: 4000
        })
        
        return outputBlob
        
      } catch (error) {
        console.error('❌ FFmpeg处理失败:', error)
        
        this.$message?.({
          message: 'FFmpeg处理失败，使用原始录制: ' + error.message,
          type: 'warning',
          duration: 4000
        })
        
        throw error
        
      } finally {
        this.isProcessingVideo = false
        
        // 关闭进度提示
        this.$message?.closeAll?.()
      }
    },
    
    stopCamera() {
      if (this.cameraStream) {
        this.cameraStream.getTracks().forEach(track => track.stop())
        this.cameraStream = null
      }
      this.cameraActive = false
    },
    
    // 🎬 测试录制视频的音画同步质量
    async testVideoSync() {
      if (!this.recordedVideoUrl || !this.videoPlayer) {
        this.$message?.({
          message: '请先录制视频',
          type: 'warning',
          duration: 2000
        })
        return
      }
      
      try {
        console.log('🎬 开始测试音画同步...')
        
        const video = this.videoPlayer.el().querySelector('video')
        if (!video) {
          throw new Error('找不到视频元素')
        }
        
        // 获取视频基本信息
        const videoInfo = {
          duration: video.duration,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          currentTime: video.currentTime,
          playbackRate: video.playbackRate,
          readyState: video.readyState
        }
        
        console.log('📊 视频信息:', videoInfo)
        
        // 检查是否有异常时长
        let syncQuality = '良好'
        let issues = []
        
        if (isNaN(video.duration) || video.duration === Infinity) {
          syncQuality = '异常'
          issues.push('视频时长异常 (∞)')
        } else if (Math.abs(video.duration - this.recordingTime) > 2) {
          syncQuality = '可能有问题'
          issues.push(`时长差异: 实际${video.duration.toFixed(1)}s vs 录制${this.recordingTime}s`)
        }
        
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          syncQuality = '异常'
          issues.push('视频尺寸异常')
        }
        
        // 显示测试结果
        let message = `🎬 音画同步测试结果:\n`
        message += `同步质量: ${syncQuality}\n`
        message += `录制时长: ${this.recordingTime}秒\n`
        message += `视频时长: ${isNaN(video.duration) ? '无限长/异常' : video.duration.toFixed(1) + '秒'}\n`
        message += `视频尺寸: ${video.videoWidth}×${video.videoHeight}\n`
        
        if (issues.length > 0) {
          message += `\n发现问题:\n${issues.join('\n')}`
        }
        
        // 建议
        const suggestions = []
        if (syncQuality === '异常') {
          suggestions.push('建议重新录制视频')
          suggestions.push('或检查浏览器兼容性')
        } else if (syncQuality === '可能有问题') {
          suggestions.push('可以尝试使用FFmpeg处理优化')
          suggestions.push('或调整录制参数')
        } else {
          suggestions.push('视频质量良好，可以正常使用')
        }
        
        if (suggestions.length > 0) {
          message += `\n建议:\n${suggestions.join('\n')}`
        }
        
        console.log('✅ 同步测试完成:', {
          quality: syncQuality,
          issues: issues,
          videoInfo: videoInfo
        })
        
        // 显示详细结果
        this.$alert(message, '音画同步测试结果', {
          confirmButtonText: '确定',
          type: syncQuality === '良好' ? 'success' : (syncQuality === '异常' ? 'error' : 'warning')
        })
        
      } catch (error) {
        console.error('❌ 同步测试失败:', error)
        this.$message?.({
          message: '同步测试失败: ' + (error.message || '未知错误'),
          type: 'error',
          duration: 3000
        })
      }
    },
    
    // 🎬 下载录制的视频
    async downloadRecordedVideo() {
      if (!this.recordedVideoUrl) {
        this.$message?.({
          message: '没有可下载的视频',
          type: 'warning',
          duration: 2000
        })
        return
      }
      
      try {
        console.log('📥 开始下载录制的视频...')
        
        // 获取视频数据
        const response = await fetch(this.recordedVideoUrl)
        const videoBlob = await response.blob()
        
                 // 确定文件格式和名称（RecordRTC兼容）
         const mimeType = videoBlob.type || 'video/mp4'
        let fileExtension = 'mp4'
        
        if (mimeType.includes('webm')) {
          fileExtension = 'webm'
        } else if (mimeType.includes('mp4')) {
          fileExtension = 'mp4'
        }
        
        // 生成文件名（包含时间戳和录制时长）
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
        const filename = `录制视频_${timestamp}_${this.recordingTime}秒.${fileExtension}`
        
        // 创建下载链接
        const downloadUrl = URL.createObjectURL(videoBlob)
        const downloadLink = document.createElement('a')
        downloadLink.href = downloadUrl
        downloadLink.download = filename
        downloadLink.style.display = 'none'
        
        // 添加到页面并触发下载
        document.body.appendChild(downloadLink)
        downloadLink.click()
        
        // 清理
        document.body.removeChild(downloadLink)
        URL.revokeObjectURL(downloadUrl)
        
        console.log('✅ 视频下载成功:', {
          filename: filename,
          size: this.formatFileSize(videoBlob.size),
          type: mimeType,
          duration: this.recordingTime + '秒'
        })
        
        this.$message?.({
          message: `✅ 视频下载成功！文件: ${filename}`,
          type: 'success',
          duration: 4000
        })
        
      } catch (error) {
        console.error('❌ 视频下载失败:', error)
        this.$message?.({
          message: '视频下载失败: ' + (error.message || '未知错误'),
          type: 'error',
          duration: 3000
        })
      }
    },
    
    // 🔧 安全清理录制（修复Vue DOM错误）
    async clearRecording() {
      try {
        console.log('🧹 开始安全清理录制资源...')
        
        // 先停止所有分析活动
        this.isMediaPipeActive = false
        this.isAudioVisualizationActive = false
        
                 // 清理音频资源（需要在Video.js销毁前完成）
         this.cleanupAudio()
         
         // 清理RecordRTC实例
         if (this.recordRTC) {
           try {
             this.recordRTC.destroy()
             console.log('✅ RecordRTC实例已清理')
           } catch (e) {
             console.warn('⚠️ RecordRTC销毁时出现警告:', e.message)
           }
           this.recordRTC = null
         }
        
        // 安全销毁 Video.js 实例
        if (this.videoPlayer) {
          try {
            console.log('🎬 正在销毁Video.js实例...')
            // 暂停视频
            if (!this.videoPlayer.paused()) {
              this.videoPlayer.pause()
            }
            // 清空源
            this.videoPlayer.src('')
            // 等待一帧确保状态更新
            await this.$nextTick()
            // 销毁实例
            this.videoPlayer.dispose()
            console.log('✅ Video.js实例已安全销毁')
          } catch (disposeError) {
            console.warn('⚠️ Video.js销毁时出现警告:', disposeError.message)
          }
          this.videoPlayer = null
        }
        
        // 清理视频URL
        if (this.recordedVideoUrl) {
          URL.revokeObjectURL(this.recordedVideoUrl)
          this.recordedVideoUrl = null
        }
        
        // 重置状态（在DOM操作完成后）
        this.recordingConfirmed = false
        this.recordingTime = 0
        this.anxietyResult = null
        this.videoRunning = false
        
        // 等待DOM更新完成
        await this.$nextTick()
        
        console.log('✅ 录制资源清理完成')
        
        this.$message?.({
          message: '录制已清除',
          type: 'info'
        })
        
      } catch (error) {
        console.error('❌ 清理录制时出错:', error)
                 // 强制重置关键状态
         this.recordingConfirmed = false
         this.videoPlayer = null
         this.recordedVideoUrl = null
         this.isMediaPipeActive = false
         this.isAudioVisualizationActive = false
         this.recordRTC = null  // 强制清理RecordRTC
        
        this.$message?.({
          message: '清理过程中出现问题，已强制重置',
          type: 'warning'
        })
      }
    },
    
    // 初始化 Video.js 播放器
    async initializeVideoPlayer() {
      try {
        // 销毁现有实例
        if (this.videoPlayer) {
          this.videoPlayer.dispose()
          this.videoPlayer = null
        }
        
        // 等待 DOM 更新
        await this.$nextTick()
        
        const videoElement = this.$refs.recordedVideo
        if (!videoElement) {
          console.warn('⚠️ 找不到视频元素，无法初始化Video.js')
          return
        }
        
        // 初始化 Video.js 实例
        this.videoPlayer = videojs(videoElement, {
          controls: true,
          fluid: true,
          responsive: true,
          preload: 'auto',
          playbackRates: [0.5, 1, 1.25, 1.5, 2],
          techOrder: ['html5'],
          html5: {
            vhs: {
              overrideNative: false
            }
          }
        })
        
        // 设置视频源
        if (this.recordedVideoUrl) {
          this.videoPlayer.src({
            src: this.recordedVideoUrl,
            type: this.mediaRecorder?.mimeType || 'video/mp4'
          })
        }
        
        // 绑定事件监听器
        this.videoPlayer.on('play', () => {
          this.onVideoPlay()
        })
        
        this.videoPlayer.on('pause', () => {
          this.onVideoPause()
        })
        
        this.videoPlayer.on('ended', () => {
          this.onVideoEnd()
        })
        
        this.videoPlayer.on('error', (error) => {
          console.error('❌ Video.js 播放错误:', error)
          this.$message?.({
            message: '视频播放出错: ' + (error.message || '未知错误'),
            type: 'error'
          })
        })
        
        console.log('✅ Video.js 播放器初始化成功')
        
      } catch (error) {
        console.error('❌ Video.js 初始化失败:', error)
        this.$message?.({
          message: '视频播放器初始化失败: ' + error.message,
          type: 'error'
        })
      }
    },
    
    // 视频播放控制 (使用 Video.js API)
    async playRecordedVideo() {
      if (!this.videoPlayer) {
        console.warn('⚠️ Video.js 播放器未初始化')
        this.$message?.({
          message: '视频播放器未准备好，请稍后再试',
          type: 'warning'
        })
        return
      }
      
      try {
        if (this.videoPlayer.paused()) {
          // 开始播放
          console.log('▶️ 开始播放视频...')
          await this.videoPlayer.play()
          console.log('✅ 视频播放成功')
        } else {
          // 暂停播放
          console.log('⏸️ 暂停视频播放')
          this.videoPlayer.pause()
          console.log('✅ 视频已暂停')
        }
      } catch (error) {
        console.error('❌ 视频播放控制失败:', error)
        this.$message?.({
          message: '视频播放失败: ' + (error.message || '未知错误'),
          type: 'error',
          duration: 3000
        })
      }
    },
    
    onVideoPlay() {
      this.videoRunning = true
      if (this.isMediaPipeActive) {
        this.processVideo()
      }
    },
    
    onVideoPause() {
      this.videoRunning = false
    },
    
    onVideoEnd() {
      this.videoRunning = false
    },
    
    // MediaPipe 处理 (保持原有逻辑但简化)
    toggleMediaPipe() {
      this.isMediaPipeActive = !this.isMediaPipeActive
      
      if (this.isMediaPipeActive && this.videoRunning) {
        this.processVideo()
        // 触发MediaPipe分析开始事件
        this.$emit('analysisComplete', {
          type: this.analysisMode === 'posture' ? 'posture' : 'emotion',
          status: 'started',
          message: `${this.analysisMode === 'posture' ? '姿态' : '表情'}分析已启动`
        })
      }
      
      if (!this.isMediaPipeActive) {
        this.clearOutputCanvas()
        // 触发MediaPipe分析停止事件
        this.$emit('analysisComplete', {
          type: this.analysisMode === 'posture' ? 'posture' : 'emotion',
          status: 'stopped',
          message: `${this.analysisMode === 'posture' ? '姿态' : '表情'}分析已停止`
        })
      }
    },
    
    async processVideo() {
      if (!this.videoRunning || !this.isMediaPipeActive) return
      
      // 使用 Video.js 获取底层 video 元素
      const video = this.videoPlayer ? this.videoPlayer.el().querySelector('video') : null
      
      try {
        if (video && video.readyState >= 2) {
          if (video.paused || video.ended) {
            this.videoRunning = false
            return
          }
          
          await this.holistic.send({image: video})
        }

        if (this.videoRunning && this.isMediaPipeActive) {
          requestAnimationFrame(this.processVideo)
        }
      } catch (err) {
        console.error('处理视频帧失败:', err)
        if (this.videoRunning && this.isMediaPipeActive) {
          requestAnimationFrame(this.processVideo)
        }
      }
    },
    
    onResults(results) {
      if (!results || !this.$refs.outputCanvas) return
      
      const canvasElement = this.$refs.outputCanvas
      const canvasCtx = canvasElement.getContext("2d")
      
      try {
        canvasCtx.save()
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)

        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height)

        if (results.poseLandmarks) {
          drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
            { color: '#FFFFFF', lineWidth: 4 })
          drawLandmarks(canvasCtx, results.poseLandmarks,
            { color: '#90EE90', lineWidth: 2 })
        }

        if (results.faceLandmarks) {
          drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION,
            { color: '#C0C0C070', lineWidth: 1 })
          drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_RIGHT_EYE,
            { color: '#FF3030', lineWidth: 2 })
          drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_LEFT_EYE,
            { color: '#30FF30', lineWidth: 2 })
          drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_FACE_OVAL,
            { color: '#E0E0E0', lineWidth: 2 })
        }

        canvasCtx.restore()
      } catch (err) {
        console.error('绘制结果失败:', err)
      }
    },
    
    clearOutputCanvas() {
      if (this.$refs.outputCanvas) {
        const canvasElement = this.$refs.outputCanvas
        const canvasCtx = canvasElement.getContext("2d")
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
      }
    },
    
    // 焦虑分析 - 使用新的API接口
    async analyzeAnxiety() {
      console.log('🔍 [DEBUG] analyzeAnxiety() 开始 - 使用新API接口')
      
      if (!this.recordingConfirmed || this.isAnalyzing) return
      
      this.isAnalyzing = true
      this.analysisProgress = 0
      this.anxietyResult = null
      
      try {
        // 模拟进度
        this.startProgressSimulation()
        
        // 获取当前录制的视频blob
        const response = await fetch(this.recordedVideoUrl)
        const videoBlob = await response.blob()
        
        // 创建FormData对象
        const formData = new FormData()
        formData.append('file', videoBlob, 'video.mp4')
        
        console.log('🔍 [DEBUG] 准备发送视频到新API接口')
        console.log('🔍 [DEBUG] 视频文件大小:', this.formatFileSize(videoBlob.size))
        console.log('🔍 [DEBUG] 视频文件类型:', videoBlob.type)
        
        // 使用新的API接口进行焦虑分析
        // 根据环境动态选择API地址
        const isDevelopment = process.env.NODE_ENV === 'development'
        const apiUrl = isDevelopment 
          ? 'http://localhost:5000/api/predict_from_video'
          : `${window.location.origin}/api/anxiety/predict_from_video`
        console.log('🔍 [DEBUG] 发送请求到:', apiUrl)
        
        const analysisResponse = await axios.post(apiUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 60000 // 60秒超时
        })
        
        console.log('🔍 [DEBUG] API响应:', analysisResponse.data)
        
        if (!analysisResponse.data.success) {
          throw new Error('API分析失败: ' + (analysisResponse.data.message || '未知错误'))
        }
        
        // 更新进度到100%
        this.analysisProgress = 100
        
        // 处理新的响应格式
        const responseData = analysisResponse.data
        this.anxietyResult = {
          anxiety_level: responseData.anxiety_level,
          confidence_score: responseData.confidence_score,
          processing_time: responseData.processing_time,
          text_extracted: responseData.text_extracted,
          prediction: responseData.prediction,
          probabilities: responseData.probabilities
        }
        
        this.analysisTime = new Date().toLocaleString()
        
        console.log('✅ 焦虑分析完成:', this.anxietyResult)
        
        // 触发分析完成事件
        this.$emit('analysisComplete', {
          type: 'anxiety',
          result: this.anxietyResult,
          timestamp: this.analysisTime
        })
        
      } catch (error) {
        console.error('❌ 焦虑分析失败:', error)
        this.anxietyResult = {
          error: true,
          message: error.message || '分析失败，请重试'
        }
        
        // 触发分析错误事件
        this.$emit('analysisComplete', {
          type: 'anxiety',
          result: this.anxietyResult,
          error: true
        })
      } finally {
        this.isAnalyzing = false
      }
    },
    
    startProgressSimulation() {
      let progress = 0
      const interval = setInterval(() => {
        if (!this.isAnalyzing) {
          clearInterval(interval)
          return
        }
        
        if (progress < 45) {
          progress += Math.random() * 2
          this.analysisProgress = Math.min(progress, 45)
        } else {
          clearInterval(interval)
        }
      }, 300)
    },
    
    // 音频分析 (简化版本)
    toggleAudioVisualization() {
      if (this.isAudioVisualizationActive) {
        this.stopAudioVisualization()
      } else {
        this.startAudioVisualization()
      }
    },
    
    async startAudioVisualization() {
      try {
        if (!this.recordingConfirmed) {
          this.$message?.({
            message: '请先录制视频',
            type: 'warning',
            duration: 2000
          })
          return
        }
        
        if (!this.videoPlayer) {
          throw new Error('Video.js 播放器未初始化')
        }
        
        const video = this.videoPlayer.el().querySelector('video')
        if (!video) {
          throw new Error('找不到视频元素')
        }
        
        if (video.readyState < 2) {
          this.$message?.({
            message: '视频正在加载中，请稍候',
            type: 'info',
            duration: 2000
          })
          return
        }
        
        if (this.videoPlayer.paused()) {
          this.$message?.({
            message: '请先播放视频再启动音频分析',
            type: 'info',
            duration: 3000
          })
          return
        }
        
        // 显示设置进度提示
        this.$message?.({
          message: '正在设置音频分析...',
          type: 'info',
          duration: 1000
        })
        
        await this.setupAudioAnalysis()
        this.isAudioVisualizationActive = true
        this.drawAudioSpectrum()
        
        this.$message?.({
          message: '✅ 音频分析已启动',
          type: 'success',
          duration: 2000
        })
        
        // 触发音频分析开始事件
        this.$emit('analysisComplete', {
          type: 'audio',
          status: 'started',
          message: '音频分析已启动'
        })
        
      } catch (err) {
        console.error('启动音频分析失败:', err)
        this.isAudioVisualizationActive = false
        
        // 根据错误类型显示不同的提示
        let errorMessage = '音频分析启动失败'
        if (err.message.includes('already connected')) {
          errorMessage = '音频连接冲突，请重新录制视频后再试'
        } else if (err.message.includes('not supported')) {
          errorMessage = '浏览器不支持音频分析功能'
        } else if (err.message.includes('新视频')) {
          errorMessage = '音频设置失败，请重新录制视频'
        }
        
        this.$message?.({
          message: errorMessage,
          type: 'error',
          duration: 4000
        })
      }
    },
    
    stopAudioVisualization() {
      this.isAudioVisualizationActive = false
      if (this.audioAnimationFrameId) {
        cancelAnimationFrame(this.audioAnimationFrameId)
        this.audioAnimationFrameId = null
      }
      
      // 触发音频分析停止事件
      this.$emit('analysisComplete', {
        type: 'audio',
        status: 'stopped',
        message: '音频分析已停止'
      })
    },
    
    async setupAudioAnalysis() {
      try {
        if (!this.videoPlayer) {
          throw new Error('Video.js 播放器未初始化')
        }
        
        const video = this.videoPlayer.el().querySelector('video')
        if (!video) {
          throw new Error('找不到视频元素')
        }
        
        // 确保视频已经加载完成
        if (video.readyState < 2) {
          throw new Error('视频尚未加载完成')
        }
        
        // 完全清理之前的音频连接
        this.cleanupAudio()
        
        // 等待清理完成
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const AudioContext = window.AudioContext || window.webkitAudioContext
        if (!AudioContext) {
          throw new Error('浏览器不支持音频分析')
        }
        
        // 创建新的音频上下文
        this.audioContext = new AudioContext()
        
        // 检查视频元素是否已被连接过
        if (video._audioSourceConnected) {
          console.log('🔄 检测到视频元素已被连接，尝试重置...')
          
          // 创建一个新的视频元素副本来避免连接冲突
          const newVideo = video.cloneNode(true)
          newVideo.src = video.src
          newVideo.currentTime = video.currentTime
          newVideo.volume = video.volume
          newVideo.muted = false
          
          // 等待新视频加载
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('新视频加载超时')), 3000)
            
            newVideo.onloadedmetadata = () => {
              clearTimeout(timeout)
              resolve()
            }
            
            newVideo.onerror = () => {
              clearTimeout(timeout)
              reject(new Error('新视频加载失败'))
            }
            
            if (newVideo.readyState >= 2) {
              clearTimeout(timeout)
              resolve()
            }
          })
          
          // 使用新视频元素创建音频源
          this.audioSource = this.audioContext.createMediaElementSource(newVideo)
          this.currentAudioVideo = newVideo
          
          // 同步播放状态
          if (!video.paused) {
            newVideo.currentTime = video.currentTime
            newVideo.play()
          }
          
        } else {
          // 直接使用原视频元素
          this.audioSource = this.audioContext.createMediaElementSource(video)
          this.currentAudioVideo = video
          video._audioSourceConnected = true
        }
        
        // 创建分析器
        this.audioAnalyser = this.audioContext.createAnalyser()
        this.audioAnalyser.fftSize = 256
        this.audioAnalyser.smoothingTimeConstant = 0.8
        
        this.audioDataArray = new Uint8Array(this.audioAnalyser.frequencyBinCount)
        
        // 连接音频节点
        this.audioSource.connect(this.audioAnalyser)
        this.audioAnalyser.connect(this.audioContext.destination)
        
        // 初始化Canvas
        const canvas = this.$refs.audioCanvas
        if (canvas) {
          await this.$nextTick()
          canvas.width = canvas.offsetWidth || 400
          canvas.height = canvas.offsetHeight || 200
          this.audioCanvasCtx = canvas.getContext('2d')
        }
        
        // 确保音频上下文运行
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume()
        }
        
        console.log('✅ 音频分析设置成功')
        
      } catch (error) {
        console.error('❌ 音频分析设置失败:', error)
        this.cleanupAudio()
        throw error
      }
    },
    
    drawAudioSpectrum() {
      if (!this.isAudioVisualizationActive || !this.audioAnalyser || !this.audioCanvasCtx) {
        return
      }
      
      const canvas = this.$refs.audioCanvas
      const width = canvas.width
      const height = canvas.height
      
      this.audioAnalyser.getByteFrequencyData(this.audioDataArray)
      
      this.audioCanvasCtx.clearRect(0, 0, width, height)
      
      const barWidth = (width / this.audioDataArray.length) * 2.5
      let x = 0
      let totalAmplitude = 0
      let dominantFrequency = 0
      let maxAmplitude = 0
      
      const gradient = this.audioCanvasCtx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, 'rgba(76, 175, 80, 1)')
      gradient.addColorStop(0.5, 'rgba(129, 199, 132, 0.8)')
      gradient.addColorStop(1, 'rgba(165, 214, 167, 0.6)')
      
      for (let i = 0; i < this.audioDataArray.length; i++) {
        const barHeight = this.audioDataArray[i] / 255 * height
        
        totalAmplitude += this.audioDataArray[i]
        
        if (this.audioDataArray[i] > maxAmplitude) {
          maxAmplitude = this.audioDataArray[i]
          dominantFrequency = i * (22050 / this.audioDataArray.length)
        }
        
        this.audioCanvasCtx.fillStyle = gradient
        this.audioCanvasCtx.fillRect(x, height - barHeight, barWidth, barHeight)
        
        x += barWidth + 1
      }
      
      const averageAmplitude = totalAmplitude / this.audioDataArray.length
      const volume = Math.round((averageAmplitude / 255) * 100)
      
      this.audioAnalysisStats = {
        dominantFrequency: Math.round(dominantFrequency),
        volume: volume + '%'
      }
      
      this.audioAnimationFrameId = requestAnimationFrame(this.drawAudioSpectrum)
    },
    
    cleanupAudio() {
      try {
        console.log('🧹 清理音频分析资源...')
        
        // 停止动画循环
        if (this.audioAnimationFrameId) {
          cancelAnimationFrame(this.audioAnimationFrameId)
          this.audioAnimationFrameId = null
        }
        
        // 停止音频可视化
        this.isAudioVisualizationActive = false
        
        // 清理视频元素的连接状态标记
        if (this.currentAudioVideo && this.currentAudioVideo._audioSourceConnected) {
          delete this.currentAudioVideo._audioSourceConnected
          console.log('✅ 清理视频音频连接标记')
        }
        
        // 如果使用的是克隆的视频元素，暂停并移除它
        if (this.currentAudioVideo && this.currentAudioVideo !== this.$refs.recordedVideo) {
          try {
            this.currentAudioVideo.pause()
            this.currentAudioVideo.src = ''
            this.currentAudioVideo.remove()
            console.log('✅ 清理克隆的视频元素')
          } catch (e) {
            console.warn('⚠️ 清理克隆视频时出错:', e.message)
          }
        }
        
        // 断开音频源连接
        if (this.audioSource) {
          try {
            this.audioSource.disconnect()
            console.log('✅ 音频源已断开')
          } catch (e) {
            console.warn('⚠️ 断开音频源时出错:', e.message)
          }
          this.audioSource = null
        }
        
        // 断开分析器连接
        if (this.audioAnalyser) {
          try {
            this.audioAnalyser.disconnect()
            console.log('✅ 音频分析器已断开')
          } catch (e) {
            console.warn('⚠️ 断开音频分析器时出错:', e.message)
          }
          this.audioAnalyser = null
        }
        
        // 关闭音频上下文
        if (this.audioContext) {
          try {
            if (this.audioContext.state !== 'closed') {
              this.audioContext.close().then(() => {
                console.log('✅ 音频上下文已关闭')
              }).catch(e => {
                console.warn('⚠️ 关闭音频上下文时出错:', e.message)
              })
            }
          } catch (e) {
            console.warn('⚠️ 音频上下文关闭异常:', e.message)
          }
          this.audioContext = null
        }
        
        // 清理相关数据
        this.audioDataArray = null
        this.audioAnalysisStats = null
        this.currentAudioVideo = null
        this.audioCanvasCtx = null
        
        console.log('✅ 音频分析资源清理完成')
        
      } catch (error) {
        console.error('❌ 音频清理过程中出错:', error.message)
        
        // 强制清理关键引用
        this.isAudioVisualizationActive = false
        this.audioSource = null
        this.audioAnalyser = null
        this.audioContext = null
        this.audioDataArray = null
        this.audioAnalysisStats = null
        this.currentAudioVideo = null
        this.audioCanvasCtx = null
      }
    },
    
    // 文件大小格式化
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    
    // 时长异常视频播放监控
    setupInfinityDurationMonitor(video) {
      console.log('📈 启动时长异常视频播放监控...')
      
      // 清理之前的监控
      if (this.infinityDurationMonitor) {
        clearInterval(this.infinityDurationMonitor)
      }
      
      let startTime = Date.now()
      let lastCurrentTime = 0
      let stuckCount = 0
      
      this.infinityDurationMonitor = setInterval(() => {
        if (video.paused || video.ended) {
          console.log('📊 视频已暂停或结束，停止监控')
          clearInterval(this.infinityDurationMonitor)
          this.infinityDurationMonitor = null
          return
        }
        
        const currentTime = video.currentTime
        const playedTime = (Date.now() - startTime) / 1000
        const expectedDuration = video._expectedDuration || this.recordingTime
        
        console.log(`📊 播放监控: 当前时间=${currentTime.toFixed(2)}s, 播放时长=${playedTime.toFixed(2)}s, 预期总时长=${expectedDuration}s`)
        
        // 检查是否卡住
        if (Math.abs(currentTime - lastCurrentTime) < 0.1) {
          stuckCount++
          console.log(`⚠️ 检测到播放可能卡住 (${stuckCount}/3)`)
          
          if (stuckCount >= 3) {
            console.log('❌ 播放确实卡住了，尝试恢复...')
            try {
              video.currentTime = currentTime + 0.1 // 尝试微调播放位置
              stuckCount = 0
            } catch (e) {
              console.warn('⚠️ 播放位置调整失败:', e.message)
            }
          }
        } else {
          stuckCount = 0
        }
        
        lastCurrentTime = currentTime
        
        // 如果播放时间超过预期录制时间很多，可能需要停止
        if (playedTime > expectedDuration * 1.5) {
          console.log('⚠️ 播放时间异常长，可能视频有问题，建议用户停止')
          this.$message?.({
            message: `播放时间已超过预期(${expectedDuration}s)，建议停止播放`,
            type: 'warning',
            duration: 5000
          })
          
          // 只提醒一次
          clearInterval(this.infinityDurationMonitor)
          this.infinityDurationMonitor = null
        }
        
      }, 2000) // 每2秒检查一次
      
      console.log('✅ 时长异常视频播放监控已启动')
    },
    
    // 重置错误状态
    resetError() {
      console.log('🔄 重置错误状态...')
      this.error = null
      
      this.$message?.({
        message: '错误已重置，您可以重新尝试',
        type: 'info',
        duration: 2000
      })
    },
    
    // 错误处理
    handleRecordingError(error) {
      this.isRecording = false
      this.error = '录制失败: ' + (error.message || '未知错误')
      
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer)
        this.recordingTimer = null
      }
      
      this.mediaRecorder = null
      this.recordedChunks = []
      
      // 清理RecordRTC实例（如果存在）
      if (this.recordRTC) {
        try {
          this.recordRTC.destroy()
        } catch (e) {
          console.warn('⚠️ RecordRTC错误清理时出现警告:', e.message)
        }
        this.recordRTC = null
      }
      
      console.error('🚫 录制错误:', {
        message: error.message,
        recordingTime: this.recordingTime,
        chunksCount: this.recordedChunks.length,
        error: error
      })
      
      this.$message?.({
        message: '录制失败: ' + (error.message || '未知错误'),
        type: 'error',
        duration: 5000
      })
    },
    
    resetError() {
      this.error = null
    },
    
    // 清理所有资源
    cleanup() {
      if (this.isRecording) {
        this.stopRecording()
      }
      
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer)
        this.recordingTimer = null
      }
      
      // 清理时长异常监控
      if (this.infinityDurationMonitor) {
        clearInterval(this.infinityDurationMonitor)
        this.infinityDurationMonitor = null
      }
      
      this.stopCamera()
      this.cleanupAudio()
      
      if (this.recordedVideoUrl) {
        URL.revokeObjectURL(this.recordedVideoUrl)
        this.recordedVideoUrl = null
      }
      
      if (this.holistic) {
        this.holistic.close()
      }
      
      this.recordedChunks = []
      this.mediaRecorder = null
      
      // 清理RecordRTC实例
      if (this.recordRTC) {
        try {
          this.recordRTC.destroy()
          console.log('✅ RecordRTC实例已清理')
        } catch (e) {
          console.warn('⚠️ RecordRTC清理时出现警告:', e.message)
        }
        this.recordRTC = null
      }
      
      // 清理FFmpeg资源
      if (this.ffmpeg) {
        try {
          // FFmpeg.wasm的清理（通常会自动处理）
          console.log('🧹 FFmpeg资源清理完成')
        } catch (error) {
          console.warn('⚠️ FFmpeg清理过程中出错:', error.message)
        }
      }
      
    }
  }
}
</script>

<style scoped>
/* 确保页面可以正常滚动 */
html, body {
  overflow-x: hidden;
  overflow-y: auto;
  height: auto;
  min-height: 100vh;
}
/* 基础容器 */
.container {
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}

/* 错误消息 */
.error-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.error-retry-btn {
  margin-left: auto;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.error-retry-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 加载状态 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.loading-content {
  text-align: center;
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-subtitle {
  color: #666;
  font-size: 14px;
  margin-top: 10px;
}

.loading-details {
  margin: 20px 0;
  text-align: left;
}

.loading-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  margin: 4px 0;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #ddd;
}

.loading-item span {
  color: #666;
  transition: color 0.3s;
}

.loading-item span.loading-done {
  color: #4CAF50;
  font-weight: 500;
}

.loading-item .fa-check {
  color: #4CAF50;
}

/* 主要内容 */
.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  z-index: 2;
  padding-top: 0;
  padding-bottom: 40px;
}

/* 卡片行 */
.card-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

/* 单分析模式：单列居中布局 */
.card-row.single-analysis {
  grid-template-columns: 1fr;
  max-width: 800px;
  margin: 0 auto;
}

/* 功能卡片 */
.feature-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 600px;
  position: relative;
  z-index: 3;
  overflow: visible;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f8f9fa;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header i {
  font-size: 20px;
  color: #4CAF50;
}

/* 状态徽章 */
.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.waiting {
  background: #ffeaa7;
  color: #d63031;
}

.status-badge.ready {
  background: #d1f2eb;
  color: #00b894;
}

.status-badge.active {
  background: #74b9ff;
  color: white;
  animation: pulse 2s infinite;
}

.status-badge.analyzing {
  background: #a29bfe;
  color: white;
  animation: pulse 2s infinite;
}

.status-badge.completed {
  background: #00b894;
  color: white;
}

.status-badge.processing {
  background: linear-gradient(135deg, #e17055, #fdcb6e);
  color: white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* 录制方案指示器 */
.recording-method {
  display: inline-block;
  padding: 2px 8px;
  margin-left: 8px;
  background: rgba(33, 150, 243, 0.1);
  color: #1976D2;
  border: 1px solid rgba(33, 150, 243, 0.3);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 按钮样式 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  min-width: 120px;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-record {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
  animation: recordPulse 2s infinite;
}

.btn-record:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
}

@keyframes recordPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(255, 107, 107, 0); }
}

.btn-stop {
  background: linear-gradient(135deg, #ff7675, #d63031);
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-danger {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
}

.btn-analysis {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
}

.btn-anxiety {
  background: linear-gradient(135deg, #9C27B0, #7B1FA2);
  color: white;
}

.btn-audio {
  background: linear-gradient(135deg, #00bcd4, #00acc1);
  color: white;
}

.btn-retry {
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: white;
}

.btn-download {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.btn-download:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
  background: linear-gradient(135deg, #45a049, #4CAF50);
}

.btn-download:before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn-download:hover:before {
  left: 100%;
}

.btn-test {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.btn-test:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
  background: linear-gradient(135deg, #1976D2, #1565C0);
}

.btn-test:before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn-test:hover:before {
  left: 100%;
}

/* 控制区域 */
.recording-controls,
.analysis-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

/* 视频容器 */
.video-container {
  position: relative;
  flex: 1;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  min-height: 300px;
}

.video-display {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.camera-preview {
  transform: scaleX(-1);
}

/* 录制指示器 */
.recording-indicator {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 107, 107, 0.9);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  backdrop-filter: blur(10px);
  z-index: 10;
}

.recording-dot {
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

/* 占位符 */
.video-placeholder,
.empty-state {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  color: #6c757d;
}

.video-placeholder i,
.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

/* Canvas */
.analysis-canvas {
  width: 100%;
  height: 100%;
  transform: scaleX(-1);
}

.audio-canvas {
  width: 100%;
  height: 100%;
}

/* 分析内容 */
.analysis-content,
.audio-content {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 分析中状态 */
.analyzing-state {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  z-index: 10;
}

.progress-bar {
  width: 80%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  margin-top: 20px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #9C27B0, #E91E63);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* 结果显示 */
.result-display {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.score-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  position: relative;
}

.score-circle.level-excellent {
  background: linear-gradient(135deg, #00C851, #00A041);
  box-shadow: 0 4px 20px rgba(0, 200, 81, 0.3);
}

.score-circle.level-good {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
}

.score-circle.level-medium {
  background: linear-gradient(135deg, #FF9800, #F57C00);
  box-shadow: 0 4px 20px rgba(255, 152, 0, 0.3);
}

.score-circle.level-warning {
  background: linear-gradient(135deg, #FF5722, #E64A19);
  box-shadow: 0 4px 20px rgba(255, 87, 34, 0.3);
}

.score-circle.level-danger {
  background: linear-gradient(135deg, #F44336, #D32F2F);
  box-shadow: 0 4px 20px rgba(244, 67, 54, 0.3);
}

.score-circle.level-unknown {
  background: linear-gradient(135deg, #9E9E9E, #757575);
  box-shadow: 0 4px 20px rgba(158, 158, 158, 0.3);
}

.score-value {
  font-size: 28px;
  font-weight: 700;
}

.score-label {
  font-size: 12px;
  margin-top: 4px;
  opacity: 0.9;
}

.score-info {
  flex: 1;
}

.anxiety-level {
  margin-bottom: 12px;
}

.level-badge {
  padding: 6px 12px;
  border-radius: 16px;
  color: white;
  font-size: 13px;
  font-weight: 600;
}

.level-badge.level-excellent {
  background: #00C851;
  box-shadow: 0 2px 8px rgba(0, 200, 81, 0.3);
}

.level-badge.level-good {
  background: #4CAF50;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.level-badge.level-medium {
  background: #FF9800;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
}

.level-badge.level-warning {
  background: #FF5722;
  box-shadow: 0 2px 8px rgba(255, 87, 34, 0.3);
}

.level-badge.level-danger {
  background: #F44336;
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
}

.level-badge.level-unknown {
  background: #9E9E9E;
  box-shadow: 0 2px 8px rgba(158, 158, 158, 0.3);
}

.description {
  color: #6c757d;
  line-height: 1.5;
  margin: 0;
}

/* 建议 */
.recommendations {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.recommendations h4 {
  margin: 0 0 12px 0;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 8px;
}

.recommendations i {
  color: #FFC107;
}

.recommendations ul {
  margin: 0;
  padding-left: 20px;
}

.recommendations li {
  margin-bottom: 8px;
  color: #6c757d;
  line-height: 1.4;
}

/* 错误结果 */
.error-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #dc3545;
}

.error-result i {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-result p {
  margin-bottom: 20px;
  font-size: 16px;
}

/* 音频频谱 */
.spectrum-display {
  position: relative;
  height: 100%;
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
}

.audio-stats {
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: rgba(76, 175, 80, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  backdrop-filter: blur(10px);
}

.stat {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
  min-width: 120px;
}

.stat:last-child {
  margin-bottom: 0;
}

.value {
  font-weight: 600;
  margin-left: 8px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .card-row {
    grid-template-columns: 1fr;
  }
  
  .feature-card {
    height: auto;
    min-height: 500px;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 16px;
  }
  
  .content-wrapper {
    gap: 16px;
  }
  
  .feature-card {
    padding: 16px;
    min-height: 400px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .recording-controls,
  .analysis-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn {
    min-width: auto;
  }
  
  .score-display {
    flex-direction: column;
    text-align: center;
  }
  
  .score-circle {
    align-self: center;
  }
  
  /* 焦虑分析响应式设计 */
  .anxiety-header {
    padding: 12px 16px;
  }
  
  .header-info {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
  
  .analysis-title {
    flex-direction: column;
    gap: 6px;
  }
  
  .status-indicator {
    margin-left: 0;
  }
  
  .anxiety-score-section {
    flex-direction: column;
    text-align: center;
    gap: 20px;
    padding: 20px 16px;
  }
  
  .anxiety-score-circle {
    width: 80px;
    height: 80px;
  }
  
  .score-value {
    font-size: 24px;
  }
  
  .anxiety-recommendations {
    padding: 16px;
  }
  
  .anxiety-footer {
    flex-direction: column;
    gap: 8px;
    text-align: center;
    padding: 12px 16px;
  }
}

/* 动画增强 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feature-card {
  animation: fadeIn 0.6s ease-out;
}

.feature-card:nth-child(2) {
  animation-delay: 0.1s;
}

.feature-card:nth-child(3) {
  animation-delay: 0.2s;
}

.feature-card:nth-child(4) {
  animation-delay: 0.3s;
}

/* 焦虑分析结果 - 优化后的样式 */
.anxiety-result-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* 简洁的头部信息 */
.anxiety-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 16px 20px;
  color: white;
}

.header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.analysis-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.analysis-title i {
  font-size: 16px;
  opacity: 0.9;
}

.analysis-title span {
  font-size: 16px;
  font-weight: 600;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.2);
  margin-left: 10px;
}

.confidence-display {
  text-align: right;
}

.confidence-label {
  display: block;
  font-size: 11px;
  opacity: 0.8;
  margin-bottom: 2px;
}

.confidence-value {
  font-size: 14px;
  font-weight: 600;
}

/* 主要内容区域 */
.anxiety-main-content {
  padding: 0;
}

/* 分数和状态展示 */
.anxiety-score-section {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px 20px;
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
}

.anxiety-score-circle {
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.anxiety-score-circle.level-excellent {
  background: linear-gradient(135deg, #00C851, #00A041);
}

.anxiety-score-circle.level-good {
  background: linear-gradient(135deg, #4CAF50, #45a049);
}

.anxiety-score-circle.level-medium {
  background: linear-gradient(135deg, #FF9800, #F57C00);
}

.anxiety-score-circle.level-warning {
  background: linear-gradient(135deg, #FF5722, #E64A19);
}

.anxiety-score-circle.level-danger {
  background: linear-gradient(135deg, #F44336, #D32F2F);
}

.score-inner {
  text-align: center;
}

.score-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.score-label {
  display: block;
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.9;
}

.anxiety-status-info {
  flex: 1;
}

.anxiety-level {
  margin-bottom: 12px;
}

.anxiety-level-text {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}

.anxiety-level-text.level-excellent {
  background: linear-gradient(135deg, #00C851, #00A041);
}

.anxiety-level-text.level-good {
  background: linear-gradient(135deg, #4CAF50, #45a049);
}

.anxiety-level-text.level-medium {
  background: linear-gradient(135deg, #FF9800, #F57C00);
}

.anxiety-level-text.level-warning {
  background: linear-gradient(135deg, #FF5722, #E64A19);
}

.anxiety-level-text.level-danger {
  background: linear-gradient(135deg, #F44336, #D32F2F);
}

.anxiety-description {
  margin: 0;
  color: #555;
  line-height: 1.5;
  font-size: 13px;
  font-weight: 400;
}

/* 建议区域 */
.anxiety-recommendations {
  background: #f8f9fa;
  padding: 20px;
  border-top: 1px solid #e9ecef;
}

.recommendations-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.recommendations-header i {
  color: #FFC107;
  font-size: 16px;
}

.recommendations-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 600;
}

.anxiety-tips-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.anxiety-tip-item {
  background: white;
  padding: 12px 16px;
  border-radius: 10px;
  border-left: 3px solid #4CAF50;
  font-size: 12px;
  line-height: 1.4;
  color: #555;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.anxiety-tip-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

/* 底部信息 */
.anxiety-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  color: #666;
  font-size: 11px;
}

.analysis-time {
  display: flex;
  align-items: center;
  gap: 6px;
}

.analysis-time i {
  color: #999;
}

.analysis-details {
  color: #999;
}

/* 滚动条美化 */
.result-display::-webkit-scrollbar {
  width: 6px;
}

.result-display::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.result-display::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.result-display::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Video.js 自定义样式 */
.video-js {
  width: 100% !important;
  height: auto !important;
  max-height: 100%;
  background-color: #000;
}

.video-js .vjs-tech {
  object-fit: contain;
}

.video-js .vjs-control-bar {
  background: rgba(43, 51, 63, 0.7);
  backdrop-filter: blur(10px);
}

.video-js .vjs-play-progress,
.video-js .vjs-volume-level {
  background: #4CAF50;
}

.video-js .vjs-slider:hover .vjs-play-progress,
.video-js .vjs-slider:hover .vjs-volume-level {
  background: #45a049;
}

.video-js .vjs-big-play-button {
  background: rgba(76, 175, 80, 0.8);
  border: none;
  border-radius: 50%;
  width: 80px;
  height: 80px;
  line-height: 80px;
  margin-top: -40px;
  margin-left: -40px;
  font-size: 32px;
}

.video-js .vjs-big-play-button:hover {
  background: rgba(76, 175, 80, 0.9);
}

.video-js.vjs-user-inactive .vjs-control-bar {
  opacity: 0;
  visibility: hidden;
  transition: opacity 1s, visibility 1s;
}

.video-js.vjs-user-active .vjs-control-bar {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.3s, visibility 0.3s;
}

/* 确保Video.js在容器中正确显示 */
.video-container .video-js {
  border-radius: 8px;
  overflow: hidden;
}
</style> 