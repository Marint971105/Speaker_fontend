import request from '@/utils/request'; // 假设您使用了 request.js 进行 axios 封装

export function uploadTaskAssignment(formData) {
  return request({
    url: '/task/uploadTask',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(response => {
    console.log('作业上传成功', response);
    return response;
  }).catch(error => {
    console.error('作业上传失败', error);
    throw error; // 抛出错误，以便调用者可以处理
  });
}
