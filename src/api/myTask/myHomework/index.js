import request from '@/utils/request';

export function getSubmissionsByStuId(studentId) {
  return request({
    url: `/task/getSubmissionsByStuId`,
    method: 'get',
    params: { studentId }
  });
}

export function getTaskInfoById(taskId) {
  return request({
    url: `/task/getTaskInfoById`,
    method: 'get',
    params: { taskId }
  });
}

export function getInfoById(userId) {
  // console.log('userId:',userId)
  return request({
    url: `/member/getInfoById?userId=${userId}`, // 将userId作为路径参数传递
    method: 'get'
  });
}


// src/api/myTask/myHomework/index.js

// 上传视频文件
export function uploadVideoTask(data) {
  return request({
    url: '/file/uploadVideoTask',
    method: 'post',
    data,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

// 上传音频文件
export function uploadAudioTask(data) {
  return request({
    url: '/file/uploadAudioTask',
    method: 'post',
    data,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

// 上传Word文件
export function uploadWordTask(data) {
  return request({
    url: '/file/uploadWordTask',
    method: 'post',
    data,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

// 上传PPT文件
export function uploadPPTTask(data) {
  return request({
    url: '/file/uploadPPTTask',
    method: 'post',
    data,
    headers: { 'Content-Type': 'multipart/form-data' }
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
