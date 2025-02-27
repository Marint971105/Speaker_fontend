// import { login, logout, getInfo } from '@/api/login'
import { login, getInfo } from '@/api/login'
import { getToken, setToken, removeToken } from '@/utils/auth'
import Vue from "vue";
import request from '@/utils/request'

const user = {
  state: {
    token: getToken(),
    id: '',
    name: '',
    avatar: '',
    roles: [],
    permissions: []
  },

  mutations: {
    SET_TOKEN: (state, token) => {
      state.token = token
    },
    SET_ID: (state, id) => {
      // console.log('Setting User ID:', id);
      state.id = id
    },
    SET_NAME: (state, name) => {
      state.name = name
    },
    SET_AVATAR: (state, avatar) => {
      state.avatar = avatar
    },
    SET_ROLES: (state, roles) => {
      state.roles = roles
    },
    SET_PERMISSIONS: (state, permissions) => {
      state.permissions = permissions
    }
  },

  actions: {
    // 登录
    Login({ commit }, userInfo) {

      const username = userInfo.username.trim()
      const password = userInfo.password
      // console.log(username,password)
      // const code = userInfo.code
      // const uuid = userInfo.uuid
      return new Promise((resolve, reject) => {
        login(username, password).then(res => {
          const { code, msg, data } = res;
          // console.log(code,msg,data)
          if (code === 1 && msg === 'success') {
            console.log('Login successful, token:', data);
            // 提取token
            const token = data;
            // 存储token到cookie
            setToken(token);
            // 更新Vuex中的state，存储token
            commit('SET_TOKEN', token);
            resolve();
          }
          // setToken(res.token)
          // console.log('Received token:', res.token);
          // commit('SET_TOKEN', res.token)
          // resolve()
          else {
            // 根据不同的错误消息进行处理
            if (msg === '用户不存在') {
              reject(new Error('用户不存在'));
              Vue.prototype.$message.error('用户不存在');
            } else if (msg === '密码错误') {
              reject(new Error('密码错误'));
              Vue.prototype.$message.error('密码错误');
            } else {
              // 其他错误情况
              reject(new Error(msg || '登录失败'));
              Vue.prototype.$message.error('登录失败');
            }
          }
        }).catch(error => {
          reject(error)
        })
      })
    },

    // 获取用户信息
    GetInfo({ commit, state }) {
      return new Promise((resolve, reject) => {
        getInfo().then(res => {
          const user = res.data
          const avatar = (user.avatar == "" || user.avatar == null) ? require("@/assets/images/loginbackground.jpg") : process.env.VUE_APP_BASE_API + user.avatar;
          // if (user.roleId && user.roleId.length > 0) { // 验证返回的roles是否是一个非空数组
          //   commit('SET_ROLES', user.roleId)
          //   commit('SET_PERMISSIONS', user.permissions)
          // } else {
          //   commit('SET_ROLES', ['ROLE_DEFAULT'])
          // }
          let roles = [];
          if (user.roleId === 1) {
            roles = ['admin'];
          } else if (user.roleId === 2) {
            roles = ['common'];
          } else {
            // 如果roleId不是1或2，可以设置默认角色或者根据实际情况处理
            roles = ['ROLE_DEFAULT'];
          }
          commit('SET_ROLES', roles)
          commit('SET_ID', user.userId)
          commit('SET_NAME', user.nickName)
          commit('SET_AVATAR', avatar)
          resolve(res)
        }).catch(error => {
          reject(error)
        })
      })
    },
    //CAS登录
    CasLogin({ commit }, { ticket }) {
      return new Promise((resolve, reject) => {
        request({
          url: `/login?ticket=${ticket}`,
          method: 'post'
        }).then(response => {
          if (response.code === 1) {  // 注意这里是 code === 1
            const token = response.data  // 直接使用返回的 token
            setToken(token)
            commit('SET_TOKEN', token)
            resolve()
          } else {
            reject(response.msg)
          }
        }).catch(error => {
          reject(error)
        })
      })
    },
    // 退出系统
    // LogOut({ commit, state }) {
    //   return new Promise((resolve, reject) => {
    //     logout(state.token).then(() => {
    //       commit('SET_TOKEN', '')
    //       commit('SET_ROLES', [])
    //
    //       commit('SET_PERMISSIONS', [])
    //       removeToken()
    //       resolve()
    //     }).catch(error => {
    //       reject(error)
    //     })
    //   })
    // },

    // 前端 登出
    FedLogOut({ commit }) {
      return new Promise(resolve => {
        commit('SET_TOKEN', '')
        removeToken()
        resolve()
      })
    }
  }
}

export default user
