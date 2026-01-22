import request from '@/utils/request';

// 获取所有班级信息
export function getAllClasses(params) {
  return request({
    url: '/class/getAllClasses',
    method: 'get',
    params,
  });
}

// 获取班级成员
export function getClassMembers(params) {
  return request({
    url: '/class/getMembers',
    method: 'get',
    params,
  });
}

export function applyClass(formData) {
  return request({
    url: '/class/applyClass',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }  // 设置头部为 form-data
  });
}

// 定义 searchApplicationStatus 函数
export function searchApplicationStatus(params) {
  return request({
    url: '/class/searchApplicationStatus',
    method: 'GET',
    params: {
      stuId: params.stuId,
    },
  });
}

export function getApplicationsByClassId(params) {
  return request({
    url: '/class/getApplicationsByClassId',
    method: 'get',
    params
  })
}

// 获取学生已加入的班级列表
export function getMyClasses(params) {
  return request({
    url: '/class/stuBelongs',
    method: 'get',
    params: {
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      studentId: params.studentId
    }
  });
}

// 学生主动退出班级
export function leaveClass(params) {
  return request({
    url: '/class/leaveClass',
    method: 'post',
    params: {
      classId: params.classId,
      studentId: params.studentId
    }
  });
}
