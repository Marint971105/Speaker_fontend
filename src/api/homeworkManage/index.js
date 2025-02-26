import request from '@/utils/request'; // 假设您使用了 request.js 进行 axios 封装
// 删除教师任务接口
export function deleteTeacherTask(taskId) {
  return request({
    url: `/task/deleteTask?taskId=${taskId}`,
    method: 'get',
  });
}

// 获取教师作业数据接口
export function getHomeworkData(ownerId) {
  return request({
    url: '/task/getTasksById',
    method: 'get',
    params: { ownerId },
  });
}

export function getEvaluationByTaskIdAndStudId(taskId, studId) {
  return request({
    url: `/task/getEvaluationByTaskIdAndStuId?taskId=${taskId}&stuId=${studId}`,
    method: 'get',
  });
}

export function getAllSubmitsByTaskId(taskId, page, pageSize) {
  return request({
    url: '/task/getAllSubmitsByTaskId',
    method: 'get',
    params: {
      taskId,
      page,
      pageSize
    }
  });
}
export function getAllGradesByTaskId(taskId, page, pageSize) {
  return request({
    url: '/task/getAllGradesByTaskId',
    method: 'get',
    params: {
      taskId,
      page,
      pageSize
    }
  });
}
