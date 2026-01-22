<template>
  <div class="login">
    <div class="overlay"></div>
    
    <!-- 双卡片容器 -->
    <div class="cards-container">
      <!-- 左侧：原有的登录卡片 -->
      <div class="login-card-container">
        <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="login-form">
        <img src="@/assets/logo/new_logo.jpg" alt="Utalk Logo" class="logo-img">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            type="text"
            auto-complete="off"
            placeholder="手机号/学号"
            class="input-custom"
          >
            <svg-icon slot="prefix" icon-class="user" class="el-input__icon input-icon" />
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            auto-complete="off"
            placeholder="密码"
            @keyup.enter.native="handleLogin"
            class="input-custom"
          >
            <svg-icon slot="prefix" icon-class="password" class="el-input__icon input-icon" />
          </el-input>
        </el-form-item>
        <el-checkbox v-model="loginForm.rememberMe" class="checkbox-custom">记住密码</el-checkbox>
      </el-form>
      
      <!-- 忘记密码链接 -->
      <div class="forgot-password-wrapper">
        <el-link type="primary" @click="showForgotPasswordDialog" class="forgot-password-link">忘记密码？</el-link>
      </div>
      
      <!-- 将按钮移到 el-form 外部，避免 Element UI 样式干扰 -->
      <div class="login-buttons-wrapper">
        <el-button
          :loading="loading"
          size="medium"
          type="primary"
          @click.native.prevent="handleLogin"
          class="login-button"
        >
          <span v-if="!loading">登 录</span>
          <span v-else>登 录 中...</span>
        </el-button>
        <el-button
          size="medium"
          type="primary"
          @click="handleCasLogin"
          class="login-button cas-button"
        >
          北京邮电大学统一认证登录
        </el-button>
      </div>
      
        <div class="register-link-wrapper" v-if="register">
          <router-link class="link-type" :to="{ path: '/register', query: classId ? { classId: classId } : {} }">立即注册</router-link>
        </div>
      </div>
      
      <!-- 右侧：多智能体登录卡片 -->
      <div class="agent-card">
        <img src="@/assets/logo/agentlogo2.png" alt="智能语伴" class="logo-img agent-logo">
        <div class="agent-description">
          <div class="agent-intro">
            <p class="intro-main">
              集<span class="highlight">视频智析</span>、<span class="highlight">语音评鉴</span>、<span class="highlight">文稿智写</span>、<span class="highlight">PPT智检</span>
            </p>
            <p class="intro-slogan">
              深度赋能公众表达与写作沟通
            </p>
          </div>
        </div>
        <el-button
          size="medium"
          type="primary"
          class="login-button agent-button"
          @click="handleAgentLogin"
        >
          立即体验
        </el-button>
      </div>
    </div>
    
    <!-- 忘记密码对话框 -->
    <el-dialog
      title="忘记密码"
      :visible.sync="forgotPasswordDialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-steps :active="forgotPasswordStep" finish-status="success" align-center style="margin-bottom: 30px;">
        <el-step title="输入学号"></el-step>
        <el-step title="验证身份"></el-step>
        <el-step title="重置密码"></el-step>
      </el-steps>
      
      <!-- 第一步：输入学号 -->
      <div v-if="forgotPasswordStep === 0">
        <el-form :model="forgotPasswordForm" :rules="forgotPasswordRules" ref="forgotPasswordForm" label-width="100px">
          <el-form-item label="学号" prop="studentId">
            <el-input
              v-model="forgotPasswordForm.studentId"
              placeholder="请输入学号"
              @keyup.enter.native="handleCheckIdentity"
            ></el-input>
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="forgotPasswordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCheckIdentity" :loading="checkingIdentity">下一步</el-button>
        </div>
      </div>
      
      <!-- 第二步：验证身份 -->
      <div v-if="forgotPasswordStep === 1">
        <el-alert
          v-if="!userIdentityInfo.hasMobile"
          type="error"
          :closable="false"
          show-icon
          style="margin-bottom: 20px;"
        >
          <div slot="title">
            <p>该用户未绑定手机号，无法通过此方式重置密码</p>
          </div>
        </el-alert>
        <el-form v-if="userIdentityInfo.hasMobile" :model="forgotPasswordForm" :rules="forgotPasswordRules" ref="identityForm" label-width="100px">
          <el-form-item label="姓名" prop="nickName">
            <el-input
              v-model="forgotPasswordForm.nickName"
              placeholder="请输入姓名"
            ></el-input>
          </el-form-item>
          <el-form-item label="手机号" prop="mobile">
            <el-input
              v-model="forgotPasswordForm.mobile"
              placeholder="请输入完整手机号"
              maxlength="11"
            ></el-input>
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="forgotPasswordStep = 0">上一步</el-button>
          <el-button v-if="userIdentityInfo.hasMobile" type="primary" @click="handleVerifyIdentity" :loading="verifyingIdentity">下一步</el-button>
        </div>
      </div>
      
      <!-- 第三步：重置密码 -->
      <div v-if="forgotPasswordStep === 2">
        <el-form :model="forgotPasswordForm" :rules="forgotPasswordRules" ref="resetPasswordForm" label-width="100px">
          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="forgotPasswordForm.newPassword"
              type="password"
              placeholder="请输入新密码"
              show-password
            ></el-input>
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="forgotPasswordForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              show-password
            ></el-input>
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="forgotPasswordStep = 1">上一步</el-button>
          <el-button type="primary" @click="handleResetPassword" :loading="resettingPassword">重置密码</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
// import { getCodeImg } from "@/api/login";
import Cookies from "js-cookie";
import { encrypt, decrypt } from '@/utils/jsencrypt'
import { checkUserIdentity, resetPasswordByIdentity } from '@/api/login'

export default {
  name: "Login",
  data() {
    return {
      // codeUrl: "",
      loginForm: {
        username: "",
        password: "",
        rememberMe: false,

      },
      loginRules: {
        username: [
          { required: true, trigger: "blur", message: "请输入手机号或学号" }
        ],
        password: [
          { required: true, trigger: "blur", message: "请输入您的密码" }
        ],
        // code: [{ required: true, trigger: "change", message: "请输入验证码" }]
      },
      loading: false,
      // 验证码开关
      captchaEnabled: false,
      // 注册开关
      register: true,
      redirect: undefined,
      // 扫码进班相关
      classId: null,  // 从URL获取的班级ID，用于扫码进班功能
      // 忘记密码相关
      forgotPasswordDialogVisible: false,
      forgotPasswordStep: 0, // 0: 输入学号, 1: 验证身份, 2: 重置密码
      forgotPasswordForm: {
        studentId: '',
        nickName: '',
        mobile: '',
        newPassword: '',
        confirmPassword: ''
      },
      forgotPasswordRules: {
        studentId: [
          { required: true, message: '请输入学号', trigger: 'blur' }
        ],
        nickName: [
          { required: true, message: '请输入姓名', trigger: 'blur' }
        ],
        mobile: [
          { required: true, message: '请输入手机号', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
        ],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请再次输入新密码', trigger: 'blur' },
          { validator: this.validateConfirmPassword, trigger: 'blur' }
        ]
      },
      userIdentityInfo: {}, // 用户身份信息
      checkingIdentity: false,
      verifyingIdentity: false,
      resettingPassword: false
    };
  },
  watch: {
    $route: {
      handler: function(route) {
        this.redirect = route.query && route.query.redirect;
      },
      immediate: true
    }
  },
  created() {
    // this.getCode();
    this.getCookie();
    
    // 检查URL中是否有classId参数（扫码进班场景）
    this.classId = this.$route.query.classId;
    if (this.classId) {
      console.log('检测到扫码进班，班级ID:', this.classId);
      
      // 检查用户是否已登录
      const token = this.$store.getters.token;
      if (token) {
        console.log('用户已登录，尝试自动加入班级');
        this.autoJoinClass();
      } else {
        console.log('用户未登录，显示登录页面');
      }
    }
  },
  methods: {
    // getCode() {
    //   getCodeImg().then(res => {
    //     this.captchaEnabled = res.captchaEnabled === undefined ? true : res.captchaEnabled;
    //     if (this.captchaEnabled) {
    //       this.codeUrl = "data:image/gif;base64," + res.img;
    //       this.loginForm.uuid = res.uuid;
    //     }
    //   });
    // },
    getCookie() {
      const username = Cookies.get("username");
      const password = Cookies.get("password");
      const rememberMe = Cookies.get('rememberMe')
      this.loginForm = {
        username: username === undefined ? this.loginForm.username : username,
        password: password === undefined ? this.loginForm.password : decrypt(password),
        rememberMe: rememberMe === undefined ? false : Boolean(rememberMe)
      };
    },
    handleLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true;
          if (this.loginForm.rememberMe) {
            Cookies.set("username", this.loginForm.username, { expires: 30 });
            Cookies.set("password", encrypt(this.loginForm.password), { expires: 30 });
            Cookies.set('rememberMe', this.loginForm.rememberMe, { expires: 30 });
          } else {
            Cookies.remove("username");
            Cookies.remove("password");
            Cookies.remove('rememberMe');
          }
          this.$store.dispatch("Login", this.loginForm).then(() => {
            // 登录成功后检查是否有classId（扫码进班场景）
            if (this.classId) {
              console.log('登录成功，准备加入班级:', this.classId);
              return this.autoJoinClass();
            } else {
              // 普通登录，正常跳转
            console.log("Redirecting to: ", this.redirect || "/");
            this.$router.push({ path: this.redirect || "/" }).catch(err => console.error(err));
            }
          }).catch((error) => {
            console.log("Full Error: ", JSON.stringify(error, null, 2));  // 打印完整的错误信息
            if (error.response) {
              console.log("Error Response: ", error.response);
              console.log("Error Status: ", error.response.status);
              console.log("Error Data: ", error.response.data);
            }
            this.loading = false;
            // if (this.captchaEnabled) {
            //   this.getCode();
            // }
          });
        }
      });
    },
    // 添加统一认证登录方法
    handleCasLogin() {
      // 【关键】CAS登录前，如果有classId，保存到sessionStorage
      // 因为CAS跳转会丢失URL参数，需要用sessionStorage桥接
      if (this.classId) {
        sessionStorage.setItem('pendingClassId', this.classId);
        console.log('CAS登录前，已保存 classId 到 sessionStorage:', this.classId);
      }
      
      const casLoginUrl = process.env.VUE_APP_CAS_LOGIN_URL
      
      // 按照 RFC2396 标准编码保留字符
      function rfc2396Encode(str) {
        // 编码所有保留字符: ;/?:@&=+$,
        return str.replace(/[;/?:@&=+$,]/g, function(char) {
          // 转换为16进制，确保两位数，小写
          const hex = char.charCodeAt(0).toString(16).toLowerCase();
          return '%' + (hex.length === 1 ? '0' + hex : hex);
        });
      }
      
      // 使用与后端完全相同的 service URL
      const serviceUrl = rfc2396Encode('https://u757646-bba3-60bbb321.nmb1.seetacloud.com:8443/cas/callback')
      
      console.log('编码前service:', 'https://u757646-bba3-60bbb321.nmb1.seetacloud.com:8443/cas/callback')
      console.log('编码后service:', serviceUrl)
      window.location.href = `${casLoginUrl}?service=${serviceUrl}`
    },
    // 添加多智能体系统跳转方法
    handleAgentLogin() {
      window.open('https://u2757646-bba3-60bbb321.nmb1.seetacloud.com:8443/', '_blank')
    },
    
    /**
     * 自动加入班级（扫码进班的核心逻辑）
     * 作用：用户登录成功后，如果是扫码进班场景，自动调用加入班级接口
     */
    async autoJoinClass() {
      try {
        // 导入API函数
        const { loginAccountAndAttend } = await import('@/api/classManage/teacher/index');
        
        // 调用加入班级接口
        const response = await loginAccountAndAttend(this.classId);
        
        if (response.code === 1 || response.code === 200) {
          // 加入成功
          this.$message.success(response.msg || '加入班级成功');
          console.log('成功加入班级:', this.classId);
          
          // 跳转到班级详情页（如果有的话）或首页
          // 可以根据实际情况修改跳转目标
          this.$router.push({ path: this.redirect || '/' });
        } else {
          // 加入失败
          this.$message.error(response.msg || '加入班级失败');
          console.error('加入班级失败:', response);
          
          // 即使加入失败，也跳转到首页（避免卡在登录页）
          this.$router.push({ path: '/' });
        }
      } catch (error) {
        console.error('加入班级出错:', error);
        this.$message.error('加入班级失败：' + (error.message || '网络错误'));
        
        // 出错也跳转到首页
        this.$router.push({ path: '/' });
      }
    },
    
    // 显示忘记密码对话框
    showForgotPasswordDialog() {
      this.forgotPasswordDialogVisible = true;
      this.forgotPasswordStep = 0;
      this.forgotPasswordForm = {
        studentId: '',
        nickName: '',
        mobile: '',
        newPassword: '',
        confirmPassword: ''
      };
      this.userIdentityInfo = {};
    },
    
    // 验证确认密码
    validateConfirmPassword(rule, value, callback) {
      if (value !== this.forgotPasswordForm.newPassword) {
        callback(new Error('两次输入的密码不一致'));
      } else {
        callback();
      }
    },
    
    // 检查用户身份
    async handleCheckIdentity() {
      this.$refs.forgotPasswordForm.validate(async (valid) => {
        if (valid) {
          this.checkingIdentity = true;
          try {
            const response = await checkUserIdentity(this.forgotPasswordForm.studentId);
            if (response.code === 1) {
              this.userIdentityInfo = response.data;
              if (!this.userIdentityInfo.hasMobile) {
                this.$message.error('该用户未绑定手机号，无法通过此方式重置密码');
                return;
              }
              this.forgotPasswordStep = 1;
            } else {
              this.$message.error(response.msg || '学号不存在');
            }
          } catch (error) {
            this.$message.error('检查用户身份失败：' + (error.message || '网络错误'));
          } finally {
            this.checkingIdentity = false;
          }
        }
      });
    },
    
    // 验证身份信息
    async handleVerifyIdentity() {
      this.$refs.identityForm.validate(async (valid) => {
        if (valid) {
          // 前端只做基本格式验证，实际验证在后端
          this.forgotPasswordStep = 2;
        }
      });
    },
    
    // 重置密码
    async handleResetPassword() {
      this.$refs.resetPasswordForm.validate(async (valid) => {
        if (valid) {
          this.resettingPassword = true;
          try {
            const response = await resetPasswordByIdentity(
              this.forgotPasswordForm.studentId,
              this.forgotPasswordForm.nickName,
              this.forgotPasswordForm.mobile,
              this.forgotPasswordForm.newPassword
            );
            if (response.code === 1) {
              this.$message.success('密码重置成功，请使用新密码登录');
              this.forgotPasswordDialogVisible = false;
              // 自动填充用户名和密码
              this.loginForm.username = this.forgotPasswordForm.studentId;
              this.loginForm.password = this.forgotPasswordForm.newPassword;
            } else {
              this.$message.error(response.msg || '密码重置失败');
            }
          } catch (error) {
            this.$message.error('密码重置失败：' + (error.message || '网络错误'));
          } finally {
            this.resettingPassword = false;
          }
        }
      });
    }
  }
};
</script>

<style rel="stylesheet/scss" lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap');
.login {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-image: url("../assets/buptshitang.jpg");
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  font-family: 'Poppins', sans-serif;
  position: relative;
  min-height: 100vh;
  height: auto;
  padding: 2rem;
}

/* 双卡片容器 */
.cards-container {
  display: flex;
  gap: 10rem;
  align-items: stretch;
  justify-content: center;
  flex-wrap: wrap;
  max-width: 1200px;
  width: 100%;
  z-index: 2;
  
  @media (max-width: 1200px) {
    flex-direction: column;
    align-items: center;
  }
}

.title {
  color: #333;  /* 深色字体 */
  text-align: center;
  margin-bottom: 40px;
  font-size: 26px;
  font-weight: 600;
  text-shadow: none;  /* 移除文字阴影 */
  z-index: 2;
}

/* 增加表单项间距 */
.el-form-item {
  margin-bottom: 25px;  /* 增加表单项之间的间距 */
}
/* 左侧登录卡片整体容器 - 统一的卡片样式 */
.login-card-container {
  position: relative;
  z-index: 2;
  background: #ffffff;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 500px;
  flex: 1;
  min-width: 400px;
  
  @media (max-width: 768px) {
    min-width: 300px;
    padding: 2rem;
  }
}

/* 表单本身不需要额外样式 */
.login-form {
  background: transparent;
  padding: 0;
  margin-bottom: 0;
}

/* 按钮容器 */
.login-buttons-wrapper {
  margin-top: 0;
  padding: 0;
}

/* 注册链接容器 */
.register-link-wrapper {
  text-align: right;
  margin-top: 15px;
  padding: 0;
}

/* 忘记密码链接容器 */
.forgot-password-wrapper {
  text-align: right;
  margin-top: 10px;
  margin-bottom: 15px;
  padding: 0;
}

.forgot-password-link {
  font-size: 14px !important; /* 与 link-type 默认字体大小保持一致 */
  text-decoration: none;
}
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2); /* 半透明黑色背景 */
  filter: blur(2px); /* 模糊效果 */
  z-index: 1; /* 保证层级在表单后面 */
}

.login-tip {
  font-size: 13px;
  text-align: center;
  color: #bfbfbf;
}
.login-code {
  width: 33%;
  height: 38px;
  float: right;
  img {
    cursor: pointer;
    vertical-align: middle;
  }
}

.login-code-img {
  height: 38px;
}
.input-custom .el-input__inner {
  border: 1px solid #dcdfe6;
  color: #606266;
  background-color: #fff;
  border-radius: 5px;
  height: 3rem !important;  /* 增加输入框高度 */
  font-size: 1rem;  /* 适当增加字体大小 */
  padding-left: 3rem !important;  /* 给图标留出足够空间 */
  line-height: 3rem !important;  /* 与高度一致，确保文字垂直居中 */
}

.input-custom .el-input__inner::placeholder {
  color: #909399;
  line-height: 3rem !important;
}

.checkbox-custom {
  color: #606266;
  margin: 0 0 25px 0;
  font-size: 1rem;
}

/* 按钮样式 - 完全脱离 Element UI 控制 */
.login-buttons-wrapper {
  .login-button {
    background: linear-gradient(135deg, #8BB174, #0072BD) !important;
    border: none !important;
    color: #FFF !important;
    font-weight: 600;
    transition: all 0.3s;
    width: 100% !important;
    height: 48px !important;
    font-size: 16px !important;
    letter-spacing: 1px;
    margin: 0 0 15px 0 !important;
    padding: 0 20px !important;
    text-align: center !important;
    display: block !important;
    cursor: pointer;
    border-radius: 4px;
    
    &:last-child {
      margin-bottom: 0 !important;
    }
    
    &:hover {
      background: linear-gradient(135deg, #0072BD, #8BB174) !important;
      transform: scale(1.02);
      box-shadow: 0 6px 20px rgba(139, 177, 116, 0.4);
    }
  }
  
  .cas-button {
    background: linear-gradient(135deg, #0072BD, #8BB174) !important;
    
    &:hover {
      background: linear-gradient(135deg, #8BB174, #0072BD) !important;
      box-shadow: 0 6px 20px rgba(0, 114, 189, 0.4);
    }
  }
}

/* 调整图标容器位置 */
.el-input__prefix {
  display: flex !important;
  align-items: center !important;
  height: 100% !important;
  position: absolute !important;
  left: 0 !important;
  top: 0 !important;
}

.input-icon {
  height: 100% !important;
  width: 20px !important;  /* 设置合适的图标宽度 */
  margin-left: 8px !important;  /* 给图标左边留出一些空间 */
  vertical-align: middle;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.el-input__icon {
  line-height: 3rem !important;  /* 与输入框高度相同 */
  height: 3rem !important;
}

/* 调整svg图标容器 */
.svg-icon {
  height: 20px !important;
  width: 20px !important;
  vertical-align: middle;
}
.logo-img {
  width: 100%;  /* 可以根据需要调整宽度 */
  margin: 0 auto 2rem;  /* 上0 左右auto居中 下40px */
  display: block;  /* 块级元素以便使用margin auto居中 */
}


/* 多智能体卡片样式 */
.agent-card {
  position: relative;
  z-index: 2;
  background: #ffffff;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 500px;
  flex: 1;
  min-width: 400px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;  /* 改为顶部对齐，不使用space-between */
  
  @media (max-width: 768px) {
    min-width: 300px;
    padding: 2rem;
  }
}

.agent-logo {
  margin-bottom: 1rem !important;  /* 减少logo下方间距 */
}

.agent-description {
  flex: 0;  /* 不占用弹性空间 */
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 0;
  min-height: 270px;  /* 设置最小高度以对齐按钮 */
}

.agent-intro {
  background: transparent;
  padding: 0;
  text-align: center;
  padding-top: 4rem;
  margin-bottom: 0;
}

.intro-main {
  color: #2c3e50;
  font-size: 19px;
  line-height: 1.6;
  margin: 0 0 2.5rem 0;
  font-weight: 400;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  .highlight {
    color: #007BFF;  /* 修改为指定颜色 */
    font-weight: 700;
    font-size: 19px;  /* 从22px缩小到17px */
    padding: 0 2px;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 1px;
      left: 0;
      right: 0;
      height: 6px;  /* 减小高亮条高度 */
      background: linear-gradient(135deg, rgba(0, 123, 255, 0.2), rgba(0, 114, 189, 0.2));  /* 调整渐变颜色以匹配 */
      z-index: -1;
      border-radius: 3px;
    }
  }
  
  @media (max-width: 768px) {
    white-space: normal;  /* 小屏幕允许换行 */
    font-size: 14px;
    
    .highlight {
      font-size: 15px;
    }
  }
}

.intro-slogan {
  color: #007AFF;  /* 修改为指定颜色 */
  font-size: 25px;
  font-weight: 700;
  text-align: center;
  margin: 0;  /* 完全移除底部间距 */
  letter-spacing: 2px;
  line-height: 1.5;
}

.agent-button {
  background: linear-gradient(135deg, #409EFF, #0072BD) !important;
  margin-top: 0 !important;  /* 紧跟文字内容 */
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  flex-shrink: 0;  /* 防止按钮被压缩 */
  
  &:hover {
    background: linear-gradient(135deg, #0072BD, #409EFF) !important;
    transform: scale(1.02);
    box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
  }
}


</style>
