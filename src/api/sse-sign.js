/**
 * SSE 流订阅工具
 * 通过 Cloudflare Worker 代理，解决 CORS 问题
 * 签名逻辑已移至 Worker 内部，前端只需连接 Worker URL
 */

/**
 * 构建 SSE 订阅 URL（通过 Worker 代理）
 * @returns {string} Worker SSE URL
 */
export const buildSseUrl = () => {
  const workerUrl = import.meta.env.VITE_SSE_WORKER_URL
  if (!workerUrl) {
    const msg = 'VITE_SSE_WORKER_URL 未配置。\n\n' +
      '本地开发：在 .env.local 中添加\n' +
      'Vercel 部署：在 Vercel Dashboard → Settings → Environment Variables 中添加'
    console.error(msg)
    return null
  }
  return workerUrl
}
