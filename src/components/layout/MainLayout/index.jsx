/**
 * 页面布局组件
 * - 顶部导航栏（桌面横排 / 移动端抽屉）
 * - 内容区域
 */

import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Layout, Typography, Drawer, Button } from 'antd'
import {
  HomeOutlined,
  UnorderedListOutlined,
  RiseOutlined,
  MenuOutlined,
  LineChartOutlined,
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
  {
    key: '/market-analysis',
    icon: <LineChartOutlined />,
    label: '大盘分析',
  },
]

// 断点常量（与全局保持一致）
const BREAKPOINT_MOBILE = 768
const isMobile = () => typeof window !== 'undefined' && window.innerWidth < BREAKPOINT_MOBILE

const MainLayout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [current, setCurrent] = useState(location.pathname)
  const [mobileOpen, setMobileOpen] = useState(false)

  // 响应式检测
  const [isSmallScreen, setIsSmallScreen] = useState(false)

  const updateScreenSize = useCallback(() => {
    setIsSmallScreen(window.innerWidth < BREAKPOINT_MOBILE)
  }, [])

  useEffect(() => {
    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [updateScreenSize])

  const handleMenuClick = ({ key }) => {
    setCurrent(key)
    navigate(key)
    setMobileOpen(false)
  }

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#111827',
    borderBottom: '1px solid #1e293b',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    padding: isSmallScreen ? '0 12px' : '0 24px',
    height: isSmallScreen ? 48 : 56,
    lineHeight: `${isSmallScreen ? 48 : 56}px`,
  }

  const logoStyle = {
    fontSize: isSmallScreen ? 15 : 18,
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: 1,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  }

  const contentStyle = {
    padding: isSmallScreen ? '12px 8px' : '24px',
    background: '#0a0e27',
    minHeight: 'calc(100vh - 56px)',
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#0a0e27' }}>
      {/* 顶部导航栏 */}
      <Header style={headerStyle}>
        {/* Logo */}
        <Text strong style={logoStyle}>
          ValueScan
        </Text>

        {/* 桌面端：横向菜单 | 移动端：汉堡按钮 */}
        {isSmallScreen ? (
          <>
            <Button
              type="text"
              icon={<MenuOutlined style={{ color: '#e2e8f0', fontSize: 18 }} />}
              onClick={() => setMobileOpen(true)}
            />
            <Drawer
              title={
                <Text strong style={{ fontSize: 16, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  ValueScan
                </Text>
              }
              placement="right"
              onClose={() => setMobileOpen(false)}
              open={mobileOpen}
              width={240}
              styles={{
                body: { padding: 0, background: '#111827' },
                header: { background: '#111827', borderBottom: '1px solid #1e293b' },
              }}
            >
              <Menu
                mode="vertical"
                selectedKeys={[current]}
                onClick={handleMenuClick}
                items={menuItems}
                theme="dark"
                style={{ background: 'transparent', borderRight: 0 }}
              />
            </Drawer>
          </>
        ) : (
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
        )}
      </Header>

      {/* 内容区域 */}
      <Content style={contentStyle}>
        {children}
      </Content>
    </Layout>
  )
}

export default MainLayout
