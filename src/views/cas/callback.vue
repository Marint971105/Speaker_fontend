<template>
    <div class="cas-callback">
      <div class="loading">
        <i class="el-icon-loading"></i>
        <p>正在验证身份，请稍候...</p>
      </div>
    </div>
  </template>
  
  <script>
  import { updateMobileForCas } from '@/api/login';
  
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
        }).then((userInfo) => {
          // 【关键】从 sessionStorage 读取 classId（CAS场景专用）
          const classId = sessionStorage.getItem('pendingClassId');
          const pendingMobile = sessionStorage.getItem('pendingMobile');
          console.log('从 sessionStorage 读取 classId:', classId);
          console.log('从 sessionStorage 读取手机号:', pendingMobile);
          
          // 【关键】如果有待更新的手机号，且用户账户没有手机号或为空，则更新手机号
          if (pendingMobile) {
            // userInfo 是 GetInfo 返回的完整响应对象
            const user = userInfo?.data || userInfo;
            const userId = this.$store.getters.id || user?.userId;
            const currentMobile = user?.mobile;
            
            console.log('检查用户信息 - userId:', userId, 'currentMobile:', currentMobile);
            
            // CAS认证登录：允许覆盖现有手机号
            // 如果用户已有手机号且与新手机号不同，则覆盖更新
            if (!currentMobile || currentMobile === '' || currentMobile === 'null' || currentMobile !== pendingMobile) {
              if (currentMobile && currentMobile !== pendingMobile) {
                console.log('用户已有其他手机号，CAS认证登录允许覆盖更新:', currentMobile, '->', pendingMobile);
              } else {
                console.log('用户账户没有手机号，准备更新手机号:', pendingMobile);
              }
              return this.updateMobileForCas(userId, pendingMobile).then(() => {
                // 清除 sessionStorage（用完即删）
                sessionStorage.removeItem('pendingMobile');
                console.log('已清除 sessionStorage 中的手机号');
                
                // 继续处理 classId
                if (classId) {
                  return this.autoJoinClass(classId).then(() => {
                    sessionStorage.removeItem('pendingClassId');
                    console.log('已清除 sessionStorage 中的 classId');
                  });
                }
              }).catch(error => {
                console.error('更新手机号失败:', error);
                // 即使更新手机号失败，也清除 sessionStorage 并继续
                sessionStorage.removeItem('pendingMobile');
                if (classId) {
                  return this.autoJoinClass(classId).then(() => {
                    sessionStorage.removeItem('pendingClassId');
                  });
                }
              });
            } else {
              // 用户已有相同的手机号，清除 sessionStorage
              sessionStorage.removeItem('pendingMobile');
              console.log('用户已有相同的手机号，无需更新');
            }
          }
          
          if (classId) {
            // 有 classId，说明是扫码进班场景，自动加入班级
            console.log('检测到扫码进班场景，准备加入班级:', classId);
            return this.autoJoinClass(classId).then(() => {
              // 清除 sessionStorage（用完即删）
              sessionStorage.removeItem('pendingClassId');
              console.log('已清除 sessionStorage 中的 classId');
            });
          } else {
            // 没有 classId，正常CAS登录，跳转到首页
            this.$router.replace('/');
          }
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
    },
    methods: {
      /**
       * 更新用户手机号（CAS认证登录用，允许覆盖现有手机号）
       * 作用：CAS登录成功后，如果sessionStorage中有手机号，则更新手机号（允许覆盖）
       * @param {Number} userId - 用户ID
       * @param {String} mobile - 手机号
       */
      async updateMobileForCas(userId, mobile) {
        try {
          const response = await updateMobileForCas(userId, mobile);
          if (response.code === 1) {
            this.$message.success('手机号已更新');
            console.log('成功更新手机号:', mobile);
          } else {
            console.warn('更新手机号失败:', response.msg);
          }
        } catch (error) {
          console.error('更新手机号出错:', error);
          throw error;
        }
      },
      
      /**
       * 自动加入班级（CAS认证后的扫码进班）
       * 作用：CAS登录成功后，如果sessionStorage中有classId，自动加入班级
       * @param {String|Number} classId - 班级ID
       */
      async autoJoinClass(classId) {
        try {
          // 动态导入API函数
          const { loginAccountAndAttend } = await import('@/api/classManage/teacher/index');
          
          // 调用加入班级接口
          const response = await loginAccountAndAttend(classId);
          
          if (response.code === 1 || response.code === 200) {
            // 加入成功
            this.$message.success(response.msg || '加入班级成功');
            console.log('CAS登录后成功加入班级:', classId);
            
            // 跳转到首页或班级页面
            this.$router.replace('/');
          } else {
            // 加入失败
            this.$message.error(response.msg || '加入班级失败');
            console.error('加入班级失败:', response);
            
            // 即使加入失败，也跳转到首页
            this.$router.replace('/');
          }
        } catch (error) {
          console.error('加入班级出错:', error);
          this.$message.error('加入班级失败：' + (error.message || '网络错误'));
          
          // 出错也跳转到首页
          this.$router.replace('/');
        }
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