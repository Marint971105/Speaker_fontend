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

/**
 * 下载学生信息导入模板
 * 作用：供教师下载Excel模板文件，模板包含正确的表头格式
 * @returns {Promise} - 返回模板文件（二进制流）
 */
export function downloadImportTemplate() {
  return request({
    url: '/class/downloadImportTemplate',
    method: 'get',
    responseType: 'blob'  // 重要：指定响应类型为blob，用于处理文件下载
  });
}

/**
 * 批量导入学生到班级
 * 作用：上传填写好的Excel文件，后端会自动创建新账户并将学生加入班级
 * @param {File} file - Excel文件对象（.xlsx 或 .xls格式）
 * @param {Number} classId - 要导入到的班级ID
 * @returns {Promise} - 返回导入结果（包含成功数、失败数、失败详情等）
 */
export function importStudents(file, classId) {
  const formData = new FormData();
  formData.append('file', file);      // 将文件添加到表单数据
  formData.append('classId', classId); // 将班级ID添加到表单数据
  
  return request({
    url: '/class/importStudents',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'  // 重要：指定为表单数据类型，用于文件上传
    }
  });
}

/**
 * 生成班级二维码URL
 * 作用：生成包含班级ID的二维码图片URL，学生扫码后会跳转到登录页面并自动加入班级
 * @param {Number} classId - 班级ID
 * @param {Number} width - 二维码宽度，默认300
 * @param {Number} height - 二维码高度，默认300
 * @returns {String} - 返回二维码图片的URL
 */
export function generateQRCodeUrl(classId, width = 300, height = 300) {
  // 获取前端登录页的完整URL（需要根据实际部署环境配置）
  const frontendUrl = process.env.VUE_APP_BASE_URL || window.location.origin;
  // 项目使用history模式，URL中不需要 # 号
  // 修改为跳转到扫码验证页面
  const loginUrl = `${frontendUrl}/qrcode-verify?classId=${classId}`;
  
  // 构造二维码生成接口的URL
  // 添加 /api/ 前缀，确保Nginx正确代理到后端
  const qrcodeUrl = `/api/qrcode?url=${encodeURIComponent(loginUrl)}&width=${width}&height=${height}`;
  
  return qrcodeUrl;
}

/**
 * 已登录用户加入班级（扫码进班的核心接口）
 * 作用：学生登录后自动调用此接口加入班级
 * @param {Number} classId - 要加入的班级ID
 * @returns {Promise} - 返回加入结果
 */
export function loginAccountAndAttend(classId) {
  return request({
    url: '/loginAccountAndAttend',
    method: 'get',
    params: { classId }
  });
}

/**
 * 从班级中删除学生（支持批量删除）
 * 作用：教师从班级中移除一个或多个学生
 * @param {Number} classId - 班级ID
 * @param {Array<Number>} studentIds - 要删除的学生ID数组
 * @returns {Promise} - 返回删除结果
 */
export function deleteStudentsFromClass(classId, studentIds) {
  return request({
    url: '/class/deleteStuByIds',
    method: 'post',
    data: {
      classId: classId,
      deleteStuIds: studentIds
    }
  });
}

/**
 * 更新班级信息
 * 作用：修改已创建班级的信息（班级名称、介绍、目标、学期、开始时间、截止日期）
 * @param {Object} classData - 班级信息，必须包含classId
 * @returns {Promise} - 返回更新结果
 */
export function updateClass(classData) {
  return request({
    url: '/class/updateClass',
    method: 'post',
    data: classData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
