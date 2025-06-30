/**
 * Analytics Dashboard Page for Admins
 * 
 * This page provides comprehensive analytics and insights
 * for pharmacy operations, sales, and user activity.
 */

import React from 'react'
import { 
  Typography, 
  Card, 
  Row, 
  Col,
  Statistic,
  Progress,
  Table,
  Select,
  DatePicker
} from 'antd'
import { 
  RiseOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  TeamOutlined,
  WarningOutlined
} from '@ant-design/icons'

const { Title } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

const AnalyticsDashboard: React.FC = () => {
  // Mock data for top medications
  const topMedications = [
    {
      key: '1',
      name: 'Paracetamol 500mg',
      sales: 245,
      revenue: '$1,225.00',
      trend: '+12%'
    },
    {
      key: '2',
      name: 'Amoxicillin 250mg',
      sales: 189,
      revenue: '$945.00',
      trend: '+8%'
    },
    {
      key: '3',
      name: 'Insulin Pen',
      sales: 87,
      revenue: '$2,175.00',
      trend: '+15%'
    },
    {
      key: '4',
      name: 'Lisinopril 10mg',
      sales: 156,
      revenue: '$780.00',
      trend: '+5%'
    }
  ]

  const medicationColumns = [
    {
      title: 'Medication',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Units Sold',
      dataIndex: 'sales',
      key: 'sales'
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue'
    },
    {
      title: 'Trend',
      dataIndex: 'trend',
      key: 'trend',
      render: (trend: string) => (
        <span style={{ color: trend.includes('+') ? '#52c41a' : '#ff4d4f' }}>
          {trend}
        </span>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Analytics Dashboard</Title>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Select defaultValue="thisMonth" style={{ width: 150 }}>
            <Option value="today">Today</Option>
            <Option value="thisWeek">This Week</Option>
            <Option value="thisMonth">This Month</Option>
            <Option value="thisYear">This Year</Option>
          </Select>
          <RangePicker />
        </div>
      </div>
      
      {/* Key Performance Indicators */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={58420}
              precision={2}
              prefix="$"
              suffix={<RiseOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
              +12% from last month
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Orders"
              value={1248}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
              +8% from last month
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={342}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
              +5% from last month
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Prescriptions Processed"
              value={956}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
              +15% from last month
            </div>
          </Card>
        </Col>
      </Row>

      {/* Secondary Metrics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card title="Inventory Status" extra="View Details">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>In Stock</span>
                <span>78%</span>
              </div>
              <Progress percent={78} status="active" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Low Stock</span>
                <span>15%</span>
              </div>
              <Progress percent={15} status="exception" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Out of Stock</span>
                <span>7%</span>
              </div>
              <Progress percent={7} status="exception" />
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="User Distribution">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Customers"
                  value={280}
                  prefix={<UserOutlined />}
                  valueStyle={{ fontSize: '20px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Pharmacists"
                  value={12}
                  prefix={<TeamOutlined />}
                  valueStyle={{ fontSize: '20px' }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Active Users (24h)</span>
                <span>89%</span>
              </div>
              <Progress percent={89} />
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="System Alerts" extra={<WarningOutlined style={{ color: '#fa8c16' }} />}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ color: '#fa8c16' }}>• 5 medications low in stock</span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ color: '#ff4d4f' }}>• 2 expired medications</span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ color: '#1890ff' }}>• 8 pending prescriptions</span>
            </div>
            <div>
              <span style={{ color: '#52c41a' }}>• System backup completed</span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Top Medications Table */}
      <Card title="Top Selling Medications" style={{ marginBottom: 24 }}>
        <Table 
          columns={medicationColumns} 
          dataSource={topMedications}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  )
}

export default AnalyticsDashboard
