<template>
  <div class="home">
    <!-- 背景图 -->
    <div class="background"></div>

    <!-- Hero Section -->
    <section class="hero">
      <div class="container hero-content">
        <h1 class="main-title">多模态英语教学与评估平台</h1>
        <p class="tagline">AI助力言之邮理，AI助力您言之有理</p>
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
            <div class="feature-card" 
                 @click="handleFeatureClick(feature.id)"
                 :class="{ clickable: feature.id === 1 || feature.id === 2 || feature.id === 3 || feature.id === 4 }">
              <h3>{{ feature.title }}</h3>
              <div class="scene-text">{{ feature.scene }}</div>
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
      stats: [
        {
          id: 1,
          number: "600+",
          label: "学习者"
        },
        {
          id: 2,
          number: "40,000+",
          label: "演讲片段"
        },
        {
          id: 3,
          number: "600+",
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
  },
  computed: {
    features() {
      const roles = this.$store.getters.roles;
      const isAdmin = roles.includes('admin');
      
      const allFeatures = [
        {
          id: 1,
          title: "演讲稿智能写作与评价",
          description: "依托先进大语言模型技术，为演讲稿写作提供一键评价、整体润色、智能续写、多语翻译等服务",
          icon: require('@/assets/selfpractice.png'),
          iconTextEn: "Self Practice",
          iconTextCn: "自我训练",
          scene: "自主训练"
        },
        {
          id: 2,
          title: "演讲视频智能评价",
          description: "依托多模态学习分析技术，为演讲视频提供演讲者姿态、语音语调和情感表现等方面的智能评价",
          icon: require('@/assets/客户档案.png'),
          iconTextEn: "Anxiety Detection",
          iconTextCn: "焦虑检测",
          scene: "自主训练"
        },
        {
          id: 3,
          title: "公众演讲多模态教学与智能评价",
          description: "全面支撑教师、学生公众演讲的教与学，围绕演讲视频、音频、演讲稿、PPT等多模态数据，提供全面测评报告",
          icon: require('@/assets/绩效设置汇总.png'),
          iconTextEn: "Visual Analysis",
          iconTextCn: "可视化分析",
          scene: "教学场景"
        },
        {
          id: 4,
          title: "英语语音智能评价",
          description: "基于语音识别与分析技术，精准评估发音、语调及流利度，助力提升口语表达能力",
          icon: require('@/assets/菜单设置.png'),
          iconTextEn: "Multidimensional Ability",
          iconTextCn: "多维测试",
          scene: "自主训练"
        }
      ];

      if (isAdmin) {
        // 教师/管理员顺序
        return [
          allFeatures[2], // 公众演讲多模态教学与智能评价
          allFeatures[0], // 演讲稿智能写作与评价
          allFeatures[1], // 演讲视频智能评价
          allFeatures[3]  // 英语语音智能评价
        ];
      } else {
        // 学生顺序
        return [
          allFeatures[0], // 演讲稿智能写作与评价
          allFeatures[1], // 演讲视频智能评价
          allFeatures[3], // 英语语音智能评价
          allFeatures[2]  // 公众演讲多模态教学与智能评价
        ];
      }
    }
  },
  methods: {
    handleFeatureClick(featureId) {
      if (featureId === 1) {
        // 跳转到演讲稿写作页面
        this.$router.push('/homeworkTrial/chat/index');
      } else if (featureId === 2) {
        // 跳转到视频分析页面
        this.$router.push('/homeworkTrial/video/index');
      } else if (featureId === 3) {
        // 根据用户角色跳转到不同页面
        const roles = this.$store.getters.roles;
        console.log("用户角色信息:", roles);
        
        // 检查用户是否已登录
        if (!roles || (Array.isArray(roles) && roles.length === 0)) {
          this.$message.warning('请先登录以访问此功能');
          return;
        }
        
        // 分析角色数据结构并获取角色ID
        let roleId = null;
        
        // 如果roles是字符串数组
        if (Array.isArray(roles) && typeof roles[0] === 'string') {
          roleId = roles.includes('admin') ? 1 : 2;
        } 
        // 如果roles是对象数组
        else if (Array.isArray(roles) && typeof roles[0] === 'object') {
          const role = roles[0];
          if (role.roleId) {
            roleId = role.roleId;
          } else if (role.id) {
            roleId = role.id;
          } else if (role.value) {
            roleId = role.value;
          }
        }
        // 如果roles是单个对象
        else if (typeof roles === 'object' && !Array.isArray(roles)) {
          if (roles.roleId) {
            roleId = roles.roleId;
          } else if (roles.id) {
            roleId = roles.id;
          } else if (roles.value) {
            roleId = roles.value;
          }
        }
        
        console.log("解析得到的角色ID:", roleId);
        
        // 根据角色ID决定跳转页面
        if (roleId === 1 || roles.includes('admin')) {
          // 教师/管理员 - 跳转到作业管理
          this.$router.push('/homeworkManage/index');
        } else {
          // 学生 - 跳转到我的任务
          this.$router.push('/myTask/myEvaluation/index');
        }
      } else if (featureId === 4) {
        // 跳转到音频评估页面
        this.$router.push('/homeworkTrial/audio/index');
      }
    },
    async processVideo() {
      if (!this.videoRunning) return;
      
      const video = this.$refs.inputVideo;
      
      try {
        // 检查视频是否已加载并准备好帧
        if (video.readyState >= 2) {
          // MediaPipe只处理当前视频帧，不关心它来自哪里
          await this.holistic.send({image: video});
          
          // 在HTTP环境中，一定要捕获所有可能的错误以防止中断
          if (this.videoRunning) {
            requestAnimationFrame(this.processVideo);
          }
        } else {
          // 视频尚未准备好，稍后再试
          setTimeout(() => this.processVideo(), 100);
        }
      } catch (err) {
        console.error('处理视频帧时出错:', err);
        if (this.videoRunning) {
          // 错误时继续尝试处理下一帧
          requestAnimationFrame(this.processVideo);
        }
      }
    },
    async initializeHolistic() {
      try {
        // 添加额外的错误处理和重试逻辑
        const loadWasmWithRetry = async (path, retries = 3) => {
          for (let i = 0; i < retries; i++) {
            try {
              const response = await fetch(path);
              if (response.ok) return response;
              console.warn(`加载WASM文件失败，正在重试(${i+1}/${retries})...`);
            } catch (err) {
              console.error(`WASM加载失败:`, err);
            }
            // 等待短暂时间后重试
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          throw new Error(`无法加载WASM文件: ${path}`);
        };

        // 在初始化前预加载关键文件
        await loadWasmWithRetry(`${process.env.BASE_URL}mediapipe/holistic_solution_simd_wasm_bin.wasm`);

        // 降低模型复杂度，以减少资源消耗
        this.holistic = new Holistic({
          locateFile: (file) => {
            return `${process.env.BASE_URL}mediapipe/${file}`;
          }
        });

        await this.holistic.setOptions({
          modelComplexity: 0,  // 降至最低复杂度
          smoothLandmarks: true,
          enableSegmentation: false,  // 禁用不必要功能
          refineFaceLandmarks: false, // 禁用不必要功能
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        
        // 剩余初始化代码...
      } catch (err) {
        console.error('初始化 MediaPipe 失败:', err);
        this.error = '初始化失败，请尝试使用较小的视频文件';
      }
    },
    handleVideoUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      // 添加文件大小检查
      if (file.size > 100 * 1024 * 1024) { // 例如限制100MB
        this.error = '视频文件过大，请上传小于100MB的视频';
        return;
      }
      
      // 继续处理上传...
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

.main-title {
  font-size: 3.8rem !important;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 
    0 2px 0 #ccc,
    0 4px 0 #999,
    0 6px 10px rgba(0, 0, 0, 0.6),
    0 8px 20px rgba(0, 0, 0, 0.4);
  margin-bottom: 1.5rem !important;
  animation: fadeInDown 1s ease-out forwards;
  font-family: "Microsoft YaHei", sans-serif;
  letter-spacing: 3px;
  transform: perspective(500px) rotateX(5deg);
}

.tagline {
  font-size: 1.8rem !important;
  font-weight: 500;
  color: #ffffff;
  text-shadow: 
    0 1px 0 #ccc,
    0 2px 0 #999,
    0 4px 6px rgba(0, 0, 0, 0.6),
    0 5px 10px rgba(0, 0, 0, 0.4);
  letter-spacing: 1.5px !important;
  animation: fadeInUp 1.2s ease-out forwards;
  font-family: "Microsoft YaHei", sans-serif;
  transform: perspective(500px) rotateX(3deg);
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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

  .scene-text {
    text-align: center;
    width: 100%;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 1rem;
    font-size: 1.3rem;
    font-weight: 500;
  }

  p {
    color: rgba(255, 255, 255, 0.9);
    font-size: 1rem;
    line-height: 1.5;
    text-align: justify;
    width: 100%;
  }
  
  &.clickable {
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      background: rgba(255, 255, 255, 0.1);
    }
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
