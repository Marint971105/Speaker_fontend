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

    <!-- 实时检测状态 -->
    <div class="detection-results">
      <div class="result-item">
        <span class="label">姿态状态</span>
        <span class="value">{{ currentPosture }}</span>
      </div>
      <div class="result-item">
        <span class="label">表情状态</span>
        <span class="value">{{ currentEmotion }}</span>
      </div>
      <div class="result-item">
        <span class="label">分析状态</span>
        <span class="value" :class="{'status-active': isAnalyzing}">
          {{ isAnalyzing ? '分析中' : '未分析' }}
        </span>
      </div>
    </div>
    
    <!-- 分析统计结果 -->
    <div v-if="analysisResults.totalFrames > 0" class="analysis-stats">
      <!-- 综合评分 -->
      <div class="score-card">
        <div class="score-circle" :style="{borderColor: qualityLevel.color}">
          <div class="score-number" :style="{color: qualityLevel.color}">{{ overallScore }}</div>
          <div class="score-label">综合评分</div>
        </div>
        <div class="score-info">
          <div class="score-level" :style="{color: qualityLevel.color}">
            <i class="fas fa-award"></i>
            {{ qualityLevel.text }}
          </div>
          <div class="score-breakdown">
            <span>姿态: {{ postureScore }}分</span>
            <span class="divider">|</span>
            <span>表情: {{ emotionScore }}分</span>
          </div>
        </div>
      </div>
      
      <!-- 姿态统计 -->
      <div class="stats-section">
        <h4><i class="fas fa-user"></i> 姿态分布</h4>
        <div class="stats-grid">
          <div class="stat-item">
            <i class="fas fa-check-circle" style="color: #67C23A"></i>
            <span class="stat-value">{{ Math.round(analysisResults.posture.straight / analysisResults.totalFrames * 100) }}%</span>
            <span class="stat-label">端正</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-exclamation-triangle" style="color: #E6A23C"></i>
            <span class="stat-value">{{ Math.round(analysisResults.posture.hunched / analysisResults.totalFrames * 100) }}%</span>
            <span class="stat-label">驼背</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-compress-arrows-alt" style="color: #F56C6C"></i>
            <span class="stat-value">{{ Math.round(analysisResults.posture.leaning / analysisResults.totalFrames * 100) }}%</span>
            <span class="stat-label">歪斜</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-hand-paper" style="color: #409EFF"></i>
            <span class="stat-value">{{ Math.round(analysisResults.posture.handsRaised / analysisResults.totalFrames * 100) }}%</span>
            <span class="stat-label">举手</span>
          </div>
        </div>
      </div>
      
      <!-- 表情统计 -->
      <div class="stats-section">
        <h4><i class="fas fa-smile"></i> 表情分布</h4>
        <div class="stats-grid">
          <div class="stat-item">
            <i class="fas fa-laugh-beam" style="color: #67C23A"></i>
            <span class="stat-value">{{ Math.round(analysisResults.emotion.smile / analysisResults.totalFrames * 100) }}%</span>
            <span class="stat-label">微笑</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-meh" style="color: #909399"></i>
            <span class="stat-value">{{ Math.round(analysisResults.emotion.neutral / analysisResults.totalFrames * 100) }}%</span>
            <span class="stat-label">平静</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-frown" style="color: #F56C6C"></i>
            <span class="stat-value">{{ Math.round(analysisResults.emotion.frown / analysisResults.totalFrames * 100) }}%</span>
            <span class="stat-label">皱眉</span>
          </div>
        </div>
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
      animationFrame: null,
      postureHistory: [], // 姿态历史记录
      emotionHistory: [], // 表情历史记录
      analysisResults: {
        posture: {
          straight: 0,
          leaning: 0,
          hunched: 0,
          handsRaised: 0
        },
        emotion: {
          smile: 0,
          neutral: 0,
          frown: 0
        },
        totalFrames: 0
      }
    }
  },

  computed: {
    // 姿态评分
    postureScore() {
      if (this.analysisResults.totalFrames === 0) return 0
      
      const { straight, leaning, hunched, handsRaised } = this.analysisResults.posture
      const total = this.analysisResults.totalFrames
      
      // 挺直加分，弯腰驼背扣分
      let score = 100
      const straightRatio = straight / total
      const hunchedRatio = hunched / total
      const leaningRatio = leaning / total
      
      // 挺直姿态加分
      if (straightRatio > 0.7) {
        score += 0
      } else if (straightRatio > 0.5) {
        score -= 10
      } else {
        score -= 20
      }
      
      // 驼背扣分
      if (hunchedRatio > 0.3) {
        score -= 30
      } else if (hunchedRatio > 0.15) {
        score -= 15
      }
      
      // 歪斜扣分
      if (leaningRatio > 0.4) {
        score -= 20
      } else if (leaningRatio > 0.2) {
        score -= 10
      }
      
      return Math.max(0, Math.min(100, Math.round(score)))
    },
    
    // 表情评分
    emotionScore() {
      if (this.analysisResults.totalFrames === 0) return 0
      
      const { smile, neutral, frown } = this.analysisResults.emotion
      const total = this.analysisResults.totalFrames
      
      const smileRatio = smile / total
      const frownRatio = frown / total
      
      let score = 70 // 基础分
      
      // 微笑加分
      if (smileRatio > 0.5) {
        score += 30
      } else if (smileRatio > 0.3) {
        score += 20
      } else if (smileRatio > 0.1) {
        score += 10
      }
      
      // 皱眉扣分
      if (frownRatio > 0.3) {
        score -= 20
      } else if (frownRatio > 0.15) {
        score -= 10
      }
      
      return Math.max(0, Math.min(100, Math.round(score)))
    },
    
    // 综合评分
    overallScore() {
      if (this.analysisResults.totalFrames === 0) return 0
      return Math.round((this.postureScore * 0.6 + this.emotionScore * 0.4))
    },
    
    // 质量等级
    qualityLevel() {
      const score = this.overallScore
      if (score >= 90) return { text: '优秀', color: '#67C23A' }
      if (score >= 80) return { text: '良好', color: '#95D475' }
      if (score >= 70) return { text: '中等', color: '#E6A23C' }
      if (score >= 60) return { text: '及格', color: '#F56C6C' }
      return { text: '待改进', color: '#909399' }
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
      this.analysisResults.totalFrames++
      
      // 检查手是否举起
      const leftHandRaised = landmarks[15].y < landmarks[11].y
      const rightHandRaised = landmarks[16].y < landmarks[12].y
      
      // 检查肩膀水平度（判断是否歪斜）
      const leftShoulder = landmarks[11]
      const rightShoulder = landmarks[12]
      const shoulderAngle = Math.abs(leftShoulder.y - rightShoulder.y)
      const isLeaning = shoulderAngle > 0.05
      
      // 检查脊柱姿态（判断是否驼背）
      const nose = landmarks[0]
      const midShoulder = { y: (leftShoulder.y + rightShoulder.y) / 2 }
      const midHip = { y: (landmarks[23].y + landmarks[24].y) / 2 }
      
      // 计算头部前倾程度
      const neckAngle = nose.y - midShoulder.y
      const isHunched = neckAngle < -0.05 // 头部明显低于肩膀
      
      // 检查挺直姿态
      const backStraight = !isHunched && !isLeaning && Math.abs(midShoulder.y - midHip.y) > 0.15
      
      // 更新统计
      if (leftHandRaised || rightHandRaised) {
        this.currentPosture = '举手'
        this.analysisResults.posture.handsRaised++
      } else if (isHunched) {
        this.currentPosture = '驼背'
        this.analysisResults.posture.hunched++
      } else if (isLeaning) {
        this.currentPosture = '歪斜'
        this.analysisResults.posture.leaning++
      } else if (backStraight) {
        this.currentPosture = '姿态端正'
        this.analysisResults.posture.straight++
      } else {
        this.currentPosture = '坐下'
        this.analysisResults.posture.straight++ // 坐下也算正常姿态
      }
      
      // 记录历史
      this.postureHistory.push({
        timestamp: this.video ? this.video.currentTime : 0,
        posture: this.currentPosture
      })
    },

    analyzeEmotion(results) {
      if (!results.faceLandmarks) {
        this.currentEmotion = '未检测到面部'
        return
      }

      const landmarks = results.faceLandmarks
      
      // 检查嘴角位置判断表情
      const leftMouthCorner = landmarks[61]
      const rightMouthCorner = landmarks[291]
      const upperLip = landmarks[0]
      
      const mouthAngle = (leftMouthCorner.y + rightMouthCorner.y) / 2 - upperLip.y
      
      let emotion = 'neutral'
      if (mouthAngle > 0.02) {
        this.currentEmotion = '微笑'
        emotion = 'smile'
        this.analysisResults.emotion.smile++
      } else if (mouthAngle < -0.02) {
        this.currentEmotion = '皱眉'
        emotion = 'frown'
        this.analysisResults.emotion.frown++
      } else {
        this.currentEmotion = '平静'
        emotion = 'neutral'
        this.analysisResults.emotion.neutral++
      }
      
      // 记录历史
      this.emotionHistory.push({
        timestamp: this.video ? this.video.currentTime : 0,
        emotion: emotion
      })
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

.detection-results {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 12px;
  background: transparent;
  font-size: 12px;
}

.result-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
  border-radius: 10px;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
  }
  
  .label {
    color: #909399;
    font-size: 11px;
    font-weight: 500;
  }
  
  .value {
    color: #409EFF;
    font-weight: 600;
    font-size: 14px;
  }
}

.divider {
  display: none;
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

// 分析统计结果
.analysis-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px;
  background: transparent;
}

.score-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
  border-radius: 12px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.score-circle {
  width: 80px;
  height: 80px;
  border: 4px solid #67C23A;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: white;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.2);
}

.score-number {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.score-label {
  font-size: 10px;
  color: #666;
  margin-top: 4px;
}

.score-info {
  flex: 1;
}

.score-level {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  
  i {
    font-size: 20px;
  }
}

.score-breakdown {
  font-size: 13px;
  color: #666;
  
  .divider {
    margin: 0 8px;
    color: #DCDFE6;
  }
}

.stats-section {
  padding: 16px;
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
  border-radius: 10px;
  border: 1px solid #e9ecef;
  
  h4 {
    margin: 0 0 12px 0;
    color: #2c3e50;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    
    i {
      font-size: 16px;
      color: #409EFF;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  background: white;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  i {
    font-size: 24px;
  }
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
}

.stat-label {
  font-size: 11px;
  color: #909399;
  font-weight: 500;
}
</style> 