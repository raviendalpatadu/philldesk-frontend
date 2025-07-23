/**
 * Pending Prescriptions Page
 * 
 * This component displays all prescriptions that are currently pending
 * review by pharmacists, with real-time status updates.
 */

import React, { useState, useEffect } from 'react'
import {
  Typography,
  Card,
  List,
  Tag,
  Space,
  Button,
  Empty,
  Row,
  Col,
  Statistic,
  Timeline,
  Modal,
  Descriptions,
  Badge,
  Tooltip,
  message,
  Alert
} from 'antd'
import {
  ClockCircleOutlined,
  FileTextOutlined,
  EyeOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import customerService, { type Prescription } from '../../services/customerService'

const { Title, Text, Paragraph } = Typography

// ============================================================================
// Types and Interfaces
// ============================================================================

interface PendingPrescription extends Prescription {
  estimatedReviewTime?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  queuePosition: number
}

// ============================================================================
// Pending Prescriptions Component
// ============================================================================

const PendingPrescriptions: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<PendingPrescription[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPrescription, setSelectedPrescription] = useState<PendingPrescription | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Transform prescription data to add additional fields for pending view
  const transformToPendingPrescription = (prescription: Prescription, index: number): PendingPrescription => {
    // Calculate estimated review time based on upload time and queue position
    const uploadTime = new Date(prescription.uploadedAt)
    const now = new Date()
    const hoursWaiting = Math.floor((now.getTime() - uploadTime.getTime()) / (1000 * 60 * 60))
    
    // Simple logic for estimated review time (this could be more sophisticated)
    const estimatedReviewTime = hoursWaiting > 4 ? '30 minutes' : 
                               hoursWaiting > 2 ? '1 hour' : 
                               hoursWaiting > 1 ? '2 hours' : '3 hours'
    
    // Simple priority logic based on how long it's been waiting
    const priority: 'low' | 'normal' | 'high' | 'urgent' = 
      hoursWaiting > 6 ? 'urgent' :
      hoursWaiting > 4 ? 'high' :
      hoursWaiting > 2 ? 'normal' : 'low'

    return {
      ...prescription,
      estimatedReviewTime,
      priority,
      queuePosition: index + 1
    }
  }

  // Load pending prescriptions
  const loadPendingPrescriptions = async () => {
    try {
      setLoading(true)
      const data = await customerService.getMyPendingPrescriptions()
      
      // Transform and sort by creation date (oldest first for queue)
      const sortedData = data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      const pendingData = sortedData.map(transformToPendingPrescription)
      
      setPrescriptions(pendingData)
    } catch (error) {
      console.error('Error loading pending prescriptions:', error)
      message.error('Failed to load pending prescriptions')
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadPendingPrescriptions()
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadPendingPrescriptions()
      message.success('Status updated')
    } catch (error) {
      message.error('Failed to refresh status')
    } finally {
      setRefreshing(false)
    }
  }

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return 'Unknown size'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get priority color and label
  const getPriorityDisplay = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { color: 'red', label: 'Urgent', icon: <ExclamationCircleOutlined /> }
      case 'high':
        return { color: 'orange', label: 'High', icon: <ExclamationCircleOutlined /> }
      case 'normal':
        return { color: 'blue', label: 'Normal', icon: <ClockCircleOutlined /> }
      case 'low':
        return { color: 'green', label: 'Low', icon: <ClockCircleOutlined /> }
      default:
        return { color: 'default', label: priority, icon: <ClockCircleOutlined /> }
    }
  }

  // Get file type icon
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: '24px' }} />
    } else if (fileType.includes('image')) {
      return <FileImageOutlined style={{ color: '#1890ff', fontSize: '24px' }} />
    }
    return <FileTextOutlined style={{ fontSize: '24px' }} />
  }

  // Calculate time since upload
  const getTimeSinceUpload = (uploadDate: string) => {
    const now = new Date()
    const uploaded = new Date(uploadDate)
    const diffInMinutes = Math.floor((now.getTime() - uploaded.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`
    }
  }

  // Handle view details
  const handleViewDetails = (prescription: PendingPrescription) => {
    setSelectedPrescription(prescription)
    setDetailModalVisible(true)
  }

  // Handle download
  const handleDownload = (prescription: PendingPrescription) => {
    if (prescription.fileUrl && prescription.fileUrl !== '#') {
      // Open the file URL in a new tab for download
      window.open(prescription.fileUrl, '_blank')
      message.success(`Opening ${prescription.fileName}`)
    } else {
      message.error('File not available for download')
    }
  }

  // Get average wait time
  const averageWaitTime = prescriptions.length > 0 
    ? Math.round(prescriptions.reduce((sum, p) => sum + parseInt(p.estimatedReviewTime?.split(' ')[0] || '60'), 0) / prescriptions.length)
    : 0

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Pending Prescriptions</Title>
        <Paragraph style={{ color: '#666', fontSize: '16px' }}>
          Track your prescriptions that are currently being reviewed by our pharmacists.
        </Paragraph>
      </div>

      {/* Real-time Updates Info */}
      <Alert
        message="Real-time Updates"
        description="This page automatically refreshes every 30 seconds to show the latest status updates."
        type="info"
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '24px' }}
        showIcon
        action={
          <Button size="small" onClick={handleRefresh} loading={refreshing}>
            Refresh Now
          </Button>
        }
      />

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="Pending Reviews"
              value={prescriptions.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="Average Wait Time"
              value={averageWaitTime}
              suffix="min"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Queue Position"
              value={prescriptions.length > 0 ? prescriptions[0].queuePosition : 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix="of queue"
            />
          </Card>
        </Col>
      </Row>

      {/* Pending Prescriptions List */}
      <Card title="Current Queue" loading={loading}>
        {prescriptions.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                No pending prescriptions<br />
                <Text type="secondary">All your prescriptions have been reviewed!</Text>
              </span>
            }
          />
        ) : (
          <List
            dataSource={prescriptions}
            renderItem={(prescription) => {
              const { color, label, icon } = getPriorityDisplay(prescription.priority)
              
              return (
                <List.Item
                  actions={[
                    <Tooltip title="View Details">
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetails(prescription)}
                      />
                    </Tooltip>,
                    <Tooltip title="Download File">
                      <Button
                        type="text"
                        icon={<DownloadOutlined />}
                        onClick={() => handleDownload(prescription)}
                      />
                    </Tooltip>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge count={prescription.queuePosition} offset={[-5, 5]}>
                        {getFileIcon(prescription.fileType)}
                      </Badge>
                    }
                    title={
                      <Space>
                        <span>{prescription.fileName}</span>
                        <Tag icon={icon} color={color}>
                          {label} Priority
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Space split={<span>•</span>}>
                            <Text type="secondary">
                              <UserOutlined style={{ marginRight: 4 }} />
                              {prescription.doctorName || 'Unknown Doctor'}
                            </Text>
                            <Text type="secondary">
                              <CalendarOutlined style={{ marginRight: 4 }} />
                              {prescription.prescriptionDate ? new Date(prescription.prescriptionDate).toLocaleDateString() : 'N/A'}
                            </Text>
                            <Text type="secondary">Size: {formatFileSize(prescription.fileSize)}</Text>
                          </Space>
                          <Space split={<span>•</span>}>
                            <Text type="secondary">Uploaded {getTimeSinceUpload(prescription.uploadedAt)}</Text>
                            <Text type="secondary">Est. review time: {prescription.estimatedReviewTime}</Text>
                          </Space>
                          {prescription.patientNotes && (
                            <Text type="secondary" italic>
                              Note: {prescription.patientNotes.length > 60 
                                ? prescription.patientNotes.substring(0, 60) + '...'
                                : prescription.patientNotes}
                            </Text>
                          )}
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              )
            }}
          />
        )}
      </Card>

      {/* Review Process Timeline */}
      {prescriptions.length > 0 && (
        <Card title="Review Process" style={{ marginTop: '16px' }}>
          <Timeline>
            <Timeline.Item
              color="green"
              dot={<CheckCircleOutlined />}
            >
              <strong>Prescription Uploaded</strong>
              <br />
              <Text type="secondary">Your prescription has been received and added to the review queue</Text>
            </Timeline.Item>
            <Timeline.Item
              color="blue"
              dot={<ClockCircleOutlined />}
            >
              <strong>Pharmacist Review (Current)</strong>
              <br />
              <Text type="secondary">Our licensed pharmacist is reviewing your prescription for accuracy and safety</Text>
            </Timeline.Item>
            <Timeline.Item
              color="gray"
              dot={<CheckCircleOutlined />}
            >
              <strong>Review Complete</strong>
              <br />
              <Text type="secondary">You'll be notified once the review is complete with next steps</Text>
            </Timeline.Item>
          </Timeline>
        </Card>
      )}

      {/* Prescription Detail Modal */}
      <Modal
        title="Prescription Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => selectedPrescription && handleDownload(selectedPrescription)}
          >
            Download
          </Button>,
        ]}
        width={600}
      >
        {selectedPrescription && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="File Name">
                <Space>
                  {getFileIcon(selectedPrescription.fileType)}
                  {selectedPrescription.fileName}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag
                  icon={getPriorityDisplay(selectedPrescription.priority).icon}
                  color={getPriorityDisplay(selectedPrescription.priority).color}
                >
                  {getPriorityDisplay(selectedPrescription.priority).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Queue Position">
                #{selectedPrescription.queuePosition}
              </Descriptions.Item>
              <Descriptions.Item label="Doctor Name">
                {selectedPrescription.doctorName || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Prescription Date">
                {selectedPrescription.prescriptionDate
                  ? new Date(selectedPrescription.prescriptionDate).toLocaleDateString()
                  : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="File Size">
                {formatFileSize(selectedPrescription.fileSize)}
              </Descriptions.Item>
              <Descriptions.Item label="Uploaded At">
                {new Date(selectedPrescription.uploadedAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Estimated Review Time">
                {selectedPrescription.estimatedReviewTime}
              </Descriptions.Item>
              {selectedPrescription.patientNotes && (
                <Descriptions.Item label="Your Notes">
                  {selectedPrescription.patientNotes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default PendingPrescriptions
