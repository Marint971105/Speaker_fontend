<template>
  <div class="home">
    <!-- 背景图 -->
    <div class="background"></div>

    <!-- Hero Section -->
    <section class="hero">
      <div class="container hero-content">
        <h1>多模态英语教学与评估平台</h1>
        <p>运用AI技术，提升您的演讲技能</p>
      </div>
    </section>

    <!-- Features Section -->
    <!-- Features Section -->
    <section class="features">
      <div class="container">
        <div class="feature-grid">
          <div v-for="feature in features"
               :key="feature.id"
               class="feature-wrapper">
            <div class="feature-card">
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
            </div>
            <div class="icon-section">
              <img :src="feature.icon" class="icon" :alt="feature.title">
              <div class="icon-text">
                <span class="en">{{ feature.iconTextEn }}</span>
                <span class="cn">{{ feature.iconTextCn }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <!-- Stats Section -->
    <section class="stats container">
      <div class="stats-grid">
        <div v-for="stat in stats"
             :key="stat.id"
             class="stat-item">
          <div class="stat-number">{{ stat.number }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: "Index",

  data() {
    return {
      features: [
        {
          id: 1,
          title: "演讲视频自动评价",
          description: "依托视频理解、语音识别、情感分析等大语言模型，为演讲教学与评价提供支持",
          icon: require('@/assets/selfpractice.png'),
          iconTextEn: "Self Practice",
          iconTextCn: "自我训练"
        },
        {
          id: 2,
          title: "生成式AI智能分析",
          description: "全面分析视频、音频、PPT、演讲稿，提供专业评估报告",
          icon: require('@/assets/客户档案.png'),
          iconTextEn: "Anxiety Detection",
          iconTextCn: "焦虑检测"
        },
        {
          id: 3,
          title: "数据可视化",
          description: "直观展示评估结果，帮助快速定位改进方向",
          icon: require('@/assets/绩效设置汇总.png'),
          iconTextEn: "Visual Analysis",
          iconTextCn: "可视化分析"
        },
        {
          id: 4,
          title: "个性化学习",
          description: "基于历史数据，为每位学生提供定制化的提升建议",
          icon: require('@/assets/菜单设置.png'),
          iconTextEn: "Multidimensional Ability",
          iconTextCn: "多维测试"
        }
      ],
      stats: [
        {
          id: 1,
          number: "500+",
          label: "学习者"
        },
        {
          id: 2,
          number: "40,000+",
          label: "演讲片段"
        },
        {
          id: 3,
          number: "500+",
          label: "活跃用户"
        },
        {
          id: 4,
          number: "100h+",
          label: "演讲时长"
        },
        {
          id: 5,
          number: "20+",
          label: "高校高中共建共享"
        },
      ]
    }
  }
}
</script>

<style scoped lang="scss">
.home {
  position: relative;
  height: 100vh; // 固定高度为视窗高度
  color: #ffffff;
  overflow: hidden; // 防止内容溢出
  display: flex;
  flex-direction: column;
}

.background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background-image: url('../assets/new_bg.png');
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
  }
}

.hero {
  height: 35vh;  // 增加hero部分的高度
  display: flex;
  align-items: center;
  justify-content: center;  // 水平居中
  overflow: hidden;
  text-align: center;  // 文字居中
}

.hero-content {
  position: relative;
  z-index: 2;
  width: 100%;  // 确保内容占满容器宽度

  h1 {
    font-size: 3.5rem;  // 增大标题字体
    margin-bottom: 1rem;
    color: #ffffff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    letter-spacing: 2px;  // 增加字距
  }

  p {
    font-size: 1.5rem;  // 增大副标题字体
    color: #ffffff;
    margin-bottom: 1rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    letter-spacing: 1px;  // 增加字距
  }
}

.features {
  flex: 1;
  padding: 1rem 0;
  background: rgba(17, 34, 64, 0.6);
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin: 0 0rem;
  border-radius: 10px;
  height: auto;
  min-height: unset;
}

.feature-grid {
  display: flex;
  justify-content: center;
  width: 100%;
  gap: 1.5rem;
  padding: 2rem 3rem;
}

.feature-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;  /* 卡片和图标之间的间距 */
}

.feature-card {
  flex: 1;
  min-width: 400px;
  max-width: 450px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);

  h3 {
    text-align: center;
    width: 100%;
    color: #ffffff;
    margin-bottom: 0.7rem;
    font-size: 1.5rem;
    font-weight: 600;
  }

  p {
    color: rgba(255, 255, 255, 0.9);
    font-size: 1rem;
    line-height: 1.5;
    text-align: justify;
    width: 100%;
  }
}

.icon-section {
  text-align: center;
  padding: 0.5rem 0;
  width: 100%;

  .icon {
    width: 40px;
    height: 40px;
    margin-bottom: 0.5rem;
    filter: invert(1);
  }

  .icon-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: rgba(255, 255, 255, 0.9);
    gap: 0.5rem;  /* 增加文字之间的间距 */
    .en {
      font-size: 0.9rem;
      margin-bottom: 0.2rem;
    }

    .cn {
      font-size: 0.8rem;
      opacity: 0.8;
    }
  }
}

.stats {
  height: 20vh;
  display: flex;
  align-items: center;
}

.stats-grid {
  display: flex;  // 改为flex布局
  justify-content: space-between;  // 项目间均匀分布
  align-items: center;  // 垂直居中对齐
  width: 100%;
  padding: 0 2rem;  // 两边留出一些空间
}

.stat-item {
  text-align: center;
  padding: 0 1rem;  // 每个项目左右留出一些空间

  .stat-number {
    font-size: 2rem;
    font-weight: bold;
    color: #ffffff;
  }

  .stat-label {
    color: #ffffff;
    margin-top: 0.25rem;
    font-size: 0.9rem;
    white-space: nowrap;  // 防止文字换行
  }
}

@media (max-width: 768px) {
  .hero-content {
    h1 {
      font-size: 1.5rem;
    }
  }

  .feature-grid {
    grid-template-columns: repeat(3, 1fr); // 保持3列
  }
}

.container {
  //max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem; // 减小padding
  width: 100%;
}
</style>
