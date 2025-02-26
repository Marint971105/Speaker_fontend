// import auth from '@/plugins/auth'
// import router, { constantRoutes, dynamicRoutes } from '@/router'
// import { getRouters } from '@/api/menu'
// import Layout from '@/layout/index'
// import ParentView from '@/components/ParentView'
// import InnerLink from '@/layout/components/InnerLink'

// const permission = {
//   state: {
//     routes: [],
//     addRoutes: [],
//     defaultRoutes: [],
//     topbarRouters: [],
//     sidebarRouters: []
//   },
//   mutations: {
//     SET_ROUTES: (state, routes) => {
//       state.addRoutes = routes
//       state.routes = constantRoutes.concat(routes)
//     },
//     SET_DEFAULT_ROUTES: (state, routes) => {
//       state.defaultRoutes = constantRoutes.concat(routes)
//     },
//     SET_TOPBAR_ROUTES: (state, routes) => {
//       state.topbarRouters = routes
//     },
//     SET_SIDEBAR_ROUTERS: (state, routes) => {
//       state.sidebarRouters = routes
//     },
//   },
//   actions: {
//     生成路由
//     GenerateRoutes({ commit }) {
//       return new Promise(resolve => {
//         // 向后端请求路由数据
//         getRouters().then(res => {
//           const sdata = JSON.parse(JSON.stringify(res.data))
//           const rdata = JSON.parse(JSON.stringify(res.data))
//           const sidebarRoutes = filterAsyncRouter(sdata)
//           const rewriteRoutes = filterAsyncRouter(rdata, false, true)
//           const asyncRoutes = filterDynamicRoutes(dynamicRoutes);
//           rewriteRoutes.push({ path: '*', redirect: '/404', hidden: true })
//           router.addRoutes(asyncRoutes);
//           commit('SET_ROUTES', rewriteRoutes)
//           commit('SET_SIDEBAR_ROUTERS', constantRoutes.concat(sidebarRoutes))
//           commit('SET_DEFAULT_ROUTES', sidebarRoutes)
//           commit('SET_TOPBAR_ROUTES', sidebarRoutes)
//           resolve(rewriteRoutes)
//         })
//       })
//     }
//
//   }
// }
//
// // 遍历后台传来的路由字符串，转换为组件对象
// function filterAsyncRouter(asyncRouterMap, lastRouter = false, type = false) {
//   return asyncRouterMap.filter(route => {
//     if (type && route.children) {
//       route.children = filterChildren(route.children)
//     }
//     if (route.component) {
//       // Layout ParentView 组件特殊处理
//       if (route.component === 'Layout') {
//         route.component = Layout
//       } else if (route.component === 'ParentView') {
//         route.component = ParentView
//       } else if (route.component === 'InnerLink') {
//         route.component = InnerLink
//       } else {
//         route.component = loadView(route.component)
//       }
//     }
//     if (route.children != null && route.children && route.children.length) {
//       route.children = filterAsyncRouter(route.children, route, type)
//     } else {
//       delete route['children']
//       delete route['redirect']
//     }
//     return true
//   })
// }
//
// function filterChildren(childrenMap, lastRouter = false) {
//   var children = []
//   childrenMap.forEach((el, index) => {
//     if (el.children && el.children.length) {
//       if (el.component === 'ParentView' && !lastRouter) {
//         el.children.forEach(c => {
//           c.path = el.path + '/' + c.path
//           if (c.children && c.children.length) {
//             children = children.concat(filterChildren(c.children, c))
//             return
//           }
//           children.push(c)
//         })
//         return
//       }
//     }
//     if (lastRouter) {
//       el.path = lastRouter.path + '/' + el.path
//       if (el.children && el.children.length) {
//         children = children.concat(filterChildren(el.children, el))
//         return
//       }
//     }
//     children = children.concat(el)
//   })
//   return children
// }
//
// // 动态路由遍历，验证是否具备权限
// export function filterDynamicRoutes(routes) {
//   const res = []
//   routes.forEach(route => {
//     if (route.permissions) {
//       if (auth.hasPermiOr(route.permissions)) {
//         res.push(route)
//       }
//     } else if (route.roles) {
//       if (auth.hasRoleOr(route.roles)) {
//         res.push(route)
//       }
//     }
//   })
//   return res
// }
//
// export const loadView = (view) => {
//   if (process.env.NODE_ENV === 'development') {
//     return (resolve) => require([`@/views/${view}`], resolve)
//   } else {
//     // 使用 import 实现生产环境的路由懒加载
//     return () => import(`@/views/${view}`)
//   }
// }
//
// export default permission
import { constantRoutes, dynamicRoutes } from '@/router'

const permission = {
  state: {
    routes: [],          // 完整路由表
    addRoutes: [],       // 动态添加的路由
    sidebarRouters: []   // 侧边栏路由
  },
  mutations: {
    SET_ROUTES: (state, routes) => {
      state.addRoutes = routes
      state.routes = constantRoutes.concat(routes)  // 将静态路由和动态路由合并
    },
    SET_SIDEBAR_ROUTERS: (state, routes) => {
      state.sidebarRouters = constantRoutes.concat(routes)  // 设置侧边栏路由
    }
  },
  actions: {
    // 生成路由
    GenerateRoutes({ commit }, roles) {
      return new Promise(resolve => {
        let accessedRoutes

        console.log("Inside GenerateRoutes, roles:", roles);

        // 如果是admin角色，拥有所有路由的访问权限
        if (roles.includes('admin')) {
          accessedRoutes = dynamicRoutes
        } else {
          // 根据roleID过滤路由
          accessedRoutes = filterAsyncRoutes(dynamicRoutes, roles)
        }
        console.log(" accessedRoutes:", JSON.parse(JSON.stringify(accessedRoutes)));
        // 将过滤后的路由添加到Vuex中
        commit('SET_ROUTES', accessedRoutes)
        commit('SET_SIDEBAR_ROUTERS', accessedRoutes)
        resolve(accessedRoutes)
      })
    }
  }
}

// 过滤路由，根据用户角色roleID判断是否有访问权限
function filterAsyncRoutes(routes, roles) {
  const res = []

  routes.forEach(route => {
    const tmp = { ...route }
    // 判断当前路由是否符合用户的角色权限
    if (hasPermission(roles, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, roles)
      }
      res.push(tmp)
    }
  })
  console.log("Filtered Routes:", res);

  return res
}

// 判断路由是否有权限访问
function hasPermission(roles, route) {
  if (route.meta && route.meta.roles) {
    // 如果路由中有roles属性，判断是否有相应的权限
    return roles.some(role => route.meta.roles.includes(role))
  } else {
    return true
  }
}

export default permission


