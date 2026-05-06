/**
 * useAsyncFetch - 异步数据获取 Hook
 * 封装加载状态、错误处理、数据返回
 */

import { useState, useCallback } from 'react'

/**
 * @typedef {Object} AsyncState
 * @property {any} data - 响应数据
 * @property {boolean} loading - 是否加载中
 * @property {Error|null} error - 错误对象
 */

/**
 * 异步数据获取 Hook
 * @param {Function} fetchFn - 返回 Promise 的请求函数
 * @returns {{ ...state, run, reset }}
 */
export function useAsyncFetch(fetchFn) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  })

  const run = useCallback(
    async (...args) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const result = await fetchFn(...args)
        setState({ data: result, loading: false, error: null })
        return result
      } catch (err) {
        setState({ data: null, loading: false, error: err })
        throw err
      }
    },
    [fetchFn]
  )

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return { ...state, run, reset }
}

export default useAsyncFetch
