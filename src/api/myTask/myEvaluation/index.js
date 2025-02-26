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
    url: 'task/getReviewTaskByStuId',
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
// 获取文件
export function showFile(fileType, fileName) {
  return request({
    url: '/file/showFile',
    method: 'get',
    params: {
      fileType,
      fileName
    },
    responseType: 'blob', // 设置响应类型为blob
    timeout: 60000, // 文件较大，设置更长的超时时间
  })
}
