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
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 1200000 // 20分钟超时，支持大文件上传（400M+）
  });
}

// 上传音频文件
export function uploadAudioTask(data) {
  return request({
    url: '/file/uploadAudioTask',
    method: 'post',
    data,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 180000 // 3分钟超时，音频文件中等大小
  });
}

// 上传Word文件
export function uploadWordTask(data) {
  return request({
    url: '/file/uploadWordTask',
    method: 'post',
    data,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000 // 2分钟超时，Word文件相对较小
  });
}

// 上传PPT文件
export function uploadPPTTask(data) {
  return request({
    url: '/file/uploadPPTTask',
    method: 'post',
    data,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 180000 // 3分钟超时，PPT文件中等大小
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
