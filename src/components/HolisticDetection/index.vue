<!-- HolisticDetection.vue -->
<template>
    <div class="container">
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      <template v-else>
        <video ref="inputVideo" class="input_video"></video>
        <canvas ref="outputCanvas" class="output_canvas" width="1280" height="720"></canvas>
      </template>
    </div>
  </template>

  <script>
  export default {
    name: 'HolisticDetection',
    data() {
      return {
        holistic: null,
        camera: null,
        canvasCtx: null,
        errorMsg: null
      }
    },
    async mounted() {
    try {
      // 检查是否支持 getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('您的设备不支持摄像头访问或未检测到摄像头设备')
      }

      // 检查是否有可用的视频输入设备
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      if (videoDevices.length === 0) {
        throw new Error('未检测到摄像头设备，请确保已连接摄像头')
      }

      // 如果检测通过，初始化 Holistic
      await this.initializeHolistic()
    } catch (err) {
      this.error = err.message
      console.error('摄像头初始化失败:', err)
    }
    },
    beforeDestroy() {
      if (this.camera) {
        this.camera.stop()
      }
      if (this.holistic) {
        this.holistic.close()
      }
    },
    methods: {
      initializeHolistic() {
        const videoElement = this.$refs.inputVideo
        const canvasElement = this.$refs.outputCanvas
        this.canvasCtx = canvasElement.getContext('2d')
  
        this.holistic = new window.Holistic({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`
          }
        })
  
        this.holistic.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: true,
          smoothSegmentation: true,
          refineFaceLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        })
  
        this.holistic.onResults(this.onResults)
  
        this.camera = new window.Camera(videoElement, {
          onFrame: async () => {
            await this.holistic.send({image: videoElement})
          },
          width: 1280,
          height: 720
        })
  
        this.camera.start()
      },
      onResults(results) {
        const canvasElement = this.$refs.outputCanvas
        
        this.canvasCtx.save()
        this.canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
        this.canvasCtx.drawImage(
          results.segmentationMask,
          0,
          0,
          canvasElement.width,
          canvasElement.height
        )
  
        // Only overwrite existing pixels
        this.canvasCtx.globalCompositeOperation = 'source-in'
        this.canvasCtx.fillStyle = '#00FF00'
        this.canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height)
  
        // Only overwrite missing pixels
        this.canvasCtx.globalCompositeOperation = 'destination-atop'
        this.canvasCtx.drawImage(
          results.image,
          0,
          0,
          canvasElement.width,
          canvasElement.height
        )
  
        this.canvasCtx.globalCompositeOperation = 'source-over'
        window.drawConnectors(
          this.canvasCtx,
          results.poseLandmarks,
          window.POSE_CONNECTIONS,
          { color: '#00FF00', lineWidth: 4 }
        )
        window.drawLandmarks(
          this.canvasCtx,
          results.poseLandmarks,
          { color: '#FF0000', lineWidth: 2 }
        )
        window.drawConnectors(
          this.canvasCtx,
          results.faceLandmarks,
          window.FACEMESH_TESSELATION,
          { color: '#C0C0C070', lineWidth: 1 }
        )
        window.drawConnectors(
          this.canvasCtx,
          results.leftHandLandmarks,
          window.HAND_CONNECTIONS,
          { color: '#CC0000', lineWidth: 5 }
        )
        window.drawLandmarks(
          this.canvasCtx,
          results.leftHandLandmarks,
          { color: '#00FF00', lineWidth: 2 }
        )
        window.drawConnectors(
          this.canvasCtx,
          results.rightHandLandmarks,
          window.HAND_CONNECTIONS,
          { color: '#00CC00', lineWidth: 5 }
        )
        window.drawLandmarks(
          this.canvasCtx,
          results.rightHandLandmarks,
          { color: '#FF0000', lineWidth: 2 }
        )
        this.canvasCtx.restore()
      }
    }
  }
  </script>
  
  <style scoped>
.container {
  position: relative;
  width: 1280px;
  height: 720px;
}

.input_video {
  display: none;
}

.output_canvas {
  position: absolute;
  left: 0;
  top: 0;
}

.error-message {
  color: red;
  padding: 20px;
  text-align: center;
  border: 1px solid #ffccc7;
  background-color: #fff2f0;
  border-radius: 4px;
}
</style>