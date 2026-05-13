/**
 * 大盘分析页面
 * - SSE 订阅大盘信号（BTC / ETH）
 * - 通过 Cloudflare Worker 代理，解决 CORS 问题
 * - 实时展示信号状态 + 消息日志
 * - Telegram 信号变化推送
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Card, Button, Typography, Tag, Space, Empty, Badge,
  Input, Switch, Collapse, Tooltip,
} from 'antd'
import {
  PlayCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  SendOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { buildSseUrl } from '@/api/sse-sign'
import { sendTelegramMessage, buildSignalText } from '@/api/telegram'
import { message as antMessage } from 'antd'

const { Text } = Typography

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

// ==================== 消息区块解析 ====================

/** 按币种分割消息内容，返回 { btc, eth }
 *  分割依据：找 "BTC分析：" 和 "ETH分析：" 的位置，截取各自区间
 */
const splitMessageByCoin = (text) => {
  if (!text) return { btc: '', eth: '' }
  const btcIdx = text.indexOf('BTC分析：')
  const ethIdx = text.indexOf('ETH分析：')
  if (btcIdx === -1 && ethIdx === -1) return { btc: '', eth: '' }
  const btc = btcIdx !== -1 ? text.slice(btcIdx) : ''
  const eth = ethIdx !== -1 ? text.slice(ethIdx) : ''
  return { btc, eth }
}

/** 从消息内容中解析指定币种的信号 */
const parseSignal = (text, coin) => {
  if (!text) return null
  const { btc, eth } = splitMessageByCoin(text)
  const section = coin === 'BTC' ? btc : eth
  if (!section) return null
  const pattern = new RegExp(`(${coin}分析[\\s\\S]*?)AI综合分析[:：]\\s*([^\\n]+)`)
  const match = section.match(pattern)
  if (!match) return null
  const result = match[2].trim()
  if (result.includes('利多')) return '利多'
  if (result.includes('利空')) return '利空'
  if (result.includes('震荡')) return '震荡'
  return null
}

/** 从消息内容中解析指定币种的关键支撑位 */
const parseSupport = (text, coin) => {
  if (!text) return null
  const { btc, eth } = splitMessageByCoin(text)
  const section = coin === 'BTC' ? btc : eth
  if (!section) return null
  const pattern = new RegExp(`关键支撑位[：:]\\s*([^\\n]+)`)
  const match = section.match(pattern)
  return match ? match[1].trim() : null
}

/** 从消息内容中解析指定币种的关键压力位 */
const parseResistance = (text, coin) => {
  if (!text) return null
  const { btc, eth } = splitMessageByCoin(text)
  const section = coin === 'BTC' ? btc : eth
  if (!section) return null
  const pattern = new RegExp(`关键压力位[：:]\\s*([^\\n]+)`)
  const match = section.match(pattern)
  return match ? match[1].trim() : null
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
  const btcSupport = parseSupport(item.content, 'BTC')
  const btcResistance = parseResistance(item.content, 'BTC')
  const ethSupport = parseSupport(item.content, 'ETH')
  const ethResistance = parseResistance(item.content, 'ETH')

  return (
    <div
      style={{
        padding: '8px 12px',
        borderBottom: '1px solid #1e293b',
        background: index === 0 ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
      }}
    >
      {/* 时间 + 序号 + 信号标签 */}
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

      {/* BTC 支撑位/压力位 */}
      {(btcSupport || btcResistance) && (
        <div style={{ marginBottom: 2 }}>
          <Text style={{ fontSize: 11, color: '#94a3b8' }}>BTC：</Text>
          {btcSupport && <Text style={{ fontSize: 11, color: '#52c41a' }}>支撑 {btcSupport} </Text>}
          {btcResistance && <Text style={{ fontSize: 11, color: '#ff4d4f' }}>压力 {btcResistance}</Text>}
        </div>
      )}

      {/* ETH 支撑位/压力位 */}
      {(ethSupport || ethResistance) && (
        <div style={{ marginBottom: 2 }}>
          <Text style={{ fontSize: 11, color: '#94a3b8' }}>ETH：</Text>
          {ethSupport && <Text style={{ fontSize: 11, color: '#52c41a' }}>支撑 {ethSupport} </Text>}
          {ethResistance && <Text style={{ fontSize: 11, color: '#ff4d4f' }}>压力 {ethResistance}</Text>}
        </div>
      )}

      {/* 原始内容（折叠显示） */}
      <div
        style={{
          fontSize: 11,
          color: '#64748b',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          maxHeight: 60,
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
  // 消息日志（最多保留 5 条，最新在上面）
  const [logs, setLogs] = useState([])
  // 最后更新时间
  const [lastUpdated, setLastUpdated] = useState(null)

  // Telegram 配置
  const [telegramEnabled, setTelegramEnabled] = useState(false)
  const [telegramBotToken, setTelegramBotToken] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')
  const [testingTelegram, setTestingTelegram] = useState(false)

  const eventSourceRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const reconnectDelayRef = useRef(1)
  const logIdRef = useRef(1)

  // 上一次的信号（用于检测变化）
  const prevBtcSignalRef = useRef(null)
  const prevEthSignalRef = useRef(null)

  // ==================== Telegram 配置（localStorage） ====================

  useEffect(() => {
    const saved = localStorage.getItem('vs_telegram_config')
    if (saved) {
      try {
        const cfg = JSON.parse(saved)
        setTelegramEnabled(!!cfg.enabled)
        setTelegramBotToken(cfg.botToken || '')
        setTelegramChatId(cfg.chatId || '')
      } catch { /* ignore */ }
    }
  }, [])

  const saveTelegramConfig = (enabled, botToken, chatId) => {
    localStorage.setItem('vs_telegram_config', JSON.stringify({ enabled, botToken, chatId }))
  }

  const handleTelegramEnabledChange = (checked) => {
    setTelegramEnabled(checked)
    saveTelegramConfig(checked, telegramBotToken, telegramChatId)
  }

  const handleBotTokenChange = (e) => {
    const val = e.target.value
    setTelegramBotToken(val)
    saveTelegramConfig(telegramEnabled, val, telegramChatId)
  }

  const handleChatIdChange = (e) => {
    const val = e.target.value
    setTelegramChatId(val)
    saveTelegramConfig(telegramEnabled, telegramBotToken, val)
  }

  // 测试 Telegram
  const handleTestTelegram = async () => {
    if (!telegramBotToken || !telegramChatId) {
      antMessage.warning('请先填写 Bot Token 和 Chat ID')
      return
    }
    setTestingTelegram(true)
    try {
      const res = await fetch(`${buildSseUrl()}/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '✅ ValueScan Telegram 推送测试成功！\n\n如果你收到这条消息，说明配置正确。',
        }),
      })
      const data = await res.json()
      if (data.ok) {
        antMessage.success('测试消息发送成功！')
      } else {
        antMessage.error(data.error || '发送失败')
      }
    } catch (err) {
      antMessage.error(err.message)
    } finally {
      setTestingTelegram(false)
    }
  }

  // ==================== 发送 Telegram 信号变化通知 ====================

  const notifySignalChange = useCallback(async (coin, newSignal) => {
    if (!telegramEnabled || !buildSseUrl()) return
    try {
      const signals = { btc: btcSignal, eth: ethSignal }
      const text = buildSignalText(signals)
      await sendTelegramMessage(text)
    } catch (err) {
      console.error('Telegram 推送失败:', err)
    }
  }, [telegramEnabled, btcSignal, ethSignal])

  // ==================== SSE 连接 ====================

  const connect = useCallback(() => {
    const url = buildSseUrl()
    if (!url) {
      antMessage.error('请在 .env.local 中配置 VITE_SSE_WORKER_URL')
      return
    }

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }

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

      const delay = reconnectDelayRef.current
      reconnectDelayRef.current = Math.min(delay * 2, 60)
      antMessage.warning(`连接断开，${delay}s 后自动重连...`)
      reconnectTimerRef.current = setTimeout(() => {
        connect()
      }, delay * 1000)
    }

    es.addEventListener('market', (e) => {
      try {
        const payload = JSON.parse(e.data)
        const content = payload.content
        const ts = payload.ts || Date.now()
        const uniqueId = payload.uniqueId || String(logIdRef.current++)

        const newBtc = parseSignal(content, 'BTC')
        const newEth = parseSignal(content, 'ETH')

        // 检测信号变化 → Telegram 推送
        if (newBtc && newBtc !== prevBtcSignalRef.current) {
          prevBtcSignalRef.current = newBtc
          setBtcSignal(newBtc)
          // 信号变化时通知（延迟一点，等两个信号都解析完再发）
          setTimeout(() => notifySignalChange('BTC', newBtc), 100)
        }
        if (newEth && newEth !== prevEthSignalRef.current) {
          prevEthSignalRef.current = newEth
          setEthSignal(newEth)
          setTimeout(() => notifySignalChange('ETH', newEth), 100)
        }

        // 首次收到信号时也通知（prevRef 初始为 null）
        if (newBtc && !prevBtcSignalRef.current) {
          prevBtcSignalRef.current = newBtc
          setBtcSignal(newBtc)
        }
        if (newEth && !prevEthSignalRef.current) {
          prevEthSignalRef.current = newEth
          setEthSignal(newEth)
        }

        setLastUpdated(ts)

        setLogs((prev) => {
          const next = [{ id: uniqueId, content, ts }, ...prev]
          return next.length > 5 ? next.slice(0, 5) : next
        })
      } catch (err) {
        console.error('解析消息失败:', err)
      }
    })
  }, [notifySignalChange])

  const handleStart = () => {
    connect()
  }

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

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close()
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
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

      {/* Telegram 配置区 */}
      <Card
        bordered={false}
        size="small"
        styles={{ body: { padding: '10px 16px' } }}
        style={{ marginBottom: 12 }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <Space size={12}>
            <SendOutlined style={{ color: '#3b82f6' }} />
            <Text strong style={{ color: '#e2e8f0', fontSize: 13 }}>Telegram 推送</Text>
            <Switch
              size="small"
              checked={telegramEnabled}
              onChange={handleTelegramEnabledChange}
            />
          </Space>

          {telegramEnabled && (
            <Space size={6} wrap>
              <Input.Password
                size="small"
                placeholder="Bot Token"
                value={telegramBotToken}
                onChange={handleBotTokenChange}
                style={{ width: 200, fontSize: 11 }}
              />
              <Input
                size="small"
                placeholder="Chat ID"
                value={telegramChatId}
                onChange={handleChatIdChange}
                style={{ width: 130, fontSize: 11 }}
              />
              <Tooltip title="发送测试消息">
                <Button
                  size="small"
                  icon={<SendOutlined />}
                  loading={testingTelegram}
                  onClick={handleTestTelegram}
                  style={{ fontSize: 11 }}
                >
                  测试
                </Button>
              </Tooltip>
            </Space>
          )}
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
              <MessageLogItem key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </Card>

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
