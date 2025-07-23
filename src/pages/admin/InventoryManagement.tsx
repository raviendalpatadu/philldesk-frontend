/**
 * Admin Inventory Management
 * 
 * This component provides comprehensive inventory oversight for administrators,
 * including inventory analytics, stock monitoring, supplier management, and system-wide inventory control.
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
  Progress,
  Alert,
  Tabs,
  Descriptions,
  Badge,
  Divider
} from 'antd'
import { 
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  WarningOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  CalendarOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography
const { Option } = Select
const { TabPane } = Tabs

// Mock data for inventory
const mockInventory = [
  {
    key: '1',
    id: 'MED-001',
    name: 'Paracetamol 500mg',
    category: 'Pain Relief',
    supplier: 'PharmaCorp Ltd',
    currentStock: 250,
    minStock: 50,
    maxStock: 500,
    unitPrice: 0.52,
    totalValue: 130.00,
    expiryDate: '2025-08-15',
    batchNumber: 'PC001-2024',
    status: 'In Stock',
    lastUpdated: '2024-01-17T10:30:00Z',
    location: 'Shelf A-12',
    prescriptionRequired: false
  },
  {
    key: '2',
    id: 'MED-002',
    name: 'Amoxicillin 250mg',
    category: 'Antibiotics',
    supplier: 'MediSupply Inc',
    currentStock: 15,
    minStock: 25,
    maxStock: 200,
    unitPrice: 1.50,
    totalValue: 22.50,
    expiryDate: '2024-12-30',
    batchNumber: 'MS002-2024',
    status: 'Low Stock',
    lastUpdated: '2024-01-16T14:20:00Z',
    location: 'Shelf B-5',
    prescriptionRequired: true
  },
  {
    key: '3',
    id: 'MED-003',
    name: 'Insulin Pen',
    category: 'Diabetes',
    supplier: 'DiabetesCare Solutions',
    currentStock: 0,
    minStock: 10,
    maxStock: 50,
    unitPrice: 16.00,
    totalValue: 0.00,
    expiryDate: '2025-06-20',
    batchNumber: 'DC003-2024',
    status: 'Out of Stock',
    lastUpdated: '2024-01-15T09:45:00Z',
    location: 'Fridge Unit 1',
    prescriptionRequired: true
  },
  {
    key: '4',
    id: 'MED-004',
    name: 'Vitamin D3 1000IU',
    category: 'Vitamins',
    supplier: 'VitaHealth Co',
    currentStock: 180,
    minStock: 30,
    maxStock: 300,
    unitPrice: 0.25,
    totalValue: 45.00,
    expiryDate: '2026-03-10',
    batchNumber: 'VH004-2024',
    status: 'In Stock',
    lastUpdated: '2024-01-17T11:15:00Z',
    location: 'Shelf C-8',
    prescriptionRequired: false
  },
  {
    key: '5',
    id: 'MED-005',
    name: 'Lisinopril 10mg',
    category: 'Cardiovascular',
    supplier: 'CardioMed Ltd',
    currentStock: 42,
    minStock: 40,
    maxStock: 150,
    unitPrice: 0.28,
    totalValue: 11.76,
    expiryDate: '2024-11-15',
    batchNumber: 'CM005-2024',
    status: 'Low Stock',
    lastUpdated: '2024-01-16T16:30:00Z',
    location: 'Shelf A-18',
    prescriptionRequired: true
  }
]

// Mock supplier data
const mockSuppliers = [
  {
    key: '1',
    id: 'SUP-001',
    name: 'PharmaCorp Ltd',
    contact: 'John Wilson',
    email: 'orders@pharmacorp.com',
    phone: '+1-555-1001',
    products: 156,
    totalOrders: 24,
    reliability: 98,
    lastOrder: '2024-01-15'
  },
  {
    key: '2',
    id: 'SUP-002',
    name: 'MediSupply Inc',
    contact: 'Sarah Davis',
    email: 'supply@medisupply.com',
    phone: '+1-555-1002',
    products: 89,
    totalOrders: 18,
    reliability: 95,
    lastOrder: '2024-01-12'
  }
]

const InventoryManagement: React.FC = () => {
  const [inventory] = useState(mockInventory)
  const [suppliers] = useState(mockSuppliers)
  const [filteredInventory, setFilteredInventory] = useState(mockInventory)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [detailsVisible, setDetailsVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('inventory')

  // Calculate statistics
  const stats = {
    totalItems: inventory.length,
    inStock: inventory.filter(item => item.status === 'In Stock').length,
    lowStock: inventory.filter(item => item.status === 'Low Stock').length,
    outOfStock: inventory.filter(item => item.status === 'Out of Stock').length,
    totalValue: inventory.reduce((sum, item) => sum + item.totalValue, 0),
    expiringItems: inventory.filter(item => {
      const expiryDate = new Date(item.expiryDate)
      const today = new Date()
      const diffTime = expiryDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 90 && diffDays > 0
    }).length,
    expiredItems: inventory.filter(item => {
      const expiryDate = new Date(item.expiryDate)
      const today = new Date()
      return expiryDate < today
    }).length,
    suppliersCount: suppliers.length
  }

  // Filter inventory
  const handleFilter = () => {
    let filtered = inventory

    if (searchText) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.id.toLowerCase().includes(searchText.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchText.toLowerCase())
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter)
    }

    setFilteredInventory(filtered)
  }

  // Get status display
  const getStatusDisplay = (_: string, currentStock: number, minStock: number) => {
    if (currentStock === 0) {
      return <Tag color="red" icon={<AlertOutlined />}>Out of Stock</Tag>
    }
    if (currentStock <= minStock) {
      return <Tag color="orange" icon={<WarningOutlined />}>Low Stock</Tag>
    }
    return <Tag color="green" icon={<CheckCircleOutlined />}>In Stock</Tag>
  }

  // Get stock color helper
  const getStockColor = (current: number, min: number) => {
    if (current === 0) return '#ff4d4f'
    if (current <= min) return '#fa8c16'
    return '#52c41a'
  }

  // Get reliability color helper
  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 95) return '#52c41a'
    if (reliability >= 90) return '#fa8c16'
    return '#ff4d4f'
  }

  // Get stock level percentage
  const getStockPercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100)
  }

  // View item details
  const viewItemDetails = (item: any) => {
    setSelectedItem(item)
    setDetailsVisible(true)
  }

  // Inventory table columns
  const inventoryColumns = [
    {
      title: 'Medicine',
      key: 'medicine',
      width: 250,
      render: (_: any, record: any) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.name}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ID: {record.id}
          </Text>
          <Tag>{record.category}</Tag>
        </Space>
      ),
    },
    {
      title: 'Stock Level',
      key: 'stock',
      width: 180,
      sorter: (a: any, b: any) => a.currentStock - b.currentStock,
      render: (_: any, record: any) => (
        <Space direction="vertical" size="small">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text strong>{record.currentStock}</Text>
            <Text type="secondary">/ {record.maxStock}</Text>
          </div>
          <Progress
            percent={getStockPercentage(record.currentStock, record.maxStock)}
            size="small"
            strokeColor={getStockColor(record.currentStock, record.minStock)}
          />
          <Text style={{ fontSize: '12px', color: '#666' }}>
            Min: {record.minStock}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Value',
      key: 'value',
      width: 120,
      sorter: (a: any, b: any) => a.totalValue - b.totalValue,
      render: (_: any, record: any) => (
        <Space direction="vertical" size="small">
          <Text strong>${record.totalValue.toFixed(2)}</Text>
          <Text style={{ fontSize: '12px', color: '#666' }}>
            @${record.unitPrice.toFixed(2)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      filters: [
        { text: 'In Stock', value: 'In Stock' },
        { text: 'Low Stock', value: 'Low Stock' },
        { text: 'Out of Stock', value: 'Out of Stock' },
      ],
      onFilter: (value: any, record: any) => record.status === value,
      render: (status: string, record: any) => 
        getStatusDisplay(status, record.currentStock, record.minStock),
    },
    {
      title: 'Expiry',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 120,
      sorter: (a: any, b: any) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime(),
      render: (expiryDate: string) => {
        const expiry = new Date(expiryDate)
        const today = new Date()
        const diffTime = expiry.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        let color = 'default'
        if (diffDays < 0) color = 'red'
        else if (diffDays <= 30) color = 'red'
        else if (diffDays <= 90) color = 'orange'
        
        return (
          <Tag color={color}>
            {expiry.toLocaleDateString()}
          </Tag>
        )
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => viewItemDetails(record)}
            />
          </Tooltip>
          
          <Tooltip title="Edit Item">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => message.info('Edit functionality')}
            />
          </Tooltip>
          
          <Tooltip title="Delete Item">
            <Button 
              type="text" 
              icon={<DeleteOutlined />} 
              size="small"
              danger
              onClick={() => message.warning('Delete functionality')}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  // Supplier table columns
  const supplierColumns = [
    {
      title: 'Supplier',
      key: 'supplier',
      render: (_: any, record: any) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.name}</Text>
          <Text type="secondary">{record.id}</Text>
          <Text style={{ fontSize: '12px', color: '#666' }}>
            Contact: {record.contact}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Contact Info',
      key: 'contact',
      render: (_: any, record: any) => (
        <Space direction="vertical" size="small">
          <Text style={{ fontSize: '12px' }}>{record.email}</Text>
          <Text style={{ fontSize: '12px' }}>{record.phone}</Text>
        </Space>
      ),
    },
    {
      title: 'Products',
      dataIndex: 'products',
      key: 'products',
      render: (products: number) => <Badge count={products} showZero />,
    },
    {
      title: 'Reliability',
      dataIndex: 'reliability',
      key: 'reliability',
      render: (reliability: number) => (
        <Progress
          percent={reliability}
          size="small"
          strokeColor={getReliabilityColor(reliability)}
        />
      ),
    },
    {
      title: 'Last Order',
      dataIndex: 'lastOrder',
      key: 'lastOrder',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ]

  // Apply filters
  useEffect(() => {
    handleFilter()
  }, [searchText, categoryFilter, statusFilter])

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <DatabaseOutlined style={{ marginRight: '8px' }} />
          Inventory Management
        </Title>
        <Text type="secondary">
          Comprehensive inventory oversight and management
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Items"
              value={stats.totalItems}
              prefix={<DatabaseOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Value"
              value={stats.totalValue}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Low Stock"
              value={stats.lowStock}
              prefix={<WarningOutlined style={{ color: '#fa541c' }} />}
              valueStyle={{ color: '#fa541c' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Expiring Soon"
              value={stats.expiringItems}
              prefix={<CalendarOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24}>
          {stats.outOfStock > 0 && (
            <Alert
              message={`${stats.outOfStock} item(s) are out of stock`}
              description="Immediate restocking required to prevent prescription delays."
              type="error"
              showIcon
              action={
                <Button size="small" type="primary" onClick={() => setStatusFilter('Out of Stock')}>
                  View Items
                </Button>
              }
              style={{ marginBottom: '16px' }}
            />
          )}
          
          {stats.lowStock > 0 && (
            <Alert
              message={`${stats.lowStock} item(s) have low stock levels`}
              description="Consider creating reorder requests to maintain adequate inventory."
              type="warning"
              showIcon
              action={
                <Button size="small" onClick={() => setStatusFilter('Low Stock')}>
                  View Items
                </Button>
              }
              style={{ marginBottom: '16px' }}
            />
          )}
          
          {stats.expiringItems > 0 && (
            <Alert
              message={`${stats.expiringItems} item(s) expire within 90 days`}
              description="Review expiry dates and consider promotional strategies for near-expiry items."
              type="info"
              showIcon
            />
          )}
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search by name, ID, or supplier..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">All Categories</Option>
              <Option value="Pain Relief">Pain Relief</Option>
              <Option value="Antibiotics">Antibiotics</Option>
              <Option value="Diabetes">Diabetes</Option>
              <Option value="Vitamins">Vitamins</Option>
              <Option value="Cardiovascular">Cardiovascular</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">All Status</Option>
              <Option value="In Stock">In Stock</Option>
              <Option value="Low Stock">Low Stock</Option>
              <Option value="Out of Stock">Out of Stock</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space>
              <Button 
                icon={<FilterOutlined />}
                onClick={() => {
                  setSearchText('')
                  setCategoryFilter('all')
                  setStatusFilter('all')
                  setFilteredInventory(inventory)
                }}
              >
                Clear Filters
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => message.info('Add new item functionality')}
              >
                Add Item
              </Button>
              <Button 
                icon={<ExportOutlined />}
                onClick={() => message.success('Inventory exported!')}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Content Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={`Inventory (${stats.totalItems})`} key="inventory">
            <Table
              columns={inventoryColumns}
              dataSource={filteredInventory}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              }}
              scroll={{ x: 1200 }}
              size="middle"
            />
          </TabPane>
          
          <TabPane tab={`Suppliers (${stats.suppliersCount})`} key="suppliers">
            <Table
              columns={supplierColumns}
              dataSource={suppliers}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} suppliers`,
              }}
              size="middle"
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Item Details Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            Item Details
          </Space>
        }
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Close
          </Button>,
          <Button key="edit" type="primary" onClick={() => message.info('Edit functionality')}>
            Edit Item
          </Button>,
        ]}
      >
        {selectedItem && (
          <div>
            <Descriptions column={2} size="small" style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="Medicine Name">{selectedItem.name}</Descriptions.Item>
              <Descriptions.Item label="Item ID">{selectedItem.id}</Descriptions.Item>
              <Descriptions.Item label="Category">{selectedItem.category}</Descriptions.Item>
              <Descriptions.Item label="Supplier">{selectedItem.supplier}</Descriptions.Item>
              <Descriptions.Item label="Current Stock">{selectedItem.currentStock}</Descriptions.Item>
              <Descriptions.Item label="Min Stock Level">{selectedItem.minStock}</Descriptions.Item>
              <Descriptions.Item label="Max Stock Level">{selectedItem.maxStock}</Descriptions.Item>
              <Descriptions.Item label="Unit Price">${selectedItem.unitPrice.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="Total Value">${selectedItem.totalValue.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="Location">{selectedItem.location}</Descriptions.Item>
              <Descriptions.Item label="Batch Number">{selectedItem.batchNumber}</Descriptions.Item>
              <Descriptions.Item label="Expiry Date">{new Date(selectedItem.expiryDate).toLocaleDateString()}</Descriptions.Item>
              <Descriptions.Item label="Prescription Required">
                {selectedItem.prescriptionRequired ? 'Yes' : 'No'}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {new Date(selectedItem.lastUpdated).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Row gutter={16}>
              <Col span={12}>
                <Card title="Stock Status" size="small">
                  {getStatusDisplay(selectedItem.status, selectedItem.currentStock, selectedItem.minStock)}
                  <div style={{ marginTop: '8px' }}>
                    <Progress
                      percent={getStockPercentage(selectedItem.currentStock, selectedItem.maxStock)}
                      strokeColor={getStockColor(selectedItem.currentStock, selectedItem.minStock)}
                    />
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Expiry Status" size="small">
                  {(() => {
                    const expiry = new Date(selectedItem.expiryDate)
                    const today = new Date()
                    const diffTime = expiry.getTime() - today.getTime()
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    
                    if (diffDays < 0) {
                      return <Tag color="red">Expired</Tag>
                    } else if (diffDays <= 30) {
                      return <Tag color="red">Expires in {diffDays} days</Tag>
                    } else if (diffDays <= 90) {
                      return <Tag color="orange">Expires in {diffDays} days</Tag>
                    } else {
                      return <Tag color="green">Valid for {diffDays} days</Tag>
                    }
                  })()}
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default InventoryManagement
