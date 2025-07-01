import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'

/**
 * Note: 路由配置项
 *
 * hidden: true                     // 当设置 true 的时候该路由不会再侧边栏出现 如401，login等页面，或者如一些编辑页面/edit/1
 * alwaysShow: true                 // 当你一个路由下面的 children 声明的路由大于1个时，自动会变成嵌套的模式--如组件页面
 *                                  // 只有一个时，会将那个子路由当做根路由显示在侧边栏--如引导页面
 *                                  // 若你想不管路由下面的 children 声明的个数都显示你的根路由
 *                                  // 你可以设置 alwaysShow: true，这样它就会忽略之前定义的规则，一直显示根路由
 * redirect: noRedirect             // 当设置 noRedirect 的时候该路由在面包屑导航中不可被点击
 * name:'router-name'               // 设定路由的名字，一定要填写不然使用<keep-alive>时会出现各种问题
 * query: '{"id": 1, "name": "ry"}' // 访问路由的默认传递参数
 * roles: ['admin', 'common']       // 访问路由的角色权限
 * permissions: ['a:a:a', 'b:b:b']  // 访问路由的菜单权限
 * meta : {
    noCache: true                   // 如果设置为true，则不会被 <keep-alive> 缓存(默认 false)
    title: 'title'                  // 设置该路由在侧边栏和面包屑中展示的名字
    icon: 'svg-name'                // 设置该路由的图标，对应路径src/assets/icons/svg
    breadcrumb: false               // 如果设置为false，则不会在breadcrumb面包屑中显示
    activeMenu: '/system/user'      // 当路由设置了该属性，则会高亮相对应的侧边栏。
  }
 */

// 公共路由
export const constantRoutes = [
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect')
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login'),
    hidden: true
  },
  {
    path: '/register',
    component: () => import('@/views/register'),
    hidden: true
  },
  {
    path: '/404',
    component: () => import('@/views/error/404'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error/401'),
    hidden: true
  },
  {
    path: '',
    component: Layout,
    redirect: 'index',
    children: [
      {
        path: 'index',
        component: () => import('@/views/index'),
        name: 'Index',
        meta: { title: '首页', icon: 'dashboard', affix: true }
      }
    ]
  },
  {
    path: '/user',
    component: Layout,
    hidden: true,
    redirect: 'noredirect',
    children: [
      {
        path: 'profile',
        component: () => import('@/views/system/user/profile/index'),
        name: 'Profile',
        meta: { title: '个人中心', icon: 'user' }
      }
    ]
  },
  {
    path: '/cas/callback',
    component: () => import('@/views/cas/callback'),
    hidden: true
  },
  // {
  //   path: '/video',
  //   component: Layout,
  //   name: 'Video',
  //   meta: { 
  //     title: '视频分析', 
  //     icon: 'tool',
  //     roles: ['admin'],
  //     permissions: ['system:test:view']
  //   },
  //   children: [
  //     {
  //       path: 'record',
  //       component: () => import('@/views/test/index'),
  //       name: 'VideoRecord',
  //       meta: { 
  //         title: '录制视频', 
  //         icon: 'video' 
  //       }
  //     },
  //     {
  //       path: 'analysis',
  //       component: () => import('@/views/test/AIAnalysisTest'),
  //       name: 'AIAnalysis',
  //       meta: { 
  //         title: 'AI分析', 
  //         icon: 'brain' 
  //       }
  //     }
  //   ]
  // }
]

// 动态路由，基于用户权限动态去加载
export const dynamicRoutes = [
  {
    path: '/system/user-auth',
    component: Layout,
    hidden: true,
    // roles: ['admin'],
    // permissions: ['system:user:edit'],
    meta: { roles: ['admin'], permissions: ['system:user:edit'], icon: 'druid' },
    children: [
      {
        path: 'role/:userId',
        component: () => import('@/views/system/user/authRole'),
        name: 'AuthRole',
        meta: { title: '分配角色', activeMenu: '/system/user', icon: 'druid' }
      }
    ]
  },
  {
    path: '/system/role-auth',
    component: Layout,
    hidden: true,
    // roles: ['admin'],
    // permissions: ['system:role:edit'],
    meta: { roles: ['admin'], permissions: ['system:role:edit'], icon: 'druid' },
    children: [
      {
        path: 'user/:roleId(\\d+)',
        component: () => import('@/views/system/role/authUser'),
        name: 'AuthUser',
        meta: { title: '分配用户', activeMenu: '/system/role' }
      }
    ]
  },
  {
    path: '/system/dict-data',
    component: Layout,
    hidden: true,
    // roles: ['admin'],
    // permissions: ['system:dict:list'],
    meta: { roles: ['admin'], permissions: ['system:user:edit'], icon: 'druid' },
    children: [
      {
        path: 'index/:dictId(\\d+)',
        component: () => import('@/views/system/dict/data'),
        name: 'Data',
        meta: { title: '字典数据', activeMenu: '/system/dict' }
      }
    ]
  },
  {
    path: '/monitor/job-log',
    component: Layout,
    hidden: true,
    // roles: ['admin'],
    // permissions: ['monitor:job:list'],
    meta: { roles: ['admin'], permissions: ['system:user:edit'], icon: 'druid' },
    children: [
      {
        path: 'index/:jobId(\\d+)',
        component: () => import('@/views/monitor/job/log'),
        name: 'JobLog',
        meta: { title: '调度日志', activeMenu: '/monitor/job' }
      }
    ]
  },
  {
    path: '/memberManage/',
    component: Layout,
    hidden: false,
    // roles: ['admin'],
    // permissions: ['monitor:job:list'],
    meta: { roles: ['admin'], permissions: ['system:user:edit'], icon: 'user' },
    children: [
      {
        path: 'index/',
        component: () => import('@/views//memberManage/index'),
        name: 'memberManage',
        meta: { title: '成员管理', activeMenu: '/memberManage/', icon: 'user' }
      },
      {
        path: 'userDetail/',
        component: () => import('@/views/memberManage/userDetail'),
        name: 'userDetail',
        hidden: true, // 隐藏在侧边栏，不显示
        meta: { title: '用户详情', activeMenu: '/memberManage/index' }
      }
    ]
  },



  // {
  //   path: '/task/myHomework-detail',
  //   component: Layout,
  //   hidden:false,
  //   // roles: ['admin'],
  //   // permissions: ['monitor:job:list'],
  //   meta: { title: '我的作业',roles: ['admin'], permissions: ['system:user:edit'] , icon: 'druid'},
  //   children: [
  //     {
  //       path: 'index/:workId(\\d+)',
  //       component: () => import('@/views/Task/myHomework/detail'),
  //       name: 'detail',
  //       meta: { title: '作业详情', activeMenu: '/myHomework/detail' , icon: 'druid'}
  //     },
  //     {
  //       path: 'selfEvolution',
  //       component: () => import('@/views/Task/myHomework/selfEvolution'),
  //       name: 'selfEvolution',
  //       meta: { title: '自评', activeMenu: '/myHomework/detail/selfEvolution', icon: 'druid' }
  //     },
  //     {
  //       path: 'machineEvolution/:workId(\\d+)',
  //       component: () => import('@/views/Task/myHomework/machineEvolution'),
  //       name: 'machineEvolution',
  //       meta: { title: '机评', activeMenu: '/myHomework/detail/machineEvolution', icon: 'druid' }
  //     },
  //     {
  //       path: 'teacherEvolution/:workId(\\d+)',
  //       component: () => import('@/views/Task/myHomework/teacherEvolution'),
  //       name: 'teacherEvolution',
  //       meta: { title: '机评', activeMenu: '/myHomework/detail/teacherEvolution' , icon: 'druid'}
  //     }
  //   ]
  // },

  {
    path: '/homeworkManage/',
    component: Layout,
    hidden: false,
    meta: { roles: ['admin'], permissions: ['system:user:edit'], icon: 'form' },
    children: [
      {
        path: 'index/',
        component: () => import('@/views/homeworkManage/index'),
        name: 'index',
        meta: { title: '作业管理', activeMenu: '/homeworkManage/' }
      },
      {
        path: 'createHomework',
        component: () => import('@/views/homeworkManage/createHomework'),
        hidden: true,
        name: 'createHomework',
        meta: { title: '创建作业', activeMenu: '/homeworkManage/index/createHomework' }
      },
      {
        path: 'homeWorkDetail/:ownerId/:assignmentId',
        component: () => import('@/views/homeworkManage/homeWorkDetail'),
        hidden: true,
        name: 'homeWorkDetail',
        meta: { title: '作业详情', activeMenu: '/homeworkManage/index/homeWorkDetail' }
      },
      {
        path: '/assign-task/:taskId',
        name: 'AssignTask',
        hidden: true,
        component: () => import('@/views/homeworkManage/AssignTask.vue'),
        meta: { title: '分配作业', activeMenu: '/homeworkManage/index/createHomework/' }
      }
    ]
  },

  {
    path: '/classManage/',
    component: Layout,
    hidden: false,
    meta: { title: '班级管理', icon: 'peoples' },
    children: [
      {
        path: 'teacher/index/',
        component: () => import('@/views/classManage/teacher/index.vue'),
        name: 'teacher/index',
        hidden: false,
        meta: { title: '教师班级', roles: ['admin'], activeMenu: '/classManage/' },
      },

      {
        path: 'teacher/:classId',
        component: () => import('@/views/classManage/teacher/application.vue'),
        name: 'classapplication',
        hidden: true,
        meta: { title: '查看申请', activeMenu: '/classManage/teacher/index' },
        props: true // 将 classId 作为 prop 传递给组件
      },

      {
        path: 'student/index/',
        component: () => import('@/views/classManage/student/index.vue'),
        name: 'student/index',
        hidden: false,
        meta: { title: '学生班级', roles: ['common'], activeMenu: '/classManage/' }
      },
    ],
  },

  {
    path: '/myTask/',
    component: Layout,
    hidden: false,
    meta: { title: '我的任务', icon: 'job' },
    children: [
      {
        path: 'myEvaluation/index/',
        component: () => import('@/views/myTask/myEvaluation/index.vue'),
        name: 'myEvaluation/index/',
        hidden: false,
        meta: { title: '我的评价', roles: ['common'], activeMenu: '/myTask/', icon: 'rate' },
      },
      {
        path: '/myEvaluation/selfReview',
        component: () => import('@/views/myTask/myEvaluation/selfReview.vue'),
        name: 'myEvaluation/selfReview',
        hidden: true,
        props: (route) => route.query,
        meta: { title: '自评', roles: ['common'], activeMenu: '/myTask/' },
      },
      {
        path: '/myEvaluation/mutualReview',
        component: () => import('@/views/myTask/myEvaluation/mutualReview.vue'),
        name: 'myEvaluation/mutualReview',
        hidden: true,
        props: (route) => route.query,
        meta: { title: '互评', roles: ['common'], activeMenu: '/myTask/' },
      },
      {
        path: '/myEvaluation/teacherReview',
        component: () => import('@/views/myTask/myEvaluation/teacherReview.vue'),
        name: 'myEvaluation/teacherReview',
        hidden: true,
        props: (route) => route.query,
        meta: { title: '师评', roles: ['common'], activeMenu: '/myTask/' },
      },
      {
        path: 'myHomework/index/',
        component: () => import('@/views/myTask/myHomework/index.vue'),
        name: 'myHomework/index/',
        hidden: false,
        meta: { title: '我的任务', roles: ['common'], activeMenu: '/myTask/' },

      },
      {
        path: 'myHomework/machineEvaluation/:taskId/:submitId',
        name: 'MachineEvaluation',
        component: () => import('@/views/myTask/myHomework/machineEvaluation.vue'),
        props: route => {
          return {
            taskId: route.params.taskId,
            submitId: route.params.submitId,
            fileNames: route.query.fileNames || '{}' // 提供默认值
          }
        },
        hidden: true,
        meta: { title: '提交作业', roles: ['common'], activeMenu: '/myTask/myHomework/' }
      },
      {
        path: 'myHomework/machineEvaluation/showmachineEvaluation',
        name: 'showmachineEvaluation',
        component: () => import('@/views/myTask/myHomework/showmachineEvaluation.vue'),
        props: route => {
          return {
            taskId: route.query.taskId,
            submitId: route.query.submitId,
            taskDetails: route.query.taskDetails ? JSON.parse(route.query.taskDetails) : {}
          }
        },
        hidden: true,
        meta: { title: '机评详情', roles: ['common'], activeMenu: '/myTask/myHomework/' }
      },
      {
        path: 'myHomework/machineEvaluation/showSelfReview',
        name: 'showSelfReview',
        component: () => import('@/views/myTask/myHomework/showSelfReview.vue'),
        props: route => ({
          taskId: route.query.taskId,
          submitId: route.query.submitId,
          taskDetails: route.query.taskDetails ? JSON.parse(route.query.taskDetails) : {}
        }),
        hidden: true,
        meta: { title: '自评详情', roles: ['common'], activeMenu: '/myTask/myHomework/' }
      },
      {
        path: 'myHomework/machineEvaluation/showMutualReview',
        name: 'showMutualReview',
        component: () => import('@/views/myTask/myHomework/showMutualReview.vue'),
        props: route => ({
          taskId: route.query.taskId,
          submitId: route.query.submitId,
          taskDetails: route.query.taskDetails ? JSON.parse(route.query.taskDetails) : {}
        }),
        hidden: true,
        meta: { title: '互评详情', roles: ['common'], activeMenu: '/myTask/myHomework/' }
      },
      {
        path: 'myHomework/machineEvaluation/showTeacherReview',
        name: 'showTeacherReview',
        component: () => import('@/views/myTask/myHomework/showTeacherReview.vue'),
        props: route => ({
          taskId: route.query.taskId,
          submitId: route.query.submitId,
          taskDetails: route.query.taskDetails ? JSON.parse(route.query.taskDetails) : {}
        }),
        hidden: true,
        meta: { title: '师评详情', roles: ['common'], activeMenu: '/myTask/myHomework/' }
      }
    ],
  },
  {
    path: '/homeworkTrial/',
    component: Layout,
    hidden: false,
    meta: { title: '特色功能', icon: 'star' },
    children: [
      {
        path: 'video/index',
        name: 'homeworkTrial_video',
        component: () => import('@/views/test/AIAnalysisTest.vue'),
        meta: { title: '演讲视频智能评价', roles: ['common'], icon: 'monitor' }
      },
      {
        path: 'audio/index',
        name: 'homeworkTrial_audio',
        component: () => import('@/views/homeworkTrial/audio/index.vue'),
        meta: { title: '英语语音智能评价', roles: ['common'], icon: 'phone' }
      },
      {
        path: 'chat/index',
        name: 'homeworkTrial_chat',
        component: () => import('@/views/chat/index'),
        meta: { title: '演讲稿智能写作', roles: ['common'], icon: 'edit' }
      }
    ]
  },

  {
    path: '/tool/gen-edit',
    component: Layout,
    hidden: true,
    // roles: ['admin'],
    // permissions: ['tool:gen:edit'],
    meta: { roles: ['admin'], permissions: ['system:user:edit'], icon: 'druid' },
    children: [
      {
        path: 'index/:tableId(\\d+)',
        component: () => import('@/views/tool/gen/editTable'),
        name: 'GenEdit',
        meta: { title: '修改生成配置', activeMenu: '/tool/gen' }
      }
    ]
  }
]

// 防止连续点击多次路由报错
let routerPush = Router.prototype.push;
let routerReplace = Router.prototype.replace;
// push
Router.prototype.push = function push(location) {
  return routerPush.call(this, location).catch(err => err)
}
// replace
Router.prototype.replace = function push(location) {
  return routerReplace.call(this, location).catch(err => err)
}

export default new Router({
  mode: 'history', // 去掉url中的#
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})


// // 在导入后打印具体内容
// console.log("Constant Routes:", JSON.parse(JSON.stringify(constantRoutes)));
// console.log("Dynamic Routes:", JSON.parse(JSON.stringify(dynamicRoutes)));
