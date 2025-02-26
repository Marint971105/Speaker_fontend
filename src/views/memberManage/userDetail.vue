<template>
  <div class="user-detail-container">
   <h3 class="title">用户详情</h3>

    <el-form :model="userInfo" label-width="100px" class="user-info-form">
      <el-form-item label="学号" >
        <el-input v-model="userInfo.studentId" disabled style="width: 220px;" ></el-input>
      </el-form-item>
      <el-form-item label="姓名">
        <el-input v-model="userInfo.nickName" style="width: 220px;"></el-input>
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="userInfo.userName" disabled style="width: 220px;"></el-input>
      </el-form-item>
      <el-form-item label="手机号">
        <el-input v-model="userInfo.mobile" disabled  style="width: 220px;"></el-input>
      </el-form-item>
      <el-form-item label="学校">
        <el-input v-model="userInfo.school" style="width: 220px;"></el-input>
      </el-form-item>
      <el-form-item label="专业">
        <el-input v-model="userInfo.dept" disabled  style="width: 220px;"></el-input>
      </el-form-item>
      <el-form-item label="性别">
        <el-select v-model="userInfo.sex" disabled placeholder="请选择" style="width: 220px;">
          <el-option label="男" value="男"></el-option>
          <el-option label="女" value="女"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <div class="button-group">
      <el-button type="primary" @click="updateUserInfo">修改信息</el-button>
    </div>
    <h4 class="password-section-title">修改密码</h4>
    <el-form :model="{ newPassword }" label-width="100px" class="password-form">
      <el-form-item label="新密码">
        <el-input v-model="newPassword" placeholder="请输入新密码" style="width: 220px;"></el-input>
      </el-form-item>
    </el-form>
    <!-- 修改4：添加修改密码按钮，并使用突出样式 -->
    <div class="password-button-group">
      <el-button type="danger" @click="updatePassword" class="highlighted-password-button">修改密码</el-button>
    </div>

  </div>
</template>

<script>
import { updateUserInfo } from '@/api/memeberManage/member';
import {getUserProfile, updateUserPwd} from '@/api/system/user';

export default {
  data() {
    return {
      userInfo: {},
      newPassword: '' // 存储新密码
    };
  },
  created() {
    const userId = this.$route.query.userId; // 从路由参数获取 userId
    if (userId) {
      this.fetchUserInfo(userId);
    } else {
      console.error("userId 未定义，无法加载用户信息");
    }
  },
  methods: {
    async fetchUserInfo(userId) {
      try {
        const response = await getUserProfile(userId);
        if (response.code === 1) {
          this.userInfo = response.data;
        }
      } catch (error) {
        console.error("获取用户信息失败:", error);
      }
    },
    async updateUserInfo() {
      try {
        // console.log("this.userinfo:",this.userInfo)
        const updatedInfo = {
          nickName: this.userInfo.nickName,
          school: this.userInfo.school
        };
        const response = await updateUserInfo(this.userInfo.userId, updatedInfo);
        if (response.code === 1) {
          this.$message.success("用户信息更新成功");
        } else {
          this.$message.error(response.msg || "用户信息更新失败");
        }
      } catch (error) {
        console.error("更新用户信息失败:", error);
        this.$message.error("更新用户信息失败，请稍后再试");
      }
    },

    async updatePassword() {
      // console.log("this.newPassword",this.newPassword)
      if (!this.newPassword) {
        this.$message.error("请输入新密码");
        return;
      }
      try {
        const response = await updateUserPwd(this.userInfo.userId, ' ', this.newPassword);
        if (response.code === 0) { // 假设返回的 code 为 0 表示成功
          this.$message.success(response.msg || "密码更新成功");
          this.newPassword = ''; // 清空输入框
        } else {
          this.$message.error(response.msg || "密码更新失败");
        }
      } catch (error) {
        console.error("密码更新失败:", error);
        this.$message.error("密码更新失败，请稍后再试");
      }
    }





  }
};
</script>
<style>
.user-detail-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

/* 修改8：标题样式 */
.title {
  margin-bottom: 20px;
  margin-left: 40px;
  color: #000000;
}

.user-info-form {
  width: 300px;
  margin-bottom: 20px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  margin-left: 40px;
}

/* 修改9：新增密码部分标题样式 */
.password-section-title {
  margin-top: 20px;
  margin-left: 40px;
  font-weight: bold;
  font-size: 16px;
}

/* 修改10：修改密码按钮样式 */
.password-form {
  margin-left: 40px;
}

.password-button-group {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  margin-left: 40px;
}

.highlighted-password-button {
  background-color: #ff4d4f;
  color: white;
}

.highlighted-password-button:hover {
  background-color: #ff7875;
}
</style>
