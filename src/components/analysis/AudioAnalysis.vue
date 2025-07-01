<template>
  <div class="audio-analysis">
    <!-- 分析中状态 -->
    <div v-if="isAnalyzing" class="analyzing-state">
      <div class="loading-spinner"></div>
      <p>正在分析音频特征...</p>
      <div class="progress-text">分析音频频谱中</div>
      
      <!-- 音频可视化 -->
      <div class="audio-visualizer">
        <canvas ref="audioCanvas" width="300" height="100"></canvas>
      </div>
    </div>
    
    <!-- 分析结果 -->
    <div v-else-if="audioResults.length > 0" class="result-display">
      <div class="audio-summary">
        <div class="summary-card">
          <i class="fas fa-volume-up"></i>
          <div>
            <h4>平均音量</h4>
            <span class="score">{{ averageVolume }}dB</span>
          </div>
        </div>
        <div class="summary-card">
          <i class="fas fa-chart-line"></i>
          <div>
            <h4>音量变化</h4>
            <span class="score">{{ volumeVariation }}%</span>
          </div>
        </div>
      </div>
      
      <div class="audio-details">
        <h4><i class="fas fa-wave-square"></i> 频率分析</h4>
        <div class="frequency-bars">
          <div v-for="(freq, index) in frequencyBands" :key="index" class="frequency-bar">
            <span class="freq-label">{{ freq.label }}</span>
            <div class="freq-bar">
              <div class="bar-fill" :style="{height: `${freq.value}%`}"></div>
            </div>
            <span class="freq-value">{{ freq.value }}%</span>
          </div>
        </div>
      </div>
      
      <div class="volume-timeline">
        <h4><i class="fas fa-clock"></i> 音量变化趋势</h4>
        <div class="timeline-chart">
          <canvas ref="volumeChart" width="350" height="80"></canvas>
        </div>
        <div class="timeline-stats">
          <p>最高音量: {{ maxVolume }}dB</p>
          <p>最低音量: {{ minVolume }}dB</p>
          <p>静音时长: {{ silenceDuration }}秒</p>
        </div>
      </div>
      
      <div class="recommendations">
        <h4><i class="fas fa-lightbulb"></i> 改进建议</h4>
        <ul>
          <li v-for="(tip, index) in audioTips" :key="index">
            {{ tip }}
          </li>
        </ul>
      </div>
      
      <div class="analysis-time">
        <small>分析时间: {{ analysisTime }}</small>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <i class="fas fa-volume-up"></i>
      <p>等待开始音频分析</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AudioAnalysis',
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
      isAnalyzing: false,
      audioResults: [],
      analysisTime: '',
      audioContext: null,
      analyser: null,
      videoElement: null,
      animationId: null
    }
  },
  computed: {
    averageVolume() {
      if (this.audioResults.length === 0) return 0
      
      const total = this.audioResults.reduce((sum, result) => sum + result.volume, 0)
      return Math.round(total / this.audioResults.length)
    },
    volumeVariation() {
      if (this.audioResults.length < 2) return 0
      
      const volumes = this.audioResults.map(r => r.volume)
      const max = Math.max(...volumes)
      const min = Math.min(...volumes)
      
      return max > 0 ? Math.round(((max - min) / max) * 100) : 0
    },
    maxVolume() {
      if (this.audioResults.length === 0) return 0
      return Math.max(...this.audioResults.map(r => r.volume))
    },
    minVolume() {
      if (this.audioResults.length === 0) return 0
      return Math.min(...this.audioResults.map(r => r.volume))
    },
    silenceDuration() {
      if (this.audioResults.length === 0) return 0
      
      const silentFrames = this.audioResults.filter(r => r.volume < -40).length
      return (silentFrames * 0.1).toFixed(1) // 假设每帧0.1秒
    },
    frequencyBands() {
      if (this.audioResults.length === 0) return []
      
      // 计算平均频率分布
      const bands = ['低频', '中低频', '中频', '中高频', '高频']
      const avgFreqs = new Array(5).fill(0)
      
      this.audioResults.forEach(result => {
        if (result.frequencies) {
          result.frequencies.forEach((freq, index) => {
            const bandIndex = Math.floor(index / (result.frequencies.length / 5))
            if (bandIndex < 5) {
              avgFreqs[bandIndex] += freq
            }
          })
        }
      })
      
      const totalResults = this.audioResults.length
      
      return bands.map((label, index) => ({
        label,
        value: totalResults > 0 ? Math.round((avgFreqs[index] / totalResults) * 100) : 0
      }))
    },
    audioTips() {
      const tips = []
      
      if (this.averageVolume < -30) {
        tips.push('音量偏低，建议提高说话音量或调整麦克风位置')
      } else if (this.averageVolume > -10) {
        tips.push('音量偏高，注意控制说话音量避免失真')
      }
      
      if (this.volumeVariation > 50) {
        tips.push('音量变化较大，尝试保持更稳定的音量')
      } else if (this.volumeVariation < 20) {
        tips.push('音量变化较小，可以适当增加语调起伏')
      }
      
      if (parseFloat(this.silenceDuration) > 5) {
        tips.push('静音时间较长，注意减少停顿时间')
      }
      
      if (tips.length === 0) {
        tips.push('音频质量良好，继续保持！')
      }
      
      return tips
    }
  },
  mounted() {
    if (this.autoStart) {
      this.startAnalysis()
    }
  },
  watch: {
    videoUrl(newUrl) {
      if (newUrl && this.autoStart) {
        this.startAnalysis()
      }
    }
  },
  methods: {
    async startAnalysis() {
      if (!this.videoUrl || this.isAnalyzing) return
      
      this.isAnalyzing = true
      this.audioResults = []
      
      try {
        await this.setupAudioAnalysis()
        
      } catch (error) {
        console.error('音频分析失败:', error)
        this.isAnalyzing = false
        
        this.$emit('analysisComplete', {
          type: 'audio',
          result: { error: true, message: error.message },
          error: true
        })
      }
    },
    
    async setupAudioAnalysis() {
      // 创建视频元素
      this.videoElement = document.createElement('video')
      this.videoElement.crossOrigin = 'anonymous'
      this.videoElement.muted = false
      this.videoElement.src = this.videoUrl
      
      // 等待视频加载
      await new Promise((resolve, reject) => {
        this.videoElement.onloadedmetadata = resolve
        this.videoElement.onerror = reject
      })
      
      // 创建音频上下文
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // 创建媒体源
      const source = this.audioContext.createMediaElementSource(this.videoElement)
      
      // 创建分析器
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 256
      this.analyser.smoothingTimeConstant = 0.8
      
      // 连接音频图
      source.connect(this.analyser)
      this.analyser.connect(this.audioContext.destination)
      
      // 开始播放和分析
      this.videoElement.play()
      this.startAudioVisualization()
    },
    
    startAudioVisualization() {
      const bufferLength = this.analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      const timeArray = new Uint8Array(bufferLength)
      
      const analyze = () => {
        if (!this.isAnalyzing) return
        
        this.analyser.getByteFrequencyData(dataArray)
        this.analyser.getByteTimeDomainData(timeArray)
        
        // 计算音量
        const volume = this.calculateVolume(timeArray)
        
        // 记录分析结果
        this.audioResults.push({
          timestamp: this.videoElement.currentTime,
          volume: volume,
          frequencies: Array.from(dataArray)
        })
        
        // 绘制可视化
        this.drawAudioVisualization(dataArray)
        
        // 检查视频是否结束
        if (this.videoElement.ended) {
          this.completeAnalysis()
          return
        }
        
        this.animationId = requestAnimationFrame(analyze)
      }
      
      analyze()
    },
    
    calculateVolume(timeArray) {
      let sum = 0
      
      for (let i = 0; i < timeArray.length; i++) {
        const sample = (timeArray[i] - 128) / 128
        sum += sample * sample
      }
      
      const rms = Math.sqrt(sum / timeArray.length)
      const db = 20 * Math.log10(rms + 0.0001) // 避免log(0)
      
      return Math.round(db)
    },
    
    drawAudioVisualization(dataArray) {
      const canvas = this.$refs.audioCanvas
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      const width = canvas.width
      const height = canvas.height
      
      ctx.clearRect(0, 0, width, height)
      
      const barWidth = width / dataArray.length
      let x = 0
      
      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * height
        
        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height)
        gradient.addColorStop(0, '#3498db')
        gradient.addColorStop(1, '#2980b9')
        
        ctx.fillStyle = gradient
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight)
        
        x += barWidth
      }
    },
    
    drawVolumeChart() {
      const canvas = this.$refs.volumeChart
      if (!canvas || this.audioResults.length === 0) return
      
      const ctx = canvas.getContext('2d')
      const width = canvas.width
      const height = canvas.height
      
      ctx.clearRect(0, 0, width, height)
      
      // 绘制音量变化曲线
      ctx.strokeStyle = '#e67e22'
      ctx.lineWidth = 2
      ctx.beginPath()
      
      const maxVol = Math.max(...this.audioResults.map(r => r.volume))
      const minVol = Math.min(...this.audioResults.map(r => r.volume))
      const range = maxVol - minVol || 1
      
      this.audioResults.forEach((result, index) => {
        const x = (index / (this.audioResults.length - 1)) * width
        const y = height - ((result.volume - minVol) / range) * height
        
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      
      ctx.stroke()
    },
    
    completeAnalysis() {
      this.isAnalyzing = false
      this.analysisTime = new Date().toLocaleString()
      
      // 绘制音量图表
      this.$nextTick(() => {
        this.drawVolumeChart()
      })
      
      this.$emit('analysisComplete', {
        type: 'audio',
        result: {
          results: this.audioResults,
          averageVolume: this.averageVolume,
          volumeVariation: this.volumeVariation,
          maxVolume: this.maxVolume,
          minVolume: this.minVolume,
          silenceDuration: this.silenceDuration
        },
        timestamp: this.analysisTime
      })
    }
  },
  
  beforeDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    if (this.audioContext) {
      this.audioContext.close()
    }
    if (this.videoElement) {
      this.videoElement.remove()
    }
  }
}
</script>

<style scoped>
.audio-analysis {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.analyzing-state {
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #9b59b6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.progress-text {
  font-size: 14px;
  color: #666;
  margin-top: 10px;
}

.audio-visualizer {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.audio-visualizer canvas {
  border: 1px solid #ddd;
  border-radius: 4px;
}

.result-display {
  width: 100%;
  max-width: 400px;
}

.audio-summary {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.summary-card {
  flex: 1;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.summary-card i {
  font-size: 24px;
  color: #9b59b6;
}

.summary-card h4 {
  margin: 0 0 5px 0;
  font-size: 12px;
  color: #666;
}

.summary-card .score {
  font-size: 18px;
  font-weight: bold;
  color: #2c3e50;
}

.audio-details {
  margin-bottom: 20px;
}

.audio-details h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.frequency-bars {
  display: flex;
  justify-content: space-between;
  align-items: end;
  height: 100px;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.frequency-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  width: 50px;
}

.freq-label {
  font-size: 10px;
  color: #666;
  transform: rotate(-45deg);
  white-space: nowrap;
  margin-bottom: 5px;
}

.freq-bar {
  width: 20px;
  height: 60px;
  background: #e9ecef;
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(180deg, #9b59b6, #8e44ad);
  border-radius: 2px;
  position: absolute;
  bottom: 0;
  transition: height 0.3s ease;
}

.freq-value {
  font-size: 10px;
  color: #2c3e50;
  font-weight: 600;
}

.volume-timeline {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.volume-timeline h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-chart {
  margin-bottom: 15px;
  text-align: center;
}

.timeline-chart canvas {
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.timeline-stats {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.timeline-stats p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.recommendations {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.recommendations h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.recommendations ul {
  margin: 0;
  padding-left: 20px;
}

.recommendations li {
  margin-bottom: 5px;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.analysis-time {
  text-align: center;
  margin-top: 15px;
  color: #999;
}

.empty-state {
  text-align: center;
  color: #999;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 15px;
}
</style> 