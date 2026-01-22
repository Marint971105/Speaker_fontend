<template>
  <div class="qrcode-verify">
    <div class="overlay"></div>
    <div class="verify-container">
      <h3 class="title">扫码进班验证</h3>
      
      <!-- 第一阶段：验证手机号 -->
      <div v-if="!mobileVerified" class="verify-step">
        <el-form ref="mobileForm" :model="mobileForm" :rules="mobileRules">
          <el-form-item prop="mobile">
            <el-input
              v-model="mobileForm.mobile"
              type="text"
              auto-complete="off"
              placeholder="请输入手机号"
              class="input-custom"
            >
              <svg-icon slot="prefix" icon-class="phone" class="el-input__icon input-icon" />
            </el-input>
          </el-form-item>
          <el-button
            :loading="checking"
            type="primary"
            @click="handleCheckMobile"
            class="verify-button"
          >
            {{ checking ? '验证中...' : '验证' }}
          </el-button>
        </el-form>
      </div>
      
      <!-- 第二阶段：手机号存在，输入密码 -->
      <div v-if="mobileVerified && userExists" class="verify-step">
        <el-form ref="loginForm" :model="loginForm" :rules="loginRules">
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              auto-complete="off"
              placeholder="请输入密码"
              @keyup.enter.native="handleLogin"
              class="input-custom"
            >
              <svg-icon slot="prefix" icon-class="password" class="el-input__icon input-icon" />
            </el-input>
          </el-form-item>
          <el-button
            :loading="loading"
            type="primary"
            @click="handleLogin"
            class="verify-button"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
          <!-- 暂时注释掉忘记密码按钮 -->
          <!-- <div class="forgot-password">
            <a @click="showResetPasswordDialog">忘记密码？</a>
          </div> -->
        </el-form>
      </div>
      
      <!-- 第三阶段：手机号不存在，选择注册或CAS -->
      <div v-if="mobileVerified && !userExists" class="verify-step">
        <p class="tip-text">该手机号未注册，请选择：</p>
        <el-button
          type="primary"
          @click="goToRegister"
          class="choice-button"
        >
          注册账号
        </el-button>
        <el-button
          type="primary"
          @click="goToCasLogin"
          class="choice-button"
        >
          CAS认证登录
        </el-button>
      </div>
      
      <!-- 重置密码对话框 -->
      <el-dialog
        title="重置密码"
        :visible.sync="resetPasswordDialogVisible"
        width="400px"
        :close-on-click-modal="false"
      >
        <el-form ref="resetForm" :model="resetForm" :rules="resetRules" label-width="100px">
          <el-form-item label="手机号">
            <el-input v-model="mobileForm.mobile" disabled></el-input>
          </el-form-item>
          <el-form-item label="验证码" prop="smsCode">
            <el-input
              v-model="resetForm.smsCode"
              placeholder="请输入验证码"
              style="width: 60%"
            >
            </el-input>
            <el-button
              :disabled="smsCodeCountdown > 0"
              @click="sendSmsCode"
              style="width: 38%; margin-left: 2%"
            >
              {{ smsCodeCountdown > 0 ? `${smsCodeCountdown}秒后重试` : '发送验证码' }}
            </el-button>
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="resetForm.newPassword"
              type="password"
              placeholder="请输入新密码"
              show-password
            ></el-input>
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="resetForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              show-password
            ></el-input>
          </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button @click="resetPasswordDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="resetting" @click="handleResetPassword">确定</el-button>
        </span>
      </el-dialog>
    </div>
  </div>
</template>

<script>
import { checkMobile, sendSmsCode, resetPasswordBySms, login } from '@/api/login';
import { loginAccountAndAttend } from '@/api/classManage/teacher/index';
import { setToken } from '@/utils/auth';

export default {
  name: 'QrcodeVerify',
  data() {
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== this.resetForm.newPassword) {
        callback(new Error('两次输入的密码不一致'));
      } else {
        callback();
      }
    };
    
    return {
      mobileForm: {
        mobile: ''
      },
      mobileRules: {
        mobile: [
          { required: true, trigger: 'blur', message: '请输入手机号' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
        ]
      },
      loginForm: {
        password: ''
      },
      loginRules: {
        password: [
          { required: true, trigger: 'blur', message: '请输入密码' }
        ]
      },
      resetForm: {
        smsCode: '',
        newPassword: '',
        confirmPassword: ''
      },
      resetRules: {
        smsCode: [
          { required: true, trigger: 'blur', message: '请输入验证码' },
          { pattern: /^\d{6}$/, message: '验证码为6位数字', trigger: 'blur' }
        ],
        newPassword: [
          { required: true, trigger: 'blur', message: '请输入新密码' },
          { min: 5, max: 20, message: '密码长度必须介于 5 和 20 之间', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, trigger: 'blur', message: '请确认新密码' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
      },
      mobileVerified: false,
      userExists: false,
      checking: false,
      loading: false,
      resetting: false,
      resetPasswordDialogVisible: false,
      smsCodeCountdown: 0,
      classId: null,
      userInfo: null
    };
  },
  created() {
    // 从URL获取classId
    this.classId = this.$route.query.classId;
    if (this.classId) {
      console.log('扫码进班，班级ID:', this.classId);
    }
  },
  methods: {
    // 验证手机号
    async handleCheckMobile() {
      this.$refs.mobileForm.validate(async (valid) => {
        if (valid) {
          this.checking = true;
          try {
            const response = await checkMobile(this.mobileForm.mobile);
            if (response.code === 1) {
              this.mobileVerified = true;
              this.userExists = response.data.exists;
              if (response.data.userInfo) {
                this.userInfo = response.data.userInfo;
              }
              if (this.userExists) {
                this.$message.success('手机号验证成功，请输入密码登录');
              } else {
                this.$message.info('该手机号未注册');
              }
            } else {
              this.$message.error(response.msg || '验证失败');
            }
          } catch (error) {
            this.$message.error('验证失败：' + (error.message || '网络错误'));
          } finally {
            this.checking = false;
          }
        }
      });
    },
    
    // 登录
    async handleLogin() {
      this.$refs.loginForm.validate(async (valid) => {
        if (valid) {
          this.loading = true;
          try {
            // 使用手机号登录
            const response = await login(this.mobileForm.mobile, this.loginForm.password);
            if (response.code === 1) {
              const token = response.data;
              setToken(token);
              this.$store.commit('SET_TOKEN', token);
              
              // 【关键】登录成功后，先加载用户信息，确保用户信息可用
              try {
                await this.$store.dispatch('GetInfo');
                console.log('扫码登录：用户信息加载成功');
                
                // 如果有classId，自动加入班级（用户信息已加载，此时可以安全调用加入班级接口）
                if (this.classId) {
                  await this.autoJoinClass();
                } else {
                  this.$message.success('登录成功');
                  this.$router.push({ path: '/' });
                }
              } catch (error) {
                console.error('扫码登录：加载用户信息失败:', error);
                this.$message.error('登录成功，但加载用户信息失败：' + (error.message || '未知错误'));
                // 即使加载用户信息失败，也尝试加入班级（可能用户信息已缓存）
                if (this.classId) {
                  try {
                    await this.autoJoinClass();
                  } catch (joinError) {
                    console.error('扫码登录：加入班级失败:', joinError);
                  }
                }
                this.$router.push({ path: '/' });
              }
            } else {
              this.$message.error(response.msg || '登录失败');
            }
          } catch (error) {
            this.$message.error('登录失败：' + (error.message || '网络错误'));
          } finally {
            this.loading = false;
          }
        }
      });
    },
    
    // 自动加入班级
    async autoJoinClass() {
      try {
        const response = await loginAccountAndAttend(this.classId);
        if (response.code === 1 || response.code === 200) {
          this.$message.success(response.msg || '加入班级成功');
          this.$router.push({ path: '/' });
        } else {
          this.$message.warning(response.msg || '您已在该班级中');
          this.$router.push({ path: '/' });
        }
      } catch (error) {
        console.error('加入班级失败:', error);
        this.$message.error('加入班级失败：' + (error.message || '网络错误'));
        this.$router.push({ path: '/' });
      }
    },
    
    // 跳转到注册页面
    goToRegister() {
      const query = {};
      if (this.classId) {
        query.classId = this.classId;
      }
      // 【优化】传递手机号到注册页面，自动填入
      if (this.mobileForm.mobile) {
        query.mobile = this.mobileForm.mobile;
      }
      this.$router.push({ path: '/register', query: query });
    },
    
    // 跳转到CAS登录（直接跳转到CAS认证页面）
    goToCasLogin() {
      // 【关键】CAS登录前，如果有classId，保存到sessionStorage
      // 因为CAS跳转会丢失URL参数，需要用sessionStorage桥接
      if (this.classId) {
        sessionStorage.setItem('pendingClassId', this.classId);
        console.log('CAS登录前，已保存 classId 到 sessionStorage:', this.classId);
      }
      
      // 【关键】保存手机号到sessionStorage，用于CAS认证成功后更新用户手机号
      // 用户在扫码验证时输入的手机号，CAS认证后需要更新到用户账户中
      if (this.mobileForm.mobile) {
        sessionStorage.setItem('pendingMobile', this.mobileForm.mobile);
        console.log('CAS登录前，已保存手机号到 sessionStorage:', this.mobileForm.mobile);
      }
      
      const casLoginUrl = process.env.VUE_APP_CAS_LOGIN_URL || 'https://auth.bupt.edu.cn/authserver/login';
      
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
      const serviceUrl = rfc2396Encode('https://u757646-bba3-60bbb321.nmb1.seetacloud.com:8443/cas/callback');
      
      console.log('编码前service:', 'https://u757646-bba3-60bbb321.nmb1.seetacloud.com:8443/cas/callback');
      console.log('编码后service:', serviceUrl);
      // 直接跳转到CAS认证页面
      window.location.href = `${casLoginUrl}?service=${serviceUrl}`;
    },
    
    // 显示重置密码对话框
    showResetPasswordDialog() {
      this.resetPasswordDialogVisible = true;
      this.resetForm = {
        smsCode: '',
        newPassword: '',
        confirmPassword: ''
      };
    },
    
    // 发送验证码
    async sendSmsCode() {
      if (!this.mobileForm.mobile) {
        this.$message.warning('请先输入手机号');
        return;
      }
      
      try {
        const response = await sendSmsCode(this.mobileForm.mobile);
        if (response.code === 1) {
          this.$message.success('验证码已发送，请查看手机短信（开发阶段请查看后端日志）');
          // 开始倒计时
          this.smsCodeCountdown = 60;
          const timer = setInterval(() => {
            this.smsCodeCountdown--;
            if (this.smsCodeCountdown <= 0) {
              clearInterval(timer);
            }
          }, 1000);
        } else {
          this.$message.error(response.msg || '发送验证码失败');
        }
      } catch (error) {
        this.$message.error('发送验证码失败：' + (error.message || '网络错误'));
      }
    },
    
    // 重置密码
    async handleResetPassword() {
      this.$refs.resetForm.validate(async (valid) => {
        if (valid) {
          this.resetting = true;
          try {
            const response = await resetPasswordBySms(
              this.mobileForm.mobile,
              this.resetForm.smsCode,
              this.resetForm.newPassword
            );
            if (response.code === 1) {
              this.$message.success('密码重置成功，请使用新密码登录');
              this.resetPasswordDialogVisible = false;
              // 自动使用新密码登录
              this.loginForm.password = this.resetForm.newPassword;
              await this.handleLogin();
            } else {
              this.$message.error(response.msg || '重置密码失败');
            }
          } catch (error) {
            this.$message.error('重置密码失败：' + (error.message || '网络错误'));
          } finally {
            this.resetting = false;
          }
        }
      });
    }
  }
};
</script>

<style scoped lang="scss">
.qrcode-verify {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-image: url("../assets/buptshitang.jpg");
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  position: relative;
  padding: 2rem;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  filter: blur(2px);
  z-index: 1;
}

.verify-container {
  position: relative;
  z-index: 2;
  background: #ffffff;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 450px;
}

.title {
  text-align: center;
  margin-bottom: 30px;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.verify-step {
  width: 100%;
}

.input-custom .el-input__inner {
  border: 1px solid #dcdfe6;
  color: #606266;
  background-color: #fff;
  border-radius: 5px;
  height: 3rem !important;
  font-size: 1rem;
  padding-left: 3rem !important;
  line-height: 3rem !important;
}

.verify-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  margin-top: 10px;
  background: linear-gradient(135deg, #8BB174, #0072BD);
  border: none;
  color: #FFF;
  font-weight: 600;
}

.choice-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  margin-top: 15px;
}

.tip-text {
  text-align: center;
  color: #606266;
  margin-bottom: 20px;
  font-size: 14px;
}

.forgot-password {
  text-align: center;
  margin-top: 15px;
  
  a {
    color: #409EFF;
    cursor: pointer;
    text-decoration: none;
    font-size: 14px;
    
    &:hover {
      text-decoration: underline;
    }
  }
}


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
  width: 20px !important;
  margin-left: 8px !important;
  vertical-align: middle;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
</style>


