<template>
   <div class="task-detail">
    <el-card class="task-card">
      <div class="task-header" @click="toggleDetails">
        <h4>作业信息</h4>
        <i :class="['el-icon-arrow-down', { 'rotate-icon': showDetails }]"></i>
      </div>

      <el-collapse-transition>
        <div v-if="showDetails && taskDetails" class="task-info-grid">
          <div><strong>作业名称:</strong> {{ taskDetails.taskName }}</div>
          <div><strong>截止时间:</strong> {{ formatDeadline(taskDetails.deadline) }}</div>
          <div><strong>提交内容:</strong> {{ taskDetails.submissionTypes.join(', ') }}</div>
          <div><strong>评价流程:</strong> {{ taskDetails.evaluationMethods.join('-') }}</div>
          <div><strong>分值:</strong> 总分 100分</div>
          <div><strong>其中:</strong>
            视频 权重 {{ taskDetails.weights[0] }}%、
            音频 权重 {{ taskDetails.weights[1] }}%、
            演讲稿 权重 {{ taskDetails.weights[2] }}%、
            PPT 权重 {{ taskDetails.weights[3] }}%
          </div>
          <div><strong>作业要求:</strong> {{ taskDetails.taskRequirements || '无' }}</div>
        </div>
      </el-collapse-transition>
    </el-card>


  <!-- 新增的文件上传卡片 -->
  <el-card v-if="taskDetails" class="upload-card">
    <div class="card-header">
      <h4>提交作业</h4>
      <el-tag
        :type="isNearDeadline ? 'danger' : 'warning'"
        v-if="remainingTime"
      >
        距离截止还有 {{ remainingTime }}

      </el-tag>
      <!-- :disabled="!canSubmit || isSubmitted || !hasPreviewFiles || isSubmitting" -->

      <div class="submit-section" v-if="!isOverdue">
        <el-button
          type="primary"
          @click="submitAllFiles"
          size="large">
          {{ isSubmitted ? '已提交' : (isSubmitting ? '提交中...' : '提交所有文件') }}
        </el-button>
      </div>

    </div>

    <!-- 上传文件 -->
    <div class="upload-grid">
      <!-- 视频上传 -->
      <div
        v-if="taskDetails.submissionTypes.includes('视频')"
        class="upload-item"
      >
        <div class="upload-title">
          <i class="el-icon-video-camera"></i>
          <span>视频文件</span>
          <el-tag size="mini" type="info">权重 {{ taskDetails.weights[0] }}%</el-tag>
          <el-tag
            v-if="submissionHistory.submittedFiles.video.submitted"
            size="mini"
            type="success"
          >
            已提交
          </el-tag>
        </div>

        <div
          v-if="submissionHistory.submittedFiles.video.submitted"
          class="file-history"
        >
          <p>提交时间：{{ formatTime(submissionHistory.submittedFiles.video.submitTime) }}</p>
        </div>

        <el-upload
          class="upload-area"
          drag
          action="#"
          :http-request="handleHttpRequest"
          :before-upload=" beforeFileUpload"
          :on-progress="(event) => handleProgress(event, '视频')"
          :on-error="handleError"
          accept=".mp4,.avi,.mov"
          :disabled="isSubmitted || isOverdue"
        >

          <template v-if="!isOverdue && !uploadStatus.video">
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <div class="el-upload__tip">支持 mp4/avi/mov 格式，大小不超过500MB</div>
          <!-- 添加进度条 -->
          <el-progress
            v-if="uploadProgress.video > 0 && uploadProgress.video < 100"
            :percentage="uploadProgress.video"
            :stroke-width="4"
          ></el-progress>
          </template>

          <div v-else class="upload-disabled-tip">
            <i class="el-icon-warning"></i>
            <span>{{ isOverdue ? '作业已截止' : '作业已提交' }}</span>
          </div>

        </el-upload>


      </div>

      <!-- 音频上传 -->
      <div
        v-if="taskDetails.submissionTypes.includes('音频')"
        class="upload-item"
      >
        <div class="upload-title">
          <i class="el-icon-headset"></i>
          <span>音频文件</span>
          <el-tag size="mini" type="info">权重 {{ taskDetails.weights[1] }}%</el-tag>
          <el-tag
            v-if="submissionHistory.submittedFiles.audio.submitted"
            size="mini"
            type="success"
          >
            已提交
          </el-tag>
        </div>

        <div
          v-if="submissionHistory.submittedFiles.audio.submitted"
          class="file-history"
        >
          <p>提交时间：{{ formatTime(submissionHistory.submittedFiles.audio.submitTime) }}</p>
        </div>

        <template v-if="isVideoRequired">
          <div class="no-upload-needed">
            <i class="el-icon-info"></i>
            <span>作业包含视频提交要求，无需提交音频</span>
          </div>
        </template>

        <template v-else>
        <el-upload
          class="upload-area"
          drag
          action="#"
          :http-request="handleHttpRequest"
          :before-upload="beforeFileUpload"
          :on-progress="(event) => handleProgress(event, '音频')"
          :on-error="handleError"
          accept=".mp3,.wav"
          :disabled="isSubmitted || isOverdue"
        >
          <template v-if="!isOverdue && !uploadStatus.audio">

          <i class="el-icon-upload"></i>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <div class="el-upload__tip">支持 mp3/wav 格式，大小不超过200MB</div>
          <el-progress
            v-if="uploadProgress.audio > 0 && uploadProgress.audio < 100"
            :percentage="uploadProgress.audio"
            :stroke-width="4"
          ></el-progress>
          </template>

          <div v-else class="upload-disabled-tip">
            <i class="el-icon-warning"></i>
            <span>{{ isOverdue ? '作业已截止' : '作业已提交' }}</span>
          </div>
        </el-upload>
      </template>
      </div>

      <!-- 演讲稿上传 -->
      <div
        v-if="taskDetails.submissionTypes.includes('演讲稿')"
        class="upload-item"
      >
        <div class="upload-title">
          <i class="el-icon-document"></i>
          <span>演讲稿</span>
          <el-tag size="mini" type="info">权重 {{ taskDetails.weights[2] }}%</el-tag>
          <el-tag
            v-if="submissionHistory.submittedFiles.word.submitted"
            size="mini"
            type="success"
          >
            已提交
          </el-tag>
        </div>
        <!-- 显示历史文件信息 -->
        <div
          v-if="submissionHistory.submittedFiles.word.submitted"
          class="file-history"
        >
          <p>提交时间：{{ formatTime(submissionHistory.submittedFiles.word.submitTime) }}</p>
        </div>

        <el-upload
          class="upload-area"
          drag
          action="#"
          :http-request="handleHttpRequest"
          :before-upload=" beforeFileUpload"
          :on-progress="(event) => handleProgress(event, '演讲稿')"
          :on-error="handleError"
          accept=".doc,.docx"
          :disabled="isSubmitted ||isOverdue"
        >
          <template v-if="!isOverdue && !uploadStatus.word">
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <div class="el-upload__tip">支持 doc/docx 格式，大小不超过100MB</div>
          <el-progress
            v-if="uploadProgress.word > 0 && uploadProgress.word < 100"
            :percentage="uploadProgress.word"
            :stroke-width="4"
          ></el-progress>
          </template>
          <div v-else class="upload-disabled-tip">
            <i class="el-icon-warning"></i>
            <span>{{ isOverdue ? '作业已截止' : '作业已提交' }}</span>
          </div>
        </el-upload>

      </div>

      <!-- PPT上传 -->
      <div
        v-if="taskDetails.submissionTypes.includes('PPT')"
        class="upload-item"
      >
        <div class="upload-title">
          <i class="el-icon-picture"></i>
          <span>PPT文件</span>
          <el-tag size="mini" type="info">权重 {{ taskDetails.weights[3] }}%</el-tag>
          <!-- 添加提交状态标签 -->
          <el-tag
            v-if="submissionHistory.submittedFiles.ppt.submitted"
            size="mini"
            type="success"
          >
            已提交
          </el-tag>
        </div>
        <!-- 显示历史文件信息 -->
        <div
          v-if="submissionHistory.submittedFiles.ppt.submitted"
          class="file-history"
        >
          <p>提交时间：{{ formatTime(submissionHistory.submittedFiles.ppt.submitTime) }}</p>
        </div>
        <el-upload
          class="upload-area"
          drag
          action="#"
          :http-request="handleHttpRequest"
          :before-upload=" beforeFileUpload"
          :on-progress="(event) => handleProgress(event, 'PPT')"
          :on-error="handleError"
          accept=".pdf"
          :disabled="isSubmitted || isOverdue"
        >
          <template v-if="!isOverdue && !uploadStatus.ppt">
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <div class="el-upload__tip">仅支持pdf格式，大小不超过200MB</div>
          <el-progress
            v-if="uploadProgress.ppt> 0 && uploadProgress.ppt < 100"
            :percentage="uploadProgress.ppt"
            :stroke-width="4"
          ></el-progress>
          </template>
          <div v-else class="upload-disabled-tip">
            <i class="el-icon-warning"></i>
            <span>{{ isOverdue ? '作业已截止' : '作业已提交' }}</span>
          </div>
        </el-upload>
      </div>

    </div>

    <!-- 预览文件 -->
    <div v-if="hasPreviewFiles" class="preview-section">
      <div class="modal-container">
        <!-- 视频模态 -->
        <div v-if="previewFiles.video" class="modal-card">
          <div class="modal-header">
            <h4>视频文件</h4>
          </div>
          <div class="preview-content">
            <div class="preview-file-info">
              <i :class="getFileIcon('video')"></i>
              <span>{{ previewFiles.video.name }}</span>
              <span class="preview-file-size">{{ formatFileSize(previewFiles.video.size) }}</span>
            </div>
            <div class="file-actions">
              <el-button type="text" @click="handlePreview(previewFiles.video, 'video')" :disabled="isSubmitted">
                <i class="el-icon-view"></i> 预览
              </el-button>
              <el-button type="text" @click="removePreviewFile('video')" :disabled="isSubmitted">
                <i class="el-icon-delete"></i> 删除
              </el-button>
            </div>
          </div>
        </div>

        <!-- 音频模态 -->
        <div v-if="previewFiles.audio" class="modal-card">
          <div class="modal-header">
            <h4>音频文件</h4>
          </div>
          <div class="preview-content">
            <div class="preview-file-info">
              <i :class="getFileIcon('audio')"></i>
              <span>{{ previewFiles.audio.name }}</span>
              <span class="preview-file-size">{{ formatFileSize(previewFiles.audio.size) }}</span>
            </div>
            <div class="file-actions">
              <el-button type="text" @click="handlePreview(previewFiles.audio, 'audio')" :disabled="isSubmitted">
                <i class="el-icon-view"></i> 预览
              </el-button>
              <el-button type="text" @click="removePreviewFile('audio')" :disabled="isSubmitted">
                <i class="el-icon-delete"></i> 删除
              </el-button>
            </div>
          </div>
        </div>

        <!-- 演讲稿模态 -->
        <div v-if="previewFiles.word" class="modal-card">
          <div class="modal-header">
            <h4>演讲稿</h4>
          </div>
          <div class="preview-content">
            <div class="preview-file-info">
              <i :class="getFileIcon('word')"></i>
              <span>{{ previewFiles.word.name }}</span>
              <span class="preview-file-size">{{ formatFileSize(previewFiles.word.size) }}</span>
            </div>
            <div class="file-actions">
              <el-button type="text" @click="handlePreview(previewFiles.word, 'word')" :disabled="isSubmitted">
                <i class="el-icon-view"></i> 预览
              </el-button>
              <el-button type="text" @click="removePreviewFile('word')" :disabled="isSubmitted">
                <i class="el-icon-delete"></i> 删除
              </el-button>
            </div>
          </div>
        </div>

        <!-- PPT模态 -->
        <div v-if="previewFiles.ppt" class="modal-card">
          <div class="modal-header">
            <h4>PPT文件</h4>
          </div>
          <div class="preview-content">
            <div class="preview-file-info">
              <i :class="getFileIcon('ppt')"></i>
              <span>{{ previewFiles.ppt.name }}</span>
              <span class="preview-file-size">{{ formatFileSize(previewFiles.ppt.size) }}</span>
            </div>
            <div class="file-actions">
              <el-button type="text" @click="handlePreview(previewFiles.ppt, 'ppt')" :disabled="isSubmitted">
                <i class="el-icon-view"></i> 预览
              </el-button>
              <el-button type="text" @click="removePreviewFile('ppt')" :disabled="isSubmitted">
                <i class="el-icon-delete"></i> 删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-card>

    <score-table :task-id="taskId"
                 :submission-status="submissionStatus"
                 :task-details="taskDetails"
                 :submitId = 'submitId'
                 @grading-completed="handleGradingCompleted" />

     <el-dialog
       :visible.sync="previewDialogVisible"
       width="70%"
       class="preview-dialog"
       :before-close="handlePreviewClose">

       <!-- 不同文件类型的预览组件 -->
       <div class="preview-content">
         <!-- 视频预览 -->
         <div v-if="currentPreviewType === 'video'" class="video-preview">
           <video
             v-if="previewUrl"
             controls
             class="preview-video"
             :src="previewUrl">
             您的浏览器不支持视频预览
           </video>
         </div>

         <!-- 音频预览 -->
         <div v-else-if="currentPreviewType === 'audio'" class="audio-preview">
           <audio v-if="previewUrl" controls :src="previewUrl">
             您的浏览器不支持音频预览
           </audio>
         </div>

         <!-- PDF预览 -->
         <div v-else-if="currentPreviewType === 'ppt'" class="pdf-preview">
           <iframe
             v-if="previewUrl"
             :src="previewUrl"
             class="preview-pdf"
             frameborder="0">
           </iframe>
         </div>

         <!-- Word文档预览 -->
         <div v-else-if="currentPreviewType === 'word'" class="word-preview">
           <div class="preview-word" v-loading="previewLoading">
             <div v-html="wordContent"></div>
           </div>
         </div>
       </div>

       <!-- 预览控制按钮 -->
       <div slot="footer" class="dialog-footer">
         <el-button @click="handlePreviewClose">关闭</el-button>
       </div>
     </el-dialog>


  </div>
</template>

<script>
import { getTaskInfoById ,getSubmissionsByStuId} from "@/api/myTask/myHomework/index";
import { uploadVideoTask, uploadAudioTask, uploadWordTask, uploadPPTTask } from '@/api/myTask/myHomework/index';
import {fetchAllGrades,getSubmissionInfoById} from '@/api/myTask/myHomework/machineEvaluation';
import ScoreTable from './ScoreTable.vue';
import { mapGetters } from 'vuex';
import mammoth from 'mammoth';
const FILE_PARAM_MAPPING = {
  video: {
    fileParam: 'File',
    nameParam: 'videoFileName',
    type: '视频'
  },
  audio: {
    fileParam: 'File',
    nameParam: 'fileName',
    type: '音频'
  },
  word: {
    fileParam: 'File',
    nameParam: 'fileName',
    type: '演讲稿'
  },
  ppt: {
    fileParam: 'File',
    nameParam: 'fileName',
    type: 'PPT'
  }
};
export default {
  props: {
    taskId: {
      type: String,
      required: true
    },
    submitId: {
      type: String,
      required: true
    },
    fileNames: {
      type: String,
      default: '{}' // 提供默认值
    }
  },
  components: {
    ScoreTable,

  },
  data() {
    return {
      taskDetails: null,
      showDetails: true,
      remainingTime: '',
      deadlineTimer: null,
      uploadProgress: {
        video: 0,
        audio: 0,
        word: 0,
        ppt: 0,
      },
      uploadStatus: {
        video: false,
        audio: false,
        word: false,
        ppt: false
      },
      requiredFiles: new Set(), // 用于存储需要上传的文件类型
      submissionStatus: 'none',
      currentSubmission: null,  // 当前作业的提交记录
      isSubmitted: false,

      confirmDialogVisible: false,
      currentFile: null,
      currentFileType: null,
      submissionHistory: {
        hasHistory: false,
        lastSubmitTime: null,
        submittedFiles: {
          video: { submitted: false, filename: null, submitTime: null },
          audio: { submitted: false, filename: null, submitTime: null },
          word: { submitted: false, filename: null, submitTime: null },
          ppt: { submitted: false, filename: null, submitTime: null }
        }
      },
      previewFiles: {
        video: null,
        audio: null,
        word: null,
        ppt: null
      },
      canSubmit: true, // 控制是否可以最终提交
      isSubmitting: false, // 是否正在提交中
      previewDialogVisible: false, // 预览框显示控制
      currentPreviewType: '', // 当前预览的文件类型
      previewUrl: '', // 预览文件的URL
      previewLoading: false, // 预览加载状态
      wordContent: '', // Word文档内容
      machineEvaluations: {} ,// 存储机评数据
    };
  },

  watch: {
    // 监听taskDetails变化，初始化需要上传的文件类型
    'taskDetails.submissionTypes'(types) {
      if (types) {
        this.requiredFiles.clear();
        const typeMap = {
          '视频': 'video',
          '音频': 'audio',
          '演讲稿': 'word',
          'PPT': 'ppt'
        };
        types.forEach(type => {
          if (typeMap[type]) {
            this.requiredFiles.add(typeMap[type]);
          }
        });
      }
    },
  },

  computed: {
    ...mapGetters(['userId']),
    parsedFileNames() {
      try {
        return JSON.parse(this.fileNames || '{}');
      } catch (e) {
        console.error('解析fileNames失败:', e);
        return {};
      }
    },
    isNearDeadline() {
      if (!this.taskDetails) return false;
      const now = new Date();
      const deadlineDate = new Date(this.taskDetails.deadline);
      const diffHours = (deadlineDate - now) / (1000 * 60 * 60);
      return diffHours <= 24 && diffHours > 0;
    },
    isOverdue() {
      if (!this.taskDetails) return true; // 如果任务详情未加载，默认禁止上传
      const now = new Date();
      const deadlineDate = new Date(this.taskDetails.deadline);
      return now > deadlineDate; // 当前时间超过截止时间
    },
    hasPreviewFiles() {
      return Object.values(this.previewFiles).some(file => file !== null);
    },
    isVideoRequired() {
      return this.taskDetails && this.taskDetails.submissionTypes.includes('视频');
    }
  },

  methods: {
    async fetchTaskDetails() {
      try {
        const response = await getTaskInfoById(this.taskId);
        if (response.code === 1) {
          this.taskDetails = response.data;
        } else {
          console.error("获取任务详情失败:", response.msg);
        }
      } catch (error) {
        console.error("获取任务详情时发生错误:", error);
      }
    },
    toggleDetails() {
      this.showDetails = !this.showDetails;
    },
    formatDeadline(deadline) {
      const date = new Date(deadline);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },

    updateRemainingTime() {
      if (!this.taskDetails) return;

      const now = new Date();
      const deadlineDate = new Date(this.taskDetails.deadline);
      const diff = deadlineDate - now;

      if (diff <= 0) {
        this.remainingTime = '已截止';
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      this.remainingTime = `${hours}小时${minutes}分钟`;
    },
    async handleHttpRequest({ file }) {
      // 获取文件类型
      const fileType = this.getFileType(file);
      if (!fileType) {
        throw new Error('不支持的文件类型');
      }

      // 更新预览文件
      this.previewFiles[fileType] = file;

      // 返回假的上传成功响应
      return {
        code: 0,
        msg: 'File preview ready'
      };
    },

    // 修改 beforeFileUpload 方法
    async beforeFileUpload(file) {
      // 验证文件
      if (!this.validateFile(file)) {
        return false;
      }

      // 检查是否重复提交
      const fileType = this.getFileType(file);
      if (this.uploadStatus[fileType]) {
        this.currentFile = file;
        this.currentFileType = fileType;
        this.confirmDialogVisible = true;
        return false;
      }

      return true;
    },

    // 获取文件类型
    getFileType(file) {
      const mimeType = file.type;
      if (mimeType.includes('video')) return 'video';
      if (mimeType.includes('audio')) return 'audio';
      if (mimeType.includes('msword') || mimeType.includes('wordprocessingml')) return 'word';
      // 修改PPT类型判断为PDF
      if (mimeType === 'application/pdf') return 'ppt';
      return null;
    },
    // 文件验证分发函数
    validateFile(file) {
      // 原有的验证逻辑保持不变
      const type = this.getFileType(file);
      switch(type) {
        case 'video':
          return this.validateVideo(file);
        case 'audio':
          return this.validateAudio(file);
        case 'word':
          return this.validateWord(file);
        case 'ppt':
          return this.validatePPT(file);
        default:
          return false;
      }
    },

    // 视频文件验证
    validateVideo(file) {
      const isValidType = ['video/mp4', 'video/avi', 'video/quicktime'].includes(file.type);
      const isLt500M = file.size / 1024 / 1024 < 500;

      if (!isValidType) {
        this.$message.error('请上传正确的视频格式!');
        return false;
      }
      if (!isLt500M) {
        this.$message.error('视频大小不能超过500MB!');
        return false;
      }
      return true;
    },

    // 音频文件验证
    validateAudio(file) {
      const isValidType = ['audio/mpeg', 'audio/wav'].includes(file.type);
      const isLt200M = file.size / 1024 / 1024 < 200;

      if (!isValidType) {
        this.$message.error('请上传正确的音频格式!');
        return false;
      }
      if (!isLt200M) {
        this.$message.error('音频大小不能超过100MB!');
        return false;
      }
      return true;
    },

    // Word文档验证
    validateWord(file) {
      const isValidType = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ].includes(file.type);
      const isLt100M = file.size / 1024 / 1024 < 100;

      if (!isValidType) {
        this.$message.error('请上传Word文档!');
        return false;
      }
      if (!isLt100M) {
        this.$message.error('文件大小不能超过20MB!');
        return false;
      }
      return true;
    },

    validatePPT(file) {
      // 更改为验证PDF文件
      const isValidType = ['application/pdf'].includes(file.type);
      const isLt200M = file.size / 1024 / 1024 < 200;

      if (!isValidType) {
        this.$message.error('请上传PDF文档!');
        return false;
      }
      if (!isLt200M) {
        this.$message.error('文件大小不能超过200MB!');
        return false;
      }
      return true;
    },

    // 移除预览文件
    removePreviewFile(type) {
      this.$set(this.previewFiles, type, null);
    },

    formatFileSize(size) {
      if (size < 1024) {
        return size + ' B';
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + ' KB';
      } else {
        return (size / (1024 * 1024)).toFixed(2) + ' MB';
      }
    },
// 修改检查文件处理状态的方法
    // 修改checkFileProcessingStatus方法
    async checkFileProcessingStatus() {
      const MAX_ATTEMPTS = 20;
      let attempts = 0;

      while (attempts < MAX_ATTEMPTS) {
        try {
          // 等待接口返回结果
          const response = await getSubmissionInfoById(this.submitId);

          // 增加日志，便于调试
          console.log(`轮询次数: ${attempts + 1}, 状态:`, response.data.taskInfos.map(info => ({
            type: info.submissionType,
            finished: info.finished
          })));

          if (response.code !== 1) {
            throw new Error('获取提交状态失败');
          }

          // 检查所有文件是否处理完成
          const allFilesFinished = response.data.taskInfos.every(info => info.finished === true);

          if (allFilesFinished) {
            console.log('所有文件处理完成');
            return true;
          }

          // 在进行下一次轮询前增加固定延迟
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;

        } catch (error) {
          console.error(`第 ${attempts + 1} 次轮询出错:`, error);
          // 发生错误时也等待一段时间再重试
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;
        }
      }

      throw new Error('文件处理超时，请刷新页面检查处理状态');
    },

    async submitAllFiles() {
      if (!this.canSubmit || this.isSubmitting) return;

      try {
        this.isSubmitting = true;
        let uploadSuccess = true;

        // 按顺序处理每个文件的上传
        for (const [fileType, file] of Object.entries(this.previewFiles)) {
          if (!file) continue;

          const formData = new FormData();
          const paramMapping = FILE_PARAM_MAPPING[fileType];
          formData.append(paramMapping.fileParam, file);
          formData.append(paramMapping.nameParam, this.parsedFileNames[paramMapping.type]);

          try {
            let response;
            // 分别处理每种类型的文件上传
            switch (fileType) {
              case 'video':
                response = await uploadVideoTask(formData);
                break;
              case 'audio':
                response = await uploadAudioTask(formData);
                break;
              case 'word':
                response = await uploadWordTask(formData);
                break;
              case 'ppt':
                response = await uploadPPTTask(formData);
                break;
            }

            // 检查每个上传的响应
            if (response.code !== 0) {
              uploadSuccess = false;
              throw new Error(`${paramMapping.type}上传失败: ${response.msg}`);
            }

            // 显示每个文件上传成功的消息
            this.$message.success(`${paramMapping.type}上传成功`);

          } catch (error) {
            uploadSuccess = false;
            this.$message.error(error.message || `${paramMapping.type}上传失败`);
            break; // 如果有一个上传失败，停止后续上传
          }
        }

        // 只有在所有文件都成功上传后才开始轮询
        if (uploadSuccess) {
          this.$message.success('所有文件上传完成，开始处理...');

          try {
            const processed = await this.checkFileProcessingStatus();
            if (processed) {
              const grades = await fetchAllGrades(this.userId, this.taskId, this.taskDetails);
              if (grades) {
                this.handleGradeResults(grades);
              }
            }
          } catch (error) {
            throw new Error('文件处理失败：' + error.message);
          }
        }

      } catch (error) {
        console.error('提交错误:', error);
        this.$message.error(error.message || '文件提交失败');
      } finally {
        this.isSubmitting = false;
      }
    },

    handleGradeResults(grades) {
      // 保存机评数据
      this.machineEvaluations = grades;


      // 在控制台打印机评数据
      console.group('机评结果详情');

      Object.entries(grades).forEach(([type, evaluation]) => {
        console.group(`${type}评价信息`);
        console.log('完成状态:', evaluation.finished);
        console.log('评分:', evaluation.grade);
        console.log('评价内容:', evaluation.evaluationTitle);
        console.log('评价维度:', evaluation.evaluationDimensions);
        console.groupEnd();
      });

      console.groupEnd();

      // 为不同类型设置不同位置
      Object.entries(grades).forEach(([type, evaluation]) => {
        if (evaluation.finished) {
          let grade = evaluation.grade;
          // 音频分数特殊处理 - 使用与表格相同的转换逻辑
          if (type === '音频' && grade !== null) {
            if (grade > 0) {  // 只有分数大于0时才进行转换
              grade = grade * 20 + 10; // 将0-5分转换为0-100分制
              grade = Math.min(Math.round(grade), 100); // 确保不超过100分
            } else {
              grade = 0;  // 当分数为0时保持0分
            }
          }

          const notificationConfig = {
            title: `${type}机评完成`,
            message: `总分：${grade?.toFixed(2) ?? '-'}`,
            type: 'success',
            duration: 4500  // 显示时间
          };

          // 根据类型设置不同位置
          switch(type) {
            case '视频':
              this.$notify({
                ...notificationConfig,
                position: 'top-right',
                offset: 20
              });
              break;
            case '音频':
              this.$notify({
                ...notificationConfig,
                position: 'top-right',
                offset: 150  // 第二个通知往下偏移
              });
              break;
            case '演讲稿':
              this.$notify({
                ...notificationConfig,
                position: 'top-right',
                offset: 220  // 第三个通知再往下偏移
              });
            case 'PPT':
              this.$notify({
                ...notificationConfig,
                position: 'top-right',
                offset: 420  // 第四个通知再往下偏移
              });
              break;
          }
        }
      });
    },

    async handlePreview(file, type) {
      this.previewLoading = true;
      this.currentPreviewType = type;
      this.previewDialogVisible = true;

      try {
        switch(type) {
          case 'video':
            this.previewUrl = URL.createObjectURL(file);
            this.wordContent = ''; // 清除其他内容
            break;

          case 'audio':
            this.previewUrl = URL.createObjectURL(file);
            // 设置音频播放器的HTML
            console.log('音频预览URL:', this.previewUrl);
            this.wordContent =''
            break;

          case 'ppt':
            if (file.type === 'application/pdf') {
              this.previewUrl = URL.createObjectURL(file);
              this.wordContent = ''; // 清除其他内容
            } else {
              throw new Error('不支持的文件格式');
            }
            break;

          case 'word':
            await this.handleWordPreview(file);
            break;
        }
      } catch (error) {
        this.$message.error('预览失败：' + error.message);
      } finally {
        this.previewLoading = false;
      }
    },

// 处理Word文档预览
    async handleWordPreview(file) {
      try {
        const reader = new FileReader();
        const arrayBuffer = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (error) => reject(new Error('文件读取失败: ' + error));
          reader.readAsArrayBuffer(file);
        });

        // 使用mammoth转换Word为HTML
        const result = await mammoth.convertToHtml({ arrayBuffer });
        // 添加样式包装
        this.wordContent = `
      <div class="word-preview-content">
        ${result.value}
      </div>
    `;

        // 如果有转换警告，可以在控制台输出
        if (result.messages.length > 0) {
          console.warn('Word转换提示:', result.messages);
        }
      } catch (error) {
        throw new Error('Word文档预览失败: ' + error.message);
      }
    },

    // 关闭预览
    handlePreviewClose() {
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl);
      }
      this.previewDialogVisible = false;
      this.previewUrl = '';
      this.wordContent = '';
      this.currentPreviewType = '';
    },

    // 修改文件选择处理方法
    async handleFileSelected(file, type) {
      // 验证文件
      if (!this.validateFile(file)) {
        return;
      }

      // 更新预览文件
      this.previewFiles[type] = file;

      // 自动打开预览
      await this.handlePreview(file, type);
    },


    async fetchSubmissionStatus() {
      try {
        // 1. 获取所有提交记录
        const response = await getSubmissionsByStuId(this.userId);

        if (response.code === 1) {
          // 2. 查找当前作业的提交记录
          this.currentSubmission = response.data.rows.find(
            item => item.taskId === this.taskId
          );

          if (this.currentSubmission) {
            // 3. 更新提交历史基本信息
            this.submissionHistory.hasHistory = true;
            this.submissionHistory.lastSubmitTime = this.currentSubmission.submitTime;

            // 4. 先重置所有状态
            Object.keys(this.uploadStatus).forEach(key => {
              this.uploadStatus[key] = false;
            });
            Object.keys(this.submissionHistory.submittedFiles).forEach(key => {
              this.submissionHistory.submittedFiles[key] = {
                submitted: false,
                filename: null,
                submitTime: null
              };
            });

            // 5. 获取文件状态列表并更新
            const fileStatus = this.currentSubmission.taskInfos || [];

            fileStatus.forEach(info => {
              // 4. 打印每个文件的详细状态
              console.log(`文件 ${info.submissionType} 的状态：`, {
                文件名: info.fileName,
                提交时间: info.submittedTime,
                是否完成: info.finished
              });
            });



            fileStatus.forEach(info => {
              const typeMap = {
                '视频': 'video',
                '音频': 'audio',
                '演讲稿': 'word',
                'PPT': 'ppt'
              };
              const fileType = typeMap[info.submissionType];

              // 根据 submittedTime 和 finished 判断文件是否已提交
              const isFileSubmitted = info.submittedTime !== null && info.finished === true;

              if (fileType && isFileSubmitted) {
                // 更新上传状态
                this.uploadStatus[fileType] = true;

                // 更新提交历史详情
                this.submissionHistory.submittedFiles[fileType] = {
                  submitted: true,
                  filename: info.fileName,
                  submitTime: info.submittedTime
                };
              }
            });

            // 6. 判断整体提交状态
            this.isSubmitted = Object.values(this.uploadStatus)
              .every(status => status);
          } else {
            // 7. 如果没有找到提交记录，重置所有状态
            this.submissionHistory.hasHistory = false;
            this.submissionHistory.lastSubmitTime = null;
            Object.keys(this.uploadStatus).forEach(key => {
              this.uploadStatus[key] = false;
            });
            this.isSubmitted = false;
          }
        }
      } catch (error) {
        console.error('获取提交记录失败:', error);
        this.$message.error('获取提交状态失败，请稍后重试');
      }
    },


    // 添加进度处理方法
    handleProgress(event, fileType) {
      const progress = Math.round(event.percent);
      this.uploadProgress[fileType.toLowerCase()] = progress;

      // 添加上传进度提示
      if (progress < 100) {
        console.log(`${FILE_PARAM_MAPPING[fileType.toLowerCase()].type}上传进度: ${progress}%`);
      }
    },
    handleSuccess(response, fileType) {
      const type = {
        '视频': 'video',
        '音频': 'audio',
        '演讲稿': 'word',
        'PPT': 'ppt'
      }[fileType];

      this.uploadProgress[type] = 0;
      this.uploadStatus[type] = true;

      // 检查是否所有必需文件都已上传
      const allUploaded = Array.from(this.requiredFiles).every(
        fileType => this.uploadStatus[fileType]
      );

      // 更新提交状态但不禁用重复提交
      if (allUploaded) {
        this.submissionStatus = 'submitted';
        this.$message.success(this.isSubmitted ? '文件重新提交成功' : '所有文件已上传成功，系统正在评分中');
        this.isSubmitted = true;
        this.fetchSubmissionStatus();
      } else {
        this.$message.success(`${fileType}上传成功`);
      }
    },


// 处理上传错误
    handleError(error, fileType) {
      const paramMapping = FILE_PARAM_MAPPING[fileType.toLowerCase()];

      console.error(`${paramMapping.type}上传错误:`, {
        error,
        fileType,
        parameterName: paramMapping.nameParam,
        errorMessage: error.message || '未知错误'
      });

      this.uploadStatus[fileType.toLowerCase()] = false;

      this.$notify({
        title: '错误',
        message: `${paramMapping.type}上传失败: ${error.message || '请检查文件格式和大小'}`,
        type: 'error',
        duration: 5000
      });
    },

    handleAudioError(e) {
      console.error('音频加载错误:', e);
      this.$message.error('音频加载失败，请检查文件格式是否正确');
    },
    handleGradingCompleted() {
      this.submissionStatus = 'completed';
      this.$message.success('评分完成，成绩已更新');
    },
    formatTime(timestamp) {
      if (!timestamp) return '暂无记录';
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
    },

    handleDialogClose() {
      this.confirmDialogVisible = false;
      this.currentFile = null;
      this.currentFileType = null;
    },
    getFileIcon(type) {
      // 文件类型对应的图标类名映射
      const iconMap = {
        video: 'el-icon-video-camera', // 视频图标
        audio: 'el-icon-headset',      // 音频图标
        word: 'el-icon-document',      // 文档图标
        ppt: 'el-icon-picture'         // PPT图标（使用图片图标代替）
      };

      // 返回对应的图标类名，如果找不到对应类型则返回默认文件图标
      return iconMap[type] || 'el-icon-document';
    }
  },
  created() {
    console.log('this.isSubmitted',this.isSubmitted)
    this.fetchTaskDetails();
    this.fetchSubmissionStatus();  // 添加这行

    this.deadlineTimer = setInterval(this.updateRemainingTime, 60000);
    // 在组件创建时打印参数，用于调试
    console.log('Route params:', {
      taskId: this.taskId,
      submitId: this.submitId,
      fileNames: this.fileNames,
      parsed: this.parsedFileNames
    });
  },
  beforeDestroy() {
    if (this.deadlineTimer) {
      clearInterval(this.deadlineTimer);
    }

  },

};
</script>

<style scoped>
.task-submission {
  width: 100%;
}
.task-detail {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
  margin: 0 auto;
  padding: 10px;
}

.task-card {
  margin-top: 1px; /* 调整上边距 */
  padding-top: 1px; /* 或者调整内边距 */
  font-size: 14px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #dcdcdc;
  margin-bottom: 5px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  padding: 0px 0; /* 控制缩放时上下间距更小 */
  transition: padding 0.3s ease;
}

.task-header:hover {
  padding: 5px 0; /* 缩放时更短的上下间距 */
  font-size: 16px;
}

.task-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px; /* 增大信息之间的间距 */
  margin-top: 15px;
}

.rotate-icon {
  transform: rotate(180deg);
  transition: transform 0.3s;
}

.task-info-grid div {
  padding-bottom: 10px; /* 增加信息项之间的垂直间距 */
}

.task-info-grid strong {
  font-weight: 600;
}
.upload-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 改为4列 */
  gap: 15px;
  margin: 0 -10px;
}
.weights-section {
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
}
.upload-area.is-disabled {
  cursor: not-allowed;
  background-color: #f5f7fa;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 200px; /* 增加高度 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.upload-area.is-disabled .el-upload__text {
  color: #909399;
}

.el-tag {
  margin-left: 10px;
}

.danger .el-tag {
  background-color: #f56c6c;
  color: white;
}

/* 增大图标尺寸 */
:deep(.el-upload-dragger .el-icon-upload) {
  font-size: 40px;
  margin-bottom: 15px;
}
.upload-disabled-tip {
  color: #909399;
  text-align: center;
  padding: 20px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  gap: 15px;
}

.card-header h4 {
  margin: 0;
  flex-shrink: 0;  /* 防止标题被压缩 */
}

.el-tag {
  margin-right: auto;  /* 将剩余空间推到右边，把按钮推到最右侧 */
  flex-shrink: 0;      /* 防止标签被压缩 */
}

.upload-area.is-disabled {
  cursor: not-allowed;
  background-color: #f5f7fa;
  opacity: 0.7;
}
.submission-history {
  margin-bottom: 20px;
}

.history-content {
  font-size: 14px;
  color: #606266;
  margin: 5px 0;
}

.file-history {
  padding: 8px;
  background-color: #f8f8f8;
  border-radius: 4px;
  margin: 8px 0;
  font-size: 13px;
  color: #606266;
}

.file-history p {
  margin: 4px 0;
}

.upload-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.el-tag {
  margin-left: auto;
}

.resubmit-dialog-content {
  font-size: 14px;
}

.previous-submission-info {
  background-color: #f8f8f8;
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
}

.previous-submission-info h4 {
  margin: 0 0 8px 0;
  color: #606266;
}

.warning-text {
  color: #f56c6c;
  margin-top: 10px;
}

/* 预览区域整体样式 */
.preview-section {
  margin-top: 20px;
  padding: 20px;
  background-color: #fff;
}

/* 模态容器样式 - 控制横向布局 */
.modal-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  width: 100%;
}

/* 每个模态卡片的样式 */
.modal-card {
  flex: 1;
  min-width: 280px;
  max-width: calc(25% - 15px);
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.modal-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 模态头部样式 */
.modal-header {
  padding: 12px 15px;
  border-bottom: 1px solid #EBEEF5;
  background-color: #f8f9fa;
}

.modal-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

/* 预览内容区域样式 */
.preview-content {
  padding: 15px;
}

/* 文件信息样式 */
.preview-file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.preview-file-info i {
  font-size: 20px;
  color: #409EFF;
}

.preview-file-info span {
  color: #606266;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-file-size {
  margin-left: auto;
  color: #909399;
  font-size: 12px;
}

/* 文件操作按钮区域样式 */
.file-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #EBEEF5;
}

/* 按钮样式优化 */
.file-actions .el-button {
  padding: 5px 10px;
}

.file-actions .el-button i {
  margin-right: 4px;
}

/* 响应式布局 */
@media screen and (max-width: 1400px) {
  .modal-card {
    max-width: calc(33.33% - 14px);
  }
}

@media screen and (max-width: 1100px) {
  .modal-card {
    max-width: calc(50% - 10px);
  }
}

@media screen and (max-width: 768px) {
  .modal-container {
    flex-direction: column;
  }

  .modal-card {
    max-width: 100%;
  }

  .preview-section {
    padding: 10px;
  }
}

/* 状态类样式 */
.preview-file-info .is-disabled {
  color: #C0C4CC;
}

.modal-card.is-disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 动画效果 */
.preview-section .el-button {
  transition: all 0.3s ease;
}

/* 优化滚动条样式 */
.preview-section {
  scrollbar-width: thin;
  scrollbar-color: #909399 #f4f4f5;
}

.preview-section::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.preview-section::-webkit-scrollbar-thumb {
  background: #909399;
  border-radius: 3px;
}

.preview-section::-webkit-scrollbar-track {
  background: #f4f4f5;
}

.preview-file-size {
    color: #909399;
    font-size: 12px;
    margin-left: auto;
  }


.file-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.submit-section {
  margin-top: 20px;
  text-align: center;
  flex-shrink: 0;      /* 防止按钮被压缩 */
}
.preview-dialog {
  .preview-content {
    min-height: 400px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .preview-video,
  .preview-audio {
    width: 100%;
    max-height: 500px;
  }

  .preview-pdf {
    width: 100%;
    height: 600px;
  }

  .preview-word {
    padding: 20px;
    height: 100%;
    overflow-y: auto;

    /* Word文档内容样式 */

    div {
      line-height: 1.6;
      font-size: 14px;
      color: #333;

      h1, h2, h3, h4, h5, h6 {
        margin-top: 1.2em;
        margin-bottom: 0.8em;
        line-height: 1.4;
        color: #2c3e50;
      }

      p {
        margin-bottom: 1em;
      }

      ul, ol {
        padding-left: 20px;
        margin-bottom: 1em;
      }

      table {
        border-collapse: collapse;
        width: 100%;
        margin-bottom: 1em;

        td, th {
          border: 1px solid #ddd;
          padding: 8px;
        }
      }

      img {
        max-width: 100%;
        height: auto;
      }
    }
  }
}
.preview-file-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  margin-bottom: 10px;

  .preview-icon {
    margin-right: 10px;
    font-size: 24px;
  }

  .preview-info {
    flex: 1;
  }

  .preview-actions {
    display: flex;
    gap: 10px;
  }
}

/* 响应式处理(如果需要在小屏幕上自适应) */
@media screen and (max-width: 1400px) {
  .upload-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
