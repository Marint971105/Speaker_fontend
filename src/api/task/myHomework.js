import request from '@/utils/request'
import { parseStrEmpty } from "@/utils/ruoyi";

// 查询用户列表
export function listMyHomeWork() {
  return request({
    // url里面的是后端的接口
    url: '/system/user/allList',
    method: 'get'
  })
}
