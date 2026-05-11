/**
 * 大盘分析页面
 * - SSE 订阅大盘信号（BTC / ETH）
 * - 通过 Cloudflare Worker 代理，解决 CORS 问题
 * - 实时展示信号状态 + 消息日志
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, Button, Typography, Tag, Space, Empty, Badge } from 'antd'
import {
  PlayCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { buildSseUrl } from '@/api/sse-sign'
import { message as antMessage } from 'antd'

const { Text, Title } = Typography

// 信号颜色映射
const SIGNAL_COLORS = {
  '利多': { bg: 'rgba(82, 196, 26, 0.15)', border: '#52c41a', text: '#52c41a' },
  '利空': { bg: 'rgba(255, 77, 79, 0.15)', border: '#ff4d4f', text: '#ff4d4f' },
  '震荡': { bg: 'rgba(250, 173, 20, 0.15)', border: '#faad14', text: '#faad14' },
}

const SIGNAL_BG = {
  '利多': '#52c41a',
  '利空': '#ff4d4f',
  '震荡': '#faad14',
}

// ==================== 信号解析 ====================

/** 从消息内容中解析指定币种的信号 */
const parseSignal = (text, coin) => {
  if (!text) return null
  // BTC分析：...AI综合分析：利空/利多/震荡
  const pattern = new RegExp(`${coin}分析[\\s\\S]*?AI综合分析[:：]\\s*([^\\n]+)`)
  const match = text.match(pattern)
  if (!match) return null
  const result = match[1].trim()
  if (result.includes('利多')) return '利多'
  if (result.includes('利空')) return '利空'
  if (result.includes('震荡')) return '震荡'
  return null
}

// ==================== 时间格式化 ====================

const formatTime = (ts) => {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

// ==================== 消息日志行组件 ====================

const MessageLogItem = ({ item, index }) => {
  const btc = parseSignal(item.content, 'BTC')
  const eth = parseSignal(item.content, 'ETH')

  return (
    <div
      style={{
        padding: '8px 12px',
        borderBottom: '1px solid #1e293b',
        background: index === 0 ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
      }}
    >
      {/* 时间 + 序号 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <Space size={8}>
          <Tag style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>#{index + 1}</Tag>
          {btc && (
            <Tag
              style={{
                margin: 0,
                fontSize: 10,
                padding: '0 4px',
                background: SIGNAL_BG[btc] || '#999',
                borderColor: SIGNAL_BG[btc] || '#999',
                color: '#fff',
              }}
            >
              BTC {btc}
            </Tag>
          )}
          {eth && (
            <Tag
              style={{
                margin: 0,
                fontSize: 10,
                padding: '0 4px',
                background: SIGNAL_BG[eth] || '#999',
                borderColor: SIGNAL_BG[eth] || '#999',
                color: '#fff',
              }}
            >
              ETH {eth}
            </Tag>
          )}
        </Space>
        <Text type="secondary" style={{ fontSize: 10 }}>
          {formatTime(item.ts)}
        </Text>
      </div>

      {/* 原始内容 */}
      <div
        style={{
          fontSize: 11,
          color: '#94a3b8',
          lineHeight: 1.6,
          wordBreak: 'break-all',
          whiteSpace: 'pre-wrap',
          maxHeight: 80,
          overflow: 'hidden',
        }}
      >
        {item.content}
      </div>
    </div>
  )
}

// ==================== 页面组件 ====================

const MarketAnalysisPage = () => {
  // 连接状态: idle | connecting | connected | error
  const [connStatus, setConnStatus] = useState('idle')
  // BTC / ETH 当前信号
  const [btcSignal, setBtcSignal] = useState(null)
  const [ethSignal, setEthSignal] = useState(null)
  // 消息日志（最多保留 50 条）
  const [logs, setLogs] = useState([])
  // 最后更新时间
  const [lastUpdated, setLastUpdated] = useState(null)

  const eventSourceRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const reconnectDelayRef = useRef(1)
  const logIdRef = useRef(1)

  // 连接 SSE
  const connect = useCallback(() => {
    const url = buildSseUrl()
    if (!url) {
      antMessage.error('请在 .env.local 中配置 VITE_SSE_WORKER_URL')
      return
    }

    // 清除重连定时器
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }

    // 关闭旧连接
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    setConnStatus('connecting')

    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onopen = () => {
      setConnStatus('connected')
      reconnectDelayRef.current = 1
    }

    es.onerror = () => {
      setConnStatus('error')
      es.close()
      eventSourceRef.current = null

      // 指数退避重连（最多 60s）
      const delay = reconnectDelayRef.current
      reconnectDelayRef.current = Math.min(delay * 2, 60)
      antMessage.warning(`连接断开，${delay}s 后自动重连...`)
      reconnectTimerRef.current = setTimeout(() => {
        connect()
      }, delay * 1000)
    }

    // 处理消息（event: market）
    es.addEventListener('market', (e) => {
      try {
        const payload = JSON.parse(e.data)
        const content = payload.content
        const ts = payload.ts || Date.now()
        const uniqueId = payload.uniqueId || String(logIdRef.current++)

        // 解析信号
        const newBtc = parseSignal(content, 'BTC')
        const newEth = parseSignal(content, 'ETH')

        if (newBtc) setBtcSignal(newBtc)
        if (newEth) setEthSignal(newEth)
        setLastUpdated(ts)

        // 追加消息日志（最多 50 条）
        setLogs((prev) => {
          const next = [...prev, { id: uniqueId, content, ts }]
          return next.length > 50 ? next.slice(next.length - 50) : next
        })
      } catch (err) {
        console.error('解析消息失败:', err)
      }
    })
  }, [])

  // 启动订阅
  const handleStart = () => {
    connect()
  }

  // 终止订阅
  const handleStop = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setConnStatus('idle')
  }

  // 清理
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
    }
  }, [])

  // ==================== 渲染 ====================

  const StatusBadge = () => {
    const map = {
      idle: { color: '#666', text: '未连接', dot: '#666' },
      connecting: { color: '#faad14', text: '连接中...', dot: '#faad14' },
      connected: { color: '#52c41a', text: '已连接', dot: '#52c41a' },
      error: { color: '#ff4d4f', text: '连接失败', dot: '#ff4d4f' },
    }
    const s = map[connStatus] || map.idle
    return (
      <Space size={4}>
        <span style={{
          display: 'inline-block',
          width: 8, height: 8,
          borderRadius: '50%',
          background: s.dot,
          animation: connStatus === 'connecting' ? 'pulse 1s infinite' : 'none',
        }} />
        <Text style={{ color: s.color, fontSize: 12 }}>{s.text}</Text>
      </Space>
    )
  }

  // 信号卡片
  const SignalCard = ({ coin, signal }) => {
    const colors = signal ? SIGNAL_COLORS[signal] : { bg: 'rgba(100,116,139,0.1)', border: '#334155', text: '#94a3b8' }
    const label = signal || '等待数据...'

    return (
      <div
        style={{
          flex: 1,
          minWidth: 140,
          padding: '20px 24px',
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          textAlign: 'center',
        }}
      >
        <Text style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 8 }}>
          {coin}
        </Text>
        <Text style={{
          fontSize: 28,
          fontWeight: 700,
          color: colors.text,
          display: 'block',
          lineHeight: 1.2,
        }}>
          {label}
        </Text>
      </div>
    )
  }

  return (
    <div>
      {/* 顶部控制栏 */}
      <Card
        bordered={false}
        size="small"
        styles={{ body: { padding: '12px 16px' } }}
        style={{ marginBottom: 12 }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <Space size={12}>
            <Text strong style={{ color: '#fff', fontSize: 15 }}>大盘分析</Text>
            <StatusBadge />
            {lastUpdated && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                更新 {formatTime(lastUpdated)}
              </Text>
            )}
          </Space>
          <Space>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleStart}
              disabled={connStatus === 'connected' || connStatus === 'connecting'}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >
              启动订阅
            </Button>
            <Button
              danger
              icon={<StopOutlined />}
              onClick={handleStop}
              disabled={connStatus === 'idle'}
            >
              终止订阅
            </Button>
          </Space>
        </div>
      </Card>

      {/* 信号卡片 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <SignalCard coin="BTC" signal={btcSignal} />
        <SignalCard coin="ETH" signal={ethSignal} />
      </div>

      {/* 消息日志 */}
      <Card
        bordered={false}
        size="small"
        styles={{ body: { padding: 0 } }}
        title={
          <Space>
            <InfoCircleOutlined style={{ color: '#3b82f6' }} />
            <span style={{ color: '#e2e8f0', fontSize: 13 }}>实时消息</span>
            <Badge
              count={logs.length}
              style={{ backgroundColor: '#334155', fontSize: 10 }}
              overflowCount={99}
            />
          </Space>
        }
        extra={
          logs.length > 0 && (
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => setLogs([])}
              style={{ color: '#94a3b8', fontSize: 11 }}
            >
              清空
            </Button>
          )
        }
      >
        {logs.length === 0 ? (
          <Empty
            description={
              <Text type="secondary" style={{ fontSize: 12 }}>
                {connStatus === 'idle' ? '点击"启动订阅"开始接收数据' : '等待消息推送...'}
              </Text>
            }
            style={{ padding: '40px 0' }}
          />
        ) : (
          <div
            style={{
              maxHeight: 480,
              overflowY: 'auto',
              background: '#111827',
            }}
          >
            {logs.map((item, i) => (
              <MessageLogItem key={item.id} item={item} index={logs.length - 1 - i} />
            ))}
          </div>
        )}
      </Card>

      {/* 全局样式（脉冲动画） */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

export default MarketAnalysisPage
