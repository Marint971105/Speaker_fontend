import request from '@/utils/request';

/**
 * 创建班级接口
 * @param {Object} classData - 班级信息，包括班级名称、教师ID、教师姓名等
 * @returns {Promise} - 返回创建班级的结果
 */
export function createClass(classData) {
  return request({
    url: '/class/createClass',
    method: 'post',
    data: classData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 根据教师ID获取班级列表
 * @param {Number} teacherId - 教师ID
 * @returns {Promise} - 返回该教师的班级列表
 */
export function getClasses(teacherId) {
  return request({
    url: `/class/getClasses`,
    method: 'get',
    params: { teacherId },
  });
}

/**
 * 删除班级接口
 * @param {Number} classId - 班级ID
 * @returns {Promise} - 返回删除班级的结果
 */
export function deleteClass(classId) {
  return request({
    url: `/class/deleteClass`,
    method: 'get',
    params: {classId},
  });
}

export function getClassMembers(params) {
  return request({
    url: '/class/getMembers',
    method: 'get',
    params,  // 使用 params 传递对象
  });
}


// 获取申请列表
export function listApplications(params) {
  return request({
    url: '/class/listApplication',
    method: 'get',
    params,
  });
}

// 批准或拒绝申请
export function approveApplications(applicationUpdates) {
  return request({
    url: '/class/approveApplications',
    method: 'post',
    data: applicationUpdates,
  });
}
