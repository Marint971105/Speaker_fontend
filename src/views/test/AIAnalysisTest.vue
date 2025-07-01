<template>
  <div class="ai-analysis-page">
    <!-- 导航栏显示流程 -->
    <div class="process-nav">
      <div class="nav-step" @click="goToRecord">
        <div class="step-number">1</div>
        <span>录制视频</span>
      </div>
      <div class="nav-arrow">→</div>
      <div class="nav-step active">
        <div class="step-number">2</div>
        <span>AI分析</span>
      </div>
    </div>

    <!-- 视频选择区域 -->
    <div v-if="!selectedVideo" class="video-selection">
      <div class="selection-header">
        <h2>选择要分析的视频</h2>
        <p>请选择一个已录制的视频进行AI智能分析</p>
        <button @click="refreshRecordings" class="refresh-btn" :disabled="refreshing">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': refreshing }"></i>
          {{ refreshing ? '刷新中...' : '刷新列表' }}
        </button>
      </div>
      
      <div class="video-list" v-if="recordings.length > 0">
        <div 
          v-for="(recording, index) in recordings" 
          :key="index"
          class="video-item"
          @click="selectVideo(recording)"
        >
          <div class="video-preview">
            <video :src="recording.url" muted></video>
            <div class="play-overlay">
              <i class="fas fa-play"></i>
            </div>
          </div>
          <div class="video-info">
            <h3>录制视频 {{ index + 1 }}</h3>
            <p>{{ formatDate(recording.timestamp) }}</p>
            <span class="video-size">{{ formatSize(recording.size) }}</span>
          </div>
        </div>
      </div>
      
      <div v-else class="no-videos">
        <i class="fas fa-video-slash"></i>
        <h3>暂无录制视频</h3>
        <p>请先录制视频，然后返回进行分析</p>
        <button @click="goToRecord" class="record-btn">
          <i class="fas fa-video"></i>
          去录制视频
        </button>
      </div>
    </div>

    <!-- 视频分析界面 - 上下布局 -->
    <div v-else class="video-analysis-interface">
      <!-- 顶部视频播放器区域 -->
      <div class="video-section">
        <div class="video-header">
          <h2>📹 {{ selectedVideo.filename }}</h2>
          <div class="video-actions">
            <button @click="changeVideo" class="change-video-btn">
              <i class="fas fa-exchange-alt"></i>
              更换视频
            </button>
            <button @click="startAllAnalysis" class="start-analysis-btn" :disabled="isAnalyzing">
              <i class="fas fa-play" v-if="!isAnalyzing"></i>
              <i class="fas fa-spinner fa-spin" v-else></i>
              {{ isAnalyzing ? '分析中...' : '开始全部分析' }}
            </button>
          </div>
        </div>
        
        <div class="video-player">
          <video 
            :src="selectedVideo.url" 
            controls 
            ref="videoPlayer"
            @loadedmetadata="onVideoLoaded"
          ></video>
          <div class="video-info">
            <span><i class="fas fa-clock"></i> {{ formatDate(selectedVideo.timestamp) }}</span>
            <span><i class="fas fa-file-video"></i> {{ formatSize(selectedVideo.size) }}</span>
          </div>
        </div>
      </div>

      <!-- 底部分析结果区域 -->
      <div class="analysis-results-section">
        <div class="section-header">
          <h3>🧠 AI智能分析结果</h3>
          <p>基于选中视频的多维度智能分析结果</p>
        </div>

        <!-- 四个分析结果并排显示 -->
        <div class="analysis-results-grid">
          <!-- 姿态分析结果 -->
          <div class="analysis-result-card">
            <div class="card-header">
              <div class="card-title">
                <i class="fas fa-user-friends"></i>
                <h4>姿态分析</h4>
              </div>
              <div class="analysis-status" :class="getStatusClass('posture')">
                <span v-if="analysisStatus.posture === 'idle'">
                  <i class="fas fa-clock"></i> 等待分析
                </span>
                <span v-else-if="analysisStatus.posture === 'running'">
                  <i class="fas fa-spinner fa-spin"></i> 分析中
                </span>
                <span v-else-if="analysisStatus.posture === 'completed'">
                  <i class="fas fa-check-circle"></i> 分析完成
                </span>
              </div>
            </div>
            <div class="card-content">
              <div v-if="analysisStatus.posture === 'idle'" class="placeholder-content">
                <i class="fas fa-user-friends placeholder-icon"></i>
                <p>身体姿态和动作分析</p>
                <button @click="startPostureAnalysis" class="start-btn">
                  <i class="fas fa-play"></i> 开始分析
                </button>
              </div>
              <div v-else class="result-content">
                <!-- 使用独立的姿态分析组件 -->
                <PostureAnalysis 
                  v-if="showPostureAnalysis"
                  :videoUrl="selectedVideo.url"
                  :autoStart="true"
                  @analysisComplete="onPostureAnalysisComplete"
                />
              </div>
            </div>
          </div>

          <!-- 表情分析结果 -->
          <div class="analysis-result-card">
            <div class="card-header">
              <div class="card-title">
                <i class="fas fa-smile"></i>
                <h4>表情分析</h4>
              </div>
              <div class="analysis-status" :class="getStatusClass('emotion')">
                <span v-if="analysisStatus.emotion === 'idle'">
                  <i class="fas fa-clock"></i> 等待分析
                </span>
                <span v-else-if="analysisStatus.emotion === 'running'">
                  <i class="fas fa-spinner fa-spin"></i> 分析中
                </span>
                <span v-else-if="analysisStatus.emotion === 'completed'">
                  <i class="fas fa-check-circle"></i> 分析完成
                </span>
              </div>
            </div>
            <div class="card-content">
              <div v-if="analysisStatus.emotion === 'idle'" class="placeholder-content">
                <i class="fas fa-smile placeholder-icon"></i>
                <p>面部表情识别分析</p>
                <button @click="startEmotionAnalysis" class="start-btn">
                  <i class="fas fa-play"></i> 开始分析
                </button>
              </div>
              <div v-else class="result-content">
                <!-- 使用独立的表情分析组件 -->
                <EmotionAnalysis 
                  v-if="showEmotionAnalysis"
                  :videoUrl="selectedVideo.url"
                  :autoStart="true"
                  @analysisComplete="onEmotionAnalysisComplete"
                />
              </div>
            </div>
          </div>

          <!-- 焦虑分析结果 -->
          <div class="analysis-result-card">
            <div class="card-header">
              <div class="card-title">
                <i class="fas fa-brain"></i>
                <h4>焦虑分析</h4>
              </div>
              <div class="analysis-status" :class="getStatusClass('anxiety')">
                <span v-if="analysisStatus.anxiety === 'idle'">
                  <i class="fas fa-clock"></i> 等待分析
                </span>
                <span v-else-if="analysisStatus.anxiety === 'running'">
                  <i class="fas fa-spinner fa-spin"></i> 分析中
                </span>
                <span v-else-if="analysisStatus.anxiety === 'completed'">
                  <i class="fas fa-check-circle"></i> 分析完成
                </span>
              </div>
            </div>
            <div class="card-content">
              <div v-if="analysisStatus.anxiety === 'idle'" class="placeholder-content">
                <i class="fas fa-brain placeholder-icon"></i>
                <p>心理状态评估分析</p>
                <button @click="startAnxietyAnalysis" class="start-btn">
                  <i class="fas fa-play"></i> 开始分析
                </button>
              </div>
              <div v-else class="result-content">
                <!-- 使用独立的焦虑分析组件 -->
                <AnxietyAnalysis 
                  v-if="showAnxietyAnalysis"
                  :videoUrl="selectedVideo.url"
                  :autoStart="true"
                  @analysisComplete="onAnxietyAnalysisComplete"
                />
              </div>
            </div>
          </div>

          <!-- 音频分析结果 -->
          <div class="analysis-result-card">
            <div class="card-header">
              <div class="card-title">
                <i class="fas fa-volume-up"></i>
                <h4>音频分析</h4>
              </div>
              <div class="analysis-status" :class="getStatusClass('audio')">
                <span v-if="analysisStatus.audio === 'idle'">
                  <i class="fas fa-clock"></i> 等待分析
                </span>
                <span v-else-if="analysisStatus.audio === 'running'">
                  <i class="fas fa-spinner fa-spin"></i> 分析中
                </span>
                <span v-else-if="analysisStatus.audio === 'completed'">
                  <i class="fas fa-check-circle"></i> 分析完成
                </span>
              </div>
            </div>
            <div class="card-content">
              <div v-if="analysisStatus.audio === 'idle'" class="placeholder-content">
                <i class="fas fa-volume-up placeholder-icon"></i>
                <p>语音和音频特征分析</p>
                <button @click="startAudioAnalysis" class="start-btn">
                  <i class="fas fa-play"></i> 开始分析
                </button>
              </div>
              <div v-else class="result-content">
                <!-- 使用独立的音频分析组件 -->
                <AudioAnalysis 
                  v-if="showAudioAnalysis"
                  :videoUrl="selectedVideo.url"
                  :autoStart="true"
                  @analysisComplete="onAudioAnalysisComplete"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 导入独立的分析组件
import PostureAnalysis from '@/components/analysis/PostureAnalysis.vue'
import EmotionAnalysis from '@/components/analysis/EmotionAnalysis.vue'
import AnxietyAnalysis from '@/components/analysis/AnxietyAnalysis.vue'
import AudioAnalysis from '@/components/analysis/AudioAnalysis.vue'

export default {
  name: 'AIAnalysis',
  components: {
    PostureAnalysis,
    EmotionAnalysis,
    AnxietyAnalysis,
    AudioAnalysis
  },
  data() {
    return {
      recordings: [],
      selectedVideo: null,
      refreshTimer: null,
      isAnalyzing: false, // 是否正在进行全部分析
      analysisStatus: {
        posture: 'idle', // idle, running, completed
        emotion: 'idle',
        anxiety: 'idle',
        audio: 'idle'
      },
      analysisResults: {
        posture: null,
        emotion: null,
        anxiety: null,
        audio: null
      },
      // 控制组件显示的变量
      showPostureAnalysis: false,
      showEmotionAnalysis: false,
      showAnxietyAnalysis: false,
      showAudioAnalysis: false,
      videoLoadLogged: false,
      refreshing: false
    }
  },
  mounted() {
    // 初始加载录制列表
    this.loadRecordings()
  },
  
  beforeDestroy() {
    // 清理定时器（如果有的话）
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
    }
    this.stopAllAnalysis()
  },
  methods: {
    loadRecordings() {
      try {
        const saved = localStorage.getItem('video_recordings')
        
        if (saved) {
          const recordings = JSON.parse(saved)
          this.recordings = recordings
          console.log('加载了', recordings.length, '个录制视频')
        } else {
          this.recordings = []
          console.log('没有找到录制视频')
        }
      } catch (error) {
        console.error('加载录制历史失败:', error)
        this.recordings = []
      }
    },
    
    selectVideo(recording) {
      this.selectedVideo = recording
      // 重置分析状态
      this.resetAnalysisState()
    },
    
    changeVideo() {
      this.selectedVideo = null
      this.resetAnalysisState()
    },
    
    resetAnalysisState() {
      this.analysisStatus = {
        posture: 'idle',
        emotion: 'idle',
        anxiety: 'idle',
        audio: 'idle'
      }
      this.analysisResults = {
        posture: null,
        emotion: null,
        anxiety: null,
        audio: null
      }
      this.showPostureAnalysis = false
      this.showEmotionAnalysis = false
      this.showAnxietyAnalysis = false
      this.showAudioAnalysis = false
      this.isAnalyzing = false
      this.videoLoadLogged = false
    },
    
    goToRecord() {
      this.$router.push('/video/record')
    },
    
    onVideoLoaded() {
      // 视频加载完成，只记录一次
      if (!this.videoLoadLogged) {
        console.log('视频已加载，准备进行分析')
        this.videoLoadLogged = true
      }
    },
    
    formatDate(timestamp) {
      return new Date(timestamp).toLocaleString('zh-CN')
    },
    
    formatSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    // 开始姿态分析
    startPostureAnalysis() {
      this.analysisStatus.posture = 'running'
      this.showPostureAnalysis = true
      console.log('开始姿态分析')
    },

    // 开始表情分析  
    startEmotionAnalysis() {
      this.analysisStatus.emotion = 'running'
      this.showEmotionAnalysis = true
      console.log('开始表情分析')
    },

    // 开始焦虑分析
    startAnxietyAnalysis() {
      this.analysisStatus.anxiety = 'running'
      this.showAnxietyAnalysis = true
      console.log('开始焦虑分析')
    },

    // 开始音频分析
    startAudioAnalysis() {
      this.analysisStatus.audio = 'running'
      this.showAudioAnalysis = true
      console.log('开始音频分析')
    },

    // 开始所有分析
    startAllAnalysis() {
      if (this.isAnalyzing) return
      
      this.isAnalyzing = true
      console.log('开始全部分析')
      
      // 依次启动各个分析
      this.startPostureAnalysis()
      this.startEmotionAnalysis()
      this.startAnxietyAnalysis()
      this.startAudioAnalysis()
    },

    // 停止所有分析
    stopAllAnalysis() {
      this.isAnalyzing = false
      this.showPostureAnalysis = false
      this.showEmotionAnalysis = false
      this.showAnxietyAnalysis = false
      this.showAudioAnalysis = false
      
      // 重置所有分析状态
      Object.keys(this.analysisStatus).forEach(key => {
        this.analysisStatus[key] = 'idle'
      })
      
      console.log('停止所有分析')
    },

    // 分析完成的回调函数
    onPostureAnalysisComplete(result) {
      this.analysisResults.posture = result
      this.analysisStatus.posture = 'completed'
      console.log('姿态分析完成:', result)
    },
    
    onEmotionAnalysisComplete(result) {
      this.analysisResults.emotion = result
      this.analysisStatus.emotion = 'completed'
      console.log('表情分析完成:', result)
    },
    
    onAnxietyAnalysisComplete(result) {
      this.analysisResults.anxiety = result
      this.analysisStatus.anxiety = 'completed'
      console.log('焦虑分析完成:', result)
    },
    
    onAudioAnalysisComplete(result) {
      this.analysisResults.audio = result
      this.analysisStatus.audio = 'completed'
      console.log('音频分析完成:', result)
    },

    // 获取分析状态的样式类
    getStatusClass(type) {
      const status = this.analysisStatus[type]
      return {
        'status-idle': status === 'idle',
        'status-running': status === 'running',
        'status-completed': status === 'completed'
      }
    },

    refreshRecordings() {
      this.refreshing = true
      this.loadRecordings()
      setTimeout(() => {
        this.refreshing = false
      }, 1000)
    }
  }
}
</script>

<style scoped>
.ai-analysis-page {
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

/* 视频选择区域 */
.video-selection {
  max-width: 1000px;
  margin: 0 auto;
}

.selection-header {
  text-align: center;
  margin-bottom: 40px;
  color: white;
}

.selection-header h2 {
  font-size: 2.2rem;
  margin-bottom: 10px;
  color: #fff;
  font-weight: 600;
}

.selection-header p {
  font-size: 1.1rem;
  opacity: 0.9;
  margin-bottom: 20px;
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.video-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.video-item {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.video-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.video-preview {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.video-preview video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  opacity: 0.8;
  transition: all 0.3s ease;
}

.video-item:hover .play-overlay {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.1);
}

.video-info {
  padding: 15px;
}

.video-info h3 {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
  color: #333;
}

.video-info p {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 0.9rem;
}

.video-size {
  background: #f0f0f0;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
  color: #666;
}

/* 无视频状态 */
.no-videos {
  text-align: center;
  color: white;
  padding: 60px 20px;
}

.no-videos i {
  font-size: 4rem;
  opacity: 0.5;
  margin-bottom: 20px;
}

.no-videos h3 {
  font-size: 1.5rem;
  margin: 0 0 10px 0;
}

.no-videos p {
  opacity: 0.8;
  margin: 0 0 30px 0;
}

.record-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 15px 30px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
}

.record-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
}

/* 视频分析界面 - 上下布局 */
.video-analysis-interface {
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 30px;
  min-height: 90vh;
}

/* 顶部视频播放器区域 */
.video-section {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
}

.video-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.video-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 700;
  flex: 1;
}

.video-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

.change-video-btn,
.start-analysis-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.change-video-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.change-video-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.start-analysis-btn {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
}

.start-analysis-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4);
}

.start-analysis-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.video-player {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.video-player video {
  width: 100%;
  max-width: 900px;
  aspect-ratio: 16/9;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  margin-bottom: 15px;
}

.video-info {
  display: flex;
  gap: 30px;
  color: #7f8c8d;
  font-size: 14px;
}

.video-info span {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 底部分析结果区域 */
.analysis-results-section {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
}

.section-header {
  text-align: center;
  margin-bottom: 30px;
}

.section-header h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 1.4rem;
  font-weight: 700;
}

.section-header p {
  margin: 0;
  color: #7f8c8d;
  font-size: 15px;
}

/* 四个分析结果网格 */
.analysis-results-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 25px;
}

.analysis-result-card {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 15px;
  overflow: hidden;
  transition: all 0.3s ease;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.analysis-result-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.card-header {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-title i {
  font-size: 1.5rem;
}

.card-title h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.analysis-status {
  font-size: 12px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.2);
}

.analysis-status.status-idle {
  background: rgba(149, 165, 166, 0.2);
}

.analysis-status.status-running {
  background: rgba(243, 156, 18, 0.2);
  animation: pulse 1.5s infinite;
}

.analysis-status.status-completed {
  background: rgba(39, 174, 96, 0.2);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.card-content {
  flex: 1;
  padding: 25px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.placeholder-icon {
  font-size: 3rem;
  color: #bdc3c7;
}

.placeholder-content p {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
  line-height: 1.5;
}

.start-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-animation {
  font-size: 2.5rem;
  color: #f39c12;
}

.loading-content p {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

.result-content {
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .video-analysis-interface {
    max-width: 1200px;
    gap: 25px;
  }
  
  .analysis-results-grid {
    gap: 20px;
  }
}

@media (max-width: 1300px) {
  .analysis-results-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (max-width: 1024px) {
  .video-analysis-interface {
    gap: 20px;
    padding: 0 15px;
  }
  
  .video-section,
  .analysis-results-section {
    padding: 25px;
  }
  
  .video-header h2 {
    font-size: 1.3rem;
  }
  
  .video-player video {
    max-width: 700px;
  }
  
  .analysis-results-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .analysis-result-card {
    min-height: 350px;
  }
}

@media (max-width: 768px) {
  .ai-analysis-page {
    padding: 10px;
  }
  
  .video-analysis-interface {
    gap: 20px;
    padding: 0 10px;
  }
  
  .video-section,
  .analysis-results-section {
    padding: 20px;
    border-radius: 15px;
  }
  
  .video-header {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .video-header h2 {
    font-size: 1.2rem;
    text-align: center;
  }
  
  .video-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .change-video-btn,
  .start-analysis-btn {
    padding: 8px 16px;
    font-size: 13px;
  }
  
  .video-player video {
    max-width: 100%;
  }
  
  .video-info {
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }
  
  .section-header h3 {
    font-size: 1.2rem;
  }
  
  .analysis-result-card {
    min-height: 300px;
  }
  
  .card-header {
    padding: 15px;
  }
  
  .card-title h4 {
    font-size: 1rem;
  }
  
  .card-content {
    padding: 20px;
  }
  
  .placeholder-icon {
    font-size: 2.5rem;
  }
  
  .process-nav {
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .nav-arrow {
    font-size: 1.2rem;
  }
  
  .video-list {
    grid-template-columns: 1fr;
  }
  
  .selection-header h2 {
    font-size: 1.3rem;
  }
}
</style> 