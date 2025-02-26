import request from '@/utils/request'
import { parseStrEmpty } from "@/utils/ruoyi";

// 查询用户列表
export function getHomeworkInfo() {
  return request({
    // url里面的是后端的接口
    url: '/system/user/allList',
    method: 'get'
  })}
export function getHomeworkFiles() {
  return request({
    // url里面的是后端的接口
    url: '/system/user/allList',
    method: 'get'
  })}
export function getMyScores() {
  return request({
    // url里面的是后端的接口
    url: '/system/user/allList',
    method: 'get'
  })}
export function submitHomeworkFiles() {
  return request({
    // url里面的是后端的接口
    url: '/system/user/allList',
    method: 'get'
  })}
