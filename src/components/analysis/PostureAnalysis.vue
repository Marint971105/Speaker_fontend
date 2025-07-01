<template>
  <div class="analysis-container">
    <div class="content-wrapper">
      <div class="video-wrapper">
        <video
          ref="video"
          class="input-video"
          crossorigin="anonymous"
          :src="videoUrl"
          @loadeddata="onVideoLoaded"
          @play="onVideoPlay"
          @pause="onVideoPause"
          @ended="onVideoEnded"
          @timeupdate="onVideoTimeUpdate"
        ></video>
        <canvas ref="canvas" class="output-canvas"></canvas>
      </div>
      
      <!-- 视频控制 -->
      <div class="video-controls">
        <el-button-group>
          <el-button 
            size="small" 
            type="primary"
            @click="toggleVideo"
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

    <!-- 检测结果显示 -->
    <div class="detection-results">
      <div class="result-item">
        <span class="label">动作状态:</span>
        <span class="value">{{ currentPosture }}</span>
      </div>
      <div class="divider"></div>
      <div class="result-item">
        <span class="label">表情状态:</span>
        <span class="value">{{ currentEmotion }}</span>
      </div>
      <div class="divider"></div>
      <div class="result-item">
        <span class="label">分析状态:</span>
        <span class="value" :class="{'status-active': isAnalyzing}">
          {{ isAnalyzing ? '分析中' : '未分析' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PostureAnalysis',
  
  props: {
    videoUrl: {
      type: String,
      required: true
    },
    autoPlay: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      detector: null,
      currentPosture: '未检测',
      currentEmotion: '未检测',
      isAnalyzing: false,
      isPlaying: false,
      canvas: null,
      ctx: null,
      video: null,
      animationFrame: null
    }
  },

  async mounted() {
    await this.initializeDetector()
  },

  beforeDestroy() {
    this.stopAnalysis()
  },

  methods: {
    async initializeDetector() {
      try {
        const { Holistic } = await import('@mediapipe/holistic')
        
        this.detector = new Holistic({
          locateFile: (file) => {
            return `/mediapipe/${file}`
          }
        })

        await this.detector.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
          refineFaceLandmarks: true
        })

        this.detector.onResults(this.onResults)
        
        console.log('MediaPipe初始化成功')
      } catch (error) {
        console.error('初始化检测器失败:', error)
      }
    },

    onVideoLoaded() {
      console.log('视频加载完成')
      this.video = this.$refs.video
      this.canvas = this.$refs.canvas
      this.ctx = this.canvas.getContext('2d')
      
      // 获取视频的原始尺寸
      const videoWidth = this.video.videoWidth
      const videoHeight = this.video.videoHeight
      
      // 计算容器尺寸
      const containerWidth = this.video.offsetWidth
      const containerHeight = this.video.offsetHeight
      
      // 计算缩放比例
      const scale = Math.min(
        containerWidth / videoWidth,
        containerHeight / videoHeight
      )
      
      // 计算实际显示尺寸
      const displayWidth = videoWidth * scale
      const displayHeight = videoHeight * scale
      
      // 设置Canvas尺寸为实际显示尺寸
      this.canvas.width = displayWidth
      this.canvas.height = displayHeight
      
      // 调整Canvas位置居中
      this.canvas.style.left = `${(containerWidth - displayWidth) / 2}px`
      this.canvas.style.top = `${(containerHeight - displayHeight) / 2}px`
      
      console.log('视频尺寸:', videoWidth, 'x', videoHeight)
      console.log('容器尺寸:', containerWidth, 'x', containerHeight)
      console.log('显示尺寸:', displayWidth, 'x', displayHeight)
      
      // 如果设置了自动播放，开始播放
      if (this.autoPlay) {
        this.startVideo()
      }
    },

    startVideo() {
      if (!this.video || !this.detector) return
      
      this.video.play()
    },

    toggleVideo() {
      if (this.isPlaying) {
        this.video.pause()
      } else {
        this.video.play()
      }
    },

    restartVideo() {
      if (!this.video) return
      this.video.currentTime = 0
      this.video.play()
    },

    onVideoPlay() {
      console.log('视频开始播放')
      this.isPlaying = true
      this.startAnalysis()
    },

    onVideoPause() {
      console.log('视频暂停')
      this.isPlaying = false
      this.pauseAnalysis()
    },

    onVideoEnded() {
      console.log('视频播放结束')
      this.isPlaying = false
      this.stopAnalysis()
    },

    onVideoTimeUpdate() {
      // 视频时间更新时确保分析在进行
      if (this.isPlaying && !this.isAnalyzing) {
        this.startAnalysis()
      }
    },

    startAnalysis() {
      if (!this.detector || !this.video || this.isAnalyzing) return
      
      console.log('开始分析')
      this.isAnalyzing = true
      this.analyzeFrame()
    },

    pauseAnalysis() {
      this.isAnalyzing = false
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame)
        this.animationFrame = null
      }
    },

    async analyzeFrame() {
      if (!this.isAnalyzing || !this.isPlaying) return
      
      try {
        if (this.video.readyState === 4) {
          await this.detector.send({image: this.video})
        }
      } catch (error) {
        console.error('分析帧失败:', error)
      }
      
      this.animationFrame = requestAnimationFrame(this.analyzeFrame)
    },

    onResults(results) {
      if (!this.isAnalyzing) return
      
      // 清除canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      
      // 绘制检测结果
      this.drawResults(results)
      
      // 分析姿态
      this.analyzePosture(results)
      
      // 分析表情
      this.analyzeEmotion(results)
    },

    drawResults(results) {
      if (!results || !this.ctx) return

      // 获取当前视频和Canvas的实际尺寸
      const videoWidth = this.video.videoWidth
      const videoHeight = this.video.videoHeight
      const canvasWidth = this.canvas.width
      const canvasHeight = this.canvas.height
      
      // 计算缩放比例
      const scaleX = canvasWidth / videoWidth
      const scaleY = canvasHeight / videoHeight

      // 只绘制姿态关键点
      if (results.poseLandmarks) {
        this.drawConnectors(results.poseLandmarks, scaleX, scaleY)
        this.drawLandmarks(results.poseLandmarks, scaleX, scaleY)
      }
    },

    drawConnectors(landmarks, scaleX, scaleY) {
      if (!landmarks) return
      
      this.ctx.strokeStyle = '#00FF00'
      this.ctx.lineWidth = 2

      // 定义需要连接的点
      const connections = [
        // 头部到躯干
        [0, 11], // 头部到左肩
        [0, 12], // 头部到右肩
        
        // 躯干
        [11, 12], // 肩膀
        [11, 23], // 左躯干
        [12, 24], // 右躯干
        [23, 24], // 臀部
        
        // 手臂
        [11, 13], [13, 15], // 左手臂
        [12, 14], [14, 16], // 右手臂
        
        // 腿部
        [23, 25], [25, 27], // 左腿
        [24, 26], [26, 28]  // 右腿
      ]

      connections.forEach(([start, end]) => {
        if (landmarks[start] && landmarks[end]) {
          this.ctx.beginPath()
          this.ctx.moveTo(
            landmarks[start].x * this.video.videoWidth * scaleX,
            landmarks[start].y * this.video.videoHeight * scaleY
          )
          this.ctx.lineTo(
            landmarks[end].x * this.video.videoWidth * scaleX,
            landmarks[end].y * this.video.videoHeight * scaleY
          )
          this.ctx.stroke()
        }
      })
    },

    drawLandmarks(landmarks, scaleX, scaleY) {
      if (!landmarks) return
      
      // 定义要绘制的关键点索引
      const keyPoints = [
        0,  // 头部/鼻子
        11, 12, // 肩膀
        13, 14, // 手肘
        15, 16, // 手腕
        23, 24, // 臀部
        25, 26, // 膝盖
        27, 28  // 脚踝
      ]
      
      this.ctx.fillStyle = '#FF0000'
      
      landmarks.forEach((landmark, index) => {
        if (keyPoints.includes(index)) {
          this.ctx.beginPath()
          this.ctx.arc(
            landmark.x * this.video.videoWidth * scaleX,
            landmark.y * this.video.videoHeight * scaleY,
            3, // 增大关键点的大小
            0,
            2 * Math.PI
          )
          this.ctx.fill()
        }
      })
    },

    analyzePosture(results) {
      if (!results.poseLandmarks) {
        this.currentPosture = '未检测到人体'
        return
      }

      const landmarks = results.poseLandmarks
      
      // 简单的姿态判断逻辑
      // 检查手是否举起
      const leftHandRaised = landmarks[15].y < landmarks[11].y
      const rightHandRaised = landmarks[16].y < landmarks[12].y
      
      // 检查是否站立/坐下
      const hipY = (landmarks[23].y + landmarks[24].y) / 2
      const kneeY = (landmarks[25].y + landmarks[26].y) / 2
      const isStanding = Math.abs(hipY - kneeY) > 0.2
      
      // 更新姿态状态
      if (leftHandRaised || rightHandRaised) {
        this.currentPosture = '举手'
      } else if (isStanding) {
        this.currentPosture = '站立'
      } else {
        this.currentPosture = '坐下'
      }
    },

    analyzeEmotion(results) {
      if (!results.faceLandmarks) {
        this.currentEmotion = '未检测到面部'
        return
      }

      const landmarks = results.faceLandmarks
      
      // 简单的表情判断逻辑
      // 检查嘴角位置判断是否微笑
      const leftMouthCorner = landmarks[61]
      const rightMouthCorner = landmarks[291]
      const upperLip = landmarks[0]
      
      const mouthAngle = (leftMouthCorner.y + rightMouthCorner.y) / 2 - upperLip.y
      
      if (mouthAngle > 0.02) {
        this.currentEmotion = '微笑'
      } else if (mouthAngle < -0.02) {
        this.currentEmotion = '皱眉'
      } else {
        this.currentEmotion = '平静'
      }
    },

    stopAnalysis() {
      this.isAnalyzing = false
      this.isPlaying = false
      
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame)
        this.animationFrame = null
      }
      
      if (this.video) {
        this.video.pause()
      }
      
      if (this.detector) {
        this.detector.close()
      }
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
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
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

.detection-results {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 10px 15px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  font-size: 13px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 5px;
  
  .label {
    color: #606266;
  }
  
  .value {
    color: #409EFF;
    font-weight: 500;
  }
}

.divider {
  width: 1px;
  height: 14px;
  background: #DCDFE6;
}

.status-active {
  color: #67C23A !important;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}
</style> 