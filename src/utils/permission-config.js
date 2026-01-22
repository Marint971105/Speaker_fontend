/**
 * 权限配置文件
 * 用于配置各个功能模块的访问权限
 * 
 * 修改说明：
 * - 如需添加新的用户，直接在此文件中修改对应的数组即可
 * - userId 是用户的唯一标识，无论用户使用手机号、学号还是用户名登录，userId 都保持不变
 */

// 允许访问成员管理页面的用户ID列表
// 学号 000001 对应 userId: 339
// 学号 000002 对应 userId: 340
export const MEMBER_MANAGE_ALLOWED_USER_IDS = [339, 340];

/**
 * 检查用户是否有权限访问成员管理页面
 * @param {Number} userId - 用户ID
 * @returns {Boolean} - true表示有权限，false表示无权限
 */
export function hasMemberManagePermission(userId) {
  if (!userId) {
    return false;
  }
  return MEMBER_MANAGE_ALLOWED_USER_IDS.includes(Number(userId));
}

