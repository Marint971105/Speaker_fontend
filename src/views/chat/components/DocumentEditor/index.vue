<template>
  <el-card class="box-card">
    <div class="document-editor">
      <Editor 
        v-model="content" 
        ref="editor"
        @file-upload="handleFileUpload"
        @download="downloadDoc"
        @evaluate="handleEvaluate"
        @polish="handlePolish"
        @selection-action="handleSelectionAction"
      />
    </div>
  </el-card>
</template>

<script>
import Editor from './components/Editor.vue'
import { handleFile } from '@/api/Ollama/fileHandler'
import HTMLtoDOCX from 'html-to-docx'

export default {
  name: 'DocumentEditor',
  components: {
    Editor
  },
  data() {
    return {
      content: '',
      prompts: {
        evaluate: `从以下角度评价演讲稿的总体质量：
1. 体裁适宜（记叙文、说明文、议论文的文体选择适宜）<literary styles>
2. 证据充分<evidence>
3. 论证有力<reasoning>
4. 语言表达地道<idiomaticity>
5. 逻辑连贯<logic>
6. 句子简明扼要<consiceness>
7. 无拼写错误<spelling>
8. 无标点错误<punctuation>
9. 基本无语法错误<grammar>
10. 整体谋篇布局合理<organization>
11. 内容切题<relevancy>

演讲稿内容如下：
{text}`,
        polish: `请对以下演讲稿进行润色，使其更加流畅、专业和富有感染力，同时保持原文的语种（英语/中文）和其核心内容和风格：

{text}

请从以下几个方面进行优化：
1. 语言表达更加优美流畅
2. 逻辑结构更加清晰
3. 用词更加准确专业
4. 增强演讲感染力
5. 调整语气和节奏`
      }
    }
  },
  methods: {
    // 处理文件上传
    async handleFileUpload(file) {
      try {
        const { value, messages } = await handleFile(file)
        const html = `<div>${value}</div>`
        
        // 直接修改 content
        this.content = html
        
        // 等待下一个 tick，确保编辑器已更新
        await this.$nextTick()
        this.$message.success('文档上传成功')
        
      } catch (error) {
        this.$message.error('文档处理失败')
        console.error(error)
      }
    },

    // 处理文件下载
    async downloadDoc() {
      try {
        const html = this.$refs.editor.getContent()
        
        // 配置文档选项
        const options = {
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440
          },
          font: 'Times New Roman'
        }

        // 转换HTML为Word文档
        const docxBlob = await HTMLtoDOCX(html, null, options)
        
        // 创建下载链接
        const url = window.URL.createObjectURL(docxBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `document_${new Date().getTime()}.docx`

        // 模拟点击下载
        document.body.appendChild(link)
        link.click()

        // 清理
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        this.$message.success('文档下载成功')
      } catch (error) {
        console.error('下载文档失败:', error)
        this.$message.error('下载文档失败')
      }
    },

    // 处理评估请求
    handleEvaluate(content) {
      const prompt = this.prompts.evaluate.replace('{text}', content)
      this.$bus.$emit('sendToAI', prompt)
    },

    // 处理润色请求
    handlePolish(content) {
      const prompt = this.prompts.polish.replace('{text}', content)
      this.$bus.$emit('sendToAI', prompt)
    },

    // 处理选中文本的操作
    handleSelectionAction(data) {
      this.$bus.$emit('sendToAI', data.prompt)
    }
  }
}
</script>

<style  scoped>
.box-card {
  height: 100%;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.box-card /deep/ .el-card__body {
  height: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.document-editor {
  height: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  min-height: 0; /* 重要：允许flex子项收缩 */
}

.editor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  /* // min-height: 0;
  // overflow: hidden; */
}

@media screen and (max-width: 768px) {
  .box-card {
    padding: 0.5rem;
  }
}
</style>
