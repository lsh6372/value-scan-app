import { Spin } from 'antd'

export default function Loading({ tip = '加载中...' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px' }}>
      <Spin size="large" tip={tip} />
    </div>
  )
}
