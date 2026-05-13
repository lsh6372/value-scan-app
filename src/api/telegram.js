/**
 * Telegram 推送服务
 * 调用 Cloudflare Worker 的 /telegram 端点
 * 配置从环境变量读取：VITE_TELEGRAM_BOT_TOKEN, VITE_TELEGRAM_CHAT_ID
 */
import { buildSseUrl } from './sse-sign'

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID

/** 检查 Telegram 是否已配置 */
export function isTelegramConfigured() {
  return !!BOT_TOKEN && !!CHAT_ID
}

/** 发送消息到 Telegram（通过 Worker 中转）
 * @param {string} text - 消息内容
 * @returns {Promise<{ ok: boolean, parts: number }>}
 */
export async function sendTelegramMessage(text) {
  if (!isTelegramConfigured()) {
    console.warn('Telegram 未配置，跳过推送')
    return { ok: false, parts: 0, reason: 'not configured' }
  }

  const baseUrl = buildSseUrl()
  if (!baseUrl) {
    throw new Error('VITE_SSE_WORKER_URL 未配置')
  }

  const url = baseUrl.endsWith('/') ? `${baseUrl}telegram` : `${baseUrl}/telegram`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }

  return res.json()
}

/** 构建 Telegram 推送的信号摘要文本
 * @param {object} signals - { btc: string|null, eth: string|null }
 * @returns {string}
 */
export function buildSignalText(signals) {
  const { btc, eth } = signals
  const lines = ['📊 ValueScan 大盘信号通知']

  if (btc) lines.push(`BTC：${btc}`)
  if (eth) lines.push(`ETH：${eth}`)

  lines.push('')
  lines.push('🔗 valuescan.io')

  return lines.join('\n')
}