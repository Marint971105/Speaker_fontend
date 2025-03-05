<!-- HolisticDetection.vue -->
<template>
  <div class="container">
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    <div v-else-if="!isMediaPipeReady" class="loading-message">
      Loading MediaPipe...
    </div>
    <div v-else class="content-wrapper">
      <!-- 第一行卡片 -->
      <div class="card-row">
        <!-- 左侧原始视频播放区域 -->
        <div class="videoView">
          <div class="control-panel">
            <input 
              type="file" 
              accept="video/*"
              @change="handleVideoUpload"
              style="display: none"
              ref="videoInput"
            >
            <button 
              class="custom-button primary-button"
              @click="$refs.videoInput.click()"
            >
              <span class="button-icon">
                <i class="fas fa-file-video"></i>
              </span>
              <span class="button-text">选择视频</span>
            </button>
            <button 
              class="custom-button primary-button"
              @click="toggleVideo"
              :disabled="!inputVideo"
            >
              <span class="button-icon">
                <i :class="videoRunning ? 'fas fa-stop' : 'fas fa-play'"></i>
              </span>
              <span class="button-text">{{ videoRunning ? '停止' : '开始' }}</span>
            </button>
            <button 
              class="custom-button analyze-button"
              @click="analyzeAnxiety"
              :disabled="!inputVideo || isAnalyzing"
            >
              <span class="button-icon">
                <i class="fas fa-brain"></i>
              </span>
              <span class="button-text">分析焦虑</span>
            </button>
          </div>

          <div class="video-container">
            <video
              ref="inputVideo"
              class="input-video"
              controls
              preload="auto"
              :style="{ display: inputVideo ? 'block' : 'none' }"
            >
              <p>您的浏览器不支持 HTML5 视频播放</p>
            </video>
            <div v-if="!inputVideo" class="empty-video-placeholder">
              <i class="fas fa-video-slash"></i>
              <p>请选择视频文件</p>
            </div>
          </div>
        </div>

        <!-- 右侧 MediaPipe 处理结果区域 -->
        <div class="videoView">
          <div class="control-panel">
            <span class="processing-status">MediaPipe 处理结果</span>
          </div>

          <div class="video-container">
            <canvas 
              ref="outputCanvas" 
              class="output_canvas"
              :width="1280"
              :height="720"
            ></canvas>
            <div v-if="!inputVideo" class="empty-video-placeholder">
              <i class="fas fa-chart-line"></i>
              <p>等待视频输入</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 第二行卡片 - 新增的两个卡片 -->
      <div class="card-row">
        <!-- 左侧第三个卡片 - 焦虑分析结果 -->
        <div class="videoView">
          <div class="control-panel">
            <span class="processing-status">焦虑分析结果</span>
            <div class="analysis-status" v-if="isAnalyzing">
              <i class="fas fa-spinner fa-spin"></i>
              <span>正在分析...</span>
            </div>
          </div>

          <div class="video-container">
            <div v-if="!anxietyResult && !isAnalyzing" class="empty-video-placeholder">
              <i class="fas fa-brain"></i>
              <p>点击"分析焦虑"按钮开始分析</p>
            </div>
            
            <div v-if="isAnalyzing" class="loading-analysis">
              <div class="loading-spinner"></div>
              <p>正在分析视频，请稍候...</p>
              <div class="progress-bar">
                <div class="progress" :style="{width: `${analysisProgress}%`}"></div>
              </div>
            </div>
            
            <div v-if="anxietyResult && !isAnalyzing" class="anxiety-result">
              <div class="result-header">
                <i class="fas fa-chart-bar"></i>
                <h3>焦虑评估报告</h3>
              </div>
              
              <div class="score-container">
                <div class="score-circle" :class="anxietyLevelClass">
                  <span class="score-value">{{ formattedScore }}</span>
                  <span class="score-label">焦虑指数</span>
                </div>
                
                <div class="score-details">
                  <div class="anxiety-level">
                    <span>焦虑等级：</span>
                    <span class="level-badge" :class="anxietyLevelClass">
                      {{ anxietyLevelText }}
                    </span>
                  </div>
                  
                  <div class="anxiety-description">
                    <p>{{ anxietyDescription }}</p>
                  </div>
                  
                  <div class="analysis-time">
                    <i class="fas fa-clock"></i>
                    <span>分析时间：{{ analysisTime }}</span>
                  </div>
                </div>
              </div>
              
              <div class="recommendations">
                <h4><i class="fas fa-lightbulb"></i> 建议</h4>
                <ul>
                  <li v-for="(tip, index) in anxietyTips" :key="index">
                    {{ tip }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧第四个卡片 - 音频频谱分析 -->
        <div class="videoView">
          <div class="control-panel">
            <span class="processing-status">音频频谱分析</span>
            <div class="audio-controls">
              <button 
                class="custom-button audio-button"
                @click="toggleAudioVisualization"
                :disabled="!inputVideo"
              >
                <span class="button-icon">
                  <i :class="isAudioVisualizationActive ? 'fas fa-pause' : 'fas fa-play'"></i>
                </span>
                <span class="button-text">{{ isAudioVisualizationActive ? '暂停分析' : '开始分析' }}</span>
              </button>
            </div>
          </div>

          <div class="video-container">
            <div v-if="!inputVideo" class="empty-video-placeholder">
              <i class="fas fa-music"></i>
              <p>请先选择视频以查看音频频谱</p>
            </div>
            
            <div v-else class="spectrum-container">
              <canvas ref="audioCanvas" class="audio-canvas"></canvas>
              <div class="spectrum-info" v-if="audioAnalysisStats">
                <div class="audio-stat">
                  <span class="stat-label">主频率:</span>
                  <span class="stat-value">{{ audioAnalysisStats.dominantFrequency }} Hz</span>
                </div>
                <div class="audio-stat">
                  <span class="stat-label">音量:</span>
                  <span class="stat-value">{{ audioAnalysisStats.volume }}</span>
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

export default {
  name: 'HolisticDetection',
  data() {
    return {
      holistic: null,
      videoRunning: false,
      error: null,
      lastVideoTime: -1,
      inputVideo: null,
      isMediaPipeReady: false,
      
      // 焦虑分析相关状态
      isAnalyzing: false,
      analysisProgress: 0,
      anxietyResult: null,
      analysisTime: '',
      
      // API路径
      apiBaseUrl: 'http://10.120.48.67:8000',
      
      // 音频分析相关
      audioContext: null,
      audioSource: null,
      audioAnalyser: null,
      audioCanvasCtx: null,
      audioDataArray: null,
      isAudioVisualizationActive: false,
      audioAnimationFrameId: null,
      audioAnalysisStats: null
    }
  },
  computed: {
    formattedScore() {
      if (!this.anxietyResult) return '0';
      return parseFloat(JSON.parse(this.anxietyResult.score100)[0]).toFixed(0);
    },
    anxietyLevelClass() {
      if (!this.anxietyResult) return '';
      // 解析category值，处理"[5]"格式的字符串
      const categoryStr = this.anxietyResult.category;
      let category;
      try {
        // 尝试解析JSON格式的字符串数组
        const parsedArray = JSON.parse(categoryStr);
        category = Array.isArray(parsedArray) ? parsedArray[0] : parseInt(categoryStr);
      } catch (e) {
        // 如果解析失败，尝试直接使用parseInt
        category = parseInt(categoryStr);
      }
      
      // 确保category是有效数字
      if (isNaN(category)) return '';
      
      if (category <= 1) return 'level-high';     // 重度焦虑和中度偏重焦虑
      if (category <= 3) return 'level-medium';   // 中度焦虑和轻度偏中焦虑
      return 'level-low';                         // 轻度焦虑和不焦虑
    },
    anxietyLevelText() {
      if (!this.anxietyResult) return '未知';
      // 解析category值，处理"[5]"格式的字符串
      const categoryStr = this.anxietyResult.category;
      let category;
      try {
        // 尝试解析JSON格式的字符串数组
        const parsedArray = JSON.parse(categoryStr);
        category = Array.isArray(parsedArray) ? parsedArray[0] : parseInt(categoryStr);
      } catch (e) {
        // 如果解析失败，尝试直接使用parseInt
        category = parseInt(categoryStr);
      }
      
      // 确保category是有效数字
      if (isNaN(category)) return '未知';
      
      switch (category) {
        case 0: return '重度焦虑';
        case 1: return '中度偏重焦虑';
        case 2: return '中度焦虑';
        case 3: return '轻度偏中焦虑';
        case 4: return '轻度焦虑';
        case 5: return '不焦虑';
        default: return '未知';
      }
    },
    anxietyDescription() {
      if (!this.anxietyResult) return '';
      // 解析category值，处理"[5]"格式的字符串
      const categoryStr = this.anxietyResult.category;
      let category;
      try {
        // 尝试解析JSON格式的字符串数组
        const parsedArray = JSON.parse(categoryStr);
        category = Array.isArray(parsedArray) ? parsedArray[0] : parseInt(categoryStr);
      } catch (e) {
        // 如果解析失败，尝试直接使用parseInt
        category = parseInt(categoryStr);
      }
      
      // 确保category是有效数字
      if (isNaN(category)) return '';
      
      if (category <= 1) {
        return '分析结果显示您在演讲过程中焦虑程度较高，可能影响演讲效果。';
      }
      if (category <= 3) {
        return '分析结果显示您在演讲过程中存在中等程度的焦虑，部分表现受到影响。';
      }
      return '分析结果显示您在演讲过程中焦虑程度较低或无焦虑，表现自信从容。';
    },
    anxietyTips() {
      if (!this.anxietyResult) return [];
      // 解析category值，处理"[5]"格式的字符串
      const categoryStr = this.anxietyResult.category;
      let category;
      try {
        // 尝试解析JSON格式的字符串数组
        const parsedArray = JSON.parse(categoryStr);
        category = Array.isArray(parsedArray) ? parsedArray[0] : parseInt(categoryStr);
      } catch (e) {
        // 如果解析失败，尝试直接使用parseInt
        category = parseInt(categoryStr);
      }
      
      // 确保category是有效数字
      if (isNaN(category)) return [];
      
      if (category <= 1) {
        return [
          '演讲前进行5-10分钟冥想放松',
          '练习正念呼吸，缓解紧张情绪',
          '可考虑适当的幽默缓解紧张氛围',
          '提前熟悉演讲环境减少不确定性',
          '演讲中允许自己短暂停顿，不必急于填满每一秒'
        ];
      }
      if (category <= 3) {
        return [
          '演讲前进行深呼吸放松练习',
          '增加演讲彩排次数增强信心',
          '注意控制语速，给自己思考空间',
          '关注积极的听众反馈'
        ];
      }
      return [
        '继续保持良好的演讲状态',
        '可尝试增加演讲的互动性',
        '适当加入个人故事增强亲和力'
      ];
    }
  },
  mounted() {
    try {
      this.initializeHolistic()
    } catch (err) {
      this.error = err.message
      console.error('初始化失败:', err)
    }
  },
  beforeDestroy() {
    this.cleanupAudio()
    if (this.inputVideo) {
      URL.revokeObjectURL(this.inputVideo.src)
    }
  },
  methods: {
    async initializeHolistic() {
      try {
        this.holistic = new Holistic({
          locateFile: (file) => {
            // 根据环境使用不同的路径
            const basePath = process.env.NODE_ENV === 'production' 
              ? `${process.env.BASE_URL}mediapipe/`
              : '/mediapipe/'
            const path = `${basePath}${file}`
            console.log('Loading MediaPipe file:', path)
            return path
          }
        })

        // 添加文件加载检查
        const checkFile = async (file) => {
          try {
            const response = await fetch(`${process.env.BASE_URL}mediapipe/${file}`)
            if (!response.ok) {
              throw new Error(`Failed to load ${file}`)
            }
          } catch (err) {
            console.error(`MediaPipe file check failed: ${file}`, err)
            throw err
          }
        }

        // 检查必要文件
        await Promise.all([
          checkFile('holistic.js'),
          checkFile('holistic_solution_simd_wasm_bin.wasm')
        ])

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
          // console.log('MediaPipe results:', results) // 添加调试日志
          this.onResults(results)
        })

        this.isMediaPipeReady = true
      } catch (err) {
        console.error('初始化 MediaPipe 失败:', err)
        throw new Error('您的浏览器不支持所需的功能，请使用最新版本的 Chrome/Firefox/Edge 浏览器')
      }
    },

    async handleVideoUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      try {
        const video = this.$refs.inputVideo
        video.src = URL.createObjectURL(file)
        this.inputVideo = file

        // 重置分析结果
        this.anxietyResult = null;
        this.cleanupAudio(); // 清理之前的音频分析

        // 等待视频元数据加载
        await new Promise(resolve => {
          video.onloadedmetadata = resolve
        })

        // 初始化音频分析
        this.setupAudioAnalysis();

        // 移除旧的事件监听器
        video.removeEventListener('play', this.startProcessing)
        video.removeEventListener('pause', this.stopProcessing)
        
        // 添加新的事件监听器
        video.addEventListener('play', this.startProcessing)
        video.addEventListener('pause', this.stopProcessing)
        
        // 添加音频相关事件
        video.addEventListener('play', this.startAudioVisualization)
        video.addEventListener('pause', this.stopAudioVisualization)
      } catch (err) {
        this.error = '视频加载失败: ' + err.message
      }
    },

    toggleVideo() {
      if (this.videoRunning) {
        this.stopVideo()
      } else {
        this.startVideo()
      }
    },

    startVideo() {
      const video = this.$refs.inputVideo
      video.currentTime = 0
      video.play()
      this.videoRunning = true
    },

    stopVideo() {
      const video = this.$refs.inputVideo
      video.pause()
      this.videoRunning = false
    },

    startProcessing() {
      console.log('开始处理视频')
      this.videoRunning = true
      this.processVideo()
    },

    stopProcessing() {
      console.log('停止处理视频')
      this.videoRunning = false
    },

    async processVideo() {
      if (!this.videoRunning) return
      
      const video = this.$refs.inputVideo

      try {
        // 确保视频准备就绪
        if (video.readyState >= 2) {
          await this.holistic.send({image: video})
        }

        if (this.videoRunning) {
          requestAnimationFrame(this.processVideo)
        }
      } catch (err) {
        console.error('处理视频帧失败:', err)
      }
    },

    onResults(results) {
      if (!results || !this.$refs.outputCanvas) return
      
      const canvasElement = this.$refs.outputCanvas
      const canvasCtx = canvasElement.getContext("2d")
      
      try {
        canvasCtx.save()
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)

        // 绘制视频画面
        canvasCtx.drawImage(
          results.image, 0, 0, canvasElement.width, canvasElement.height)

        // 绘制人体姿势连接线
        if (results.poseLandmarks) {
          drawConnectors(
            canvasCtx, 
            results.poseLandmarks, 
            POSE_CONNECTIONS,  // 直接使用导入的常量
            { color: '#FFFFFF', lineWidth: 4 }
          )
          drawLandmarks(
            canvasCtx,
            results.poseLandmarks,
            { color: '#90EE90', lineWidth: 2 }
          )
        }

        // 绘制脸部网格
        if (results.faceLandmarks) {
          drawConnectors(
            canvasCtx, 
            results.faceLandmarks, 
            FACEMESH_TESSELATION,
            { color: '#C0C0C070', lineWidth: 1 }
          )
          drawConnectors(
            canvasCtx, results.faceLandmarks, FACEMESH_RIGHT_EYE,
            { color: '#FF3030', lineWidth: 2 }
          )
          drawConnectors(
            canvasCtx, results.faceLandmarks, FACEMESH_LEFT_EYE,
            { color: '#30FF30', lineWidth: 2 }
          )
          drawConnectors(
            canvasCtx, results.faceLandmarks, FACEMESH_FACE_OVAL,
            { color: '#E0E0E0', lineWidth: 2 }
          )
        }

        canvasCtx.restore()
      } catch (err) {
        console.error('绘制结果失败:', err)
      }
    },

    // 新增焦虑分析相关方法
    async analyzeAnxiety() {
      if (!this.inputVideo || this.isAnalyzing) return;
      
      this.isAnalyzing = true;
      this.analysisProgress = 0;
      this.anxietyResult = null;
      this.error = null;
      
      try {
        // 模拟上传进度
        this.startProgressSimulation();
        
        // 将视频文件读取为二进制数据
        const fileReader = new FileReader();
        const videoFile = this.inputVideo;
        
        // 使用Promise包装FileReader操作
        const readFileAsArrayBuffer = () => {
          return new Promise((resolve, reject) => {
            fileReader.onload = () => resolve(fileReader.result);
            fileReader.onerror = () => reject(new Error('读取文件失败'));
            fileReader.readAsArrayBuffer(videoFile);
          });
        };
        
        // 读取文件为二进制数据
        const videoData = await readFileAsArrayBuffer();
        
        // 第一步：上传视频获取ID - 直接发送二进制数据
        const uploadResponse = await axios.post(
          `${this.apiBaseUrl}/upload`, 
          videoData,
          {
            headers: {
              'Content-Type': videoFile.type || 'video/mp4'
            }
          }
        );
        
        if (uploadResponse.data.code !== 0) {
          throw new Error(`上传失败: ${uploadResponse.data.error_message || '未知错误'}`);
        }
        
        const videoId = uploadResponse.data.video_id;
        console.log('视频上传成功，ID:', videoId);
        
        // 设置进度为50%
        this.analysisProgress = 50;
        
        // 第二步：使用视频ID获取分析结果 - 优化轮询策略
        let detectionResponse;
        let retryCount = 0;
        const maxRetries = 6; // 保留减少的最大重试次数
        let waitTime = 2000; // 恢复为2秒的等待时间
        
        while (retryCount < maxRetries) {
          try {
            this.updateAnalysisStatus(`正在检查分析结果 (${retryCount + 1}/${maxRetries})...`);
            detectionResponse = await axios.get(
              `${this.apiBaseUrl}/detection?video_id=${videoId}`
            );
            
            // 如果成功获取结果
            if (detectionResponse.data.code === 0) {
              // 检查分析是否完成
              if (detectionResponse.data.status === "finished") {
                this.analysisProgress = 100;
                break;
              } else {
                // 状态不是finished，继续等待固定时间
                this.analysisProgress = 50 + ((retryCount + 1) / maxRetries) * 40;
                
                // 使用固定的2秒等待时间
                this.updateAnalysisStatus(`视频正在处理中，将在2秒后重试...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                retryCount++;
              }
            } else {
              // 服务器返回错误
              throw new Error(detectionResponse.data.error_message || '获取分析结果失败');
            }
          } catch (error) {
            // 网络错误或其他异常
            if (retryCount === maxRetries - 1) {
              throw error; // 最后一次尝试失败，抛出错误
            }
            
            // 使用固定的2秒等待时间
            this.updateAnalysisStatus(`请求失败，将在2秒后重试...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retryCount++;
          }
        }
        
        if (!detectionResponse || !detectionResponse.data || detectionResponse.data.code !== 0) {
          throw new Error('获取分析结果失败，请稍后再试');
        }
        
        // 分析完成，保存结果
        this.anxietyResult = {
          score100: detectionResponse.data.score100,
          category: detectionResponse.data.category
        };
        
        // 记录分析时间
        const now = new Date();
        this.analysisTime = now.toLocaleString();
        
        console.log('焦虑分析结果:', this.anxietyResult);
        
      } catch (error) {
        console.error('焦虑分析失败:', error);
        this.error = `焦虑分析失败: ${error.message || '未知错误'}`;
      } finally {
        // 分析完成
        this.isAnalyzing = false;
      }
    },
    
    // 新增方法：更新分析状态信息
    updateAnalysisStatus(message) {
      const loadingElement = document.querySelector('.loading-analysis p');
      if (loadingElement) {
        loadingElement.textContent = message;
      }
    },
    
    // 模拟进度条
    startProgressSimulation() {
      let progress = 0;
      const interval = setInterval(() => {
        if (!this.isAnalyzing) {
          clearInterval(interval);
          return;
        }
        
        // 只模拟到45%，后面的进度由实际分析过程更新
        if (progress < 45) {
          progress += Math.random() * 2;
          this.analysisProgress = Math.min(progress, 45);
        } else {
          clearInterval(interval);
        }
      }, 300);
    },

    // 音频分析相关方法
    setupAudioAnalysis() {
      try {
        // 清理之前的资源
        this.cleanupAudio();
        
        // 创建音频上下文
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        
        // 获取视频元素
        const video = this.$refs.inputVideo;
        
        // 从视频创建音频源
        this.audioSource = this.audioContext.createMediaElementSource(video);
        
        // 创建分析器
        this.audioAnalyser = this.audioContext.createAnalyser();
        this.audioAnalyser.fftSize = 256;
        const bufferLength = this.audioAnalyser.frequencyBinCount;
        this.audioDataArray = new Uint8Array(bufferLength);
        
        // 连接节点
        this.audioSource.connect(this.audioAnalyser);
        this.audioAnalyser.connect(this.audioContext.destination);
        
        // 初始化Canvas
        const canvas = this.$refs.audioCanvas;
        if (canvas) {
          canvas.width = canvas.offsetWidth || 300;
          canvas.height = canvas.offsetHeight || 150;
          this.audioCanvasCtx = canvas.getContext('2d');
        }
        
        console.log('音频分析设置完成');
      } catch (err) {
        console.error('设置音频分析失败:', err);
        this.error = '无法分析音频: ' + err.message;
      }
    },
    
    cleanupAudio() {
      // 停止正在运行的动画
      if (this.audioAnimationFrameId) {
        cancelAnimationFrame(this.audioAnimationFrameId);
        this.audioAnimationFrameId = null;
      }
      
      // 断开并关闭音频上下文
      if (this.audioSource) {
        try {
          this.audioSource.disconnect();
        } catch (e) {}
        this.audioSource = null;
      }
      
      if (this.audioAnalyser) {
        try {
          this.audioAnalyser.disconnect();
        } catch (e) {}
        this.audioAnalyser = null;
      }
      
      if (this.audioContext) {
        try {
          if (this.audioContext.state !== 'closed') {
            this.audioContext.close();
          }
        } catch (e) {}
        this.audioContext = null;
      }
      
      this.isAudioVisualizationActive = false;
      this.audioDataArray = null;
      this.audioAnalysisStats = null;
    },
    
    toggleAudioVisualization() {
      if (this.isAudioVisualizationActive) {
        this.stopAudioVisualization();
      } else {
        this.startAudioVisualization();
      }
    },
    
    startAudioVisualization() {
      if (!this.audioContext || !this.audioAnalyser || !this.audioCanvasCtx) {
        this.setupAudioAnalysis();
      }
      
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      this.isAudioVisualizationActive = true;
      this.drawAudioSpectrum();
    },
    
    stopAudioVisualization() {
      this.isAudioVisualizationActive = false;
      if (this.audioAnimationFrameId) {
        cancelAnimationFrame(this.audioAnimationFrameId);
        this.audioAnimationFrameId = null;
      }
    },
    
    drawAudioSpectrum() {
      if (!this.isAudioVisualizationActive || !this.audioAnalyser || !this.audioCanvasCtx) {
        return;
      }
      
      // 获取Canvas尺寸
      const canvas = this.$refs.audioCanvas;
      const width = canvas.width;
      const height = canvas.height;
      
      // 获取频率数据
      this.audioAnalyser.getByteFrequencyData(this.audioDataArray);
      
      // 清空画布
      this.audioCanvasCtx.clearRect(0, 0, width, height);
      
      // 计算柱状图参数
      const barWidth = (width / this.audioDataArray.length) * 2.5;
      let barHeight;
      let x = 0;
      
      // 计算音量和主频率
      let totalAmplitude = 0;
      let dominantFrequency = 0;
      let maxAmplitude = 0;
      
      // 绘制频谱 - 修改为绿色系渐变
      const gradient = this.audioCanvasCtx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(76, 175, 80, 1)'); // 深绿色
      gradient.addColorStop(0.5, 'rgba(129, 199, 132, 0.8)'); // 中绿色
      gradient.addColorStop(1, 'rgba(165, 214, 167, 0.6)'); // 浅绿色
      
      for (let i = 0; i < this.audioDataArray.length; i++) {
        barHeight = this.audioDataArray[i] / 255 * height;
        
        // 累加总振幅
        totalAmplitude += this.audioDataArray[i];
        
        // 检查是否是主频率
        if (this.audioDataArray[i] > maxAmplitude) {
          maxAmplitude = this.audioDataArray[i];
          // AudioContext的采样率通常是44100，FFT大小是256，所以每个bin代表约172Hz
          dominantFrequency = i * (22050 / this.audioDataArray.length);
        }
        
        this.audioCanvasCtx.fillStyle = gradient;
        this.audioCanvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
      
      // 更新音频统计信息
      const averageAmplitude = totalAmplitude / this.audioDataArray.length;
      const volume = Math.round((averageAmplitude / 255) * 100);
      
      this.audioAnalysisStats = {
        dominantFrequency: Math.round(dominantFrequency),
        volume: volume + '%'
      };
      
      // 继续动画循环
      this.audioAnimationFrameId = requestAnimationFrame(this.drawAudioSpectrum);
    }
  }
}
</script>

<style scoped>
.container {
  padding: 20px;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1440px;
  margin: 0 auto;
}

/* 卡片行样式 */
.card-row {
  display: flex;
  gap: 20px;
  width: 100%;
}

/* 视频区域共同样式 */
.videoView {
  width: 50%;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 视频容器 */
.video-container {
  position: relative;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
  flex: 1;
  padding-top: 75%; /* 4:3 比例 */
}

/* 视频和画布元素 */
.input-video,
.output_canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 恢复画布的镜像效果 */
.output_canvas {
  transform: rotateY(180deg);
  -webkit-transform: rotateY(180deg);
  -moz-transform: rotateY(180deg);
}

/* 控制面板 */
.control-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
  margin: 0;
}

/* 视频控制区 */
.video-controls {
  display: flex;
  gap: 10px;
  background: none;
  padding: 0;
}

/* 录制计时器 */
.recording-timer {
  padding: 6px 12px;
  background: #ff4444;
  color: white;
  border-radius: 4px;
  font-weight: 500;
}

/* 错误消息 */
.error-message {
  color: #ff4444;
  padding: 15px;
  text-align: center;
  border: 1px solid #ffccc7;
  background-color: #fff2f0;
  border-radius: 4px;
  margin-bottom: 15px;
}

/* 加载消息 */
.loading-message {
  text-align: center;
  padding: 15px;
  color: #666;
  margin-bottom: 15px;
}

/* 按钮基础样式 */
.custom-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  gap: 6px;
  color: white;
}

.custom-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 按钮颜色 */
.primary-button { background-color: #4CAF50; }
.analyze-button { background-color: #9C27B0; }
.record-button { background-color: #2196F3; }
.record-button.recording { background-color: #f44336; }
.success-button { background-color: #00BCD4; }
.danger-button { background-color: #FF5722; }

/* 移除不需要的样式 */
.video-wrapper {
  display: none;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .card-row {
    flex-direction: column;
  }
  
  .videoView {
    width: 100%;
  }
}

/* 录制的视频容器 */
.recorded-video-container {
  position: relative;
  width: 100%;
  padding-top: 75%; /* 4:3 比例 */
}

/* 空视频占位符 */
.empty-video-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.empty-video-placeholder i {
  font-size: 48px;
  margin-bottom: 10px;
}

/* 新增样式 */
.processing-status {
  color: #666;
  font-weight: 500;
}

.input-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000; /* 视频背景色 */
}

/* 自定义视频控件样式 */
.input-video::-webkit-media-controls {
  background-color: rgba(0, 0, 0, 0.5);
}

.input-video::-webkit-media-controls-panel {
  display: flex;
  align-items: center;
  padding: 0 10px;
}

.input-video::-webkit-media-controls-play-button {
  cursor: pointer;
}

.input-video::-webkit-media-controls-timeline {
  cursor: pointer;
}

.input-video::-webkit-media-controls-volume-slider {
  cursor: pointer;
}

/* 焦虑分析相关样式 */
.analysis-status {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #9C27B0;
  font-weight: 500;
}

.loading-analysis {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #9C27B0;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.progress-bar {
  width: 80%;
  height: 8px;
  background-color: #f3f3f3;
  border-radius: 4px;
  margin-top: 15px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background-color: #9C27B0;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.anxiety-result {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
  background: white;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  color: #333;
}

.result-header i {
  font-size: 24px;
  color: #9C27B0;
}

.result-header h3 {
  margin: 0;
  font-size: 20px;
}

.score-container {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.level-low {
  background: linear-gradient(135deg, #4CAF50, #8BC34A);
}

.level-medium {
  background: linear-gradient(135deg, #FF9800, #FFC107);
}

.level-high {
  background: linear-gradient(135deg, #F44336, #FF5722);
}

.score-value {
  font-size: 36px;
  font-weight: bold;
}

.score-label {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 5px;
}

.score-details {
  flex: 1;
}

.anxiety-level {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.level-badge {
  padding: 4px 10px;
  border-radius: 12px;
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.anxiety-description {
  margin-bottom: 10px;
  color: #555;
  line-height: 1.5;
}

.analysis-time {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #777;
  font-size: 13px;
}

.recommendations {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.recommendations h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
}

.recommendations i {
  color: #FFC107;
}

.recommendations ul {
  padding-left: 25px;
  margin: 0;
}

.recommendations li {
  margin-bottom: 8px;
  color: #555;
  line-height: 1.4;
}

/* 音频频谱相关样式 */
.audio-button {
  background-color: #4CAF50;
}

.audio-canvas {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.spectrum-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  border-radius: 4px;
  overflow: hidden;
}

.spectrum-info {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background-color: rgba(76, 175, 80, 0.7);
  border-radius: 4px;
  padding: 8px 12px;
  color: white;
}

.audio-stat {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 12px;
}

.stat-label {
  margin-right: 10px;
  opacity: 0.8;
}

.stat-value {
  font-weight: bold;
}

.audio-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>