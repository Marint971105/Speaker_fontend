<template>
  <div class="analysis-container">
    <div class="content-wrapper">
      <div class="video-wrapper">
        <video
          ref="videoPlayer"
          class="input-video"
          :src="videoUrl"
          muted
          crossorigin="anonymous"
          @loadedmetadata="onVideoLoaded"
          @play="onVideoPlay"
          @pause="onVideoPause"
          @ended="onVideoEnded"
        ></video>
        <canvas ref="drawingCanvas" class="output-canvas"></canvas>
      </div>
      
      <!-- 视频控制 -->
      <div class="video-controls">
        <el-button-group>
          <el-button 
            size="small" 
            type="primary"
            @click="togglePlayPause"
            :icon="isPlaying ? 'el-icon-video-pause' : 'el-icon-video-play'">
            {{ isPlaying ? '暂停' : '播放' }}
          </el-button>
          <el-button 
            size="small" 
            type="info"
            @click="restartVideo"
            icon="el-icon-refresh">
            重新开始
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 分析结果统计 -->
    <div v-if="emotionResults.length > 0" class="result-display">
      <div class="emotion-summary">
        <div class="primary-emotion">
          <div class="emotion-icon" :class="primaryEmotion.class">
            <i :class="primaryEmotion.icon"></i>
          </div>
          <div class="emotion-info">
            <h4>主要表情</h4>
            <span class="emotion-name">{{ primaryEmotion.name }}</span>
            <span class="emotion-percentage">{{ primaryEmotion.percentage }}%</span>
          </div>
        </div>
      </div>
      
      <div class="emotion-chart">
        <h4><i class="fas fa-chart-pie"></i> 表情分布</h4>
        <div class="emotion-bars">
          <div v-for="emotion in emotionStats" :key="emotion.name" class="emotion-bar-item">
            <span class="emotion-label">{{ emotion.name }}</span>
            <div class="emotion-bar">
              <div 
                class="bar-fill" 
                :class="emotion.class"
                :style="{width: `${emotion.percentage}%`}"
              ></div>
            </div>
            <span class="emotion-value">{{ emotion.percentage }}%</span>
          </div>
        </div>
      </div>
      
      <div class="emotion-timeline">
        <h4><i class="fas fa-clock"></i> 变化趋势</h4>
        <div class="timeline-info">
          <p>表情变化 {{ emotionChanges }} 次</p>
          <p>平均持续 {{ averageDuration }}秒</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EmotionAnalysis',
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
      videoLoaded: false,
      mediaPipeLoaded: false,
      isPlaying: false,
      showCanvas: true,
      emotionResults: [],
      faceApi: null,
      canvasCtx: null,
      analysisRequestId: null
    }
  },
  computed: {
    emotionStats() {
      if (this.emotionResults.length === 0) return []
      
      const emotions = {
        happy: { name: '开心', count: 0, class: 'emotion-happy', icon: 'fas fa-laugh-beam' },
        neutral: { name: '平静', count: 0, class: 'emotion-neutral', icon: 'fas fa-meh' },
        sad: { name: '悲伤', count: 0, class: 'emotion-sad', icon: 'fas fa-sad-tear' },
        angry: { name: '愤怒', count: 0, class: 'emotion-angry', icon: 'fas fa-angry' },
        surprised: { name: '惊讶', count: 0, class: 'emotion-surprised', icon: 'fas fa-surprise' },
        disgusted: { name: '厌恶', count: 0, class: 'emotion-disgusted', icon: 'fas fa-grimace' }
      }
      
      // 统计每种表情出现的次数
      this.emotionResults.forEach(result => {
        if (result.emotion && emotions[result.emotion]) {
          emotions[result.emotion].count++
        }
      })
      
      const total = this.emotionResults.length
      
      return Object.values(emotions)
        .map(emotion => ({
          ...emotion,
          percentage: total > 0 ? Math.round((emotion.count / total) * 100) : 0
        }))
        .filter(emotion => emotion.percentage > 0)
        .sort((a, b) => b.percentage - a.percentage)
    },
    primaryEmotion() {
      if (this.emotionStats.length === 0) {
        return { 
          name: '未知', 
          percentage: 0, 
          class: 'emotion-neutral',
          icon: 'fas fa-question'
        }
      }
      
      const primary = this.emotionStats[0]
      return {
        name: primary.name,
        percentage: primary.percentage,
        class: primary.class,
        icon: primary.icon
      }
    },
    emotionChanges() {
      if (this.emotionResults.length <= 1) return 0
      
      let changes = 0
      let lastEmotion = this.emotionResults[0].emotion
      
      for (let i = 1; i < this.emotionResults.length; i++) {
        if (this.emotionResults[i].emotion !== lastEmotion) {
          changes++
          lastEmotion = this.emotionResults[i].emotion
        }
      }
      
      return changes
    },
    averageDuration() {
      if (this.emotionResults.length === 0) return 0
      
      const totalTime = this.emotionResults[this.emotionResults.length - 1].timestamp
      const segments = this.emotionChanges + 1
      
      return segments > 0 ? (totalTime / segments).toFixed(1) : 0
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
        console.log('初始化表情分析组件...')
        
        // 检查是否已经有其他组件在运行MediaPipe
        if (window._mediaPipeActive) {
          console.warn('检测到MediaPipe正在使用中，等待释放...')
          // 等待其他实例释放
          let waitCount = 0
          while (window._mediaPipeActive && waitCount < 50) {
            await new Promise(resolve => setTimeout(resolve, 100))
            waitCount++
          }
          
          if (window._mediaPipeActive) {
            console.error('MediaPipe资源冲突，无法启动表情分析')
            return
          }
        }
        
        // 标记为使用中
        window._mediaPipeActive = true
        
        // 1. 加载MediaPipe
        await this.loadMediaPipe()
        
        // 2. 等待一小段时间，确保库完全加载
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 3. 验证MediaPipe是否可用
        if (!window.Holistic) {
          throw new Error('MediaPipe Holistic 库未能正确加载')
        }
        
        console.log('MediaPipe验证成功，设置标志...')
        this.mediaPipeLoaded = true
        
        // 4. 设置Canvas和视频
        this.setupCanvas()
        
        // 5. 初始化MediaPipe（延迟初始化）
        // 不在这里立即初始化，而是在开始分析时初始化
        
        // 6. 如果设置了自动开始，则开始播放
        if (this.autoStart) {
          await new Promise(resolve => setTimeout(resolve, 500))
          this.startVideo()
        }
        
        console.log('表情分析组件初始化完成')
      } catch (error) {
        console.error('表情分析组件初始化失败:', error)
        // 释放资源标记
        window._mediaPipeActive = false
        throw error
      }
    },
    
    async loadMediaPipe() {
      // 检查全局单例状态
      if (!window._mediaPipeState) {
        window._mediaPipeState = {
          loading: false,
          loaded: false,
          instances: new Set()
        };
      }
      
      // 如果已经加载完成，直接使用
      if (window._mediaPipeState.loaded && window.Holistic) {
        console.log('MediaPipe Holistic 已存在，跳过加载');
        return true;
      }
      
      // 如果正在加载，等待加载完成
      if (window._mediaPipeState.loading) {
        console.log('MediaPipe 正在加载中，等待...');
        return new Promise((resolve) => {
          const checkLoaded = () => {
            if (window._mediaPipeState.loaded && window.Holistic) {
              resolve(true);
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
        });
      }
      
      // 开始加载
      window._mediaPipeState.loading = true;
      
      console.log('开始加载 MediaPipe Holistic...');
      
      try {
        // 加载holistic_solution_packed_assets_loader.js
        console.log('加载 holistic_solution_packed_assets_loader.js...');
        await this.loadScript('/mediapipe/holistic_solution_packed_assets_loader.js');
        console.log('holistic_solution_packed_assets_loader.js 加载完成');
        
        // 加载holistic.js
        console.log('尝试加载 holistic.js...');
        await this.loadScript('/mediapipe/holistic.js');
        console.log('holistic.js 加载完成');
        
        // 验证Holistic是否可用
        if (typeof window.Holistic === 'function') {
          console.log('MediaPipe Holistic 加载成功，构造函数可用:', typeof window.Holistic);
          window._mediaPipeState.loaded = true;
          window._mediaPipeState.loading = false;
          return true;
        } else {
          throw new Error('Holistic构造函数未找到');
        }
      } catch (error) {
        console.error('MediaPipe加载失败:', error);
        window._mediaPipeState.loading = false;
        return false;
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
      this.initializeFaceAPI()
    },
    
    setupCanvas() {
      this.$nextTick(() => {
        const canvas = this.$refs.drawingCanvas;
        const video = this.$refs.videoPlayer;
        
        if (!canvas || !video) {
          console.error('Canvas或Video元素未找到');
          return;
        }
        
        // 等待视频元数据加载
        if (video.videoWidth && video.videoHeight) {
          this.updateCanvasSize();
        } else {
          video.addEventListener('loadedmetadata', () => {
            this.updateCanvasSize();
          }, { once: true });
        }
        
        this.canvasCtx = canvas.getContext('2d');
        console.log('Canvas设置完成');
      });
    },
    
    updateCanvasSize() {
      const canvas = this.$refs.drawingCanvas;
      const video = this.$refs.videoPlayer;
      
      if (!canvas || !video) return;
      
      // 设置Canvas尺寸与视频一致
      canvas.width = video.videoWidth || video.clientWidth;
      canvas.height = video.videoHeight || video.clientHeight;
      
      // 设置CSS尺寸
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      
      console.log(`Canvas尺寸设置为: ${canvas.width}x${canvas.height}`);
    },
    
    initializeFaceAPI() {
      if (!window.Holistic || this.faceApi) return
      
      console.log('初始化MediaPipe Holistic实例...')
      
      try {
        // 创建新的Holistic实例，使用特殊配置避免冲突
        this.faceApi = new window.Holistic({
          locateFile: (file) => {
            console.log('MediaPipe请求文件:', file)
            const path = `/mediapipe/${file}`
            console.log('返回路径:', path)
            return path
          }
        })
        
        // 使用最低配置避免冲突
        this.faceApi.setOptions({
          modelComplexity: 0,        // 最低复杂度
          smoothLandmarks: false,    // 关闭平滑
          enableSegmentation: false, // 关闭分割
          smoothSegmentation: false,
          refineFaceLandmarks: false, // 关闭精细面部检测避免冲突
          minDetectionConfidence: 0.7, // 提高检测阈值
          minTrackingConfidence: 0.7
        })
        
        // 确保正确绑定this并添加错误处理
        this.faceApi.onResults((results) => {
          try {
            this.onResults(results)
          } catch (error) {
            console.error('处理结果时出错:', error)
          }
        })
        
        console.log('MediaPipe Holistic 实例初始化完成')
      } catch (error) {
        console.error('MediaPipe Holistic 实例初始化失败:', error)
        // 释放资源标记
        window._mediaPipeActive = false
        throw error
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
        
        // 延迟初始化MediaPipe实例
        if (!this.faceApi) {
          console.log('延迟初始化MediaPipe实例...')
          await new Promise(resolve => setTimeout(resolve, 200))
          this.initializeFaceAPI()
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
        // 开始分析
        if (this.faceApi) {
          this.startAnalysis()
        }
      } catch (error) {
        console.error('视频播放失败:', error)
        // 释放资源标记
        window._mediaPipeActive = false
      }
    },
    
    startAnalysis() {
      if (!this.faceApi || !this.$refs.videoPlayer) {
        console.error('MediaPipe或视频未准备好')
        return
      }
      
      console.log('开始表情分析...')
      
      let lastAnalysisTime = 0
      const analysisInterval = 100 // 降低到100ms使分析更流畅
      let consecutiveErrors = 0
      const maxConsecutiveErrors = 3 // 减少最大连续错误次数
      
      const analyzeFrame = async () => {
        if (!this.isPlaying || !this.$refs.videoPlayer) return
        
        const currentTime = Date.now()
        if (currentTime - lastAnalysisTime < analysisInterval) {
          // 跳过此帧，但继续下一帧
          if (this.isPlaying) {
            this.analysisRequestId = requestAnimationFrame(analyzeFrame)
          }
          return
        }
        
        lastAnalysisTime = currentTime
        
        try {
          const video = this.$refs.videoPlayer
          if (video.readyState >= 2 && video.videoWidth > 0) {
            await this.faceApi.send({ image: video })
            consecutiveErrors = 0 // 重置错误计数
          }
        } catch (error) {
          console.error('分析帧失败:', error)
          consecutiveErrors++
          
          // 如果连续错误过多，停止分析避免无限循环
          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.error('连续错误过多，停止表情分析')
            this.isPlaying = false
            // 释放资源标记
            window._mediaPipeActive = false
            return
          }
          
          // 出错后暂停较短时间再继续
          setTimeout(() => {
            if (this.isPlaying) {
              this.analysisRequestId = requestAnimationFrame(analyzeFrame)
            }
          }, 500) // 减少错误后的等待时间
          return
        }
        
        // 继续分析下一帧
        if (this.isPlaying) {
          this.analysisRequestId = requestAnimationFrame(analyzeFrame)
        }
      }
      
      analyzeFrame()
    },
    
    onResults(results) {
      if (!results) return
      
      const timestamp = this.$refs.videoPlayer ? this.$refs.videoPlayer.currentTime : 0
      
      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        // 分析表情
        const emotion = this.analyzeEmotion(results.faceLandmarks)
        
        // 保存分析结果
        this.emotionResults.push({
          timestamp: timestamp,
          emotion: emotion,
          faceLandmarks: results.faceLandmarks,
          confidence: emotion.confidence || 0
        })
        
        // 实时绘制
        if (this.showCanvas && this.canvasCtx) {
          this.drawFace(results)
        }
        
        // 每10帧输出一次日志，避免过多日志
        if (this.emotionResults.length % 10 === 0) {
          console.log(`表情分析: ${timestamp.toFixed(2)}s, 已分析${this.emotionResults.length}帧, 当前表情: ${emotion.type || emotion}`)
        }
      }
    },
    
    drawFace(results) {
      if (!this.canvasCtx || !this.$refs.drawingCanvas) return
      
      const canvas = this.$refs.drawingCanvas
      const ctx = this.canvasCtx
      
      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      try {
        // 绘制面部关键点
        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          this.drawFaceLandmarks(ctx, results.faceLandmarks, canvas.width, canvas.height)
        }
      } catch (error) {
        console.error('绘制面部特征失败:', error)
      }
    },
    
    drawFaceLandmarks(ctx, landmarks, width, height) {
      // 面部轮廓连接关系
      const faceOval = [
        // 下巴轮廓
        [234, 454], [454, 323], [323, 361], [361, 288], [288, 397], [397, 365], [365, 379], [379, 378], [378, 400], [400, 377], [377, 152],
        // 额头轮廓
        [10, 338], [338, 297], [297, 332], [332, 284], [284, 251], [251, 389]
      ]
      
      // 眉毛连接
      const leftEyebrow = [
        [70, 63], [63, 105], [105, 66], [66, 107]
      ]
      const rightEyebrow = [
        [336, 296], [296, 334], [334, 293], [293, 300]
      ]
      
      // 眼睛轮廓
      const leftEye = [
        [33, 7], [7, 163], [163, 144], [144, 145], [145, 153], [153, 154], [154, 155], [155, 133],
        [33, 246], [246, 161], [161, 160], [160, 159], [159, 158], [158, 157], [157, 173]
      ]
      const rightEye = [
        [362, 382], [382, 398], [398, 384], [384, 385], [385, 386], [386, 387], [387, 388], [388, 466],
        [362, 263], [263, 249], [249, 390], [390, 373], [373, 374], [374, 380], [380, 381]
      ]
      
      // 嘴巴轮廓
      const outerLips = [
        [61, 185], [185, 40], [40, 39], [39, 37], [37, 0], [0, 267],
        [267, 269], [269, 270], [270, 409], [409, 291], [291, 375], [375, 321], [321, 405], [405, 314], [314, 17], [17, 84], [84, 181], [181, 91], [91, 146], [146, 61]
      ]
      const innerLips = [
        [78, 191], [191, 80], [80, 81], [81, 82], [82, 13], [13, 312],
        [312, 311], [311, 310], [310, 415], [415, 308], [308, 324], [324, 318], [318, 402], [402, 317], [317, 14], [14, 87], [87, 178], [178, 88], [88, 95], [95, 78]
      ]
      
      // 绘制所有连接线
      ctx.lineWidth = 2
      
      // 绘制面部轮廓
      ctx.strokeStyle = '#00FF00'
      this.drawConnections(ctx, landmarks, faceOval, width, height)
      
      // 绘制眉毛
      ctx.strokeStyle = '#00FF00'
      this.drawConnections(ctx, landmarks, leftEyebrow, width, height)
      this.drawConnections(ctx, landmarks, rightEyebrow, width, height)
      
      // 绘制眼睛
      ctx.strokeStyle = '#00FF00'
      this.drawConnections(ctx, landmarks, leftEye, width, height)
      this.drawConnections(ctx, landmarks, rightEye, width, height)
      
      // 绘制嘴巴
      ctx.strokeStyle = '#00FF00'
      this.drawConnections(ctx, landmarks, outerLips, width, height)
      ctx.strokeStyle = '#00FF00'
      this.drawConnections(ctx, landmarks, innerLips, width, height)
      
      // 绘制关键点
      ctx.fillStyle = '#FF0000'
      const keyPoints = [
        // 眼睛关键点
        33, 133, 362, 263, 
        // 眉毛关键点
        70, 63, 105, 66, 107, 336, 296, 334, 293, 300,
        // 鼻子关键点
        1, 2, 98, 327,
        // 嘴巴关键点
        61, 291, 0, 17, 14, 13
      ]
      
      keyPoints.forEach(index => {
        if (landmarks[index]) {
          ctx.beginPath()
          ctx.arc(landmarks[index].x * width, landmarks[index].y * height, 3, 0, 2 * Math.PI)
          ctx.fill()
        }
      })
    },
    
    drawConnections(ctx, landmarks, connections, width, height) {
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
    },
    
    isImportantLandmark(index) {
      // 简化的面部关键点索引
      const importantPoints = [
        // 眼睛关键点
        33, 133, 362, 263,
        // 嘴巴关键点
        61, 185, 40, 39, 37, 0, 267, 269, 270, 409,
        // 眉毛关键点
        70, 63, 105, 66, 107, 336, 296, 334, 293, 300
      ]
      
      return importantPoints.includes(index)
    },
    
    analyzeEmotion(faceLandmarks) {
      try {
        // 获取关键点
        const leftEyebrow = faceLandmarks[70] // 左眉毛外侧
        const rightEyebrow = faceLandmarks[300] // 右眉毛外侧
        const leftEyebrowInner = faceLandmarks[107] // 左眉毛内侧
        const rightEyebrowInner = faceLandmarks[336] // 右眉毛内侧
        
        const leftMouth = faceLandmarks[61] // 嘴角左
        const rightMouth = faceLandmarks[409] // 嘴角右
        const topLip = faceLandmarks[0] // 上嘴唇中心
        const bottomLip = faceLandmarks[17] // 下嘴唇中心
        
        const leftEye = faceLandmarks[159] // 左眼下缘
        const rightEye = faceLandmarks[386] // 右眼下缘
        const leftEyeTop = faceLandmarks[157] // 左眼上缘
        const rightEyeTop = faceLandmarks[384] // 右眼上缘
        
        if (!leftMouth || !rightMouth || !topLip || !bottomLip) {
          return 'neutral'
        }
        
        // 计算嘴巴的曲率 (微笑/悲伤检测)
        const mouthCurvature = (leftMouth.y + rightMouth.y) / 2 - topLip.y
        
        // 计算嘴巴张开程度
        const mouthOpenness = Math.abs(topLip.y - bottomLip.y)
        
        // 计算嘴巴宽度
        const mouthWidth = Math.abs(leftMouth.x - rightMouth.x)
        
        // 计算眉毛高度和角度
        const leftEyebrowAngle = Math.atan2(
          leftEyebrow.y - leftEyebrowInner.y,
          leftEyebrow.x - leftEyebrowInner.x
        )
        const rightEyebrowAngle = Math.atan2(
          rightEyebrow.y - rightEyebrowInner.y,
          rightEyebrow.x - rightEyebrowInner.x
        )
        
        // 计算眼睛开合程度
        const leftEyeOpenness = Math.abs(leftEyeTop.y - leftEye.y)
        const rightEyeOpenness = Math.abs(rightEyeTop.y - rightEye.y)
        const eyeOpenness = (leftEyeOpenness + rightEyeOpenness) / 2
        
        // 调试信息 - 可以临时启用查看实际数值
        // console.log('眼睛开合度:', {
        //   leftEyeOpenness: leftEyeOpenness.toFixed(4),
        //   rightEyeOpenness: rightEyeOpenness.toFixed(4),
        //   eyeOpenness: eyeOpenness.toFixed(4),
        //   mouthCurvature: mouthCurvature.toFixed(4),
        //   mouthWidth: mouthWidth.toFixed(4)
        // })
        
        // 表情判断逻辑
        if (mouthCurvature < -0.015 && mouthWidth > 0.3) {
          // 开心的笑容
          return 'happy'
        } else if (mouthCurvature > 0.01 && leftEyebrowAngle < -0.2 && rightEyebrowAngle > 0.2) {
          // 悲伤表情
          return 'sad'
        } else if (mouthOpenness > 0.15 && eyeOpenness > 0.05) {
          // 惊讶表情 - 确保眼睛是睁开的
          return 'surprised'
        } else if (leftEyebrowAngle < -0.3 && rightEyebrowAngle > 0.3 && mouthWidth < 0.25) {
          // 愤怒表情
          return 'angry'
        } else if (mouthOpenness > 0.1 && mouthWidth < 0.2) {
          // 厌恶表情
          return 'disgusted'
        } else {
          // 平静表情
          return 'neutral'
        }
      } catch (error) {
        console.error('表情分析出错:', error)
        return 'neutral'
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
    
    restartVideo() {
      this.mediaPipeLoaded = false
      this.initializeComponent()
    },
    
    onVideoPlay() {
      this.isPlaying = true
      if (this.faceApi) {
        this.startAnalysis()
      }
    },
    
    onVideoPause() {
      this.isPlaying = false
      if (this.analysisRequestId) {
        cancelAnimationFrame(this.analysisRequestId)
        this.analysisRequestId = null
      }
    },
    
    onVideoEnded() {
      this.isPlaying = false
      if (this.analysisRequestId) {
        cancelAnimationFrame(this.analysisRequestId)
        this.analysisRequestId = null
      }
      
      // 分析完成，发送结果
      this.$emit('analysisComplete', {
        type: 'emotion',
        result: {
          results: this.emotionResults,
          primaryEmotion: this.primaryEmotion,
          emotionStats: this.emotionStats,
          emotionChanges: this.emotionChanges
        },
        timestamp: new Date().toLocaleString()
      })
    },
    
    cleanup() {
      if (this.analysisRequestId) {
        cancelAnimationFrame(this.analysisRequestId)
      }
      
      // 释放MediaPipe资源标记
      window._mediaPipeActive = false
      
      // 只清除本地引用，不销毁全局MediaPipe实例
      this.faceApi = null
      console.log('表情分析组件已清理，资源已释放')
    }
  }
}
</script>

<style lang="scss" scoped>
.analysis-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0;
  background: transparent;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.video-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.input-video {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.output-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.video-controls {
  display: flex;
  justify-content: center;
  gap: 10px;

  .el-button-group {
    .el-button {
      padding: 8px 20px;
      font-size: 14px;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(0);
      }

      i {
        margin-right: 4px;
      }
    }
  }
}

.result-display {
  background: transparent;
  border-radius: 0;
  padding: 12px;
}

.emotion-summary {
  margin-bottom: 16px;
}

.primary-emotion {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.emotion-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.emotion-icon.emotion-happy { background: #27ae60; }
.emotion-icon.emotion-neutral { background: #95a5a6; }
.emotion-icon.emotion-sad { background: #3498db; }
.emotion-icon.emotion-angry { background: #e74c3c; }
.emotion-icon.emotion-surprised { background: #f39c12; }
.emotion-icon.emotion-disgusted { background: #34495e; }

.emotion-info {
  flex: 1;
}

.emotion-info h4 {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 12px;
}

.emotion-name {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.emotion-percentage {
  font-size: 14px;
  color: #27ae60;
  font-weight: 600;
}

.emotion-chart {
  margin-bottom: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.emotion-chart h4 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  
  i {
    font-size: 14px;
    color: #409EFF;
  }
}

.emotion-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.emotion-bar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.emotion-label {
  width: 50px;
  color: #666;
  font-weight: 500;
}

.emotion-bar {
  flex: 1;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.bar-fill.emotion-happy { background: #27ae60; }
.bar-fill.emotion-neutral { background: #95a5a6; }
.bar-fill.emotion-sad { background: #3498db; }
.bar-fill.emotion-angry { background: #e74c3c; }
.bar-fill.emotion-surprised { background: #f39c12; }
.bar-fill.emotion-disgusted { background: #34495e; }

.emotion-value {
  width: 30px;
  text-align: right;
  font-weight: bold;
  color: #2c3e50;
}

.emotion-timeline {
  margin-bottom: 0;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.emotion-timeline h4 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  
  i {
    font-size: 14px;
    color: #409EFF;
  }
}

.timeline-info {
  display: flex;
  gap: 16px;
  background: white;
  padding: 12px;
  border-radius: 8px;
}

.timeline-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
}
</style> 