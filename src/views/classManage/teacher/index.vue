<template>
  <div class="class-management">
    <h2>班级管理</h2>

    <!-- 创建班级表单 -->
    <el-card class="box-card" shadow="always">
      <div slot="header" class="clearfix">
        <span>创建新班级</span>
      </div>
      <el-form :model="newClass" label-width="120px" class="class-form">
        <el-form-item label="班级名称">
          <el-input v-model="newClass.className" placeholder="请输入班级名称" />
        </el-form-item>
        <el-form-item label="班级介绍">
          <el-input v-model="newClass.classIntroduction" type="textarea" placeholder="请输入班级介绍" />
        </el-form-item>
        <el-form-item label="班级目标">
          <el-input v-model="newClass.classTarget" placeholder="请输入班级目标" />
        </el-form-item>
        <el-form-item label="学期">
          <el-select v-model="newClass.term" placeholder="请选择学期">
            <el-option label="春季学期" value="春季学期" />
            <el-option label="秋季学期" value="秋季学期" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="newClass.startTime" type="datetime" placeholder="选择开始时间" />
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker v-model="newClass.deadline" type="datetime" placeholder="选择截止日期" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="createClass">创建班级</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 班级列表展示 -->
    <el-card class="box-card" shadow="always" style="margin-top: 20px;">
      <div slot="header" class="clearfix">
        <span>已创建班级</span>
      </div>
      <el-table :data="classes" v-if="classes.length > 0" class="class-table">
        <el-table-column prop="className" label="班级名称" align="center" />
        <el-table-column prop="term" label="学期" align="center" />
        <el-table-column prop="startTime" label="开始时间" align="center">
          <template slot-scope="scope">
            {{ formatDate(scope.row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="deadline" label="截止日期" align="center">
          <template slot-scope="scope">
            {{ formatDate(scope.row.deadline) }}
          </template>
        </el-table-column>
        <el-table-column prop="enable" label="开课状态" align="center">
          <template slot-scope="scope">
            <el-tag :type="getClassStatusType(scope.row)">
              {{ getClassStatusText(scope.row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="编辑" align="center" width="100">
          <template slot-scope="scope">
            <el-button type="warning" icon="el-icon-edit" @click="editClass(scope.row)" size="small">编辑</el-button>
          </template>
        </el-table-column>
        <el-table-column label="查看学生" align="center">
          <template slot-scope="scope">
            <el-button type="primary" @click="viewMembers(scope.row.classId)" size="small">查看学生</el-button>
          </template>
        </el-table-column>

        <el-table-column label="查看申请" align="center">
          <template slot-scope="scope">
            <el-button type="primary" @click="viewApplications(scope.row.classId)" size="small">
              查看申请
              <span v-if="unprocessedApplicationsCount(scope.row.classId) > 0" class="unprocessed-count">
        ({{ unprocessedApplicationsCount(scope.row.classId) }})
      </span>
            </el-button>
          </template>
        </el-table-column>

        <el-table-column label="导入学生" align="center" width="120">
          <template slot-scope="scope">
            <el-button 
              type="success" 
              icon="el-icon-upload2" 
              @click="openImportDialog(scope.row.classId)" 
              size="small">
              导入
            </el-button>
          </template>
        </el-table-column>

        <el-table-column label="导出学生名单" align="center" width="120">
          <template slot-scope="scope">
            <el-button 
              type="primary" 
              icon="el-icon-download" 
              @click="exportStudentList(scope.row.classId)" 
              size="small">
              导出
            </el-button>
          </template>
        </el-table-column>

        <el-table-column label="班级二维码" align="center" width="120">
          <template slot-scope="scope">
            <el-button 
              type="warning" 
              icon="el-icon-picture" 
              @click="showQRCode(scope.row.classId, scope.row.className)" 
              size="small">
              二维码
            </el-button>
          </template>
        </el-table-column>

        <el-table-column label="删除" align="center">
          <template slot-scope="scope">
            <el-button type="danger" @click="deleteClass(scope.row.classId)" size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-else>暂无班级信息</div>
    </el-card>


    <el-dialog title="学生信息" :visible.sync="dialogVisible" width="60%">
      <el-form inline>
        <el-form-item label="学号">
          <el-input v-model="filters.stuIndex" placeholder="输入学号" clearable />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="filters.name" placeholder="输入姓名" clearable />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="filters.mail" placeholder="输入邮箱" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchMembers">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="members" style="width: 100%; margin-top: 20px;">
        <el-table-column prop="studentId" label="学号" align="center" />
        <el-table-column prop="nickName" label="姓名" align="center" />
        <el-table-column label="邮箱" align="center">
          <template slot-scope="scope">
            {{ scope.row.userName && scope.row.userName.includes('@') ? scope.row.userName : '未设置' }}
          </template>
        </el-table-column>
        <el-table-column prop="mobile" label="手机号" align="center" />
        <el-table-column prop="school" label="学校" align="center" />
        <el-table-column prop="major" label="专业" align="center" />
        <el-table-column label="操作" align="center" width="120">
          <template slot-scope="scope">
            <el-button
              type="danger"
              size="mini"
              icon="el-icon-delete"
              @click="handleDeleteStudent(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页组件 -->
      <div style="margin-top: 20px; text-align: right;">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper">
        </el-pagination>
      </div>
      <span slot="footer" class="dialog-footer">
    <el-button @click="closeMembersDialog">关闭</el-button>
  </span>



    </el-dialog>

    <!-- Excel导入对话框 -->
    <el-dialog title="批量导入学生" :visible.sync="importDialogVisible" width="50%">
      <div class="import-container">
        <!-- 使用说明 -->
        <el-alert
          title="使用说明"
          type="warning"
          :closable="false"
          style="margin-bottom: 20px;">
          <div style="color: #E6A23C; font-size: 14px; line-height: 1.8;">
            <p style="margin: 0 0 8px 0; font-weight: 600;"> 操作步骤：</p>
            <p style="margin: 0 0 8px 0;">1. 点击下方<strong>亮绿色按钮</strong>下载Excel模板</p>
            <p style="margin: 0 0 8px 0;">2. 按照模板格式填写学生信息（姓名、学号、邮箱、性别、手机号、学校、专业、院系）</p>
            <p style="margin: 0 0 8px 0;">3. 将填好的Excel文件上传到下方区域</p>
            <p style="margin: 0; color: #F56C6C; font-weight: 600;">⚠️ 注意：姓名、手机号为<span style="text-decoration: underline;">必填项</span>；学号为可选项（如不填写则使用手机号作为学号）</p>
          </div>
        </el-alert>
        
        <!-- 下载模板按钮 -->
        <div class="template-download" style="margin-bottom: 20px;">
          <el-button 
            type="success" 
            icon="el-icon-download"
            size="medium"
            @click="downloadTemplate">
            下载学生信息导入模板
          </el-button>
          <span style="margin-left: 15px; color: #E6A23C; font-size: 13px; font-weight: 500;">
            必填项：姓名、手机号 | 可选项：学号（不填则使用手机号）、其他字段
          </span>
        </div>
        
        <!-- 文件上传区域 -->
        <el-upload
          ref="upload"
          class="upload-demo"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :limit="1"
          :file-list="fileList"
          accept=".xlsx,.xls">
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将Excel文件拖到此处，或<em>点击上传</em></div>
          <div class="el-upload__tip" slot="tip" style="color: #E6A23C; font-weight: 500; font-size: 13px;">
            📎 只能上传 .xlsx 或 .xls 文件，且文件必须包含"姓名"和"手机号"列（学号为可选项）
          </div>
        </el-upload>
        
        <!-- 导入结果展示 -->
        <div v-if="importResult" class="import-result" style="margin-top: 20px;">
          <el-divider content-position="left">导入结果</el-divider>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="总共">{{ importResult.total }} 条</el-descriptions-item>
            <el-descriptions-item label="成功">
              <el-tag type="success">{{ importResult.success }} 条</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="新建账户">{{ importResult.newAccounts }} 个</el-descriptions-item>
            <el-descriptions-item label="已存在">{{ importResult.alreadyExists }} 个</el-descriptions-item>
            <el-descriptions-item label="失败" :span="2">
              <el-tag type="danger">{{ importResult.failed }} 条</el-tag>
            </el-descriptions-item>
          </el-descriptions>
          
          <!-- 失败详情 -->
          <div v-if="importResult.failedList && importResult.failedList.length > 0" style="margin-top: 15px;">
            <el-alert
              title="失败详情"
              type="warning"
              :closable="false">
              <ul style="margin: 0; padding-left: 20px;">
                <li v-for="(error, index) in importResult.failedList" :key="index">
                  {{ error }}
                </li>
              </ul>
            </el-alert>
          </div>
        </div>
      </div>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeImportDialog">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleImport"
          :loading="importing"
          :disabled="!excelFile">
          {{ importing ? '导入中...' : '开始导入' }}
        </el-button>
      </span>
    </el-dialog>

    <!-- 班级二维码对话框 -->
    <el-dialog 
      :title="'班级二维码 - ' + currentClassName" 
      :visible.sync="qrcodeDialogVisible" 
      width="450px"
      center>
      <div class="qrcode-container" style="text-align: center;">
        <!-- 使用说明 -->
        <el-alert
          title="扫码进班说明"
          type="success"
          :closable="false"
          style="margin-bottom: 20px; text-align: left;">
          <div slot="description">
            <p style="margin: 5px 0;">✓ 学生扫描此二维码后会跳转到登录页面</p>
            <p style="margin: 5px 0;">✓ 登录成功后会自动加入本班级</p>
            <p style="margin: 5px 0;">✓ 支持普通登录、CAS认证和新用户注册</p>
            <p style="margin: 5px 0;">✓ 已在班级中的学生重复扫码不会报错</p>
          </div>
        </el-alert>
        
        <!-- 二维码图片 -->
        <div class="qrcode-image-wrapper" style="padding: 20px; background: #f5f7fa; border-radius: 8px; display: inline-block;">
          <img 
            :src="qrcodeImageUrl" 
            alt="班级二维码" 
            style="width: 300px; height: 300px; display: block;"
            v-if="qrcodeImageUrl">
          <div v-else style="width: 300px; height: 300px; display: flex; align-items: center; justify-content: center;">
            <i class="el-icon-loading" style="font-size: 48px; color: #409EFF;"></i>
          </div>
        </div>
        
        <!-- 班级信息 -->
        <div style="margin-top: 20px; color: #606266;">
          <p style="font-size: 16px; font-weight: 600; margin: 10px 0;">{{ currentClassName }}</p>
          <p style="font-size: 14px; color: #909399; margin: 5px 0;">班级ID: {{ currentQRClassId }}</p>
        </div>
        
        <!-- 操作提示 -->
        <el-divider></el-divider>
        <div style="color: #909399; font-size: 13px; line-height: 1.8;">
          <p><i class="el-icon-info"></i> 可以截图或打印此二维码分享给学生</p>
          <p><i class="el-icon-warning"></i> 请勿将二维码分享到公开渠道</p>
        </div>
      </div>
      
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="qrcodeDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>

    <!-- 编辑班级对话框 -->
    <el-dialog title="编辑班级信息" :visible.sync="editDialogVisible" width="50%">
      <el-form :model="editClassForm" label-width="120px" :rules="editClassRules" ref="editClassForm">
        <el-form-item label="班级名称" prop="className">
          <el-input v-model="editClassForm.className" placeholder="请输入班级名称" />
        </el-form-item>
        <el-form-item label="班级介绍" prop="classIntroduction">
          <el-input v-model="editClassForm.classIntroduction" type="textarea" placeholder="请输入班级介绍" />
        </el-form-item>
        <el-form-item label="班级目标" prop="classTarget">
          <el-input v-model="editClassForm.classTarget" placeholder="请输入班级目标" />
        </el-form-item>
        <el-form-item label="学期" prop="term">
          <el-select v-model="editClassForm.term" placeholder="请选择学期">
            <el-option label="春季学期" value="春季学期" />
            <el-option label="秋季学期" value="秋季学期" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker v-model="editClassForm.startTime" type="datetime" placeholder="选择开始时间" />
        </el-form-item>
        <el-form-item label="截止日期" prop="deadline">
          <el-date-picker v-model="editClassForm.deadline" type="datetime" placeholder="选择截止日期" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="updateClass">保存</el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>

  import { createClass, getClasses, deleteClass, getClassMembers, listApplications, downloadImportTemplate, importStudents, generateQRCodeUrl, loginAccountAndAttend, deleteStudentsFromClass, updateClass } from "@/api/classManage/teacher/index";
  import { mapGetters } from "vuex";
  import { getUserProfile } from "@/api/system/user";
  import * as XLSX from 'xlsx';
  import { saveAs } from 'file-saver';

  export default {
  name: "ClassManagement",
  data() {
        return {
        newClass: {
        className: "",
        classIntroduction: "",
        classTarget: "",
        term: "",
        startTime: null,
        deadline: null,
      },
        classes: [], // 存储教师已创建的班级列表
        dialogVisible: false, // 控制弹窗显示
        members: [], // 当前班级的学生列表
        currentClassId: null, // 当前查看的班级ID
        filters: { stuIndex: "", name: "", mail: "" }, // 查询条件
        applicationsByClass: {}, // 按班级分类的申请列表
        pagination: { // 分页信息
          page: 1,
          pageSize: 10,
          total: 0
        },
        
        // Excel导入相关数据
        importDialogVisible: false,  // 控制导入对话框的显示/隐藏
        importClassId: null,         // 当前要导入学生的班级ID
        fileList: [],                // Element UI Upload组件的文件列表
        excelFile: null,             // 用户选择的Excel文件对象
        importing: false,            // 是否正在导入中（用于按钮loading状态）
        importResult: null,          // 导入完成后的结果数据（包含成功数、失败数等）
        
        // 二维码相关数据
        qrcodeDialogVisible: false,  // 控制二维码对话框的显示/隐藏
        qrcodeImageUrl: '',          // 二维码图片的URL
        currentQRClassId: null,      // 当前显示二维码的班级ID
        currentClassName: '',        // 当前显示二维码的班级名称
        
        // 编辑班级相关数据
        editDialogVisible: false,    // 控制编辑对话框的显示/隐藏
        editClassForm: {             // 编辑表单数据
          classId: null,
          className: "",
          classIntroduction: "",
          classTarget: "",
          term: "",
          startTime: null,
          deadline: null
        },
        editClassRules: {            // 编辑表单验证规则
          className: [
            { required: true, message: '请输入班级名称', trigger: 'blur' }
          ],
          term: [
            { required: true, message: '请选择学期', trigger: 'change' }
          ]
        }
      };
},
  computed: {
  ...mapGetters(["userId", "name"]),
},
  created() {
    if (this.userId) {
    this.fetchClasses();
    this.fetchApplications();
  } else {
    this.$message.error("无法获取教师ID，请重新登录！");
  }
},
  // 当组件被激活时（从其他路由返回时）刷新申请列表
  // 由于使用了 keep-alive，当从申请页面返回时会触发此钩子
  activated() {
    if (this.userId) {
      // 延迟一下，确保路由已经完全切换
      this.$nextTick(() => {
        this.fetchApplications();
      });
    }
  },
  mounted() {
    // 监听申请列表刷新事件
    this.$bus.$on('refreshApplicationList', this.fetchApplications);
  },
  beforeDestroy() {
    // 组件销毁前移除事件监听
    this.$bus.$off('refreshApplicationList', this.fetchApplications);
},
  methods: {
  async fetchClasses() {
    try {
    const response = await getClasses(this.userId);
    if (response.code === 1) {
    this.classes = response.data.rows;
  } else {
    this.$message.error("获取班级信息失败：" + response.msg);
  }
  } catch (error) {
    this.$message.error("获取班级信息失败：" + error.message);
  }
},
  async createClass() {
  try {
  const classData = { ...this.newClass, teacherId: this.userId, teacherName: this.name };
  const response = await createClass(classData);
  if (response.code === 1) {
  this.$message.success("班级创建成功！");
  this.fetchClasses();
  this.resetForm();
} else {
  this.$message.error("班级创建失败：" + response.msg);
}
} catch (error) {
  this.$message.error("班级创建失败：" + error.message);
}
},
  resetForm() {
  this.newClass = { className: "", classIntroduction: "", classTarget: "", term: "", startTime: null, deadline: null };
},
  /**
   * 打开编辑班级对话框
   * 作用：显示编辑对话框并填充当前班级的数据
   * @param {Object} classItem - 要编辑的班级对象
   */
  editClass(classItem) {
    // 填充编辑表单数据
    this.editClassForm = {
      classId: classItem.classId,
      className: classItem.className || "",
      classIntroduction: classItem.classIntroduction || "",
      classTarget: classItem.classTarget || "",
      term: classItem.term || "",
      startTime: classItem.startTime ? new Date(classItem.startTime) : null,
      deadline: classItem.deadline ? new Date(classItem.deadline) : null
    };
    // 显示编辑对话框
    this.editDialogVisible = true;
  },
  /**
   * 更新班级信息
   * 作用：提交编辑后的班级信息到后端
   */
  async updateClass() {
    // 表单验证
    this.$refs.editClassForm.validate(async (valid) => {
      if (!valid) {
        return false;
      }
      
      try {
        const classData = {
          classId: this.editClassForm.classId,
          className: this.editClassForm.className,
          classIntroduction: this.editClassForm.classIntroduction || "",
          classTarget: this.editClassForm.classTarget || "",
          term: this.editClassForm.term,
          startTime: this.editClassForm.startTime,
          deadline: this.editClassForm.deadline
        };
        
        const response = await updateClass(classData);
        if (response.code === 1) {
          this.$message.success("班级信息更新成功！");
          this.editDialogVisible = false;
          // 刷新班级列表
          await this.fetchClasses();
        } else {
          this.$message.error("班级信息更新失败：" + (response.msg || '未知错误'));
        }
      } catch (error) {
        console.error('更新班级失败:', error);
        this.$message.error("班级信息更新失败：" + (error.message || '网络错误'));
      }
    });
},
  async deleteClass(classId) {
  try {
  const response = await deleteClass(classId);
  if (response.code === 1) {
  this.$message.success("班级删除成功！");
  this.fetchClasses();
} else {
  this.$message.error("班级删除失败：" + response.msg);
}
} catch (error) {
  this.$message.error("班级删除失败：" + error.message);
}
},
  formatDate(dateString) {
    return new Date(dateString).toLocaleString();
  },
  // 根据开始时间和截止日期判断班级状态文本
  getClassStatusText(classItem) {
    if (!classItem.startTime || !classItem.deadline) {
      return classItem.enable ? '开课' : '已结课';
    }
    const now = new Date();
    const startTime = new Date(classItem.startTime);
    const deadline = new Date(classItem.deadline);
    
    if (now < startTime) {
      return '未开课';
    } else if (now > deadline) {
      return '已结课';
    } else {
      return '开课';
    }
  },
  // 根据开始时间和截止日期判断班级状态标签类型
  getClassStatusType(classItem) {
    if (!classItem.startTime || !classItem.deadline) {
      return classItem.enable ? 'success' : 'info';
    }
    const now = new Date();
    const startTime = new Date(classItem.startTime);
    const deadline = new Date(classItem.deadline);
    
    if (now < startTime) {
      return 'warning'; // 未开课使用警告色（黄色）
    } else if (now > deadline) {
      return 'info'; // 已结课使用信息色（灰色）
    } else {
      return 'success'; // 开课使用成功色（绿色）
    }
  },
  async viewMembers(classId) {
  this.currentClassId = classId;
  this.dialogVisible = true;
  // 重置分页和筛选条件
  this.pagination.page = 1;
  this.pagination.pageSize = 10;
  this.filters = { stuIndex: "", name: "", mail: "" };
  await this.fetchMembers();
},
  async fetchMembers() {
  try {
  const params = {
    classId: this.currentClassId,
    page: this.pagination.page,
    pageSize: this.pagination.pageSize,
    ...this.filters
  };
  const response = await getClassMembers(params);
  if (response.code === 1) {
  this.members = response.data.rows || [];
  this.pagination.total = response.data.total || 0;
} else {
  this.$message.error("获取学生信息失败：" + response.msg);
}
} catch (error) {
  this.$message.error("获取学生信息失败：" + error.message);
}
},
  handleSizeChange(val) {
  this.pagination.pageSize = val;
  this.pagination.page = 1; // 重置到第一页
  this.fetchMembers();
},
  handleCurrentChange(val) {
  this.pagination.page = val;
  this.fetchMembers();
},
  resetFilters() {
  this.filters = { stuIndex: "", name: "", mail: "" };
  this.pagination.page = 1; // 重置到第一页
  this.fetchMembers();
},
  async fetchApplications() {
    if (!this.userId) {
      return;
    }
  try {
      // 传递一个很大的pageSize来获取所有申请记录
      const response = await listApplications({ 
        teacherId: this.userId,
        page: 1,
        pageSize: 10000  // 设置一个很大的值以获取所有记录
      });
      if (response.code === 1 && response.data) {
  const applicationsByClass = {};
        const rows = response.data.rows || [];
        for (const app of rows) {
          if (!app.classId) continue; // 跳过没有classId的记录
          // 统一转换为字符串，确保类型一致
          const classIdKey = String(app.classId);
          if (!applicationsByClass[classIdKey]) {
            applicationsByClass[classIdKey] = [];
          }
          try {
  const studentProfileResponse = await getUserProfile(app.studentId);
            if (studentProfileResponse.code === 1 && studentProfileResponse.data) {
              applicationsByClass[classIdKey].push({ ...app, studentInfo: studentProfileResponse.data });
            } else {
              // 即使获取学生信息失败，也添加申请记录（不包含studentInfo）
              applicationsByClass[classIdKey].push(app);
            }
          } catch (profileError) {
            console.error(`获取学生${app.studentId}的信息失败:`, profileError);
            // 即使获取学生信息失败，也添加申请记录（不包含studentInfo）
            applicationsByClass[classIdKey].push(app);
}
}
  this.applicationsByClass = applicationsByClass;
} else {
        this.$message.error("获取申请列表失败：" + (response.msg || '未知错误'));
        this.applicationsByClass = {};
}
} catch (error) {
      console.error("获取申请列表时出错：", error);
  this.$message.error("获取申请列表时出错：" + error.message);
      this.applicationsByClass = {};
}
},
  unprocessedApplicationsCount(classId) {
    // 统一转换为字符串进行查找，只统计pending状态的申请
    const classIdKey = String(classId);
    const classApplications = this.applicationsByClass[classIdKey] || [];
  return classApplications.filter(app => app.applicationStatus === 'pending').length;
},
  closeMembersDialog() {
  this.dialogVisible = false;
  this.members = [];
  // 重置分页和筛选条件
  this.pagination.page = 1;
  this.pagination.pageSize = 10;
  this.pagination.total = 0;
  this.filters = { stuIndex: "", name: "", mail: "" };
},
  async handleDeleteStudent(student) {
    try {
      await this.$confirm(
        `确定要从班级中删除学生"${student.nickName}"（${student.studentId || student.userName}）吗？`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      );
      
      // 用户确认删除
      const response = await deleteStudentsFromClass(this.currentClassId, [student.userId]);
      
      if (response.code === 1) {
        this.$message.success('删除学生成功');
        // 刷新学生列表
        await this.fetchMembers();
      } else {
        this.$message.error('删除学生失败：' + (response.msg || '未知错误'));
      }
    } catch (error) {
      if (error !== 'cancel') {
        // 用户取消删除时不显示错误
        console.error('删除学生失败:', error);
        this.$message.error('删除学生失败：' + (error.message || '网络错误'));
      }
    }
},
  /**
   * 导出学生名单为Excel
   * 作用：将指定班级的所有学生信息导出为Excel文件，格式与导入模板相同
   * @param {Number} classId - 要导出学生的班级ID
   */
  async exportStudentList(classId) {
    try {
      if (!classId) {
        this.$message.error('班级ID不能为空');
        return;
      }
      
      this.$message.info('正在获取学生数据，请稍候...');
      
      // 获取所有学生数据（不分页）
      const response = await getClassMembers({
        classId: classId,
        page: 1,
        pageSize: 10000, // 设置一个很大的值以获取所有数据
        stuIndex: "",
        name: "",
        mail: ""
      });
      
      if (response.code !== 1) {
        this.$message.error('获取学生数据失败：' + (response.msg || '未知错误'));
        return;
      }
      
      const allMembers = response.data.rows || [];
      
      if (allMembers.length === 0) {
        this.$message.warning('当前班级没有学生数据');
        return;
      }
      
      // 准备Excel数据，格式与导入模板相同
      const excelData = allMembers.map(member => {
        // 处理邮箱：如果userName包含@，则使用userName，否则为空
        const email = member.userName && member.userName.includes('@') ? member.userName : '';
        
        return {
          '姓名': member.nickName || '',
          '学号': member.studentId || '',
          '邮箱': email,
          '性别': member.sex || '',
          '手机号': member.mobile || '',
          '学校': member.school || '',
          '专业': member.major || '',
          '院系': member.dept || ''
        };
      });
      
      // 创建工作簿
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '学生名单');
      
      // 设置列宽
      const colWidths = [
        { wch: 12 }, // 姓名
        { wch: 15 }, // 学号
        { wch: 25 }, // 邮箱
        { wch: 8 },  // 性别
        { wch: 15 }, // 手机号
        { wch: 20 }, // 学校
        { wch: 20 }, // 专业
        { wch: 20 }  // 院系
      ];
      worksheet['!cols'] = colWidths;
      
      // 生成Excel文件并下载
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // 生成文件名（包含班级ID和时间戳）
      const fileName = `学生名单_${classId}_${new Date().getTime()}.xlsx`;
      saveAs(blob, fileName);
      
      this.$message.success(`成功导出${allMembers.length}条学生数据`);
    } catch (error) {
      console.error('导出学生名单失败:', error);
      this.$message.error('导出学生名单失败：' + (error.message || '未知错误'));
    }
},
  viewApplications(classId) {
  this.$router.push({ name: 'classapplication', params: { classId } });
},

  // ==================== 二维码相关方法 ====================
  
  /**
   * 显示班级二维码
   * 作用：生成并显示指定班级的二维码，学生扫码后可以加入班级
   * @param {Number} classId - 班级ID
   * @param {String} className - 班级名称
   */
  showQRCode(classId, className) {
    // 保存班级信息
    this.currentQRClassId = classId;
    this.currentClassName = className;
    
    // 生成二维码URL（这个URL指向后端生成二维码图片的接口）
    this.qrcodeImageUrl = generateQRCodeUrl(classId);
    
    // 显示对话框
    this.qrcodeDialogVisible = true;
    
    console.log('生成二维码URL:', this.qrcodeImageUrl);
  },

  // ==================== Excel导入相关方法 ====================
  
  /**
   * 打开导入对话框
   * 作用：显示导入对话框，并记录当前要导入到哪个班级
   */
  openImportDialog(classId) {
    this.importClassId = classId;
    this.importDialogVisible = true;
    // 重置状态
    this.fileList = [];
    this.excelFile = null;
    this.importResult = null;
  },
  
  /**
   * 关闭导入对话框
   * 作用：关闭对话框并清空所有数据，避免下次打开时显示旧数据
   */
  closeImportDialog() {
    this.importDialogVisible = false;
    this.fileList = [];
    this.excelFile = null;
    this.importResult = null;
    this.importing = false;
  },
  
  /**
   * 下载Excel模板
   * 作用：从后端下载模板文件，让教师知道正确的Excel格式
   */
  async downloadTemplate() {
    try {
      // 调用API获取模板文件（二进制数据）
      const response = await downloadImportTemplate();
      
      // 创建Blob对象（Binary Large Object，二进制大对象）
      const blob = new Blob([response], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'  // Excel文件的MIME类型
      });
      
      // 创建临时下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'xueshengmingdan.xlsx';  // 下载的文件名（使用英文，避免编码问题）
      link.click();  // 触发下载
      
      // 释放URL对象，避免内存泄漏
      window.URL.revokeObjectURL(url);
      
      this.$message.success('模板下载成功，请按照模板格式填写学生信息');
    } catch (error) {
      console.error('下载模板失败', error);
      this.$message.error('下载模板失败：' + (error.message || '未知错误'));
    }
  },
  
  /**
   * 文件选择变化时触发
   * 作用：用户选择或拖拽文件后，保存文件对象
   */
  handleFileChange(file, fileList) {
    this.excelFile = file.raw;  // file.raw是原始的File对象
    this.fileList = fileList;   // 更新文件列表用于显示
  },
  
  /**
   * 文件移除时触发
   * 作用：用户删除已选择的文件时，清空文件数据
   */
  handleFileRemove(file, fileList) {
    this.excelFile = null;
    this.fileList = fileList;
  },
  
  /**
   * 执行导入
   * 作用：将Excel文件上传到后端，后端会解析并导入学生
   */
  async handleImport() {
    // 检查是否选择了文件
    if (!this.excelFile) {
      this.$message.warning('请先选择Excel文件');
      return;
    }
    
    // 开始导入，显示loading状态
    this.importing = true;
    this.importResult = null;  // 清空之前的结果
    
    try {
      // 调用API上传文件
      const response = await importStudents(this.excelFile, this.importClassId);
      
      // 判断后端返回的结果
      if (response.code === 1) {
        // 保存导入结果数据
        this.importResult = response.data;
        
        // 根据结果显示不同的提示
        if (response.data.failed === 0) {
          this.$message.success('导入成功！所有学生都已加入班级');
        } else {
          this.$message.warning(
            `导入完成！成功 ${response.data.success} 条，失败 ${response.data.failed} 条，请查看失败详情`
          );
        }
        
        // 如果当前正在查看这个班级的学生列表，刷新列表
        if (this.currentClassId === this.importClassId && this.dialogVisible) {
          await this.fetchMembers();
        }
        
        // 导入成功后清空文件列表，方便下次导入
        this.fileList = [];
        this.excelFile = null;
        // 清空上传组件
        if (this.$refs.upload) {
          this.$refs.upload.clearFiles();
        }
      } else {
        // 后端返回错误
        this.$message.error('导入失败：' + response.msg);
      }
    } catch (error) {
      console.error('导入失败', error);
      this.$message.error('导入失败：' + (error.message || '网络错误，请重试'));
    } finally {
      // 无论成功失败，都要关闭loading状态
      this.importing = false;
    }
},
},
};
</script>



<style scoped>
.class-management {
  padding: 20px;
}
.box-card {
  margin-bottom: 20px;
}
.class-form {
  max-width: 600px;
}
.class-table {
  width: 100%;
}
.unprocessed-count {
  color: red; /* 未处理申请数量显示为红色 */
  font-weight: bold; /* 加粗字体 */
}
</style>
