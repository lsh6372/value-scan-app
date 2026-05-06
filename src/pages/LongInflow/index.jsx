/**
 * 资金异动看涨监控页面
 * 参考：https://www.valuescan.io/AIGEMs/longInflowAlert
 */

import { useState, useEffect, useCallback } from 'react'
import { Card, Table, Input, Button, Space, Typography, Tag, Empty, Spin, Tooltip, Badge, Dropdown } from 'antd'
import { SearchOutlined, ReloadOutlined, StarOutlined, FireOutlined } from '@ant-design/icons'
import { getFundsMovementList } from '@/api/services'

const { Text } = Typography

// ==================== 格式化工具 ====================

/** 时间戳 → MM/DD HH:mm */
const formatTime = (ts) => {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 数字格式化 */
const fmt = (v, d = 4) => {
  if (v === null || v === undefined || v === '') return '-'
  const n = Number(v)
  if (isNaN(n)) return '-'
  // 自动判断小数位
  const s = n.toFixed(d).replace(/\.?0+$/, '')
  return s === '' ? '0' : s
}

/** 百分比格式化（带颜色） */
const pct = (v, showSign = true) => {
  if (v === null || v === undefined || v === '') return <Text type="secondary">-</Text>
  const n = Number(v)
  if (isNaN(n)) return '-'
  const sign = showSign && n > 0 ? '+' : ''
  const color = n > 0 ? '#52c41a' : n < 0 ? '#ff4d4f' : '#999'
  return <Text style={{ color, fontWeight: 600 }}>{sign}{n.toFixed(2)}%</Text>
}

/** 市值格式化 B/M/万 */
const mktCap = (v) => {
  if (!v) return '-'
  const n = Number(v)
  if (isNaN(n)) return '-'
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}亿`
  if (n >= 1e4) return `${(n / 1e4).toFixed(2)}万`
  return n.toFixed(2)
}

// ==================== 交易类型映射 ====================

const TRADE_TYPE_MAP = { 1: '现货', 2: '合约', 3: '交割合约' }

// ==================== 页面组件 ====================

const LongInflowPage = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [searchText, setSearchText] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getFundsMovementList()
      setData(Array.isArray(res?.data) ? res.data : [])
    } catch (e) {
      console.error('加载失败:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleRefresh = () => loadData()

  // 前端过滤
  const filteredData = searchText
    ? data.filter(item => item.symbol?.toLowerCase().includes(searchText.toLowerCase()) || item.name?.toLowerCase().includes(searchText.toLowerCase()))
    : data

  // ==================== 表格列定义（严格对齐截图） ====================
  const columns = [
    {
      title: '#',
      key: 'index',
      width: 48,
      align: 'center',
      render: (_, __, i) => (
        <span style={{ color: '#999', fontSize: 12 }}>{i + 1}</span>
      ),
    },
    {
      title: '币种',
      key: 'token',
      width: 180,
      fixed: 'left',
      render: (_, r) => (
        <Space size={4}>
          {/* 代币图标占位 - 可后续接入 coin icon */}
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#666'
          }}>
            {r.symbol?.charAt(0)}
          </div>
          <Space direction="vertical" size={0}>
            <Space size={4}>
              <strong style={{ fontSize: 13 }}>{r.symbol}</strong>
              {r.alpha && <Tag color="#f0c14b" style={{ margin: 0, padding: '0 4px', lineHeight: '18px', fontSize: 11 }}>Alpha</Tag>}
              {r.fomo && <FireOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />}
            </Space>
            <Text type="secondary" style={{ fontSize: 11 }}>{r.name}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: '首次推送',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 110,
      render: (t) => <span style={{ fontSize: 12, color: '#999' }}>{formatTime(t)}</span>,
    },
    {
      title: '最新推送',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 110,
      render: (t) => <span style={{ fontSize: 12, color: '#999' }}>{formatTime(t)}</span>,
    },
    {
      title: '推送价格($)',
      dataIndex: 'pushPrice',
      key: 'pushPrice',
      width: 110,
      align: 'right',
      render: (v) => <span style={{ fontSize: 12 }}>{fmt(v)}</span>,
    },
    {
      title: '当前币价($)',
      dataIndex: 'price',
      key: 'price',
      width: 110,
      align: 'right',
      render: (v) => <span style={{ fontSize: 12, fontWeight: 500 }}>{fmt(v)}</span>,
    },
    {
      title: '推送后涨幅',
      dataIndex: 'gains',
      key: 'gains',
      width: 100,
      align: 'right',
      render: (v) => pct(v),
    },
    {
      title: '推送后跌幅',
      dataIndex: 'decline',
      key: 'decline',
      width: 100,
      align: 'right',
      render: (v) => pct(v),
    },
    {
      title: '看涨情绪',
      dataIndex: 'bullishRatio',
      key: 'bullishRatio',
      width: 90,
      align: 'right',
      render: (v) => {
        const p = ((Number(v) || 0) * 100).toFixed(2)
        const c = v >= 0.6 ? '#52c41a' : v >= 0.4 ? '#faad14' : '#ff4d4f'
        return <Text style={{ color: c, fontWeight: 500 }}>{p}%</Text>
      },
    },
    {
      title: '全部',
      dataIndex: 'tradeType',
      key: 'tradeType',
      width: 70,
      align: 'center',
      render: (v) => <Tag style={{ margin: 0, fontSize: 11 }}>{TRADE_TYPE_MAP[v] || '-'}</Tag>,
    },
    {
      title: '市值',
      dataIndex: 'marketCap',
      key: 'marketCap',
      width: 90,
      align: 'right',
      render: (v) => <span style={{ fontSize: 12 }}>{mktCap(v)}</span>,
    },
    {
      title: '短线异动',
      dataIndex: 'number24h',
      key: 'number24h',
      width: 80,
      align: 'center',
      render: (v) => <Badge count={v} style={{ backgroundColor: '#1890ff', boxShadow: 'none' }} />,
    },
    {
      title: '趋势异动',
      dataIndex: 'numberNot24h',
      key: 'numberNot24h',
      width: 80,
      align: 'center',
      render: (v) => <span style={{ fontSize: 12, color: '#999' }}>{v ?? 0}</span>,
    },
  ]

  return (
    <div style={{ padding: '4px' }}>
      <Card
        bordered={false}
        size="small"
        styles={{ body: { padding: '16px 16px 8px' } }}
      >
        {/* 标题栏 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Space>
            <Text strong style={{ color: '#fff', fontSize: 15 }}>
              资金异动看涨监控
            </Text>
            <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>实时</Tag>
          </Space>

          {/* 搜索 + 刷新 */}
          <Space.Compact>
            <Input
              placeholder="搜索代币符号"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={() => setSearchText(searchText)}
              allowClear
              style={{ width: 200 }}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => setSearchText(searchText)}

            >
              搜索
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}

            >
              刷新
            </Button>
          </Space.Compact>
        </div>

        {/* 数据表格 - 暗色主题 */}
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey={(r) => `${r.vsTokenId}-${r.updateTime}`}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => <Text type="secondary" style={{ fontSize: 12 }}>共 {total} 条</Text>,
              size: 'small',
            }}
            size="small"
            scroll={{ x: 1400 }}

          />
        </Spin>

        {!loading && filteredData.length === 0 && (
          <Empty description="暂无数据" style={{ padding: 60 }} />
        )}
      </Card>
    </div>
  )
}

export default LongInflowPage