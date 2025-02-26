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
