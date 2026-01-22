<template>
  <div class="home">
    <!-- 用户须知弹窗 - 重新设计 -->
    <el-dialog
      :title="noticeDialogTitle"
      :visible.sync="noticeDialogVisible"
      width="550px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      :modal="true"
      :modal-append-to-body="true"
      :append-to-body="true"
      custom-class="user-notice-dialog"
      @opened="onNoticeDialogOpened"
      @closed="onNoticeDialogClosed">
      <div class="notice-content">
        <div class="notice-header">
          <i class="el-icon-warning notice-icon"></i>
          <span class="notice-title-text">重要提示</span>
        </div>
        <div class="notice-body">
          <p class="notice-intro">您必须完善个人信息，因为：</p>
          <ul class="notice-list">
            <li>
              <i class="el-icon-check notice-list-icon"></i>
              <span>系统需要您的个人信息进行<strong class="highlight-text">评价分析</strong></span>
            </li>
            <li>
              <i class="el-icon-check notice-list-icon"></i>
              <span>系统需要您的个人信息<strong class="highlight-text">发送作业提醒</strong>等通知</span>
            </li>
            <li>
              <i class="el-icon-check notice-list-icon"></i>
              <span>完整的个人信息有助于系统为您提供更好的服务</span>
            </li>
          </ul>
          <div class="notice-warning">
            <i class="el-icon-info"></i>
            <span>请尽快完善您的个人信息！</span>
          </div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" size="medium" @click="handleNoticeConfirm" class="notice-confirm-btn">
          <i class="el-icon-check"></i>
          我知道了
        </el-button>
      </span>
    </el-dialog>

    <!-- 右下角提醒 -->
    <div v-if="showReminder" class="profile-reminder">
      <el-alert
        title="请完善个人信息"
        type="warning"
        :closable="true"
        @close="closeReminder"
        show-icon>
        <template slot="default">
          <span>您的个人信息不完整，请尽快完善以便系统为您提供更好的服务</span>
          <el-button type="text" @click="goToProfile" style="margin-left: 10px; padding: 0;">立即完善</el-button>
        </template>
      </el-alert>
    </div>

    <!-- 背景图 -->
    <div class="background"></div>

    <!-- Hero Section -->
    <section class="hero">
      <div class="container hero-content">
        <h1 class="main-title">多模态语言教学与智能评估平台</h1>
        <p class="tagline">AI助力言之邮理，AI助力您言之有理</p>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <div class="container">
        <!-- 隐私保护说明 -->
        <div class="privacy-notice">
          <span class="privacy-icon">🔒</span>
          <span class="privacy-text">隐私保护承诺：我们严格保护您的个人信息和数据安全，所有数据均加密存储和传输，不会向任何第三方泄露、出售或共享。</span>
        </div>
        
        <div class="feature-grid">
          <div v-for="(feature, index) in features"
               :key="feature.id"
               class="feature-wrapper">
            <div class="feature-card" 
                 @click="handleFeatureClick(feature.id)"
                 :class="{ 
                   clickable: feature.id === 1 || feature.id === 2 || feature.id === 3 || feature.id === 4,
                   'teacher-manage': index === 0,
                   'special-feature': index > 0
                 }">
              <h3>{{ feature.title }}</h3>
              <div class="scene-text" :class="{ 'highlight-scene': true }">{{ feature.scene }}</div>
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
    
    <!-- 可选：聊天助手区域 -->
    <!-- 如果您想要在页面中显示聊天区域而不是浮动按钮，可以取消下面的注释 -->
    <!--
    <section class="chat-section container" v-if="showChatSection">
      <div class="chat-container">
        <h2>智能助手</h2>
        <iframe 
          src="https://llm.bupt.edu.cn/chatbot/f0G1AJ1iaJ4L2NSl"
          class="chat-iframe"
          frameborder="0"
          allow="microphone">
        </iframe>
      </div>
    </section>
    -->
  </div>
</template>

<script>
import { getUserProfile } from "@/api/system/user";

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
      ],
      noticeDialogVisible: false, // 控制用户须知弹窗显示
      noticeDialogTitle: '用户须知', // 弹窗标题
      showReminder: false, // 控制右下角提醒显示
      user: {}, // 用户信息
      checkTimer: null // 检查定时器
    }
  },
  computed: {
    userId() {
      return this.$store.getters.userId || this.$store.getters.id;
    },
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
          title: "中英文语音智能评价",
          description: "基于语音识别与分析技术，精准评估发音、语调及流利度，助力提升口语表达能力",
          icon: require('@/assets/菜单设置.png'),
          iconTextEn: "Multidimensional Ability",
          iconTextCn: "多维测试",
          scene: "自主训练"
        }
      ];

      // 教师/管理员和学生使用相同的顺序
      return [
        allFeatures[2], // 公众演讲多模态教学与智能评价
        allFeatures[0], // 演讲稿智能写作与评价
        allFeatures[1], // 演讲视频智能评价
        allFeatures[3]  // 英语语音智能评价
      ];
    }
  },
  mounted() {
    // 页面加载完成后，延迟检查用户信息（确保用户信息已加载）
    this.$nextTick(() => {
      // 使用多次尝试，确保用户信息已加载
      let retryCount = 0;
      const maxRetries = 10;
      
      const checkUserInfo = () => {
        if (this.userId) {
          console.log('mounted: 开始检查用户信息，userId:', this.userId, '重试次数:', retryCount);
          this.checkUserInfoComplete();
        } else if (retryCount < maxRetries) {
          retryCount++;
          console.log('mounted: userId为空，等待用户信息加载，重试次数:', retryCount);
          setTimeout(checkUserInfo, 300);
        } else {
          console.warn('mounted: 达到最大重试次数，userId仍为空');
        }
      };
      
      // 立即检查一次
      setTimeout(checkUserInfo, 500);
    });
  },
  beforeDestroy() {
    // 清理定时器
    if (this.checkTimer) {
      clearTimeout(this.checkTimer);
      this.checkTimer = null;
    }
  },
  watch: {
    // 监听userId变化，当用户登录后自动检测
    userId: {
      handler(newVal, oldVal) {
        console.log('watch userId变化:', { newVal, oldVal });
        if (newVal && newVal !== oldVal) {
          // 延迟一下，确保用户信息已经加载完成
          setTimeout(() => {
            this.$nextTick(() => {
              console.log('watch: 开始检查用户信息，userId:', newVal);
              this.checkUserInfoComplete();
            });
          }, 300);
        }
      },
      immediate: false // 改为false，避免在组件创建时立即执行
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
    // 检查用户信息是否完整
    async checkUserInfoComplete() {
      console.log('checkUserInfoComplete 被调用，userId:', this.userId);
      if (!this.userId) {
        console.log('userId为空，跳过检查');
        return;
      }
      
      try {
        console.log('开始获取用户信息，userId:', this.userId);
        const response = await getUserProfile(this.userId);
        console.log('获取用户信息响应:', response);
        
        if (response.code === 1 && response.data) {
          this.user = response.data;
          console.log('用户信息:', this.user);
          
          // 检查必填和重要字段是否完整（明确返回布尔值）
          // 必填字段：用户昵称、邮箱、学号、学校、专业、院系、性别
          // 手机号不需要必填（通过扫码登录自动填写）
          // 邮箱需要包含@符号，确保格式正确
          const emailValid = this.user.userName && this.user.userName.includes('@');
          const isComplete = Boolean(
            this.user.nickName && 
            emailValid && 
            this.user.studentId && 
            this.user.school && 
            this.user.major && 
            this.user.dept && 
            this.user.sex
          );
          
          console.log('用户信息完整性检查:', {
            isComplete,
            nickName: !!this.user.nickName,
            userName: !!this.user.userName,
            studentId: !!this.user.studentId,
            school: !!this.user.school,
            major: !!this.user.major,
            dept: !!this.user.dept,
            sex: !!this.user.sex,
            mobile: !!this.user.mobile, // 手机号不需要必填，仅用于日志记录
            userId: this.userId
          });
          
          if (!isComplete) {
            // 使用基于userId的sessionStorage key，确保不同用户有不同的记录
            const noticeStorageKey = `userNoticeShown_${this.userId}`;
            const hasShownNotice = sessionStorage.getItem(noticeStorageKey);
            console.log('用户信息不完整，检查用户须知显示状态:', {
              noticeStorageKey,
              hasShownNotice,
              userId: this.userId
            });
            
            if (!hasShownNotice) {
              // 第一次进入且信息不完整，显示用户须知弹窗
              console.log('显示用户须知弹窗');
              // 使用 $nextTick 确保 DOM 更新完成后再显示弹窗
              this.$nextTick(() => {
                this.noticeDialogVisible = true;
                console.log('弹窗状态已设置为显示，noticeDialogVisible:', this.noticeDialogVisible);
              });
            } else {
              console.log('用户须知已显示过，不显示弹窗');
            }
            // 无论是否显示过用户须知，只要信息不完整就显示右下角提醒
            this.showReminder = true;
          } else {
            // 如果信息完整，隐藏提醒和弹窗
            console.log('用户信息完整，隐藏提醒');
            this.showReminder = false;
            this.noticeDialogVisible = false;
            // 清除当前用户的sessionStorage记录，以便下次信息不完整时重新显示
            const noticeStorageKey = `userNoticeShown_${this.userId}`;
            sessionStorage.removeItem(noticeStorageKey);
          }
        } else {
          console.warn('获取用户信息失败，响应code:', response.code);
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
    },
    // 处理用户须知确认
    handleNoticeConfirm() {
      console.log('用户点击确定，关闭用户须知弹窗');
      this.noticeDialogVisible = false;
      // 使用基于userId的sessionStorage key，记录当前用户已经显示过用户须知
      const noticeStorageKey = `userNoticeShown_${this.userId}`;
      sessionStorage.setItem(noticeStorageKey, 'true');
      console.log('已记录用户须知显示状态:', noticeStorageKey);
      // 确保右下角提醒显示
      this.showReminder = true;
    },
    // 弹窗打开时的回调
    onNoticeDialogOpened() {
      console.log('用户须知弹窗已打开');
    },
    // 弹窗关闭时的回调
    onNoticeDialogClosed() {
      console.log('用户须知弹窗已关闭');
    },
    // 关闭右下角提醒
    closeReminder() {
      this.showReminder = false;
    },
    // 跳转到个人信息页面
    goToProfile() {
      this.$router.push('/user/profile');
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

/* 隐私保护说明 */
.privacy-notice {
  text-align: center;
  padding: 1rem 2rem;
  margin-bottom: 1.5rem;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.1rem;
  line-height: 1.6;
  
  .privacy-icon {
    margin-right: 0.5rem;
    font-size: 1.2rem;
  }
  
  .privacy-text {
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
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
  
  // 教师管理功能 - 第一个卡片（浅蓝色系）
  &.teacher-manage {
    background: linear-gradient(135deg, rgba(147, 197, 253, 0.2) 0%, rgba(96, 165, 250, 0.15) 100%);
    border: 2px solid rgba(147, 197, 253, 0.4);
    box-shadow: 0 4px 15px rgba(147, 197, 253, 0.2);
  }
  
  // 特色功能 - 后三个卡片统一使用浅绿色系
  &.special-feature {
    background: linear-gradient(135deg, rgba(134, 239, 172, 0.2) 0%, rgba(74, 222, 128, 0.15) 100%);
    border: 2px solid rgba(134, 239, 172, 0.4);
    box-shadow: 0 4px 15px rgba(134, 239, 172, 0.2);
  }

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
    
    &.highlight-scene {
      font-weight: 700;
      font-size: 1.5rem;
      color: #FFD700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      letter-spacing: 2px;
    }
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
      
      &.teacher-manage {
        box-shadow: 0 8px 25px rgba(147, 197, 253, 0.4);
        background: linear-gradient(135deg, rgba(147, 197, 253, 0.3) 0%, rgba(96, 165, 250, 0.25) 100%);
      }
      
      &.special-feature {
        box-shadow: 0 8px 25px rgba(134, 239, 172, 0.4);
        background: linear-gradient(135deg, rgba(134, 239, 172, 0.3) 0%, rgba(74, 222, 128, 0.25) 100%);
      }
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

/* 聊天区域样式 - 如果启用iframe方式 */
.chat-section {
  padding: 2rem 0;
  background: rgba(17, 34, 64, 0.8);
  border-radius: 10px;
  margin: 1rem 0;
}

.chat-container {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.chat-container h2 {
  color: #ffffff;
  margin-bottom: 1rem;
  font-size: 2rem;
}

.chat-iframe {
  width: 100%;
  height: 600px;
  border-radius: 10px;
  background: white;
}

/* 右下角提醒样式 */
.profile-reminder {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2000;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.profile-reminder ::v-deep .el-alert {
  border-radius: 8px;
}

.profile-reminder ::v-deep .el-alert__content {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.profile-reminder ::v-deep .el-alert__title {
  font-weight: 600;
  margin-bottom: 5px;
}

.profile-reminder ::v-deep .el-button--text {
  color: #409EFF;
  font-weight: 600;
}

.profile-reminder ::v-deep .el-button--text:hover {
  color: #66b1ff;
}

/* 用户须知弹窗样式 */
::v-deep .user-notice-dialog {
  border-radius: 12px;
  overflow: hidden;
}

::v-deep .user-notice-dialog .el-dialog__header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 24px;
  border-bottom: none;
}

::v-deep .user-notice-dialog .el-dialog__title {
  color: #ffffff;
  font-size: 20px;
  font-weight: 600;
}

::v-deep .user-notice-dialog .el-dialog__body {
  padding: 24px;
}

::v-deep .user-notice-dialog .el-dialog__footer {
  padding: 16px 24px;
  border-top: 1px solid #EBEEF5;
  text-align: center;
}

.notice-content {
  color: #303133;
}

.notice-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #F0F2F5;
}

.notice-icon {
  font-size: 28px;
  color: #E6A23C;
  margin-right: 12px;
}

.notice-title-text {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.notice-body {
  line-height: 1.8;
}

.notice-intro {
  font-size: 15px;
  color: #606266;
  margin-bottom: 16px;
  font-weight: 500;
}

.notice-list {
  margin: 0 0 20px 0;
  padding: 0;
  list-style: none;
}

.notice-list li {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  padding: 8px 0;
  font-size: 14px;
  color: #606266;
}

.notice-list-icon {
  color: #67C23A;
  font-size: 16px;
  margin-right: 10px;
  margin-top: 2px;
  flex-shrink: 0;
}

.highlight-text {
  color: #409EFF;
  font-weight: 600;
}

.notice-warning {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #FEF0F0;
  border: 1px solid #FDE2E2;
  border-radius: 6px;
  color: #F56C6C;
  font-weight: 600;
  font-size: 14px;
}

.notice-warning i {
  font-size: 18px;
  margin-right: 8px;
}

.notice-confirm-btn {
  padding: 10px 30px;
  font-size: 15px;
  font-weight: 600;
}

.notice-confirm-btn i {
  margin-right: 6px;
}
</style>
