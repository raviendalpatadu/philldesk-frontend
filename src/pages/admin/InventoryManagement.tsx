/**
 * Admin Inventory Management
 * 
 * This component provides comprehensive inventory oversight for administrators,
 * including inventory analytics, stock monitoring, and full CRUD operations for medicines.
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
  Descriptions,
  Divider,
  Popconfirm
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
  ReloadOutlined
} from '@ant-design/icons'
import adminService, { type Medicine, type InventoryStats } from '../../services/adminService'
import AddMedicineModal from '../../components/admin/AddMedicineModal'

const { Title, Text } = Typography
const { Option } = Select

const InventoryManagement: React.FC = () => {
  // State management
  const [inventory, setInventory] = useState<Medicine[]>([])
  const [filteredInventory, setFilteredInventory] = useState<Medicine[]>([])
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [selectedItem, setSelectedItem] = useState<Medicine | null>(null)
  const [detailsVisible, setDetailsVisible] = useState(false)
  const [addMedicineVisible, setAddMedicineVisible] = useState(false)
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null)
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Load data on mount
  useEffect(() => {
    loadInventoryData()
  }, [])

  // Apply filters when filters change
  useEffect(() => {
    applyFilters()
  }, [searchText, categoryFilter, statusFilter, inventory])

  // Load inventory data from backend
  const loadInventoryData = async () => {
    try {
      setLoading(true)
      const [medicinesData, statsData] = await Promise.all([
        adminService.getAllMedicines(),
        adminService.getInventoryStats()
      ])
      
      setInventory(medicinesData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading inventory data:', error)
      message.error('Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }

  // Refresh data
  const refreshData = async () => {
    try {
      setRefreshing(true)
      await loadInventoryData()
    } finally {
      setRefreshing(false)
    }
  }

  // Apply search and filters
  const applyFilters = () => {
    let filtered = [...inventory]

    // Search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase()
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.genericName?.toLowerCase().includes(searchLower) ||
        item.manufacturer?.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower)
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => {
        const status = getItemStatus(item)
        return status === statusFilter
      })
    }

    setFilteredInventory(filtered)
  }

  // Get item status
  const getItemStatus = (item: Medicine): string => {
    if (item.quantity === 0) return 'Out of Stock'
    if (item.quantity <= item.reorderLevel) return 'Low Stock'
    return 'In Stock'
  }

  // Get status display component
  const getStatusDisplay = (item: Medicine) => {
    const status = getItemStatus(item)
    
    if (status === 'Out of Stock') {
      return <Tag color="red" icon={<AlertOutlined />}>Out of Stock</Tag>
    }
    if (status === 'Low Stock') {
      return <Tag color="orange" icon={<WarningOutlined />}>Low Stock</Tag>
    }
    return <Tag color="green" icon={<CheckCircleOutlined />}>In Stock</Tag>
  }

  // Get stock color helper
  const getStockColor = (current: number, reorderLevel: number) => {
    if (current === 0) return '#ff4d4f'
    if (current <= reorderLevel) return '#fa8c16'
    return '#52c41a'
  }

  // Get stock level percentage
  const getStockPercentage = (current: number, reorderLevel: number) => {
    const max = Math.max(reorderLevel * 3, current) // Estimate max as 3x reorder level
    return Math.min(Math.round((current / max) * 100), 100)
  }

  // Handle add medicine
  const handleAddMedicine = () => {
    setEditingMedicine(null)
    setAddMedicineVisible(true)
  }

  // Handle edit medicine
  const handleEditMedicine = (medicine: Medicine) => {
    setEditingMedicine(medicine)
    setAddMedicineVisible(true)
  }

  // Handle delete medicine
  const handleDeleteMedicine = async (medicine: Medicine) => {
    try {
      await adminService.deleteMedicine(medicine.id!)
      message.success(`Medicine "${medicine.name}" deleted successfully`)
      await loadInventoryData() // Refresh data
    } catch (error) {
      console.error('Error deleting medicine:', error)
      message.error('Failed to delete medicine')
    }
  }

  // Handle medicine modal success
  const handleMedicineModalSuccess = async () => {
    await loadInventoryData() // Refresh data after add/edit
  }

  // View item details
  const viewItemDetails = (item: Medicine) => {
    setSelectedItem(item)
    setDetailsVisible(true)
  }

  // Clear filters
  const clearFilters = () => {
    setSearchText('')
    setCategoryFilter('all')
    setStatusFilter('all')
  }

  // Export inventory
  const handleExport = async () => {
    try {
      const blob = await adminService.exportInventory('csv')
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      message.success('Inventory exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      message.error('Failed to export inventory')
    }
  }

  // Inventory table columns
  const inventoryColumns = [
    {
      title: 'Medicine',
      key: 'medicine',
      width: 250,
      render: (_: any, record: Medicine) => (
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
      sorter: (a: Medicine, b: Medicine) => a.quantity - b.quantity,
      render: (_: any, record: Medicine) => (
        <Space direction="vertical" size="small">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text strong>{record.quantity}</Text>
            <Text type="secondary">units</Text>
          </div>
          <Progress
            percent={getStockPercentage(record.quantity, record.reorderLevel)}
            size="small"
            strokeColor={getStockColor(record.quantity, record.reorderLevel)}
            trailColor={record.quantity === 0 ? '#ffccc7' : undefined}
          />
          <Text style={{ fontSize: '12px', color: '#666' }}>
            Reorder at: {record.reorderLevel}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Price',
      key: 'price',
      width: 120,
      sorter: (a: Medicine, b: Medicine) => a.unitPrice - b.unitPrice,
      render: (_: any, record: Medicine) => (
        <Space direction="vertical" size="small">
          <Text strong>${record.unitPrice.toFixed(2)}</Text>
          <Text style={{ fontSize: '12px', color: '#666' }}>
            per unit
          </Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 130,
      filters: [
        { text: 'In Stock', value: 'In Stock' },
        { text: 'Low Stock', value: 'Low Stock' },
        { text: 'Out of Stock', value: 'Out of Stock' },
      ],
      onFilter: (value: any, record: Medicine) => {
        const status = getItemStatus(record)
        return status === value
      },
      render: (_: any, record: Medicine) => getStatusDisplay(record),
    },
    {
      title: 'Expiry',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 120,
      sorter: (a: Medicine, b: Medicine) => {
        const dateA = a.expiryDate ? new Date(a.expiryDate).getTime() : 0
        const dateB = b.expiryDate ? new Date(b.expiryDate).getTime() : 0
        return dateA - dateB
      },
      render: (expiryDate: string) => {
        if (!expiryDate) return <Text type="secondary">Not set</Text>
        
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
      render: (_: any, record: Medicine) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => viewItemDetails(record)}
            />
          </Tooltip>
          
          <Tooltip title="Edit Medicine">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleEditMedicine(record)}
            />
          </Tooltip>
          
          <Popconfirm
            title="Delete Medicine"
            description={`Are you sure you want to delete "${record.name}"?`}
            onConfirm={() => handleDeleteMedicine(record)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete Medicine">
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                size="small"
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

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
              value={stats?.totalItems || 0}
              prefix={<DatabaseOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Value"
              value={stats?.totalValue || 0}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#52c41a' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Low Stock"
              value={stats?.lowStock || 0}
              prefix={<WarningOutlined style={{ color: '#fa541c' }} />}
              valueStyle={{ color: '#fa541c' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Out of Stock"
              value={stats?.outOfStock || 0}
              prefix={<AlertOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24}>
          {stats && stats.outOfStock > 0 && (
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
          
          {stats && stats.lowStock > 0 && (
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
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search by name, category, or manufacturer..."
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
            <Space wrap align='center'>
              <Button 
                icon={<FilterOutlined />}
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
              <Button 
                icon={<ReloadOutlined />}
                loading={refreshing}
                onClick={refreshData}
              >
                Refresh
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleAddMedicine}
              >
                Add Medicine
              </Button>
              <Button 
                icon={<ExportOutlined />}
                onClick={handleExport}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Content */}
      <Card>
        <Table
          columns={inventoryColumns}
          dataSource={filteredInventory}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: 1200 }}
          size="middle"
          rowClassName={(record: Medicine) => {
            const status = getItemStatus(record)
            if (status === 'Out of Stock') return 'out-of-stock-row'
            if (status === 'Low Stock') return 'low-stock-row'
            return ''
          }}
        />
      </Card>

      {/* Add/Edit Medicine Modal */}
      <AddMedicineModal
        visible={addMedicineVisible}
        onCancel={() => setAddMedicineVisible(false)}
        onSuccess={handleMedicineModalSuccess}
        editingMedicine={editingMedicine}
        mode={editingMedicine ? 'edit' : 'add'}
      />

      {/* Item Details Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            Medicine Details
          </Space>
        }
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Close
          </Button>,
          <Button 
            key="edit" 
            type="primary" 
            onClick={() => {
              setDetailsVisible(false)
              if (selectedItem) handleEditMedicine(selectedItem)
            }}
          >
            Edit Medicine
          </Button>,
        ]}
      >
        {selectedItem && (
          <div>
            <Descriptions column={2} size="small" style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="Medicine Name">{selectedItem.name}</Descriptions.Item>
              <Descriptions.Item label="Generic Name">{selectedItem.genericName || 'Not specified'}</Descriptions.Item>
              <Descriptions.Item label="Category">{selectedItem.category}</Descriptions.Item>
              <Descriptions.Item label="Manufacturer">{selectedItem.manufacturer}</Descriptions.Item>
              <Descriptions.Item label="Strength">{selectedItem.strength}</Descriptions.Item>
              <Descriptions.Item label="Dosage Form">{selectedItem.dosageForm}</Descriptions.Item>
              <Descriptions.Item label="Current Stock">{selectedItem.quantity} units</Descriptions.Item>
              <Descriptions.Item label="Reorder Level">{selectedItem.reorderLevel} units</Descriptions.Item>
              <Descriptions.Item label="Unit Price">${selectedItem.unitPrice.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="Cost Price">{selectedItem.costPrice ? `$${selectedItem.costPrice.toFixed(2)}` : 'Not set'}</Descriptions.Item>
              <Descriptions.Item label="Batch Number">{selectedItem.batchNumber || 'Not specified'}</Descriptions.Item>
              <Descriptions.Item label="Expiry Date">
                {selectedItem.expiryDate ? new Date(selectedItem.expiryDate).toLocaleDateString() : 'Not set'}
              </Descriptions.Item>
              <Descriptions.Item label="Prescription Required">
                {selectedItem.isPrescriptionRequired ? 'Yes' : 'No'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {selectedItem.isActive ? 'Active' : 'Inactive'}
              </Descriptions.Item>
            </Descriptions>

            {selectedItem.description && (
              <>
                <Divider />
                <div>
                  <Text strong>Description:</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Text>{selectedItem.description}</Text>
                  </div>
                </div>
              </>
            )}

            <Divider />

            <Row gutter={16}>
              <Col span={12}>
                <Card title="Stock Status" size="small">
                  {getStatusDisplay(selectedItem)}
                  <div style={{ marginTop: '8px' }}>
                    <Progress
                      percent={getStockPercentage(selectedItem.quantity, selectedItem.reorderLevel)}
                      strokeColor={getStockColor(selectedItem.quantity, selectedItem.reorderLevel)}
                    />
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Expiry Status" size="small">
                  {(() => {
                    if (!selectedItem.expiryDate) {
                      return <Tag color="default">No expiry date set</Tag>
                    }
                    
                    const expiry = new Date(selectedItem.expiryDate)
                    const today = new Date()
                    const diffTime = expiry.getTime() - today.getTime()
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    
                    if (diffDays < 0) {
                      return <Tag color="red">Expired {Math.abs(diffDays)} days ago</Tag>
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
