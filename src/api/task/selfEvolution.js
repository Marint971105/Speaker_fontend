import request from '@/utils/request'
import { parseStrEmpty } from "@/utils/ruoyi";
export function getHomeworkInfo() {
  return request({
    // url里面的是后端的接口
    url: '/system/user/allList',
    method: 'get'
  })}
export function submitEvaluation(data) {
  return request({
    url: '/api/submit-evaluation', // 这是后端的接口，需替换为实际接口地址
    method: 'post',
    data: data // 这里将用户提交的评分数据传递给后端
  });
}

