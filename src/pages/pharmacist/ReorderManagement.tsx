/**
 * Pharmacist Reorder Management
 * 
 * This component provides comprehensive reorder management functionality for pharmacists,
 * including pending reorders, supplier management, order tracking, and automated reorder suggestions.
 */

import React, { useState, useEffect } from 'react'
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
  Input,
  Select,
  Modal,
  message,
  Tooltip,
  Form,
  DatePicker,
  Tabs,
  Progress,
  Steps,
  Descriptions,
  Alert
} from 'antd'
import { 
  SearchOutlined,
  FilterOutlined,
  ShoppingCartOutlined,
  AlertOutlined,
  FileTextOutlined,
  PrinterOutlined,
  EyeOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TruckOutlined,
  PhoneOutlined,
  MailOutlined,
  DollarOutlined,
  TeamOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography
const { Option } = Select
const { TabPane } = Tabs
const { Step } = Steps

// Mock reorder data
const mockReorders = [
  {
    id: 'RO-2025-001',
    requestDate: '2025-07-15T14:30:00',
    status: 'Pending Approval',
    statusCode: 1,
    supplier: 'MedSupply Co',
    supplierContact: {
      phone: '+1-555-0199',
      email: 'orders@medsupply.com',
      rep: 'Sarah Johnson'
    },
    totalItems: 3,
    totalCost: 1275.50,
    estimatedDelivery: '2025-07-22T09:00:00',
    priority: 'High',
    requestedBy: 'Dr. Smith',
    items: [
      {
        id: 'INV-001',
        name: 'Lisinopril',
        strength: '10mg',
        form: 'Tablet',
        ndc: '12345-678-90',
        currentStock: 45,
        reorderQuantity: 300,
        unitCost: 0.85,
        totalCost: 255.00,
        urgency: 'High'
      },
      {
        id: 'INV-004',
        name: 'Omeprazole',
        strength: '20mg',
        form: 'Capsule',
        ndc: '44444-555-66',
        currentStock: 180,
        reorderQuantity: 200,
        unitCost: 0.51,
        totalCost: 102.00,
        urgency: 'Medium'
      },
      {
        id: 'INV-002',
        name: 'Metformin',
        strength: '500mg',
        form: 'Tablet',
        ndc: '98765-432-10',
        currentStock: 250,
        reorderQuantity: 400,
        unitCost: 0.31,
        totalCost: 124.00,
        urgency: 'Low'
      }
    ]
  },
  {
    id: 'RO-2025-002',
    requestDate: '2025-07-16T09:15:00',
    status: 'Approved',
    statusCode: 2,
    supplier: 'SpecialtyMeds Inc',
    supplierContact: {
      phone: '+1-555-0277',
      email: 'orders@specialtymeds.com',
      rep: 'Michael Chen'
    },
    totalItems: 2,
    totalCost: 723.20,
    estimatedDelivery: '2025-07-20T14:00:00',
    priority: 'Critical',
    requestedBy: 'Dr. Rodriguez',
    orderNumber: 'PO-SM-7891',
    items: [
      {
        id: 'INV-003',
        name: 'Sumatriptan',
        strength: '50mg',
        form: 'Tablet',
        ndc: '11111-222-33',
        currentStock: 8,
        reorderQuantity: 50,
        unitCost: 13.33,
        totalCost: 666.50,
        urgency: 'Critical'
      },
      {
        id: 'INV-005',
        name: 'Tretinoin',
        strength: '0.025%',
        form: 'Cream',
        ndc: '77777-888-99',
        currentStock: 0,
        reorderQuantity: 30,
        unitCost: 1.90,
        totalCost: 57.00,
        urgency: 'Critical'
      }
    ]
  },
  {
    id: 'RO-2025-003',
    requestDate: '2025-07-14T11:20:00',
    status: 'Shipped',
    statusCode: 3,
    supplier: 'PharmaCorp',
    supplierContact: {
      phone: '+1-555-0388',
      email: 'support@pharmacorp.com',
      rep: 'Lisa Wong'
    },
    totalItems: 1,
    totalCost: 167.50,
    estimatedDelivery: '2025-07-18T10:00:00',
    priority: 'Normal',
    requestedBy: 'Dr. Park',
    orderNumber: 'PO-PC-4455',
    trackingNumber: 'TRK123456789',
    items: [
      {
        id: 'INV-006',
        name: 'Amlodipine',
        strength: '5mg',
        form: 'Tablet',
        ndc: '12345-111-22',
        currentStock: 320,
        reorderQuantity: 250,
        unitCost: 0.67,
        totalCost: 167.50,
        urgency: 'Low'
      }
    ]
  },
  {
    id: 'RO-2025-004',
    requestDate: '2025-07-12T16:45:00',
    status: 'Delivered',
    statusCode: 4,
    supplier: 'OTC Distributors',
    supplierContact: {
      phone: '+1-555-0466',
      email: 'orders@otcdist.com',
      rep: 'James Miller'
    },
    totalItems: 1,
    totalCost: 25.00,
    deliveredDate: '2025-07-17T09:30:00',
    priority: 'Normal',
    requestedBy: 'Dr. Johnson',
    orderNumber: 'PO-OTC-9988',
    items: [
      {
        id: 'INV-008',
        name: 'Ibuprofen',
        strength: '200mg',
        form: 'Tablet',
        ndc: '99999-123-45',
        currentStock: 15,
        reorderQuantity: 500,
        unitCost: 0.05,
        totalCost: 25.00,
        urgency: 'High'
      }
    ]
  }
]

// Mock suggested reorders based on inventory data
const mockSuggestedReorders = [
  {
    id: 'INV-001',
    name: 'Lisinopril',
    strength: '10mg',
    form: 'Tablet',
    currentStock: 45,
    minimumStock: 100,
    reorderPoint: 100,
    suggestedQuantity: 300,
    daysUntilStockout: 12,
    supplier: 'MedSupply Co',
    unitCost: 0.85,
    estimatedCost: 255.00,
    priority: 'High',
    lastOrdered: '2025-07-10T09:00:00'
  },
  {
    id: 'INV-008',
    name: 'Ibuprofen',
    strength: '200mg',
    form: 'Tablet',
    currentStock: 15,
    minimumStock: 200,
    reorderPoint: 200,
    suggestedQuantity: 500,
    daysUntilStockout: 3,
    supplier: 'OTC Distributors',
    unitCost: 0.05,
    estimatedCost: 25.00,
    priority: 'Critical',
    lastOrdered: '2025-05-30T14:00:00'
  }
]

const ReorderManagement: React.FC = () => {
  const [reorders] = useState(mockReorders)
  const [suggestedReorders] = useState(mockSuggestedReorders)
  const [filteredReorders, setFilteredReorders] = useState(mockReorders)
  const [selectedReorder, setSelectedReorder] = useState<any>(null)
  const [detailsModalVisible, setDetailsModalVisible] = useState(false)
  const [createReorderModalVisible, setCreateReorderModalVisible] = useState(false)
  const [bulkReorderModalVisible, setBulkReorderModalVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [form] = Form.useForm()

  // Filter reorders based on search and filters
  const handleFilter = () => {
    let filtered = reorders

    if (searchText) {
      filtered = filtered.filter(reorder => 
        reorder.id.toLowerCase().includes(searchText.toLowerCase()) ||
        reorder.supplier.toLowerCase().includes(searchText.toLowerCase()) ||
        reorder.requestedBy.toLowerCase().includes(searchText.toLowerCase()) ||
        reorder.items.some(item => item.name.toLowerCase().includes(searchText.toLowerCase()))
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(reorder => reorder.status === statusFilter)
    }

    if (supplierFilter !== 'all') {
      filtered = filtered.filter(reorder => reorder.supplier === supplierFilter)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(reorder => reorder.priority === priorityFilter)
    }

    setFilteredReorders(filtered)
  }

  // Calculate statistics
  const stats = {
    totalReorders: reorders.length,
    pendingApproval: reorders.filter(r => r.status === 'Pending Approval').length,
    approved: reorders.filter(r => r.status === 'Approved').length,
    shipped: reorders.filter(r => r.status === 'Shipped').length,
    delivered: reorders.filter(r => r.status === 'Delivered').length,
    totalValue: reorders.reduce((total, r) => total + r.totalCost, 0),
    suggestedReordersCount: suggestedReorders.length,
    criticalItems: suggestedReorders.filter(s => s.priority === 'Critical').length
  }

  // Get unique suppliers for filter
  const suppliers = [...new Set(reorders.map(r => r.supplier))]

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending Approval': return 'orange'
      case 'Approved': return 'blue'
      case 'Shipped': return 'cyan'
      case 'Delivered': return 'green'
      default: return 'default'
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'red'
      case 'High': return 'orange'
      case 'Normal': return 'blue'
      case 'Low': return 'green'
      default: return 'default'
    }
  }

  // Get status step
  const getStatusStep = (status: string) => {
    switch (status) {
      case 'Pending Approval': return 0
      case 'Approved': return 1
      case 'Shipped': return 2
      case 'Delivered': return 3
      default: return 0
    }
  }

  // Reorder table columns
  const reorderColumns = [
    {
      title: 'Reorder Info',
      key: 'reorderInfo',
      width: 200,
      render: (record: any) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.id}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {new Date(record.requestDate).toLocaleDateString()}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.totalItems} item(s)
          </Text>
          <Tag color={getPriorityColor(record.priority)} style={{ fontSize: '10px' }}>
            {record.priority}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Supplier',
      key: 'supplier',
      width: 180,
      render: (record: any) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.supplier}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Rep: {record.supplierContact.rep}
          </Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.supplierContact.phone}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Status & Progress',
      key: 'status',
      width: 180,
      render: (record: any) => (
        <Space direction="vertical" size="small">
          <Tag color={getStatusColor(record.status)}>{record.status}</Tag>
          <Progress 
            percent={(getStatusStep(record.status) + 1) * 25} 
            size="small"
            showInfo={false}
          />
          {record.orderNumber && (
            <Text type="secondary" style={{ fontSize: '10px' }}>
              PO: {record.orderNumber}
            </Text>
          )}
          {record.trackingNumber && (
            <Text type="secondary" style={{ fontSize: '10px' }}>
              Track: {record.trackingNumber}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Cost & Delivery',
      key: 'cost',
      width: 150,
      render: (record: any) => (
        <Space direction="vertical" size="small">
          <Text strong>${record.totalCost.toFixed(2)}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Est. Delivery:
          </Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.estimatedDelivery ? new Date(record.estimatedDelivery).toLocaleDateString() : 'TBD'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (record: any) => (
        <Space direction="vertical" size="small">
          <Space size="small">
            <Tooltip title="View Details">
              <Button 
                size="small"
                icon={<EyeOutlined />}
                onClick={() => {
                  setSelectedReorder(record)
                  setDetailsModalVisible(true)
                }}
              />
            </Tooltip>
            {record.supplierContact.phone && (
              <Tooltip title="Call Supplier">
                <Button 
                  size="small"
                  icon={<PhoneOutlined />}
                  onClick={() => message.info(`Calling ${record.supplierContact.rep} at ${record.supplierContact.phone}`)}
                />
              </Tooltip>
            )}
            {record.supplierContact.email && (
              <Tooltip title="Email Supplier">
                <Button 
                  size="small"
                  icon={<MailOutlined />}
                  onClick={() => message.info(`Opening email to ${record.supplierContact.email}`)}
                />
              </Tooltip>
            )}
          </Space>
          <Space size="small">
            {record.status === 'Pending Approval' && (
              <Button 
                size="small"
                type="primary"
                onClick={() => message.success(`Reorder ${record.id} approved`)}
              >
                Approve
              </Button>
            )}
            {record.trackingNumber && (
              <Button 
                size="small"
                icon={<TruckOutlined />}
                onClick={() => message.info(`Tracking: ${record.trackingNumber}`)}
              >
                Track
              </Button>
            )}
          </Space>
        </Space>
      ),
    },
  ]

  // Suggested reorder columns
  const suggestedColumns = [
    {
      title: 'Drug Information',
      key: 'drugInfo',
      width: 200,
      render: (record: any) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.name}</Text>
          <Text type="secondary">{record.strength} {record.form}</Text>
          <Tag color={getPriorityColor(record.priority)} style={{ fontSize: '10px' }}>
            {record.priority}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Stock Status',
      key: 'stock',
      width: 150,
      render: (record: any) => (
        <Space direction="vertical" size="small">
          <Text>Current: <Text strong style={{ color: record.currentStock <= record.reorderPoint ? '#f5222d' : '#52c41a' }}>
            {record.currentStock}
          </Text></Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Min: {record.minimumStock}
          </Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Reorder at: {record.reorderPoint}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Urgency',
      key: 'urgency',
      width: 120,
      render: (record: any) => (
        <Space direction="vertical" size="small">
          <Text strong style={{ color: record.daysUntilStockout <= 7 ? '#f5222d' : '#fa8c16' }}>
            {record.daysUntilStockout} days
          </Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            until stockout
          </Text>
        </Space>
      ),
    },
    {
      title: 'Suggested Order',
      key: 'suggested',
      width: 150,
      render: (record: any) => (
        <Space direction="vertical" size="small">
          <Text>Qty: <Text strong>{record.suggestedQuantity}</Text></Text>
          <Text strong>${record.estimatedCost.toFixed(2)}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.supplier}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (record: any) => (
        <Space direction="vertical" size="small">
          <Button 
            size="small"
            type="primary"
            icon={<ShoppingCartOutlined />}
            onClick={() => {
              message.success(`Reorder created for ${record.name}`)
            }}
          >
            Create Order
          </Button>
          <Button 
            size="small"
            onClick={() => message.info(`Viewing details for ${record.name}`)}
          >
            Details
          </Button>
        </Space>
      ),
    },
  ]

  // Apply filters when dependencies change
  useEffect(() => {
    handleFilter()
  }, [searchText, statusFilter, supplierFilter, priorityFilter])

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <ShoppingCartOutlined style={{ marginRight: '8px' }} />
          Reorder Management
        </Title>
        <Text type="secondary">
          Manage reorders, track deliveries, and handle supplier communications
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Total Reorders"
              value={stats.totalReorders}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Pending Approval"
              value={stats.pendingApproval}
              prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="In Transit"
              value={stats.shipped}
              prefix={<TruckOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Delivered"
              value={stats.delivered}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Total Value"
              value={`$${stats.totalValue.toFixed(2)}`}
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Critical Items"
              value={stats.criticalItems}
              prefix={<AlertOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Critical Items Alert */}
      {stats.criticalItems > 0 && (
        <Alert
          message="Critical Stock Alert"
          description={`${stats.criticalItems} items require immediate reordering to prevent stockouts.`}
          type="error"
          showIcon
          action={
            <Button 
              size="small" 
              type="primary" 
              danger
              onClick={() => setBulkReorderModalVisible(true)}
            >
              Create Bulk Order
            </Button>
          }
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs defaultActiveKey="reorders">
        <TabPane tab="Active Reorders" key="reorders">
          {/* Filters */}
          <Card style={{ marginBottom: '24px' }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={5}>
                <Input
                  placeholder="Search reorders, suppliers, items..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={3}>
                <Select
                  placeholder="Status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: '100%' }}
                >
                  <Option value="all">All Status</Option>
                  <Option value="Pending Approval">Pending</Option>
                  <Option value="Approved">Approved</Option>
                  <Option value="Shipped">Shipped</Option>
                  <Option value="Delivered">Delivered</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Select
                  placeholder="Supplier"
                  value={supplierFilter}
                  onChange={setSupplierFilter}
                  style={{ width: '100%' }}
                >
                  <Option value="all">All Suppliers</Option>
                  {suppliers.map(supplier => (
                    <Option key={supplier} value={supplier}>{supplier}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={3}>
                <Select
                  placeholder="Priority"
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                  style={{ width: '100%' }}
                >
                  <Option value="all">All Priority</Option>
                  <Option value="Critical">Critical</Option>
                  <Option value="High">High</Option>
                  <Option value="Normal">Normal</Option>
                  <Option value="Low">Low</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={3}>
                <Button 
                  icon={<FilterOutlined />}
                  onClick={() => {
                    setSearchText('')
                    setStatusFilter('all')
                    setSupplierFilter('all')
                    setPriorityFilter('all')
                  }}
                  style={{ width: '100%' }}
                >
                  Clear
                </Button>
              </Col>
              <Col xs={24} sm={12} md={3}>
                <Button 
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateReorderModalVisible(true)}
                  style={{ width: '100%' }}
                >
                  New Order
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Reorders Table */}
          <Card>
            <Table
              columns={reorderColumns}
              dataSource={filteredReorders}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} reorders`,
              }}
              scroll={{ x: 1000 }}
              size="middle"
            />
          </Card>
        </TabPane>

        <TabPane tab={`Suggested Reorders (${stats.suggestedReordersCount})`} key="suggested">
          <Card>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>Items requiring reorder based on current stock levels</Text>
              <Button 
                type="primary" 
                icon={<ShoppingCartOutlined />}
                onClick={() => setBulkReorderModalVisible(true)}
              >
                Create Bulk Order
              </Button>
            </div>
            <Table
              columns={suggestedColumns}
              dataSource={suggestedReorders}
              rowKey="id"
              pagination={false}
              scroll={{ x: 800 }}
              size="middle"
              rowClassName={(record) => {
                if (record.priority === 'Critical') return 'critical-low-row'
                if (record.priority === 'High') return 'low-stock-row'
                return ''
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Supplier Directory" key="suppliers">
          <Row gutter={[16, 16]}>
            {suppliers.map(supplier => {
              const supplierReorders = reorders.filter(r => r.supplier === supplier)
              const totalValue = supplierReorders.reduce((sum, r) => sum + r.totalCost, 0)
              const latestReorder = supplierReorders[0]
              
              return (
                <Col xs={24} sm={12} md={8} key={supplier}>
                  <Card
                    title={
                      <Space>
                        <TeamOutlined />
                        {supplier}
                      </Space>
                    }
                    size="small"
                    extra={
                      <Tag color="blue">{supplierReorders.length} orders</Tag>
                    }
                  >
                    {latestReorder && (
                      <div>
                        <p><strong>Contact:</strong> {latestReorder.supplierContact.rep}</p>
                        <p><strong>Phone:</strong> {latestReorder.supplierContact.phone}</p>
                        <p><strong>Email:</strong> {latestReorder.supplierContact.email}</p>
                        <p><strong>Total Value:</strong> ${totalValue.toFixed(2)}</p>
                        <Space>
                          <Button size="small" icon={<PhoneOutlined />}>Call</Button>
                          <Button size="small" icon={<MailOutlined />}>Email</Button>
                          <Button size="small" icon={<ShoppingCartOutlined />}>New Order</Button>
                        </Space>
                      </div>
                    )}
                  </Card>
                </Col>
              )
            })}
          </Row>
        </TabPane>
      </Tabs>

      {/* Reorder Details Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Reorder Details - {selectedReorder?.id}
          </Space>
        }
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            Close
          </Button>,
          <Button key="print" icon={<PrinterOutlined />}>
            Print
          </Button>
        ]}
      >
        {selectedReorder && (
          <div>
            {/* Order Progress */}
            <Card title="Order Progress" style={{ marginBottom: '16px' }}>
              <Steps current={getStatusStep(selectedReorder.status)}>
                <Step title="Requested" description="Order created" />
                <Step title="Approved" description="Ready to send" />
                <Step title="Shipped" description="In transit" />
                <Step title="Delivered" description="Received" />
              </Steps>
            </Card>

            {/* Order Information */}
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="Order Information" size="small">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Reorder ID">{selectedReorder.id}</Descriptions.Item>
                    <Descriptions.Item label="Request Date">
                      {new Date(selectedReorder.requestDate).toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={getStatusColor(selectedReorder.status)}>{selectedReorder.status}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Priority">
                      <Tag color={getPriorityColor(selectedReorder.priority)}>{selectedReorder.priority}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Requested By">{selectedReorder.requestedBy}</Descriptions.Item>
                    {selectedReorder.orderNumber && (
                      <Descriptions.Item label="PO Number">{selectedReorder.orderNumber}</Descriptions.Item>
                    )}
                    {selectedReorder.trackingNumber && (
                      <Descriptions.Item label="Tracking">{selectedReorder.trackingNumber}</Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Supplier Information" size="small">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Supplier">{selectedReorder.supplier}</Descriptions.Item>
                    <Descriptions.Item label="Representative">{selectedReorder.supplierContact.rep}</Descriptions.Item>
                    <Descriptions.Item label="Phone">{selectedReorder.supplierContact.phone}</Descriptions.Item>
                    <Descriptions.Item label="Email">{selectedReorder.supplierContact.email}</Descriptions.Item>
                    <Descriptions.Item label="Estimated Delivery">
                      {selectedReorder.estimatedDelivery ? new Date(selectedReorder.estimatedDelivery).toLocaleString() : 'TBD'}
                    </Descriptions.Item>
                    {selectedReorder.deliveredDate && (
                      <Descriptions.Item label="Delivered">
                        {new Date(selectedReorder.deliveredDate).toLocaleString()}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            {/* Order Items */}
            <Card title="Order Items" style={{ marginTop: '16px' }}>
              <Table
                dataSource={selectedReorder.items}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Drug',
                    key: 'drug',
                    render: (record: any) => (
                      <div>
                        <Text strong>{record.name}</Text>
                        <br />
                        <Text type="secondary">{record.strength} {record.form}</Text>
                      </div>
                    ),
                  },
                  {
                    title: 'NDC',
                    dataIndex: 'ndc',
                    key: 'ndc',
                  },
                  {
                    title: 'Current Stock',
                    dataIndex: 'currentStock',
                    key: 'currentStock',
                  },
                  {
                    title: 'Order Qty',
                    dataIndex: 'reorderQuantity',
                    key: 'reorderQuantity',
                  },
                  {
                    title: 'Unit Cost',
                    key: 'unitCost',
                    render: (record: any) => `$${record.unitCost.toFixed(2)}`,
                  },
                  {
                    title: 'Total Cost',
                    key: 'totalCost',
                    render: (record: any) => `$${record.totalCost.toFixed(2)}`,
                  },
                  {
                    title: 'Urgency',
                    key: 'urgency',
                    render: (record: any) => (
                      <Tag color={getPriorityColor(record.urgency)}>{record.urgency}</Tag>
                    ),
                  },
                ]}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5}>
                      <Text strong>Total</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong>${selectedReorder.totalCost.toFixed(2)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} />
                  </Table.Summary.Row>
                )}
              />
            </Card>
          </div>
        )}
      </Modal>

      {/* Create Reorder Modal */}
      <Modal
        title="Create New Reorder"
        open={createReorderModalVisible}
        onCancel={() => setCreateReorderModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            console.log('New reorder:', values)
            message.success('Reorder created successfully!')
            setCreateReorderModalVisible(false)
            form.resetFields()
          }}
        >
          <Form.Item label="Supplier" name="supplier" rules={[{ required: true }]}>
            <Select placeholder="Select supplier">
              {suppliers.map(supplier => (
                <Option key={supplier} value={supplier}>{supplier}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item label="Priority" name="priority" rules={[{ required: true }]}>
            <Select placeholder="Select priority">
              <Option value="Critical">Critical</Option>
              <Option value="High">High</Option>
              <Option value="Normal">Normal</Option>
              <Option value="Low">Low</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Expected Delivery" name="expectedDelivery">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={3} placeholder="Additional notes or special instructions..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create Reorder
              </Button>
              <Button onClick={() => setCreateReorderModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Reorder Modal */}
      <Modal
        title="Create Bulk Reorder"
        open={bulkReorderModalVisible}
        onCancel={() => setBulkReorderModalVisible(false)}
        onOk={() => {
          message.success('Bulk reorder created for all critical items!')
          setBulkReorderModalVisible(false)
        }}
        width={800}
      >
        <Alert
          message="Bulk Reorder for Critical Items"
          description="This will create reorders for all items marked as critical or requiring immediate attention."
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        
        <Table
          dataSource={suggestedReorders}
          rowKey="id"
          pagination={false}
          size="small"
          columns={[
            {
              title: 'Drug',
              key: 'drug',
              render: (record: any) => (
                <div>
                  <Text strong>{record.name}</Text>
                  <br />
                  <Text type="secondary">{record.strength} {record.form}</Text>
                </div>
              ),
            },
            {
              title: 'Current Stock',
              dataIndex: 'currentStock',
              key: 'currentStock',
            },
            {
              title: 'Suggested Qty',
              dataIndex: 'suggestedQuantity',
              key: 'suggestedQuantity',
            },
            {
              title: 'Cost',
              key: 'cost',
              render: (record: any) => `$${record.estimatedCost.toFixed(2)}`,
            },
            {
              title: 'Supplier',
              dataIndex: 'supplier',
              key: 'supplier',
            },
          ]}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={3}>
                <Text strong>Total Estimated Cost</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>
                <Text strong>
                  ${suggestedReorders.reduce((sum, item) => sum + item.estimatedCost, 0).toFixed(2)}
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} />
            </Table.Summary.Row>
          )}
        />
      </Modal>

      <style>{`
        .critical-low-row {
          background-color: #fff1f0 !important;
          border-left: 4px solid #ff4d4f;
        }
        .low-stock-row {
          background-color: #fff7e6 !important;
          border-left: 4px solid #fa8c16;
        }
      `}</style>
    </div>
  )
}

export default ReorderManagement
