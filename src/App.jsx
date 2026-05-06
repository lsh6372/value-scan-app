/**
 * App 入口
 * - 暗色主题
 * - 路由
 */

import { ConfigProvider, theme } from 'antd'
import { BrowserRouter, useRoutes } from 'react-router-dom'
import zhCN from 'antd/locale/zh_CN'
import { routes } from './router'
import MainLayout from './components/layout/MainLayout'

const AppRoutes = () => {
  return (
    <MainLayout>
      {useRoutes(routes)}
    </MainLayout>
  )
}

const App = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          colorBgContainer: '#111827',
          colorBgElevated: '#1e293b',
          colorBorder: '#334155',
          colorText: '#e2e8f0',
          colorTextSecondary: '#94a3b8',
          borderRadius: 8,
          fontSize: 13,
        },
        components: {
          Table: {
            headerBg: '#1e293b',
            rowHoverBg: '#1e293b',
            borderColor: '#1e293b',
            headerColor: '#94a3b8',
          },
          Card: {
            colorBgContainer: '#111827',
            colorBorderSecondary: '#334155',
          },
          Input: {
            colorBgContainer: '#1e293b',
            activeBorderColor: '#3b82f6',
            hoverBorderColor: '#4b5563',
          },
          Menu: {
            darkItemBg: 'transparent',
            darkItemColor: '#94a3b8',
            darkItemHoverColor: '#e2e8f0',
            darkItemSelectedColor: '#3b82f6',
            darkItemSelectedBg: 'rgba(59, 130, 246, 0.1)',
            horizontalItemSelectedColor: '#3b82f6',
            horizontalItemHoverColor: '#e2e8f0',
          },
          Layout: {
            headerBg: '#111827',
            bodyBg: '#0a0e27',
          },
        },
      }}
    >
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
