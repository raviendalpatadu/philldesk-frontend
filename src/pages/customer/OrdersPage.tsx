/**
 * Customer Orders Page
 * 
 * This page displays the order history for customers,
 * allowing them to track their medication orders with detailed status tracking,
 * reorder functionality, and comprehensive order management.
 */

import React, { useState } from 'react'
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
  DatePicker,
  Modal,
  Descriptions,
  Timeline,
  Rate,
  message,
  Divider,
  Tooltip
} from 'antd'
import { 
  EyeOutlined, 
  DownloadOutlined,
  ShoppingCartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TruckOutlined,
  ReloadOutlined,
  StarOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  InboxOutlined,
  WarningOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker
const { TextArea } = Input

// Mock data for orders with comprehensive details
const mockOrders = [
  {
    key: '1',
    orderId: 'ORD-2024-001',
    date: '2024-01-15',
    prescriptionId: 'RX-2024-001',
    doctorName: 'Dr. Sarah Johnson',
    items: [
      { name: 'Paracetamol 500mg', quantity: 30, price: 15.50, manufacturer: 'PharmaCorp' },
      { name: 'Amoxicillin 250mg', quantity: 20, price: 30.00, manufacturer: 'MediPharm' }
    ],
    status: 'Delivered',
    statusCode: 4,
    total: 45.50,
    shippingCost: 5.00,
    discount: 0,
    tax: 3.64,
    netTotal: 54.14,
    estimatedDelivery: '2024-01-18',
    actualDelivery: '2024-01-17',
    trackingNumber: 'TRK123456789',
    courier: 'FastDelivery',
    shippingAddress: '123 Main St, City, State 12345',
    paymentMethod: 'Credit Card',
    orderNotes: 'Urgent delivery requested',
    canReorder: true,
    rating: 5,
    feedback: 'Great service, fast delivery!'
  },
  {
    key: '2',
    orderId: 'ORD-2024-002',
    date: '2024-01-20',
    prescriptionId: 'RX-2024-002',
    doctorName: 'Dr. Michael Chen',
    items: [
      { name: 'Insulin Pen', quantity: 5, price: 80.00, manufacturer: 'DiabetesCare' },
      { name: 'Blood Glucose Strips', quantity: 50, price: 40.00, manufacturer: 'TestStrip Inc' }
    ],
    status: 'In Transit',
    statusCode: 3,
    total: 120.00,
    shippingCost: 7.50,
    discount: 10.00,
    tax: 9.60,
    netTotal: 127.10,
    estimatedDelivery: '2024-01-25',
    actualDelivery: null,
    trackingNumber: 'TRK987654321',
    courier: 'QuickShip',
    shippingAddress: '456 Oak Ave, Town, State 67890',
    paymentMethod: 'Insurance + Credit Card',
    orderNotes: 'Handle with care - temperature sensitive',
    canReorder: true,
    rating: null,
    feedback: null
  },
  {
    key: '3',
    orderId: 'ORD-2024-003',
    date: '2024-01-25',
    prescriptionId: 'RX-2024-003',
    doctorName: 'Dr. Emily Rodriguez',
    items: [
      { name: 'Lisinopril 10mg', quantity: 90, price: 25.00, manufacturer: 'CardioMeds' },
      { name: 'Vitamin D3 1000IU', quantity: 60, price: 15.00, manufacturer: 'HealthPlus' }
    ],
    status: 'Processing',
    statusCode: 1,
    total: 40.00,
    shippingCost: 5.00,
    discount: 5.00,
    tax: 3.20,
    netTotal: 43.20,
    estimatedDelivery: '2024-01-30',
    actualDelivery: null,
    trackingNumber: null,
    courier: 'StandardPost',
    shippingAddress: '789 Pine St, Village, State 13579',
    paymentMethod: 'Insurance',
    orderNotes: 'Regular monthly refill',
    canReorder: true,
    rating: null,
    feedback: null
  },
  {
    key: '4',
    orderId: 'ORD-2024-004',
    date: '2024-01-10',
    prescriptionId: 'RX-2024-004',
    doctorName: 'Dr. Robert Thompson',
    items: [
      { name: 'Omeprazole 20mg', quantity: 30, price: 20.00, manufacturer: 'GastroCare' }
    ],
    status: 'Cancelled',
    statusCode: -1,
    total: 20.00,
    shippingCost: 5.00,
    discount: 0,
    tax: 1.60,
    netTotal: 26.60,
    estimatedDelivery: null,
    actualDelivery: null,
    trackingNumber: null,
    courier: null,
    shippingAddress: '321 Elm St, Suburb, State 24680',
    paymentMethod: 'Credit Card',
    orderNotes: 'Cancelled due to prescription change',
    canReorder: false,
    rating: null,
    feedback: null
  }
]

const OrdersPage: React.FC = () => {
  const [orders] = useState(mockOrders)
  const [filteredOrders, setFilteredOrders] = useState(mockOrders)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [detailsVisible, setDetailsVisible] = useState(false)
  const [reorderVisible, setReorderVisible] = useState(false)
  const [trackingVisible, setTrackingVisible] = useState(false)
  const [ratingVisible, setRatingVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState<any[]>([])

  // Filter orders based on search and filters
  const handleFilter = () => {
    let filtered = orders

    if (searchText) {
      filtered = filtered.filter(order => 
        order.orderId.toLowerCase().includes(searchText.toLowerCase()) ||
        order.prescriptionId.toLowerCase().includes(searchText.toLowerCase()) ||
        order.doctorName.toLowerCase().includes(searchText.toLowerCase()) ||
        order.items.some(item => item.name.toLowerCase().includes(searchText.toLowerCase()))
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    if (dateRange && dateRange.length === 2) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.date)
        return orderDate >= dateRange[0].toDate() && orderDate <= dateRange[1].toDate()
      })
    }

    setFilteredOrders(filtered)
  }

  // Get status tag color and icon
  const getStatusDisplay = (status: string) => {
    const configs = {
      'Processing': { color: 'blue', icon: <ClockCircleOutlined /> },
      'Confirmed': { color: 'cyan', icon: <CheckCircleOutlined /> },
      'Shipped': { color: 'orange', icon: <TruckOutlined /> },
      'In Transit': { color: 'purple', icon: <TruckOutlined /> },
      'Delivered': { color: 'green', icon: <CheckCircleOutlined /> },
      'Cancelled': { color: 'red', icon: <WarningOutlined /> }
    }
    
    const config = configs[status as keyof typeof configs] || { color: 'default', icon: <ClockCircleOutlined /> }
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {status}
      </Tag>
    )
  }

  // Handle reorder functionality
  const handleReorder = (order: any) => {
    setSelectedOrder(order)
    setReorderVisible(true)
  }

  // Handle order rating
  const handleRate = (order: any) => {
    setSelectedOrder(order)
    setRatingVisible(true)
  }

  // View order details
  const viewDetails = (order: any) => {
    setSelectedOrder(order)
    setDetailsVisible(true)
  }

  // View tracking information
  const viewTracking = (order: any) => {
    setSelectedOrder(order)
    setTrackingVisible(true)
  }

  // Calculate statistics
  const stats = {
    total: orders.length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    inTransit: orders.filter(o => o.status === 'In Transit').length,
    processing: orders.filter(o => o.status === 'Processing').length,
    totalSpent: orders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + o.netTotal, 0)
  }

  // Table columns definition
  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 120,
      render: (text: string, record: any) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.prescriptionId}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      sorter: (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      render: (date: string) => (
        <Text>{new Date(date).toLocaleDateString()}</Text>
      ),
    },
    {
      title: 'Doctor',
      dataIndex: 'doctorName',
      key: 'doctorName',
      width: 140,
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      width: 200,
      render: (items: any[]) => (
        <div>
          {items.slice(0, 2).map((item, index) => (
            <div key={`${item.name}-${index}`} style={{ fontSize: '12px' }}>
              {item.name} x{item.quantity}
            </div>
          ))}
          {items.length > 2 && (
            <Text type="secondary" style={{ fontSize: '11px' }}>
              +{items.length - 2} more items
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: [
        { text: 'Processing', value: 'Processing' },
        { text: 'In Transit', value: 'In Transit' },
        { text: 'Delivered', value: 'Delivered' },
        { text: 'Cancelled', value: 'Cancelled' },
      ],
      onFilter: (value: any, record: any) => record.status === value,
      render: (status: string) => getStatusDisplay(status),
    },
    {
      title: 'Total',
      dataIndex: 'netTotal',
      key: 'netTotal',
      width: 100,
      sorter: (a: any, b: any) => a.netTotal - b.netTotal,
      render: (total: number) => (
        <Text strong>${total.toFixed(2)}</Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => viewDetails(record)}
              size="small"
            />
          </Tooltip>
          
          {record.trackingNumber && (
            <Tooltip title="Track Order">
              <Button 
                type="text" 
                icon={<TruckOutlined />} 
                onClick={() => viewTracking(record)}
                size="small"
              />
            </Tooltip>
          )}
          
          {record.canReorder && (
            <Tooltip title="Reorder">
              <Button 
                type="text" 
                icon={<ReloadOutlined />} 
                onClick={() => handleReorder(record)}
                size="small"
              />
            </Tooltip>
          )}
          
          {record.status === 'Delivered' && !record.rating && (
            <Tooltip title="Rate Order">
              <Button 
                type="text" 
                icon={<StarOutlined />} 
                onClick={() => handleRate(record)}
                size="small"
              />
            </Tooltip>
          )}
          
          <Tooltip title="Download Invoice">
            <Button 
              type="text" 
              icon={<DownloadOutlined />} 
              onClick={() => message.success('Invoice downloaded!')}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  // Apply filters when dependencies change
  React.useEffect(() => {
    handleFilter()
  }, [searchText, statusFilter, dateRange])

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <ShoppingCartOutlined style={{ marginRight: '8px' }} />
          Order History
        </Title>
        <Text type="secondary">
          Track your medication orders and manage your purchase history
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Orders"
              value={stats.total}
              prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Delivered"
              value={stats.delivered}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="In Transit"
              value={stats.inTransit}
              prefix={<TruckOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Spent"
              value={stats.totalSpent}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search orders, prescriptions, medications..."
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
              <Option value="Processing">Processing</Option>
              <Option value="In Transit">In Transit</Option>
              <Option value="Delivered">Delivered</Option>
              <Option value="Cancelled">Cancelled</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
              value={dateRange}
              onChange={setDateRange}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button 
                icon={<FilterOutlined />}
                onClick={() => {
                  setSearchText('')
                  setStatusFilter('all')
                  setDateRange([])
                  setFilteredOrders(orders)
                }}
              >
                Clear Filters
              </Button>
              <Button 
                type="primary" 
                icon={<ExportOutlined />}
                onClick={() => message.success('Orders exported to CSV!')}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Orders Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredOrders}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} orders`,
          }}
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>

      {/* Order Details Modal */}
      <Modal
        title={
          <Space>
            <ShoppingCartOutlined />
            Order Details - {selectedOrder?.orderId}
          </Space>
        }
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Close
          </Button>,
          selectedOrder?.canReorder && (
            <Button key="reorder" type="primary" onClick={() => handleReorder(selectedOrder)}>
              Reorder
            </Button>
          ),
        ]}
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Order ID">{selectedOrder.orderId}</Descriptions.Item>
              <Descriptions.Item label="Prescription ID">{selectedOrder.prescriptionId}</Descriptions.Item>
              <Descriptions.Item label="Doctor">{selectedOrder.doctorName}</Descriptions.Item>
              <Descriptions.Item label="Order Date">
                {new Date(selectedOrder.date).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusDisplay(selectedOrder.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Method">{selectedOrder.paymentMethod}</Descriptions.Item>
              <Descriptions.Item label="Tracking Number" span={2}>
                {selectedOrder.trackingNumber || 'Not assigned yet'}
              </Descriptions.Item>
              <Descriptions.Item label="Shipping Address" span={2}>
                {selectedOrder.shippingAddress}
              </Descriptions.Item>
              {selectedOrder.orderNotes && (
                <Descriptions.Item label="Order Notes" span={2}>
                  {selectedOrder.orderNotes}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider orientation="left">Items Ordered</Divider>
            <Table
              dataSource={selectedOrder.items.map((item: any, index: number) => ({ ...item, key: index }))}
              columns={[
                { title: 'Medication', dataIndex: 'name', key: 'name' },
                { title: 'Manufacturer', dataIndex: 'manufacturer', key: 'manufacturer' },
                { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 80 },
                { 
                  title: 'Price', 
                  dataIndex: 'price', 
                  key: 'price', 
                  width: 100,
                  render: (price: number) => `$${price.toFixed(2)}`
                },
              ]}
              pagination={false}
              size="small"
            />

            <Divider orientation="left">Order Summary</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Subtotal">${selectedOrder.total.toFixed(2)}</Descriptions.Item>
                  <Descriptions.Item label="Shipping">${selectedOrder.shippingCost.toFixed(2)}</Descriptions.Item>
                  <Descriptions.Item label="Discount">-${selectedOrder.discount.toFixed(2)}</Descriptions.Item>
                  <Descriptions.Item label="Tax">${selectedOrder.tax.toFixed(2)}</Descriptions.Item>
                  <Descriptions.Item label="Total">
                    <Text strong style={{ fontSize: '16px' }}>
                      ${selectedOrder.netTotal.toFixed(2)}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={12}>
                {selectedOrder.estimatedDelivery && (
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Estimated Delivery">
                      {new Date(selectedOrder.estimatedDelivery).toLocaleDateString()}
                    </Descriptions.Item>
                    {selectedOrder.actualDelivery && (
                      <Descriptions.Item label="Actual Delivery">
                        {new Date(selectedOrder.actualDelivery).toLocaleDateString()}
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Courier">{selectedOrder.courier}</Descriptions.Item>
                  </Descriptions>
                )}
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Tracking Modal */}
      <Modal
        title={
          <Space>
            <TruckOutlined />
            Track Order - {selectedOrder?.orderId}
          </Space>
        }
        open={trackingVisible}
        onCancel={() => setTrackingVisible(false)}
        footer={[
          <Button key="close" onClick={() => setTrackingVisible(false)}>
            Close
          </Button>,
        ]}
      >
        {selectedOrder?.trackingNumber && (
          <div>
            <Card style={{ marginBottom: '16px' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Tracking Number:</Text>
                  <br />
                  <Text copyable>{selectedOrder.trackingNumber}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Courier:</Text>
                  <br />
                  <Text>{selectedOrder.courier}</Text>
                </Col>
              </Row>
            </Card>

            <Timeline
              items={[
                {
                  color: 'blue',
                  children: (
                    <div>
                      <Text strong>Order Placed</Text>
                      <br />
                      <Text type="secondary">{new Date(selectedOrder.date).toLocaleString()}</Text>
                    </div>
                  ),
                },
                {
                  color: selectedOrder.statusCode >= 2 ? 'green' : 'gray',
                  children: (
                    <div>
                      <Text strong>Order Confirmed</Text>
                      <br />
                      <Text type="secondary">Prescription verified and approved</Text>
                    </div>
                  ),
                },
                {
                  color: selectedOrder.statusCode >= 3 ? 'green' : 'gray',
                  children: (
                    <div>
                      <Text strong>Package Shipped</Text>
                      <br />
                      <Text type="secondary">Package picked up by courier</Text>
                    </div>
                  ),
                },
                {
                  color: selectedOrder.statusCode >= 4 ? 'green' : 'gray',
                  children: (
                    <div>
                      <Text strong>Delivered</Text>
                      <br />
                      <Text type="secondary">
                        {selectedOrder.actualDelivery 
                          ? new Date(selectedOrder.actualDelivery).toLocaleString()
                          : `Expected: ${new Date(selectedOrder.estimatedDelivery).toLocaleDateString()}`
                        }
                      </Text>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Modal>

      {/* Reorder Modal */}
      <Modal
        title="Reorder Confirmation"
        open={reorderVisible}
        onCancel={() => setReorderVisible(false)}
        onOk={() => {
          message.success('Items added to cart for reorder!')
          setReorderVisible(false)
        }}
      >
        {selectedOrder && (
          <div>
            <Text>Are you sure you want to reorder the following items?</Text>
            <Divider />
            {selectedOrder.items.map((item: any, index: number) => (
              <div key={`${item.name}-${index}`} style={{ marginBottom: '8px' }}>
                <Text strong>{item.name}</Text> - Quantity: {item.quantity}
              </div>
            ))}
            <Divider />
            <Text type="secondary">
              Note: A new prescription may be required for prescription medications.
            </Text>
          </div>
        )}
      </Modal>

      {/* Rating Modal */}
      <Modal
        title="Rate Your Order"
        open={ratingVisible}
        onCancel={() => setRatingVisible(false)}
        onOk={() => {
          message.success('Thank you for your feedback!')
          setRatingVisible(false)
        }}
      >
        {selectedOrder && (
          <div>
            <Text>How was your experience with order {selectedOrder.orderId}?</Text>
            <Divider />
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <Rate defaultValue={5} />
            </div>
            <TextArea
              rows={4}
              placeholder="Tell us about your experience..."
              maxLength={500}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

export default OrdersPage
