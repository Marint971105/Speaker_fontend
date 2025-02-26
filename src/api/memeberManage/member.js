import request from '@/utils/request';

export function getMembers({ page='', pageSize='', name = '', stuIndex = '', mail = '' }) {
  return request({
    url: '/getMembers',
    method: 'get',
    params: {
      page,
      pageSize,
      name,
      stuIndex,
      mail
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
