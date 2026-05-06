/**
 * 页面布局组件
 * - 顶部导航栏
 * - 内容区域
 */

import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Layout, Typography } from 'antd'
import {
  HomeOutlined,
  UnorderedListOutlined,
  RiseOutlined,
} from '@ant-design/icons'

const { Header, Content } = Layout
const { Text } = Typography

// 导航菜单配置
const menuItems = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: '首页',
  },
  {
    key: '/tokens',
    icon: <UnorderedListOutlined />,
    label: '代币列表',
  },
  {
    key: '/long-inflow',
    icon: <RiseOutlined />,
    label: '资金异动',
  },
]

const MainLayout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [current, setCurrent] = useState(location.pathname)

  const handleMenuClick = ({ key }) => {
    setCurrent(key)
    navigate(key)
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#0a0e27' }}>
      {/* 顶部导航栏 */}
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: '#111827',
          borderBottom: '1px solid #1e293b',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text
            strong
            style={{
              fontSize: 18,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: 1,
            }}
          >
            ValueScan
          </Text>
        </div>

        {/* 导航菜单 */}
        <Menu
          mode="horizontal"
          selectedKeys={[current]}
          onClick={handleMenuClick}
          items={menuItems}
          style={{
            flex: 1,
            justifyContent: 'center',
            background: 'transparent',
            borderBottom: 'none',
          }}
          theme="dark"
        />

        {/* 右侧占位 */}
        <div style={{ width: 100 }} />
      </Header>

      {/* 内容区域 */}
      <Content
        style={{
          padding: '24px',
          background: '#0a0e27',
        }}
      >
        {children}
      </Content>
    </Layout>
  )
}

export default MainLayout
