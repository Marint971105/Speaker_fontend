<template>
  <div class="editor-toolbar">
    <input
      type="file"
      ref="fileInput"
      accept=".doc,.docx,.txt"
      style="display: none"
      @change="handleFileChange"
    >
    <el-button-group>
      <el-button
        size="small"
        icon="el-icon-upload2"
        @click="$refs.fileInput.click()"
      >
        上传文档
      </el-button>
      <el-button
        size="small"
        icon="el-icon-download"
        @click="$emit('download')"
      >
        下载文档
      </el-button>
    </el-button-group>
  </div>
</template>

<script>
export default {
  name: 'EditorToolbar',
  methods: {
    handleFileChange(e) {
      const file = e.target.files[0]
      if (file) {
        this.$emit('file-upload', file)
      }
    }
  }
}
</script>
