/**
 * ValueScan API 环境配置
 */

// 环境类型
export const ENV_TYPE = {
  PRODUCTION: 'production',
  BETA: 'beta',
}

// API Base URL 配置
export const API_BASE_URLS = {
  [ENV_TYPE.PRODUCTION]: 'https://api.valuescan.io/api',
  [ENV_TYPE.BETA]: 'https://api-beta.valuescan.io/api',
}

// 当前环境
export const getCurrentEnv = () => {
  return import.meta.env.VITE_API_ENV || ENV_TYPE.PRODUCTION
}

// 获取当前环境的 Base URL
export const getBaseUrl = () => {
  const env = getCurrentEnv()
  return API_BASE_URLS[env]
}

// API 认证配置
export const getApiCredentials = () => {
  return {
    apiKey: import.meta.env.VITE_VS_OPEN_API_KEY || '',
    secretKey: import.meta.env.VITE_VS_OPEN_SECRET_KEY || '',
  }
}

// 检查是否已配置
export const isConfigured = () => {
  const { apiKey, secretKey } = getApiCredentials()
  return !!(apiKey && secretKey)
}