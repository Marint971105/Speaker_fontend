import request from '@/utils/request'

// 登录方法
export function login(username, password) {
  const data = {
    userName:username,
    password:password,
  }
  return request({
    url: '/login',
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'post',
    data: data
  })
}


//学生注册方法
export function registerStudent(data) {
  return request({
    url: '/create/StudentAccount',
    method: 'post',
    data: data
  })
}
//教师注册方法
export function registerTeacher(data) {
  return request({
    url: '/create/TeacherAccount',
    method: 'post',
    data: data
  })
}
//学生注册方法
export function registerAdmin(formdata) {
  return request({
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    url: '/create/AdminAccount',
    method: 'post',
    data: formdata
  })
}
// 注册方法 (url: '/register')
// export function register(data) {
//   return request({
//     url: '/register',
//     // url:'create/StudentAccount',
//     headers: {
//       isToken: false
//     },
//     method: 'post',
//     data: data
//   })
// }

// 获取用户详细信息
export function getInfo() {
  return request({
    // url: '/getInfo',
    url: '/login/verifyToken',
    method: 'get'
  })
}
//
// 退出方法
// export function logout() {
//   return request({
//     url: '/logout',
//     method: 'post'
//   })
// }

// 获取验证码
// export function getCodeImg() {
//   return request({
//     url: '/captchaImage',
//     headers: {
//       isToken: false
//     },
//     method: 'get',
//     timeout: 20000
//   })
// }
