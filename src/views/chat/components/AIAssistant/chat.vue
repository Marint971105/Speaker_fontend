<template>
  <el-card class="chat-card">
    <div class="chat-container">
      <div class="chat-messages" ref="chatContainer">
        <div 
          v-for="(message, index) in messages" 
          :key="message.id || index"
          class="message"
          :class="message.role"
        >
          <div class="message-content">
            <div class="message-avatar">
              <el-avatar :size="36" :icon="message.role === 'assistant' ? 'el-icon-service' : 'el-icon-user'" />
            </div>
            <div class="message-bubble">
              <div v-if="message.role === 'assistant'"
                   class="markdown-body"
                   v-html="renderMarkdown(message.content)">
              </div>
              <div v-else>{{ message.content }}</div>
            </div>
          </div>
        </div>
        <!-- 加载动画 -->
        <div v-if="isLoading" class="message-item assistant">
          <el-avatar :size="40" icon="el-icon-service" class="assistant-avatar"></el-avatar>
          <div class="message-content">
            <div class="message-bubble">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input">
        <el-input
          v-model="userInput"
          type="textarea"
          :rows="3"
          placeholder="输入消息..."
          @keydown.enter.native.prevent="handleEnter"
        />
        <div class="input-actions">
          <el-button type="primary" @click="handleSend" :loading="isLoading">
            发送消息
          </el-button>
          <el-button @click="clearChatHistory">
            清除历史
          </el-button>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script>
import { sendChatMessage,getHealth } from '@/api/Ollama/chat'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
export default {
  name: 'Chat',
  data() {
    return {
      messages: [],
      userInput: '',
      isLoading: false,
      retryMessage: null, // 用于消息重发
      messageSequence: 0, // 消息序号
      isSystemPrompt: false // 添加标记
    }
  },
  mounted() {
    this.scrollToBottom()
  },
  async created() {
    // 初始化设置

    this.initializeMarked()
    window.retryLastMessage = this.retryLastMessage.bind(this)
    this.loadMessages()
    await this.checkHealth()

    // 添加欢迎消息
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
  },
  destroyed() {
    // 移除事件监听
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
    this.$bus.$off('FedLogOut', this.clearChatHistory)
    delete window.retryLastMessage
    // 确保清除历史
    this.clearChatHistory()
    this.$bus.$off('sendToAI', this.handleIncomingMessage)
  },
  watch: {
    messages: {
      handler(newMessages) {
        // 保存消息到localStorage
        localStorage.setItem('chatMessages', JSON.stringify(newMessages))
        this.scrollToBottom()
      },
      deep: true
    }
  },
  computed: {
    // 添加用于显示的消息列表计算属性
    displayMessages() {
      return this.messages.filter(msg => !msg.isSystemPrompt)
    }
  },
  methods: {
    // 添加新方法
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
        this.messages = JSON.parse(savedMessages)
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
      return ++this.messageSequence
    },
    async sendMessage(retry = false) {
      if ((!this.userInput.trim() && !retry) || this.isLoading) return

      const messageContent = retry ? this.retryMessage.content : this.userInput.trim()

      // 创建用户消息对象
      const userMessage = {
        id: this.getNextSequence(),
        role: 'user',
        content: messageContent,
        isSystemPrompt: this.isSystemPrompt // 添加标记
      }

      // 如果不是重试且不是系统prompt，才添加到显示消息中
      if (!retry && !this.isSystemPrompt) {
        this.messages.push(userMessage)
      }

      this.userInput = ''
      this.isLoading = true
      this.retryMessage = null

      try {
        // 发送消息时，处理历史消息格式
        const messagesForApi = this.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))

        // 如果是系统prompt，添加到API请求中但不显示
        if (this.isSystemPrompt) {
          messagesForApi.push({
            role: 'user',
            content: messageContent
          })
        }

        const response = await sendChatMessage({
          message: messageContent,
          conversation_messages: messagesForApi
        })

        if (response.status === 'success') {
          response.data.id = this.getNextSequence()
          this.messages.push(response.data)
        } else {
          throw new Error(response.message || '获取响应失败')
        }
      } catch (error) {
        this.$message.error(error.message)
        this.retryMessage = userMessage
        this.messages.push({
          id: this.getNextSequence(),
          role: 'assistant',
          content: '消息发送失败。<button class="retry-btn" onclick="window.retryLastMessage()">重试</button>'
        })
      } finally {
        this.isLoading = false
        this.isSystemPrompt = false // 重置标记
      }
    },

    handleEnter(e) {
      if (e.ctrlKey || e.shiftKey) {
        // 允许换行
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
    clearChatHistory() {
      localStorage.removeItem('chatMessages')
      this.messages = []
      // 重置消息序号
      this.messageSequence = 0
      // 添加欢迎消息
      this.addWelcomeMessage()
    },
    retryLastMessage() {
      if (this.retryMessage) {
        // 移除失败提示消息
        this.messages.pop()
        this.sendMessage(true)
      }
    },
    // 处理页面关闭或刷新
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
      this.isSystemPrompt = true // 标记为系统prompt
      this.userInput = message
      this.sendMessage()
    },
    handleSend() {
      // 防止空消息
      if (!this.userInput.trim()) return
      
      // 发送消息的逻辑
      this.sendMessage()
      this.userInput = '' // 清空输入框
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
  height: 85vh; /* 使用视窗高度的85% */
  min-height: 500px; /* 设置最小高度 */
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
  height: calc(100% - 140px); /* 减去输入框高度 */
}

.message {
  display: flex;
  margin-bottom: 24px;
  align-items: flex-start;
  padding: 0 12px;
}

/* AI消息靠左 */
.assistant {
  justify-content: flex-start;
}

/* 用户消息靠右 */
.user {
  justify-content: flex-end;
}

.message-content {
  display: flex;
  align-items: flex-start;
  gap: 16px; /* 增加头像和气泡的间距 */
  max-width: 80%;
}

.user .message-content {
  flex-direction: row-reverse;
}

.message-avatar {
  display: flex;
  align-items: flex-start; /* 改为顶部对齐 */
  justify-content: center;
  flex-shrink: 0;
  margin-top: 4px; /* 微调头像位置 */
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
  min-width: 60px; /* 设置最小宽度 */
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

/* 滚动条样式 */
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

/* Element UI 组件样式覆盖 */
.chat-input /deep/ .el-textarea__inner {
  resize: none;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.5;
  height: 70px !important; /* 增加输入框高度 */
}

.chat-input /deep/ .el-textarea__inner:focus {
  border-color: #409EFF;
}

.chat-input /deep/ .el-button {
  padding: 8px 16px;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .chat-container {
    border-radius: 0;
    height: 80vh; /* 移动端稍微矮一点 */
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

/* 针对超大屏幕 */
@media screen and (min-height: 1200px) {
  .chat-container {
    height: 75vh; /* 在大屏上适当减小比例 */
  }
}

/* 针对小屏幕 */
@media screen and (max-height: 600px) {
  .chat-container {
    height: 90vh; /* 在小屏上增大比例 */
    min-height: 300px;
  }
}
</style>
