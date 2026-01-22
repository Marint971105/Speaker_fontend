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

// 根据作业ID获取相关班级的任课教师
export function getClassTeachersByTaskId(taskId) {
  return request({
    url: `/task/getClassTeachersByTaskId`,
    method: 'get',
    params: { taskId },
  });
}

// 更新任务附件（支持上传新文件和删除旧文件）
export function updateTaskAttachments(taskId, files, keepFilePaths) {
  const formData = new FormData();
  formData.append('taskId', taskId);
  if (files && files.length > 0) {
    files.forEach(file => {
      formData.append('files', file.raw || file); // 支持el-upload的file对象
    });
  }
  // 添加要保留的文件路径列表
  if (keepFilePaths && keepFilePaths.length > 0) {
    keepFilePaths.forEach(filePath => {
      formData.append('keepFilePaths', filePath);
    });
  }
  return request({
    url: '/task/updateAttachments',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

// 取消分配学生
export function unassignStudentsFromTask(taskId, stuIds) {
  return request({
    url: '/task/deleteAssigned',
    method: 'post',
    data: {
      taskId: taskId,
      stuIds: stuIds,
    },
  })
    .then(response => {
      console.log('取消分配成功', response);
      return response;
    })
    .catch(error => {
      console.error('取消分配失败', error);
      throw error;
    });
}

// 更新任务截止日期
export function updateTaskDeadline(taskId, deadline) {
  return request({
    url: '/task/updateDeadline',
    method: 'post',
    params: {
      taskId: taskId,
      deadline: deadline,
    },
  });
}

