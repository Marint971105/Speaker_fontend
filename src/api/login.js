import request from '@/utils/request'
import { tansParams } from '@/utils/ruoyi'

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
    transformRequest: [(params) => { return tansParams(params) }],
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: data
  })
}
//教师注册方法
export function registerTeacher(data) {
  return request({
    url: '/create/TeacherAccount',
    method: 'post',
    transformRequest: [(params) => { return tansParams(params) }],
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: data
  })
}
//管理员注册方法
export function registerAdmin(formdata) {
  return request({
    url: '/create/AdminAccount',
    method: 'post',
    transformRequest: [(params) => { return tansParams(params) }],
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

// 检查手机号是否存在（扫码验证用）
export function checkMobile(mobile) {
  return request({
    url: '/checkMobile',
    method: 'get',
    params: { mobile }
  })
}

// 发送手机验证码（忘记密码用）
export function sendSmsCode(mobile) {
  return request({
    url: '/sendSmsCode',
    method: 'post',
    params: { mobile }
  })
}

// 通过验证码重置密码
export function resetPasswordBySms(mobile, smsCode, newPassword) {
  return request({
    url: '/account/resetPasswordBySms',
    method: 'post',
    params: { mobile, smsCode, newPassword }
  })
}

// 更新用户手机号（如果用户没有手机号或为空）
export function updateMobileIfEmpty(userId, mobile) {
  return request({
    url: '/account/updateMobile',
    method: 'post',
    params: { userId, mobile }
  })
}

// 更新用户手机号（CAS认证登录用，允许覆盖现有手机号）
export function updateMobileForCas(userId, mobile) {
  return request({
    url: '/account/updateMobileForCas',
    method: 'post',
    params: { userId, mobile }
  })
}

// 检查用户身份（根据学号查询，返回部分信息用于验证）
export function checkUserIdentity(studentId) {
  return request({
    url: '/account/checkUserIdentity',
    method: 'post',
    params: { studentId }
  })
}

// 通过身份信息重置密码（学号+姓名+手机号）
export function resetPasswordByIdentity(studentId, nickName, mobile, newPassword) {
  return request({
    url: '/account/resetPasswordByIdentity',
    method: 'post',
    params: { studentId, nickName, mobile, newPassword }
  })
}