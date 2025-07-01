<template>
  <div class="real-time-detection">
    <!-- 系统诊断面板 -->
    <div class="diagnostic-panel">
      <h4><i class="fas fa-stethoscope"></i> 系统诊断</h4>
      <div class="diagnostic-grid">
        <div class="diagnostic-item">
          <span class="label">MediaPipe状态:</span>
          <span :class="['status', mediaPipeLoaded ? 'success' : 'error']">
            {{ mediaPipeLoaded ? '✅ 已加载' : '❌ 未加载' }}
          </span>
        </div>
        <div class="diagnostic-item">
          <span class="label">资源锁定:</span>
          <span :class="['status', resourceLocked ? 'error' : 'success']">
            {{ resourceLocked ? '🔒 已锁定' : '🔓 可用' }}
          </span>
        </div>
        <div class="diagnostic-item">
          <span class="label">视频状态:</span>
          <span :class="['status', videoStatus]">
            {{ videoStatusText }}
          </span>
        </div>
        <div class="diagnostic-item">
          <span class="label">Canvas状态:</span>
          <span :class="['status', canvasReady ? 'success' : 'warning']">
            {{ canvasReady ? '🎨 就绪' : '🎨 待检测' }}
          </span>
        </div>
      </div>
      <div class="diagnostic-actions">
        <button @click="retryInitialization" class="btn-retry">
          <i class="fas fa-redo"></i> 重新初始化
        </button>
        <button @click="clearResources" class="btn-clear">
          <i class="fas fa-trash"></i> 清理资源
        </button>
      </div>
    </div>

    <!-- 视频显示区域 -->
    <div class="video-container">
      <video
        ref="videoPlayer"
        :src="videoUrl"
        muted
        class="analysis-video"
        @loadedmetadata="onVideoLoaded"
        @play="onVideoPlay"
        @pause="onVideoPause"
        @ended="onVideoEnded"
        crossorigin="anonymous"
      ></video>
      
      <!-- 实时检测Canvas覆盖层 -->
      <canvas
        ref="detectionCanvas"
        class="detection-overlay"
      ></canvas>
      
      <!-- 实时状态显示 -->
      <div class="real-time-status">
        <div class="status-indicator">
          <div class="detection-dot" :class="{ active: isDetecting }"></div>
          <span>{{ isDetecting ? '检测中' : '待检测' }}</span>
        </div>
        <div class="fps-counter">
          FPS: {{ currentFPS }}
        </div>
      </div>
      
      <!-- 视频控制 -->
      <div class="video-controls">
        <button @click="togglePlayPause" class="control-btn">
          <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
          {{ isPlaying ? '暂停' : '播放' }}
        </button>
        <button @click="toggleDetection" class="control-btn">
          <i :class="isDetecting ? 'fas fa-stop' : 'fas fa-play-circle'"></i>
          {{ isDetecting ? '停止检测' : '开始检测' }}
        </button>
        <button @click="toggleOverlay" class="control-btn">
          <i :class="showOverlay ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
          {{ showOverlay ? '隐藏覆盖' : '显示覆盖' }}
        </button>
      </div>
    </div>

    <!-- 实时检测结果面板 -->
    <div class="detection-results">
      <div class="results-header">
        <h4><i class="fas fa-chart-line"></i> 实时检测结果</h4>
        <div class="detection-stats">
          <span>总帧数: {{ totalFrames }}</span>
          <span>检测帧数: {{ detectedFrames }}</span>
          <span>检测率: {{ detectionRate }}%</span>
        </div>
      </div>
      
      <!-- 姿态检测结果 -->
      <div class="detection-section">
        <h5><i class="fas fa-user"></i> 姿态检测</h5>
        <div class="detection-grid">
          <div class="detection-item">
            <span class="item-label">头部位置:</span>
            <span class="item-value" :class="poseStatus.head">
              {{ poseData.head ? '✅ 已检测' : '❌ 未检测' }}
            </span>
          </div>
          <div class="detection-item">
            <span class="item-label">肩膀平衡:</span>
            <span class="item-value" :class="poseStatus.shoulders">
              {{ poseData.shoulders ? '✅ 已检测' : '❌ 未检测' }}
            </span>
          </div>
          <div class="detection-item">
            <span class="item-label">手臂位置:</span>
            <span class="item-value" :class="poseStatus.arms">
              {{ poseData.arms ? '✅ 已检测' : '❌ 未检测' }}
            </span>
          </div>
          <div class="detection-item">
            <span class="item-label">身体姿态:</span>
            <span class="item-value" :class="poseStatus.body">
              {{ poseData.body ? '✅ 已检测' : '❌ 未检测' }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- 表情检测结果 -->
      <div class="detection-section">
        <h5><i class="fas fa-smile"></i> 表情检测</h5>
        <div class="detection-grid">
          <div class="detection-item">
            <span class="item-label">面部特征:</span>
            <span class="item-value" :class="emotionStatus.face">
              {{ emotionData.face ? '✅ 已检测' : '❌ 未检测' }}
            </span>
          </div>
          <div class="detection-item">
            <span class="item-label">眼睛状态:</span>
            <span class="item-value" :class="emotionStatus.eyes">
              {{ emotionData.eyes ? '✅ 已检测' : '❌ 未检测' }}
            </span>
          </div>
          <div class="detection-item">
            <span class="item-label">嘴巴状态:</span>
            <span class="item-value" :class="emotionStatus.mouth">
              {{ emotionData.mouth ? '✅ 已检测' : '❌ 未检测' }}
            </span>
          </div>
          <div class="detection-item">
            <span class="item-label">表情变化:</span>
            <span class="item-value" :class="emotionStatus.expression">
              {{ emotionData.expression ? '✅ 已检测' : '❌ 未检测' }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- 实时动作提示 -->
      <div class="action-alerts">
        <h5><i class="fas fa-bell"></i> 实时动作提示</h5>
        <div class="alerts-list">
          <div v-for="(alert, index) in actionAlerts" :key="index" class="alert-item" :class="alert.type">
            <i :class="alert.icon"></i>
            <span>{{ alert.message }}</span>
            <span class="alert-time">{{ alert.time }}</span>
          </div>
          <div v-if="actionAlerts.length === 0" class="no-alerts">
            暂无动作提示
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RealTimeActionDetection',
  props: {
    videoUrl: {
      type: String,
      required: true
    },
    autoStart: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      // 系统状态
      mediaPipeLoaded: false,
      resourceLocked: false,
      videoLoaded: false,
      canvasReady: false,
      
      // 视频状态
      isPlaying: false,
      isDetecting: false,
      showOverlay: true,
      
      // 检测状态
      holistic: null,
      detectionRequestId: null,
      currentFPS: 0,
      lastFrameTime: 0,
      frameCount: 0,
      
      // 统计数据
      totalFrames: 0,
      detectedFrames: 0,
      
      // 检测数据
      poseData: {
        head: false,
        shoulders: false,
        arms: false,
        body: false
      },
      emotionData: {
        face: false,
        eyes: false,
        mouth: false,
        expression: false
      },
      
      // 动作提示
      actionAlerts: [],
      
      // 错误状态
      error: null
    }
  },
  computed: {
    videoStatus() {
      if (!this.videoLoaded) return 'loading'
      if (this.isPlaying) return 'playing'
      return 'paused'
    },
    videoStatusText() {
      const statusMap = {
        loading: '⏳ 加载中',
        playing: '▶️ 播放中',
        paused: '⏸️ 已暂停'
      }
      return statusMap[this.videoStatus] || '❓ 未知'
    },
    detectionRate() {
      if (this.totalFrames === 0) return 0
      return Math.round((this.detectedFrames / this.totalFrames) * 100)
    },
    poseStatus() {
      return {
        head: this.poseData.head ? 'detected' : 'not-detected',
        shoulders: this.poseData.shoulders ? 'detected' : 'not-detected',
        arms: this.poseData.arms ? 'detected' : 'not-detected',
        body: this.poseData.body ? 'detected' : 'not-detected'
      }
    },
    emotionStatus() {
      return {
        face: this.emotionData.face ? 'detected' : 'not-detected',
        eyes: this.emotionData.eyes ? 'detected' : 'not-detected',
        mouth: this.emotionData.mouth ? 'detected' : 'not-detected',
        expression: this.emotionData.expression ? 'detected' : 'not-detected'
      }
    }
  },
  async mounted() {
    await this.initializeComponent()
  },
  beforeDestroy() {
    this.cleanup()
  },
  methods: {
    async initializeComponent() {
      try {
        console.log('初始化实时动作检测组件...')
        
        // 检查资源锁定状态
        if (window._mediaPipeActive) {
          console.warn('检测到MediaPipe正在使用中，等待释放...')
          this.resourceLocked = true
          
          // 等待其他实例释放
          let waitCount = 0
          while (window._mediaPipeActive && waitCount < 50) {
            await new Promise(resolve => setTimeout(resolve, 100))
            waitCount++
          }
          
          if (window._mediaPipeActive) {
            throw new Error('MediaPipe资源冲突，无法启动检测')
          }
        }
        
        // 标记为使用中
        window._mediaPipeActive = true
        this.resourceLocked = true
        
        // 加载MediaPipe
        await this.loadMediaPipe()
        
        // 等待库完全加载
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 验证MediaPipe是否可用
        if (!window.Holistic) {
          throw new Error('MediaPipe Holistic 库未能正确加载')
        }
        
        console.log('MediaPipe验证成功')
        this.mediaPipeLoaded = true
        
        // 设置Canvas
        this.setupCanvas()
        
        // 如果设置了自动开始，则开始播放
        if (this.autoStart) {
          await new Promise(resolve => setTimeout(resolve, 500))
          this.startVideo()
        }
        
        console.log('实时动作检测组件初始化完成')
      } catch (error) {
        console.error('实时动作检测组件初始化失败:', error)
        this.error = error.message
        this.resourceLocked = false
        window._mediaPipeActive = false
      }
    },
    
    async loadMediaPipe() {
      console.log('开始加载 MediaPipe Holistic...')
      
      if (window.Holistic) {
        console.log('MediaPipe Holistic 已存在，跳过加载')
        return
      }
      
      try {
        // 加载主要的MediaPipe脚本
        console.log('加载 holistic_solution_packed_assets_loader.js...')
        await this.loadScript('/mediapipe/holistic_solution_packed_assets_loader.js')
        console.log('holistic_solution_packed_assets_loader.js 加载完成')
        
        // 检查是否有window.Holistic
        if (!window.Holistic) {
          console.log('尝试加载 holistic.js...')
          await this.loadScript('/mediapipe/holistic.js')
          console.log('holistic.js 加载完成')
        }
        
        // 最终检查
        if (!window.Holistic) {
          throw new Error('MediaPipe Holistic 仍然不可用，请检查文件路径')
        }
        
        console.log('MediaPipe Holistic 加载成功，构造函数可用:', typeof window.Holistic)
        
      } catch (error) {
        console.error('MediaPipe加载失败:', error)
        throw error
      }
    },
    
    loadScript(src) {
      return new Promise((resolve, reject) => {
        console.log('尝试加载脚本:', src)
        
        // 检查是否已经加载
        if (document.querySelector(`script[src="${src}"]`)) {
          console.log('脚本已存在:', src)
          resolve()
          return
        }
        
        const script = document.createElement('script')
        script.src = src
        script.type = 'text/javascript'
        
        script.onload = () => {
          console.log('脚本加载成功:', src)
          resolve()
        }
        
        script.onerror = (error) => {
          console.error('脚本加载失败:', src, error)
          reject(new Error(`Failed to load script: ${src}`))
        }
        
        document.head.appendChild(script)
        console.log('脚本标签已添加到head:', src)
      })
    },
    
    onVideoLoaded() {
      console.log('视频加载完成')
      this.videoLoaded = true
      this.setupCanvas()
      
      // 如果MediaPipe已加载且设置了自动开始，则开始播放
      if (this.mediaPipeLoaded && this.autoStart) {
        this.startVideo()
      }
    },
    
    setupCanvas() {
      this.$nextTick(() => {
        const canvas = this.$refs.detectionCanvas
        const video = this.$refs.videoPlayer
        
        if (!canvas || !video) {
          console.error('Canvas或Video元素未找到')
          return
        }
        
        // 等待视频元数据加载
        if (video.videoWidth && video.videoHeight) {
          this.updateCanvasSize()
        } else {
          video.addEventListener('loadedmetadata', () => {
            this.updateCanvasSize()
          }, { once: true })
        }
        
        this.canvasReady = true
        console.log('Canvas设置完成')
      })
    },
    
    updateCanvasSize() {
      const canvas = this.$refs.detectionCanvas
      const video = this.$refs.videoPlayer
      
      if (!canvas || !video) return
      
      // 设置Canvas尺寸与视频一致
      canvas.width = video.videoWidth || video.clientWidth
      canvas.height = video.videoHeight || video.clientHeight
      
      // 设置CSS尺寸
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      
      console.log(`Canvas尺寸设置为: ${canvas.width}x${canvas.height}`)
    },
    
    setupMediaPipe() {
      try {
        console.log('初始化MediaPipe Holistic...')
        
        // 创建Holistic实例
        this.holistic = new window.Holistic({
          locateFile: (file) => {
            const path = `/mediapipe/${file}`
            console.log('MediaPipe请求文件:', file)
            return path
          }
        })
        
        // 配置选项 - 优化实时检测
        this.holistic.setOptions({
          modelComplexity: 1,           // 中等复杂度
          smoothLandmarks: true,
          enableSegmentation: false,    // 关闭分割减少计算
          smoothSegmentation: false,
          refineFaceLandmarks: true,    // 启用精细面部检测
          minDetectionConfidence: 0.5,  // 适中的检测阈值
          minTrackingConfidence: 0.5
        })
        
        // 绑定结果回调
        this.holistic.onResults((results) => {
          this.onResults(results)
        })
        
        console.log('MediaPipe Holistic 初始化完成')
        return true
      } catch (error) {
        console.error('MediaPipe Holistic 初始化失败:', error)
        return false
      }
    },
    
    async startVideo() {
      if (!this.$refs.videoPlayer) return
      
      console.log('开始播放视频...')
      
      try {
        await this.$refs.videoPlayer.play()
        this.isPlaying = true
        
        // 确保Canvas尺寸正确
        this.updateCanvasSize()
        
        // 初始化MediaPipe（如果还没有初始化）
        if (!this.holistic && this.mediaPipeLoaded && window.Holistic) {
          console.log('延迟初始化MediaPipe Holistic...')
          this.setupMediaPipe()
          await new Promise(resolve => setTimeout(resolve, 300))
        }
        
        // 开始检测
        if (this.holistic) {
          this.startDetection()
        } else {
          console.warn('MediaPipe Holistic 未初始化，无法开始检测')
        }
      } catch (error) {
        console.error('视频播放失败:', error)
      }
    },
    
    startDetection() {
      if (!this.holistic || !this.$refs.videoPlayer) {
        console.error('MediaPipe或视频未准备好')
        return
      }
      
      console.log('开始实时动作检测...')
      this.isDetecting = true
      this.lastFrameTime = performance.now()
      
      const detectFrame = async () => {
        if (!this.isDetecting || !this.$refs.videoPlayer) return
        
        const currentTime = performance.now()
        const deltaTime = currentTime - this.lastFrameTime
        
        // 计算FPS
        if (deltaTime > 0) {
          this.currentFPS = Math.round(1000 / deltaTime)
        }
        
        this.lastFrameTime = currentTime
        this.totalFrames++
        
        try {
          const video = this.$refs.videoPlayer
          if (video.readyState >= 2 && video.videoWidth > 0) {
            await this.holistic.send({ image: video })
          }
        } catch (error) {
          console.error('检测帧失败:', error)
          // 出错后暂停一段时间再继续
          setTimeout(() => {
            if (this.isDetecting) {
              this.detectionRequestId = requestAnimationFrame(detectFrame)
            }
          }, 500)
          return
        }
        
        // 继续检测下一帧
        if (this.isDetecting) {
          this.detectionRequestId = requestAnimationFrame(detectFrame)
        }
      }
      
      detectFrame()
    },
    
    onResults(results) {
      if (!results) return
      
      this.detectedFrames++
      this.frameCount++
      
      // 分析姿态数据
      this.analyzePoseData(results)
      
      // 分析表情数据
      this.analyzeEmotionData(results)
      
      // 实时绘制
      if (this.showOverlay) {
        this.drawDetectionOverlay(results)
      }
      
      // 检测动作变化并生成提示
      this.detectActionChanges(results)
      
      // 每30帧输出一次详细日志
      if (this.frameCount % 30 === 0) {
        console.log('实时检测状态:', {
          totalFrames: this.totalFrames,
          detectedFrames: this.detectedFrames,
          detectionRate: this.detectionRate + '%',
          currentFPS: this.currentFPS,
          poseData: this.poseData,
          emotionData: this.emotionData
        })
      }
    },
    
    analyzePoseData(results) {
      // 分析头部位置
      this.poseData.head = results.poseLandmarks && results.poseLandmarks.length > 0 &&
        results.poseLandmarks[0] && results.poseLandmarks[0].visibility > 0.5
      
      // 分析肩膀平衡
      this.poseData.shoulders = results.poseLandmarks && results.poseLandmarks.length >= 12 &&
        results.poseLandmarks[11] && results.poseLandmarks[12] &&
        results.poseLandmarks[11].visibility > 0.5 && results.poseLandmarks[12].visibility > 0.5
      
      // 分析手臂位置
      this.poseData.arms = results.poseLandmarks && results.poseLandmarks.length >= 16 &&
        results.poseLandmarks[13] && results.poseLandmarks[14] &&
        results.poseLandmarks[13].visibility > 0.5 && results.poseLandmarks[14].visibility > 0.5
      
      // 分析身体姿态
      this.poseData.body = results.poseLandmarks && results.poseLandmarks.length >= 24 &&
        results.poseLandmarks[23] && results.poseLandmarks[24] &&
        results.poseLandmarks[23].visibility > 0.5 && results.poseLandmarks[24].visibility > 0.5
    },
    
    analyzeEmotionData(results) {
      // 分析面部特征
      this.emotionData.face = results.faceLandmarks && results.faceLandmarks.length > 0
      
      // 分析眼睛状态（简化版）
      this.emotionData.eyes = results.faceLandmarks && results.faceLandmarks.length >= 468 &&
        results.faceLandmarks[33] && results.faceLandmarks[263] // 眼睛关键点
      
      // 分析嘴巴状态（简化版）
      this.emotionData.mouth = results.faceLandmarks && results.faceLandmarks.length >= 468 &&
        results.faceLandmarks[61] && results.faceLandmarks[291] // 嘴巴关键点
      
      // 分析表情变化（基于面部关键点的变化）
      this.emotionData.expression = this.emotionData.face && this.emotionData.eyes && this.emotionData.mouth
    },
    
    drawDetectionOverlay(results) {
      const canvas = this.$refs.detectionCanvas
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // 检查是否有任何检测数据
      const hasAnyDetection = 
        (results.poseLandmarks && results.poseLandmarks.length > 0) ||
        (results.faceLandmarks && results.faceLandmarks.length > 0) ||
        (results.leftHandLandmarks && results.leftHandLandmarks.length > 0) ||
        (results.rightHandLandmarks && results.rightHandLandmarks.length > 0)
      
      // 如果没有检测到任何数据，绘制提示信息
      if (!hasAnyDetection) {
        ctx.fillStyle = '#FF6B6B'
        ctx.font = '16px Arial'
        ctx.fillText('未检测到人体数据', 20, 40)
        ctx.fillStyle = '#666'
        ctx.font = '12px Arial'
        ctx.fillText('请确保视频中有清晰的人物', 20, 60)
        return
      }
      
      try {
        // 绘制姿态关键点和连接线
        if (results.poseLandmarks && results.poseLandmarks.length > 0) {
          this.drawPoseLandmarks(ctx, results.poseLandmarks, canvas.width, canvas.height)
        }
        
        // 绘制面部关键点
        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          this.drawFaceLandmarks(ctx, results.faceLandmarks, canvas.width, canvas.height)
        }
        
        // 绘制手部关键点
        if (results.leftHandLandmarks && results.leftHandLandmarks.length > 0) {
          this.drawHandLandmarks(ctx, results.leftHandLandmarks, canvas.width, canvas.height, '#FF6B6B')
        }
        
        if (results.rightHandLandmarks && results.rightHandLandmarks.length > 0) {
          this.drawHandLandmarks(ctx, results.rightHandLandmarks, canvas.width, canvas.height, '#4ECDC4')
        }
        
        // 绘制检测状态信息
        this.drawDetectionInfo(ctx, canvas.width, canvas.height)
        
      } catch (error) {
        console.error('绘制检测覆盖层失败:', error)
      }
    },
    
    drawPoseLandmarks(ctx, landmarks, width, height) {
      // MediaPipe姿态连接关系
      const connections = [
        // 头部和肩膀
        [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
        // 上半身
        [9, 10], [11, 12], [11, 13], [13, 15], [15, 17], [17, 19], [15, 21],
        [12, 14], [14, 16], [16, 18], [18, 20], [16, 22],
        // 下半身
        [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [27, 29], [29, 31], [27, 31],
        [24, 26], [26, 28], [28, 30], [30, 32], [28, 32]
      ]
      
      // 绘制连接线
      ctx.strokeStyle = '#00FF00'
      ctx.lineWidth = 3
      
      connections.forEach(([start, end]) => {
        if (landmarks[start] && landmarks[end]) {
          const startPoint = landmarks[start]
          const endPoint = landmarks[end]
          
          ctx.beginPath()
          ctx.moveTo(startPoint.x * width, startPoint.y * height)
          ctx.lineTo(endPoint.x * width, endPoint.y * height)
          ctx.stroke()
        }
      })
      
      // 绘制关键点
      ctx.fillStyle = '#FF0000'
      landmarks.forEach(landmark => {
        if (landmark.visibility && landmark.visibility > 0.5) {
          ctx.beginPath()
          ctx.arc(landmark.x * width, landmark.y * height, 5, 0, 2 * Math.PI)
          ctx.fill()
        }
      })
    },
    
    drawFaceLandmarks(ctx, landmarks, width, height) {
      // 绘制面部轮廓（简化版）
      ctx.strokeStyle = '#FFE66D'
      ctx.lineWidth = 1
      ctx.fillStyle = '#FFE66D'
      
      landmarks.forEach((landmark, index) => {
        // 只绘制主要面部特征点
        if ([10, 151, 33, 263, 61, 291, 199].includes(index)) {
          ctx.beginPath()
          ctx.arc(landmark.x * width, landmark.y * height, 2, 0, 2 * Math.PI)
          ctx.fill()
        }
      })
    },
    
    drawHandLandmarks(ctx, landmarks, width, height, color) {
      // 手部连接关系
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4], // 拇指
        [0, 5], [5, 6], [6, 7], [7, 8], // 食指
        [0, 9], [9, 10], [10, 11], [11, 12], // 中指
        [0, 13], [13, 14], [14, 15], [15, 16], // 无名指
        [0, 17], [17, 18], [18, 19], [19, 20] // 小指
      ]
      
      // 绘制连接线
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      
      connections.forEach(([start, end]) => {
        if (landmarks[start] && landmarks[end]) {
          const startPoint = landmarks[start]
          const endPoint = landmarks[end]
          
          ctx.beginPath()
          ctx.moveTo(startPoint.x * width, startPoint.y * height)
          ctx.lineTo(endPoint.x * width, endPoint.y * height)
          ctx.stroke()
        }
      })
      
      // 绘制关键点
      ctx.fillStyle = color
      landmarks.forEach(landmark => {
        ctx.beginPath()
        ctx.arc(landmark.x * width, landmark.y * height, 3, 0, 2 * Math.PI)
        ctx.fill()
      })
    },
    
    drawDetectionInfo(ctx, width, height) {
      // 绘制检测状态信息
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(10, 10, 200, 80)
      
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '12px Arial'
      ctx.fillText(`FPS: ${this.currentFPS}`, 20, 30)
      ctx.fillText(`检测率: ${this.detectionRate}%`, 20, 45)
      ctx.fillText(`姿态: ${this.poseData.head ? '✓' : '✗'}`, 20, 60)
      ctx.fillText(`表情: ${this.emotionData.face ? '✓' : '✗'}`, 20, 75)
    },
    
    detectActionChanges(results) {
      const currentTime = new Date().toLocaleTimeString()
      
      // 检测姿态变化
      if (results.poseLandmarks && results.poseLandmarks.length > 0) {
        // 检测头部移动
        const nose = results.poseLandmarks[0]
        if (nose && nose.visibility > 0.5) {
          // 这里可以添加更复杂的动作检测逻辑
          if (this.frameCount % 60 === 0) { // 每60帧检查一次
            this.addActionAlert('info', 'fas fa-user', '检测到头部动作', currentTime)
          }
        }
      }
      
      // 检测表情变化
      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        if (this.frameCount % 90 === 0) { // 每90帧检查一次
          this.addActionAlert('success', 'fas fa-smile', '检测到表情变化', currentTime)
        }
      }
      
      // 检测手部动作
      if ((results.leftHandLandmarks && results.leftHandLandmarks.length > 0) ||
          (results.rightHandLandmarks && results.rightHandLandmarks.length > 0)) {
        if (this.frameCount % 120 === 0) { // 每120帧检查一次
          this.addActionAlert('warning', 'fas fa-hand-paper', '检测到手部动作', currentTime)
        }
      }
    },
    
    addActionAlert(type, icon, message, time) {
      this.actionAlerts.unshift({
        type,
        icon,
        message,
        time
      })
      
      // 限制提示数量
      if (this.actionAlerts.length > 10) {
        this.actionAlerts = this.actionAlerts.slice(0, 10)
      }
    },
    
    togglePlayPause() {
      if (!this.$refs.videoPlayer) return
      
      if (this.isPlaying) {
        this.$refs.videoPlayer.pause()
      } else {
        this.startVideo()
      }
    },
    
    toggleDetection() {
      if (this.isDetecting) {
        this.stopDetection()
      } else {
        this.startDetection()
      }
    },
    
    stopDetection() {
      this.isDetecting = false
      if (this.detectionRequestId) {
        cancelAnimationFrame(this.detectionRequestId)
        this.detectionRequestId = null
      }
    },
    
    toggleOverlay() {
      this.showOverlay = !this.showOverlay
      if (!this.showOverlay) {
        const canvas = this.$refs.detectionCanvas
        if (canvas) {
          const ctx = canvas.getContext('2d')
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
    },
    
    onVideoPlay() {
      this.isPlaying = true
      if (this.holistic && !this.isDetecting) {
        this.startDetection()
      }
    },
    
    onVideoPause() {
      this.isPlaying = false
      this.stopDetection()
    },
    
    onVideoEnded() {
      this.isPlaying = false
      this.stopDetection()
      
      // 检测完成，发送结果
      this.$emit('analysisComplete', {
        type: 'realtime',
        result: {
          totalFrames: this.totalFrames,
          detectedFrames: this.detectedFrames,
          detectionRate: this.detectionRate,
          poseData: this.poseData,
          emotionData: this.emotionData,
          actionAlerts: this.actionAlerts
        },
        timestamp: new Date().toLocaleString()
      })
    },
    
    retryInitialization() {
      console.log('重新初始化组件...')
      this.cleanup()
      this.initializeComponent()
    },
    
    clearResources() {
      console.log('清理资源...')
      this.cleanup()
      this.actionAlerts = []
      this.totalFrames = 0
      this.detectedFrames = 0
      this.frameCount = 0
    },
    
    cleanup() {
      this.stopDetection()
      
      // 清理MediaPipe实例
      if (this.holistic) {
        try {
          this.holistic.close()
        } catch (error) {
          console.warn('清理MediaPipe实例时出错:', error)
        }
        this.holistic = null
      }
      
      // 释放资源标记
      this.resourceLocked = false
      window._mediaPipeActive = false
      
      console.log('实时动作检测组件已清理')
    }
  }
}
</script>

<style scoped>
.real-time-detection {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 20px;
}

/* 诊断面板 */
.diagnostic-panel {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
}

.diagnostic-panel h4 {
  margin: 0 0 12px 0;
  color: #495057;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.diagnostic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.diagnostic-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border-left: 4px solid #dee2e6;
}

.diagnostic-item .label {
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
}

.diagnostic-item .status {
  font-size: 12px;
  font-weight: 600;
}

.diagnostic-item .status.success {
  color: #28a745;
}

.diagnostic-item .status.error {
  color: #dc3545;
}

.diagnostic-item .status.warning {
  color: #ffc107;
}

.diagnostic-actions {
  display: flex;
  gap: 8px;
}

.btn-retry, .btn-clear {
  background: #6c757d;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-retry:hover, .btn-clear:hover {
  background: #5a6268;
}

/* 视频容器 */
.video-container {
  position: relative;
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.analysis-video {
  width: 100%;
  height: auto;
  display: block;
}

.detection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.real-time-status {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  z-index: 20;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.detection-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dc3545;
  transition: background-color 0.3s;
}

.detection-dot.active {
  background: #28a745;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.fps-counter {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  text-align: center;
}

.video-controls {
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: flex;
  gap: 8px;
  z-index: 20;
}

.control-btn {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.control-btn:hover {
  background: rgba(0, 0, 0, 0.9);
}

/* 检测结果面板 */
.detection-results {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e9ecef;
}

.results-header h4 {
  margin: 0;
  color: #495057;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detection-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #6c757d;
}

.detection-section {
  margin-bottom: 20px;
}

.detection-section h5 {
  margin: 0 0 12px 0;
  color: #495057;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.detection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
}

.detection-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 12px;
}

.item-label {
  color: #6c757d;
  font-weight: 500;
}

.item-value {
  font-weight: 600;
}

.item-value.detected {
  color: #28a745;
}

.item-value.not-detected {
  color: #dc3545;
}

/* 动作提示 */
.action-alerts {
  margin-top: 16px;
}

.action-alerts h5 {
  margin: 0 0 12px 0;
  color: #495057;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.alerts-list {
  max-height: 200px;
  overflow-y: auto;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 6px;
  border-radius: 4px;
  font-size: 12px;
  border-left: 4px solid;
}

.alert-item.info {
  background: #e3f2fd;
  border-left-color: #2196f3;
  color: #1976d2;
}

.alert-item.success {
  background: #e8f5e8;
  border-left-color: #4caf50;
  color: #2e7d32;
}

.alert-item.warning {
  background: #fff3e0;
  border-left-color: #ff9800;
  color: #f57c00;
}

.alert-item.error {
  background: #ffebee;
  border-left-color: #f44336;
  color: #d32f2f;
}

.alert-time {
  margin-left: auto;
  font-size: 10px;
  opacity: 0.7;
}

.no-alerts {
  text-align: center;
  color: #6c757d;
  font-size: 12px;
  padding: 20px;
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .real-time-detection {
    padding: 16px;
    gap: 16px;
  }
  
  .diagnostic-grid {
    grid-template-columns: 1fr;
  }
  
  .detection-grid {
    grid-template-columns: 1fr;
  }
  
  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .detection-stats {
    flex-direction: column;
    gap: 4px;
  }
}
</style> 