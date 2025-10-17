<template>
  <div class="audio-analysis">
    <!-- 分析中状态 -->
    <div v-if="isAnalyzing" class="analyzing-state">
      <div class="loading-spinner"></div>
      <p>正在分析音频特征...</p>
      <div class="progress-bar">
        <div class="progress-fill" :style="{width: `${progress}%`}"></div>
      </div>
      <div class="progress-text">{{ progress }}% - 分析音频频谱中</div>
      
      <!-- 音频可视化 -->
      <div class="audio-visualizer">
        <canvas ref="audioCanvas" width="300" height="100"></canvas>
      </div>
    </div>
    
    <!-- 分析结果 -->
    <div v-else-if="audioResults.length > 0" class="result-display">
      <!-- 质量评分卡片 -->
      <div class="quality-score-card">
        <div class="score-circle" :style="{borderColor: qualityLevel.color}">
          <div class="score-number" :style="{color: qualityLevel.color}">{{ audioQualityScore }}</div>
          <div class="score-label">音频质量</div>
        </div>
        <div class="quality-info">
          <div class="quality-level" :style="{color: qualityLevel.color}">
            <i class="fas fa-certificate"></i>
            {{ qualityLevel.text }}
          </div>
          <div class="quality-desc">综合评估音量、语速、清晰度等指标</div>
        </div>
      </div>
      
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
        <div class="summary-card">
          <i class="fas fa-tachometer-alt"></i>
          <div>
            <h4>语速</h4>
            <span class="score">{{ speechRate || '--' }}</span>
          </div>
        </div>
        <div class="summary-card">
          <i class="fas fa-wave-square"></i>
          <div>
            <h4>音调变化</h4>
            <span class="score">{{ pitchVariation || '--' }}%</span>
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
        <h4><i class="fas fa-lightbulb"></i> 智能建议</h4>
        <ul>
          <li v-for="(tip, index) in audioTips" :key="index" :class="`tip-${tip.type}`">
            <i class="fas fa-" :class="tip.icon"></i>
            <span>{{ tip.text }}</span>
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
      animationId: null,
      progress: 0,
      speechSegments: [], // 语音片段
      pitchValues: [], // 音调值
      energyLevels: [] // 能量级别
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
    // 语速计算（字/分钟，估算）
    speechRate() {
      if (this.audioResults.length === 0) return 0
      
      // 计算有效语音时间（非静音）
      const activeSpeechFrames = this.audioResults.filter(r => r.volume > -40).length
      const activeSpeechSeconds = activeSpeechFrames * 0.1
      
      if (activeSpeechSeconds < 1) return 0
      
      // 估算：根据音量变化和能量分布估算音节数
      // 一般中文语速约为150-200字/分钟
      const syllableCount = this.speechSegments.length
      const wordsPerMinute = (syllableCount / activeSpeechSeconds) * 60
      
      return Math.round(wordsPerMinute)
    },
    // 音调变化程度
    pitchVariation() {
      if (this.pitchValues.length < 2) return 0
      
      const validPitches = this.pitchValues.filter(p => p > 0)
      if (validPitches.length < 2) return 0
      
      const max = Math.max(...validPitches)
      const min = Math.min(...validPitches)
      const avg = validPitches.reduce((a, b) => a + b, 0) / validPitches.length
      
      return Math.round(((max - min) / avg) * 100)
    },
    // 音频质量评分（0-100）
    audioQualityScore() {
      if (this.audioResults.length === 0) return 0
      
      let score = 100
      
      // 音量评分（30分）
      const avgVol = this.averageVolume
      if (avgVol < -40 || avgVol > -5) {
        score -= 15
      } else if (avgVol < -35 || avgVol > -10) {
        score -= 5
      }
      
      // 音量稳定性评分（20分）
      const volVar = this.volumeVariation
      if (volVar > 60) {
        score -= 15
      } else if (volVar > 40) {
        score -= 8
      }
      
      // 静音时长评分（20分）
      const silence = parseFloat(this.silenceDuration)
      const totalTime = this.audioResults.length * 0.1
      const silenceRatio = silence / totalTime
      if (silenceRatio > 0.3) {
        score -= 15
      } else if (silenceRatio > 0.2) {
        score -= 8
      }
      
      // 频率分布评分（15分）
      const freqs = this.frequencyBands
      const midFreqRatio = freqs[2]?.value || 0
      if (midFreqRatio < 30) {
        score -= 10
      }
      
      // 语速评分（15分）
      const rate = this.speechRate
      if (rate > 0) {
        if (rate < 100 || rate > 250) {
          score -= 10
        } else if (rate < 120 || rate > 220) {
          score -= 5
        }
      }
      
      return Math.max(0, Math.min(100, score))
    },
    // 质量等级
    qualityLevel() {
      const score = this.audioQualityScore
      if (score >= 90) return { text: '优秀', color: '#4CAF50' }
      if (score >= 80) return { text: '良好', color: '#8BC34A' }
      if (score >= 70) return { text: '中等', color: '#FFC107' }
      if (score >= 60) return { text: '及格', color: '#FF9800' }
      return { text: '待改进', color: '#F44336' }
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
      const score = this.audioQualityScore
      
      // 音量建议
      const avgVol = this.averageVolume
      if (avgVol < -35) {
        tips.push({
          type: 'warning',
          icon: 'volume-down',
          text: '音量偏低，建议提高说话音量或靠近麦克风',
          priority: 3
        })
      } else if (avgVol > -10) {
        tips.push({
          type: 'warning',
          icon: 'volume-up',
          text: '音量偏高，请适当降低音量或远离麦克风以避免失真',
          priority: 3
        })
      } else if (avgVol >= -30 && avgVol <= -15) {
        tips.push({
          type: 'success',
          icon: 'check-circle',
          text: '音量适中，表现优秀！',
          priority: 1
        })
      }
      
      // 音量稳定性建议
      const volVar = this.volumeVariation
      if (volVar > 60) {
        tips.push({
          type: 'warning',
          icon: 'wave-square',
          text: '音量波动较大，建议保持稳定的说话音量和距离',
          priority: 2
        })
      } else if (volVar < 15) {
        tips.push({
          type: 'info',
          icon: 'info-circle',
          text: '音量变化较小，可以适当增加语调起伏让表达更生动',
          priority: 1
        })
      }
      
      // 静音时长建议
      const silence = parseFloat(this.silenceDuration)
      const totalTime = this.audioResults.length * 0.1
      const silenceRatio = silence / totalTime
      
      if (silenceRatio > 0.3) {
        tips.push({
          type: 'warning',
          icon: 'pause-circle',
          text: `静音时间占比${(silenceRatio * 100).toFixed(1)}%，建议减少停顿，保持流畅表达`,
          priority: 3
        })
      } else if (silenceRatio > 0.2) {
        tips.push({
          type: 'info',
          icon: 'clock',
          text: '停顿略多，可以适当加快节奏',
          priority: 2
        })
      }
      
      // 语速建议
      const rate = this.speechRate
      if (rate > 0) {
        if (rate < 100) {
          tips.push({
            type: 'info',
            icon: 'tachometer-alt',
            text: `语速较慢（${rate}音节/分钟），可以适当加快`,
            priority: 2
          })
        } else if (rate > 250) {
          tips.push({
            type: 'warning',
            icon: 'tachometer-alt',
            text: `语速过快（${rate}音节/分钟），建议放慢以确保清晰度`,
            priority: 3
          })
        } else if (rate >= 150 && rate <= 200) {
          tips.push({
            type: 'success',
            icon: 'check-circle',
            text: `语速适中（${rate}音节/分钟），节奏把握很好！`,
            priority: 1
          })
        }
      }
      
      // 音调变化建议
      const pitchVar = this.pitchVariation
      if (pitchVar > 0) {
        if (pitchVar < 20) {
          tips.push({
            type: 'info',
            icon: 'chart-line',
            text: '语调变化较小，可以增加抑扬顿挫让表达更有感染力',
            priority: 2
          })
        } else if (pitchVar > 80) {
          tips.push({
            type: 'info',
            icon: 'chart-line',
            text: '语调变化丰富，表现力强！',
            priority: 1
          })
        }
      }
      
      // 频率分布建议
      const freqs = this.frequencyBands
      const midFreqRatio = freqs[2]?.value || 0
      if (midFreqRatio < 30) {
        tips.push({
          type: 'info',
          icon: 'microphone',
          text: '中频能量偏低，建议调整麦克风位置或说话方式',
          priority: 2
        })
      }
      
      // 综合评价
      if (score >= 90) {
        tips.push({
          type: 'success',
          icon: 'trophy',
          text: '音频质量优秀，各项指标都很出色！',
          priority: 1
        })
      } else if (score >= 80) {
        tips.push({
          type: 'success',
          icon: 'thumbs-up',
          text: '音频质量良好，继续保持！',
          priority: 1
        })
      } else if (score < 60) {
        tips.push({
          type: 'warning',
          icon: 'exclamation-triangle',
          text: '音频质量需要改进，请参考上述建议进行调整',
          priority: 3
        })
      }
      
      // 按优先级排序
      return tips.sort((a, b) => b.priority - a.priority)
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
      
      let lastSpeechState = false
      let speechStartTime = 0
      
      const analyze = () => {
        if (!this.isAnalyzing) return
        
        this.analyser.getByteFrequencyData(dataArray)
        this.analyser.getByteTimeDomainData(timeArray)
        
        // 计算音量
        const volume = this.calculateVolume(timeArray)
        
        // 计算能量
        const energy = this.calculateEnergy(dataArray)
        this.energyLevels.push(energy)
        
        // 检测音调
        const pitch = this.detectPitch(timeArray)
        if (pitch > 0) {
          this.pitchValues.push(pitch)
        }
        
        // 检测语音片段
        const isSpeech = volume > -40 && energy > 10
        if (isSpeech && !lastSpeechState) {
          speechStartTime = this.videoElement.currentTime
        } else if (!isSpeech && lastSpeechState) {
          const duration = this.videoElement.currentTime - speechStartTime
          if (duration > 0.2) { // 只记录超过0.2秒的片段
            this.speechSegments.push({
              start: speechStartTime,
              end: this.videoElement.currentTime,
              duration: duration
            })
          }
        }
        lastSpeechState = isSpeech
        
        // 记录分析结果
        this.audioResults.push({
          timestamp: this.videoElement.currentTime,
          volume: volume,
          frequencies: Array.from(dataArray),
          energy: energy,
          pitch: pitch
        })
        
        // 更新进度
        if (this.videoElement.duration > 0) {
          this.progress = Math.round((this.videoElement.currentTime / this.videoElement.duration) * 100)
        }
        
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
    
    calculateEnergy(dataArray) {
      // 计算频谱能量
      let totalEnergy = 0
      for (let i = 0; i < dataArray.length; i++) {
        totalEnergy += dataArray[i]
      }
      return totalEnergy / dataArray.length
    },
    
    detectPitch(timeArray) {
      // 使用自相关法检测基频
      const sampleRate = this.audioContext.sampleRate
      const size = timeArray.length
      let maxCorrelation = 0
      let bestOffset = -1
      
      // 搜索范围：80Hz-400Hz（对应人声范围）
      const minPeriod = Math.floor(sampleRate / 400)
      const maxPeriod = Math.floor(sampleRate / 80)
      
      for (let offset = minPeriod; offset < Math.min(maxPeriod, size / 2); offset++) {
        let correlation = 0
        for (let i = 0; i < size - offset; i++) {
          const val1 = (timeArray[i] - 128) / 128
          const val2 = (timeArray[i + offset] - 128) / 128
          correlation += val1 * val2
        }
        
        if (correlation > maxCorrelation) {
          maxCorrelation = correlation
          bestOffset = offset
        }
      }
      
      // 如果相关性太低，说明没有明显的音调
      if (maxCorrelation < 0.1) {
        return 0
      }
      
      // 计算频率
      const frequency = sampleRate / bestOffset
      return Math.round(frequency)
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
      this.progress = 100
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
          silenceDuration: this.silenceDuration,
          speechRate: this.speechRate,
          pitchVariation: this.pitchVariation,
          audioQualityScore: this.audioQualityScore,
          qualityLevel: this.qualityLevel,
          speechSegments: this.speechSegments,
          tips: this.audioTips
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
  padding: 0;
}

.analyzing-state {
  text-align: center;
  padding: 20px;
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

.progress-bar {
  width: 100%;
  max-width: 300px;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  margin: 15px auto 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #9b59b6, #8e44ad);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
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
  padding: 10px;
}

.quality-score-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
  border-radius: 12px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.score-circle {
  width: 80px;
  height: 80px;
  border: 4px solid #9b59b6;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: white;
  box-shadow: 0 2px 8px rgba(155, 89, 182, 0.2);
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

.quality-info {
  flex: 1;
}

.quality-level {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 6px;
}

.quality-level i {
  font-size: 20px;
}

.quality-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.audio-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.summary-card {
  flex: 1;
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
  padding: 12px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(155, 89, 182, 0.1);
}

.summary-card i {
  font-size: 20px;
  color: #9b59b6;
}

.summary-card h4 {
  margin: 0 0 4px 0;
  font-size: 11px;
  color: #666;
  font-weight: 500;
}

.summary-card .score {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.audio-details {
  margin-bottom: 16px;
}

.audio-details h4 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.audio-details h4 i {
  font-size: 14px;
  color: #9b59b6;
}

.frequency-bars {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 100px;
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #e9ecef;
}

.frequency-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 50px;
}

.freq-label {
  font-size: 9px;
  color: #666;
  transform: rotate(-45deg);
  white-space: nowrap;
  margin-bottom: 4px;
}

.freq-bar {
  width: 18px;
  height: 60px;
  background: #e9ecef;
  border-radius: 3px;
  position: relative;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(180deg, #9b59b6, #8e44ad);
  border-radius: 3px;
  position: absolute;
  bottom: 0;
  transition: height 0.3s ease;
}

.freq-value {
  font-size: 9px;
  color: #2c3e50;
  font-weight: 600;
}

.volume-timeline {
  margin-bottom: 16px;
  padding: 12px;
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
  border-radius: 10px;
  border: 1px solid #e9ecef;
}

.volume-timeline h4 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.volume-timeline h4 i {
  font-size: 14px;
  color: #9b59b6;
}

.timeline-chart {
  margin-bottom: 12px;
  text-align: center;
}

.timeline-chart canvas {
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: white;
}

.timeline-stats {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.timeline-stats p {
  margin: 0;
  font-size: 11px;
  color: #666;
}

.recommendations {
  margin-top: 0;
  padding: 0;
  background: transparent;
}

.recommendations h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.recommendations h4 i {
  font-size: 14px;
  color: #FFC107;
}

.recommendations ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.recommendations li {
  margin-bottom: 8px;
  padding: 10px 12px;
  font-size: 12px;
  color: #555;
  line-height: 1.4;
  background: white;
  border-left: 3px solid #9b59b6;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.recommendations li i {
  flex-shrink: 0;
  font-size: 14px;
}

.recommendations li:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* 不同类型的提示样式 */
.tip-success {
  border-left-color: #4CAF50;
  background: linear-gradient(135deg, #f1f8f4 0%, #ffffff 100%);
}

.tip-success i {
  color: #4CAF50;
}

.tip-warning {
  border-left-color: #FF9800;
  background: linear-gradient(135deg, #fff8f1 0%, #ffffff 100%);
}

.tip-warning i {
  color: #FF9800;
}

.tip-info {
  border-left-color: #2196F3;
  background: linear-gradient(135deg, #f1f7ff 0%, #ffffff 100%);
}

.tip-info i {
  color: #2196F3;
}

.analysis-time {
  text-align: center;
  margin-top: 12px;
  color: #999;
  font-size: 11px;
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