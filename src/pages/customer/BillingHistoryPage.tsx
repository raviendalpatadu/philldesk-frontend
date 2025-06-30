/**
 * Customer Billing History Page
 * 
 * This page displays the billing and payment history for customers,
 * allowing them to view and download invoices and payment records.
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
  Statistic,
  DatePicker
} from 'antd'
import { 
  EyeOutlined, 
  DownloadOutlined,
  DollarCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined
} from '@ant-design/icons'

const { Title } = Typography
const { RangePicker } = DatePicker

const BillingHistoryPage: React.FC = () => {
  // Mock data for billing history
  const billingHistory = [
    {
      key: '1',
      invoiceId: 'INV-2024-001',
      date: '2024-01-15',
      orderId: 'ORD-2024-001',
      amount: '$45.50',
      status: 'Paid',
      paymentMethod: 'Credit Card',
      dueDate: '2024-01-30'
    },
    {
      key: '2',
      invoiceId: 'INV-2024-002',
      date: '2024-01-20',
      orderId: 'ORD-2024-002',
      amount: '$120.00',
      status: 'Paid',
      paymentMethod: 'Insurance + Cash',
      dueDate: '2024-02-04'
    },
    {
      key: '3',
      invoiceId: 'INV-2024-003',
      date: '2024-01-22',
      orderId: 'ORD-2024-003',
      amount: '$25.00',
      status: 'Pending',
      paymentMethod: 'Insurance',
      dueDate: '2024-02-06'
    },
    {
      key: '4',
      invoiceId: 'INV-2024-004',
      date: '2024-01-25',
      orderId: 'ORD-2024-004',
      amount: '$78.25',
      status: 'Overdue',
      paymentMethod: 'Cash',
      dueDate: '2024-01-30'
    }
  ]

  const columns = [
    {
      title: 'Invoice ID',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date'
    },
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId'
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const getStatusColor = (status: string) => {
          switch (status) {
            case 'Paid': return 'green'
            case 'Pending': return 'orange'
            case 'Overdue': return 'red'
            default: return 'default'
          }
        }
        
        const getStatusIcon = (status: string) => {
          switch (status) {
            case 'Paid': return <CheckCircleOutlined />
            case 'Pending': return <CalendarOutlined />
            case 'Overdue': return <ExclamationCircleOutlined />
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
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod'
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate'
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
            View
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            size="small"
          >
            Download
          </Button>
        </Space>
      )
    }
  ]

  const calculateTotals = () => {
    const totalBilled = billingHistory.reduce((sum, item) => {
      return sum + parseFloat(item.amount.replace('$', ''))
    }, 0)
    
    const totalPaid = billingHistory
      .filter(item => item.status === 'Paid')
      .reduce((sum, item) => {
        return sum + parseFloat(item.amount.replace('$', ''))
      }, 0)
    
    const totalPending = billingHistory
      .filter(item => item.status === 'Pending' || item.status === 'Overdue')
      .reduce((sum, item) => {
        return sum + parseFloat(item.amount.replace('$', ''))
      }, 0)

    return { totalBilled, totalPaid, totalPending }
  }

  const { totalBilled, totalPaid, totalPending } = calculateTotals()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Billing History</Title>
        <RangePicker />
      </div>
      
      {/* Billing Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Billed"
              value={totalBilled}
              precision={2}
              prefix={<DollarCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Paid"
              value={totalPaid}
              precision={2}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Outstanding"
              value={totalPending}
              precision={2}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Invoices"
              value={billingHistory.length}
              prefix={<DollarCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Billing Table */}
      <Card>
        <Table 
          columns={columns} 
          dataSource={billingHistory}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}

export default BillingHistoryPage
