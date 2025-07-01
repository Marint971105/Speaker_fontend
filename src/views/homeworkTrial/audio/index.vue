<template>
  <div class="ielts-speaking-container">
    <!-- IELTS Speaking AI 应用嵌入区域 -->
    <div class="iframe-container">
      <iframe 
        ref="ieltsFrame"
        :src="ieltsAppUrl" 
        class="ielts-iframe"
        frameborder="0"
        allowfullscreen
        allow="microphone; camera"
        @load="onIframeLoad">
      </iframe>
      
      <!-- 加载遮罩 -->
      <div v-if="isLoading" class="iframe-loading">
        <el-loading 
          :visible="isLoading" 
          text="正在加载IELTS Speaking AI应用..."
          background="rgba(255, 255, 255, 0.8)">
        </el-loading>
      </div>
    </div>

    <!-- 底部工具栏 -->
    <div class="bottom-toolbar">
      <el-card class="toolbar-card">
        <div class="toolbar-content">
          <div class="toolbar-left">
            <el-button 
              type="primary" 
              size="small" 
              icon="el-icon-refresh"
              @click="refreshApp">
              刷新应用
            </el-button>
            <el-button 
              type="info" 
              size="small" 
              icon="el-icon-full-screen"
              @click="toggleFullscreen">
              {{ isFullscreen ? '退出全屏' : '全屏模式' }}
            </el-button>
          </div>
          <div class="toolbar-right">
            <div class="status-info">
              <el-tag 
                :type="isPageVisible ? 'success' : 'info'"
                size="mini">
                {{ isPageVisible ? '应用活跃' : '应用待机' }}
              </el-tag>
              <span class="last-refresh">
                上次刷新: {{ formatRefreshTime }}
              </span>
            </div>
            <el-tooltip content="确保浏览器允许麦克风权限" placement="top">
              <el-button 
                type="warning" 
                size="small" 
                icon="el-icon-microphone"
                @click="checkMicrophonePermission">
                检查麦克风
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'IELTSSpeakingAudio',
  data() {
    return {
      isLoading: true,
      isFullscreen: false,
      ieltsAppUrl: '/ielts-speaking-ai/ielts-speaking-app-ai.html',
      microphonePermission: null,
      lastRefreshTime: Date.now(),
      isPageVisible: true
    }
  },
  
  // 计算属性
  computed: {
    formatRefreshTime() {
      const now = new Date(this.lastRefreshTime);
      return now.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
  },
  
  // 监听路由变化
  watch: {
    '$route'(to, from) {
      console.log('路由变化:', from.path, '->', to.path);
      // 如果是回到当前页面，刷新应用
      if (to.path === this.$route.path && from.path !== to.path) {
        setTimeout(() => {
          this.refreshAppIfNeeded();
        }, 200);
      }
    }
  },
  mounted() {
    this.checkMicrophonePermission();
    this.initializeApp();
    
    // 监听全屏状态变化
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', this.onFullscreenChange);
    document.addEventListener('mozfullscreenchange', this.onFullscreenChange);
    
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    
    // 监听窗口焦点变化
    window.addEventListener('focus', this.onWindowFocus);
    window.addEventListener('blur', this.onWindowBlur);
  },
  
  // 组件激活时（如果使用了keep-alive）
  activated() {
    console.log('IELTS组件被激活');
    this.refreshAppIfNeeded();
  },
  
  // 组件停用时
  deactivated() {
    console.log('IELTS组件被停用');
  },
  
  beforeDestroy() {
    // 清理事件监听器
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', this.onFullscreenChange);
    document.removeEventListener('mozfullscreenchange', this.onFullscreenChange);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('focus', this.onWindowFocus);
    window.removeEventListener('blur', this.onWindowBlur);
  },
  methods: {
    // 初始化应用
    initializeApp() {
      console.log('初始化IELTS应用');
      this.lastRefreshTime = Date.now();
      this.forceRefreshIframe();
    },

    // 页面可见性变化处理
    onVisibilityChange() {
      this.isPageVisible = !document.hidden;
      console.log('页面可见性变化:', this.isPageVisible ? '可见' : '隐藏');
      
      if (this.isPageVisible) {
        // 页面变为可见时，刷新应用
        setTimeout(() => {
          this.refreshAppIfNeeded();
        }, 100);
      }
    },

    // 窗口焦点变化处理
    onWindowFocus() {
      console.log('窗口获得焦点');
      this.refreshAppIfNeeded();
    },

    onWindowBlur() {
      console.log('窗口失去焦点');
    },

    // 条件刷新应用
    refreshAppIfNeeded() {
      const now = Date.now();
      const timeSinceLastRefresh = now - this.lastRefreshTime;
      
      // 如果距离上次刷新超过5秒，则刷新应用
      if (timeSinceLastRefresh > 5000) {
        console.log('条件刷新IELTS应用');
        this.forceRefreshIframe();
        this.lastRefreshTime = now;
      } else {
        console.log('跳过刷新（时间间隔过短）');
      }
    },

    // 强制刷新iframe
    forceRefreshIframe() {
      this.isLoading = true;
      const timestamp = Date.now();
      const url = this.ieltsAppUrl + '?refresh=' + timestamp;
      
      console.log('强制刷新iframe:', url);
      
      if (this.$refs.ieltsFrame) {
        this.$refs.ieltsFrame.src = url;
      }
    },

    // iframe加载完成
    onIframeLoad() {
      console.log('IELTS Speaking AI应用加载完成');
      this.isLoading = false;
      
      // 尝试与iframe通信
      this.setupIframeMessaging();
    },

    // 设置iframe消息通信
    setupIframeMessaging() {
      window.addEventListener('message', (event) => {
        // 验证消息来源
        if (event.origin !== window.location.origin) {
          return;
        }
        
        // 处理来自IELTS应用的消息
        if (event.data.type === 'IELTS_APP_MESSAGE') {
          console.log('收到IELTS应用消息:', event.data);
          this.handleIeltsMessage(event.data);
        }
      });
    },

    // 处理IELTS应用消息
    handleIeltsMessage(data) {
      switch (data.action) {
        case 'RECORDING_STARTED':
          this.$message.success('开始录音');
          break;
        case 'RECORDING_STOPPED':
          this.$message.info('录音已停止');
          break;
        case 'ANALYSIS_COMPLETED':
          this.$message.success('AI分析完成');
          break;
        case 'ERROR':
          this.$message.error('应用错误: ' + data.message);
          break;
      }
    },

    // 刷新应用（用户手动触发）
    refreshApp() {
      console.log('用户手动刷新应用');
      this.forceRefreshIframe();
      this.lastRefreshTime = Date.now();
      this.$message.success('应用已刷新');
    },

    // 切换全屏
    toggleFullscreen() {
      const container = this.$refs.ieltsFrame;
      
      if (!this.isFullscreen) {
        // 进入全屏
        if (container.requestFullscreen) {
          container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          container.webkitRequestFullscreen();
        } else if (container.mozRequestFullScreen) {
          container.mozRequestFullScreen();
        }
      } else {
        // 退出全屏
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        }
      }
    },

    // 全屏状态变化监听
    onFullscreenChange() {
      this.isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      );
    },

    // 检查麦克风权限
    async checkMicrophonePermission() {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'microphone' });
          this.microphonePermission = result.state;
          
          if (result.state === 'denied') {
            this.$message.warning('麦克风权限被拒绝，请在浏览器设置中允许麦克风访问');
          } else if (result.state === 'granted') {
            this.$message.success('麦克风权限已允许');
          }
        } else {
          // 对于不支持permissions API的浏览器，尝试请求权限
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            this.microphonePermission = 'granted';
            this.$message.success('麦克风权限已允许');
          } catch (error) {
            this.microphonePermission = 'denied';
            this.$message.error('无法访问麦克风: ' + error.message);
          }
        }
      } catch (error) {
        console.error('检查麦克风权限失败:', error);
        this.$message.error('检查麦克风权限失败');
      }
    }
  }
}
</script>

<style scoped>
.ielts-speaking-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.iframe-container {
  flex: 1;
  position: relative;
  margin: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.ielts-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 12px;
}

.iframe-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 100;
}

.bottom-toolbar {
  flex-shrink: 0;
  padding: 20px;
}

.toolbar-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.toolbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.status-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 15px;
}

.last-refresh {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

/* 全屏模式样式 */
.ielts-iframe:-webkit-full-screen {
  width: 100vw;
  height: 100vh;
}

.ielts-iframe:-moz-full-screen {
  width: 100vw;
  height: 100vh;
}

.ielts-iframe:fullscreen {
  width: 100vw;
  height: 100vh;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .iframe-container {
    margin: 0 15px;
  }
  
  .bottom-toolbar {
    padding: 15px;
  }
  
  .toolbar-content {
    flex-direction: column;
    gap: 10px;
  }
  
  .toolbar-left,
  .toolbar-right {
    justify-content: center;
  }
  
  .status-info {
    align-items: center;
    margin-right: 0;
    margin-bottom: 10px;
  }
  
  .last-refresh {
    font-size: 11px;
  }
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .ielts-speaking-container {
    background: #1a1a1a;
  }
  
  .toolbar-card {
    background: #2d2d2d;
    color: #fff;
  }
}
</style> 