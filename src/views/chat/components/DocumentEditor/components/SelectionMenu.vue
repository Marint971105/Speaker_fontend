<template>
  <div 
    class="selection-menu" 
    :style="menuStyle"
    @mousedown.stop
  >
    <div class="menu-header">
      <div class="title-wrapper">
        <i class="el-icon-cpu"></i>
        <span class="menu-title">AI 助手</span>
      </div>
      <el-button 
        class="close-button" 
        type="text" 
        icon="el-icon-close"
        size="mini" 
        @click="$emit('close')"
      />
    </div>
    <div class="menu-items">
      <div
        v-for="(item, index) in menuItems" 
        :key="index"
        class="menu-item"
        @mousedown="handleAction(item)"
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
  name: 'SelectionMenu',
  props: {
    position: {
      type: Object,
      default: () => ({
        top: 0,
        left: 0
      })
    }
  },
  data() {
    return {
      menuItems: [
        { 
          type: 'translate', 
          text: '翻译',
          description: '将选中文本翻译为中文/英文',
          prompt: `请将以下文本进行翻译：
如果原文是中文，请翻译成地道的英文；
如果原文是英文，请翻译成优美的中文。
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
          type: 'continue', 
          text: '续写',
          description: '基于选中内容智能续写',
          prompt: `请基于以下内容进行续写，保持一致的语言风格、叙述视角和行文逻辑：

{text}

续写要求：
1. 延续原文的主题和语气
2. 保持叙述的连贯性和流畅度
3. 补充合理的细节和发展
4. 确保与原文在风格上的统一
5. 维持相同的语言（中文/英文）
`
        },
        { 
          type: 'polish', 
          text: '润色',
          description: '优化语言表达和用词',
          prompt: `请对以下文本进行精细润色，提升其表达质量：

{text}

润色要求：
1. 优化语言表达，使其更加优美流畅
2. 改进用词用语，使其更加准确专业
3. 调整句式结构，使其更加通顺自然
4. 保持原文的核心意思和风格特点
5. 维持原文的语种（中文/英文）
`
        },
        { 
          type: 'summarize', 
          text: '概括',
          description: '提取核心内容要点',
          prompt: `请对以下文本进行精炼的总结概括：

{text}

概括要求：
1. 提取核心观点和关键信息
2. 保持逻辑结构的清晰
3. 使用简洁准确的语言
4. 确保概括的完整性
5. 按重要性排序呈现要点
`
        },
        { 
          type: 'expand', 
          text: '扩写',
          description: '扩充内容和细节',
          prompt: `请对以下文本进行合理的扩充和丰富：

{text}

扩写要求：
1. 补充相关的细节和例证
2. 深化核心观点的论述
3. 增加必要的背景信息
4. 保持内容的连贯性
5. 维持原有的语言风格
6. 确保扩写内容与原文主题相关
`
        },
        { 
          type: 'shorten', 
          text: '缩写',
          description: '精简文本保留重点',
          prompt: `请在保留核心内容的前提下，对以下文本进行精炼缩写：

{text}

缩写要求：
1. 保留关键信息和核心观点
2. 删除冗余内容
3. 使用简洁的表达方式
4. 确保语言的准确性
5. 维持文本的连贯性
6. 保持原有的语气特点
`
        }
      ]
    }
  },
  computed: {
    menuStyle() {
      const { top, left } = this.position
      return {
        left: `${left}px`,
        top: `${top}px`
      }
    }
  },
  methods: {
    handleAction(item) {
      this.$emit('action', {
        type: item.type,
        prompt: item.prompt.replace('{text}', this.selectedText)
      })
    },
    getIconClass(type) {
      const icons = {
        translate: 'el-icon-document-copy',
        continue: 'el-icon-edit-outline',
        polish: 'el-icon-magic-stick',
        summarize: 'el-icon-reading',
        expand: 'el-icon-full-screen',
        shorten: 'el-icon-crop'
      }
      return icons[type]
    }
  }
}
</script>

<style scoped>
.selection-menu {
  position: fixed;
  z-index: 99999;
  background-color: rgba(255, 255, 255, 0.98);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: auto;
  min-width: 200px;
  transform: translate(-8px, calc(-100% - 5px));
}

.selection-menu::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 8px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid rgba(255, 255, 255, 0.98);
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.title-wrapper i {
  font-size: 16px;
  color: #409EFF;
}

.menu-title {
  font-size: 14px;
  font-weight: 500;
  color: #409EFF;
}

.close-button {
  padding: 4px;
  margin-left: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: rgba(245, 108, 108, 0.1);
  color: #F56C6C;
}

.menu-items {
  display: flex;
  gap: 4px;
  padding: 0 4px;
}

.menu-item {
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 6px;
  transition: all 0.2s ease-out;
  white-space: nowrap;
}

.menu-item:hover {
  background-color: rgba(64, 158, 255, 0.1);
  transform: translateY(-1px);
}

.menu-item:hover .icon-wrapper {
  transform: scale(1.1);
  background-color: rgba(64, 158, 255, 0.2);
}

.menu-item:hover .action-title {
  color: #409eff;
}

.icon-wrapper {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background-color: rgba(64, 158, 255, 0.1);
  transition: all 0.2s ease-out;
}

.icon-wrapper i {
  font-size: 14px;
  color: #409eff;
}

.action-title {
  font-size: 14px;
  color: #606266;
}
</style> 