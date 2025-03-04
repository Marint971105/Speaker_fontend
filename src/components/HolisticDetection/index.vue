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

export default {
  name: 'HolisticDetection',
  data() {
    return {
      holistic: null,
      videoRunning: false,
      error: null,
      lastVideoTime: -1,
      inputVideo: null,
      isMediaPipeReady: false
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

        // 等待视频元数据加载
        await new Promise(resolve => {
          video.onloadedmetadata = resolve
        })

        // 移除旧的事件监听器
        video.removeEventListener('play', this.startProcessing)
        video.removeEventListener('pause', this.stopProcessing)
        
        // 添加新的事件监听器
        video.addEventListener('play', this.startProcessing)
        video.addEventListener('pause', this.stopProcessing)
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
  gap: 20px;
  max-width: 1440px;
  margin: 0 auto;
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
  .content-wrapper {
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
</style>