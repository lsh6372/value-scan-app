/**
 * API 服务层
 * 所有接口调用统一在此管理
 * 严格按照官方文档：https://claw.valuescan.io
 */

import http from './http'

// ==================== 代币列表 ====================

/**
 * 获取代币列表
 * 官方文档：https://claw.valuescan.io/zh-CN/接口详情/代币列表.html
 *
 * @param {Object} params
 * @param {string} [params.search] - 搜索关键字（符号，支持模糊匹配），最大长度100字符，大小写不敏感
 * @returns {Promise<{code: number, message: string, data: Array<{id: number, symbol: string, name: string}>, requestId: string}>}
 *
 * 响应字段：
 * - id: 代币 ID（即 vsTokenId，用于其他接口调用）
 * - symbol: 代币符号（如 BTC, ETH）
 * - name: 代币名称（如 Bitcoin, Ethereum）
 */
export const getTokenList = (params = {}) => {
  return http.post('/open/v1/vs-token/list', params)
}

// ==================== AI 追踪 - 资金异动 ====================

/**
 * 获取资金异动列表
 * 官方文档：https://claw.valuescan.io/zh-CN/接口详情/AI%20追踪/资金异动列表.html
 *
 * @returns {Promise<{code: number, message: string, data: Array, requestId: string}>}
 *
 * 响应字段：
 * - updateTime: 更新时间（毫秒时间戳）
 * - tradeType: 交易类型（1:现货 2:合约 3:交割合约）
 * - vsTokenId: 代币 ID
 * - symbol: 币种符号
 * - name: 代币名称
 * - startTime: 异动开始时间（毫秒时间戳）
 * - endTime: 异动结束时间（毫秒时间戳）
 * - number24h: 24h 内异动次数
 * - numberNot24h: 24h 外异动次数
 * - price: 当前价格 (USD)
 * - pushPrice: 异动推送价格 (USD)
 * - gains: 推送后涨幅 (%)
 * - decline: 推送后跌幅 (%)
 * - percentChange24h: 24 小时价格变化百分比
 * - marketCap: 市值 (USD)
 * - alpha: 是否 Alpha 信号
 * - fomo: 是否 FOMO 状态
 * - fomoEscalation: 是否 FOMO 加剧
 * - bullishRatio: 看涨情绪比例
 */
export const getFundsMovementList = () => {
  return http.post('/open/v1/ai/getFundsCoinList', {})
}
