/**
 * Admin Dashboard Component
 * 
 * This component displays the main dashboard for administrators,
 * showing key metrics, alerts, and system overview.
 */

import React from 'react'
import { Row, Col, Card, Statistic, Typography, Space, Alert, List, Badge, Progress, Tag } from 'antd'
import {
  UserOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  DollarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  WifiOutlined,
} from '@ant-design/icons'

const { Title } = Typography

// ============================================================================
// Admin Dashboard Component
// ============================================================================

const AdminDashboard: React.FC = () => {
  // Mock data - in real app, this would come from API
  const stats = {
    totalUsers: 45,
    totalMedicines: 250,
    pendingPrescriptions: 12,
    monthlyRevenue: 15750,
    lowStockAlerts: 8,
    expiringMedicines: 5,
  }

  // Recent activity dummy data
  const recentActivities = [
    {
      id: 1,
      action: 'New prescription uploaded',
      user: 'John Doe',
      timestamp: '2 minutes ago',
      type: 'prescription',
      status: 'pending'
    },
    {
      id: 2,
      action: 'Medicine stock updated',
      user: 'Dr. Smith',
      timestamp: '15 minutes ago',
      type: 'inventory',
      status: 'completed'
    },
    {
      id: 3,
      action: 'User registration',
      user: 'Jane Wilson',
      timestamp: '1 hour ago',
      type: 'user',
      status: 'completed'
    },
    {
      id: 4,
      action: 'Prescription approved',
      user: 'Pharmacist Mike',
      timestamp: '2 hours ago',
      type: 'prescription',
      status: 'approved'
    },
    {
      id: 5,
      action: 'Low stock alert triggered',
      user: 'System',
      timestamp: '3 hours ago',
      type: 'alert',
      status: 'warning'
    }
  ]

  // System status dummy data
  const systemStatus = {
    database: { status: 'healthy', uptime: '99.9%', lastCheck: '1 min ago' },
    server: { status: 'healthy', uptime: '99.8%', lastCheck: '30 sec ago' },
    api: { status: 'healthy', uptime: '99.9%', lastCheck: '15 sec ago' },
    storage: { used: 65, total: 100, unit: 'GB' }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'prescription': return <FileTextOutlined style={{ color: '#1890ff' }} />
      case 'inventory': return <MedicineBoxOutlined style={{ color: '#52c41a' }} />
      case 'user': return <UserOutlined style={{ color: '#722ed1' }} />
      case 'alert': return <WarningOutlined style={{ color: '#fa8c16' }} />
      default: return <ClockCircleOutlined />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge status="processing" text="Pending" />
      case 'completed': return <Badge status="success" text="Completed" />
      case 'approved': return <Badge status="success" text="Approved" />
      case 'warning': return <Badge status="warning" text="Warning" />
      default: return <Badge status="default" text={status} />
    }
  }

  const getSystemStatusIcon = (status: string) => {
    return status === 'healthy' 
      ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
      : <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Admin Dashboard</Title>
        <p style={{ color: '#666', marginBottom: 0 }}>
          Welcome back! Here's what's happening at your pharmacy.
        </p>
      </div>

      {/* Alerts */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {stats.lowStockAlerts > 0 && (
              <Alert
                message={`${stats.lowStockAlerts} medicines are running low on stock`}
                type="warning"
                icon={<WarningOutlined />}
                showIcon
                action={
                  <a href="/admin/inventory?filter=low-stock">View Details</a>
                }
                closable
              />
            )}
            {stats.expiringMedicines > 0 && (
              <Alert
                message={`${stats.expiringMedicines} medicines are expiring soon`}
                type="error"
                icon={<WarningOutlined />}
                showIcon
                action={
                  <a href="/admin/inventory?filter=expiring">View Details</a>
                }
                closable
              />
            )}
          </Space>
        </Col>
      </Row>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Medicines"
              value={stats.totalMedicines}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Prescriptions"
              value={stats.pendingPrescriptions}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Monthly Revenue"
              value={stats.monthlyRevenue}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Additional Dashboard Content */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="Recent Activity" 
            style={{ height: '400px' }}
            extra={<a href="/admin/activity-log">View All</a>}
          >
            <List
              dataSource={recentActivities}
              size="small"
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={getActivityIcon(item.type)}
                    title={
                      <Space>
                        <span>{item.action}</span>
                        {getStatusBadge(item.status)}
                      </Space>
                    }
                    description={
                      <Space split={<span>•</span>}>
                        <span>{item.user}</span>
                        <span style={{ color: '#999' }}>{item.timestamp}</span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title="System Status" 
            style={{ height: '400px' }}
            extra={<Tag color="green">All Systems Operational</Tag>}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* Database Status */}
              <div>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <DatabaseOutlined style={{ color: '#1890ff' }} />
                    <span>Database</span>
                  </Space>
                  {getSystemStatusIcon(systemStatus.database.status)}
                </Space>
                <div style={{ marginTop: 8, marginLeft: 24 }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Uptime: {systemStatus.database.uptime} • Last check: {systemStatus.database.lastCheck}
                  </div>
                </div>
              </div>

              {/* Server Status */}
              <div>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <CloudServerOutlined style={{ color: '#52c41a' }} />
                    <span>Server</span>
                  </Space>
                  {getSystemStatusIcon(systemStatus.server.status)}
                </Space>
                <div style={{ marginTop: 8, marginLeft: 24 }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Uptime: {systemStatus.server.uptime} • Last check: {systemStatus.server.lastCheck}
                  </div>
                </div>
              </div>

              {/* API Status */}
              <div>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <WifiOutlined style={{ color: '#722ed1' }} />
                    <span>API</span>
                  </Space>
                  {getSystemStatusIcon(systemStatus.api.status)}
                </Space>
                <div style={{ marginTop: 8, marginLeft: 24 }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Uptime: {systemStatus.api.uptime} • Last check: {systemStatus.api.lastCheck}
                  </div>
                </div>
              </div>

              {/* Storage Usage */}
              <div>
                <div style={{ marginBottom: 8 }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <span>Storage Usage</span>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {systemStatus.storage.used}{systemStatus.storage.unit} / {systemStatus.storage.total}{systemStatus.storage.unit}
                    </span>
                  </Space>
                </div>
                <Progress 
                  percent={(systemStatus.storage.used / systemStatus.storage.total) * 100} 
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                  showInfo={false}
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AdminDashboard
