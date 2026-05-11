/**
 * Cloudflare Worker - SSE 代理
 * 作用：中转 ValueScan SSE 流，解决 CORS 问题
 * AK/SK 存储在 Worker 环境变量中，前端不可见
 */

export default {
  async fetch(request, env, ctx) {
    // CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(),
      })
    }

    // 只允许 GET 请求
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    // 从环境变量读取 AK/SK
    const apiKey = env.VALUESCAN_API_KEY
    const secretKey = env.VALUESCAN_SECRET_KEY

    if (!apiKey || !secretKey) {
      return new Response('Worker not configured: missing API credentials', { status: 500 })
    }

    // 构建签名
    const timestamp = Date.now()
    const nonce = generateNonce()
    const signTarget = String(timestamp) + nonce
    const sign = await hmacSha256(signTarget, secretKey)

    // 构建 SSE URL
    const sseUrl = `https://stream.valuescan.ai/stream/market/subscribe?apiKey=${encodeURIComponent(apiKey)}&sign=${sign}&timestamp=${timestamp}&nonce=${nonce}`

    try {
      // 连接 SSE 端点
      const response = await fetch(sseUrl, {
        headers: {
          'Accept': 'text/event-stream',
        },
      })

      if (!response.ok) {
        return new Response(`SSE error: ${response.status}`, { status: response.status })
      }

      // 流式返回
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
  },
}

/**
 * CORS 响应头
 */
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

/**
 * 生成 32 位随机字符串（模拟 uuid.uuid4().hex）
 */
function generateNonce() {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

/**
 * HMAC-SHA256 签名
 * @param {string} message - 要签名的消息
 * @param {string} secret - 密钥
 * @returns {Promise<string>} 十六进制签名结果
 */
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
