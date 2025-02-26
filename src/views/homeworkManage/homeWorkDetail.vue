<template>
  <div class="assignment-detail">
    <!-- 作业信息 -->
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>作业信息</span>
      </div>
      <el-form label-width="120px" >
        <el-row>
          <el-col :span="12">
            <el-form-item label="作业名称:" required>
              <el-input v-model="assignment.name" placeholder="请输入作业名称，不超过100个字符" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止日期:" required>
              <el-date-picker v-model="assignment.deadline" type="datetime" placeholder="2024-09-20 00:00:00" disabled></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="作业描述:">
              <el-input
                type="textarea"
                v-model="assignment.taskRequirements"
                placeholder="请输入作业描述"
                :maxlength="5"
              @input="handleInput"
                disabled
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
                action="/upload"
                :on-preview="handlePreview"
                :on-remove="handleRemove"
                :before-upload="beforeUpload"
                multiple
                :file-list="assignment.fileList"
                disabled
              >
                <el-button size="small" type="primary" disabled>点击上传</el-button>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-form-item label="提交内容:" required>
            <el-checkbox-group v-model="assignment.contentTypes" disabled>
              <el-checkbox label="视频" ></el-checkbox>
              <el-checkbox label="音频" :disabled="true"></el-checkbox>
              <el-checkbox label="PPT"></el-checkbox>
              <el-checkbox label="演讲稿" :disabled="true"></el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-row>
      </el-form>
    </el-card>

    <!-- 分配的学生信息表格 -->
    <el-card class="box-card" style="margin-top: 20px;">
      <div slot="header" class="clearfix">
        <span>分配学生信息</span>
      </div>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="分配的学生信息" name="assigned">
         <el-table :data=" pagedAssignedStudents" style="width: 100%; margin-top: 10px;">
        <el-table-column prop="nickName" label="姓名" header-align="center" align="center"></el-table-column>
        <el-table-column prop="userName" label="邮箱"  header-align="center" align="center"></el-table-column>
        <el-table-column prop="mobile" label="手机号"  header-align="center" align="center"></el-table-column>
        <el-table-column label="操作"  header-align="center" align="center">
          <template slot-scope="scope">
            <el-button type="text" @click="viewScore(scope.row)" v-if="scope.row.userName">查看成绩</el-button>
          </template>
        </el-table-column>
        </el-table>
        <el-pagination
          layout="prev, pager, next"
          :page-size="10"
          :current-page="assignedCurrentPage"
          :total="assignedStudents.length"
          @current-change="handlePageChange('assigned', $event)"
          style="text-align: center; margin-top: 20px;"
        />
        <p class="total-students">
          共 <span class="student-count">{{ totalStudents }}</span> 个学生
        </p>
        </el-tab-pane>

        <!-- 自评 -->
        <el-tab-pane
          v-if="showTabs.self"
        label="自评"
        name="self">
          <el-table :data="pagedSelfEvaluations" style="width: 100%; margin-top: 10px;">
            <el-table-column prop="nickName" label="学生姓名" header-align="center" align="center"></el-table-column>
            <el-table-column prop="userName" label="邮箱" header-align="center" align="center"></el-table-column>
            <el-table-column prop="mobile" label="手机号" header-align="center" align="center"></el-table-column>
            <el-table-column prop="reviewerName" label="评阅人" header-align="center" align="center"></el-table-column>
            <el-table-column prop="audioGrade" label="音频评分" header-align="center" align="center"></el-table-column>
            <el-table-column prop="pptGrade" label="PPT评分" header-align="center" align="center"></el-table-column>
            <el-table-column prop="scriptGrade" label="演讲稿评分" header-align="center" align="center"></el-table-column>
            <el-table-column prop="videoGrade" label="视频评分" header-align="center" align="center"></el-table-column>
            <el-table-column prop="totalGrade" label="总分" header-align="center" align="center"></el-table-column>
          </el-table>
          <el-pagination
            layout="prev, pager, next"
            :page-size="10"
            :current-page="selfCurrentPage"
            :total="selfEvaluations.length"
            @current-change="handlePageChange('self', $event)"
            style="text-align: center; margin-top: 20px;"
          />
        </el-tab-pane>

    <!-- 机评 -->
        <!-- 机评 -->
        <el-tab-pane v-if="showTabs.machine"
                     label="机评"
                     name="machine">
          <el-table :data="pagedMachineEvaluations" style="width: 100%; margin-top: 10px;">
            <el-table-column prop="nickName" label="学生姓名" header-align="center" align="center"></el-table-column>
            <el-table-column prop="userName" label="邮箱" header-align="center" align="center"></el-table-column>
            <el-table-column prop="mobile" label="手机号" header-align="center" align="center"></el-table-column>
            <el-table-column prop="reviewerName" label="评阅人" header-align="center" align="center"></el-table-column>
            <el-table-column prop="audioGrade" label="音频评分" header-align="center" align="center"></el-table-column>
            <el-table-column prop="pptGrade" label="PPT评分" header-align="center" align="center"></el-table-column>
            <el-table-column prop="scriptGrade" label="演讲稿评分" header-align="center" align="center"></el-table-column>
            <el-table-column prop="videoGrade" label="视频评分" header-align="center" align="center"></el-table-column>
            <el-table-column prop="totalGrade" label="总分" header-align="center" align="center"></el-table-column>
          </el-table>
          <el-pagination
            layout="prev, pager, next"
            :page-size="10"
            :current-page="machineCurrentPage"
            :total="machineEvaluations.length"
            @current-change="handlePageChange('machine', $event)"
            style="text-align: center; margin-top: 20px;"
          />
        </el-tab-pane>

        <!-- 互评 -->
        <el-tab-pane v-if="showTabs.peer"
                     label="互评"
                     name="peer">
          <el-table :data="pagedPeerEvaluations" style="width: 100%; margin-top: 10px;">
            <el-table-column prop="nickName" label="学生姓名" header-align="center" align="center"></el-table-column>
            <el-table-column prop="userName" label="邮箱" header-align="center" align="center"></el-table-column>
            <el-table-column prop="mobile" label="手机号" header-align="center" align="center"></el-table-column>
            <el-table-column prop="reviewerName" label="评阅人" header-align="center" align="center"></el-table-column>
            <el-table-column prop="audioGrade" label="音频评分" header-align="center" align="center"></el-table-column>
            <el-table-column prop="pptGrade" label="PPT评分" header-align="center" align="center"></el-table-column>
            <el-table-column prop="scriptGrade" label="演讲稿评分" header-align="center" align="center"></el-table-column>
            <el-table-column prop="videoGrade" label="视频评分" header-align="center" align="center"></el-table-column>
            <el-table-column prop="totalGrade" label="总分" header-align="center" align="center"></el-table-column>
          </el-table>
          <el-pagination
            layout="prev, pager, next"
            :page-size="10"
            :current-page="peerCurrentPage"
            :total="peerEvaluations.length"
            @current-change="handlePageChange('peer', $event)"
            style="text-align: center; margin-top: 20px;"
          />
        </el-tab-pane>



        <!-- 师评 -->
        <el-tab-pane v-if="showTabs.teacher"
                     label="师评"
                     name="teacher">
          <el-table :data="pagedTeacherEvaluations" style="width: 100%; margin-top: 10px;">
            <el-table-column prop="nickName" label="学生姓名" header-align="center" align="center"></el-table-column>
            <el-table-column prop="userName" label="邮箱" header-align="center" align="center"></el-table-column>
            <el-table-column prop="mobile" label="手机号" header-align="center" align="center"></el-table-column>
            <el-table-column prop="reviewerName" label="评阅人" header-align="center" align="center"></el-table-column>
            <el-table-column prop="audioGrade" label="音频评分" header-align="center" align="center"></el-table-column>
            <el-table-column prop="pptGrade" label="PPT评分" header-align="center" align="center"></el-table-column>
            <el-table-column prop="scriptGrade" label="演讲稿评分" header-align="center" align="center"></el-table-column>
            <el-table-column prop="videoGrade" label="视频评分" header-align="center" align="center"></el-table-column>
            <el-table-column prop="totalGrade" label="总分" header-align="center" align="center"></el-table-column>
          </el-table>
          <el-pagination
            layout="prev, pager, next"
            :page-size="10"
            :current-page="teacherCurrentPage"
            :total="teacherEvaluations.length"
            @current-change="handlePageChange('teacher', $event)"
            style="text-align: center; margin-top: 20px;"
          />
        </el-tab-pane>

    </el-tabs>

    </el-card>


    <!-- 查看成绩的弹窗 -->
    <el-dialog :visible.sync="showScoreDialog" title="查看成绩" width="50%">
      <div class="student-info">
        <el-row>
          <el-col :span="12">
            <p><strong>姓名：</strong> {{ selectedStudent ? selectedStudent.nickName : '' }}</p>
          </el-col>
          <el-col :span="12">
            <p><strong>学号：</strong> {{ selectedStudent ? selectedStudent.studentId : '' }}</p>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <p><strong>邮箱：</strong> {{ selectedStudent ? selectedStudent.userName : '' }}</p>
          </el-col>
          <el-col :span="12">
            <p><strong>手机号：</strong> {{ selectedStudent ? selectedStudent.mobile : '' }}</p>
          </el-col>
        </el-row>
      </div>
      <!-- 具体成绩内容可以在此添加 -->
      <el-table :data="evaluationResults" style="width: 100%; margin-top: 20px;">
        <el-table-column prop="method" label="作业类型" header-align="center" align="center"></el-table-column>
        <el-table-column prop="reviewerName" label="评阅人" header-align="center" align="center"></el-table-column>
        <el-table-column prop="audioGrade" label="音频评分" header-align="center" align="center"></el-table-column>
        <el-table-column prop="pptGrade" label="PPT评分" header-align="center" align="center"></el-table-column>
        <el-table-column prop="scriptGrade" label="演讲稿评分" header-align="center" align="center"></el-table-column>
        <el-table-column prop="videoGrade" label="视频评分" header-align="center" align="center"></el-table-column>
        <el-table-column prop="totalGrade" label="总分" header-align="center" align="center"></el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showScoreDialog = false"  >关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
// 1. 导入用于获取作业数据的 API 函数
import { getHomeworkData , getEvaluationByTaskIdAndStudId,getAllGradesByTaskId } from '@/api/homeworkManage/index';
import { getUserProfile,getUserProfiles } from '@/api/system/user';
export default {
  data() {
    return {
      // 2. 初始化 assignment 对象，用于存储作业的详细信息
      assignment: {
        id: '',
        name: '', // 作业名称
        deadline: '', // 截止日期
        taskRequirements: '', // 作业描述
        contentTypes: [], // 提交内容类型
        fileList: [], // 附件列表
        weights: []
      },
      activeTab: 'assigned',
      students: [], // 存储分配的学生详细信息
      showScoreDialog: false, // 控制查看成绩弹窗的显示
      selectedStudent: null, // 存储当前选中的学生信息
      assignedStudents: [], // 分配的学生信息
      assignedCurrentPage: 1, // 分配学生信息当前页
      selfEvaluations: [],
      machineEvaluations: [],
      peerEvaluations: [],
      teacherEvaluations: [],
      selfCurrentPage: 1,
      machineCurrentPage: 1,
      peerCurrentPage: 1,
      teacherCurrentPage: 1,
      evaluationResults: [],  // 在 data 中初始化 evaluationResults 为空数组
      totalStudents: 0, // 总学生数，用于显示在表格下方
      userInfoMap: new Map(), // 用户信息Map
      evaluationMethods: [], // 存储评价方式
      showTabs: {  // 控制tab显示
        self: false,
        machine: false,
        peer: false,
        teacher: false
      }
    };
  },
  computed: {
    // 3. 计算描述字数长度，超出指定字数时显示提示
    descriptionLength() {
      return this.assignment.taskRequirements ? this.assignment.taskRequirements.length : 0;
    },
    // 计算当前页要显示的学生数据，并填充空行以确保每页有10行
    pagedAssignedStudents() {
      return this.paginate(this.students, this.assignedCurrentPage);
    },
    pagedSelfEvaluations() {
      return this.paginate(this.selfEvaluations, this.selfCurrentPage);
    },
    pagedMachineEvaluations() {
      return this.paginate(this.machineEvaluations, this.machineCurrentPage);
    },
    pagedPeerEvaluations() {
      return this.paginate(this.peerEvaluations, this.peerCurrentPage);
    },
    pagedTeacherEvaluations() {
      return this.paginate(this.teacherEvaluations, this.teacherCurrentPage);
    }
  },
  async created() {
    // 4. 从路由参数中获取 assignmentId，确保点击不同作业时加载正确的作业数据
    const ownerId = this.$route.params.ownerId;
    const assignmentId = this.$route.params.assignmentId;

    // 5. 调用 fetchAssignmentDetails 方法，传入 assignmentId 获取作业详细信息
    await this.fetchAssignmentDetails(assignmentId, ownerId);
    // 获取评阅信息
    // await this.fetchAllEvaluations(assignmentId);
  },
  methods: {
    // 拆分作业基本信息获取
    async fetchAssignmentDetails(assignmentId, ownerId) {
      try {
        const response = await getHomeworkData(ownerId);
        const assignmentData = response.data.find(item => item.id === assignmentId);

        if (assignmentData) {
          // 设置评价方式等基本信息...
          this.evaluationMethods = assignmentData.evaluationMethods || [];
          this.showTabs = {
            self: this.evaluationMethods.includes('自评'),
            machine: this.evaluationMethods.includes('机评'),
            peer: this.evaluationMethods.includes('互评'),
            teacher: this.evaluationMethods.includes('师评')
          };

          // 处理作业基本信息...
          const taskRequirements = assignmentData.taskRequirements;
          const extractedText = taskRequirements.replace(/<[^>]*>/g, '');
          this.assignment = {
            id: assignmentData.id,
            name: assignmentData.taskName,
            deadline: new Date(assignmentData.deadline),
            taskRequirements: extractedText,
            contentTypes: assignmentData.submissionTypes || [],
            fileList: assignmentData.fileName ? [assignmentData.fileName] : [],
            weights: assignmentData.weights
          };

          // 获取评分数据
          const gradesResponse = await getAllGradesByTaskId(assignmentId, 1, 999);

          if (gradesResponse.code === 1 && gradesResponse.data) {
            // 收集所有需要获取的用户ID
            const allUserIds = new Set();

            // 添加学生ID
            assignmentData.assignedStudents.forEach(id => allUserIds.add(id));

            // 添加互评学生ID
            if (assignmentData.mulAccessIds) {
              Object.values(assignmentData.mulAccessIds).forEach(id => allUserIds.add(id));
            }

            // 添加评阅教师ID
            if (assignmentData.reviewTeachers) {
              assignmentData.reviewTeachers.forEach(id => allUserIds.add(id));
            }

            // 添加评阅人ID
            gradesResponse.data.rows.forEach(studentData => {
              studentData.evaluationTypes.forEach(evaluation => {
                if (evaluation.reviewerId && evaluation.evaluationMethod !== "机评") {
                  allUserIds.add(evaluation.reviewerId);
                }
              });
            });

            // 一次性获取所有用户信息
            if (allUserIds.size > 0) {
              const usersResponse = await getUserProfiles([...allUserIds]);
              if (usersResponse && usersResponse.data && usersResponse.data.rows) {
                // 将所有用户信息存入统一的Map
                usersResponse.data.rows.forEach(user => {
                  this.userInfoMap.set(user.userId, user);
                });

                // 设置学生列表
                this.students = assignmentData.assignedStudents
                  .map(studentId => this.userInfoMap.get(studentId))
                  .filter(student => student !== undefined);

                this.totalStudents = this.students.length;

                // 处理评分数据
                await this.processEvaluationData(gradesResponse.data.rows, assignmentData);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching assignment details:", error);
        this.$message.error("获取作业详情失败");
      }
    },

    // 新增：处理评分数据的方法
    // 修改评分数据处理方法
    async processEvaluationData(evaluationRows, assignmentData) {
      this.selfEvaluations = [];
      this.machineEvaluations = [];
      this.peerEvaluations = [];
      this.teacherEvaluations = [];

      for (const studentData of evaluationRows) {
        const student = this.userInfoMap.get(studentData.studentId);
        if (!student) continue;

        for (const evaluation of studentData.evaluationTypes) {
          // 如果该评价方式不在evaluationMethods中，跳过
          if (!this.evaluationMethods.includes(evaluation.evaluationMethod)) {
            continue;
          }

          let reviewerName = '无';

          // 根据评价类型获取评阅人信息
          if (evaluation.evaluationMethod === "机评") {
            reviewerName = "机器";
          } else if (evaluation.evaluationMethod === "师评") {
            // 从评阅教师列表中获取
            const reviewer = this.userInfoMap.get(assignmentData.reviewTeachers[0]);
            reviewerName = reviewer ? reviewer.nickName : '未知';
          } else if (evaluation.evaluationMethod === "互评") {
            // 从互评对应关系中获取
            const reviewerId = assignmentData.mulAccessIds[student.userId];
            const reviewer = this.userInfoMap.get(reviewerId);
            reviewerName = reviewer ? reviewer.nickName : '未知';
          } else if (evaluation.evaluationMethod === "自评") {
            reviewerName = student.nickName;
          }

          const result = this.calculateGrades(student, reviewerName, evaluation, this.assignment.weights);

          // 根据评价方法分类存储
          switch (evaluation.evaluationMethod) {
            case "自评":
              this.selfEvaluations.push(result);
              break;
            case "机评":
              this.machineEvaluations.push(result);
              break;
            case "互评":
              this.peerEvaluations.push(result);
              break;
            case "师评":
              this.teacherEvaluations.push(result);
              break;
          }
        }
      }
    },

    // 抽取成独立的计算分数方法
    calculateGrades(student, reviewerName, evaluation, weights) {
      const result = {
        method: evaluation.evaluationMethod,
        nickName: student.nickName,
        userName: student.userName,
        mobile: student.mobile,
        reviewerName: reviewerName,
        audioGrade: null,
        pptGrade: null,
        scriptGrade: null,
        videoGrade: null,
        totalGrade: 0
      };

      evaluation.evaluationContents.forEach((content) => {
        let grade = content.grade || 0;
        switch (content.evaluationContent) {
          case "音频":
            result.audioGrade = grade;
            result.totalGrade += grade * (weights[0] / 100);
            break;
          case "PPT":
            result.pptGrade = grade;
            result.totalGrade += grade * (weights[1] / 100);
            break;
          case "演讲稿":
            result.scriptGrade = grade;
            result.totalGrade += grade * (weights[2] / 100);
            break;
          case "视频":
            result.videoGrade = grade;
            result.totalGrade += grade * (weights[3] / 100);
            break;
        }
      });

      return result;
    },
    // 7. 处理描述输入，检查字数是否超过限制
    handleInput() {
      // 可添加字数检查逻辑
    },
    // 8. 处理文件预览
    handlePreview(file) {
      console.log("Previewing file:", file);
    },
    // 9. 处理文件移除
    handleRemove(file, fileList) {
      console.log("File removed:", file);
    },
    // 10. 上传前的文件验证，限制文件大小
    beforeUpload(file) {
      const isLt2M = file.size / 1024 / 1024 < 50;
      if (!isLt2M) {
        this.$message.error("上传文件大小不能超过 50MB!");
      }
      return isLt2M;
    },
    // 确保 paginate 方法正确实现
    paginate(data, page) {
      const pageSize = 10;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      return data.slice(start, end);
    },
    // 更新当前页码
    handlePageChange(tab, page) {
      if (tab === 'assigned') this.assignedCurrentPage = page;
      if (tab === 'self') this.selfCurrentPage = page;
      if (tab === 'machine') this.machineCurrentPage = page;
      if (tab === 'peer') this.peerCurrentPage = page;
      if (tab === 'teacher') this.teacherCurrentPage = page;
    },

    viewScore(student) {
      // 设置当前选中的学生信息
      this.selectedStudent = student;
      console.log('selectedStudent',this.selectedStudent)
      // 根据选中的学生，查找并显示评阅信息
      this.evaluationResults = [];

      // 查找该学生的评阅数据并赋值给 evaluationResults
      const allEvaluations = [...this.selfEvaluations, ...this.machineEvaluations, ...this.peerEvaluations, ...this.teacherEvaluations];
      this.evaluationResults = allEvaluations.filter(evaluation => evaluation.userName === student.userName);

      // 显示成绩弹窗
      this.showScoreDialog = true;
    },

  },
};
</script>
<style scoped>
.assignment-detail {
  /* 添加样式 */
}
.total-students {
  text-align: right;
  font-size: 12px;
  color: #666;
  margin-top: 10px;
}
.student-count {
  color: red;
}
.student-info p {
  margin-bottom: 5px; /* 控制行之间的间距 */
}
</style>
