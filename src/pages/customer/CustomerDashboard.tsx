/**
 * Customer Dashboard Component
 */

import React, { useState, useEffect } from 'react'
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Typography, 
  Button, 
  message,
  Space
} from 'antd'
import {
  FileTextOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import customerService, { CustomerStats } from '../../services/customerService'

const { Title } = Typography

const CustomerDashboard: React.FC = () => {
  const [stats, setStats] = useState<CustomerStats>({
    totalPrescriptions: 0,
    pendingPrescriptions: 0,
    approvedPrescriptions: 0,
    readyForPickup: 0,
    completedPrescriptions: 0,
    rejectedPrescriptions: 0,
    totalSpent: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const data = await customerService.getDashboardStats()
      setStats(data)
    } catch (error) {
      message.error('Failed to load dashboard stats')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2}>Customer Dashboard</Title>
          <p style={{ color: '#666', marginBottom: 0 }}>
            Upload prescriptions and track your orders.
          </p>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => window.location.href = '/customer/upload'}
        >
          Upload Prescription
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Prescriptions"
              value={stats.totalPrescriptions}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Review"
              value={stats.pendingPrescriptions}
              prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Ready for Pickup"
              value={stats.readyForPickup}
              prefix={<MedicineBoxOutlined style={{ color: '#52c41a' }} />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Spent"
              value={stats.totalSpent}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* Detailed Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Prescription Status Overview" loading={loading}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Approved"
                  value={stats.approvedPrescriptions}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ fontSize: '24px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Completed"
                  value={stats.completedPrescriptions}
                  prefix={<CheckCircleOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ fontSize: '24px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Rejected"
                  value={stats.rejectedPrescriptions}
                  prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
                  valueStyle={{ fontSize: '24px' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Quick Actions">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                icon={<UploadOutlined />} 
                block
                onClick={() => window.location.href = '/customer/upload'}
              >
                Upload New Prescription
              </Button>
              <Button 
                icon={<ClockCircleOutlined />} 
                block
                onClick={() => window.location.href = '/customer/pending'}
              >
                View Pending Reviews
              </Button>
              <Button 
                icon={<FileTextOutlined />} 
                block
                onClick={() => window.location.href = '/customer/prescriptions'}
              >
                View My Prescriptions
              </Button>
              <Button 
                icon={<DollarOutlined />} 
                block
                onClick={() => window.location.href = '/customer/purchase-history'}
              >
                Purchase History
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default CustomerDashboard
