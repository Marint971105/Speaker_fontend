<template>
    <div class="cas-callback">
      <div class="loading">
        <i class="el-icon-loading"></i>
        <p>正在验证身份，请稍候...</p>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'CasCallback',
    created() {
      // 获取ticket参数
      const ticket = this.$route.query.ticket
      
      console.log('CAS回调参数:', {
        ticket: ticket
      })

      if (ticket) {
        // 直接发送ticket给后端验证
        this.$store.dispatch('CasLogin', {
          ticket
        }).then(() => {
          // 认证成功后获取用户信息
          return this.$store.dispatch('GetInfo')
        }).then(() => {
          // 获取用户信息成功后跳转到首页
          this.$router.replace('/')
        }).catch(error => {
          console.error('CAS认证失败:', error)
          this.$message.error('认证失败：' + error)
          this.$router.push('/login')
        })
      } else {
        console.error('未获取到ticket参数')
        this.$message.error('未获取到认证信息')
        this.$router.push('/login')
      }
    }
  }
  </script>
  
  <style scoped>
  .cas-callback {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f5f5f5;
  }
  .loading {
    text-align: center;
  }
  .loading i {
    font-size: 32px;
    color: #409EFF;
  }
  .loading p {
    margin-top: 10px;
    color: #606266;
  }
  </style>