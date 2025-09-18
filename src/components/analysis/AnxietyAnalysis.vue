<template>
  <div class="anxiety-analysis">
    <!-- 分析中状态 -->
    <div v-if="isAnalyzing" class="analyzing-state">
      <div class="loading-spinner"></div>
      <p>正在分析焦虑程度...</p>
      <div class="progress-bar">
        <div class="progress" :style="{width: `${analysisProgress}%`}"></div>
      </div>
      <div class="progress-text">{{ analysisProgress }}%</div>
    </div>
    
    <!-- 分析结果 -->
    <div v-else-if="anxietyResult && !anxietyResult.error" class="result-display">
      <div class="score-display">
        <div class="score-circle" :class="anxietyLevelClass">
          <span class="score-value">{{ formattedScore }}</span>
          <span class="score-label">焦虑指数</span>
        </div>
        <div class="score-info">
          <div class="anxiety-level">
            <span class="level-badge" :class="anxietyLevelClass">
              {{ anxietyLevelText }}
            </span>
          </div>
          <p class="description">{{ anxietyDescription }}</p>
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
      
      <div class="analysis-time">
        <small>分析时间: {{ analysisTime }}</small>
      </div>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="anxietyResult && anxietyResult.error" class="error-result">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ anxietyResult.message }}</p>
      <button @click="retryAnalysis" class="btn btn-retry">重试分析</button>
    </div>
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <i class="fas fa-brain"></i>
      <p>等待开始焦虑分析</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'AnxietyAnalysis',
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
    console.log('🔍 [DEBUG] AnxietyAnalysis data() 开始初始化')
    console.log('🔍 [DEBUG] 当前环境:', process.env.NODE_ENV)
    console.log('🔍 [DEBUG] 所有环境变量:', {
      NODE_ENV: process.env.NODE_ENV,
      VUE_APP_ANALYSIS_API: process.env.VUE_APP_ANALYSIS_API,
      BASE_URL: process.env.BASE_URL,
      VUE_APP_BASE_URL: process.env.VUE_APP_BASE_URL
    })
    
    const apiBaseUrl = process.env.VUE_APP_ANALYSIS_API || '/analysis-api'
    console.log('🔍 [DEBUG] AnxietyAnalysis 计算得到的 apiBaseUrl:', apiBaseUrl)
    console.log('🔍 [DEBUG] AnxietyAnalysis apiBaseUrl 类型:', typeof apiBaseUrl)
    console.log('🔍 [DEBUG] AnxietyAnalysis 当前页面 URL:', window.location.href)
    
    return {
      isAnalyzing: false,
      analysisProgress: 0,
      anxietyResult: null,
      analysisTime: '',
      // apiBaseUrl: 'http://10.120.48.67:8000'
      apiBaseUrl: apiBaseUrl
    }
  },
  computed: {
    formattedScore() {
      if (!this.anxietyResult) return '0';
      return parseFloat(JSON.parse(this.anxietyResult.score100)[0]).toFixed(0);
    },
    anxietyLevelClass() {
      if (!this.anxietyResult) return '';
      const categoryStr = this.anxietyResult.category;
      let category;
      try {
        const parsedArray = JSON.parse(categoryStr);
        category = Array.isArray(parsedArray) ? parsedArray[0] : parseInt(categoryStr);
      } catch (e) {
        category = parseInt(categoryStr);
      }
      
      if (isNaN(category)) return '';
      
      if (category <= 1) return 'level-high';
      if (category <= 3) return 'level-medium';
      return 'level-low';
    },
    anxietyLevelText() {
      if (!this.anxietyResult) return '未知';
      const categoryStr = this.anxietyResult.category;
      let category;
      try {
        const parsedArray = JSON.parse(categoryStr);
        category = Array.isArray(parsedArray) ? parsedArray[0] : parseInt(categoryStr);
      } catch (e) {
        category = parseInt(categoryStr);
      }
      
      if (isNaN(category)) return '未知';
      
      const levels = ['重度焦虑', '中度偏重焦虑', '中度焦虑', '轻度偏中焦虑', '轻度焦虑', '不焦虑'];
      return levels[category] || '未知';
    },
    anxietyDescription() {
      if (!this.anxietyResult) return '';
      const categoryStr = this.anxietyResult.category;
      let category;
      try {
        const parsedArray = JSON.parse(categoryStr);
        category = Array.isArray(parsedArray) ? parsedArray[0] : parseInt(categoryStr);
      } catch (e) {
        category = parseInt(categoryStr);
      }
      
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
      const categoryStr = this.anxietyResult.category;
      let category;
      try {
        const parsedArray = JSON.parse(categoryStr);
        category = Array.isArray(parsedArray) ? parsedArray[0] : parseInt(categoryStr);
      } catch (e) {
        category = parseInt(categoryStr);
      }
      
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
    console.log('🔍 [DEBUG] AnxietyAnalysis mounted() 开始')
    console.log('🔍 [DEBUG] AnxietyAnalysis mounted() 时的 apiBaseUrl:', this.apiBaseUrl)
    console.log('🔍 [DEBUG] AnxietyAnalysis mounted() 时的环境变量:', {
      VUE_APP_ANALYSIS_API: process.env.VUE_APP_ANALYSIS_API,
      NODE_ENV: process.env.NODE_ENV
    })
    console.log('🔍 [DEBUG] AnxietyAnalysis mounted() 时的当前页面:', window.location.href)
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
      console.log('🔍 [DEBUG] AnxietyAnalysis startAnalysis() 开始')
      console.log('🔍 [DEBUG] AnxietyAnalysis startAnalysis() 时的 apiBaseUrl:', this.apiBaseUrl)
      console.log('🔍 [DEBUG] AnxietyAnalysis startAnalysis() 时的环境变量:', {
        VUE_APP_ANALYSIS_API: process.env.VUE_APP_ANALYSIS_API,
        NODE_ENV: process.env.NODE_ENV
      })
      console.log('🔍 [DEBUG] AnxietyAnalysis startAnalysis() 时的参数:', {
        videoUrl: this.videoUrl,
        isAnalyzing: this.isAnalyzing
      })
      
      if (!this.videoUrl || this.isAnalyzing) return
      
      this.isAnalyzing = true
      this.analysisProgress = 0
      this.anxietyResult = null
      
      try {
        // 模拟进度
        this.startProgressSimulation()
        
        // 获取视频blob
        const response = await fetch(this.videoUrl)
        const videoBlob = await response.blob()
        
        // 如果是WebM格式，转换为MP4
        let videoFileForAPI = videoBlob
        if (videoBlob.type.includes('webm')) {
          videoFileForAPI = new File([videoBlob], 'video.mp4', { type: 'video/mp4' })
        }
        
        // 上传视频
        console.log('🔍 [DEBUG] AnxietyAnalysis 构建上传URL前的 apiBaseUrl:', this.apiBaseUrl)
        const uploadUrl = `${this.apiBaseUrl}/upload`
        console.log('🔍 [DEBUG] AnxietyAnalysis 构建的上传URL:', uploadUrl)
        console.log('🔍 [DEBUG] AnxietyAnalysis 上传URL是否包含IP:', uploadUrl.includes('10.120.48.67'))
        console.log('🔍 [DEBUG] AnxietyAnalysis 上传URL是否包含analysis-api:', uploadUrl.includes('analysis-api'))
        
        const uploadResponse = await axios.post(
          uploadUrl, 
          videoFileForAPI,
          {
            headers: {
              'Content-Type': videoFileForAPI.type
            }
          }
        )
        
        if (uploadResponse.data.code !== 0) {
          throw new Error(`上传失败: ${uploadResponse.data.error_message || '未知错误'}`)
        }
        
        const videoId = uploadResponse.data.video_id
        this.analysisProgress = 50
        
        // 获取分析结果
        let detectionResponse
        let retryCount = 0
        const maxRetries = 6
        
        while (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          detectionResponse = await axios.get(
            `${this.apiBaseUrl}/detection?video_id=${videoId}`
          )
          
          if (detectionResponse.data.code === 0 && detectionResponse.data.status === "finished") {
            this.analysisProgress = 100
            break
          }
          
          this.analysisProgress = 50 + ((retryCount + 1) / maxRetries) * 40
          retryCount++
        }
        
        if (!detectionResponse || detectionResponse.data.code !== 0) {
          throw new Error('获取分析结果失败')
        }
        
        this.anxietyResult = {
          score100: detectionResponse.data.score100,
          category: detectionResponse.data.category
        }
        
        this.analysisTime = new Date().toLocaleString()
        
        // 触发分析完成事件
        this.$emit('analysisComplete', {
          type: 'anxiety',
          result: this.anxietyResult,
          timestamp: this.analysisTime
        })
        
      } catch (error) {
        console.error('焦虑分析失败:', error)
        this.anxietyResult = {
          error: true,
          message: error.message || '分析失败，请重试'
        }
        
        // 触发分析错误事件
        this.$emit('analysisComplete', {
          type: 'anxiety',
          result: this.anxietyResult,
          error: true
        })
      } finally {
        this.isAnalyzing = false
      }
    },
    
    retryAnalysis() {
      this.startAnalysis()
    },
    
    startProgressSimulation() {
      let progress = 0
      const interval = setInterval(() => {
        if (!this.isAnalyzing) {
          clearInterval(interval)
          return
        }
        
        if (progress < 45) {
          progress += Math.random() * 2
          this.analysisProgress = Math.min(progress, 45)
        } else {
          clearInterval(interval)
        }
      }, 300)
    }
  }
}
</script>

<style scoped>
.anxiety-analysis {
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
  border-top: 4px solid #f39c12;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.progress-bar {
  width: 200px;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  margin: 15px auto 10px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #f39c12, #e67e22);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #666;
}

.result-display {
  width: 100%;
  max-width: 400px;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.score-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bold;
}

.score-circle.level-high {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.score-circle.level-medium {
  background: linear-gradient(135deg, #f39c12, #e67e22);
}

.score-circle.level-low {
  background: linear-gradient(135deg, #27ae60, #229954);
}

.score-value {
  font-size: 20px;
  line-height: 1;
}

.score-label {
  font-size: 10px;
  margin-top: 2px;
}

.score-info {
  flex: 1;
}

.level-badge {
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.level-badge.level-high {
  background: #e74c3c;
}

.level-badge.level-medium {
  background: #f39c12;
}

.level-badge.level-low {
  background: #27ae60;
}

.description {
  margin: 10px 0 0 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
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

.error-result {
  text-align: center;
  color: #e74c3c;
}

.error-result i {
  font-size: 48px;
  margin-bottom: 15px;
}

.btn-retry {
  margin-top: 15px;
  padding: 8px 16px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-retry:hover {
  background: #c0392b;
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