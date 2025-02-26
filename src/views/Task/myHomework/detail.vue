“<template>
  <div class="homework-detail">
    <!-- 作业信息部分 -->
    <el-card class="box-card no-border">
      <div class="header">
        <h4>作业信息</h4>
      </div>
      <div class="divider" style="margin-bottom: 21px"></div>
      <el-descriptions title="" :border="False" column="2">
        <el-descriptions-item label="作业名称">{{ homeworkInfo.name }}</el-descriptions-item>
        <el-descriptions-item label="截止时间">{{ homeworkInfo.deadline }}</el-descriptions-item>
        <el-descriptions-item label="提交内容">{{ homeworkInfo.content }}</el-descriptions-item>
        <el-descriptions-item label="评审流程">{{ homeworkInfo.reviewProcess }}</el-descriptions-item>
        <el-descriptions-item label="分值">{{ homeworkInfo.totalScore }}</el-descriptions-item>
        <el-descriptions-item label="作业要求">{{ homeworkInfo.requirements }}</el-descriptions-item>
        <!-- 其中部分 -->
        <el-descriptions-item label="其中">
          <div>
            <div>视频 权重 {{ homeworkInfo.weights.video }}%</div>
            <div>音频 权重 {{ homeworkInfo.weights.audio }}%</div>
            <div>演讲稿 权重 {{ homeworkInfo.weights.text }}%</div>
            <div>PPT 权重 {{ homeworkInfo.weights.ppt }}%</div>
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 作业提交部分 -->
    <el-card class="box-card no-border" style="margin-top: 20px;">
      <div class="header">
        <h4>作业提交</h4>
      </div>
      <div class="divider" style="margin-bottom: 21px"></div>
      <el-table :data="homeworkFiles" border="false">
        <el-table-column prop="type" label="作业类型" width="180" align="center"></el-table-column>
        <el-table-column prop="fileName" label="文件名称" align="center"></el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="scope">
            <span v-if="scope.row.submitted">已提交</span>
            <span v-else>待提交</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template slot-scope="scope">
            <el-upload
              class="upload-demo"
              action="/upload"
              :on-success="handleUploadSuccess(scope.row.type)"
              :file-list="[]"
            >
              <el-button size="small" type="primary">点击上传</el-button>
            </el-upload>
          </template>
        </el-table-column>
      </el-table>
      <el-button type="primary" @click="submitHomework" style="margin-top: 20px;">提交</el-button>
    </el-card>

    <!-- 我的成绩部分 -->
    <el-card class="box-card no-border" style="margin-top: 20px; min-height: 300px;">
      <div class="header">
        <h4>我的成绩</h4>
      </div>
      <div class="divider" style="margin-bottom: 21px"></div>
      <el-table :data="myScores" border="false" fit="true" style="width: 100%; height: auto;">
        <!-- 固定的表头：视频、演讲稿、PPT、总分 -->
        <el-table-column label="作业类型" align="center">
          <template slot-scope="scope">
            <el-link v-if="scope.row.type === '机评'" type="primary" @click="goToMachineEvaluationPage">机评</el-link>
            <el-link v-if="scope.row.type === '自评'" type="primary" @click="goToSelfEvaluationPage">自评</el-link>
            <el-link v-if="scope.row.type === '师评'" type="primary" @click="goToTeacherEvaluationPage">师评</el-link>
          </template>
        </el-table-column>
        <el-table-column label="视频" align="center">
          <template slot-scope="scope">
            <span>{{ scope.row.videoScore ? scope.row.videoScore : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="演讲稿" align="center">
          <template slot-scope="scope">
            <span>{{ scope.row.textScore ? scope.row.textScore : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="PPT" align="center">
          <template slot-scope="scope">
            <span>{{ scope.row.pptScore ? scope.row.pptScore : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="总分" align="center">
          <template slot-scope="scope">
            <span>{{ scope.row.totalScore ? scope.row.totalScore : '-' }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { getHomeworkInfo, getHomeworkFiles, getMyScores, submitHomeworkFiles } from "@/api/task/WorkDetil";

export default {
  data() {
    return {

      homeworkInfo: {
        name: "寒假作业",
        deadline: "2024-03-01 00:00",
        content: "视频、音频、演讲稿、PPT",
        reviewProcess: "自评-机评",
        totalScore: "总分 100分",
        requirements: "视频、音频、演讲稿",
        weights: {
          video: 50,
          audio: 5,
          text: 40,
          ppt: 5
        } // 后端返回的权重数据
      }, // 作业信息
      homeworkFiles: [
        { type: "视频", fileName: "", submitted: false },
        { type: "演讲稿", fileName: "", submitted: false },
        { type: "PPT", fileName: "", submitted: false }
      ],
      myScores: [
        { type: "机评", videoScore:"100", textScore:"100", pptScore:"100", totalScore:"100"},
        { type: "自评", videoScore:"100", textScore:"100", pptScore:"100", totalScore:"100"},
        { type: "师评", videoScore:"100", textScore:"100", pptScore:"100", totalScore:"100"}
      ] // 我的成绩由后端动态获取
    };
  },
  created() {
    // this.fetchHomeworkInfo();
    this.fetchHomeworkFiles();
    // 暂时移除，现在先写死了看看
    // this.fetchMyScores();
  },
  methods: {


    // 获取作业信息
    fetchHomeworkInfo() {
      getHomeworkInfo().then(response => {
        this.homeworkInfo = response.data;
      }).catch(error => {
        console.error('获取作业信息失败:', error);
      });
    },
    // 获取已提交文件信息
    fetchHomeworkFiles() {
      getHomeworkFiles().then(response => {
        response.data.forEach(file => {
          const fileInfo = this.homeworkFiles.find(f => f.type === file.type);
          if (fileInfo) {
            fileInfo.fileName = file.fileName;
            fileInfo.submitted = true;
          }
        });
      }).catch(error => {
        console.error('获取作业文件失败:', error);
      });
    },
    // 获取我的成绩
    fetchMyScores() {
      getMyScores().then(response => {
        if (response.data && response.data.length > 0) {
          this.myScores = response.data; // 动态获取成绩并更新 myScores
        }
      }).catch(error => {
        console.error('获取成绩失败:', error);
      });
    },
    // 文件上传成功后的回调，更新文件状态
    handleUploadSuccess(fileType) {
      return (response, file, fileList) => {
        const fileInfo = this.homeworkFiles.find(f => f.type === fileType);
        if (fileInfo) {
          fileInfo.fileName = file.name;
          fileInfo.submitted = true;
        }
      };
    },
    // 提交作业
    submitHomework() {
      submitHomeworkFiles(this.homeworkFiles).then(() => {
        console.log("作业提交成功");
      }).catch(error => {
        console.error("作业提交失败:", error);
      });
    },
    // 跳转链接
    goToSelfEvaluationPage(id) {
      this.$router.push('/task/myHomework-detail/selfEvolution' );
    },
    goToMachineEvaluationPage(id) {
      const workId = id || 0;
      this.$router.push('/task/myHomework-detail/machineEvolution/' + workId);
    },
    goToTeacherEvaluationPage(id) {
      const workId = id || 0;
      this.$router.push('/task/myHomework-detail/teacherEvolution/' + workId);
    }
  }
};
</script>

<style scoped>
.homework-detail {
  padding: 20px;
}

.header {
  font-size: 16px;
  font-weight: bold;
  margin-top: 10px;
}

.box-card {
  margin-bottom: 40px; /* 增加卡片之间的空隙 */
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2); /* 添加轻微阴影 */
  border-radius: 8px; /* 增加圆角效果 */
  transition: box-shadow 0.3s ease, transform 0.3s ease; /* 添加平滑的阴影和变换效果 */
  background-color: #fff; /* 确保卡片背景为白色 */
}

.divider {
  height: 1px;
  background: #dcdcdc;
  width: 100%;
  margin: 0 auto;
}

.header h3, .header h4 {
  color: #333; /* 设置标题颜色 */
  margin-bottom: 10px; /* 增加标题的底部间距 */
}


.box-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2); /* 增强悬停时的阴影效果 */
  transform: translateY(-5px); /* 悬停时卡片上移，增强立体感 */
}

.el-card__header {
  border-bottom: 1px solid #ebeef5; /* 为卡片标题添加分割线 */
}

.header h3, .header h4 {
  color: #333; /* 设置标题颜色 */
  margin-bottom: 10px; /* 增加标题的底部间距 */
}

/* 去掉边框 */
.no-border {
  border: none !important;
}

/* 表头居中 */
.el-table th {
  text-align: center;
}

/* 去掉表格的竖向边框 */
.el-table th,
.el-table td {
  border-right: none !important;
  border-left: none !important;
}


</style>
