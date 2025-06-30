/**
 * Customer Orders Page
 * 
 * This page displays the order history for customers,
 * allowing them to track their medication orders.
 */

import React from 'react'
import { 
  Typography, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Card, 
  Row, 
  Col,
  Statistic
} from 'antd'
import { 
  EyeOutlined, 
  DownloadOutlined,
  ShoppingCartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TruckOutlined
} from '@ant-design/icons'

const { Title } = Typography

const OrdersPage: React.FC = () => {
  // Mock data for orders
  const orders = [
    {
      key: '1',
      orderId: 'ORD-2024-001',
      date: '2024-01-15',
      items: ['Paracetamol 500mg x 30', 'Amoxicillin 250mg x 20'],
      status: 'Delivered',
      total: '$45.50',
      prescriptionId: 'RX-2024-001'
    },
    {
      key: '2',
      orderId: 'ORD-2024-002',
      date: '2024-01-20',
      items: ['Insulin Pen x 5', 'Blood Glucose Strips x 50'],
      status: 'In Transit',
      total: '$120.00',
      prescriptionId: 'RX-2024-002'
    },
    {
      key: '3',
      orderId: 'ORD-2024-003',
      date: '2024-01-22',
      items: ['Lisinopril 10mg x 30'],
      status: 'Processing',
      total: '$25.00',
      prescriptionId: 'RX-2024-003'
    }
  ]

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date'
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items: string[]) => (
        <div>
          {items.map((item) => (
            <div key={item}>{item}</div>
          ))}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const getStatusColor = (status: string) => {
          switch (status) {
            case 'Delivered': return 'green'
            case 'In Transit': return 'blue'
            case 'Processing': return 'orange'
            default: return 'default'
          }
        }
        
        const getStatusIcon = (status: string) => {
          switch (status) {
            case 'Delivered': return <CheckCircleOutlined />
            case 'In Transit': return <TruckOutlined />
            case 'Processing': return <ClockCircleOutlined />
            default: return null
          }
        }

        return (
          <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
            {status}
          </Tag>
        )
      }
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            size="small"
            type="primary"
            ghost
          >
            View Details
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            size="small"
          >
            Invoice
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Title level={2}>Order History</Title>
      
      {/* Order Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Orders"
              value={15}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Delivered"
              value={12}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="In Transit"
              value={2}
              prefix={<TruckOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Processing"
              value={1}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Orders Table */}
      <Card>
        <Table 
          columns={columns} 
          dataSource={orders}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}

export default OrdersPage
