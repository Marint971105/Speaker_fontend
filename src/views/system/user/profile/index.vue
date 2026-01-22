<template>
  <div class="app-container">
    <el-row :gutter="20">
      <el-col :span="6" :xs="24">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>个人信息</span>
          </div>
          <div>
            <div class="text-center">
              <userAvatar />
            </div>
            <ul class="list-group list-group-striped">
              <li class="list-group-item">
                <svg-icon icon-class="user" />用户名称
                <div class="pull-right">{{ user.nickName}}</div>
              </li>
              <li class="list-group-item">
                <svg-icon icon-class="phone" />手机号码
                <div class="pull-right">{{ user.mobile || '未设置' }}</div>
              </li>
              <li class="list-group-item">
                <svg-icon icon-class="email" />用户邮箱
                <div class="pull-right">{{ getEmailDisplay(user.userName) }}</div>
              </li>
              <li class="list-group-item">
                <svg-icon icon-class="tree" />学号
                <div class="pull-right" >{{user.studentId}}</div>
              </li>
              <li class="list-group-item">
                <svg-icon icon-class="peoples" />学校
                <div class="pull-right">{{ user.school }}</div>
              </li>
              <li class="list-group-item">
                <svg-icon icon-class="date" />专业
                <div class="pull-right">{{ user.dept }}</div>
              </li>
            </ul>
          </div>
        </el-card>
      </el-col>
      <el-col :span="18" :xs="24">
        <el-card>
          <div slot="header" class="clearfix">
            <span>基本资料</span>
          </div>
          <el-tabs v-model="activeTab">
            <el-tab-pane label="基本资料" name="userinfo">
              <userInfo :user="user" @update:user="handleUserUpdate" />
            </el-tab-pane>
            <el-tab-pane label="修改密码" name="resetPwd">
              <resetPwd :user="user"/>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import userAvatar from "./userAvatar";
import userInfo from "./userInfo";
import resetPwd from "./resetPwd";
import { getUserProfile } from "@/api/system/user";

export default {
  name: "Profile",
  components: { userAvatar, userInfo, resetPwd },
  data() {
    return {
      user: {},
      roleGroup: {},
      postGroup: {},
      activeTab: "userinfo"
    };
  },
  computed: {
    userId() {
      return this.$store.getters.userId;
    }
  },
  created() {
    this.getUser();
  },
  methods: {
    getUser() {
      const userId = this.userId;
      // console.log('userId:', userId);
      return getUserProfile(userId).then(response => {
        this.user = response.data;
        // this.roleGroup = response.roleGroup;
        // this.postGroup = response.postGroup;
      });
    },
    handleUserUpdate(updatedUser) {
      // 当用户信息更新后，刷新显示
      this.user = { ...updatedUser };
      // 重新获取用户信息，确保数据同步
      this.getUser().then(() => {
        // 检查用户信息是否完整
        this.$nextTick(() => {
          this.checkUserInfoComplete();
        });
      });
    },
    // 判断userName是否是邮箱格式，如果是则显示，否则显示"未设置"
    getEmailDisplay(userName) {
      if (!userName || userName.trim() === '') {
        return '未设置';
      }
      // 判断是否是邮箱格式（包含@符号）
      if (userName.includes('@')) {
        return userName;
      }
      // 如果不是邮箱格式（可能是手机号或学号），显示"未设置"
      return '未设置';
    },
  }
};
</script>

