<template>
  <div class="assignment-wrapper">
    <!-- assignment 是从后端获取的列表信息 里面包含各种元素-->
    <el-card
      v-for="assignment in descriptionData"
      :key="assignment.userId"
      class="assignment-card"
    >
      <div class="card-header">
        <!-- 加大字体并加粗作业名称 -->
        <h3 class="assignment-title">作业名称：{{ assignment.userName }}</h3>
      </div>
      <!-- 增加标题与描述信息之间的间距 -->
      <div class="card-body">
        <!-- 左侧描述内容部分 -->
        <div class="description-wrapper">
          <div class="description-content">
            <!-- 两两并列的内容 -->
            <span>提交内容：{{ assignment.nickName }}</span>
            <span>评阅流程：{{ assignment.review }}</span>
            <span>截止日期：{{ assignment.createTime }}</span>
            <span>教师：{{ assignment.phonenumber }}</span>
          </div>
        </div>
        <!-- 右侧查看作业按钮 -->
        <el-button
          type="primary"
          class="view-button"
          @click="viewAssignment(assignment.id)"
        >

          查看作业
        </el-button>
      </div>
    </el-card>
  </div>

</template>


<script>
import { listMyHomeWork } from "@/api/task/myHomework";

export default {
  data() {
    return {
      descriptionData: []
    };
  },
  created() {
    this.getList();
  },
  methods: {
    getList() {
      listMyHomeWork().then(response => {
        this.descriptionData = response.data;
      });
    },
    viewAssignment(id) {
      // 跳转到作业详情页面，传递作业的 id 作为参数
      const workId  = id || 0;
      this.$router.push('/task/myHomework-detail/index/' + workId)
    }
  }
};
</script>

<style scoped>
.assignment-wrapper {
  padding: 20px;
}
.assignment-card {
  margin-bottom: 20px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  position: relative;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2); /* 添加轻微阴影 */
  border-radius: 8px; /* 增加圆角效果 */
  transition: box-shadow 0.3s ease, transform 0.3s ease; /* 添加平滑的阴影和变换效果 */
  background-color: #f1f1f1; /* 确保卡片背景为白色 */
}

.card-header h3 {
  margin-bottom: 20px; /* 增加作业名称与描述内容之间的距离 */

}

.assignment-title {
  font-size: 18px; /* 放大字体 */
  font-weight: bold; /* 加粗 */
}

.card-body {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
}

.description-wrapper {
  flex: 1;
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  margin-bottom: 2px;
}

.description-content {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  width: 100%;
}

.description-content span {
  width: 45%; /* 使每个描述项占据一半的宽度 */
  margin-bottom: 10px;
}

.view-button {
  position: absolute;
  right: 30px;
  bottom: 30px;
  font-size: 15px; /* 增大字体 */
  padding: 12px 24px; /* 增加按钮的内边距 */
}
</style>
