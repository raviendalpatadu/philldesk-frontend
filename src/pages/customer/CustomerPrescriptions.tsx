/**
 * Customer Prescriptions Page
 * 
 * This component allows customers to view and manage their prescriptions,
 * including upload history, status tracking, and file downloads.
 */

import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Typography,
  Card,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  Row,
  Col,
  Statistic,
  Modal,
  Descriptions,
  message,
  Tooltip,
  Empty
} from 'antd'
import {
  FileTextOutlined,
  EyeOutlined,
  DownloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileProtectOutlined,
  DollarOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import customerService, { Prescription } from '../../services/customerService'

const { Title, Text: AntText } = Typography
const { Search } = Input
const { Option } = Select

// ============================================================================
// Customer Prescriptions Component
// ============================================================================

const CustomerPrescriptions: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Read initial status from URL parameters
  const initialStatus = searchParams.get('status') || 'ALL'
  
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus)

  useEffect(() => {
    fetchPrescriptions()
  }, [])

  // Watch for URL parameter changes
  useEffect(() => {
    const urlStatus = searchParams.get('status') || 'All'
    setStatusFilter(urlStatus.toUpperCase())
  }, [searchParams])

  const fetchPrescriptions = async () => {
    try {
      setLoading(true)
      const data = await customerService.getMyPrescriptions()
      setPrescriptions(data)
      setFilteredPrescriptions(data)
    } catch (error) {
      message.error('Failed to load prescriptions')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get prescription stats
  const stats = {
    total: prescriptions.length,
    pending: prescriptions.filter(p => p.status === 'PENDING').length,
    approved: prescriptions.filter(p => p.status === 'APPROVED').length,
    readyForPickup: prescriptions.filter(p => p.status === 'DISPENSED').length,
    completed: prescriptions.filter(p => p.status === 'COMPLETED').length,
    rejected: prescriptions.filter(p => p.status === 'REJECTED').length
  }

  // Filter prescriptions based on search and status
  useEffect(() => {
    let filtered = prescriptions

    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(prescription =>
        prescription.fileName.toLowerCase().includes(searchText.toLowerCase()) ||
        prescription.doctorName?.toLowerCase().includes(searchText.toLowerCase()) ||
        prescription.notes?.toLowerCase().includes(searchText.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(prescription => prescription.status === statusFilter)
    }

    setFilteredPrescriptions(filtered)
  }, [prescriptions, searchText, statusFilter])

  const handleViewDetails = async (id: number) => {
    try {
      const prescription = await customerService.getPrescriptionById(id)
      setSelectedPrescription(prescription)
      setDetailModalVisible(true)
    } catch (error) {
      message.error('Failed to load prescription details')
      console.error('Error:', error)
    }
  }

  // Format file size (fallback for now)
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size'
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get status color and icon
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { color: 'orange', icon: <ClockCircleOutlined /> }
      case 'APPROVED':
        return { color: 'blue', icon: <CheckCircleOutlined /> }
      case 'COMPLETED':
        return { color: 'green', icon: <CheckCircleOutlined /> }
      case 'DISPENSED':
        return { color: 'cyan', icon: <CheckCircleOutlined /> }
      case 'REJECTED':
        return { color: 'red', icon: <CloseCircleOutlined /> }
      default:
        return { color: 'default', icon: <ExclamationCircleOutlined /> }
    }
  }

  // Get status label for display
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending Review'
      case 'APPROVED':
        return 'Approved'
      case 'COMPLETED':
        return 'Completed'
      case 'DISPENSED':
        return 'Ready for Pickup'
      case 'REJECTED':
        return 'Rejected'
      default:
        return status
    }
  }

  // Get file type icon
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />
    } else if (fileType.includes('image')) {
      return <FileImageOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
    }
    return <FileTextOutlined style={{ fontSize: '16px' }} />
  }

  // Handle download prescription
  const handleDownload = (prescription: Prescription) => {
    
  }

  // Handle view bills for a prescription
  const handleViewBills = async (prescription: Prescription) => {
    navigate(`/customer/bills?prescriptionId=${prescription.id}`)
  }

  // Table columns configuration
  const columns: ColumnsType<Prescription> = [
    {
      title: 'File',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (fileName: string, record: Prescription) => (
        <Space>
          {getFileIcon(record.fileType)}
          <span>{fileName}</span>
        </Space>
      ),
    },
    {
      title: 'Doctor',
      dataIndex: 'doctorName',
      key: 'doctorName',
      render: (doctorName: string) => doctorName || 'N/A',
    },
    {
      title: 'Date',
      dataIndex: 'prescriptionDate',
      key: 'prescriptionDate', 
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const { color, icon } = getStatusDisplay(status)
        return (
          <Tag icon={icon} color={color}>
            {getStatusLabel(status)}
          </Tag>
        )
      },
    },
    {
      title: 'Uploaded',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Prescription) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record.id)}
            />
          </Tooltip>
          
          {(record.status === 'DISPENSED' || record.status === 'COMPLETED') && (
            <Tooltip title="View Bills">
              <Button
                type="text"
                icon={<DollarOutlined />}
                onClick={() => handleViewBills(record)}
                style={{ color: '#fa8c16' }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>My Prescriptions</Title>
        <p style={{ color: '#666', marginBottom: 0 }}>
          View and manage your uploaded prescriptions and their status.
        </p>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Prescriptions"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Pending Review"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Ready for Pickup"
              value={stats.readyForPickup}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search prescriptions..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="All">All Status</Option>
              <Option value="PENDING">Pending</Option>
              <Option value="APPROVED">Approved</Option>
              <Option value="COMPLETED">Completed</Option>
              <Option value="DISPENSED">Dispensed</Option>
              <Option value="REJECTED">Rejected</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Prescriptions Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredPrescriptions}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} prescriptions`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No prescriptions found"
              />
            ),
          }}
        />
      </Card>

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
            Download Prescription
          </Button>
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
              <Descriptions.Item label="Status">
                <Tag
                  icon={getStatusDisplay(selectedPrescription.status).icon}
                  color={getStatusDisplay(selectedPrescription.status).color}
                >
                  {getStatusLabel(selectedPrescription.status)}
                </Tag>
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
              {selectedPrescription.reviewedAt && (
                <Descriptions.Item label="Reviewed At">
                  {new Date(selectedPrescription.reviewedAt).toLocaleString()}
                </Descriptions.Item>
              )}
              {selectedPrescription.patientNotes && (
                <Descriptions.Item label="Your Notes">
                  {selectedPrescription.patientNotes}
                </Descriptions.Item>
              )}
              {selectedPrescription.reviewerNotes && (
                <Descriptions.Item label="Pharmacist Notes">
                  {selectedPrescription.reviewerNotes}
                </Descriptions.Item>
              )}
              {selectedPrescription.status === 'COMPLETED' && (
                <>
                  <Descriptions.Item label="Completion Status">
                    <Tag color="green" icon={<CheckCircleOutlined />}>
                      Prescription Completed
                    </Tag>
                  </Descriptions.Item>
                  {customerService.getCompletionInstructions(selectedPrescription) && (
                    <Descriptions.Item label="Completion Instructions">
                      {customerService.getCompletionInstructions(selectedPrescription)}
                    </Descriptions.Item>
                  )}
                  {customerService.getFollowUpDate(selectedPrescription) && (
                    <Descriptions.Item label="Follow-up Date">
                      {customerService.getFollowUpDate(selectedPrescription)}
                    </Descriptions.Item>
                  )}
                </>
              )}
              {(selectedPrescription.status === 'DISPENSED' || selectedPrescription.status === 'COMPLETED') && (
                <Descriptions.Item label="Payment Information">
                  <Space direction="vertical" size="small">
                    <AntText type="secondary">
                      <DollarOutlined style={{ marginRight: '4px' }} />
                      Bills are available for this prescription
                    </AntText>
                    <Button 
                      size="small" 
                      type="link" 
                      icon={<DollarOutlined />}
                      onClick={() => selectedPrescription && handleViewBills(selectedPrescription)}
                    >
                      View Bills & Payment Options
                    </Button>
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default CustomerPrescriptions
