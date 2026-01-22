import request from '@/utils/request';

export function getTaskInfoById(taskId) {
  return request({
    url: `/task/getTaskInfoById`,
    method: 'get',
    params: { taskId }
  });
}


// 获取学生评分数据
export function getEvaluationByTaskIdAndStuId(taskId, stuId) {
  return request({
    url: '/task/getEvaluationByTaskIdAndStuId',
    method: 'get',
    params: {
      taskId,
      stuId
    }
  })
}

export function getReviewTaskByStuId(reviewerId) {
  return request({
    url: '/task/getReviewTaskByStuId',
    method: 'get',
    params: {
      reviewerId
    }
  })
}

// 批量获取学生信息
export function getStuByIds(data) {
  return request({
    url: '/members/getStuByIds',
    method: 'post',
    data: {
      page: data.page || 1,
      pageSize: data.pageSize || 10,
      stuIds: data.stuIds
    }
  })
}


export function submitEvaluation(data) {
  return request({
    url: '/task/setGrade',
    method: 'post',
    data
  });
}
// 获取学生作业列表
export function getSubmissionsByStuId(studentId) {
  return request({
    url: '/task/getSubmissionsByStuId',
    method: 'get',
    params: { studentId }
  })
}

// 根据任务ID和学生ID获取学生提交信息
export function getSubmissionByTaskIdAndStudentId(taskId, studentId) {
  return request({
    url: '/task/getSubmissionByTaskIdAndStudentId',
    method: 'get',
    params: { taskId, studentId }
  })
}
// 获取文件
// file-service是独立服务，通过Nginx代理
// 使用 request 函数，会自动添加 /api 前缀，与上传接口保持一致
export function showFile(fileType, fileName) {
  // 根据文件类型设置不同的超时时间
  // 视频和音频文件通常较大，需要更长的超时时间
  let timeout = 60000; // 默认60秒
  if (fileType === 'video' || fileType === 'audio') {
    timeout = 600000; // 视频和音频文件：10分钟超时
  } else if (fileType === 'word' || fileType === 'ppt') {
    timeout = 120000; // Word和PPT文件：2分钟超时
  }
  
  return request({
    url: '/file/showFile',  // request 函数会自动添加 /api 前缀，变成 /api/file/showFile
    method: 'get',
    params: {
      fileType,
      fileName
    },
    responseType: 'blob', // 设置响应类型为blob
    timeout: timeout, // 根据文件类型动态设置超时时间
  })
}
