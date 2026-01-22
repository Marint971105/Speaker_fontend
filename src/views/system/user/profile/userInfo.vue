<template>
  <el-form ref="form" :model="form" :rules="rules" label-width="100px">
    <el-form-item label="用户昵称" prop="nickName" required>
      <el-input v-model="form.nickName" placeholder="请输入用户昵称" style="width: 300px;" />
    </el-form-item>
    <el-form-item label="手机号码" prop="mobile" required>
      <el-input v-model="form.mobile" placeholder="请输入手机号码" style="width: 300px;" />
    </el-form-item>
    <el-form-item label="邮箱" prop="userName" required>
      <el-input v-model="form.userName" placeholder="请输入邮箱" style="width: 300px;" />
      <div style="color: #909399; font-size: 12px; margin-top: 5px;">邮箱用于找回密码等</div>
    </el-form-item>
    <el-form-item label="学号" prop="studentId" required>
      <el-input v-model="form.studentId" placeholder="请输入学号" style="width: 300px;" />
    </el-form-item>
    <el-form-item label="学校" prop="school" required>
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
      <div style="color: #909399; font-size: 12px; margin-top: 5px;">
        提示：可以选择学校；也可以直接搜索学校名称
      </div>
    </el-form-item>
    <el-form-item label="专业" prop="major" required>
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
      <div style="color: #909399; font-size: 12px; margin-top: 5px;">
        提示：可以选择专业；也可以直接搜索专业名称
      </div>
    </el-form-item>
    <el-form-item label="院系" prop="dept" required>
      <el-input v-model="form.dept" placeholder="请输入院系" style="width: 300px;" />
    </el-form-item>
    <el-form-item label="性别" prop="sex" required>
      <el-select v-model="form.sex" placeholder="请选择性别" style="width: 300px;">
        <el-option label="男" value="男"></el-option>
        <el-option label="女" value="女"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" size="small" @click="submit" :loading="loading">保存</el-button>
      <el-button size="small" @click="reset">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import { updateUserInfo } from "@/api/memeberManage/member";
import cascaderData from "@/utils/schoolCascaderData.json";
import majorCascaderData from "@/utils/majorCascaderData.json";

export default {
  props: {
    user: {
      type: Object
    }
  },
  data() {
    // 邮箱验证规则
    const validateEmail = (rule, value, callback) => {
      if (!value || value.trim() === '') {
        callback(new Error('请输入邮箱'));
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          callback(new Error('请输入正确的邮箱格式'));
        } else {
          callback();
        }
      }
    };
    
    return {
      form: {
        nickName: '',
        mobile: '',
        userName: '',
        studentId: '',
        school: '',
        major: '',
        dept: '',
        sex: ''
      },
      schoolCascaderValue: [], // 级联选择器的值 [省份, 学校]
      cascaderOptions: cascaderData, // 级联选择器的选项
      cascaderProps: {
        value: 'value',
        label: 'label',
        children: 'children',
        expandTrigger: 'hover',
        emitPath: true // 返回完整路径
      },
      isInitializing: false, // 标记是否正在初始化，避免初始化时触发 change 事件清空数据
      majorCascaderValue: [], // 专业级联选择器的值 [学科门类, 一级学科, 二级学科]
      majorCascaderOptions: majorCascaderData, // 专业级联选择器的选项
      majorCascaderProps: {
        value: 'value',
        label: 'label',
        children: 'children',
        expandTrigger: 'hover',
        emitPath: true // 返回完整路径
      },
      isMajorInitializing: false, // 标记专业是否正在初始化
      rules: {
        nickName: [
          { required: true, message: '请输入用户昵称', trigger: 'blur' },
          { min: 2, max: 20, message: '昵称长度必须介于 2 和 20 之间', trigger: 'blur' }
        ],
        userName: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { validator: validateEmail, trigger: 'blur' }
        ],
        mobile: [
          { required: true, message: '请输入手机号码', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
        ],
        studentId: [
          { required: true, message: '请输入学号', trigger: 'blur' },
          { pattern: /^\d{6,12}$/, message: '学号应为6到12位数字', trigger: 'blur' }
        ],
        school: [
          { required: true, message: '请选择学校', trigger: 'change' }
        ],
        major: [
          { required: true, message: '请选择专业', trigger: 'change' }
        ],
        dept: [
          { required: true, message: '请输入院系', trigger: 'blur' }
        ],
        sex: [
          { required: true, message: '请选择性别', trigger: 'change' }
        ]
      },
      loading: false
    };
  },
  watch: {
    user: {
      handler(user, oldUser) {
        // 只有当 user 对象存在且有实际数据时才处理
        if (user && typeof user === 'object') {
          // 检查 user 对象是否有实际数据（至少有一个非空字段）
          const hasData = user.nickName || user.userName || user.studentId || user.school || 
                         user.major || user.dept || user.sex || user.mobile;
          
          // 只有当 user 有实际数据时才更新 form
          if (hasData) {
            // 检查是否是第一次加载（oldUser 为空或没有数据）
            const oldHasData = oldUser && typeof oldUser === 'object' && 
                             (oldUser.nickName || oldUser.userName || oldUser.studentId || 
                              oldUser.school || oldUser.major || oldUser.dept || 
                              oldUser.sex || oldUser.mobile);
            const isFirstLoad = !oldUser || !oldHasData;
            
            // 如果是第一次加载，直接设置所有字段
            if (isFirstLoad) {
          this.form = {
            nickName: user.nickName || '',
            mobile: user.mobile || '',
            userName: user.userName || '',
            studentId: user.studentId || '',
            school: user.school || '',
            major: user.major || '',
            dept: user.dept || '',
            sex: user.sex || ''
          };
            } else {
              // 不是第一次加载，只更新 user 中存在的字段，保留 form 中已有的值
              if (user.nickName !== undefined) this.form.nickName = user.nickName || '';
              if (user.mobile !== undefined) this.form.mobile = user.mobile || '';
              if (user.userName !== undefined) this.form.userName = user.userName || '';
              if (user.studentId !== undefined) this.form.studentId = user.studentId || '';
              if (user.school !== undefined) this.form.school = user.school || '';
              if (user.major !== undefined) this.form.major = user.major || '';
              if (user.dept !== undefined) this.form.dept = user.dept || '';
              if (user.sex !== undefined) this.form.sex = user.sex || '';
            }
            
            // 初始化学校级联选择器的值（确保级联选择器数据已加载）
            this.isInitializing = true; // 标记正在初始化
            this.$nextTick(() => {
              if (user.school) {
                this.initSchoolCascaderValue(user.school);
              } else {
                this.schoolCascaderValue = [];
              }
              // 初始化完成后，取消标记
              this.$nextTick(() => {
                this.isInitializing = false;
              });
            });
            
            // 初始化专业级联选择器的值
            this.isMajorInitializing = true; // 标记正在初始化
            this.$nextTick(() => {
              if (user.major) {
                this.initMajorCascaderValue(user.major);
              } else {
                this.majorCascaderValue = [];
              }
              // 初始化完成后，取消标记
              this.$nextTick(() => {
                this.isMajorInitializing = false;
              });
            });
          }
        }
      },
      immediate: true,
      deep: false // 改为 false，避免深度监听导致的频繁更新
    }
  },
  methods: {
    // 初始化级联选择器的值（根据学校名称）
    initSchoolCascaderValue(schoolName) {
      if (!schoolName) {
        this.schoolCascaderValue = [];
        return;
      }
      
      // 遍历所有省份，查找学校
      for (const province of this.cascaderOptions) {
        const school = province.children.find(s => s.value === schoolName);
        if (school) {
          this.schoolCascaderValue = [province.value, school.value];
          return;
        }
      }
      
      // 如果找不到，保持级联选择器为空，但保留 form.school 的值
      this.schoolCascaderValue = [];
    },
    
    // 处理学校选择变化
    handleSchoolChange(value) {
      // 如果是初始化阶段，不要清空已有的学校信息
      if (this.isInitializing) {
        // 只有在找到匹配的学校时才更新
        if (value && value.length === 2) {
          this.form.school = value[1];
        }
        // 如果初始化时找不到学校，保留原有的 form.school 值，不清空
        return;
      }
      
      // 用户主动操作时
      if (value && value.length === 2) {
        // 选择了省份和学校，只保存学校名称
        this.form.school = value[1]; // 第二个值是学校名称
        
        // 更新级联选择器的显示文本，只显示学校名称
        this.$nextTick(() => {
          this.updateCascaderDisplay();
        });
      } else {
        // 用户主动清空选择时，才清空表单中的学校名称
        this.form.school = '';
      }
    },
    
    // 更新级联选择器的显示文本，只显示学校名称
    updateCascaderDisplay() {
      if (this.$refs.schoolCascader && this.schoolCascaderValue && this.schoolCascaderValue.length === 2) {
        const schoolName = this.schoolCascaderValue[1];
        // 使用 setTimeout 确保在 Element UI 更新 DOM 后再修改
        setTimeout(() => {
          const cascaderEl = this.$refs.schoolCascader.$el;
          if (cascaderEl) {
            const inputEl = cascaderEl.querySelector('.el-input__inner');
            if (inputEl && inputEl.value !== schoolName) {
              // 直接设置输入框的值，只显示学校名称
              inputEl.value = schoolName;
            }
          }
        }, 100);
      }
    },
    
    // 自定义过滤方法（支持搜索）
    filterSchool(node, keyword) {
      const { value, label } = node;
      const lowerKeyword = keyword.toLowerCase();
      const lowerLabel = label.toLowerCase();
      
      // 如果是学校节点（叶子节点），检查学校名称是否匹配
      if (!node.children || node.children.length === 0) {
        return lowerLabel.includes(lowerKeyword);
      }
      
      // 如果是省份节点，检查省份名称是否匹配
      if (lowerLabel.includes(lowerKeyword)) {
        return true;
      }
      
      // 检查子节点（学校）是否匹配，如果匹配则显示该省份
      return node.children.some(child => 
        child.label.toLowerCase().includes(lowerKeyword)
      );
    },
    
    // 初始化专业级联选择器的值（根据专业名称）
    initMajorCascaderValue(majorName) {
      if (!majorName) {
        this.majorCascaderValue = [];
        return;
      }
      
      // 遍历所有学科门类，查找专业
      for (const discipline of this.majorCascaderOptions) {
        for (const firstLevel of discipline.children) {
          const major = firstLevel.children.find(m => m.value === majorName);
          if (major) {
            this.majorCascaderValue = [discipline.value, firstLevel.value, major.value];
            return;
          }
        }
      }
      
      // 如果找不到，保持级联选择器为空，但保留 form.major 的值
      this.majorCascaderValue = [];
    },
    
    // 处理专业选择变化
    handleMajorChange(value) {
      // 如果是初始化阶段，不要清空已有的专业信息
      if (this.isMajorInitializing) {
        // 只有在找到匹配的专业时才更新
        if (value && value.length === 3) {
          this.form.major = value[2];
        }
        // 如果初始化时找不到专业，保留原有的 form.major 值，不清空
        return;
      }
      
      // 用户主动操作时
      if (value && value.length === 3) {
        // 选择了学科门类、一级学科和专业，只保存专业名称
        this.form.major = value[2]; // 第三个值是专业名称
        
        // 更新级联选择器的显示文本，只显示专业名称
        this.$nextTick(() => {
          this.updateMajorCascaderDisplay();
        });
      } else {
        // 用户主动清空选择时，才清空表单中的专业名称
        this.form.major = '';
      }
    },
    
    // 更新专业级联选择器的显示文本，只显示专业名称
    updateMajorCascaderDisplay() {
      if (this.$refs.majorCascader && this.majorCascaderValue && this.majorCascaderValue.length === 3) {
        const majorName = this.majorCascaderValue[2];
        // 使用 setTimeout 确保在 Element UI 更新 DOM 后再修改
        setTimeout(() => {
          const cascaderEl = this.$refs.majorCascader.$el;
          if (cascaderEl) {
            const inputEl = cascaderEl.querySelector('.el-input__inner');
            if (inputEl && inputEl.value !== majorName) {
              // 直接设置输入框的值，只显示专业名称
              inputEl.value = majorName;
            }
          }
        }, 100);
      }
    },
    
    // 自定义专业过滤方法（支持搜索）
    filterMajor(node, keyword) {
      const { value, label } = node;
      const lowerKeyword = keyword.toLowerCase();
      const lowerLabel = label.toLowerCase();
      
      // 如果是专业节点（叶子节点），检查专业名称是否匹配
      if (!node.children || node.children.length === 0) {
        return lowerLabel.includes(lowerKeyword);
      }
      
      // 如果是学科门类或一级学科节点，检查名称是否匹配
      if (lowerLabel.includes(lowerKeyword)) {
        return true;
      }
      
      // 检查子节点是否匹配，如果匹配则显示该节点
      if (node.children) {
        return node.children.some(child => {
          // 如果子节点还有子节点（一级学科），继续检查
          if (child.children) {
            return child.children.some(grandchild => 
              grandchild.label.toLowerCase().includes(lowerKeyword)
            ) || child.label.toLowerCase().includes(lowerKeyword);
          }
          // 如果是叶子节点（专业），直接检查
          return child.label.toLowerCase().includes(lowerKeyword);
        });
      }
      
      return false;
    },
    
    submit() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.loading = true;
          const userId = this.user.userId || this.$store.getters.userId;
          
          // 准备更新数据
          const updateData = {
            userId: userId,
            nickName: this.form.nickName,
            mobile: this.form.mobile || null, // 手机号
            userName: this.form.userName || null, // 如果为空字符串，转为null
            studentId: this.form.studentId || null,
            school: this.form.school || null,
            major: this.form.major || null,
            dept: this.form.dept || null,
            sex: this.form.sex || null
          };
          
          updateUserInfo(userId, updateData).then(response => {
            this.loading = false;
            if (response.code === 1) {
              this.$message.success("修改成功");
              // 更新父组件的user对象
              Object.assign(this.user, this.form);
              // 触发父组件刷新用户信息
              this.$emit('update:user', this.user);
            } else {
              this.$message.error(response.msg || "修改失败");
            }
          }).catch(error => {
            this.loading = false;
            console.error('更新用户信息失败:', error);
            this.$message.error("修改失败，请稍后再试");
          });
        } else {
          this.$message.warning("请检查输入信息");
        }
      });
    },
    reset() {
      // 重置表单到初始值
      if (this.user) {
        this.form = {
          nickName: this.user.nickName || '',
          mobile: this.user.mobile || '',
          userName: this.user.userName || '',
          studentId: this.user.studentId || '',
          school: this.user.school || '',
          major: this.user.major || '',
          dept: this.user.dept || '',
          sex: this.user.sex || ''
        };
        // 重置学校级联选择器的值（使用 nextTick 确保数据已加载）
        this.isInitializing = true; // 标记正在重置
        this.$nextTick(() => {
          if (this.user.school) {
            this.initSchoolCascaderValue(this.user.school);
          } else {
            this.schoolCascaderValue = [];
          }
          // 重置完成后，取消标记
          this.$nextTick(() => {
            this.isInitializing = false;
          });
        });
        
        // 重置专业级联选择器的值
        this.isMajorInitializing = true; // 标记正在重置
        this.$nextTick(() => {
          if (this.user.major) {
            this.initMajorCascaderValue(this.user.major);
          } else {
            this.majorCascaderValue = [];
          }
          // 重置完成后，取消标记
          this.$nextTick(() => {
            this.isMajorInitializing = false;
          });
        });
      }
      this.$refs["form"].clearValidate();
    }
  }
};
</script>
