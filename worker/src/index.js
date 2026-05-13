/**
 * Cloudflare Worker - SSE 代理 + Telegram 推送
 *
 * 路由：
 *   GET  /           → SSE 代理（大盘信号流）
 *   POST /telegram   → Telegram 推送
 *
 * 环境变量（通过 wrangler secret put 配置）：
 *   VALUESCAN_API_KEY     - ValueScan API Key
 *   VALUESCAN_SECRET_KEY  - ValueScan Secret Key
 *   TELEGRAM_BOT_TOKEN    - Telegram Bot Token
 *   TELEGRAM_CHAT_ID      - Telegram Chat ID
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(),
      })
    }

    // Telegram 推送路由
    if (url.pathname === '/telegram' && request.method === 'POST') {
      return handleTelegram(request, env)
    }

    // SSE 路由（默认 GET）
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 })
    }
    return handleSSE(request, env)
  },
}

// ==================== SSE 代理 ====================

async function handleSSE(request, env) {
  const apiKey = env.VALUESCAN_API_KEY
  const secretKey = env.VALUESCAN_SECRET_KEY

  if (!apiKey || !secretKey) {
    return new Response('Worker not configured: missing API credentials', { status: 500 })
  }

  const timestamp = Date.now()
  const nonce = generateNonce()
  const signTarget = String(timestamp) + nonce
  const sign = await hmacSha256(signTarget, secretKey)

  const sseUrl = `https://stream.valuescan.ai/stream/market/subscribe?apiKey=${encodeURIComponent(apiKey)}&sign=${sign}&timestamp=${timestamp}&nonce=${nonce}`

  try {
    const response = await fetch(sseUrl, {
      headers: { 'Accept': 'text/event-stream' },
    })

    if (!response.ok) {
      return new Response(`SSE error: ${response.status}`, { status: response.status })
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders(),
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (err) {
    return new Response(`SSE connection failed: ${err.message}`, { status: 502 })
  }
}

// ==================== Telegram 推送 ====================

async function handleTelegram(request, env) {
  const botToken = env.TELEGRAM_BOT_TOKEN
  const chatId = env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    return jsonResponse({ error: 'Telegram not configured on server' }, 500)
  }

  let body
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const { text } = body
  if (!text || typeof text !== 'string') {
    return jsonResponse({ error: 'Missing text field' }, 400)
  }

  const MAX_LEN = 4000
  const parts = text.length <= MAX_LEN
    ? [text]
    : chunkString(text, MAX_LEN)

  try {
    for (const part of parts) {
      await sendTelegramMessage(botToken, chatId, part)
    }
    return jsonResponse({ ok: true, parts: parts.length })
  } catch (err) {
    return jsonResponse({ error: `Telegram send failed: ${err.message}` }, 502)
  }
}

async function sendTelegramMessage(botToken, chatId, text) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: String(chatId),
      text,
      parse_mode: 'HTML',
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Telegram API error ${response.status}: ${err}`)
  }
}

function chunkString(str, maxLen) {
  const result = []
  for (let i = 0; i < str.length; i += maxLen) {
    result.push(str.slice(i, i + maxLen))
  }
  return result
}

// ==================== 工具函数 ====================

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

function generateNonce() {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

async function hmacSha256(message, secret) {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const msgData = encoder.encode(message)

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, msgData)
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
