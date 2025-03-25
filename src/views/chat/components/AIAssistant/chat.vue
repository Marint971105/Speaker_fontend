<template>
  <el-card class="chat-card">
    <div class="chat-container">
      <div class="chat-messages" ref="chatContainer">
        <div 
          v-for="(message, index) in displayMessages" 
          :key="`msg_${message.id}_${index}`"
          class="message"
          :class="message.role"
        >
          <div class="message-content">
            <div class="message-avatar">
              <el-avatar :size="36" :icon="message.role === 'assistant' ? 'el-icon-service' : 'el-icon-user'" />
            </div>
            <div class="message-bubble" :class="{ 'error-message': message.isError }">
              <div v-if="message.role === 'assistant'"
                   class="markdown-body"
                   v-html="renderMarkdown(message.content)">
              </div>
              <div v-else>{{ message.content }}</div>
              <!-- 错误消息重试按钮 -->
              <div v-if="message.isError" class="error-actions">
                <el-button size="mini" type="primary" @click="retryLastMessage">重试</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input">
        <el-input
          v-model="inputValue"
          type="textarea"
          :rows="3"
          placeholder="请在这里输入您的要求..."
          @keydown.enter.native.prevent="handleEnter"
        />
        <div class="input-actions">
          <el-button type="primary" @click="handleSend" :loading="isLoading">
            发送消息
          </el-button>
          <el-button @click="showClearHistoryDialog">
            清除历史
          </el-button>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script>
import { sendChatMessage, sendStreamChatMessage, getHealth } from '@/api/Ollama/chat'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
export default {
  name: 'Chat',
  data() {
    return {
      messages: [],
      inputValue: '',
      isLoading: false,
      retryingMessageId: null,
      currentStreamMessage: null,
      streamMode: true,
      messageSequence: 0,
      isSystemPrompt: false
    }
  },
  mounted() {
    this.scrollToBottom()
  },
  async created() {
    this.initializeMarked()
    window.retryLastMessage = this.retryLastMessage.bind(this)
    this.loadMessages()
    await this.checkHealth()

    if (this.messages.length === 0) {
      this.messages.push({
        id: this.getNextSequence(),
        role: 'assistant',
        content: '你好！我是AI助手。我可以帮你回答问题、解决问题。请告诉我你需要什么帮助？'
      })
    }

    window.addEventListener('beforeunload', this.handleBeforeUnload)
    this.$bus.$on('FedLogOut', this.clearChatHistory)
    this.$bus.$on('sendToAI', this.handleIncomingMessage)
    this.$bus.$on('insertToChat', this.insertToInput)
  },
  destroyed() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
    this.$bus.$off('FedLogOut', this.clearChatHistory)
    delete window.retryLastMessage
    this.clearChatHistory()
    this.$bus.$off('sendToAI', this.handleIncomingMessage)
    this.$bus.$off('insertToChat', this.insertToInput)
  },
  watch: {
    messages: {
      handler(newMessages) {
        localStorage.setItem('chatMessages', JSON.stringify(newMessages))
        this.scrollToBottom()
        
        // 当消息数量达到一定程度时检查大小
        if (newMessages.length % 20 === 0 && newMessages.length > 0) {
          this.checkHistorySize()
        }
      },
      deep: true
    }
  },
  computed: {
    displayMessages() {
      return this.messages.filter(msg => !msg.isSystemPrompt)
    }
  },
  methods: {
    addWelcomeMessage() {
      this.messages.push({
        id: this.getNextSequence(),
        role: 'assistant',
        content: '你好！我是AI助手。我可以帮你回答问题、解决问题。请告诉我你需要什么帮助？'
      })
    },
    loadMessages() {
      const savedMessages = localStorage.getItem('chatMessages')
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages)
          let maxId = 0
          parsed.forEach(msg => {
            if (msg.id && typeof msg.id === 'number' && msg.id > maxId) {
              maxId = msg.id
            }
          })
          
          this.messages = parsed.map((msg, index) => {
            if (!msg.id) {
              msg.id = maxId + index + 1
            }
            return msg
          })
          
          this.messageSequence = maxId > 0 ? maxId : 0
          
          // 加载后检查历史记录大小
          this.checkHistorySize()
        } catch (e) {
          console.error('解析保存的消息失败:', e)
          this.messages = []
          this.addWelcomeMessage()
        }
      } else {
        this.addWelcomeMessage()
      }
    },
    initializeMarked() {
      marked.setOptions({
        renderer: new marked.Renderer(),
        gfm: true,
        breaks: true,
        sanitize: false,
        highlight: (code, lang) => {
          try {
            if (lang && hljs.getLanguage(lang)) {
              return hljs.highlight(code, { language: lang }).value
            }
            return hljs.highlightAuto(code).value
          } catch (e) {
            console.error('Code highlight error:', e)
            return code
          }
        }
      })
    },
    async checkHealth() {
      try {
        const health = await getHealth()
        if (health.status !== 'healthy') {
          this.$message.warning('AI服务状态异常，可能影响对话质量')
        }
      } catch (error) {
        this.$message.error('无法连接到AI服务')
      }
    },
    getNextSequence() {
      const random = Math.floor(Math.random() * 10000);
      return ++this.messageSequence + '_' + Date.now() + '_' + random;
    },
    async sendMessage() {
      if (!this.inputValue.trim()) return
      
      const userMessage = {
        id: Date.now(),
        role: 'user',
        content: this.inputValue,
        isSystemPrompt: this.isSystemPrompt
      }
      this.inputValue = ''
      
      this.messages.push(userMessage)
      
      const tempAiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
        isStreaming: true
      }
      this.messages.push(tempAiMessage)
      this.currentStreamMessage = tempAiMessage
      
      const historyMessages = this.messages
        .filter(msg => !msg.isStreaming)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      
      try {
        await sendStreamChatMessage(
          {
            conversation_messages: historyMessages
          },
          (chunk) => {
            if (this.currentStreamMessage) {
              this.currentStreamMessage.content += chunk
              this.$nextTick(() => {
                this.scrollToBottom()
              })
            }
          },
          (response) => {
            if (this.currentStreamMessage) {
              this.currentStreamMessage.isStreaming = false
              this.currentStreamMessage = null
            }
            this.isLoading = false
          },
          (error) => {
            console.error('流式消息发送失败', error)
            if (this.currentStreamMessage) {
              this.currentStreamMessage.content = '消息发送失败，请重试。'
              this.currentStreamMessage.isError = true
              this.currentStreamMessage.isStreaming = false
              this.currentStreamMessage = null
            }
            this.isLoading = false
          }
        )
      } catch (error) {
        console.error('发送消息失败', error)
        if (this.currentStreamMessage) {
          this.currentStreamMessage.content = '消息发送失败，请重试。'
          this.currentStreamMessage.isError = true
          this.currentStreamMessage.isStreaming = false
          this.currentStreamMessage = null
        }
        this.isLoading = false
      }
    },
    handleEnter(e) {
      if (e.ctrlKey || e.shiftKey) {
        return
      }
      this.sendMessage()
    },
    scrollToBottom() {
      this.$nextTick(() => {
        if (this.$refs.chatContainer) {
          this.$refs.chatContainer.scrollTop = this.$refs.chatContainer.scrollHeight
        }
      })
    },
    clearChatHistory(keepRecent = false) {
      if (keepRecent && this.messages.length > 0) {
        // 获取最近10条消息或者当前显示的所有消息（取较小值）
        const recentCount = Math.min(10, this.messages.length)
        const recentMessages = this.messages.slice(-recentCount)
        
        localStorage.setItem('chatMessages', JSON.stringify(recentMessages))
        this.messages = recentMessages
        
        this.$message({
          type: 'success',
          message: `已清除旧消息，保留了最近${recentCount}条消息`
        })
      } else {
        // 完全清除
        localStorage.removeItem('chatMessages')
        this.messages = []
        this.messageSequence = 0
        this.addWelcomeMessage()
      }
    },
    showClearHistoryDialog() {
      this.$confirm('您想如何清除历史记录？', '清除历史', {
        confirmButtonText: '清除全部',
        cancelButtonText: '取消',
        distinguishCancelAndClose: true,
        showClose: true,
        closeOnClickModal: false,
        customClass: 'clear-history-dialog',
        center: true,
        showCancelButton: true,
        type: 'warning'
      }).then(() => {
        // 清除全部
        this.clearChatHistory(false)
        this.$message({
          type: 'success',
          message: '已清除全部历史记录'
        })
      }).catch(action => {
        if (action === 'cancel') {
          // 用户取消操作
          this.$message({
            type: 'info',
            message: '已取消清除操作'
          })
        }
      })
      
      // 添加"保留最近"按钮
      setTimeout(() => {
        const dialog = document.querySelector('.clear-history-dialog')
        if (dialog) {
          const footer = dialog.querySelector('.el-dialog__footer')
          if (footer) {
            // 创建"保留最近"按钮
            const keepRecentBtn = document.createElement('button')
            keepRecentBtn.className = 'el-button el-button--primary el-button--small'
            keepRecentBtn.innerHTML = '仅保留最近对话'
            keepRecentBtn.style.marginRight = '10px'
            
            // 添加点击事件
            keepRecentBtn.addEventListener('click', () => {
              // 关闭对话框
              document.querySelector('.clear-history-dialog .el-dialog__headerbtn').click()
              // 执行保留最近的清除
              this.clearChatHistory(true)
            })
            
            // 插入按钮
            footer.insertBefore(keepRecentBtn, footer.firstChild)
          }
        }
      }, 100)
    },
    retryLastMessage() {
      if (this.retryingMessageId) {
        this.messages.pop()
        this.inputValue = this.messages.find(msg => msg.id === this.retryingMessageId).content
        this.sendMessage()
      }
    },
    handleBeforeUnload() {
      this.clearChatHistory()
    },
    renderMarkdown(content) {
      try {
        const html = marked(content)
        console.log('Markdown rendered HTML:', html)
        return html
      } catch (e) {
        console.error('Markdown rendering error:', e)
        return content
      }
    },
    handleIncomingMessage(message) {
      this.isSystemPrompt = true
      this.inputValue = message
      this.sendMessage()
    },
    insertToInput(text) {
      this.inputValue = text || '';
      this.$nextTick(() => {
        const textarea = document.querySelector('.chat-input .el-textarea__inner');
        if (textarea) {
          textarea.focus();
          textarea.scrollIntoView({ behavior: 'smooth' });
        }
      });
    },
    handleSend() {
      if (!this.inputValue.trim()) return
      
      // 短暂显示按钮加载状态
      this.isLoading = true
      setTimeout(() => {
        this.isLoading = false
      }, 300)
      
      this.sendMessage()
    },
    // 添加检查历史记录大小的方法
    checkHistorySize() {
      const savedMessages = localStorage.getItem('chatMessages')
      if (savedMessages) {
        // 计算大小（以兆字节为单位）
        const sizeInMB = savedMessages.length / (1024 * 1024)
        console.log('聊天历史记录大小:', sizeInMB.toFixed(2) + 'MB')
        
        // 如果超过1MB，提醒用户
        if (sizeInMB > 1) {
          this.$confirm(
            `聊天历史记录已达到${sizeInMB.toFixed(2)}MB，这可能会影响应用性能。请选择清理方式：`, 
            '历史记录过大', 
            {
              confirmButtonText: '清除全部',
              cancelButtonText: '暂不处理',
              distinguishCancelAndClose: true,
              showClose: true,
              closeOnClickModal: false,
              customClass: 'history-size-warning',
              type: 'warning'
            }
          ).then(() => {
            this.clearChatHistory(false)
          }).catch(() => {
            this.$message({
              type: 'info',
              message: '您可以随时点击"清除历史"按钮清除记录'
            })          
          })
          
          // 添加"保留最近"按钮
          setTimeout(() => {
            const dialog = document.querySelector('.history-size-warning')
            if (dialog) {
              const footer = dialog.querySelector('.el-dialog__footer')
              if (footer) {
                // 创建"保留最近"按钮
                const keepRecentBtn = document.createElement('button')
                keepRecentBtn.className = 'el-button el-button--primary el-button--small'
                keepRecentBtn.innerHTML = '仅保留最近对话'
                keepRecentBtn.style.marginRight = '10px'
                
                // 添加点击事件
                keepRecentBtn.addEventListener('click', () => {
                  // 关闭对话框
                  document.querySelector('.history-size-warning .el-dialog__headerbtn').click()
                  // 执行保留最近的清除
                  this.clearChatHistory(true)
                })
                
                // 插入按钮
                footer.insertBefore(keepRecentBtn, footer.firstChild)
              }
            }
          }, 100)
        }
      }
    }
  }
}
</script>

<style scoped>
.chat-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.chat-card :deep(.el-card__body) {
  height: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 85vh;
  min-height: 500px;
  max-height: 100%;
  position: relative;
  background: #fff;
  width: 100%;
  min-height: 0;
  margin: 0 auto;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-bottom: 160px;
  min-height: 0;
  height: calc(100% - 140px);
}

.message {
  display: flex;
  margin-bottom: 24px;
  align-items: flex-start;
  padding: 0 12px;
}

.assistant {
  justify-content: flex-start;
}

.user {
  justify-content: flex-end;
}

.message-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  max-width: 80%;
}

.user .message-content {
  flex-direction: row-reverse;
}

.message-avatar {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 4px;
}

.assistant .message-avatar :deep(.el-avatar) {
  background: #409EFF;
  color: #fff;
}

.user .message-avatar :deep(.el-avatar) {
  background: #67C23A;
  color: #fff;
}

.message-bubble {
  background: #f4f6f8;
  padding: 12px 16px;
  border-radius: 8px;
  line-height: 1.6;
  font-size: 14px;
  word-break: break-word;
  min-width: 60px;
  max-width: 100%;
}

.assistant .message-bubble {
  background: #ecf5ff;
}

.user .message-bubble {
  background: #f0f9eb;
}

.chat-input {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: white;
  border-top: 1px solid #DCDFE6;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
  height: 140px;
  z-index: 10;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(144, 147, 153, 0.3);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-input /deep/ .el-textarea__inner {
  resize: none;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.5;
  height: 70px !important;
}

.chat-input /deep/ .el-textarea__inner:focus {
  border-color: #409EFF;
}

.chat-input /deep/ .el-button {
  padding: 8px 16px;
}

@media screen and (max-width: 768px) {
  .chat-container {
    border-radius: 0;
    height: 80vh;
    min-height: 400px;
  }
  
  .message-content {
    max-width: 90%;
  }
  
  .message-bubble {
    max-width: calc(100% - 52px);
  }
  
  .chat-messages {
    padding: 16px;
    padding-bottom: 140px;
    height: calc(100% - 120px);
  }
  
  .chat-input {
    padding: 16px;
    height: 120px;
  }
}

@media screen and (min-height: 1200px) {
  .chat-container {
    height: 75vh;
  }
}

@media screen and (max-height: 600px) {
  .chat-container {
    height: 90vh;
    min-height: 300px;
  }
}

.thinking-bubble {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  min-width: 200px;
  background: linear-gradient(to right, #ecf5ff, #f0f9ff) !important;
  border-left: 3px solid #409EFF;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 16px !important;
  position: relative;
  overflow: hidden;
}

.thinking-bubble::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(64, 158, 255, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  z-index: 0;
  animation: pulse-bg 4s infinite ease-in-out;
}

@keyframes pulse-bg {
  0%, 100% {
    transform: scale(1);
    opacity: 0.2;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.4;
  }
}

.thinking-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-bottom: 4px;
}

.thinking-icon {
  color: #409EFF;
  font-size: 18px;
  animation: rotate 1.5s linear infinite;
}

.thinking-text {
  font-size: 15px;
  font-weight: 500;
  color: #409EFF;
  animation: pulse 1.5s infinite;
}

.thinking-detail {
  font-size: 14px;
  color: #606266;
  opacity: 0.8;
  line-height: 1.4;
}

.typing-indicator {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 5px;
  height: 24px;
  margin-top: 4px;
}

.typing-indicator span {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(to bottom right, #409EFF, #75b9ff);
  opacity: 0.8;
  animation: bounce 1.4s infinite ease-in-out;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-8px);
    background: #409EFF;
    box-shadow: 0 4px 8px rgba(64, 158, 255, 0.4);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.thinking-animation {
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 5px 0;
  position: relative;
  z-index: 1;
}

.brain-animation {
  position: relative;
  width: 200px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 15px;
  overflow: hidden;
  box-shadow: inset 0 0 10px rgba(64, 158, 255, 0.1);
}

.brain-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.brain-wave {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.3), rgba(64, 158, 255, 0.1));
  animation: brain-wave 4s infinite;
  box-shadow: 0 0 15px rgba(64, 158, 255, 0.2);
}

.brain-wave:nth-child(2) {
  animation-delay: 0.7s;
}

.brain-wave:nth-child(3) {
  animation-delay: 1.4s;
}

@keyframes brain-wave {
  0% {
    transform: scale(0);
    opacity: 0.8;
  }
  70% {
    opacity: 0.2;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

@media screen and (max-width: 768px) {
  .thinking-bubble {
    min-width: 150px;
    padding: 12px !important;
  }
  
  .brain-animation {
    width: 150px;
  }
  
  .thinking-text {
    font-size: 14px;
  }
  
  .thinking-detail {
    font-size: 13px;
  }
}

.stream-indicator {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  margin-top: 8px;
  height: 16px;
}

.stream-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #409EFF;
  opacity: 0.7;
  animation: pulse 1s infinite ease-in-out alternate;
}

.stream-dot:nth-child(1) {
  animation-delay: 0s;
}

.stream-dot:nth-child(2) {
  animation-delay: 0.3s;
}

.stream-dot:nth-child(3) {
  animation-delay: 0.6s;
}

/* 错误消息样式 */
.error-message {
  background-color: #fef0f0;
  border-left: 3px solid #f56c6c;
}

.error-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

/* 添加动画效果 */
@keyframes pulse {
  0% { opacity: 0.4; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
}

/* 流式响应指示器样式 */
</style>
