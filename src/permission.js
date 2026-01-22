import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'
import { isRelogin } from '@/utils/request'
import { hasMemberManagePermission } from '@/utils/permission-config'

NProgress.configure({ showSpinner: false })

// CAS相关配置
const CAS_LOGIN_URL = process.env.VUE_APP_CAS_LOGIN_URL || 'https://auth.bupt.edu.cn/authserver/login'
const CAS_CALLBACK_PATH = '/cas/callback'
const APP_BASE_URL = window.location.origin
const USE_CAS = process.env.VUE_APP_USE_CAS === 'true'

// 修改白名单配置
// 直接将CAS回调路径加入白名单，不依赖USE_CAS开关，确保CAS认证功能始终可用
// 将扫码验证页面加入白名单，允许未登录用户访问
const whiteList = ['/login', '/register', '/cas/callback', '/qrcode-verify']

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
      // 【扫码进班功能】检查URL中是否有classId参数
      // 如果有classId，说明是扫码进班场景，需要允许进入登录页执行加入班级逻辑
      if (to.query.classId) {
        console.log('[路由守卫] 检测到已登录用户扫码进班，classId:', to.query.classId)
        next()  // 允许进入登录页，login.vue的created()会处理加入班级
      } else {
        // 普通情况：已登录用户访问登录页，重定向到首页
      next({ path: '/' })
      }
      NProgress.done()
      return  // 添加return，确保不继续执行后续逻辑
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
        // 检查成员管理页面权限（在所有已登录状态下都检查）
        if (to.path && (to.path.includes('/memberManage') || to.path.startsWith('/memberManage'))) {
          const userId = store.getters.userId
          if (!hasMemberManagePermission(userId)) {
            Message.warning('您没有权限访问成员管理页面')
            next({ path: '/', replace: true })
            NProgress.done()
            return
          }
        }
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
    
    // 【扫码进班功能】检查sessionStorage中是否有pendingClassId和pendingMobile
    // CAS认证会跳转到外部服务器，URL参数会丢失，所以使用sessionStorage桥接
    const classId = sessionStorage.getItem('pendingClassId')
    const pendingMobile = sessionStorage.getItem('pendingMobile')
    
    console.log('[路由守卫] CAS认证成功，检查待处理信息 - classId:', classId, 'pendingMobile:', pendingMobile)
    
    // 【关键】如果有待更新的手机号，且用户账户没有手机号或为空，则更新手机号
    if (pendingMobile) {
      // 先获取用户信息
      return store.dispatch('GetInfo').then(userInfo => {
        // userInfo 是 GetInfo 返回的完整响应对象
        const user = userInfo?.data || userInfo
        const userId = store.getters.id || user?.userId
        const currentMobile = user?.mobile
        
        console.log('[路由守卫] 检查用户信息 - userId:', userId, 'currentMobile:', currentMobile)
        
        // CAS认证登录：允许覆盖现有手机号
        // 如果用户已有手机号且与新手机号不同，则覆盖更新
        if (!currentMobile || currentMobile === '' || currentMobile === 'null' || currentMobile !== pendingMobile) {
          if (currentMobile && currentMobile !== pendingMobile) {
            console.log('[路由守卫] 用户已有其他手机号，CAS认证登录允许覆盖更新:', currentMobile, '->', pendingMobile)
          } else {
            console.log('[路由守卫] 用户账户没有手机号，准备更新手机号:', pendingMobile)
          }
          // 动态导入API函数
          return import('@/api/login').then(module => {
            const { updateMobileForCas } = module
            return updateMobileForCas(userId, pendingMobile)
          }).then(response => {
            // 清除sessionStorage（用完即删）
            sessionStorage.removeItem('pendingMobile')
            console.log('[路由守卫] 已清除 sessionStorage 中的手机号')
            
            if (response.code === 1) {
              Message.success('手机号已更新')
              console.log('[路由守卫] 成功更新手机号:', pendingMobile)
            } else {
              console.warn('[路由守卫] 更新手机号失败:', response.msg)
            }
            
            // 继续处理 classId
            if (classId) {
              return handleJoinClass(classId, next)
            } else {
              next({ path: '/index', replace: true })
            }
          }).catch(error => {
            console.error('[路由守卫] 更新手机号出错:', error)
            // 即使更新手机号失败，也清除 sessionStorage 并继续
            sessionStorage.removeItem('pendingMobile')
            if (classId) {
              return handleJoinClass(classId, next)
            } else {
              next({ path: '/index', replace: true })
            }
          })
        } else {
          // 用户已有相同的手机号，清除 sessionStorage
          sessionStorage.removeItem('pendingMobile')
          console.log('[路由守卫] 用户已有相同的手机号，无需更新')
          
          // 继续处理 classId
          if (classId) {
            return handleJoinClass(classId, next)
          } else {
            next({ path: '/index', replace: true })
          }
        }
      })
    } else {
      // 没有待更新的手机号，直接处理 classId
      if (classId) {
        return handleJoinClass(classId, next)
      } else {
        // 没有classId，普通CAS登录，直接跳转首页
        console.log('[路由守卫] 普通CAS登录，跳转首页')
    next({ path: '/index', replace: true })
      }
    }
  }).catch(error => {
    loadingMsg.close()
    Message.error(error || '认证失败，请重新登录')
    next('/login')
  })
}

/**
 * 处理加入班级逻辑（辅助函数）
 */
function handleJoinClass(classId, next) {
  console.log('[路由守卫] CAS认证成功，检测到扫码进班，班级ID:', classId)
  
  // 动态导入API函数，调用加入班级接口
  import('@/api/classManage/teacher/index').then(module => {
    const { loginAccountAndAttend } = module
    return loginAccountAndAttend(classId)
  }).then(response => {
    // 清除sessionStorage（用完即删，避免影响下次普通登录）
    sessionStorage.removeItem('pendingClassId')
    console.log('[路由守卫] 已清除 sessionStorage 中的 classId')
    
    // 根据加入班级的结果显示提示
    if (response.code === 1) {
      Message.success(response.msg || '加入班级成功')
      console.log('[路由守卫] 成功加入班级:', classId)
    } else {
      Message.warning(response.msg || '加入班级失败')
      console.warn('[路由守卫] 加入班级失败:', response)
    }
    
    // 无论成功失败，都跳转到首页
    next({ path: '/index', replace: true })
  }).catch(error => {
    // 加入班级出错，清除sessionStorage并跳转首页
    console.error('[路由守卫] 加入班级出错:', error)
    sessionStorage.removeItem('pendingClassId')
    Message.error('加入班级失败')
    next({ path: '/index', replace: true })
  })
}