<template>
  <div class="video-record-page">
    <!-- 导航栏显示流程 -->
    <div class="process-nav">
      <div class="nav-step active">
        <div class="step-number">1</div>
        <span>录制视频</span>
      </div>
      <div class="nav-arrow">→</div>
      <div class="nav-step" @click="goToAnalysis">
        <div class="step-number">2</div>
        <span>AI分析</span>
      </div>
    </div>

    <!-- 录制区域 -->
    <div class="record-section">
      <!-- 直接内嵌简单的录制界面，避免组件加载问题 -->
      <div class="inline-video-recorder">
        <h2>📹 视频录制</h2>
        
        <!-- 视频显示区域 -->
        <div class="video-section">
          <div class="video-container">
            <h3>📷 实时预览</h3>
            <video
              ref="previewVideo"
              class="video-preview"
              autoplay
              muted
              playsinline
            ></video>
            <div v-if="!cameraStarted" class="video-placeholder">
              <i class="fas fa-video"></i>
              <p>点击启动摄像头开始预览</p>
            </div>
          </div>

          <div class="video-container">
            <h3>▶️ 录制回放</h3>
            <video
              ref="playbackVideo"
              class="video-playback"
              controls
              playsinline
            ></video>
            <div v-if="!currentRecording" class="video-placeholder">
              <i class="fas fa-play-circle"></i>
              <p>录制完成后将在此显示</p>
            </div>
          </div>
        </div>

        <!-- 控制区域 -->
        <div class="controls">
          <button 
            @click="startCamera" 
            :disabled="cameraStarted"
            class="btn btn-primary"
          >
            <i class="fas fa-video"></i>
            {{ cameraStarted ? '摄像头已启动' : '启动摄像头' }}
          </button>
          
          <button 
            @click="runCameraDiagnostic" 
            :disabled="isRunningDiagnostic"
            class="btn btn-warning"
          >
            <i class="fas fa-search" :class="{ 'fa-spin': isRunningDiagnostic }"></i>
            {{ isRunningDiagnostic ? '诊断中...' : '摄像头诊断' }}
          </button>
          
          <button 
            @click="startRecording" 
            :disabled="!cameraStarted || isRecording"
            class="btn btn-success"
          >
            <i class="fas fa-circle"></i>
            开始录制
          </button>
          
          <button 
            @click="stopRecording" 
            :disabled="!isRecording"
            class="btn btn-danger"
          >
            <i class="fas fa-stop"></i>
            停止录制
          </button>
          
          <button 
            @click="downloadVideo" 
            :disabled="!currentRecording"
            class="btn btn-info"
          >
            <i class="fas fa-download"></i>
            下载视频
          </button>
        </div>

        <!-- 状态显示 -->
        <div class="status-section">
          <div class="status" :class="statusClass">
            {{ statusMessage }}
          </div>
          
          <div v-if="isRecording" class="timer">
            <i class="fas fa-clock"></i>
            录制时间: {{ recordingTime }}
          </div>
          
          <div v-if="errorMessage" class="error">
            <i class="fas fa-exclamation-triangle"></i>
            {{ errorMessage }}
          </div>
        </div>

        <!-- 录制历史 -->
        <div class="recordings-section">
          <h3>📂 录制历史</h3>
          <div v-if="recordings.length === 0" class="no-recordings">
            <i class="fas fa-film"></i>
            <p>暂无录制记录</p>
          </div>
          <div v-else class="recordings-list">
            <div 
              v-for="recording in recordings" 
              :key="recording.id"
              class="recording-item"
            >
              <div class="recording-info">
                <div class="recording-title">
                  <strong>{{ recording.filename }}</strong>
                  <span v-if="currentRecording && recording.id === currentRecording.id" class="current-badge">当前</span>
                </div>
                <div class="recording-meta">
                  <span><i class="fas fa-clock"></i> {{ formatDate(recording.timestamp) }}</span>
                  <span><i class="fas fa-hdd"></i> {{ formatSize(recording.size) }}</span>
                </div>
              </div>
              <div class="recording-actions">
                <button 
                  @click="playRecording(recording)" 
                  class="btn btn-sm btn-play"
                  :class="{ active: currentRecording && recording.id === currentRecording.id }"
                >
                  <i class="fas fa-play"></i>
                </button>
                <button 
                  @click="downloadRecording(recording)" 
                  class="btn btn-sm btn-outline"
                >
                  <i class="fas fa-download"></i>
                </button>
                <button 
                  @click="deleteRecording(recording.id)" 
                  class="btn btn-sm btn-delete"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="bottom-nav">
      <button @click="goToAnalysis" class="nav-btn" :disabled="!hasRecordings">
        <i class="fas fa-brain"></i>
        进入AI分析
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VideoRecord',
  data() {
    return {
      hasRecordings: false,
      // 录制相关状态
      cameraStarted: false,
      isRecording: false,
      currentRecording: null,
      statusMessage: '点击启动摄像头开始',
      statusClass: '',
      errorMessage: '',
      recordings: [],
      recordingStartTime: null,
      recordingTime: '00:00',
      timerInterval: null,
      // 媒体相关
      mediaStream: null,
      mediaRecorder: null,
      recordedChunks: [],
      isRunningDiagnostic: false
    }
  },
  mounted() {
    console.log('录制页面开始加载')
    
    // 检查是否有录制的视频
    this.checkRecordings()
    
    // 加载录制历史
    this.loadRecordingHistory()
  },
  
  beforeDestroy() {
    this.cleanup()
  },
  methods: {
    goToAnalysis() {
      this.$router.push('/video/analysis')
    },
    checkRecordings() {
      // 简单检查localStorage中是否有录制记录
      const recordings = localStorage.getItem('video_recordings')
      this.hasRecordings = recordings && JSON.parse(recordings).length > 0
    },
    
    // 启动摄像头
    async startCamera() {
      try {
        this.clearError()
        this.setStatus('正在启动摄像头...', 'loading')
        
        // 检查摄像头可用性
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('您的浏览器不支持摄像头功能')
        }
        
        // 添加超时控制
        const timeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('摄像头启动超时，请检查设备或权限')), 10000) // 10秒超时
        })
        
        // 多级降级配置策略
        const cameraConfigs = [
          // 高质量配置
          {
            video: {
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
              facingMode: 'user',
              frameRate: { ideal: 30, min: 15 }
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 44100,
              channelCount: 2
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
        
        this.mediaStream = stream
        this.$refs.previewVideo.srcObject = stream
        this.cameraStarted = true
        this.setStatus('摄像头已启动，可以开始录制', 'success')
        
      } catch (error) {
        console.error('启动摄像头失败:', error)
        this.showError(`无法访问摄像头: ${error.message}`)
        
        // 提供详细的解决建议
        if (error.message.includes('权限')) {
          this.showError('摄像头权限被拒绝。请点击地址栏的摄像头图标，选择"始终允许"')
        } else if (error.message.includes('占用') || error.message.includes('busy')) {
          this.showError('摄像头正被其他应用使用。请关闭其他使用摄像头的程序后重试')
        } else if (error.message.includes('超时')) {
          this.showError('摄像头启动超时。请检查摄像头连接，或尝试重启浏览器')
        } else if (error.message.includes('设备')) {
          this.showError('未找到摄像头设备。请检查摄像头是否正确连接')
        }
      }
    },

    // 开始录制
    startRecording() {
      try {
        if (!this.mediaStream) {
          this.showError('请先启动摄像头')
          return
        }
        
        this.recordedChunks = []
        this.clearError()
        
        const options = this.getRecorderOptions()
        this.mediaRecorder = new MediaRecorder(this.mediaStream, options)
        
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.recordedChunks.push(event.data)
          }
        }
        
        this.mediaRecorder.onstop = () => {
          this.handleRecordingStop()
        }
        
        this.mediaRecorder.onerror = (event) => {
          console.error('录制错误:', event.error)
          this.showError(`录制出错: ${event.error.message}`)
        }
        
        this.mediaRecorder.start(100)
        this.isRecording = true
        this.recordingStartTime = Date.now()
        this.startTimer()
        
        this.setStatus('正在录制中...', 'recording')
        
      } catch (error) {
        console.error('开始录制失败:', error)
        this.showError(`录制失败: ${error.message}`)
      }
    },

    // 停止录制
    stopRecording() {
      if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.stop()
        this.isRecording = false
        this.stopTimer()
        this.setStatus('正在处理录制...', 'processing')
      }
    },

    // 获取录制选项
    getRecorderOptions() {
      const supportedTypes = [
        'video/mp4;codecs=h264,aac',
        'video/mp4;codecs=avc1.424028,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm'
      ]
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          console.log('选择的录制格式:', type)
          return { mimeType: type }
        }
      }
      
      console.log('使用默认录制格式')
      return {}
    },

    // 处理录制停止
    handleRecordingStop() {
      const blob = new Blob(this.recordedChunks, { 
        type: this.mediaRecorder.mimeType || 'video/webm' 
      })
      
      const url = URL.createObjectURL(blob)
      const now = new Date()
      const mimeType = this.mediaRecorder.mimeType || 'video/webm'
      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm'
      const filename = `录制_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}.${extension}`
      
      const recording = {
        id: Date.now(),
        filename,
        url,
        timestamp: now.getTime(),
        size: blob.size,
        mimeType,
        blob: blob
      }
      
      // 保存录制
      this.recordings.unshift(recording)
      this.currentRecording = recording
      
      // 保存到localStorage
      this.saveRecordingHistory()
      
      // 在回放区域显示
      this.$refs.playbackVideo.src = url
      
      this.setStatus(`录制完成！文件: ${filename}`, 'success')
      
      // 更新按钮状态
      this.hasRecordings = true
    },

    // 播放录制
    playRecording(recording) {
      this.currentRecording = recording
      const video = this.$refs.playbackVideo
      video.src = recording.url
      video.play()
    },

    // 下载当前录制
    downloadVideo() {
      if (this.currentRecording) {
        this.downloadRecording(this.currentRecording)
      }
    },

    // 下载录制文件
    downloadRecording(recording) {
      const a = document.createElement('a')
      a.href = recording.url
      a.download = recording.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    },

    // 删除录制
    deleteRecording(id) {
      if (confirm('确定要删除这个录制吗？')) {
        const index = this.recordings.findIndex(r => r.id === id)
        if (index !== -1) {
          const recording = this.recordings[index]
          
          // 释放URL对象
          URL.revokeObjectURL(recording.url)
          
          // 从列表中移除
          this.recordings.splice(index, 1)
          
          // 更新localStorage
          this.saveRecordingHistory()
          
          // 如果删除的是当前播放的录制
          if (this.currentRecording && this.currentRecording.id === id) {
            this.currentRecording = null
            this.$refs.playbackVideo.src = ''
          }
          
          // 更新按钮状态
          this.hasRecordings = this.recordings.length > 0
        }
      }
    },

    // 保存录制历史到localStorage
    saveRecordingHistory() {
      try {
        const recordingsForStorage = this.recordings.map(recording => ({
          id: recording.id,
          filename: recording.filename,
          url: recording.url,
          timestamp: recording.timestamp,
          size: recording.size,
          mimeType: recording.mimeType
        }))
        
        localStorage.setItem('video_recordings', JSON.stringify(recordingsForStorage))
      } catch (error) {
        console.error('保存录制历史失败:', error)
      }
    },

    // 从localStorage加载录制历史
    loadRecordingHistory() {
      try {
        const saved = localStorage.getItem('video_recordings')
        if (saved) {
          this.recordings = JSON.parse(saved)
        }
      } catch (error) {
        console.error('加载录制历史失败:', error)
        this.recordings = []
      }
    },

    // 格式化日期
    formatDate(timestamp) {
      return new Date(timestamp).toLocaleString('zh-CN')
    },
    
    // 格式化文件大小
    formatSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    // 开始计时器
    startTimer() {
      this.timerInterval = setInterval(() => {
        if (this.recordingStartTime) {
          const elapsed = Date.now() - this.recordingStartTime
          const minutes = Math.floor(elapsed / 60000)
          const seconds = Math.floor((elapsed % 60000) / 1000)
          this.recordingTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        }
      }, 1000)
    },

    // 停止计时器
    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval)
        this.timerInterval = null
      }
    },

    // 设置状态
    setStatus(message, className = '') {
      this.statusMessage = message
      this.statusClass = className
    },

    // 显示错误
    showError(message) {
      this.errorMessage = message
      this.setStatus('发生错误', 'error')
    },

    // 清除错误
    clearError() {
      this.errorMessage = ''
    },

    // 清理资源
    cleanup() {
      this.stopTimer()
      
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop())
      }
    },

    // 运行摄像头诊断
    async runCameraDiagnostic() {
      try {
        this.setStatus('正在运行摄像头诊断...', 'loading')
        this.isRunningDiagnostic = true
        this.clearError()
        
        const diagnosticResults = []
        
        // 1. 检查浏览器API支持
        console.log('📋 开始摄像头诊断...')
        
        if (!navigator.mediaDevices) {
          diagnosticResults.push('❌ 浏览器不支持 MediaDevices API')
        } else {
          diagnosticResults.push('✅ 浏览器支持 MediaDevices API')
        }
        
        if (!navigator.mediaDevices.getUserMedia) {
          diagnosticResults.push('❌ 浏览器不支持 getUserMedia')
        } else {
          diagnosticResults.push('✅ 浏览器支持 getUserMedia')
        }
        
        if (typeof MediaRecorder === 'undefined') {
          diagnosticResults.push('❌ 浏览器不支持 MediaRecorder')
        } else {
          diagnosticResults.push('✅ 浏览器支持 MediaRecorder')
        }
        
        // 2. 检查可用设备
        try {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const videoDevices = devices.filter(device => device.kind === 'videoinput')
          const audioDevices = devices.filter(device => device.kind === 'audioinput')
          
          diagnosticResults.push(`📹 发现 ${videoDevices.length} 个视频设备`)
          diagnosticResults.push(`🎤 发现 ${audioDevices.length} 个音频设备`)
          
          if (videoDevices.length === 0) {
            diagnosticResults.push('⚠️ 未发现摄像头设备')
          } else {
            videoDevices.forEach((device, index) => {
              diagnosticResults.push(`  📹 设备${index + 1}: ${device.label || '未知设备'}`)
            })
          }
          
          if (audioDevices.length === 0) {
            diagnosticResults.push('⚠️ 未发现麦克风设备')
          } else {
            audioDevices.forEach((device, index) => {
              diagnosticResults.push(`  🎤 设备${index + 1}: ${device.label || '未知设备'}`)
            })
          }
        } catch (error) {
          diagnosticResults.push(`❌ 设备枚举失败: ${error.message}`)
        }
        
        // 3. 测试权限和设备访问
        const testConfigs = [
          { name: '基础视频', config: { video: true, audio: false } },
          { name: '高质量视频', config: { video: { width: 1280, height: 720 }, audio: false } },
          { name: '视频+音频', config: { video: true, audio: true } }
        ]
        
        for (const test of testConfigs) {
          try {
            const testStream = await navigator.mediaDevices.getUserMedia(test.config)
            diagnosticResults.push(`✅ ${test.name}测试通过`)
            
            // 获取实际配置信息
            const videoTrack = testStream.getVideoTracks()[0]
            if (videoTrack) {
              const settings = videoTrack.getSettings()
              diagnosticResults.push(`  📐 实际分辨率: ${settings.width}x${settings.height}`)
              diagnosticResults.push(`  🎞️ 帧率: ${settings.frameRate || '未知'}`)
            }
            
            const audioTrack = testStream.getAudioTracks()[0]
            if (audioTrack) {
              const audioSettings = audioTrack.getSettings()
              diagnosticResults.push(`  🔊 采样率: ${audioSettings.sampleRate || '未知'}`)
            }
            
            // 关闭测试流
            testStream.getTracks().forEach(track => track.stop())
            
          } catch (error) {
            diagnosticResults.push(`❌ ${test.name}测试失败: ${error.name} - ${error.message}`)
            
            // 分析具体错误原因
            if (error.name === 'NotAllowedError') {
              diagnosticResults.push('  💡 解决方案: 点击地址栏摄像头图标，允许访问')
            } else if (error.name === 'NotFoundError') {
              diagnosticResults.push('  💡 解决方案: 检查摄像头连接和驱动程序')
            } else if (error.name === 'AbortError') {
              diagnosticResults.push('  💡 解决方案: 关闭其他使用摄像头的程序')
            } else if (error.name === 'OverconstrainedError') {
              diagnosticResults.push('  💡 解决方案: 降低视频质量要求')
            }
          }
        }
        
        // 4. 浏览器信息
        diagnosticResults.push('🌐 浏览器信息:')
        diagnosticResults.push(`  User Agent: ${navigator.userAgent}`)
        diagnosticResults.push(`  是否HTTPS: ${location.protocol === 'https:' ? '是' : '否'}`)
        
        // 5. 检查录制格式支持
        const supportedFormats = [
          'video/mp4',
          'video/webm;codecs=vp8',
          'video/webm;codecs=vp9',
          'video/webm;codecs=h264'
        ]
        
        diagnosticResults.push('🎥 支持的录制格式:')
        supportedFormats.forEach(format => {
          if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(format)) {
            diagnosticResults.push(`  ✅ ${format}`)
          } else {
            diagnosticResults.push(`  ❌ ${format}`)
          }
        })
        
        // 输出诊断结果
        console.log('📋 摄像头诊断结果:')
        diagnosticResults.forEach(result => console.log(result))
        
        // 生成诊断报告
        const report = diagnosticResults.join('\n')
        
        // 显示诊断结果弹窗
        this.$confirm(report, '摄像头诊断报告', {
          confirmButtonText: '复制报告',
          cancelButtonText: '关闭',
          type: 'info',
          customClass: 'diagnostic-dialog',
          beforeClose: (action, instance, done) => {
            if (action === 'confirm') {
              // 复制诊断报告到剪贴板
              navigator.clipboard.writeText(report).then(() => {
                this.$message.success('诊断报告已复制到剪贴板')
              }).catch(() => {
                this.$message.warning('复制失败，请手动复制控制台内容')
              })
            }
            done()
          }
        }).catch(() => {
          // 用户取消，不做任何处理
        })
        
        this.setStatus('摄像头诊断完成，查看控制台了解详情', 'success')
        
      } catch (error) {
        console.error('运行摄像头诊断失败:', error)
        this.showError(`摄像头诊断失败: ${error.message}`)
      } finally {
        this.isRunningDiagnostic = false
      }
    }
  }
}
</script>

<style scoped>
.video-record-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

/* 流程导航 */
.process-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  max-width: 500px;
  margin: 0 auto 30px;
}

.nav-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 10px;
  border-radius: 10px;
}

.nav-step.active {
  background: rgba(76, 175, 80, 0.2);
  border: 2px solid rgba(76, 175, 80, 0.5);
}

.nav-step:not(.active):hover {
  background: rgba(255, 255, 255, 0.1);
}

.step-number {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  transition: all 0.3s ease;
}

.nav-step.active .step-number {
  background: #4CAF50;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
}

.nav-step span {
  color: white;
  font-weight: 500;
  font-size: 14px;
}

.nav-arrow {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.5rem;
  font-weight: bold;
}

/* 录制区域 */
.record-section {
  margin-bottom: 30px;
}

/* 底部导航 */
.bottom-nav {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 30px;
  background: linear-gradient(135deg, #9C27B0, #7B1FA2);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(156, 39, 176, 0.3);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.nav-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(156, 39, 176, 0.4);
}

.nav-btn i {
  font-size: 18px;
}

/* 给SimpleVideoRecorder组件添加样式 */
.record-section >>> .simple-video-recorder {
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

/* 确保录制组件可见 */
.record-section {
  width: 100%;
  display: block;
}

/* 内联录制器样式 */
.inline-video-recorder {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.inline-video-recorder h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.video-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
  align-items: start;
}

.video-container {
  background: #f5f5f5;
  border-radius: 10px;
  padding: 15px;
  position: relative;
}

/* 备用方案：为不支持aspect-ratio的浏览器使用padding-bottom创建16:9比例 */
@supports not (aspect-ratio: 16/9) {
  .video-preview,
  .video-playback {
    height: 0;
    padding-bottom: 56.25%; /* 9/16 * 100% = 56.25% 创建16:9比例 */
    position: relative;
  }
}

.video-container h3 {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 16px;
  text-align: center;
}

.video-preview,
.video-playback {
  width: 100%;
  aspect-ratio: 16/9;
  background: #000;
  border-radius: 8px;
  object-fit: cover;
}

.video-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #999;
  z-index: 10;
}

.video-placeholder i {
  font-size: 48px;
  margin-bottom: 12px;
  display: block;
}

.video-placeholder p {
  font-size: 14px;
  margin: 0;
}

.controls {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:not(:disabled):hover {
  background: #0056b3;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:not(:disabled):hover {
  background: #1e7e34;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:not(:disabled):hover {
  background: #c82333;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:not(:disabled):hover {
  background: #138496;
}

.btn-warning {
  background: #ffc107;
  color: white;
}

.btn-warning:not(:disabled):hover {
  background: #e0a800;
}

.status-section {
  margin-bottom: 20px;
}

.status {
  text-align: center;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 10px;
}

.status.loading {
  background: #fff3cd;
  color: #856404;
}

.status.success {
  background: #d4edda;
  color: #155724;
}

.status.error {
  background: #f8d7da;
  color: #721c24;
}

.status.recording {
  background: #ffe6e6;
  color: #cc0000;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.timer {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #dc3545;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 5px;
  margin-top: 10px;
}

.recordings-section {
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.recordings-section h3 {
  margin-bottom: 15px;
  color: #333;
}

.no-recordings {
  text-align: center;
  color: #999;
  padding: 40px;
}

.no-recordings i {
  font-size: 48px;
  display: block;
  margin-bottom: 10px;
}

.recordings-list {
  max-height: 300px;
  overflow-y: auto;
}

.recording-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 10px;
  background: #fafafa;
}

.recording-info {
  flex: 1;
}

.recording-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.current-badge {
  background: #28a745;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.recording-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #666;
}

.recording-actions {
  display: flex;
  gap: 5px;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

.btn-play {
  background: #28a745;
  color: white;
}

.btn-play.active {
  background: #155724;
}

.btn-outline {
  background: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.btn-outline:hover {
  background: #007bff;
  color: white;
}

.btn-delete {
  background: #dc3545;
  color: white;
}

.btn-delete:hover {
  background: #c82333;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-record-page {
    padding: 15px;
  }
  
  .process-nav {
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .nav-arrow {
    font-size: 1.2rem;
  }
  
  .nav-btn {
    width: 100%;
    max-width: 280px;
    justify-content: center;
  }
  
  .video-section {
    grid-template-columns: 1fr;
  }
  
  .controls {
    flex-direction: column;
    align-items: center;
  }
  
  .recording-item {
    flex-direction: column;
    gap: 10px;
  }
}

/* 诊断对话框样式 */
.diagnostic-dialog {
  width: 800px !important;
  max-width: 90vw;
}

.diagnostic-dialog .el-message-box__content {
  white-space: pre-line;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  max-height: 400px;
  overflow-y: auto;
  background: #f5f5f5;
  padding: 15px;
  border-radius: 5px;
  margin: 10px 0;
}

.diagnostic-dialog .el-message-box__title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}
</style>