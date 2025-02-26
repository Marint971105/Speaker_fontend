import request from '@/utils/request'; // 假设您使用了 request.js 进行 axios 封装

export function assignStudentsToTask(taskId, stuIds) {
  return request({
    url: '/task/assignStudents',
    method: 'post',
    data: {
      taskId: taskId,
      stuIds: stuIds,
    },
  })
    .then(response => {
      console.log('任务分配成功', response);
      return response;
    })
    .catch(error => {
      console.error('任务分配失败', error);
      throw error; // 抛出错误，以便调用者可以处理
    });
}

export function setReviewTeachers(taskId, teacherIds) {
  return request({
    url: '/task/setReviewTeachers',
    method: 'post',
    data: {
      taskId: taskId,
      teacherId: teacherIds, // 这里teacherId 是一个数组，接口中需要传递多个教师ID
    },
  });
}

// 获取任务详情
export function getTaskInfoById(taskId) {
  return request({
    url: `/task/getTaskInfoById`,
    method: 'get',
    params: { taskId },
  });
}

// 分配互评
export function setReviewStudents({ taskId, stuIds, allocateStudents, reAllocate }) {
  return request({
    url: `/task/setReviewStudents`,
    method: 'post',
    data: {
      taskId,
      stuIds,
      allocateStudents,
      reAllocate,
    },
  });
}
export function setTaskEvaluation({ taskId, evaluationDimensions }) {
  return request({
    url: `/task/setTaskEvaluation`,
    method: 'post',
    data: {
      taskId,
      evaluationDimensions,
    },
  });
}

