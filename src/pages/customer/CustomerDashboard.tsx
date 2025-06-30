/**
 * Customer Dashboard Component
 */

import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Typography, Button, message } from 'antd'
import {
  FileTextOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
import PrescriptionUpload from '@components/prescription/PrescriptionUpload'
import { usePrescriptionStore } from '@store/prescriptionStore'

const { Title } = Typography

const CustomerDashboard: React.FC = () => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const { stats, loading, error, fetchPrescriptionStats, clearError } = usePrescriptionStore()

  // Load prescription statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        await fetchPrescriptionStats()
      } catch (error) {
        console.error('Error loading stats:', error)
        message.error('Failed to load dashboard statistics')
      }
    }

    loadStats()
  }, [fetchPrescriptionStats])

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      if (error) {
        clearError()
      }
    }
  }, [error, clearError])

  const handleUploadSuccess = async () => {
    // Reload stats after successful upload
    await fetchPrescriptionStats()
    message.success('Prescription uploaded successfully!')
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Customer Dashboard</Title>
        <p style={{ color: '#666', marginBottom: 0 }}>
          Upload prescriptions and track your orders.
        </p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <UploadOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              <Title level={3} style={{ marginTop: '16px' }}>Upload New Prescription</Title>
              <p style={{ color: '#666', marginBottom: '24px' }}>
                Upload your prescription and get medicines delivered to your doorstep
              </p>
              <Button type="primary" size="large" icon={<UploadOutlined />}
                onClick={() => setUploadModalVisible(true)}
              >
                Upload Prescription
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Total Prescriptions"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Pending"
              value={stats.pending + stats.underReview}
              prefix={<HistoryOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Completed"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Total Spent"
              value={1250} // TODO: Get from billing service
              prefix="$"
              precision={2}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Prescription Upload Modal */}
      <PrescriptionUpload
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  )
}

export default CustomerDashboard
