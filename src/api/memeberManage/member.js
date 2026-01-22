import request from '@/utils/request';

export function getMembers({ page='', pageSize='', name = '', stuIndex = '', mobile = '' }) {
  return request({
    url: '/getMembers',
    method: 'get',
    params: {
      page,
      pageSize,
      name,
      stuIndex,
      mobile
    }
  });
}
// 定义 removeMember API 调用
export function removeMember(userId) {
  return request({
    url: `/deleteMember/${userId}`,
    method: 'get'
  });
}

export function updateUserInfo(userId, data) {
  return request({
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    url: `/member/updateInfo?userId=${userId}`,
    method: 'POST',
   data
  });
}

// 更新用户角色
export function updateRole(userId, roleId) {
  return request({
    url: '/member/updateRole',
    method: 'POST',
    params: {
      userId,
      roleId
    }
  });
}
