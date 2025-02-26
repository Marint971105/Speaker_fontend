import request from '@/utils/request'

// 检查任务是否包含机评环节
export function checkHasMachineEvaluation(taskDetails) {
  if (!taskDetails || !taskDetails.evaluationMethods) {
    return false;
  }
  return taskDetails.evaluationMethods.includes('机评');
}
// 轮询函数
async function pollGradeResult(getGradeFunc, ...params) {
  const MAX_TIMEOUT = 120 * 1000;      // 1分钟
  const POLL_INTERVAL = 60 * 1000;    // 15秒
  const MAX_ATTEMPTS = Math.floor(MAX_TIMEOUT / POLL_INTERVAL);  // 4次

  const startTime = Date.now();

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (Date.now() - startTime >= MAX_TIMEOUT) {
      throw new Error('评分超时（超过1分钟），请稍后在历史记录中查看结果');
    }

    console.log(`第${attempt + 1}次尝试获取评分结果...`);
    const response = await getGradeFunc(...params);

    if (response.code === 1) {
      const evaluation = extractMachineEvaluation(response);
      const hasFinishedEvaluation = Object.values(evaluation || {}).some(
        item => item && item.finished && item.grade !== null
      );

      if (hasFinishedEvaluation) {
        console.log('获取到评分结果');
        return response;  // 返回原始response，保持与原有逻辑一致
      }
    }

    console.log(`等待${POLL_INTERVAL / 1000}秒后重试...`);
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
  }

  throw new Error('评分超时（超过1分钟），请稍后在历史记录中查看结果');
}


// 获取视频评分
export function getVideoGrade(stuId, taskId) {
  return request({
    url: `/task/getVideoGradeMachine`,
    method: 'get',
    params: {
      stuId,
      taskId
    },
    timeout: 60000,  // 30秒超时
  })
}

// 获取其他类型评分（音频、演讲稿等）
export function getPaperGrade(stuId, taskId, reviewType) {
  return request({
    url: `/task/getPaperGrade`,
    method: 'get',
    params: {
      stuId,
      taskId,
      reviewType
    },
    timeout: 60000,  // 30秒超时
  });
}
export function getSubmissionInfoById(submissionId) {
  return request({
    url: `/task/getSubmissionInfoById`,
    method: 'get',
    params: { submissionId }
  });
}
// 提取机评数据
export function extractMachineEvaluation(data) {
  if (!data?.data?.evaluationTypes) {
    return null;
  }

  // 查找机评部分
  const machineEval = data.data.evaluationTypes.find(
    type => type.evaluationMethod === "机评"
  );

  if (!machineEval) {
    return null;
  }

  // 按照 evaluationContent 分类保存评价内容
  const evaluationResults = {};

  machineEval.evaluationContents.forEach(content => {
    evaluationResults[content.evaluationContent] = {
      finished: content.finished,
      grade: content.grade,
      evaluationTitle: content.evaluationTitle,
      evaluationDimensions: content.evaluationDimensions
    };
  });

  return evaluationResults;
}

// // 获取PPT评分
// export function getPPTGrade(stuId, taskId) {
//   return request({
//     url: `/task/getPaperGrade`,
//     method: 'get',
//     params: {
//       stuId,
//       taskId,
//       reviewType: 'PPT'
//     },
//     timeout: 60000
//   })
// }

export async function fetchAllGrades(stuId, taskId, taskDetails) {
  // 检查是否包含机评环节
  if (!checkHasMachineEvaluation(taskDetails)) {
    console.log('该任务不包含机评环节，跳过获取机评分数');
    return null;
  }

  // 检查taskDetails是否存在且包含submissionTypes
  if (!taskDetails?.submissionTypes) {
    console.log('未找到作业提交要求，跳过获取评分');
    return null;
  }

  const results = {};
  const promises = [];

  // 为每个需要的评分类型创建Promise
  taskDetails.submissionTypes.forEach(type => {
    switch (type) {
      case '视频':
        promises.push(
          getVideoGrade(stuId, taskId)
            .then(response => {
              if (response.code === 1) {
                const evaluation = extractMachineEvaluation(response);
                if (evaluation) {
                  Object.assign(results, evaluation);
                  console.log('视频评分获取成功:', evaluation);
                }
              } else {
                console.error('获取视频评分失败:', response.msg);
              }
            })
            .catch(error => console.error('获取视频评分出错:', error))
        );
        break;

      case '音频':
        promises.push(
          getPaperGrade(stuId, taskId, '音频')
            .then(response => {
              if (response.code === 1) {
                const evaluation = extractMachineEvaluation(response);
                if (evaluation) {
                  Object.assign(results, evaluation);
                  console.log('音频评分获取成功:', evaluation);
                }
              } else {
                console.error('获取音频评分失败:', response.msg);
              }
            })
            .catch(error => console.error('获取音频评分出错:', error))
        );
        break;

      case '演讲稿':
        promises.push(
          getPaperGrade(stuId, taskId, '演讲稿')
            .then(response => {
              if (response.code === 1) {
                const evaluation = extractMachineEvaluation(response);
                if (evaluation) {
                  Object.assign(results, evaluation);
                  console.log('演讲稿评分获取成功:', evaluation);
                }
              } else {
                console.error('获取演讲稿评分失败:', response.msg);
              }
            })
            .catch(error => console.error('获取演讲稿评分出错:', error))
        );
        break;

      case 'PPT':
        promises.push(
          getPaperGrade(stuId, taskId, 'PPT')
            .then(response => {
              if (response.code === 1) {
                const evaluation = extractMachineEvaluation(response);
                if (evaluation) {
                  Object.assign(results, evaluation);
                  console.log('PPT评分获取成功:', evaluation);
                }
              } else {
                console.error('获取PPT评分失败:', response.msg);
              }
            })
            .catch(error => console.error('获取PPT评分出错:', error))
        );
        break;

      default:
        console.log(`未知的提交类型: ${type}`);
    }
  });

  // 并行获取所有评分
  await Promise.all(promises);

  console.log('所有评分获取完成:', results);
  return Object.keys(results).length > 0 ? results : null;
}
