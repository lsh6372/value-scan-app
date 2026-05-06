/**
 * 统一错误处理工具
 */

import { message } from 'antd'

/**
 * 根据 HTTP 状态码返回友好提示
 * @param {number|string} status
 * @returns {string}
 */
export function getHttpErrorText(status) {
  const map = {
    400: '请求参数有误',
    401: '登录已过期，请重新登录',
    403: '没有权限访问该资源',
    404: '请求的资源不存在',
    408: '请求超时，请稍后重试',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务暂不可用',
    504: '网关超时',
  }
  return map[status] || `请求失败 (${status})`
}

/**
 * 全局错误回调（可接入监控系统）
 * @param {Error} error
 * @param {string} [context]
 */
export function reportError(error, context) {
  console.error('[Error]', context, error)
  // 接入 Sentry 等监控平台
  // Sentry.captureException(error, { extra: { context } })
}
