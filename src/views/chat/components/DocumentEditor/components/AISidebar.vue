<template>
  <div class="ai-sidebar">
    <div class="sidebar-header">
      <div class="title-wrapper">
        <i class="el-icon-cpu"></i>
        <span class="sidebar-title">AI助手</span>
      </div>
    </div>
    <div class="sidebar-items">
      <div
        v-for="(item, index) in menuItems" 
        :key="index"
        class="sidebar-item"
        @click="handleAction(item)"
        :title="item.description"
        :class="{ 'disabled': !hasSelection }"
      >
        <div class="icon-wrapper">
          <i :class="getIconClass(item.type)"></i>
        </div>
        <span class="action-title">{{ item.text }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AISidebar',
  props: {
    selection: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      menuItems: [
        { 
          type: 'continue', 
          text: '智能续写',
          description: '基于选中内容智能续写',
          prompt: `请基于以下内容进行续写，保持语言风格、叙述视角和行文逻辑。
         续写要求：
1. 延续原文的主题和语气
2. 保持叙述的连贯性和流畅度
3. 补充合理的细节和发展
4. 确保与原文在风格上的统一
5. 给出中文续写和英文续写
        
原文：
{text}


`
        },
        { 
          type: 'polish', 
          text: '句子润色',
          description: '优化语言表达和用词',
          prompt: `请对以下文本进行精细润色，提升其表达质量
          
润色要求：
1. 优化语言表达，使其更加优美流畅
2. 改进用词用语，使其更加准确专业
3. 调整句式结构，使其更加通顺自然
4. 保持原文的核心意思和风格特点
5. 给出中文润色和英文润色
         
原文：
{text}

`
        },
        { 
          type: 'summarize', 
          text: '整体概括',
          description: '提取核心内容要点',
          prompt: `请对以下文本进行精炼的总结概括
         概括要求：
1. 提取核心观点和关键信息
2. 保持逻辑结构的清晰
3. 使用简洁准确的语言
4. 确保概括的完整性
5. 按重要性排序呈现要点
6. 给出中文概括和英文概括

          
原文：
{text}


`
        },
        { 
          type: 'shorten', 
          text: '段落缩写',
          description: '精简文本保留重点',
          prompt: `请在保留核心内容的前提下，对以下文本进行精炼缩写
          
缩写要求：
1. 保留关键信息和核心观点
2. 删除冗余内容
3. 使用简洁的表达方式
4. 确保语言的准确性
5. 维持文本的连贯性
6. 保持原有的语气特点
7. 给出中文缩写和英文缩写   
          
原文：
{text}



`
        },
        { 
          type: 'expand', 
          text: '段落扩写',
          description: '扩充内容和细节',
          prompt: `请对以下文本进行合理的扩充和丰富：
        扩写要求：
1. 补充相关的细节和例证
2. 深化核心观点的论述
3. 增加必要的背景信息
4. 保持内容的连贯性
5. 维持原有的语言风格
6. 确保扩写内容与原文主题相关
7. 给出中文扩写和英文扩写
          
原文：
{text}


`
        },
        { 
          type: 'translate', 
          text: '多语翻译',
          description: '将选中文本翻译为简体中文/英文',
          prompt: `请将以下文本进行翻译：
如果原文是中文，请翻译成地道的英文；
如果原文是英文，请翻译成优美的简体中文。
请确保：
1. 准确传达原文含义
2. 符合目标语言的表达习惯
3. 保持专业术语的准确性
4. 维持原文的语气和风格


原文：
{text}
`
        },
        { 
          type: 'custom', 
          text: '其他个性化',
          description: '自定义AI交互',
          action: 'sendToChat'
        }
      ]
    }
  },
  computed: {
    hasSelection() {
      return !!(this.selection && this.selection.length > 0 && this.$parent.$refs.myQuillEditor)
    }
  },
  methods: {
    handleAction(item) {
        // console.log('AISidebar - Current Selection:', this.selection)
        // console.log('AISidebar - Has Selection:', this.hasSelection)

      if (this.selection && this.selection.length > 0) {
        const quill = this.$parent.$refs.myQuillEditor.quill
        const savedSelection = { ...this.selection }
        
        setTimeout(() => {
          quill.setSelection(savedSelection.index, savedSelection.length)
        }, 0)

        const text = quill.getText(savedSelection.index, savedSelection.length)
        // console.log('AISidebar - Selected Text:', text)
        
        if (item.action === 'sendToChat') {
          // 发送到聊天输入框，添加明确的提示格式
          const formattedText = `【以下是选中的原文】：
"${text}"

【我的要求】：
`
          this.$bus.$emit('insertToChat', formattedText)
        } else {
          // 常规AI操作
          this.$emit('action', {
            type: item.type,
            prompt: item.prompt.replace('{text}', text)
          })
        }
      } else {
        // console.log('AISidebar - No Selection')
        this.$message.warning('请先选择文本')
      }
    },
    getIconClass(type) {
      const icons = {
        translate: 'el-icon-document-copy',
        continue: 'el-icon-edit-outline',
        polish: 'el-icon-magic-stick',
        summarize: 'el-icon-reading',
        expand: 'el-icon-full-screen',
        shorten: 'el-icon-crop',
        custom: 'el-icon-more'
      }
      return icons[type]
    }
  },
  watch: {
    selection: {
      handler(newVal) {
        // console.log('AISidebar - Selection Changed:', newVal)
      },
      deep: true
    }
  }
}
</script>

<style scoped>
.ai-sidebar {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 80px;
  background: linear-gradient(180deg, #ffffff 0%, #f0f7ff 100%);
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  z-index: 100;
  height: 100%;
  border-left: 1px solid #e6f0ff;
}

.sidebar-header {
  padding: 12px 0;
  border-bottom: 1px solid #e6f0ff;
  background: rgba(255, 255, 255, 0.8);
  text-align: center;
}

.title-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
}

.title-wrapper i {
  font-size: 24px;
  color: #409EFF;
  text-shadow: 0 0 15px rgba(64, 158, 255, 0.4);
  animation: neonGlow 2s ease-in-out infinite alternate;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 500;
  color: #409EFF;
}

.sidebar-items {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.sidebar-item {
  padding: 10px 0;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(245, 247, 250, 0.9));
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  margin: 0 4px;
  animation: fadeIn 0.5s ease-out forwards;
  animation-fill-mode: both;
}

.sidebar-item:nth-child(1) { animation-delay: 0.1s; }
.sidebar-item:nth-child(2) { animation-delay: 0.2s; }
.sidebar-item:nth-child(3) { animation-delay: 0.3s; }
.sidebar-item:nth-child(4) { animation-delay: 0.4s; }
.sidebar-item:nth-child(5) { animation-delay: 0.5s; }
.sidebar-item:nth-child(6) { animation-delay: 0.6s; }
.sidebar-item:nth-child(7) { animation-delay: 0.7s; }

.sidebar-item:hover {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.15) 0%, rgba(103, 194, 255, 0.15) 100%);
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 6px 15px rgba(64, 158, 255, 0.25);
  border: 1px solid rgba(64, 158, 255, 0.3);
  z-index: 1;
}

.icon-wrapper {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.15), rgba(64, 158, 255, 0.25));
  backdrop-filter: blur(4px);
  border: 1px solid rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
  box-shadow: 0 3px 8px rgba(64, 158, 255, 0.2);
}

.icon-wrapper i {
  font-size: 18px;
  color: #409EFF;
  transition: all 0.3s ease;
  text-shadow: 0 0 8px rgba(64, 158, 255, 0.3);
}

.action-title {
  font-size: 13px;
  color: #606266;
  text-align: center;
  font-weight: 600;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.sidebar-items::-webkit-scrollbar {
  width: 4px;
}

.sidebar-items::-webkit-scrollbar-thumb {
  background: rgba(64, 158, 255, 0.2);
  border-radius: 2px;
}

.sidebar-items::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-item::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, 
    rgba(230, 162, 60, 0.3) 0%, 
    rgba(230, 162, 60, 0.1) 30%,
    transparent 70%);
  transform: translate(-50%, -50%) scale(0);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  filter: blur(4px);
}

.sidebar-item:hover::after {
  transform: translate(-50%, -50%) scale(2);
  opacity: 0.8;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.sidebar-item:active {
  transform: scale(0.95);
  background: rgba(64, 158, 255, 0.1);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

.sidebar-item:hover .icon-wrapper {
  background: linear-gradient(135deg, #409EFF, #007bff);
  transform: translateY(-3px) rotate(8deg);
  box-shadow: 0 6px 15px rgba(64, 158, 255, 0.4);
}

.sidebar-item:hover .icon-wrapper i {
  transform: scale(1.2);
  color: #ffffff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.sidebar-item:hover .action-title {
  color: #409EFF;
  text-shadow: 0 0 10px rgba(64, 158, 255, 0.3);
  transform: translateY(2px);
}

@keyframes neonGlow {
  from {
    text-shadow: 0 0 10px rgba(64, 158, 255, 0.4),
                0 0 20px rgba(64, 158, 255, 0.2);
  }
  to {
    text-shadow: 0 0 15px rgba(64, 158, 255, 0.6),
                0 0 30px rgba(64, 158, 255, 0.3);
  }
}

.sidebar-item::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(64, 158, 255, 0.3) 0%, transparent 70%);
  transform: translate(-50%, -50%) scale(0);
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-item:active::before {
  transform: translate(-50%, -50%) scale(2);
  opacity: 0;
}

.sidebar-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.sidebar-item.disabled:hover {
  transform: none;
  background: rgba(255, 255, 255, 0.6);
  box-shadow: none;
}
</style> 