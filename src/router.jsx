/**
 * 页面路由
 */

import Home from './pages/Home'
import TokenList from './pages/TokenList'
import LongInflow from './pages/LongInflow'

export const routes = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/tokens',
    element: <TokenList />,
  },
  {
    path: '/long-inflow',
    element: <LongInflow />,
  },
]
