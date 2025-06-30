/**
 * Pharmacist Dashboard Component
 */

import React from 'react'
import { Row, Col, Card, Statistic, Typography } from 'antd'
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons'

const { Title } = Typography

const PharmacistDashboard: React.FC = () => {
  const stats = {
    pendingPrescriptions: 8,
    approvedToday: 15,
    totalProcessed: 156,
    todayRevenue: 2450,
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Pharmacist Dashboard</Title>
        <p style={{ color: '#666', marginBottom: 0 }}>
          Manage prescriptions and track your daily activities.
        </p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Prescriptions"
              value={stats.pendingPrescriptions}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Approved Today"
              value={stats.approvedToday}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Processed"
              value={stats.totalProcessed}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Today's Revenue"
              value={stats.todayRevenue}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default PharmacistDashboard
