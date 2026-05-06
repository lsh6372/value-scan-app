/**
 * ValueScan HTTP 客户端
 * 基于 axios，集成签名认证、请求/响应拦截器
 */

import axios from 'axios'
import { message } from 'antd'
import { getBaseUrl } from './config'
import { buildSignHeaders } from './sign'

// ==================== 错误码映射 ====================

// 业务错误码映射（code -> 中文提示）
const ERROR_CODE_MESSAGES = {
  // 成功
  200: 'SUCCESS',
  
  // 通用错误（1xxxx）
  10000: '未知错误，请联系技术支持',

  // 认证授权相关错误（2xxxx）
  20001: 'API密钥缺失',
  20002: '无效的API密钥（已禁用、过期或未审核通过）',
  20010: '时间戳参数缺失',
  20011: '时间戳格式错误（必须为10位或13位数字）',
  20012: '时间戳已过期，请重新生成',
  20020: '签名参数缺失',
  20021: '签名验证失败，请检查签名算法',

  // 请求/参数校验相关错误（4xxxx）
  400: '请求无法解析，请检查参数格式',
  404: '接口路径不存在',
  405: '请求方法不允许',
  40001: '必填参数缺失',
  40002: '请求参数不合法',

  // 接口相关错误（5xxxx）
  50001: 'API接口不存在',

  // 限流相关错误（6xxxx）
  60001: '接口调用频率超限，请稍后重试',

  // 业务逻辑相关错误（7xxxx）
  70001: '账户余额不足，请充值',
}

/**
 * 根据错误码获取中文提示
 * @param {number} code 
 * @returns {string}
 */
const getErrorMessage = (code) => {
  return ERROR_CODE_MESSAGES[code] || `未知错误 (${code})`
}

// 创建 axios 实例
const http = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json',
  },
})

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    // 所有接口使用 POST 方法
    config.method = 'post'

    // 获取原始请求体
    let rawBody = ''
    if (config.data) {
      rawBody = typeof config.data === 'string'
        ? config.data
        : JSON.stringify(config.data)
    }

    try {
      const signHeaders = buildSignHeaders(rawBody)
      config.headers = {
        ...config.headers,
        ...signHeaders,
      }
    } catch (error) {
      console.error('[HTTP] 签名生成失败:', error.message)
      return Promise.reject(error)
    }

    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    const { data } = response

    // 业务状态码处理
    if (data.code !== undefined && data.code !== 200) {
      const errorMsg = getErrorMessage(data.code)
      message.error(errorMsg)
      return Promise.reject(new Error(errorMsg))
    }

    // 成功返回完整响应（含 code, message, data, requestId）
    return data
  },
  (error) => {
    // HTTP 状态码错误处理
    if (error.response) {
      const { status, data } = error.response
      let errorMsg = ''

      switch (status) {
        case 401:
          errorMsg = '认证失败：API Key 无效或已过期'
          break
        case 403:
          errorMsg = '签名验证失败，请检查 Secret Key'
          break
        case 404:
          errorMsg = '请求的接口不存在'
          break
        case 429:
          errorMsg = '请求过于频繁，请稍后重试'
          break
        case 500:
          errorMsg = '服务器内部错误'
          break
        case 502:
        case 503:
          errorMsg = '服务暂不可用，请稍后重试'
          break
        default:
          errorMsg = data?.message || `请求失败 (${status})`
      }

      message.error(errorMsg)
    } else if (error.request) {
      message.error('网络连接失败，请检查网络')
    } else {
      message.error(error.message || '请求配置错误')
    }

    return Promise.reject(error)
  }
)

export default http