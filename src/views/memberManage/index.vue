<template>
  <div class="member-management">
    <el-row :gutter="10" style="margin-bottom: 10px;" class="form-row">
      <el-col :span="1">
        <span>学号：</span>
      </el-col>
      <el-col :span="10">
        <el-input v-model="searchQuery.stuIndex" placeholder="学号查询" @input="searchMembers" style="width: 300px;"></el-input>
      </el-col>
    </el-row>

    <el-row :gutter="10" style="margin-bottom: 10px;" class="form-row">
      <el-col :span="1">
        <span>姓名：</span>
      </el-col>
      <el-col :span="10">
        <el-input v-model="searchQuery.name" placeholder="姓名查询" @input="searchMembers" style="width: 300px;"></el-input>
      </el-col>
    </el-row>

    <el-row :gutter="10" style="margin-bottom: 10px;" class="form-row">
      <el-col :span="1">
        <span>手机号：</span>
      </el-col>
      <el-col :span="10">
        <el-input v-model="searchQuery.mobile" placeholder="手机号查询" @input="searchMembers" style="width: 300px;"></el-input>
      </el-col>
    </el-row>

    <el-button type="primary" @click="searchMembers">查询</el-button>

    <el-table :data="members" style="width: 100%; margin-top: 20px;">
      <!-- 序号列 -->
      <el-table-column label="序号" width="200" class-name="number">
        <template slot-scope="scope">
          {{ (currentPage - 1) * pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>

      <!-- 其他列 -->
      <el-table-column prop="studentId" label="学号" header-align="center" align="center"></el-table-column>
      <el-table-column prop="nickName" label="姓名" header-align="center" align="center"></el-table-column>
      <el-table-column prop="班级" label="班级" header-align="center" align="center"></el-table-column>
      <el-table-column label="邮箱" header-align="center" align="center" width="200">
        <template slot-scope="scope">
          {{ scope.row.userName && scope.row.userName.includes('@') ? scope.row.userName : '未设置' }}
        </template>
      </el-table-column>
      <el-table-column label="角色" header-align="center" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.roleId === 1 ? 'success' : 'info'">
            {{ scope.row.roleId === 1 ? '管理员/教师' : scope.row.roleId === 2 ? '学生' : '未知' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sex" label="性别" header-align="center" align="center"></el-table-column>
      <el-table-column prop="mobile" label="手机号" header-align="center" align="center"></el-table-column>
      <el-table-column prop="createTime" label="加入时间" header-align="center" align="center"></el-table-column>

      <el-table-column label="操作" width="280" header-align="center" align="center">
        <template slot-scope="scope">
          <el-button size="mini" @click="editMember(scope.row.userId)">编辑</el-button>
          <el-button size="mini" type="warning" @click="showChangeRoleDialog(scope.row)">身份转变</el-button>
          <el-button size="mini" type="danger" @click="confirmDelete(scope.row.userId)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页控件 -->
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page.sync="currentPage"
      :page-sizes="[10, 20, 30, 50]"
      :page-size="pageSize"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
      style="margin-top: 20px; text-align: right;"
    >
    </el-pagination>

    <!-- 身份转变对话框 -->
    <el-dialog
      title="身份转变"
      :visible.sync="changeRoleDialogVisible"
      width="500px"
      @close="resetChangeRoleDialog"
    >
      <div style="margin-bottom: 20px;">
        <p><strong>用户信息：</strong></p>
        <p>姓名：{{ currentMember.nickName }}</p>
        <p>学号：{{ currentMember.studentId || '未设置' }}</p>
        <p>当前角色：<el-tag :type="currentMember.roleId === 1 ? 'success' : 'info'">
          {{ currentMember.roleId === 1 ? '管理员/教师' : currentMember.roleId === 2 ? '学生' : '未知' }}
        </el-tag></p>
      </div>
      <div style="margin-bottom: 20px;">
        <p><strong>请选择要转换的角色：</strong></p>
        <el-radio-group v-model="selectedRoleId">
          <el-radio :label="1">管理员/教师</el-radio>
          <el-radio :label="2">学生</el-radio>
        </el-radio-group>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="changeRoleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmChangeRole" :disabled="selectedRoleId === currentMember.roleId">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>


<script>
import { getMembers, removeMember, updateRole } from '@/api/memeberManage/member';
import { hasMemberManagePermission } from '@/utils/permission-config';

export default {
  data() {
    return {
      searchQuery: {
        stuIndex: '',
        name: '',
        mobile: ''
      },
      members: [],          // 存储所有成员数据
      filteredMembers: [],  // 存储过滤后的成员数据
      currentPage: 1,
      pageSize: 10,
      total: 0, // 这个值会被设置为后端返回的total
      // 身份转变对话框相关
      changeRoleDialogVisible: false,
      currentMember: {},
      selectedRoleId: null
    }
  },
  methods: {
    // 修改分页处理方法
    handleSizeChange(val) {
      this.pageSize = val;
      this.fetchMembers();
    },
    handleCurrentChange(val) {
      this.currentPage = val;
      this.fetchMembers();
    },
    async fetchMembers() {
      const params = {
        page: this.currentPage,
        pageSize: this.pageSize,
        stuIndex: this.searchQuery.stuIndex,  // 模糊查询条件
        name: this.searchQuery.name,
        mobile: this.searchQuery.mobile
      };
      try {
        const response = await getMembers(params);
        if (response.code === 1) {
          this.members = response.data.rows;
          this.total = response.data.total; // 使用后端返回的total值
        }
      } catch (error) {
        console.error("获取成员数据失败:", error);
        this.$message.error('获取成员数据失败');
      }
    },
    searchMembers() {
      this.currentPage = 1; // 搜索时重置到第一页
      this.fetchMembers();
    },
    // 1. 新增 confirmDelete 方法
    async confirmDelete(userId) {
      this.$confirm('确定要删除该成员吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        // 在调用 removeMember 前添加日志
        console.log("用户确认删除，正在调用 removeMember 方法");
        try {
          const response = await removeMember(userId); // 调用 API 中的 removeMember 方法
          if (response.code === 1) {
            this.$message({
              type: 'success',
              message: '删除成功'
            });
            this.fetchMembers(); // 刷新成员列表
          } else {
            this.$message({
              type: 'error',
              message: response.msg || '删除失败'
            });
          }
        } catch (error) {
          console.error("删除成员失败:", error);
          this.$message({
            type: 'error',
            message: '删除成员失败，请稍后再试'
          });
        }
      }).catch(() => {
        // 用户点击"取消"时会触发这里
        this.$message({
          type: 'info',
          message: '已取消删除'
        });
      });
    },
    // 2. 新增 removeMember 方法
    async deleteMember(userId) {
      try {
        const response = await removeMember(userId); // 使用从 API 引入的 removeMember
        if (response.code === 1) {
          this.$message({
            type: 'success',
            message: '删除成功'
          });
          this.fetchMembers();
        } else {
          this.$message({
            type: 'error',
            message: response.msg || '删除失败'
          });
        }
      } catch (error) {
        console.error("删除成员失败:", error);
        this.$message({
          type: 'error',
          message: '删除成员失败，请稍后再试'
        });
      }
    },
    editMember(userId) {
      this.$router.push({ path: '/memberManage/userDetail', query: { userId } });
    },
    // 显示身份转变对话框
    showChangeRoleDialog(member) {
      this.currentMember = { ...member };
      this.selectedRoleId = member.roleId;
      this.changeRoleDialogVisible = true;
    },
    // 确认身份转变
    async confirmChangeRole() {
      if (this.selectedRoleId === this.currentMember.roleId) {
        this.$message.warning('请选择不同的角色');
        return;
      }
      
      const roleName = this.selectedRoleId === 1 ? '管理员/教师' : '学生';
      const currentRoleName = this.currentMember.roleId === 1 ? '管理员/教师' : '学生';
      
      this.$confirm(`确定要将 ${this.currentMember.nickName} 的身份从"${currentRoleName}"转换为"${roleName}"吗？`, '确认身份转变', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const response = await updateRole(this.currentMember.userId, this.selectedRoleId);
          if (response.code === 1) {
            this.$message({
              type: 'success',
              message: `身份转变成功，已转换为${roleName}`
            });
            this.changeRoleDialogVisible = false;
            this.fetchMembers(); // 刷新成员列表
          } else {
            this.$message({
              type: 'error',
              message: response.msg || '身份转变失败'
            });
          }
        } catch (error) {
          console.error("身份转变失败:", error);
          this.$message({
            type: 'error',
            message: '身份转变失败，请稍后再试'
          });
        }
      }).catch(() => {
        // 用户点击"取消"
      });
    },
    // 重置身份转变对话框
    resetChangeRoleDialog() {
      this.currentMember = {};
      this.selectedRoleId = null;
    }
  },
  created() {
    // 检查用户是否有权限访问成员管理页面
    const userId = this.$store.getters.userId;
    if (!hasMemberManagePermission(userId)) {
      this.$message.error('您没有权限访问成员管理页面');
      this.$router.push({ path: '/', replace: true });
      return;
    }
    this.fetchMembers(); // 初始化数据
  }
}

</script>


<style>
.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.member-management {
  margin: 20px;
}

.member-management .el-input {
  margin-bottom: 10px;
}

.member-management .el-button {
  margin-left: 5px;
}
</style>
