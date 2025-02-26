<template>
  <el-form ref="form" :model="form"  label-width="80px">
    <el-form-item label="用户昵称" prop="nickName">
      <el-tag style="font-size: 16px;">{{ user.nickName }}</el-tag>
    </el-form-item>
    <el-form-item label="手机号码" prop="phonenumber">
      <el-tag style="font-size: 16px;">{{ user.mobile }}</el-tag>
    </el-form-item>
    <el-form-item label="邮箱" prop="email">
      <el-tag style="font-size: 16px;">{{ user.userName }}</el-tag>
    </el-form-item>
    <el-form-item label="性别">
      <el-tag style="font-size: 16px;">{{ user.sex }}</el-tag>
<!--      <el-radio-group v-model="form.sex">-->
<!--        <el-radio label="0">男</el-radio>-->
<!--        <el-radio label="1">女</el-radio>-->
<!--      </el-radio-group>-->
    </el-form-item>
    <el-form-item>
      <el-button type="primary" size="mini" @click="submit">保存</el-button>
      <el-button type="danger" size="mini" @click="close">关闭</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import { updateUserProfile } from "@/api/system/user";

export default {
  props: {
    user: {
      type: Object
    }
  },
  data() {
    return {
      form: {

      },
    };
  },
  watch: {
    // user: {
    //   handler(user) {
    //     if (user) {
    //       this.form = { nickName: user.nickName, phonenumber: user.phonenumber, email: user.email, sex: user.sex };
    //     }
    //   },
    //   immediate: true
    // }
  },
  methods: {
    submit() {
      // this.$refs["form"].validate(valid => {
      //   if (valid) {
      //     updateUserProfile(this.form).then(response => {
      //       this.$modal.msgSuccess("修改成功");
      //       this.user.phonenumber = this.form.phonenumber;
      //       this.user.email = this.form.email;
      //     });
      //   }
      // });
    },
    close() {
      // this.$tab.closePage();
    }
  }
};
</script>
