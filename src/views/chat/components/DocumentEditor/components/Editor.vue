<template>
  <div class="editor-container">
    <!-- 顶部操作栏 -->
    <div class="editor-header">
      <div class="file-operations">
        <div class="left-buttons">
          <el-upload
            class="upload-demo"
            action=""
            :http-request="handleFileUpload"
            :show-file-list="false">
            <el-button size="small" type="primary">上传文档</el-button>
          </el-upload>
          <el-button size="small" @click="handleDownload">下载文档</el-button>
        </div>
        <div class="right-buttons">
          <el-button size="small" type="primary" @click="handleEvaluate">一键评估</el-button>
          <el-button size="small" type="success" @click="handlePolish">一键润色</el-button>
        </div>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-body">
      <quill-editor
        v-model="content"
        ref="myQuillEditor"
        :options="editorOption"
        @change="onEditorChange"
        @selection-change="onSelectionChange"
        @blur="onEditorBlur"
        @focus="onEditorFocus"
      />
    </div>

    <!-- 底部状态栏 -->
    <div class="editor-footer">
      <div class="word-count" :class="{ warning: wordCount > maxWords }">
        <span>字数：{{ wordCount }}</span>
        <span class="separator">|</span>
        <span>字符数：{{ charCount }}</span>
      </div>
    </div>

    <!-- 选择菜单 -->
    <AISidebar
      @action="handleSelectionAction"
      :selection="currentSelection"
    />
  </div>
</template>

<script>
import { quillEditor } from 'vue-quill-editor'
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import AISidebar from './AISidebar.vue'

export default {
  name: 'Editor',
  components: {
    quillEditor,
    AISidebar
  },
  props: {
    value: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      content: this.value,
      currentSelection: null,
      preventBlurHandler: null,
      quillInstance: null,
      wordCount: 0,
      charCount: 0,
      maxWords: 1500,
      editorOption: {
        placeholder: '请在这里撰写您的演讲稿内容...（Please write your speech here.）',
        theme: 'snow',
        bounds: '.editor-body',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            ['clean']
          ]
        }
      }
    }
  },
  watch: {
    value(newVal) {
      if (newVal !== this.content) {
        this.content = newVal
      }
    }
  },
  methods: {
    onEditorChange({ html, text }, editor) {
      const words = text.match(/[\u4e00-\u9fa5]|[a-zA-Z]+/g) || []
      if (words.length > this.maxWords) {
        const limitedText = this.getLimitedText(text, this.maxWords)
        this.quillInstance.setText(limitedText)
        this.$message({
          message: `已超出${this.maxWords}字限制，仅显示前${this.maxWords}字`,
          type: 'warning',
          duration: 3000
        })
        return
      }
      
      this.$emit('input', html)
      if (editor) {
        this.quillInstance = editor
      }
      this.updateWordCount(text)
    },
    
    onEditorFocus() {
      if (this.quillInstance) {
        this.currentSelection = this.quillInstance.getSelection()
      }
    },

    onEditorBlur() {
      // 保持选区状态
    },

    onSelectionChange(range) {
      this.currentSelection = range
    },

    handleSelectionAction(action) {
      if (!this.quillInstance || !this.currentSelection) return
      
      const text = this.quillInstance.getText(
        this.currentSelection.index,
        this.currentSelection.length
      )
      
      if (text) {
        const prompt = action.prompt.replace('{text}', text)
        this.$emit('selection-action', {
          type: action.type,
          prompt,
          text
        })
      }
    },

    handleFileUpload({ file }) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target.result
        // 先将文件内容传给父组件处理
        this.$emit('file-upload', file)
        
        // 然后检查字数并限制显示
        this.$nextTick(() => {
          const content = this.quillInstance.getText()
          const words = content.match(/[\u4e00-\u9fa5]|[a-zA-Z]+/g) || []
          
          if (words.length > this.maxWords) {
            this.$message({
              message: `文档超出${this.maxWords}字限制，仅显示前${this.maxWords}字`,
              type: 'warning',
              duration: 5000
            })
            
            // 获取限制后的文本
            const limitedText = this.getLimitedText(content, this.maxWords)
            // 更新编辑器显示内容
            this.quillInstance.setText(limitedText)
          }
        })
      }
      reader.readAsText(file)
    },

    handleDownload() {
      this.$emit('download')
    },

    handleEvaluate() {
      this.$emit('evaluate', this.content)
    },

    handlePolish() {
      this.$emit('polish', this.content)
    },

    getContent() {
      return this.content
    },

    updateWordCount(text) {
      const plainText = text.replace(/<[^>]*>/g, '')
      this.charCount = plainText.replace(/\s/g, '').length
      const words = plainText.match(/[\u4e00-\u9fa5]|[a-zA-Z]+/g) || []
      this.wordCount = words.length
    },

    getLimitedText(text, limit) {
      const words = text.match(/[\u4e00-\u9fa5]|[a-zA-Z]+/g) || []
      if (words.length <= limit) return text
      
      let count = 0
      let lastIndex = 0
      
      for (let i = 0; i < text.length && count < limit; i++) {
        const char = text[i]
        if (/[\u4e00-\u9fa5]/.test(char)) {
          // 中文字符
          count++
        } else if (/[a-zA-Z]/.test(char)) {
          // 英文字符，需要找到完整的单词
          let j = i
          while (j < text.length && /[a-zA-Z]/.test(text[j])) j++
          if (j > i) {
            count++
            i = j - 1
          }
        }
        lastIndex = i + 1
      }
      
      return text.slice(0, lastIndex)
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.quillInstance = this.$refs.myQuillEditor.quill
    })
  },
  beforeDestroy() {
    if (this.preventBlurHandler) {
      const sidebar = document.querySelector('.ai-sidebar')
      if (sidebar) {
        sidebar.removeEventListener('mousedown', this.preventBlurHandler)
      }
    }
  }
}
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  min-height: 0; /* 重要 */
}

.editor-header {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  margin-right: 80px;
}

.file-operations {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-buttons,
.right-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.editor-body {
  flex: 1;
  overflow: auto;
  margin-right: 80px;
  position: relative;
  margin-bottom: 30px; /* 为底部状态栏留出空间 */
}

.editor-body :deep(.quill-editor) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-body :deep(.ql-toolbar.ql-snow) {
  border: none;
  border-bottom: 1px solid #ebeef5;
  padding: 8px 16px;
  background: #ebeef5;
}

.editor-body :deep(.ql-container.ql-snow) {
  height: calc(100% - 42px);
  font-size: 15px;
  line-height: 1.6;
  border: none;
}

.editor-body :deep(.ql-editor) {
  padding: 20px;
  min-height: 100%;
  height: auto;
  overflow-y: auto;
}

/* 修复光标跳转问题 */
.editor-body :deep(.ql-editor p) {
  margin: 0;
}

.editor-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 80px;
  height: 30px;
  background: #f5f7fa;
  border-top: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-size: 12px;
  color: #606266;
}

.word-count {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #606266;
}

.word-count.warning {
  color: #f56c6c;
}

.separator {
  color: #dcdfe6;
}

.right-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.right-buttons .el-button {
  font-weight: 600;
  padding: 8px 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.right-buttons .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.right-buttons .el-button--primary {
  background: linear-gradient(135deg, #409EFF, #007bff);
}

.right-buttons .el-button--success {
  background: linear-gradient(135deg, #67C23A, #41a314);
}
</style>
