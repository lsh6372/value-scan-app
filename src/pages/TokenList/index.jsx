/**
 * 代币列表页面
 */

import { useState, useEffect } from 'react'
import { Card, Table, Input, Button, Space, Typography, Tag, Empty, Spin } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { getTokenList } from '@/api/services'

const { Title } = Typography

/**
 * 代币列表页
 */
const TokenListPage = () => {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })

  // 加载代币列表
  const loadData = async (search = '') => {
    setLoading(true)
    try {
      const res = await getTokenList({ search })
      if (res?.data) {
        // 后端返回的直接是数组
        const list = Array.isArray(res.data) ? res.data : []
        setDataSource(list)
        setPagination(prev => ({ ...prev, total: list.length }))
      }
    } catch (error) {
      console.error('加载代币列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    loadData()
  }, [])

  // 搜索
  const handleSearch = () => {
    loadData(searchText)
  }

  // 重置/刷新
  const handleRefresh = () => {
    setSearchText('')
    loadData('')
  }

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id) => <Tag color="blue">{id}</Tag>,
    },
    {
      title: '代币符号',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 150,
      render: (symbol) => <strong>{symbol}</strong>,
    },
    {
      title: '代币名称',
      dataIndex: 'name',
      key: 'name',
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card>
        {/* 标题 */}
        <Title level={4} style={{ marginBottom: 24 }}>
          代币列表
        </Title>

        {/* 搜索栏 */}
        <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
          <Input
            placeholder="搜索代币符号或名称"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
            style={{ flex: 1, maxWidth: 400 }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>
        </Space.Compact>

        {/* 数据表格 */}
        <Spin spinning={loading}>
          {dataSource.length > 0 ? (
            <Table
              columns={columns}
              dataSource={dataSource}
              rowKey="id"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (page, pageSize) => {
                  setPagination(prev => ({ ...prev, current: page, pageSize }))
                },
              }}
              size="small"
              scroll={{ x: 400 }}
            />
          ) : (
            <Empty
              description={loading ? '加载中...' : '暂无数据'}
              style={{ padding: 40 }}
            />
          )}
        </Spin>
      </Card>
    </div>
  )
}

export default TokenListPage