<template>
  <div class="login">
    <div class="overlay"></div> <!-- 添加这一行 -->
    <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="login-form">
<!--      <h3 class="title">言之"邮"理</h3>-->
<!--      <h3 class="title">研究生演讲能力智能评价系统</h3>-->
      <img src="@/assets/logo/logo4.png" alt="Utalk Logo" class="logo-img">
      <el-form-item prop="username">
        <el-input
          v-model="loginForm.username"
          type="text"
          auto-complete="off"
          placeholder="账号"
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
<!--      <el-form-item prop="code" v-if="captchaEnabled">-->
<!--        <el-input-->
<!--          v-model="loginForm.code"-->
<!--          auto-complete="off"-->
<!--          placeholder="验证码"-->
<!--          style="width: 63%"-->
<!--          @keyup.enter.native="handleLogin"-->
<!--        >-->
<!--          <svg-icon slot="prefix" icon-class="validCode" class="el-input__icon input-icon" />-->
<!--        </el-input>-->
<!--        <div class="login-code">-->
<!--          <img :src="codeUrl" @click="getCode" class="login-code-img"/>-->
<!--        </div>-->
<!--      </el-form-item>-->
      <el-checkbox v-model="loginForm.rememberMe" style="margin:0px 0px 25px 0px;" class="checkbox-custom" >记住密码</el-checkbox>
      <el-form-item style="width:100%;">
        <el-button
          :loading="loading"
          size="medium"
          type="primary"
          style="width:100%;"
          @click.native.prevent="handleLogin"
          class="login-button"
        >
          <span v-if="!loading">登 录</span>
          <span v-else>登 录 中...</span>
        </el-button>
        <!-- 添加统一认证按钮 -->
        <el-button
          size="medium"
          type="primary"
          style="width:100%; margin-top: 15px;"
          @click="handleCasLogin"
          class="login-button cas-button"
        >
          统一认证登录
        </el-button>
        <div style="float: right;" v-if="register">
          <router-link class="link-type" :to="'/register'">立即注册</router-link>
        </div>
      </el-form-item>
    </el-form>
    <!--  底部  -->
  </div>

</template>

<script>
// import { getCodeImg } from "@/api/login";
import Cookies from "js-cookie";
import { encrypt, decrypt } from '@/utils/jsencrypt'

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
          { required: true, trigger: "blur", message: "请输入您的账号" }
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
      redirect: undefined
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
            console.log("Redirecting to: ", this.redirect || "/");
            this.$router.push({ path: this.redirect || "/" }).catch(err => console.error(err));
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
      const serviceUrl = rfc2396Encode('http://123.56.183.160:8081/cas/callback')
      
      console.log('编码前service:', 'http://123.56.183.160:8081/cas/callback')
      console.log('编码后service:', serviceUrl)
      window.location.href = `${casLoginUrl}?service=${serviceUrl}`
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
  align-items: flex-end;
  //height: 100vh;
  background-image: url("../assets/buptshitang.jpg");
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;  /* 设置宽度100%，高度100vh */
  font-family: 'Poppins', sans-serif;
  position: relative;
  padding-right: 15%;
  min-height: 100vh; // 添加最小高度
  height: auto; // 允许高度自适应
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
.login-form {
  position: relative; /* 保证模糊层叠加在正确位置 */
  z-index: 2;
  background: #ffffff;  /* 纯白色背景 */ /* 添加透明背景 */
  //backdrop-filter: blur(5px); /* 背景模糊 */
  padding: 3rem;
  border-radius: 8px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.2); /* 添加阴影效果 */
  //width: 500px; /* 调整宽度 */
  width: min(500px, 90%); // 使用min函数,最大500px,最小90%视窗宽度
  max-width: 500px; // 设置最大宽度
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
  height: 3rem;  /* 增加输入框高度 */
  font-size: 1rem;  /* 适当增加字体大小 */
  padding-left: 3rem;  /* 给图标留出足够空间 */
  line-height: 45px;
}

.input-custom .el-input__inner::placeholder {
  color: #909399;
}

.checkbox-custom {
  color: #606266;
  margin:  1rem 0 2rem 0;  /* 调整复选框上下间距 */
  font-size: 1rem;

}

.login-button {
  background: linear-gradient(135deg, #8BB174, #0072BD);  /* 修改为BUPT标志的绿色到蓝色渐变 */
  border: none;
  color: #FFF;
  font-weight: bold;
  transition: all 0.3s;
  width: 100%;
  margin:  1rem 0 2rem 0;  /* 调整复选框上下间距 */
  font-size: 1rem;

}

.login-button:hover {
  background: linear-gradient(135deg, #0072BD, #8BB174);  /* 悬停时反转渐变方向 */
  transform: scale(1.05); /* 悬停时放大效果 */
}

/* 调整图标容器位置 */
.el-input__prefix {
  display: flex;
  align-items: center;
  height: 100%;
}
.input-icon {
  height: 100%;
  width: 20px;  /* 设置合适的图标宽度 */
  margin-left: 8px;  /* 给图标左边留出一些空间 */
  vertical-align: middle;
  display: flex;
  align-items: center;
}

.el-input__icon {
  line-height: 45px;  /* 与输入框高度相同 */
  height: 45px;
}

/* 调整svg图标容器 */
.svg-icon {
  height: 20px;
  width: 20px;
  vertical-align: middle;
}
.logo-img {
  width: 100%;  /* 可以根据需要调整宽度 */
  margin: 0 auto 2rem;  /* 上0 左右auto居中 下40px */
  display: block;  /* 块级元素以便使用margin auto居中 */
}

.cas-button {
  background: linear-gradient(135deg, #0072BD, #8BB174) !important;  // 可以稍微改变渐变方向区分两个按钮
  
  &:hover {
    background: linear-gradient(135deg, #8BB174, #0072BD) !important;
    transform: scale(1.05);
  }
}
</style>
