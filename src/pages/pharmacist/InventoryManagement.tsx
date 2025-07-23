/**
 * Pharmacist Inventory Management
 * 
 * This component provides comprehensive inventory management functionality for pharmacists,
 * including stock monitoring, reorder management, and inventory analytics.
 */

import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
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
  Spin,
  Alert
} from 'antd'
import { 
  SearchOutlined,
  FilterOutlined,
  BoxPlotOutlined,
  WarningOutlined,
  AlertOutlined,
  BarChartOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  PrinterOutlined,
  EyeOutlined,
  PlusOutlined
} from '@ant-design/icons'
import { pharmacistService } from '../../services/pharmacistService'

const { Title, Text } = Typography
const { Option } = Select

// Mock inventory data (same as in PrescriptionManagement)
const mockInventory = [
  {
    id: 'INV-001',
    name: 'Lisinopril',
    strength: '10mg',
    form: 'Tablet',
    ndc: '12345-678-90',
    manufacturer: 'CardioMeds Inc',
    currentStock: 45,
    minimumStock: 100,
    maximumStock: 500,
    unitCost: 0.85,
    totalValue: 38.25,
    lastRestocked: '2025-07-10T09:00:00',
    expiryDate: '2025-12-31',
    lotNumbers: ['LOT123456', 'LOT123457'],
    status: 'Low Stock',
    category: 'Cardiovascular',
    supplier: 'MedSupply Co',
    location: 'Aisle A, Shelf 3',
    reorderPoint: 100,
    reorderQuantity: 300
  },
  {
    id: 'INV-002',
    name: 'Metformin',
    strength: '500mg',
    form: 'Tablet',
    ndc: '98765-432-10',
    manufacturer: 'DiabetesCare LLC',
    currentStock: 250,
    minimumStock: 150,
    maximumStock: 800,
    unitCost: 0.31,
    totalValue: 77.50,
    lastRestocked: '2025-07-15T14:30:00',
    expiryDate: '2026-06-30',
    lotNumbers: ['LOT789012', 'LOT789013'],
    status: 'In Stock',
    category: 'Endocrine',
    supplier: 'PharmaCorp',
    location: 'Aisle B, Shelf 1',
    reorderPoint: 150,
    reorderQuantity: 400
  },
  {
    id: 'INV-003',
    name: 'Sumatriptan',
    strength: '50mg',
    form: 'Tablet',
    ndc: '11111-222-33',
    manufacturer: 'NeuroPharm Co',
    currentStock: 8,
    minimumStock: 25,
    maximumStock: 100,
    unitCost: 13.33,
    totalValue: 106.64,
    lastRestocked: '2025-06-20T11:00:00',
    expiryDate: '2025-09-15',
    lotNumbers: ['LOT345678'],
    status: 'Critical Low',
    category: 'Neurology',
    supplier: 'SpecialtyMeds Inc',
    location: 'Refrigerated Section A',
    reorderPoint: 25,
    reorderQuantity: 50
  },
  {
    id: 'INV-004',
    name: 'Omeprazole',
    strength: '20mg',
    form: 'Capsule',
    ndc: '44444-555-66',
    manufacturer: 'GastroCare Inc',
    currentStock: 180,
    minimumStock: 75,
    maximumStock: 300,
    unitCost: 0.51,
    totalValue: 91.80,
    lastRestocked: '2025-07-12T16:45:00',
    expiryDate: '2026-03-20',
    lotNumbers: ['LOT901234', 'LOT901235'],
    status: 'In Stock',
    category: 'Gastrointestinal',
    supplier: 'MedSupply Co',
    location: 'Aisle C, Shelf 2',
    reorderPoint: 75,
    reorderQuantity: 200
  },
  {
    id: 'INV-005',
    name: 'Tretinoin',
    strength: '0.025%',
    form: 'Cream',
    ndc: '77777-888-99',
    manufacturer: 'DermaCare Solutions',
    currentStock: 0,
    minimumStock: 15,
    maximumStock: 50,
    unitCost: 1.90,
    totalValue: 0.00,
    lastRestocked: '2025-06-01T10:00:00',
    expiryDate: '2025-08-10',
    lotNumbers: [],
    status: 'Out of Stock',
    category: 'Dermatology',
    supplier: 'SpecialtyMeds Inc',
    location: 'Aisle D, Shelf 4',
    reorderPoint: 15,
    reorderQuantity: 30
  },
  {
    id: 'INV-006',
    name: 'Amlodipine',
    strength: '5mg',
    form: 'Tablet',
    ndc: '12345-111-22',
    manufacturer: 'CardioPharm',
    currentStock: 320,
    minimumStock: 100,
    maximumStock: 500,
    unitCost: 0.67,
    totalValue: 214.40,
    lastRestocked: '2025-07-16T13:20:00',
    expiryDate: '2026-12-31',
    lotNumbers: ['LOT202507', 'LOT202508'],
    status: 'In Stock',
    category: 'Cardiovascular',
    supplier: 'PharmaCorp',
    location: 'Aisle A, Shelf 2',
    reorderPoint: 100,
    reorderQuantity: 250
  },
  {
    id: 'INV-007',
    name: 'Ciprofloxacin',
    strength: '500mg',
    form: 'Tablet',
    ndc: '54321-678-90',
    manufacturer: 'AntibioPharm',
    currentStock: 85,
    minimumStock: 50,
    maximumStock: 200,
    unitCost: 2.50,
    totalValue: 212.50,
    lastRestocked: '2025-07-14T08:15:00',
    expiryDate: '2026-08-15',
    lotNumbers: ['LOT202507B'],
    status: 'In Stock',
    category: 'Anti-infective',
    supplier: 'AntibioSupply Ltd',
    location: 'Secure Cabinet B',
    reorderPoint: 50,
    reorderQuantity: 100
  },
  {
    id: 'INV-008',
    name: 'Ibuprofen',
    strength: '200mg',
    form: 'Tablet',
    ndc: '99999-123-45',
    manufacturer: 'PainRelief Corp',
    currentStock: 15,
    minimumStock: 200,
    maximumStock: 1000,
    unitCost: 0.05,
    totalValue: 0.75,
    lastRestocked: '2025-05-30T14:00:00',
    expiryDate: '2026-10-31',
    lotNumbers: ['LOT555666'],
    status: 'Critical Low',
    category: 'Pain Management',
    supplier: 'OTC Distributors',
    location: 'Aisle E, Shelf 1',
    reorderPoint: 200,
    reorderQuantity: 500
  }
]

const InventoryManagement: React.FC = () => {
  const location = useLocation()
  const [inventory, setInventory] = useState<any[]>([])
  const [filteredInventory, setFilteredInventory] = useState<any[]>([])
  const [inventoryData, setInventoryData] = useState<any>({})
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [detailsModalVisible, setDetailsModalVisible] = useState(false)
  const [reorderModalVisible, setReorderModalVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    loadInventoryData()
  }, [])

  // Load inventory data from API
  const loadInventoryData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await pharmacistService.getInventoryData()
      
      // Transform API data to match our component structure
      const transformedInventory = transformInventoryData(data.medicines || [])
      setInventory(transformedInventory)
      setFilteredInventory(transformedInventory)
      setInventoryData(data)
    } catch (error) {
      console.warn('API call failed, using mock data for development:', error)
      setError('Failed to load inventory data from server. Using offline data.')
      
      // Fall back to mock data
      const transformedMockData = transformInventoryData(mockInventory)
      setInventory(transformedMockData)
      setFilteredInventory(transformedMockData)
      setInventoryData({
        medicines: mockInventory,
        lowStock: mockInventory.filter(item => item.status === 'Low Stock'),
        criticalLow: mockInventory.filter(item => item.status === 'Critical Low'),
        outOfStock: mockInventory.filter(item => item.status === 'Out of Stock')
      })
    } finally {
      setLoading(false)
    }
  }

  // Transform inventory data to ensure consistent structure
  const transformInventoryData = (items: any[]) => {
    return items.map(item => ({
      ...item,
      // Map API fields to component expected fields
      id: item.id || item.medicineId || `INV-${Math.random().toString(36).substr(2, 9)}`,
      currentStock: item.currentStock || item.quantity || 0,
      unitCost: item.unitCost || item.unitPrice || item.costPrice || 0,
      totalValue: item.totalValue || ((item.quantity || 0) * (item.unitPrice || item.costPrice || 0)),
      minimumStock: item.minimumStock || item.reorderLevel || 0,
      maximumStock: item.maximumStock || (item.reorderLevel ? item.reorderLevel * 5 : 100),
      status: item.status || calculateStatus(item),
      ndc: item.ndc || 'N/A',
      form: item.form || item.dosageForm || 'Unknown',
      location: item.location || 'Main Pharmacy',
      supplier: item.supplier || 'Unknown Supplier',
      lastRestocked: item.lastRestocked || new Date().toISOString(),
      expiryDate: item.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      lotNumbers: item.lotNumbers || (item.batchNumber ? [item.batchNumber] : []),
      reorderPoint: item.reorderPoint || item.reorderLevel || 0,
      reorderQuantity: item.reorderQuantity || (item.reorderLevel ? item.reorderLevel * 2 : 50)
    }))
  }

  // Calculate status based on stock levels if not provided
  const calculateStatus = (item: any) => {
    const stock = item.currentStock || item.quantity || 0
    const minStock = item.minimumStock || item.reorderLevel || 0
    
    if (stock === 0) return 'Out of Stock'
    if (stock <= 5) return 'Critical Low'
    if (stock <= minStock) return 'Low Stock'
    return 'In Stock'
  }

  // Handle URL parameters for filtering
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const filter = params.get('filter')
    
    if (filter === 'low-stock') {
      setStatusFilter('Low Stock')
    } else if (filter === 'out-of-stock') {
      setStatusFilter('Out of Stock')
    } else if (filter === 'critical-low') {
      setStatusFilter('Critical Low')
    }
  }, [location.search])

  // Filter inventory based on search and filters
  const handleFilter = () => {
    let filtered = inventory

    if (searchText) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.category.toLowerCase().includes(searchText.toLowerCase()) ||
        item.manufacturer.toLowerCase().includes(searchText.toLowerCase()) ||
        item.ndc.includes(searchText)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter)
    }

    setFilteredInventory(filtered)
  }

  // Calculate statistics
  const stats = {
    totalItems: inventory.length,
    lowStockItems: inventory.filter(item => item.status === 'Low Stock' || item.status === 'Critical Low').length,
    outOfStockItems: inventory.filter(item => item.status === 'Out of Stock').length,
    criticalLowItems: inventory.filter(item => item.status === 'Critical Low').length,
    totalValue: inventory.reduce((total, item) => total + item.totalValue, 0),
    categoriesCount: [...new Set(inventory.map(item => item.category))].length
  }

  // Get unique categories for filter
  const categories = [...new Set(inventory.map(item => item.category))]

  // Table columns
  const columns = [
    {
      title: 'Drug Information',
      key: 'drugInfo',
      width: 250,
      render: (record: any) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.name}</Text>
          <Text type="secondary">{record.strength} {record.form}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            NDC: {record.ndc}
          </Text>
          <Tag color="blue" style={{ fontSize: '10px' }}>
            {record.category}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Stock Status',
      key: 'stock',
      width: 150,
      render: (record: any) => {
        const getStockColor = () => {
          if (record.status === 'Out of Stock') return '#f5222d'
          if (record.status === 'Critical Low') return '#ff4d4f'
          if (record.status === 'Low Stock') return '#fa8c16'
          return '#52c41a'
        }
        
        const getPercentage = () => {
          return ((record.currentStock / record.maximumStock) * 100).toFixed(1)
        }
        
        return (
          <Space direction="vertical" size="small">
            <Text strong style={{ color: getStockColor(), fontSize: '16px' }}>
              {record.currentStock}
            </Text>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Min: {record.minimumStock} | Max: {record.maximumStock}
            </Text>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Fill: {getPercentage()}%
            </Text>
          </Space>
        )
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (record: any) => {
        const getStatusColor = () => {
          switch (record.status) {
            case 'Out of Stock': return 'red'
            case 'Critical Low': return 'red'
            case 'Low Stock': return 'orange'
            case 'In Stock': return 'green'
            default: return 'default'
          }
        }
        
        return <Tag color={getStatusColor()}>{record.status}</Tag>
      },
    },
    {
      title: 'Value & Cost',
      key: 'value',
      width: 130,
      render: (record: any) => (
        <Space direction="vertical" size="small">
          <Text strong>${(record.totalValue || 0).toFixed(2)}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Unit: ${(record.unitCost || 0).toFixed(2)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Location & Supplier',
      key: 'location',
      width: 200,
      render: (record: any) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.location}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.supplier}
          </Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.manufacturer}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Expiry & Lots',
      key: 'expiry',
      width: 140,
      render: (record: any) => {
        const expiryDate = new Date(record.expiryDate)
        const today = new Date()
        const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const isExpiringSoon = daysToExpiry <= 90 && daysToExpiry > 0
        const isExpired = daysToExpiry <= 0
        
        let textColor = 'inherit'
        if (isExpired) textColor = '#f5222d'
        else if (isExpiringSoon) textColor = '#fa8c16'
        
        return (
          <Space direction="vertical" size="small">
            <Text 
              style={{ 
                color: textColor,
                fontSize: '11px',
                fontWeight: isExpired || isExpiringSoon ? 'bold' : 'normal'
              }}
            >
              {new Date(record.expiryDate).toLocaleDateString()}
            </Text>
            {isExpiringSoon && !isExpired && (
              <Tag color="orange" style={{ fontSize: '10px' }}>
                Expiring Soon
              </Tag>
            )}
            {isExpired && (
              <Tag color="red" style={{ fontSize: '10px' }}>
                Expired
              </Tag>
            )}
            {record.lotNumbers.length > 0 && (
              <Text type="secondary" style={{ fontSize: '10px' }}>
                Lots: {record.lotNumbers.length}
              </Text>
            )}
          </Space>
        )
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (record: any) => (
        <Space direction="vertical" size="small">
          <Space size="small">
            <Tooltip title="View Details">
              <Button 
                size="small"
                icon={<EyeOutlined />}
                onClick={() => {
                  setSelectedItem(record)
                  setDetailsModalVisible(true)
                }}
              />
            </Tooltip>
            <Tooltip title="Reorder">
              <Button 
                size="small"
                type="primary"
                icon={<ShoppingCartOutlined />}
                disabled={record.status === 'In Stock'}
                onClick={() => {
                  setSelectedItem(record)
                  setReorderModalVisible(true)
                }}
              />
            </Tooltip>
          </Space>
          <Button 
            size="small"
            icon={<PrinterOutlined />}
            onClick={() => message.success(`Label printed for ${record.name}`)}
          >
            Label
          </Button>
        </Space>
      ),
    },
  ]

  // Apply filters when dependencies change
  useEffect(() => {
    handleFilter()
  }, [searchText, statusFilter, categoryFilter])

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <BoxPlotOutlined style={{ marginRight: '8px' }} />
          Inventory Management
        </Title>
        <Text type="secondary">
          Monitor stock levels, manage reorders, and track inventory across all categories
        </Text>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          message="Connection Issue"
          description={error}
          type="warning"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: '16px' }}
          action={
            <Button size="small" type="primary" onClick={loadInventoryData}>
              Retry
            </Button>
          }
        />
      )}

      {/* Development Mode Indicator */}
      {import.meta.env.DEV && !error && (
        <Alert
          message="Development Mode"
          description="You are viewing inventory data. API calls may fall back to demo data if the server is unavailable."
          type="info"
          showIcon
          closable
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Total Items"
              value={stats.totalItems}
              prefix={<BoxPlotOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Low Stock"
              value={stats.lowStockItems}
              prefix={<WarningOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Out of Stock"
              value={stats.outOfStockItems}
              prefix={<AlertOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Critical Low"
              value={stats.criticalLowItems}
              prefix={<AlertOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Categories"
              value={stats.categoriesCount}
              prefix={<FileTextOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Total Value"
              value={`$${stats.totalValue.toFixed(2)}`}
              prefix={<BarChartOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search inventory by name, NDC, category..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
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
              <Option value="Critical Low">Critical Low</Option>
              <Option value="Out of Stock">Out of Stock</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">All Categories</Option>
              {categories.map(category => (
                <Option key={category} value={category}>{category}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button 
              icon={<FilterOutlined />}
              onClick={() => {
                setSearchText('')
                setStatusFilter('all')
                setCategoryFilter('all')
              }}
              style={{ width: '100%' }}
            >
              Clear Filters
            </Button>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button 
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => message.info('Add new inventory item')}
              style={{ width: '100%' }}
            >
              Add Item
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Inventory Table */}
      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredInventory}
            rowKey="id"
            pagination={{
              pageSize: 15,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            }}
            scroll={{ x: 1200 }}
            size="middle"
            rowClassName={(record) => {
              if (record.status === 'Out of Stock') return 'out-of-stock-row'
              if (record.status === 'Critical Low') return 'critical-low-row'
              if (record.status === 'Low Stock') return 'low-stock-row'
              return ''
            }}
            locale={{
              emptyText: loading ? 'Loading inventory...' : 'No inventory items found'
            }}
          />
        </Spin>
      </Card>

      {/* Item Details Modal */}
      <Modal
        title={
          <Space>
            <BoxPlotOutlined />
            Inventory Details - {selectedItem?.name}
          </Space>
        }
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="reorder" 
            type="primary"
            onClick={() => {
              setDetailsModalVisible(false)
              setReorderModalVisible(true)
            }}
            disabled={selectedItem?.status === 'In Stock'}
          >
            Create Reorder
          </Button>
        ]}
      >
        {selectedItem && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="Drug Information" size="small">
                  <p><strong>Name:</strong> {selectedItem.name}</p>
                  <p><strong>Strength:</strong> {selectedItem.strength}</p>
                  <p><strong>Form:</strong> {selectedItem.form}</p>
                  <p><strong>NDC:</strong> {selectedItem.ndc}</p>
                  <p><strong>Category:</strong> {selectedItem.category}</p>
                  <p><strong>Manufacturer:</strong> {selectedItem.manufacturer}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Stock Information" size="small">
                  <p><strong>Current Stock:</strong> {selectedItem.currentStock}</p>
                  <p><strong>Minimum Stock:</strong> {selectedItem.minimumStock}</p>
                  <p><strong>Maximum Stock:</strong> {selectedItem.maximumStock}</p>
                  <p><strong>Reorder Point:</strong> {selectedItem.reorderPoint}</p>
                  <p><strong>Reorder Quantity:</strong> {selectedItem.reorderQuantity}</p>
                  <p><strong>Status:</strong> <Tag color={(() => {
                    if (selectedItem.status === 'Out of Stock') return 'red'
                    if (selectedItem.status === 'Critical Low') return 'red'
                    if (selectedItem.status === 'Low Stock') return 'orange'
                    return 'green'
                  })()}>{selectedItem.status}</Tag></p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Financial Information" size="small">
                  <p><strong>Unit Cost:</strong> ${(selectedItem.unitCost || 0).toFixed(2)}</p>
                  <p><strong>Total Value:</strong> ${(selectedItem.totalValue || 0).toFixed(2)}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Storage & Supply" size="small">
                  <p><strong>Location:</strong> {selectedItem.location}</p>
                  <p><strong>Supplier:</strong> {selectedItem.supplier}</p>
                  <p><strong>Last Restocked:</strong> {new Date(selectedItem.lastRestocked).toLocaleDateString()}</p>
                  <p><strong>Expiry Date:</strong> {new Date(selectedItem.expiryDate).toLocaleDateString()}</p>
                </Card>
              </Col>
              <Col span={24}>
                <Card title="Lot Numbers" size="small">
                  {selectedItem.lotNumbers.length > 0 ? (
                    <Space wrap>
                      {selectedItem.lotNumbers.map((lot: string) => (
                        <Tag key={lot}>{lot}</Tag>
                      ))}
                    </Space>
                  ) : (
                    <Text type="secondary">No lot numbers available</Text>
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Reorder Modal */}
      <Modal
        title={
          <Space>
            <ShoppingCartOutlined />
            Create Reorder - {selectedItem?.name}
          </Space>
        }
        open={reorderModalVisible}
        onCancel={() => setReorderModalVisible(false)}
        onOk={() => {
          message.success(`Reorder created for ${selectedItem?.name}`)
          setReorderModalVisible(false)
        }}
        okText="Create Reorder"
      >
        {selectedItem && (
          <div>
            <p><strong>Current Stock:</strong> {selectedItem.currentStock}</p>
            <p><strong>Minimum Required:</strong> {selectedItem.minimumStock}</p>
            <p><strong>Recommended Order:</strong> {selectedItem.reorderQuantity}</p>
            <p><strong>Supplier:</strong> {selectedItem.supplier}</p>
            <p><strong>Estimated Cost:</strong> ${(selectedItem.reorderQuantity * selectedItem.unitCost).toFixed(2)}</p>
          </div>
        )}
      </Modal>

      <style>{`
        .out-of-stock-row {
          background-color: #fff2f0 !important;
          border-left: 4px solid #f5222d;
        }
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

export default InventoryManagement
