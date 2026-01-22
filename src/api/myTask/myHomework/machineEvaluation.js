import request from '@/utils/request'

// 检查任务是否包含机评环节
export function checkHasMachineEvaluation(taskDetails) {
  if (!taskDetails || !taskDetails.evaluationMethods) {
    return false;
  }
  return taskDetails.evaluationMethods.includes('机评');
}
// 智能轮询函数 - 使用递增间隔策略
async function pollGradeResult(getGradeFunc, ...params) {
  const MAX_TIMEOUT = 600 * 1000;      // 10分钟总超时
  const INITIAL_INTERVAL = 10 * 1000;  // 初始10秒间隔
  const MAX_INTERVAL = 60 * 1000;      // 最大60秒间隔
  const INTERVAL_MULTIPLIER = 1.2;     // 间隔递增倍数

  const startTime = Date.now();
  let currentInterval = INITIAL_INTERVAL;
  let attempt = 0;

  while (Date.now() - startTime < MAX_TIMEOUT) {
    attempt++;
    console.log(`第${attempt}次尝试获取评分结果... (间隔: ${currentInterval/1000}秒)`);
    
    try {
      const response = await getGradeFunc(...params);

      if (response.code === 1) {
        const evaluation = extractMachineEvaluation(response);
        const hasFinishedEvaluation = Object.values(evaluation || {}).some(
          item => item && item.finished && item.grade !== null
        );

        if (hasFinishedEvaluation) {
          console.log('获取到评分结果');
          return response;
        }
      }
    } catch (error) {
      // 如果是超时或网络错误，继续轮询
      if (error.code === 'ECONNABORTED' || error.message.includes('504') || error.message.includes('timeout')) {
        console.warn(`第${attempt}次尝试遇到网络问题，继续轮询...`);
      } else {
        // 其他错误直接抛出
        throw error;
      }
    }

    // 检查是否还有时间继续轮询
    if (Date.now() - startTime + currentInterval >= MAX_TIMEOUT) {
      break;
    }

    console.log(`等待${currentInterval / 1000}秒后重试...`);
    await new Promise(resolve => setTimeout(resolve, currentInterval));
    
    // 递增间隔时间，但不超过最大间隔
    currentInterval = Math.min(currentInterval * INTERVAL_MULTIPLIER, MAX_INTERVAL);
  }

  throw new Error('评分超时（超过10分钟），请稍后在历史记录中查看结果');
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
    timeout: 600000,  // 10分钟超时
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
    timeout: 600000,  // 10分钟超时
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
            .catch(error => {
              console.error('获取视频评分出错:', error);
              // 如果是超时或504错误，不影响其他评分的获取
              if (error.code === 'ECONNABORTED' || error.message.includes('504') || error.message.includes('timeout')) {
                console.warn('视频评分可能仍在处理中，将在后续轮询中重试');
              }
            })
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
            .catch(error => {
              console.error('获取音频评分出错:', error);
              if (error.code === 'ECONNABORTED' || error.message.includes('504') || error.message.includes('timeout')) {
                console.warn('音频评分可能仍在处理中，将在后续轮询中重试');
              }
            })
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
            .catch(error => {
              console.error('获取演讲稿评分出错:', error);
              if (error.code === 'ECONNABORTED' || error.message.includes('504') || error.message.includes('timeout')) {
                console.warn('演讲稿评分可能仍在处理中，将在后续轮询中重试');
              }
            })
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
            .catch(error => {
              console.error('获取PPT评分出错:', error);
              if (error.code === 'ECONNABORTED' || error.message.includes('504') || error.message.includes('timeout')) {
                console.warn('PPT评分可能仍在处理中，将在后续轮询中重试');
              }
            })
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
