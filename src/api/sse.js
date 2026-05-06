/**
 * SSE（Server-Sent Events）订阅核心模块
 * 负责创建、管理、关闭 SSE 连接
 */

import { message } from 'antd'

class SSEManager {
  constructor() {
    /** @type {Map<string, EventSource>} */
    this.connections = new Map()
  }

  /**
   * 建立 SSE 连接
   * @param {string} id - 连接唯一标识
   * @param {string} url - SSE 端点地址
   * @param {Object} options
   * @param {function} options.onMessage - 消息回调 (data: any) => void
   * @param {function} options.onOpen - 连接成功回调
   * @param {function} options.onError - 错误回调
   * @param {Object} options.headers - 自定义请求头（如 Token）
   */
  connect(id, url, { onMessage, onOpen, onError } = {}) {
    // 关闭已有连接，避免重复订阅
    this.disconnect(id)

    // 构造带 Query 参数的 URL（EventSource 不支持自定义 Header）
    const fullUrl = new URL(url, window.location.origin)
    // 可在此处追加 ?token=xxx 等参数

    const eventSource = new EventSource(fullUrl.toString())

    eventSource.onopen = () => {
      console.log(`[SSE] 连接建立: ${id}`)
      onOpen?.()
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage?.(data)
      } catch {
        // 非 JSON 数据直接返回
        onMessage?.(event.data)
      }
    }

    eventSource.onerror = (error) => {
      console.error(`[SSE] 连接错误: ${id}`, error)
      onError?.(error)
      // EventSource 会自动重连，无需手动处理
    }

    // 自定义事件（可选，后端可发送命名事件）
    // eventSource.addEventListener('customEvent', (e) => { ... })

    this.connections.set(id, eventSource)
    return eventSource
  }

  /**
   * 断开指定连接
   * @param {string} id
   */
  disconnect(id) {
    const existing = this.connections.get(id)
    if (existing) {
      existing.close()
      this.connections.delete(id)
      console.log(`[SSE] 连接关闭: ${id}`)
    }
  }

  /**
   * 断开所有连接
   */
  disconnectAll() {
    this.connections.forEach((es, id) => {
      es.close()
      console.log(`[SSE] 连接关闭: ${id}`)
    })
    this.connections.clear()
  }

  /**
   * 检查指定连接是否活跃
   * @param {string} id
   */
  isConnected(id) {
    const es = this.connections.get(id)
    return es && es.readyState === EventSource.OPEN
  }
}

// 导出单例
const sseManager = new SSEManager()
export default sseManager
