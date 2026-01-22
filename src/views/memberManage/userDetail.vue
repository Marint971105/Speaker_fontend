<template>
  <div class="user-detail-container">
   <h3 class="title">用户详情</h3>

    <el-form :model="userInfo" label-width="100px" class="user-info-form">
      <el-form-item label="学号" >
        <el-input v-model="userInfo.studentId" style="width: 300px;" ></el-input>
      </el-form-item>
      <el-form-item label="姓名">
        <el-input v-model="userInfo.nickName" style="width: 300px;"></el-input>
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="userInfo.userName" style="width: 300px;"></el-input>
      </el-form-item>
      <el-form-item label="手机号">
        <el-input v-model="userInfo.mobile" style="width: 300px;"></el-input>
      </el-form-item>
      <el-form-item label="学校">
        <el-cascader
          ref="schoolCascader"
          v-model="schoolCascaderValue"
          :options="cascaderOptions"
          :props="cascaderProps"
          placeholder="请选择学校"
          filterable
          :filter-method="filterSchool"
          style="width: 300px;"
          @change="handleSchoolChange"
          clearable
          :show-all-levels="false"
        />
      </el-form-item>
      <el-form-item label="专业">
        <el-cascader
          ref="majorCascader"
          v-model="majorCascaderValue"
          :options="majorCascaderOptions"
          :props="majorCascaderProps"
          placeholder="请选择专业"
          filterable
          :filter-method="filterMajor"
          style="width: 300px;"
          @change="handleMajorChange"
          clearable
          :show-all-levels="false"
        />
      </el-form-item>
      <el-form-item label="院系">
        <el-input v-model="userInfo.dept" style="width: 300px;"></el-input>
      </el-form-item>
      <el-form-item label="性别">
        <el-select v-model="userInfo.sex" placeholder="请选择" style="width: 300px;">
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
import {getUserProfile, updateUserPwd, resetPasswordByAdmin} from '@/api/system/user';
import cascaderData from "@/utils/schoolCascaderData.json";
import majorCascaderData from "@/utils/majorCascaderData.json";

export default {
  data() {
    return {
      userInfo: {},
      newPassword: '', // 存储新密码
      schoolCascaderValue: [], // 学校级联选择器的值
      cascaderOptions: cascaderData, // 学校级联选择器的选项
      cascaderProps: {
        value: 'value',
        label: 'label',
        children: 'children',
        expandTrigger: 'hover',
        emitPath: true
      },
      isInitializing: false, // 标记是否正在初始化学校
      majorCascaderValue: [], // 专业级联选择器的值
      majorCascaderOptions: majorCascaderData, // 专业级联选择器的选项
      majorCascaderProps: {
        value: 'value',
        label: 'label',
        children: 'children',
        expandTrigger: 'hover',
        emitPath: true
      },
      isMajorInitializing: false // 标记是否正在初始化专业
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
          // 初始化学校级联选择器
          this.isInitializing = true;
          this.$nextTick(() => {
            if (this.userInfo.school) {
              this.initSchoolCascaderValue(this.userInfo.school);
            } else {
              this.schoolCascaderValue = [];
            }
            this.$nextTick(() => {
              this.isInitializing = false;
            });
          });
          // 初始化专业级联选择器
          this.isMajorInitializing = true;
          this.$nextTick(() => {
            if (this.userInfo.major) {
              this.initMajorCascaderValue(this.userInfo.major);
            } else {
              this.majorCascaderValue = [];
            }
            this.$nextTick(() => {
              this.isMajorInitializing = false;
            });
          });
        }
      } catch (error) {
        console.error("获取用户信息失败:", error);
      }
    },
    
    // 初始化学校级联选择器的值
    initSchoolCascaderValue(schoolName) {
      if (!schoolName) {
        this.schoolCascaderValue = [];
        return;
      }
      for (const province of this.cascaderOptions) {
        const school = province.children.find(s => s.value === schoolName);
        if (school) {
          this.schoolCascaderValue = [province.value, school.value];
          return;
        }
      }
      this.schoolCascaderValue = [];
    },
    
    // 处理学校选择变化
    handleSchoolChange(value) {
      if (this.isInitializing) {
        if (value && value.length === 2) {
          this.userInfo.school = value[1];
        }
        return;
      }
      if (value && value.length === 2) {
        this.userInfo.school = value[1];
        this.$nextTick(() => {
          this.updateCascaderDisplay();
        });
      } else {
        this.userInfo.school = '';
      }
    },
    
    // 更新学校级联选择器的显示文本
    updateCascaderDisplay() {
      if (this.schoolCascaderValue.length === 2) {
        const schoolName = this.schoolCascaderValue[1];
        setTimeout(() => {
          const cascaderEl = this.$refs.schoolCascader.$el;
          if (cascaderEl) {
            const inputEl = cascaderEl.querySelector('.el-input__inner');
            if (inputEl && inputEl.value !== schoolName) {
              inputEl.value = schoolName;
            }
          }
        }, 100);
      }
    },
    
    // 自定义学校过滤方法
    filterSchool(node, keyword) {
      const { value, label } = node;
      const lowerKeyword = keyword.toLowerCase();
      const lowerLabel = label.toLowerCase();
      if (!node.children || node.children.length === 0) {
        return lowerLabel.includes(lowerKeyword);
      }
      if (lowerLabel.includes(lowerKeyword)) {
        return true;
      }
      if (node.children) {
        return node.children.some(child => 
          child.label.toLowerCase().includes(lowerKeyword)
        );
      }
      return false;
    },
    
    // 初始化专业级联选择器的值
    initMajorCascaderValue(majorName) {
      if (!majorName) {
        this.majorCascaderValue = [];
        return;
      }
      for (const discipline of this.majorCascaderOptions) {
        for (const firstLevel of discipline.children) {
          const major = firstLevel.children.find(m => m.value === majorName);
          if (major) {
            this.majorCascaderValue = [discipline.value, firstLevel.value, major.value];
            return;
          }
        }
      }
      this.majorCascaderValue = [];
    },
    
    // 处理专业选择变化
    handleMajorChange(value) {
      if (this.isMajorInitializing) {
        if (value && value.length === 3) {
          this.userInfo.major = value[2];
        }
        return;
      }
      if (value && value.length === 3) {
        this.userInfo.major = value[2];
        this.$nextTick(() => {
          this.updateMajorCascaderDisplay();
        });
      } else {
        this.userInfo.major = '';
      }
    },
    
    // 更新专业级联选择器的显示文本
    updateMajorCascaderDisplay() {
      if (this.majorCascaderValue.length === 3) {
        const majorName = this.majorCascaderValue[2];
        setTimeout(() => {
          const cascaderEl = this.$refs.majorCascader.$el;
          if (cascaderEl) {
            const inputEl = cascaderEl.querySelector('.el-input__inner');
            if (inputEl && inputEl.value !== majorName) {
              inputEl.value = majorName;
            }
          }
        }, 100);
      }
    },
    
    // 自定义专业过滤方法
    filterMajor(node, keyword) {
      const { value, label } = node;
      const lowerKeyword = keyword.toLowerCase();
      const lowerLabel = label.toLowerCase();
      if (!node.children || node.children.length === 0) {
        return lowerLabel.includes(lowerKeyword);
      }
      if (lowerLabel.includes(lowerKeyword)) {
        return true;
      }
      if (node.children) {
        return node.children.some(child => {
          if (child.children) {
            return child.children.some(grandchild => 
              grandchild.label.toLowerCase().includes(lowerKeyword)
            ) || child.label.toLowerCase().includes(lowerKeyword);
          }
          return child.label.toLowerCase().includes(lowerKeyword);
        });
      }
      return false;
    },
    async updateUserInfo() {
      try {
        // 构建更新信息对象，包含所有可编辑字段
        const updatedInfo = {
          studentId: this.userInfo.studentId,
          nickName: this.userInfo.nickName,
          userName: this.userInfo.userName,
          mobile: this.userInfo.mobile,
          school: this.userInfo.school,
          major: this.userInfo.major,
          dept: this.userInfo.dept,
          sex: this.userInfo.sex
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
        // 使用管理员重置密码接口（不需要旧密码验证）
        const response = await resetPasswordByAdmin(this.userInfo.userId, this.newPassword);
        // 判断是否成功：code === 1 表示成功（与Result类定义一致）
        if (response.code === 1) {
          this.$message.success(response.msg || "密码重置成功");
          this.newPassword = ''; // 清空输入框
        } else {
          this.$message.error(response.msg || "密码重置失败");
        }
      } catch (error) {
        console.error("密码重置失败:", error);
        this.$message.error("密码重置失败，请稍后再试");
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
