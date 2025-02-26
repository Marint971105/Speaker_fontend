import axios from 'axios'

// 创建独立的 axios 实例
const chatService = axios.create({
  baseURL: 'http://10.120.48.67:5000',
  timeout: 30000,


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
          message = error.response.data.message || '请求参数错误'
          break
        case 500:
          message = error.response.data.message || '服务器内部错误'
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
  return chatService.post('/api/v1/chat', data)
}

export function getHealth() {
  return chatService.get('/api/v1/health')
}

// 导出连接检查函数
export { checkConnection }
