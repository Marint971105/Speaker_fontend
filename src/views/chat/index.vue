<template>
  <div class="split-container">
    <div class="split-section">
      <DocumentEditor />
    </div>
    <div class="split-section">
      <Chat />
    </div>
  </div>
</template>

<script>
import DocumentEditor from '@/views/chat/components/DocumentEditor'
import Chat from '@/views/chat/components/AIAssistant/chat.vue'

export default {
  name: 'SplitScreen',
  components: {
    DocumentEditor,
    Chat
  }
}
</script>

<style  scoped>
.split-container {
  display: flex;
  height: 100vh;
  min-height: 600px;
  width: 100%;
  padding: 20px;
  gap: 20px;
  background: #f5f7fa;
}

.split-section {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* 确保左侧编辑器部分可以滚动 */
.split-section:first-child {
  flex: 3;
  padding-right: 0;
}

/* 右侧聊天部分保持不变 */
.split-section:last-child {
  flex: 2;
  padding-left: 0;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .split-container {
    flex-direction: column;
    padding: 10px;
  }

  .split-section {
    height: 50vh;
    flex: 1 !important;
  }
}
</style>
