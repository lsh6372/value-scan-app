/**
 * useSubscription - SSE 订阅 Hook
 * 在 React 组件中使用，管理 SSE 连接生命周期
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import sseManager from '../api/sse'

/**
 * @typedef {Object} SubscriptionOptions
 * @property {string} url - SSE 端点地址
 * @property {function} [onMessage] - 消息回调
 * @property {function} [onOpen] - 连接成功回调
 * @property {function} [onError] - 错误回调
 * @property {Object} [headers] - 自定义请求头（会拼接到 URL 参数）
 */

/**
 * SSE 订阅 Hook
 * @param {string} id - 订阅唯一标识（组件内建议用 useId 或固定字符串）
 * @param {SubscriptionOptions|null} options - 订阅配置，传 null 则断开连接
 * @returns {{ data, connected, error, disconnect }}
 */
export function useSubscription(id, options) {
  const [data, setData] = useState(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)

  // 用 ref 保存回调，避免重新连接时闭包过期
  const callbacksRef = useRef({})
  callbacksRef.current = {
    onMessage: options?.onMessage,
    onOpen: options?.onOpen,
    onError: options?.onError,
  }

  useEffect(() => {
    if (!options || !options.url) {
      sseManager.disconnect(id)
      setConnected(false)
      return
    }

    const { url } = options

    sseManager.connect(id, url, {
      onMessage: (msg) => {
        setData(msg)
        callbacksRef.current.onMessage?.(msg)
      },
      onOpen: () => {
        setConnected(true)
        setError(null)
        callbacksRef.current.onOpen?.()
      },
      onError: (err) => {
        setError(err)
        setConnected(false)
        callbacksRef.current.onError?.(err)
      },
    })

    // 组件卸载时自动断开
    return () => {
      sseManager.disconnect(id)
    }
  }, [id, options?.url])

  const disconnect = useCallback(() => {
    sseManager.disconnect(id)
    setConnected(false)
  }, [id])

  return { data, connected, error, disconnect }
}

export default useSubscription
