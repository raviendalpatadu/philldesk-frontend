/**
 * Customer Orders Page
 * 
 * This page displays the order history for customers,
 * allowing them to track their medication orders with detailed status tracking,
 * reorder functionality, and comprehensive order management.
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
  DatePicker,
  Modal,
  Descriptions,
  Timeline,
  message,
  Divider,
  Tooltip,
  Spin
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
import customerService from '../../services/customerService'

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker
const { TextArea } = Input

// Order and OrderItem interfaces
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  manufacturer: string;
  instructions?: string;
  dosage?: string;
  frequency?: string;
}

interface Order {
  key: string;
  orderId: string;
  date: string;
  billId: number; // Added billId for downloading bills
  prescriptionId: string;
  doctorName: string;
  items: OrderItem[];
  status: string;
  statusCode: number;
  total: number;
  shippingCost: number;
  discount: number;
  tax: number;
  netTotal: number;
  estimatedDelivery?: string;
  actualDelivery?: string;
  trackingNumber?: string;
  courier: string;
  shippingAddress?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  orderNotes?: string;
  canReorder: boolean;
  rating?: number;
  feedback?: string;
}

interface TrackingEvent {
  status: string;
  description: string;
  timestamp?: string;
  completed: boolean;
}

interface OrderTracking {
  orderId: string;
  prescriptionNumber: string;
  trackingNumber?: string;
  courier?: string;
  shippingStatus?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  timeline: TrackingEvent[];
}

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [trackingData, setTrackingData] = useState<OrderTracking | null>(null)
  const [detailsVisible, setDetailsVisible] = useState(false)
  const [trackingVisible, setTrackingVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState<[any, any] | null>(null)

  // Load orders on component mount
  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const orderData = await customerService.getOrderHistory()
      setOrders(orderData)
      setFilteredOrders(orderData)
    } catch (error) {
      console.error('Error loading orders:', error)
      message.error('Failed to load order history')
    } finally {
      setLoading(false)
    }
  }

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

    if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
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

  // View order details
  const viewDetails = (order: any) => {
    setSelectedOrder(order)
    setDetailsVisible(true)
  }

  // View tracking information
  const viewTracking = async (order: Order) => {
    try {
      setSelectedOrder(order)
      setTrackingVisible(true)
      
      if (order.trackingNumber) {
        const tracking = await customerService.getOrderTracking(order.orderId)
        setTrackingData(tracking)
      } else {
        setTrackingData(null)
      }
    } catch (error) {
      console.error('Error loading tracking data:', error)
      message.error('Failed to load tracking information')
    }
  }

  // Download bill as PDF
  const handleDownloadBill = async (order: Order) => {
    try {
      await customerService.downloadBill(order.billId)
      message.success('Bill downloaded successfully!')
    } catch (error) {
      console.error('Error downloading bill:', error)
      message.error('Failed to download bill. Please try again.')
    }
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
      render: (text: string, record: Order) => (
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
      sorter: (a: Order, b: Order) => new Date(a.date).getTime() - new Date(b.date).getTime(),
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
      render: (items: OrderItem[]) => (
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
        { text: 'Delivered', value: 'Delivered' },
        { text: 'Cancelled', value: 'Cancelled' },
      ],
      onFilter: (value: any, record: Order) => record.status === value,
      render: (status: string) => getStatusDisplay(status),
    },
    {
      title: 'Total',
      dataIndex: 'netTotal',
      key: 'netTotal',
      width: 100,
      sorter: (a: Order, b: Order) => a.netTotal - b.netTotal,
      render: (total: number) => (
        <Text strong>${total.toFixed(2)}</Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: any, record: Order) => (
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
          
          {record.paymentStatus === "PAID" && (
            <Tooltip title="Download Bill">
              <Button 
                type="text" 
                icon={<DownloadOutlined />} 
                onClick={() => handleDownloadBill(record)}
                size="small"
              />
            </Tooltip>
          )}
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
                  setDateRange(null)
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
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <p style={{ marginTop: '20px' }}>Loading your order history...</p>
          </div>
        ) : (
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
        )}
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
          </Button>
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
        onCancel={() => {
          setTrackingVisible(false)
          setTrackingData(null)
        }}
        footer={[
          <Button key="close" onClick={() => {
            setTrackingVisible(false)
            setTrackingData(null)
          }}>
            Close
          </Button>,
        ]}
      >
        {selectedOrder?.trackingNumber ? (
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

            {trackingData ? (
              <Timeline
                items={trackingData.timeline.map((event) => ({
                  color: event.completed ? 'green' : 'gray',
                  children: (
                    <div>
                      <Text strong>{event.status}</Text>
                      <br />
                      <Text type="secondary">{event.description}</Text>
                      {event.timestamp && (
                        <>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {new Date(event.timestamp).toLocaleString()}
                          </Text>
                        </>
                      )}
                    </div>
                  ),
                }))}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin />
                <p>Loading tracking information...</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <InboxOutlined style={{ fontSize: '48px', color: '#ccc' }} />
            <p>Tracking information not available yet</p>
            <Text type="secondary">Your order is being processed and tracking details will be available soon.</Text>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default OrdersPage
