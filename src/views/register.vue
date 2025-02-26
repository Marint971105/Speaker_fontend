<template>
  <div class="register">
    <div class="overlay"></div>
    <div class="register-container">
    <el-form ref="registerForm" :model="registerForm" :rules="registerRules" class="register-form">
      <h3 class="title">北京邮电大学多模态英语教学与评估平台</h3>
      <el-form-item prop="username">
        <el-input v-model="registerForm.username" type="text" auto-complete="off" placeholder="邮箱">
          <svg-icon slot="prefix" icon-class="email" class="el-input__icon input-icon" />
        </el-input>
      </el-form-item>
      <el-form-item prop="nickname">
        <el-input v-model="registerForm.nickname" type="text" auto-complete="off" placeholder="昵称">
          <svg-icon slot="prefix" icon-class="user" class="el-input__icon input-icon" />
        </el-input>
      </el-form-item>
      <el-form-item prop="mobile">
        <el-input v-model="registerForm.mobile" type="text" auto-complete="off" placeholder="手机号">
          <svg-icon slot="prefix" icon-class="phone" class="el-input__icon input-icon" />
        </el-input>
      </el-form-item>
      <el-form-item prop="studentId">
        <el-input v-model="registerForm.studentId" type="text" auto-complete="off" placeholder="学号">
          <svg-icon slot="prefix" icon-class="tree" class="el-input__icon input-icon" />
        </el-input>
      </el-form-item>
      <el-form-item prop="classAndMajor">
        <el-row>
          <el-col :span="12">
            <el-select v-model="registerForm.school" class="select-custom" placeholder="请选择学校">
            <el-option
              v-for="item in schools"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </el-option>
            </el-select>
          </el-col>
          <el-col :span="12">
            <el-select v-model="registerForm.classId" class="select-custom" placeholder="请选择班级">
              <el-option
                v-for="item in classIds"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
          </el-col>
        </el-row>
      </el-form-item>
      <el-form-item prop="deptAndschool">
        <el-row>
          <el-col :span="12">
            <el-select v-model="registerForm.major"  class="select-custom" placeholder="请选择系">
              <el-option
                v-for="item in majors"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
          </el-col>
          <el-col :span="12">
            <el-select v-model="registerForm.dept" class="select-custom" placeholder="请选择专业">
              <el-option
                v-for="item in depts"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
          </el-col>
        </el-row>
      </el-form-item>
      <el-form-item label="性别: " prop="gender" class="sexsex">
        <el-radio-group v-model="registerForm.sex">
          <el-radio label="男">男</el-radio>
          <el-radio label="女">女</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="registerForm.password"
          type="password"
          auto-complete="off"
          placeholder="密码"
          @keyup.enter.native="handleRegister"
        >
          <svg-icon slot="prefix" icon-class="password" class="el-input__icon input-icon" />
        </el-input>
      </el-form-item>
      <el-form-item prop="confirmPassword">
        <el-input
          v-model="registerForm.confirmPassword"
          type="password"
          auto-complete="off"
          placeholder="确认密码"
          @keyup.enter.native="handleRegister"
        >
          <svg-icon slot="prefix" icon-class="password" class="el-input__icon input-icon" />
        </el-input>
      </el-form-item>
      <el-form-item prop="secretKey">
        <el-input
          v-model="registerForm.secretKey"
          type="password"
          auto-complete="off"
          placeholder="秘钥（教师/管理员）"
        >
          <svg-icon slot="prefix" icon-class="lock" class="el-input__icon input-icon" />
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-checkbox v-model="registerForm.isStudent" :disabled="registerForm.isTeacher || registerForm.isAdmin">注册为学生</el-checkbox>
        <el-checkbox v-model="registerForm.isTeacher" :disabled="registerForm.secretKey !== '123' || registerForm.isStudent || registerForm.isAdmin">注册为教师</el-checkbox>
        <el-checkbox v-model="registerForm.isAdmin" :disabled="registerForm.secretKey !== '123'|| registerForm.isStudent || registerForm.isTeacher">注册为管理员</el-checkbox>
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
          <router-link class="link-type" :to="'/login'">使用已有账户登录</router-link>
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
import { registerStudent,registerTeacher,registerAdmin } from "@/api/login";

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
        username: "",
        nickname:"",
        mobile:"",
        studentId:"",
        classId:"",
        major:"",
        dept:"",
        school:"",
        sex:"",
        password: "",
        confirmPassword: "",
        secretKey: "", // 秘钥输入
        isStudent: true, // 是否选择注册为学生
        isTeacher: false, // 是否选择注册为教师
        isAdmin: false, // 是否选择注册为管理员
      },
      classIds:[{value: '英语演讲1班', label: '英语演讲1班'},{value: '英语演讲2班', label: '英语演讲2班'}],
      majors:[{value: '计算机技术', label: '计算机技术'}],
      depts:[{value: '计算机科学与技术', label: '计算机科学与技术'}],
      schools:[{value: 'BUPT', label: 'BUPT'}],

      registerRules: {
        username:  [
          { required: true, trigger: "blur", message: "请输入您的邮箱" },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] },
          { min: 2, max: 20, message: '邮箱长度必须介于 2 和 20 之间', trigger: 'blur' }
        ],
        nickName: [
          { required: true, trigger: "blur", message: "请输入您的昵称" },
          { min: 2, max: 20, message: '用户账号长度必须介于 2 和 20 之间', trigger: 'blur' }
        ],
        mobile: [
          { required: true, trigger: "blur", message: "请输入您的手机号" },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: ['blur', 'change'] },
        ],
        studentId: [
          { required: true, trigger: "blur", message: "请输入您的学号" },
          { pattern: /^\d{6,12}$/, message: '学号应为6到12位数字', trigger: ['blur', 'change'] },
        ],
        //下拉菜单
        major: [
          { required: true, trigger: "change", message: "请选择专业" }
        ],
        dept: [
          { required: true, trigger: "change", message: "请选择系" }
        ],
        school: [
          { required: true, trigger: "change", message: "请选择学校" }
        ],
        classId: [
          { required: true, trigger: "change", message: "请选择班级" }
        ],
        sex: [
          { required: true, message: "请选择性别", trigger: "change" }
        ],
        //
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
          { required: true, message: "请输入秘钥", trigger: "blur" }
        ]
      },
      loading: false,

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
  methods: {
    handleRegister() {
      this.$refs.registerForm.validate(valid => {
        if (valid) {
          this.loading = true;
          // 根据角色调用不同的注册接口
          let dataToSend = new URLSearchParams({
            userName: this.registerForm.username,
            nickName: this.registerForm.nickname,
            mobile: this.registerForm.mobile,
            studentId: this.registerForm.studentId,
            classId: this.registerForm.classId,
            major: this.registerForm.major,
            dept: this.registerForm.dept,
            school: this.registerForm.school,
            sex: this.registerForm.sex,
            password: this.registerForm.password,
          }).toString();
          console.log('datatosend',dataToSend)

          if (this.registerForm.isStudent) {
            registerStudent(dataToSend).then(res => {
              // 处理成功逻辑
              if (res.code === 1 && res.msg === 'success'){ this.$alert("<font color='red'>恭喜你，您的学生账号 " + this.registerForm.username + " 注册成功！</font>", '系统提示', {
                dangerouslyUseHTMLString: true,
                type: 'success'
              }).then(() => {
                this.$router.push("/login");
              }) }
              else if (res.code === 0 &&res.msg==='用户名已存在!'){
                this.$alert('<font color="red">用户名 ' + this.registerForm.username + ' 已存在，请选择其他用户名。</font>', '系统提示', {
                  confirmButtonText: '确定',
                  type: 'warning',
                  dangerouslyUseHTMLString: true
                })
              }
              else {
                this.$message.error(res.msg || '注册失败');
              }
            }).catch(() => {
              this.loading = false;
            });
          }
          else if (this.registerForm.isTeacher && this.registerForm.secretKey === '123') {
            registerTeacher(dataToSend).then(res => {
              // 处理成功逻辑
              if (res.code === 1 && res.msg === 'success'){ this.$alert("<font color='red'>恭喜你，您的教师账号 " + this.registerForm.username + " 注册成功！</font>", '系统提示', {
                dangerouslyUseHTMLString: true,
                type: 'success'
              }).then(() => {
                this.$router.push("/login");
              }) }
              else if (res.code === 0 &&res.msg==='用户名已存在!'){
                this.$alert('<font color="red">用户名 ' + this.registerForm.username + ' 已存在，请选择其他用户名。</font>', '系统提示', {
                  confirmButtonText: '确定',
                  type: 'warning',
                  dangerouslyUseHTMLString: true
                })
              }
              else {
                this.$message.error(res.msg || '注册失败');
              }
            }).catch(() => {
              this.loading = false;
            });
          }
          else if (this.registerForm.isAdmin && this.registerForm.secretKey === '123') {
            registerAdmin(dataToSend).then(res => {
              // 处理成功逻辑
              if (res.code === 1 && res.msg === 'success'){ this.$alert("<font color='red'>恭喜你，您的管理员账号 " + this.registerForm.username + " 注册成功！</font>", '系统提示', {
                dangerouslyUseHTMLString: true,
                type: 'success'
              }).then(() => {
                this.$router.push("/login");
              }) }
              else if (res.code === 0 &&res.msg==='用户名已存在!'){
                this.$alert('<font color="red">用户名 ' + this.registerForm.username + ' 已存在，请选择其他用户名。</font>', '系统提示', {
                  confirmButtonText: '确定',
                  type: 'warning',
                  dangerouslyUseHTMLString: true
                })
              }
              else {
                this.$message.error(res.msg || '注册失败');
              }
            }).catch(() => {
              this.loading = false;
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
  background-image: url("../assets/images/registerbackground2.jpg");
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
  height: 900px;
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
  color: #FFF;
  text-align: center;
  margin-bottom: 30px;
  font-size: 24px;
  font-weight: 600;
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.4);
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
  left: 10px;
  top: 8px;
  color: #909399;
}
.register-tip {
  font-size: 13px;
  text-align: center;
  color: #bfbfbf;
}

.sex .el-radio {
  color: #ffffff; /* 设置label的颜色为白色 */
}

.sex .el-radio__label {
  color: #ffffff; /* 设置label的颜色为白色 */
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
