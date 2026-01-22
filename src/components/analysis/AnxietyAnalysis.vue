<template>
  <div class="anxiety-analysis-content">
    <!-- 分析中状态 -->
    <div v-if="isAnalyzing" class="analyzing-state">
      <div class="analyzing-header">
        <div class="analyzing-icon">
          <i class="fas fa-brain"></i>
        </div>
        <div class="analyzing-text">
          <h3>焦虑分析中</h3>
          <p>正在分析您的演讲表现...</p>
        </div>
      </div>
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{width: analysisProgress + '%'}"></div>
        </div>
        <div class="progress-percentage">{{ analysisProgress }}%</div>
      </div>
    </div>
    
    <!-- 分析结果 -->
    <div v-else-if="anxietyResult && !anxietyResult.error" class="result-display">
      <!-- 简洁的头部信息 -->
      <div class="result-header">
        <div class="header-content">
          <div class="analysis-title">
            <i class="fas fa-brain"></i>
            <h3>焦虑分析</h3>
            <span class="status-indicator">
              <i class="fas fa-check-circle"></i>
              分析完成
            </span>
          </div>
          <div class="confidence-info">
            <span class="confidence-label">置信度</span>
            <span class="confidence-value">{{ anxietyResult.confidence_score ? anxietyResult.confidence_score.toFixed(1) : '0.0' }}%</span>
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="main-content">
        <!-- 分数和状态展示 -->
        <div class="score-display">
          <div class="score-circle" :class="anxietyLevelClass">
            <div class="score-inner">
              <span class="score-value">{{ formattedScore }}</span>
              <span class="score-label">自信指数</span>
            </div>
          </div>
          <div class="status-info">
            <div class="anxiety-level">
              <span class="level-text" :class="anxietyLevelClass">
                {{ anxietyLevelText }}
              </span>
            </div>
            <p class="description">{{ anxietyDescription }}</p>
          </div>
        </div>

        <!-- 建议区域 -->
        <div class="recommendations">
          <div class="recommendations-header">
            <i class="fas fa-lightbulb"></i>
            <h4>个性化建议</h4>
          </div>
          <div class="tips-list">
            <div 
              v-for="(tip, index) in anxietyTips" 
              :key="index"
              class="tip-item"
            >
              {{ tip }}
            </div>
          </div>
        </div>

        <!-- 底部信息 -->
        <div class="analysis-footer">
          <div class="analysis-time">
            <i class="fas fa-clock"></i>
            <span>分析时间: {{ analysisTime }}</span>
          </div>
          <div class="analysis-details">
            <span>处理时间: {{ anxietyResult.processing_time ? anxietyResult.processing_time.toFixed(2) : '0.00' }}s</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="anxietyResult && anxietyResult.error" class="error-result">
      <div class="error-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <div class="error-content">
        <h3>分析失败</h3>
        <p>{{ anxietyResult.message }}</p>
        <button @click="retryAnalysis" class="btn-retry">
          <i class="fas fa-redo"></i>
          重新分析
        </button>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-brain"></i>
      </div>
      <div class="empty-content">
        <h3>等待分析</h3>
        <p>录制视频后开始焦虑分析</p>
      </div>
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
      if (!this.anxietyResult || this.anxietyResult.error) return '0';
      // 使用confidence_score作为显示分数，分数越高代表越自信不焦虑
      return this.anxietyResult.confidence_score ? this.anxietyResult.confidence_score.toFixed(1) : '0';
    },
    anxietyLevelClass() {
      if (!this.anxietyResult || this.anxietyResult.error) return '';
      
      // 根据prediction值判断焦虑等级
      const prediction = this.anxietyResult.prediction;
      
      if (prediction === 0) {
        return 'level-excellent'; // 非常自信
      } else if (prediction === 1) {
        return 'level-good'; // 轻微焦虑
      } else if (prediction === 2) {
        return 'level-medium'; // 中度焦虑
      } else if (prediction === 3) {
        return 'level-warning'; // 较严重焦虑
      } else if (prediction === 4) {
        return 'level-danger'; // 严重焦虑
      } else {
        return 'level-unknown';
      }
    },
    anxietyLevelText() {
      if (!this.anxietyResult || this.anxietyResult.error) return '未知';
      
      // 根据prediction值显示对应的文本
      const prediction = this.anxietyResult.prediction;
      const predictionTexts = {
        0: '非常自信（无焦虑）',
        1: '轻微焦虑',
        2: '中度焦虑',
        3: '较严重焦虑',
        4: '严重焦虑'
      };
      
      return predictionTexts[prediction] || '未知';
    },
    anxietyDescription() {
      if (!this.anxietyResult || this.anxietyResult.error) return '';
      
      const prediction = this.anxietyResult.prediction;
      const confidenceScore = this.anxietyResult.confidence_score;
      
      const descriptions = {
        0: `分析结果显示您在演讲过程中非常自信，完全没有焦虑表现，演讲状态极佳。`,
        1: `分析结果显示您在演讲过程中存在轻微焦虑，整体表现良好，仅有轻微紧张。`,
        2: `分析结果显示您在演讲过程中存在中度焦虑，可能影响部分表现，需要适当调整。`,
        3: `分析结果显示您在演讲过程中存在较严重焦虑，明显影响演讲效果，建议采取改善措施。`,
        4: `分析结果显示您在演讲过程中存在严重焦虑，严重影响演讲表现，需要重点关注和改善。`
      };
      
      return descriptions[prediction] || '分析结果异常，请重试。';
    },
    anxietyTips() {
      if (!this.anxietyResult || this.anxietyResult.error) return [];
      
      const prediction = this.anxietyResult.prediction;
      
      const tipsByLevel = {
        0: [
          '🎉 恭喜！您的演讲状态非常优秀',
          '💡 可以尝试挑战更高难度的演讲内容',
          '🌟 考虑增加与听众的互动环节',
          '📚 可以分享更多个人经验和故事',
          '🎯 尝试在演讲中加入更多创意元素'
        ],
        1: [
          '😌 演讲前进行简单的深呼吸练习',
          '🎵 听一些轻松的音乐缓解紧张',
          '💪 增加演讲彩排次数增强信心',
          '👥 多与朋友练习演讲技巧',
          '🌱 保持积极的心态和自信'
        ],
        2: [
          '🧘 演讲前进行5-10分钟冥想放松',
          '🫁 练习正念呼吸，缓解紧张情绪',
          '😄 可考虑适当的幽默缓解紧张氛围',
          '🏠 提前熟悉演讲环境减少不确定性',
          '⏸️ 演讲中允许自己短暂停顿，不必急于填满每一秒'
        ],
        3: [
          '🆘 建议寻求专业演讲指导',
          '🧠 学习压力管理和放松技巧',
          '📖 阅读演讲技巧相关书籍',
          '🎭 从简单的演讲场景开始练习',
          '💊 考虑咨询心理医生或专业教练',
          '🏃 通过运动释放压力和紧张情绪'
        ],
        4: [
          '🚨 强烈建议寻求专业帮助',
          '👨‍⚕️ 咨询心理医生或专业治疗师',
          '📚 系统学习焦虑管理技巧',
          '🏥 考虑参加焦虑管理课程',
          '🤝 寻找演讲伙伴或支持小组',
          '⏰ 给自己充足的时间来改善',
          '💝 记住：改善需要时间和耐心'
        ]
      };
      
      return tipsByLevel[prediction] || ['请重试分析'];
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
      console.log('🔍 [DEBUG] AnxietyAnalysis startAnalysis() 开始 - 使用新API接口')
      
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
        
        // 创建FormData对象
        const formData = new FormData()
        formData.append('file', videoBlob, 'video.mp4')
        
        console.log('🔍 [DEBUG] AnxietyAnalysis 准备发送视频到新API接口')
        console.log('🔍 [DEBUG] AnxietyAnalysis 视频文件大小:', this.formatFileSize(videoBlob.size))
        console.log('🔍 [DEBUG] AnxietyAnalysis 视频文件类型:', videoBlob.type)
        
        // 使用新的API接口进行焦虑分析
        // 根据环境动态选择API地址
        const isDevelopment = process.env.NODE_ENV === 'development'
        const apiUrl = isDevelopment 
          ? 'http://localhost:5000/api/predict_from_video'
          : `${window.location.origin}/api/anxiety/predict_from_video`
        console.log('🔍 [DEBUG] AnxietyAnalysis 发送请求到:', apiUrl)
        
        const analysisResponse = await axios.post(apiUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 60000 // 60秒超时
        })
        
        console.log('🔍 [DEBUG] AnxietyAnalysis API响应:', analysisResponse.data)
        
        if (!analysisResponse.data.success) {
          throw new Error('API分析失败: ' + (analysisResponse.data.message || '未知错误'))
        }
        
        // 更新进度到100%
        this.analysisProgress = 100
        
        // 处理新的响应格式
        const responseData = analysisResponse.data
        this.anxietyResult = {
          anxiety_level: responseData.anxiety_level,
          confidence_score: responseData.confidence_score,
          processing_time: responseData.processing_time,
          text_extracted: responseData.text_extracted,
          prediction: responseData.prediction,
          probabilities: responseData.probabilities
        }
        
        this.analysisTime = new Date().toLocaleString()
        
        console.log('✅ AnxietyAnalysis 焦虑分析完成:', this.anxietyResult)
        
        // 触发分析完成事件
        this.$emit('analysisComplete', {
          type: 'anxiety',
          result: this.anxietyResult,
          timestamp: this.analysisTime
        })
        
      } catch (error) {
        console.error('❌ AnxietyAnalysis 焦虑分析失败:', error)
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
    
    // 文件大小格式化
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
/* 直接显示内容，无卡片格式 */
.anxiety-analysis-content {
  width: 100%;
  position: relative;
  z-index: 10;
}

/* 分析中状态 */
.analyzing-state {
  padding: 40px;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  margin-bottom: 20px;
}

.analyzing-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 30px;
}

.analyzing-icon {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  animation: pulse 2s infinite;
}

.analyzing-text h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.analyzing-text p {
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 20px;
  justify-content: center;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
  max-width: 300px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-percentage {
  font-size: 18px;
  font-weight: 600;
  min-width: 50px;
}

/* 分析结果 - 适应父容器，无独立卡片 */
.result-display {
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  overflow: visible;
  margin-bottom: 0;
}

/* 移除头部样式，使用父容器的头部 */
.result-header {
  display: none;
}

/* 主要内容区域 */
.main-content {
  padding: 0;
  height: 100%;
}

/* 分数和状态展示 */
.score-display {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px;
  background: transparent;
  height: 100%;
}

.score-circle {
  position: relative;
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.score-circle.level-excellent {
  background: linear-gradient(135deg, #00C851, #00A041);
}

.score-circle.level-good {
  background: linear-gradient(135deg, #4CAF50, #45a049);
}

.score-circle.level-medium {
  background: linear-gradient(135deg, #FF9800, #F57C00);
}

.score-circle.level-warning {
  background: linear-gradient(135deg, #FF5722, #E64A19);
}

.score-circle.level-danger {
  background: linear-gradient(135deg, #F44336, #D32F2F);
}

.score-inner {
  text-align: center;
}

.score-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.score-label {
  display: block;
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.9;
}

.status-info {
  flex: 1;
}

.anxiety-level {
  margin-bottom: 16px;
}

.level-text {
  display: inline-block;
  padding: 10px 20px;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 600;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.level-text.level-excellent {
  background: linear-gradient(135deg, #00C851, #00A041);
}

.level-text.level-good {
  background: linear-gradient(135deg, #4CAF50, #45a049);
}

.level-text.level-medium {
  background: linear-gradient(135deg, #FF9800, #F57C00);
}

.level-text.level-warning {
  background: linear-gradient(135deg, #FF5722, #E64A19);
}

.level-text.level-danger {
  background: linear-gradient(135deg, #F44336, #D32F2F);
}

.description {
  margin: 0;
  color: #555;
  line-height: 1.6;
  font-size: 15px;
  font-weight: 400;
}

/* 建议区域 */
.recommendations {
  background: transparent;
  padding: 0;
  border-top: none;
  margin-top: 16px;
}

.recommendations-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.recommendations-header i {
  color: #FFC107;
  font-size: 14px;
}

.recommendations-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 13px;
  font-weight: 600;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-item {
  background: white;
  padding: 10px 12px;
  border-radius: 8px;
  border-left: 3px solid #4CAF50;
  font-size: 12px;
  line-height: 1.4;
  color: #555;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.tip-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* 底部信息 */
.analysis-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  background: transparent;
  border-top: none;
  color: #666;
  font-size: 11px;
  margin-top: 12px;
}

.analysis-time {
  display: flex;
  align-items: center;
  gap: 8px;
}

.analysis-time i {
  color: #999;
}

.analysis-details {
  color: #999;
}

/* 错误状态 */
.error-result {
  padding: 60px 40px;
  text-align: center;
  background: #fff5f5;
  border-radius: 12px;
}

.error-icon {
  width: 80px;
  height: 80px;
  background: #fee;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  font-size: 32px;
  color: #e74c3c;
}

.error-content h3 {
  margin: 0 0 12px 0;
  color: #e74c3c;
  font-size: 20px;
}

.error-content p {
  margin: 0 0 24px 0;
  color: #666;
  line-height: 1.5;
}

.btn-retry {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-retry:hover {
  background: #c0392b;
  transform: translateY(-1px);
}

/* 空状态 */
.empty-state {
  padding: 60px 40px;
  text-align: center;
  color: #999;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: #f8f9fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  font-size: 32px;
  color: #ccc;
}

.empty-content h3 {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 20px;
}

.empty-content p {
  margin: 0;
  color: #999;
  line-height: 1.5;
}

/* 动画效果 */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .result-header {
    padding: 16px 20px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .analysis-title {
    flex-direction: column;
    gap: 8px;
  }
  
  .status-indicator {
    margin-left: 0;
  }
  
  .score-display {
    flex-direction: column;
    text-align: center;
    gap: 24px;
    padding: 24px 20px;
  }
  
  .score-circle {
    width: 100px;
    height: 100px;
  }
  
  .score-value {
    font-size: 28px;
  }
  
  .recommendations {
    padding: 20px;
  }
  
  .analysis-footer {
    flex-direction: column;
    gap: 12px;
    text-align: center;
    padding: 16px 20px;
  }
}
</style> 