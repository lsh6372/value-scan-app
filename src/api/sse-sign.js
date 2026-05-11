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
    console.error('请在 .env.local 中配置 VITE_SSE_WORKER_URL')
    return null
  }
  return workerUrl
}
