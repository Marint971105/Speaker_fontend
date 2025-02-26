<template>
  <div class="pdf-container">
    <iframe
      v-if="pdfUrl"
      :src="pdfUrl"
      class="pdf-viewer"
      type="application/pdf"
    ></iframe>
  </div>
</template>

<script>
export default {
  name: 'pdf-viewer',
  props: {
    pdfData: {
      required: true
    }
  },
  data() {
    return {
      pdfUrl: null
    }
  },
  watch: {
    pdfData: {
      immediate: true,
      handler(newData) {
        if (newData) {
          // 创建 Blob URL
          const blob = new Blob([newData], { type: 'application/pdf' });
          this.pdfUrl = URL.createObjectURL(blob);
        }
      }
    }
  },
  beforeDestroy() {
    // 清理 URL
    if (this.pdfUrl) {
      URL.revokeObjectURL(this.pdfUrl);
    }
  }
}
</script>

<style scoped>
.pdf-container {
  width: 100%;
  height: 100%; /* 减去头部和其他元素的高度 */
  min-height: 800px;
  background: #fff;
  border-radius: 4px;
}

.pdf-viewer {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
