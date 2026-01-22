<template>
  <div class="register">
    <div class="overlay"></div>
    <div class="register-container">
    <el-form ref="registerForm" :model="registerForm" :rules="registerRules" class="register-form">
      <h3 class="title">北京邮电大学多模态英语教学与评估平台</h3>
      <el-form-item label="昵称" prop="nickname" required>
        <el-input v-model="registerForm.nickname" type="text" auto-complete="off" placeholder="请输入昵称">
          <svg-icon slot="prefix" icon-class="user" class="el-input__icon input-icon" />
        </el-input>
      </el-form-item>
      <el-form-item label="手机号" prop="mobile" required>
        <el-input v-model="registerForm.mobile" type="text" auto-complete="off" placeholder="请输入手机号">
          <svg-icon slot="prefix" icon-class="phone" class="el-input__icon input-icon" />
        </el-input>
      </el-form-item>
      <el-form-item label="学号" prop="studentId" required>
        <el-input v-model="registerForm.studentId" type="text" auto-complete="off" placeholder="请输入学号">
          <svg-icon slot="prefix" icon-class="tree" class="el-input__icon input-icon" />
        </el-input>
      </el-form-item>
      <el-form-item label="性别" prop="sex" required class="sexsex">
        <el-radio-group v-model="registerForm.sex">
          <el-radio label="男">男</el-radio>
          <el-radio label="女">女</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="密码" prop="password" required>
        <el-input
          v-model="registerForm.password"
          type="password"
          auto-complete="off"
          placeholder="请输入密码"
          @keyup.enter.native="handleRegister"
        >
          <svg-icon slot="prefix" icon-class="password" class="el-input__icon input-icon" />
        </el-input>
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword" required>
        <el-input
          v-model="registerForm.confirmPassword"
          type="password"
          auto-complete="off"
          placeholder="请再次输入密码"
          @keyup.enter.native="handleRegister"
        >
          <svg-icon slot="prefix" icon-class="password" class="el-input__icon input-icon" />
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-checkbox v-model="registerForm.isStudent" :disabled="registerForm.isTeacher || registerForm.isAdmin">注册为学生</el-checkbox>
        <el-checkbox v-model="registerForm.isTeacher" :disabled="registerForm.isStudent || registerForm.isAdmin">注册为教师</el-checkbox>
        <el-checkbox v-model="registerForm.isAdmin" :disabled="registerForm.isStudent || registerForm.isTeacher">注册为管理员</el-checkbox>
      </el-form-item>
      <el-form-item 
        label="秘钥" 
        prop="secretKey" 
        :required="registerForm.isTeacher || registerForm.isAdmin"
        v-if="registerForm.isTeacher || registerForm.isAdmin"
      >
        <el-input
          v-model="registerForm.secretKey"
          type="password"
          auto-complete="off"
          placeholder="请输入秘钥（教师/管理员）"
        >
          <svg-icon slot="prefix" icon-class="lock" class="el-input__icon input-icon" />
        </el-input>
      </el-form-item>
      <el-form-item style="width:100%;">
        <el-button
          :loading="loading"
          size="medium"
          type="primary"
          style="width:100%;"
          class="register-button"
          @click.native.prevent="handleRegister"
        >
          <span v-if="!loading">注 册</span>
          <span v-else>注 册 中...</span>
        </el-button>
        <div style="float: right;">
          <router-link class="link-type" :to="{ path: '/login', query: classIdFromUrl ? { classId: classIdFromUrl } : {} }">使用已有账户登录</router-link>
        </div>
      </el-form-item>
    </el-form>
    <!--  底部  -->
<!--      <div class="el-register-footer">-->
<!--        <span>Copyright © 2024-2025 BUPT All Rights Reserved.</span>-->
<!--      </div>-->
    </div>

  </div>
</template>

<script>
import { registerStudent, registerTeacher, registerAdmin, login } from "@/api/login";
import { loginAccountAndAttend } from "@/api/classManage/teacher/index";
import { setToken } from '@/utils/auth';

export default {
  name: "Register",
  data() {
    const equalToPassword = (rule, value, callback) => {
      if (this.registerForm.password !== value) {
        callback(new Error("两次输入的密码不一致"));
      } else {
        callback();
      }
    };
    return {
      registerForm: {
        nickname:"",
        mobile:"",
        studentId:"",
        sex:"",
        password: "",
        confirmPassword: "",
        secretKey: "", // 秘钥输入
        isStudent: true, // 是否选择注册为学生
        isTeacher: false, // 是否选择注册为教师
        isAdmin: false, // 是否选择注册为管理员
      },

      registerRules: {
        nickname: [
          { required: true, trigger: "blur", message: "请输入您的昵称" },
          { min: 2, max: 20, message: '昵称长度必须介于 2 和 20 之间', trigger: 'blur' }
        ],
        mobile: [
          { required: true, trigger: "blur", message: "请输入您的手机号" },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: ['blur', 'change'] },
        ],
        studentId: [
          { required: true, trigger: "blur", message: "请输入您的学号" },
          { pattern: /^\d{6,12}$/, message: '学号应为6到12位数字', trigger: ['blur', 'change'] },
        ],
        sex: [
          { required: true, message: "请选择性别", trigger: "change" }
        ],
        password: [
          { required: true, trigger: "blur", message: "请输入您的密码" },
          { min: 5, max: 20, message: "用户密码长度必须介于 5 和 20 之间", trigger: "blur" },
          { pattern: /^[^<>"'|\\]+$/, message: "不能包含非法字符：< > \" ' \\\ |", trigger: "blur" }
        ],
        confirmPassword: [
          { required: true, trigger: "blur", message: "请再次输入您的密码" },
          { required: true, validator: equalToPassword, trigger: "blur" }
        ],
        secretKey: [
          { 
            validator: (rule, value, callback) => {
              if ((this.registerForm.isTeacher || this.registerForm.isAdmin) && !value) {
                callback(new Error("请输入秘钥"));
              } else {
                callback();
              }
            }, 
            trigger: "blur" 
          }
        ]
      },
      loading: false,
      // 扫码进班相关
      classIdFromUrl: null,  // 从URL获取的班级ID，用于扫码进班后注册场景

    };
  },
  watch: {
    'registerForm.isStudent'(newVal) {
      if (newVal) {
        this.registerForm.isTeacher = false;
        this.registerForm.isAdmin = false;
      }
    },
    'registerForm.isTeacher'(newVal) {
      if (newVal) {
        this.registerForm.isStudent = false;
        this.registerForm.isAdmin = false;
      }
    },
    'registerForm.isAdmin'(newVal) {
      if (newVal) {
        this.registerForm.isStudent = false;
        this.registerForm.isTeacher = false;
      }
    },
    'registerForm.sex'(newVal) {
      // 当选择的不是空值时，重置为未选择状态
      if (newVal === '男' || newVal === '女') {
        this.registerForm.gender = newVal;
      } else {
        this.registerForm.gender = '';
      }
    }
  },
  created() {
    // 检查URL中是否有classId参数（扫码进班后注册的场景）
    this.classIdFromUrl = this.$route.query.classId;
    if (this.classIdFromUrl) {
      console.log('检测到扫码进班注册场景，班级ID:', this.classIdFromUrl);
    }
    
    // 【优化】从URL参数中获取手机号，自动填入（从扫码验证页面传入）
    const mobileFromUrl = this.$route.query.mobile;
    if (mobileFromUrl) {
      this.registerForm.mobile = mobileFromUrl;
      console.log('自动填入手机号:', mobileFromUrl);
    }
  },
  methods: {
    handleRegister() {
      this.$refs.registerForm.validate(valid => {
        if (valid) {
          this.loading = true;
          // 根据角色调用不同的注册接口
          // 直接传对象，axios会自动序列化为表单格式
          // userName作为唯一标识符：优先使用手机号，如果没有手机号则使用学号
          // 后端会自动处理：如果userName为空，会优先使用手机号，如果没有手机号则使用学号
          let dataToSend = {
            userName: "",  // 留空，后端会自动设置为手机号或学号
            nickName: this.registerForm.nickname,
            mobile: this.registerForm.mobile,
            studentId: this.registerForm.studentId,
            sex: this.registerForm.sex,
            password: this.registerForm.password,
          };
          console.log('datatosend',dataToSend)

          if (this.registerForm.isStudent) {
            registerStudent(dataToSend).then(async res => {
              // 处理成功逻辑（只检查code，不检查msg）
              if (res.code === 1) {
                this.loading = false;
                this.$message.success('注册成功，正在自动登录...');
                
                // 自动登录
                try {
                  const loginResponse = await login(this.registerForm.mobile, this.registerForm.password);
                  if (loginResponse.code === 1) {
                    const token = loginResponse.data;
                    setToken(token);
                    this.$store.commit('SET_TOKEN', token);
                    
                    // 【关键】注册后登录成功，先加载用户信息，确保用户信息可用
                    try {
                      await this.$store.dispatch('GetInfo');
                      console.log('注册后登录：用户信息加载成功');
                      
                      // 如果有classId，自动加入班级（用户信息已加载，此时可以安全调用加入班级接口）
                      if (this.classIdFromUrl) {
                        try {
                          const joinResponse = await loginAccountAndAttend(this.classIdFromUrl);
                          if (joinResponse.code === 1 || joinResponse.code === 200) {
                            this.$message.success(joinResponse.msg || '加入班级成功');
                          } else {
                            this.$message.warning(joinResponse.msg || '您已在该班级中');
                          }
                        } catch (error) {
                          console.error('加入班级失败:', error);
                          this.$message.warning('加入班级失败：' + (error.message || '未知错误'));
                        }
                      }
                      
                      // 跳转到首页
                      this.$router.push({ path: '/' });
                    } catch (error) {
                      console.error('注册后登录：加载用户信息失败:', error);
                      this.$message.error('注册成功，但加载用户信息失败：' + (error.message || '未知错误'));
                      // 即使加载用户信息失败，也尝试加入班级（可能用户信息已缓存）
                      if (this.classIdFromUrl) {
                        try {
                          await loginAccountAndAttend(this.classIdFromUrl);
                        } catch (joinError) {
                          console.error('注册后登录：加入班级失败:', joinError);
                        }
                      }
                      this.$router.push({ path: '/' });
                    }
                  } else {
                    this.$message.warning('注册成功，但自动登录失败，请手动登录');
                    if (this.classIdFromUrl) {
                      this.$router.push({ path: '/login', query: { classId: this.classIdFromUrl } });
                    } else {
                      this.$router.push("/login");
                    }
                  }
                } catch (error) {
                  console.error('自动登录失败:', error);
                  this.$message.warning('注册成功，但自动登录失败，请手动登录');
                  if (this.classIdFromUrl) {
                    this.$router.push({ path: '/login', query: { classId: this.classIdFromUrl } });
                  } else {
                this.$router.push("/login");
                  }
                }
              }
              else if (res.code === 0 && res.msg === '用户名已存在'){
                this.loading = false;
                this.$alert('<font color="red">学号 ' + this.registerForm.studentId + ' 已被注册，请检查学号是否正确。</font>', '系统提示', {
                  confirmButtonText: '确定',
                  type: 'warning',
                  dangerouslyUseHTMLString: true
                });
              }
              else if (res.code === 0 && res.msg === '手机号已被使用'){
                this.loading = false;
                this.$alert('<font color="red">手机号 ' + this.registerForm.mobile + ' 已被注册，请检查手机号是否正确，或尝试登录。</font>', '系统提示', {
                  confirmButtonText: '确定',
                  type: 'warning',
                  dangerouslyUseHTMLString: true
                });
              }
              else {
                this.loading = false;
                this.$message.error(res.msg || '注册失败');
              }
            }).catch((error) => {
              this.loading = false;
              this.$message.error('注册请求失败：' + (error.message || '网络错误'));
            });
          }
          else if (this.registerForm.isTeacher && this.registerForm.secretKey === 'yanjiangpingtaidy') {
            registerTeacher(dataToSend).then(async res => {
              if (res.code === 1) {
                this.loading = false;
                this.$message.success('注册成功，正在自动登录...');
                
                // 自动登录
                try {
                  const loginResponse = await login(this.registerForm.mobile, this.registerForm.password);
                  if (loginResponse.code === 1) {
                    const token = loginResponse.data;
                    setToken(token);
                    this.$store.commit('SET_TOKEN', token);
                    this.$router.push({ path: '/' });
                  } else {
                    this.$message.warning('注册成功，但自动登录失败，请手动登录');
                    this.$router.push("/login");
                  }
                } catch (error) {
                  console.error('自动登录失败:', error);
                  this.$message.warning('注册成功，但自动登录失败，请手动登录');
                this.$router.push("/login");
                }
              }
              else if (res.code === 0 && res.msg === '用户名已存在'){
                this.loading = false;
                this.$alert('<font color="red">学号 ' + this.registerForm.studentId + ' 已被注册，请检查学号是否正确。</font>', '系统提示', {
                  confirmButtonText: '确定',
                  type: 'warning',
                  dangerouslyUseHTMLString: true
                });
              }
              else if (res.code === 0 && res.msg === '手机号已被使用'){
                this.loading = false;
                this.$alert('<font color="red">手机号 ' + this.registerForm.mobile + ' 已被注册，请检查手机号是否正确，或尝试登录。</font>', '系统提示', {
                  confirmButtonText: '确定',
                  type: 'warning',
                  dangerouslyUseHTMLString: true
                });
              }
              else {
                this.loading = false;
                this.$message.error(res.msg || '注册失败');
              }
            }).catch((error) => {
              this.loading = false;
              this.$message.error('注册请求失败：' + (error.message || '网络错误'));
            });
          }
          else if (this.registerForm.isAdmin && this.registerForm.secretKey === 'yanjiangpingtaidy') {
            registerAdmin(dataToSend).then(async res => {
              if (res.code === 1) {
                this.loading = false;
                this.$message.success('注册成功，正在自动登录...');
                
                // 自动登录
                try {
                  const loginResponse = await login(this.registerForm.mobile, this.registerForm.password);
                  if (loginResponse.code === 1) {
                    const token = loginResponse.data;
                    setToken(token);
                    this.$store.commit('SET_TOKEN', token);
                    this.$router.push({ path: '/' });
                  } else {
                    this.$message.warning('注册成功，但自动登录失败，请手动登录');
                    this.$router.push("/login");
                  }
                } catch (error) {
                  console.error('自动登录失败:', error);
                  this.$message.warning('注册成功，但自动登录失败，请手动登录');
                this.$router.push("/login");
                }
              }
              else if (res.code === 0 && res.msg === '用户名已存在'){
                this.loading = false;
                this.$alert('<font color="red">学号 ' + this.registerForm.studentId + ' 已被注册，请检查学号是否正确。</font>', '系统提示', {
                  confirmButtonText: '确定',
                  type: 'warning',
                  dangerouslyUseHTMLString: true
                });
              }
              else if (res.code === 0 && res.msg === '手机号已被使用'){
                this.loading = false;
                this.$alert('<font color="red">手机号 ' + this.registerForm.mobile + ' 已被注册，请检查手机号是否正确，或尝试登录。</font>', '系统提示', {
                  confirmButtonText: '确定',
                  type: 'warning',
                  dangerouslyUseHTMLString: true
                });
              }
              else {
                this.loading = false;
                this.$message.error(res.msg || '注册失败');
              }
            }).catch((error) => {
              this.loading = false;
              this.$message.error('注册请求失败：' + (error.message || '网络错误'));
            });
          } else {
            this.$message.error("秘钥错误或角色未选择");
            this.loading = false;
          }

        }
      });
    }
  }
};
</script>

<style rel="stylesheet/scss" lang="scss">
.register {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-image: url("../assets/background.png");
  background-size: cover;
}
.register-container {
  position: relative;
  z-index: 2;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.3);
  width: 400px;
  min-height: 600px;
  height: auto;
}
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  filter: blur(2px);
  z-index: 1;
}
.title {
  color: #FFFFFF !important;
  text-align: center;
  margin-bottom: 30px;
  font-size: 24px;
  font-weight: 600;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8), 0 0 10px rgba(0, 0, 0, 0.5);
}
.el-input__icon input-icon , .select-custom {
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: #FFF;
  background-color: transparent;
  border-radius: 5px;
}

.input-icon {
  height: 20px;
  width: 20px;
  position: absolute;
  left: 5px;
  top: 50%;
  transform: translateY(-50%);
  color: #909399;
  z-index: 1;
}

/* 为带图标的输入框增加左侧内边距，确保文字不与图标重叠 */
.register-form .el-input--prefix .el-input__inner {
  padding-left: 42px;
}

/* 确保输入框前缀区域有足够的宽度 */
.register-form .el-input__prefix {
  left: 0;
  padding-left: 5px;
}
.register-tip {
  font-size: 13px;
  text-align: center;
  color: #bfbfbf;
}

.sexsex .el-form-item__label {
  color: #ffffff !important; /* 设置label的颜色为白色 */
}

.sexsex .el-radio {
  color: #ffffff; /* 设置label的颜色为白色 */
}

.sexsex .el-radio__label {
  color: #ffffff; /* 设置label的颜色为白色 */
}

/* 设置所有表单项的label为白色 */
.register-form .el-form-item__label {
  color: #ffffff !important;
}


.register-button {
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  border: none;
  color: #FFF;
  font-weight: bold;
  transition: all 0.3s;
  width: 100%;
}
.el-register-footer {
  text-align: center;
  color: #fff;
  width: 100%;
  font-size: 12px;
  margin-top: 20px;
}


</style>
