import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'
import { isRelogin } from '@/utils/request'

NProgress.configure({ showSpinner: false })

// CAS相关配置
const CAS_LOGIN_URL = process.env.VUE_APP_CAS_LOGIN_URL || 'https://auth.bupt.edu.cn/authserver/login'
const CAS_CALLBACK_PATH = '/cas/callback'
const APP_BASE_URL = window.location.origin
const USE_CAS = process.env.VUE_APP_USE_CAS === 'true'

// 修改白名单配置
const whiteList = ['/login', '/register']

if (USE_CAS) {
  whiteList.push(CAS_CALLBACK_PATH) // 只将callback加入白名单
}

router.beforeEach((to, from, next) => {
  NProgress.start()
  // console.log("Sidebar routes in beforeEach:", store.getters.sidebarRouters);
   
  // 恢复原来的CAS回调处理
  if (USE_CAS && (to.path === CAS_CALLBACK_PATH || to.query.ticket)) {
    handleCasCallback(to, next)
    return
  }

  if (getToken()) {
    to.meta.title && store.dispatch('settings/setTitle', to.meta.title)
    /* has token*/
    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done()
    } else if (whiteList.indexOf(to.path) !== -1) {
      next()
    } else {
       if (store.getters.roles.length === 0) {
        isRelogin.show = true
        // 判断当前用户是否已拉取完user_info信息
        store.dispatch('GetInfo').then(() => {
          isRelogin.show = false
          const roles = store.getters.roles

          store.dispatch('GenerateRoutes', roles).then(accessRoutes => {
            // 根据roles权限生成可访问的路由表
            router.addRoutes(accessRoutes) // 动态添加可访问路由表
            next({ ...to, replace: true }) // hack方法 确保addRoutes已完成

          })
        }).catch(err => {
            store.dispatch('FedLogOut').then(() => {
              Message.error(err)
              next({ path: '/' })
            })
          })
      } else {
        next()
      }
    }
  } else {
    // 没有token
    if (whiteList.indexOf(to.path) !== -1) {
      // 在免登录白名单，直接进入
      next()
    } else {
      next(`/login?redirect=${encodeURIComponent(to.fullPath)}`) // 统一重定向到登录页
    }
  }
  NProgress.done()
})

router.afterEach(() => {
  NProgress.done()
})



/**
 * 重定向到CAS登录页
 */
function redirectToCas() {
  // 构造服务URL，即CAS验证成功后的回调地址
  const serviceUrl = encodeURIComponent(`${APP_BASE_URL}${CAS_CALLBACK_PATH}`)
  
  // 重定向到CAS登录页面
  window.location.href = `${CAS_LOGIN_URL}?service=${serviceUrl}`
}

/**
 * 处理CAS回调
 * @param {Object} to - 目标路由对象
 * @param {Function} next - 路由跳转函数
 */
function handleCasCallback(to, next) {
  const ticket = to.query.ticket
  
  if (!ticket) {
    Message.error('未获取到有效的认证票据')
    next('/login')
    return
  }
  
  // 构造service参数，必须与请求ticket时完全一致
  const service = window.location.origin + '/cas/callback'
  
  // 显示加载提示
  const loadingMsg = Message({
    message: '正在验证您的身份...',
    duration: 0,
    type: 'info'
  })
  
  // 调用验证接口
  store.dispatch('CasLogin', { 
    ticket: ticket,
    service: service  // 不需要encode，后端会处理
  }).then(() => {
    loadingMsg.close()
    next({ path: '/index', replace: true })
  }).catch(error => {
    loadingMsg.close()
    Message.error(error || '认证失败，请重新登录')
    next('/login')
  })
}