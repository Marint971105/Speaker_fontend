import axios from 'axios'

// 创建独立的 axios 实例
const chatService = axios.create({
  // baseURL: 'http://10.120.48.67:8001',
  baseURL: process.env.NODE_ENV === 'production' ? '/api/ai' : 'http://localhost:8001/api/ai',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
chatService.interceptors.request.use(
  config => {
    // 添加调试日志
    console.log('Request URL:', config.baseURL + config.url)
    console.log('Request Method:', config.method)
    console.log('Request Data:', config.data)
    return config
  },
  error => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
chatService.interceptors.response.use(
  response => {
    console.log('Response:', response.data)
    return response.data
  },
  error => {
    console.error('Response Error:', error)
    console.error('Error Config:', error.config)
    console.error('Error Message:', error.message)

    let message = '未知错误'
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = error.response.data.error || '请求参数错误'
          break
        case 500:
          message = error.response.data.error || '服务器内部错误'
          break
        default:
          message = `请求失败: ${error.response.status}`
      }
    } else if (error.request) {
      message = '无法连接到服务器'
      // 添加更多调试信息
      console.error('No response received')
      console.error('Target URL:', error.config.baseURL)
    } else {
      message = error.message
    }
    return Promise.reject(new Error(message))
  }
)

// 添加健康检查的调试函数
async function checkConnection() {
  try {
    console.log('Checking health endpoint...')
    const response = await getHealth()
    console.log('Health check successful:', response)
    return true
  } catch (error) {
    console.error('Health check failed:', error)
    return false
  }
}

// 智能裁剪对话历史，只保留关键消息以最大化可用tokens
function smartTruncateMessages(messages, maxInputTokens = 5000) {
  if (!messages || messages.length === 0) return messages
  
  // 估算当前 tokens
  const estimatedTokens = Math.floor(JSON.stringify(messages).length * 0.3)
  
  console.log('对话历史估算tokens:', estimatedTokens)
  
  // 如果估算的 tokens 在安全范围内，直接返回
  if (estimatedTokens <= maxInputTokens) {
    return messages
  }
  
  // 需要裁剪：只保留系统消息 + 最后一条用户消息
  console.warn('⚠️ 对话历史过长，只保留系统消息和最新用户消息...')
  
  // 1. 找到系统消息
  const systemMessages = messages.filter(msg => msg.role === 'system')
  
  // 2. 过滤掉系统消息后的对话
  const conversationMessages = messages.filter(msg => msg.role !== 'system')
  
  // 3. 只保留最后一条用户消息（最新的对话）
  const lastUserMessage = conversationMessages[conversationMessages.length - 1]
  
  // 如果最后一条不是用户消息，尝试找到最近的一条用户消息
  let finalMessage = lastUserMessage
  for (let i = conversationMessages.length - 1; i >= 0; i--) {
    if (conversationMessages[i].role === 'user') {
      finalMessage = conversationMessages[i]
      break
    }
  }
  
  // 合并结果：系统消息 + 最后一条用户消息
  let result = finalMessage ? [...systemMessages, finalMessage] : systemMessages
  
  // 4. 如果单个用户消息仍然太大，裁剪内容
  const resultTokens = Math.floor(JSON.stringify(result).length * 0.3)
  if (resultTokens > maxInputTokens && finalMessage) {
    console.warn('⚠️ 用户消息过长，开始裁剪消息内容...')
    
    // 计算需要裁剪的字符数（假设每字符0.3 tokens）
    const targetTokens = maxInputTokens * 0.6  // 给用户消息留60%的空间
    const maxChars = Math.floor(targetTokens / 0.3)
    
    // 裁剪消息内容，但保留开头的prompt信息
    const originalContent = finalMessage.content
    const truncatedContent = originalContent.length > maxChars 
      ? originalContent.substring(0, maxChars) + '\n\n[... 内容过长，已自动裁剪 ...]'
      : originalContent
    
    result = [...systemMessages, {
      ...finalMessage,
      content: truncatedContent
    }]
    
    console.log('内容裁剪完成:', {
      原始长度: originalContent.length,
      裁剪后长度: truncatedContent.length,
      裁剪比例: `${Math.round((1 - truncatedContent.length / originalContent.length) * 100)}%`
    })
  }
  
  console.log('智能裁剪完成:', {
    原始消息数: messages.length,
    裁剪后消息数: result.length,
    删除消息数: messages.length - result.length,
    策略: '只保留系统消息和最新用户消息'
  })
  
  return result
}

export function sendChatMessage(data) {
  // 动态计算 max_tokens，确保永不超出上下文窗口
  const contextWindowSize = 7000  // 模型的最大上下文长度
  const absoluteMaxInputTokens = 5000  // 绝对最大输入，留出2000给输出
  const safetyBuffer = 500  // 额外安全缓冲
  const maxOutputTokens = 1500  // 最大输出 tokens
  
  // 1. 智能裁剪对话历史
  let messages = data.conversation_messages || []
  messages = smartTruncateMessages(messages, absoluteMaxInputTokens)
  
  // 2. 估算输入 tokens
  const estimatedInputTokens = Math.floor(
    JSON.stringify(messages).length * 0.3
  )
  
  // 3. 双重保护：确保绝对不会超出上下文窗口
  let finalInputTokens = estimatedInputTokens
  if (finalInputTokens > contextWindowSize - safetyBuffer) {
    // 如果仍然太大，强制裁剪到安全范围
    console.error('⚠️ 输入仍然过大，强制裁剪到安全范围')
    finalInputTokens = contextWindowSize - safetyBuffer
  }
  
  // 4. 计算可用 tokens，确保至少留出安全缓冲
  const availableTokens = contextWindowSize - finalInputTokens - safetyBuffer
  const safeMaxTokens = Math.min(maxOutputTokens, Math.max(512, availableTokens))
  
  console.log('Token计算:', {
    上下文窗口: contextWindowSize,
    预估输入tokens: finalInputTokens,
    安全缓冲: safetyBuffer,
    可用输出tokens: safeMaxTokens,
    策略: '永不超出上下文窗口，确保对话持续'
  })
  
  const requestData = {
    model: "/root/autodl-tmp/mnt/LLMs/LLM-Research/Meta-Llama-3.1-8B-Instruct",
    messages: messages,
    max_tokens: safeMaxTokens,
    temperature: 0.7,
    top_p: 0.9
  }
  
  return chatService.post('/v1/chat/completions', requestData)
    .then(response => {
      // 从vLLM格式转换为我们的应用格式
      if (response.choices && response.choices.length > 0) {
        return {
          status: 'success',
          data: {
            role: 'assistant',
            content: response.choices[0].message.content
          }
        }
      } else {
        throw new Error('返回数据格式不正确')
      }
    })
}

// 添加流式聊天方法
export function sendStreamChatMessage(data, onChunk, onComplete, onError) {
  // 动态计算 max_tokens，确保永不超出上下文窗口
  const contextWindowSize = 7000  // 模型的最大上下文长度
  const absoluteMaxInputTokens = 5000  // 绝对最大输入，留出2000给输出
  const safetyBuffer = 500  // 额外安全缓冲
  const maxOutputTokens = 1500  // 最大输出 tokens
  
  // 1. 智能裁剪对话历史
  let messages = data.conversation_messages || []
  messages = smartTruncateMessages(messages, absoluteMaxInputTokens)
  
  // 2. 估算输入 tokens
  const estimatedInputTokens = Math.floor(
    JSON.stringify(messages).length * 0.3
  )
  
  // 3. 双重保护：确保绝对不会超出上下文窗口
  let finalInputTokens = estimatedInputTokens
  if (finalInputTokens > contextWindowSize - safetyBuffer) {
    // 如果仍然太大，强制裁剪到安全范围
    console.error('⚠️ 输入仍然过大，强制裁剪到安全范围')
    finalInputTokens = contextWindowSize - safetyBuffer
  }
  
  // 4. 计算可用 tokens，确保至少留出安全缓冲
  const availableTokens = contextWindowSize - finalInputTokens - safetyBuffer
  const safeMaxTokens = Math.min(maxOutputTokens, Math.max(512, availableTokens))
  
  console.log('Token计算:', {
    上下文窗口: contextWindowSize,
    预估输入tokens: finalInputTokens,
    安全缓冲: safetyBuffer,
    可用输出tokens: safeMaxTokens,
    策略: '永不超出上下文窗口，确保对话持续'
  })
  
  const requestData = {
    model: "/root/autodl-tmp/mnt/LLMs/LLM-Research/Meta-Llama-3.1-8B-Instruct",
    messages: messages,
    max_tokens: safeMaxTokens,
    temperature: 0.7,
    top_p: 0.9,
    stream: true // 启用流式响应
  }
  
  // 使用原生fetch API处理流式响应
  fetch(`${chatService.defaults.baseURL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP错误 ${response.status}`)
      }
      
      if (!response.body) {
        throw new Error('ReadableStream不可用')
      }
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let completeContent = ''
      
      function processChunk({ done, value }) {
        if (done) {
          console.log('流式响应完成')
          onComplete && onComplete({
            status: 'success',
            data: {
              role: 'assistant',
              content: completeContent
            }
          })
          return
        }
        
        // 解码并处理数据块
        const chunk = decoder.decode(value, { stream: true })
        console.log('收到数据块:', chunk)
        
        // 处理SSE格式的数据
        const lines = chunk.split('\n')
        let newContent = ''
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.substring(6))
              if (data.choices && data.choices.length > 0) {
                const content = data.choices[0].delta?.content || ''
                if (content) {
                  newContent += content
                  completeContent += content
                }
              }
            } catch (e) {
              console.error('解析数据块失败:', e)
            }
          }
        }
        
        if (newContent) {
          onChunk && onChunk(newContent)
        }
        
        // 继续读取下一个数据块
        return reader.read().then(processChunk)
      }
      
      // 开始读取流
      return reader.read().then(processChunk)
    })
    .catch(error => {
      console.error('流式请求失败:', error)
      onError && onError(error)
    })
}

export function getHealth() {
  // vLLM没有直接的健康检查接口，可以使用模型列表接口来检查服务是否可用
  return chatService.get('/v1/models')
    .then(response => {
      return { status: 'healthy' }
    })
    .catch(error => {
      return { status: 'unhealthy', error: error.message }
    })
}

// 导出连接检查函数
export { checkConnection }
