<template>
  <div class="assignment-detail">
    <!-- 作业信息 -->
    <el-card class="box-card">
      <div slot="header" class="clearfix">
          <span>作业信息</span> <!-- 显示 ownerName -->
      </div>
      <el-form label-width="120px" >
        <el-row>
          <el-col :span="12">
            <el-form-item label="作业名称:" required>
              <el-input v-model="assignment.name" placeholder="请输入作业名称，不超过100个字符"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止日期:" required>
              <el-date-picker v-model="assignment.deadline" type="datetime" placeholder="2024-09-20 00:00:00"></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="作业描述:">
              <el-input
                type="textarea"
                v-model="assignment.description"
                placeholder="请输入作业描述"
                :maxlength="50"
              @input="handleInput"
              ></el-input>
              <span v-if="descriptionLength > 50" style="color: red;">输入字数过多！</span> <!-- 提示信息 -->
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="作业附件:">
              <el-upload
                class="upload-demo"
                action="https://fake-upload-url.com"
                :before-upload="handleBeforeUpload"
                :auto-upload="false"
                multiple
                :file-list="fileList"
              >
                <el-button size="small" type="primary">点击上传</el-button>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-form-item label="提交内容:" required>
            <el-checkbox-group v-model="assignment.contentTypes">
              <el-checkbox label="视频"></el-checkbox>
              <el-checkbox label="音频" :disabled="true"></el-checkbox>
              <el-checkbox label="PPT"></el-checkbox>
              <el-checkbox label="演讲稿" :disabled="true"></el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-row>
      </el-form>
    </el-card>
<!--   作业设置 -->
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>作业设置</span>
      </div>
      <el-form label-width="120px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="评阅流程:" required>
              <div class="review-process-container">
                <el-checkbox-group v-model="reviewProcesses">
                  <el-checkbox label="自评">自评</el-checkbox>
                  <el-checkbox label="机评">机评</el-checkbox>
                  <el-checkbox label="互评">互评</el-checkbox>
                  <el-checkbox label="师评">师评</el-checkbox>
                </el-checkbox-group>
                <span class="process-description">（本次作业的评阅流程为：{{ reviewProcessDescription }}）</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="评阅人设置:">
              <el-checkbox-group v-model="hiddenInformation">
                <el-checkbox label="隐藏评卷人信息">是否对提交人隐藏评卷人信息</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-col>
        </el-row>
<!--        作业权重-->
        <el-row>
          <el-col :span="24">
            <el-form-item label="分数设置:" required>
              <el-table :data="filteredScoreItems" style="width: 100%">
                <el-table-column prop="category" label="类别" width="125" align="center" ></el-table-column>
                <el-table-column label="满分" width="120" align="center">100</el-table-column>
                <el-table-column label="权重" width="125" align="center">
                  <template slot-scope="scope">
                    <el-input type="number" v-model.number="scope.row.weight" @input="calculateScores" style="width: 80%;"/>
                    <span style="margin-left: 5px;">%</span>
                  </template>
                </el-table-column>
                <el-table-column label="加权分值" width="125" align="center">
                  <template slot-scope="scope">
                    {{ (scope.row.fullScore * scope.row.weight / 100).toFixed(2) }}
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="assignment.contentTypes.length === 0" class="weight-warning">
                请先选择提交内容类型
              </div>
              <div v-else-if="currentWeightSum !== 100" class="weight-warning">
                权重相加需为100%（当前：{{ currentWeightSum }}%）
              </div>
              <div v-else class="weight-success">
                ✓ 权重分配正确（{{ filteredScoreItems.length }}个评分项）
              </div>
              <div>总分：{{ totalScore }}</div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

<!--    创建/取消-->
    <el-card class="box-card">
      <!-- ... 其他内容 ... -->
      <div  class="clearfix">
        <el-button type="primary" @click="createAssignment">创建</el-button>
        <el-button @click="cancelAssignment">取消</el-button>
      </div>
    </el-card>

    <!-- 确认离开对话框 -->
    <el-dialog
      title="提示"
      :visible.sync="dialogVisible"
      width="30%"
      :before-close="handleClose">
      <span>系统可能不会保存您所做的更改。</span>
      <span slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="leavePage">离开</el-button>
    </span>
    </el-dialog>
  </div>
</template>

<script>
import  {uploadTaskAssignment} from '@/api/homeworkManage/createHomework';
import { mapGetters } from 'vuex';

export default {
  data() {
    return {
      dialogVisible: false,
      assignment: {
        description: '',
        name: '',
        deadline: '',
        contentTypes: ['音频','演讲稿'],
        attachments: []
      },
      maxDescriptionLength: 50, // 设置最大输入字数
      reviewProcesses: [],
      hiddenInformation:[],
      scoreItems: [
        { category: '视频', weight: 25 ,fullScore: 100 },
        { category: '音频', weight: 25 ,fullScore: 100 },
        { category: '演讲稿', weight: 25,fullScore: 100  },
        { category: 'PPT', weight: 25 ,fullScore: 100 }
      ],
      totalScore: 100,
      weightSum: 100,
      fileList: [], // 存储选择的文件
      taskJson: null  // 存储上传的数据
    };
  },
  created() {
    console.log('Owner Name:', this.name);
    console.log('Owner ID:', this.userId);
    // 可以在这里使用这些值做初始化工作
  },
  mounted() {
    // 初始化时重新分配权重，确保权重分配与选中的内容类型一致
    this.$nextTick(() => {
      this.redistributeWeights();
    });
  },
  computed: {
    ...mapGetters(['name', 'userId']) , // 获取 ownerName 和 ownerId，假设 getter 名称分别为 'name' 和 'userId'
    descriptionLength() {
      return this.assignment.description.length;
    },
    reviewProcessDescription() {
      return this.reviewProcesses.join('-');
    },
    // 根据选择的提交内容类型过滤分数设置项
    filteredScoreItems() {
      return this.scoreItems.filter(item => 
        this.assignment.contentTypes.includes(item.category)
      );
    },
    // 计算当前选中项目的权重总和
    currentWeightSum() {
      return this.filteredScoreItems.reduce((sum, item) => sum + item.weight, 0);
    }
  },

  methods: {
    handleBeforeUpload(file) {
      // 将文件保存到 fileList 中，而不是立即上传
      this.fileList.push(file);
      return false;  // 阻止默认的上传行为
    },
    validateForm() {
      if (!this.assignment.name) {
        this.$message.error('请填写作业名称');
        return false;
      }

      if (!this.assignment.deadline) {
        this.$message.error('请设置作业截止日期');
        return false;
      }

      if (!this.assignment.description) {
        this.$message.error('请填写作业描述');
        return false;
      }

      if (!this.assignment.contentTypes.length) {
        this.$message.error('请选择至少一个提交内容类型');
        return false;
      }

      if (!this.reviewProcesses.length) {
        this.$message.error('请选择评阅流程');
        return false;
      }

      // 验证选中的评分项权重
      if (!this.filteredScoreItems.every(item => item.weight > 0)) {
        this.$message.error('请为所有评分项设置权重');
        return false;
      }
      
      // 验证权重总和是否为100%
      if (this.currentWeightSum !== 100) {
        this.$message.error('权重总和必须为100%');
        return false;
      }

      return true;
    },
    createAssignment() {
      // 表单验证
      if (!this.validateForm()) {
        return; // 如果表单不合格，停止执行
      }


      // 构建任务的 JSON 数据
      this.taskJson = {
        submissionTypes: this.assignment.contentTypes,
        taskName: this.assignment.name,
        deadline: this.assignment.deadline,
        taskRequirements: this.assignment.description,
        evaluationMethods: this.reviewProcesses,
        reviewSettings: this.hiddenInformation,
        ownerName: this.name,  // 使用 Vuex getter 获取 ownerName
        ownerId: this.userId,  // 使用 Vuex getter 获取 ownerId
        weights: this.filteredScoreItems.map(item => ({
          category: item.category,
          weight: item.weight
        }))
      };

      // 构建 FormData 并将 JSON 和文件一起上传
      const formData = new FormData();
      formData.append('taskJson', JSON.stringify(this.taskJson));

      // 将所有文件添加到 FormData
      if (this.fileList.length > 0) {
        this.fileList.forEach((file, index) => {
          if (file.raw) {
            formData.append('file', file.raw); // 使用 file.raw 来添加文件
          } else {
            formData.append('file', file); // 直接添加文件对象
          }
        });
      }

      // 打印 FormData 内容，确保 taskJson 和文件都被正确添加
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      // 调用封装的上传作业函数
      uploadTaskAssignment(formData)
        .then(response => {
          if (response.code === 1) {
            this.$message.success('作业创建成功');
            console.log('创建成功的任务ID:', response.data.id);  // 输出任务ID
            this.handleTaskSuccess(response.data);
          } else {
            this.$message.error('作业创建失败');
          }
        })
        .catch(error => {
          this.$message.error('作业创建失败');
          console.error(error);
        });
    },

    handleTaskSuccess(taskData) {
      // 可以在页面上展示任务创建成功后的详细信息
      console.log('任务详情:', taskData);
      // 跳转到任务分配页面并传递任务信息
      this.$router.push({
        name: 'AssignTask',
        params: { taskId: taskData.id },
        query: { taskData: JSON.stringify(taskData) }
      });
    },
    cancelAssignment() {
      this.dialogVisible = true; // 显示确认离开对话框
    },
    leavePage() {
      this.$router.go(-1); // 返回上级页面
    },
    handleClose(done) {
      // 可以在这里执行一些操作，例如清理资源
      this.reviewProcesses = [];
      this.hiddenInformation = [];
      this.scoreItems.forEach(item => {
        item.weight = 25; // 假设初始权重为25
        item.weightedScore = 0;
      });
      this.totalScore = 0;
      this.weightSum = 100;
      done();
    },
    handlePreview(file) {
      // Handle file preview
    },
    handleRemove(file, fileList) {
      // Handle file removal
    },
    beforeUpload(file) {
      // Handle actions before uploading
    },
    handleInput() {
      if (this.descriptionLength > this.maxDescriptionLength) {
        this.assignment.description = this.assignment.description.slice(0, this.maxDescriptionLength);
        this.$message.error(`最多只能输入 ${this.maxDescriptionLength} 个字`);
      }
    },
    calculateScores() {
      // 只计算选中的提交内容类型的权重
      this.weightSum = this.currentWeightSum;
      
      // 基于过滤后的项目计算总分
      this.totalScore = this.filteredScoreItems.reduce((sum, item) => {
        return sum + (100 * item.weight / 100);
      }, 0).toFixed(2);

      if (this.weightSum !== 100) {
        this.$message.warning('权重相加需为100%');
      }
    },
    
    // 当提交内容类型发生变化时，重新分配权重
    redistributeWeights() {
      const selectedCount = this.assignment.contentTypes.length;
      if (selectedCount === 0) {
        // 如果没有选择内容类型，重置所有权重为0
        this.scoreItems.forEach(item => {
          item.weight = 0;
        });
        this.calculateScores();
        return;
      }
      
      // 平均分配权重，确保总和为100%
      const averageWeight = Math.floor(100 / selectedCount);
      const remainder = 100 - (averageWeight * selectedCount);
      
      // 重置所有权重为0
      this.scoreItems.forEach(item => {
        item.weight = 0;
      });
      
      // 为选中的类型分配权重
      let assignedRemainder = 0;
      this.assignment.contentTypes.forEach((contentType, index) => {
        const scoreItem = this.scoreItems.find(item => item.category === contentType);
        if (scoreItem) {
          scoreItem.weight = averageWeight;
          // 将余数分配给前几个项目
          if (assignedRemainder < remainder) {
            scoreItem.weight += 1;
            assignedRemainder++;
          }
        } else {
          console.warn(`未找到类别 "${contentType}" 对应的评分项`);
        }
      });
      
      // 重新计算分数
      this.calculateScores();
      
      // 提供用户友好的反馈
      if (selectedCount > 1) {
        this.$message({
          message: `已为${selectedCount}个评分项自动分配权重`,
          type: 'success',
          duration: 2000
        });
      }
      
      console.log('权重重新分配完成:', {
        selectedTypes: this.assignment.contentTypes,
        weights: this.filteredScoreItems.map(item => ({
          category: item.category,
          weight: item.weight
        })),
        totalWeight: this.currentWeightSum
      });
    },
    updateTaskJson() {
      // 更新 taskJson 数据，只包含选中的内容类型及其权重
      const selectedWeights = this.filteredScoreItems.map(item => ({
        category: item.category,
        weight: item.weight
      }));
      
      this.taskJson = {
        submissionTypes: this.assignment.contentTypes,
        taskName: this.assignment.name,
        deadline: this.assignment.deadline,
        taskRequirements: this.assignment.description,
        evaluationMethods: this.reviewProcesses,
        reviewSettings: this.hiddenInformation,
        ownerName: this.name,
        ownerId: this.userId,
        weights: selectedWeights
      };

      // 打印到控制台
      console.log('Updated Task JSON:', this.taskJson);
    },
    // handleTabClick(tab) {
    //   // 可以在这里添加一些选项卡切换时的处理逻辑
    //   console.log('Tab clicked:', tab);
    // },
  },
  watch: {
    // 监听提交内容类型的变化
    'assignment.contentTypes': {
      handler(newContentTypes, oldContentTypes) {
        console.log('提交内容类型发生变化:', {
          old: oldContentTypes,
          new: newContentTypes
        });
        
        // 如果选择的内容类型发生变化，重新分配权重
        if (newContentTypes && newContentTypes.length > 0) {
          // 使用nextTick确保DOM更新后再重新分配权重
          this.$nextTick(() => {
            this.redistributeWeights();
          });
        }
        
        this.updateTaskJson();
      },
      deep: true,
      immediate: false
    },
    weightSum(newSum) {
      if (newSum !== 100) {
        this.$message.warning('权重相加需为100%');
      }
    },
    assignment: {
      deep: true,
      handler() {
        this.updateTaskJson();
      }
    },
    reviewProcesses() {
      this.updateTaskJson();
    },
    hiddenInformation() {
      this.updateTaskJson();
    },
    scoreItems: {
      deep: true,
      handler() {
        this.updateTaskJson();
      }
    }
  },
};
</script>

<style scoped>

.assignment-detail {
  padding: 20px;
}
.review-process-container {
  display: flex;
  align-items: center; /* 垂直居中对齐 */
}
.box-card {
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}
.el-form-item__label {
  display: flex;
  align-items: center;
}
.process-description {
  margin-left: 10px; /* 与复选框组保持一定间距 */
  font-size: 14px; /* 确保与复选框文字大小一致 */
}
.weight-warning {
   color: red;
   margin-top: 10px;
 }

.weight-success {
   color: green;
   margin-top: 10px;
 }

</style>


