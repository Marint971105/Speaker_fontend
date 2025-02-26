<template>
  <div class="my-tasks">
    <h2 class="title">我的作业</h2>
    <div v-for="task in tasks" :key="task.taskId" class="task-card">
      <el-card class="task-card-content">
        <div class="task-header">
          <h3 class="task-name">作业名称: {{ task.taskName }}</h3>
          <el-button size="mini" class="view-button" @click="viewTaskDetails(task)">查看作业</el-button>
        </div>
        <div class="task-info-grid">
          <div>
            <p>提交内容: {{ task.submissionTypes.join(', ') }}</p>
          </div>
          <div>
            <p>评价流程: {{ task.evaluationMethods.join('-') }}</p>
          </div>
          <div>
            <p>截止日期: {{ formatDeadline(task.deadline) }}</p>
          </div>
          <div>
            <p>教师: {{ task.ownerName || '无' }}</p> <!-- 使用 ownerName 直接显示教师 -->
          </div>
          <div>
            <p :class="{'status-completed': task.completionStatus === '已完成', 'status-uncompleted': task.completionStatus === '未完成'}">
              完成状态: {{ task.completionStatus }}
            </p> <!-- 根据完成状态显示不同颜色 -->
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { getSubmissionsByStuId, getTaskInfoById } from '@/api/myTask/myHomework/index';
import { mapGetters } from 'vuex';

export default {
  data() {
    return {
      tasks: [],
    };
  },
  computed: {
    ...mapGetters(['userId']),
  },
  async created() {
    await this.fetchTasks();
  },
  methods: {
    async fetchTasks() {
      try {
        const response = await getSubmissionsByStuId(this.userId);
        if (response.code === 1) {
          // 保存原始数据用于后续获取fileName
          this.originalSubmissions = response.data.rows;
          const taskPromises = response.data.rows.map(async (task) => {
            const taskInfo = await getTaskInfoById(task.taskId);
            const taskData = taskInfo.data;
            taskData.submitId = task.id;
            taskData.taskId = task.taskId;

            // 直接使用 `ownerName` 作为教师名称
            taskData.ownerName = taskData.ownerName || '无';

            // 根据完成状态设置显示文本
            taskData.completionStatus = task.finished ? '已完成' : '未完成';

            return taskData;
          });

          this.tasks = await Promise.all(taskPromises);
        }
      } catch (error) {
        console.error('获取任务数据失败：', error);
      }
    },

    viewTaskDetails(task) {
      const { submitId, taskId } = task;
      const submission = this.originalSubmissions.find(s => s.id === submitId);

      // 确保有submission且有taskInfos
      if (submission && submission.taskInfos) {
        const fileNamesObj = submission.taskInfos.reduce((acc, info) => {
          acc[info.submissionType] = info.fileName;
          return acc;
        }, {});

        this.$router.push({
          name: 'MachineEvaluation',
          params: { submitId, taskId },
          query: {
            fileNames: JSON.stringify(fileNamesObj)
          }
        });
      } else {
        // 处理错误情况
        this.$message.error('无法获取作业信息');
      }
    },

    formatDeadline(deadline) {
      const date = new Date(deadline);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
  },
};
</script>

<style scoped>
.my-tasks {
  padding: 20px;
}

.title {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
  font-weight: normal;
  text-align: left;
  box-shadow: none;
  text-shadow: none;
}

.task-card {
  margin-bottom: 20px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-name {
  font-size: 12px;
  font-weight: bold;
}

.view-button {
  margin-right: 10px;
}

.task-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px; /* 增加间距 */
  margin-top: 8px;
}

.task-info-grid p {
  font-size: 11px;
  margin: 0;
}

.status-completed {
  color: green; /* 已完成状态显示绿色 */
}

.status-uncompleted {
  color: red; /* 未完成状态显示红色 */
}

.task-card-content {
  transition: box-shadow 0.3s ease, border 0.3s ease;
}

.task-card-content:hover {
  border: 1px solid #dcdcdc;
  border-radius: 8px;
}
</style>
