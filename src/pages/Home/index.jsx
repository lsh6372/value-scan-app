import { Card, Typography, Space } from 'antd'

const { Title, Text } = Typography

export default function Home() {
  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={3}>ValueScan</Title>
          <Text>项目框架已就绪，等待接入 API 文档...</Text>
        </Space>
      </Card>
    </div>
  )
}
