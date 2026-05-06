/**
 * ValueScan API 签名工具
 * 签名规则：HMAC-SHA256(TIMESTAMP + RawBody, SecretKey) → 16进制小写
 */

import CryptoJS from 'crypto-js'
import { getApiCredentials } from './config'

/**
 * 生成 13 位毫秒时间戳
 * @returns {string}
 */
export const generateTimestamp = () => {
  return Date.now().toString()
}

/**
 * 生成签名
 * @param {string} timestamp - 13位毫秒时间戳
 * @param {string} rawBody - 原始请求体字符串
 * @param {string} secretKey - 签名密钥
 * @returns {string} 16进制小写签名字符串
 */
export const generateSign = (timestamp, rawBody, secretKey) => {
  // 拼接待签名字符串：TIMESTAMP + RawBody（无分隔符）
  const signContent = timestamp + rawBody

  // HMAC-SHA256 签名
  const hmac = CryptoJS.HmacSHA256(signContent, secretKey)

  // 转为 16 进制小写字符串
  return CryptoJS.enc.Hex.stringify(hmac)
}

/**
 * 构建签名请求头
 * @param {string} rawBody - 原始请求体字符串
 * @returns {{ 'X-API-KEY': string, 'X-TIMESTAMP': string, 'X-SIGN': string }}
 * @throws {Error} API Key 或 Secret Key 未配置时抛出异常
 */
export const buildSignHeaders = (rawBody) => {
  const { apiKey, secretKey } = getApiCredentials()

  if (!apiKey) {
    throw new Error('VS_OPEN_API_KEY 未配置，请在 .env.local 中设置')
  }
  if (!secretKey) {
    throw new Error('VS_OPEN_SECRET_KEY 未配置，请在 .env.local 中设置')
  }

  const timestamp = generateTimestamp()
  const sign = generateSign(timestamp, rawBody, secretKey)

  return {
    'X-API-KEY': apiKey,
    'X-TIMESTAMP': timestamp,
    'X-SIGN': sign,
  }
}
