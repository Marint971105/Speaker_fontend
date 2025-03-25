import axios from 'axios'

// 创建独立的 axios 实例
const chatService = axios.create({
  baseURL: 'http://10.120.48.67:8001',
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

export function sendChatMessage(data) {
  const requestData = {
    model: "/mnt/mydisk/LLMs/LLM-Research/Meta-Llama-3.1-8B-Instruct",
    messages: data.conversation_messages || [],
    max_tokens: 4096,
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
  const requestData = {
    model: "/mnt/mydisk/LLMs/LLM-Research/Meta-Llama-3.1-8B-Instruct",
    messages: data.conversation_messages || [],
    max_tokens: 4096,
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
