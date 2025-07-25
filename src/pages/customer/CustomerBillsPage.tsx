/**
 * Customer Bills Management Component
 * 
 * This component allows customers to view their prescription bills, select payment types,
 * and process online payments. Replaces invoice functionality with direct billing.
 */

import React, { useState, useEffect } from 'react'
import {
  Typography,
  Card,
  Table,
  Tag,
  Space,
  Button,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Radio,
  Input,
  message,
  Descriptions,
  Divider,
  Select,
  Alert,
  Empty,
  notification
} from 'antd'
const { TextArea } = Input
import {
  CreditCardOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  PayCircleOutlined,
  WalletOutlined,
  MedicineBoxOutlined,
  ShoppingOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import customerService, { Bill, PaymentData } from '../../services/customerService'

const { Title, Text } = Typography
const { Option } = Select

// ============================================================================
// Customer Bills Management Page (Streamlined for SME Pharmacies)
// ============================================================================

const CustomerBillsPage: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([])
  const [filteredBills, setFilteredBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [paymentModalVisible, setPaymentModalVisible] = useState(false)
  const [paymentTypeModalVisible, setPaymentTypeModalVisible] = useState(false)
  const [billDetailsModalVisible, setBillDetailsModalVisible] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all')
  const [form] = Form.useForm()

  useEffect(() => {
    fetchBills()
    // Show notification for new bills
    checkForNewBills()
  }, [])

  const fetchBills = async () => {
    try {
      setLoading(true)
      const data = await customerService.getMyBills()
      setBills(data)
      setFilteredBills(data)
    } catch (error) {
      message.error('Failed to load bills')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkForNewBills = async () => {
    try {
      // Check for any new bills and show notification
      const data = await customerService.getMyBills()
      const newBills = data.filter(bill => 
        bill.paymentStatus === 'PENDING' && 
        new Date(bill.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      )
      
      if (newBills.length > 0) {
        notification.info({
          message: 'New Bill Available',
          description: `You have ${newBills.length} new prescription bill(s) ready for payment.`,
          placement: 'topRight',
          duration: 6,
        })
      }
    } catch (error) {
      console.error('Error checking for new bills:', error)
    }
  }

  // Calculate statistics
  const stats = {
    total: bills.length,
    pending: bills.filter(b => b.paymentStatus === 'PENDING').length,
    paid: bills.filter(b => b.paymentStatus === 'PAID').length,
    totalAmount: bills.reduce((sum, bill) => sum + bill.totalAmount, 0),
    pendingAmount: bills.filter(b => b.paymentStatus === 'PENDING').reduce((sum, bill) => sum + bill.totalAmount, 0)
  }

  // Filter bills based on status and payment type
  useEffect(() => {
    let filtered = bills

    if (statusFilter !== 'all') {
      filtered = filtered.filter(bill => bill.paymentStatus === statusFilter)
    }

    if (paymentTypeFilter !== 'all') {
      filtered = filtered.filter(bill => bill.paymentType === paymentTypeFilter)
    }

    setFilteredBills(filtered)
  }, [bills, statusFilter, paymentTypeFilter])

  const handleViewDetails = async (bill: Bill) => {
    setSelectedBill(bill)
    setBillDetailsModalVisible(true)
  }

  const handleSetPaymentType = (bill: Bill) => {
    setSelectedBill(bill)
    setPaymentTypeModalVisible(true)
  }

  const handlePayOnline = (bill: Bill) => {
    setSelectedBill(bill)
    setPaymentModalVisible(true)
    form.resetFields()
  }

  const updatePaymentType = async (values: any) => {
    if (!selectedBill) return

    try {
      await customerService.updatePaymentType(selectedBill.id, values.paymentType)
      message.success('Payment type updated successfully')
      setPaymentTypeModalVisible(false)
      await fetchBills()
    } catch (error) {
      message.error('Failed to update payment type')
      console.error('Error:', error)
    }
  }

  const processPayment = async (values: any) => {
    if (!selectedBill) return

    try {
      setProcessingPayment(true)
      
      const paymentData: PaymentData = {
        paymentMethod: values.paymentMethod,
        cardNumber: values.cardNumber,
        cvv: values.cvv,
        expiryDate: values.expiryDate,
        cardHolderName: values.cardHolderName,
        shippingDetails: {
          recipientName: values.recipientName,
          contactPhone: values.contactPhone,
          alternatePhone: values.alternatePhone,
          email: values.email,
          addressLine1: values.addressLine1,
          addressLine2: values.addressLine2,
          city: values.city,
          stateProvince: values.stateProvince,
          postalCode: values.postalCode,
          country: values.country,
          deliveryInstructions: values.deliveryInstructions,
          preferredDeliveryTime: values.preferredDeliveryTime
        }
      }

      const result = await customerService.payOnline(selectedBill.id, paymentData)
      
      message.success(`Payment processed successfully! Transaction ID: ${result.transactionId}. Your medicines will be delivered to the specified address.`)
      setPaymentModalVisible(false)
      form.resetFields()
      await fetchBills()
    } catch (error) {
      message.error('Payment processing failed. Please try again.')
      console.error('Error:', error)
    } finally {
      setProcessingPayment(false)
    }
  }

  // Get payment status display
  const getPaymentStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { color: 'orange', icon: <ClockCircleOutlined /> }
      case 'PAID':
        return { color: 'green', icon: <CheckCircleOutlined /> }
      case 'PARTIALLY_PAID':
        return { color: 'blue', icon: <ExclamationCircleOutlined /> }
      case 'CANCELLED':
        return { color: 'red', icon: <ExclamationCircleOutlined /> }
      default:
        return { color: 'default', icon: <ExclamationCircleOutlined /> }
    }
  }

  // Get payment type display
  const getPaymentTypeDisplay = (type?: string) => {
    switch (type) {
      case 'ONLINE':
        return { color: 'blue', text: 'Online Payment', icon: <CreditCardOutlined /> }
      case 'PAY_ON_PICKUP':
        return { color: 'green', text: 'Pay on Pickup', icon: <WalletOutlined /> }
      default:
        return { color: 'default', text: 'Not Set', icon: <ExclamationCircleOutlined /> }
    }
  }

  // Table columns configuration
  const columns: ColumnsType<Bill> = [
    {
      title: 'Bill Number',
      dataIndex: 'billNumber',
      key: 'billNumber',
      render: (billNumber: string) => (
        <Text strong>{billNumber}</Text>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          Rs. {amount.toFixed(2)}
        </Text>
      ),
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => {
        const { color, icon } = getPaymentStatusDisplay(status)
        return (
          <Tag icon={icon} color={color}>
            {status.replace('_', ' ')}
          </Tag>
        )
      },
    },
    {
      title: 'Payment Type',
      dataIndex: 'paymentType',
      key: 'paymentType',
      render: (type: string) => {
        const { color, text, icon } = getPaymentTypeDisplay(type)
        return (
          <Tag icon={icon} color={color}>
            {text}
          </Tag>
        )
      },
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Bill) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            size="small"
          >
            Details
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <MedicineBoxOutlined style={{ marginRight: '8px' }} />
          Prescription Bills
        </Title>
        <Text type="secondary">
          View and pay for your prescription bills. Bills are automatically generated when pharmacist approves your prescription.
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Bills"
              value={stats.total}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Pending Bills"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Paid Bills"
              value={stats.paid}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Amount Due"
              value={`Rs. ${stats.pendingAmount.toFixed(2)}`}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Filter by payment status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">All Status</Option>
              <Option value="PENDING">Pending</Option>
              <Option value="PAID">Paid</Option>
              <Option value="PARTIALLY_PAID">Partially Paid</Option>
              <Option value="CANCELLED">Cancelled</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Filter by payment type"
              value={paymentTypeFilter}
              onChange={setPaymentTypeFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">All Payment Types</Option>
              <Option value="ONLINE">Online Payment</Option>
              <Option value="PAY_ON_PICKUP">Pay on Pickup</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Bills Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredBills}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} bills`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No bills found"
              />
            ),
          }}
        />
      </Card>

      {/* Bill Details Modal */}
      <Modal
        title="Bill Details"
        open={billDetailsModalVisible}
        onCancel={() => setBillDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setBillDetailsModalVisible(false)}>
            Close
          </Button>,
          ...(selectedBill?.paymentStatus === 'PENDING' ? [
            <Button 
              key="setPayment"
              type="default"
              icon={<PayCircleOutlined />}
              onClick={() => {
                setBillDetailsModalVisible(false)
                handleSetPaymentType(selectedBill)
              }}
            >
              Set Payment Type
            </Button>
          ] : []),
          ...(selectedBill?.paymentStatus === 'PENDING' && selectedBill?.paymentType === 'ONLINE' ? [
            <Button 
              key="payNow"
              type="primary"
              icon={<CreditCardOutlined />}
              onClick={() => {
                setBillDetailsModalVisible(false)
                handlePayOnline(selectedBill)
              }}
            >
              Pay Now
            </Button>
          ] : [])
        ]}
        width={900}
      >
        {selectedBill && (
          <div>
            <Descriptions column={2} bordered style={{ marginBottom: '24px' }}>
              <Descriptions.Item label="Bill Number" span={2}>
                <Text strong>{selectedBill.billNumber}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Subtotal">
                Rs. {selectedBill.subtotal.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Discount">
                Rs. {(selectedBill.discount || 0).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Total Amount">
                <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                  Rs. {selectedBill.totalAmount.toFixed(2)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Payment Status" span={2}>
                <Tag
                  icon={getPaymentStatusDisplay(selectedBill.paymentStatus).icon}
                  color={getPaymentStatusDisplay(selectedBill.paymentStatus).color}
                >
                  {selectedBill.paymentStatus.replace('_', ' ')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Payment Type" span={2}>
                <Tag
                  icon={getPaymentTypeDisplay(selectedBill.paymentType).icon}
                  color={getPaymentTypeDisplay(selectedBill.paymentType).color}
                >
                  {getPaymentTypeDisplay(selectedBill.paymentType).text}
                </Tag>
              </Descriptions.Item>
              {selectedBill.paymentMethod && (
                <Descriptions.Item label="Payment Method" span={2}>
                  {selectedBill.paymentMethod}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Created">
                {new Date(selectedBill.createdAt).toLocaleString()}
              </Descriptions.Item>
              {selectedBill.paidAt && (
                <Descriptions.Item label="Paid At">
                  {new Date(selectedBill.paidAt).toLocaleString()}
                </Descriptions.Item>
              )}
              {selectedBill.notes && (
                <Descriptions.Item label="Notes" span={2}>
                  {selectedBill.notes}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Bill Items Section */}
            {selectedBill.billItems && selectedBill.billItems.length > 0 && (
              <>
                <Divider>
                  <Text strong>Billed Items</Text>
                </Divider>
                <Table
                  dataSource={selectedBill.billItems}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: 'Medication',
                      key: 'medication',
                      render: (_, record) => (
                        <div>
                          <Text strong>{record.medicationName}</Text>
                          {record.strength && (
                            <div style={{ color: '#666', fontSize: '12px' }}>
                              Strength: {record.strength}
                            </div>
                          )}
                          {record.manufacturer && (
                            <div style={{ color: '#666', fontSize: '12px' }}>
                              Manufacturer: {record.manufacturer}
                            </div>
                          )}
                          {record.batchNumber && (
                            <div style={{ color: '#666', fontSize: '12px' }}>
                              Batch: {record.batchNumber}
                            </div>
                          )}
                        </div>
                      ),
                    },
                    {
                      title: 'Instructions',
                      key: 'instructions',
                      render: (_, record) => (
                        <div>
                          {record.dosage && record.dosage !== 'N/A' && (
                            <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                              <Text strong>Dosage:</Text> {record.dosage}
                            </div>
                          )}
                          {record.instructions && record.instructions !== record.dosage && (
                            <div style={{ fontSize: '12px' }}>
                              <Text strong>Instructions:</Text> {record.instructions}
                            </div>
                          )}
                          {(!record.dosage || record.dosage === 'N/A') && !record.instructions && (
                            <Text type="secondary">No instructions</Text>
                          )}
                        </div>
                      ),
                    },
                    {
                      title: 'Quantity',
                      dataIndex: 'quantity',
                      key: 'quantity',
                      align: 'center',
                      render: (quantity) => <Text strong>{quantity}</Text>,
                    },
                    {
                      title: 'Unit Price',
                      dataIndex: 'unitPrice',
                      key: 'unitPrice',
                      align: 'right',
                      render: (price) => `Rs. ${price.toFixed(2)}`,
                    },
                    {
                      title: 'Total',
                      dataIndex: 'totalPrice',
                      key: 'totalPrice',
                      align: 'right',
                      render: (total) => (
                        <Text strong style={{ color: '#1890ff' }}>
                          Rs. {total.toFixed(2)}
                        </Text>
                      ),
                    },
                  ]}
                  summary={() => (
                    <Table.Summary>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={4}>
                          <Text strong>Total Items: {selectedBill.billItems?.length || 0}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <Text strong style={{ color: '#1890ff' }}>
                            Rs. {selectedBill.subtotal.toFixed(2)}
                          </Text>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              </>
            )}

            {(!selectedBill.billItems || selectedBill.billItems.length === 0) && (
              <>
                <Divider>
                  <Text strong>Billed Items</Text>
                </Divider>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No items found in this bill"
                />
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Payment Type Selection Modal */}
      <Modal
        title="Select Payment Type"
        open={paymentTypeModalVisible}
        onCancel={() => setPaymentTypeModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          layout="vertical"
          onFinish={updatePaymentType}
          initialValues={{ paymentType: selectedBill?.paymentType || 'PAY_ON_PICKUP' }}
        >
          <Form.Item
            name="paymentType"
            label="Choose how you want to pay"
            rules={[{ required: true, message: 'Please select a payment type' }]}
          >
            <Radio.Group style={{ width: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio value="PAY_ON_PICKUP" style={{ width: '100%' }}>
                  <Card 
                    size="small" 
                    style={{ margin: '8px 0', border: '1px solid #d9d9d9', cursor: 'pointer' }}
                  >
                    <Space>
                      <WalletOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
                      <div>
                        <Text strong>Pay on Pickup</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Pay when collecting your medicine at the pharmacy
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </Radio>
                <Radio value="ONLINE" style={{ width: '100%' }}>
                  <Card 
                    size="small" 
                    style={{ margin: '8px 0', border: '1px solid #d9d9d9', cursor: 'pointer' }}
                  >
                    <Space>
                      <CreditCardOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                      <div>
                        <Text strong>Online Payment</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Pay now using your credit/debit card
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setPaymentTypeModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Update Payment Type
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Online Payment Modal */}
      <Modal
        title="Online Payment & Delivery Details"
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedBill && (
          <>
            <Alert
              message={`Bill Amount: Rs. ${selectedBill.totalAmount.toFixed(2)}`}
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            <Form
              form={form}
              layout="vertical"
              onFinish={processPayment}
              initialValues={{ 
                paymentMethod: 'CARD',
                country: 'Sri Lanka'
              }}
            >
              {/* Payment Method Section */}
              <Card title="Payment Information" style={{ marginBottom: '16px' }}>
                <Form.Item
                  name="paymentMethod"
                  label="Payment Method"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value="CARD">Credit/Debit Card</Option>
                    <Option value="BANK_TRANSFER">Bank Transfer</Option>
                  </Select>
                </Form.Item>

                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="cardHolderName"
                      label="Card Holder Name"
                      rules={[{ required: true, message: 'Please enter card holder name' }]}
                    >
                      <Input placeholder="John Doe" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={16}>
                    <Form.Item
                      name="cardNumber"
                      label="Card Number"
                      rules={[
                        { required: true, message: 'Please enter card number' },
                        { len: 16, message: 'Card number must be 16 digits' }
                      ]}
                    >
                      <Input 
                        placeholder="1234 5678 9012 3456" 
                        maxLength={16}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '')
                          form.setFieldValue('cardNumber', value)
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="cvv"
                      label="CVV"
                      rules={[
                        { required: true, message: 'Please enter CVV' },
                        { len: 3, message: 'CVV must be 3 digits' }
                      ]}
                    >
                      <Input 
                        placeholder="123" 
                        maxLength={3}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '')
                          form.setFieldValue('cvv', value)
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="expiryDate"
                      label="Expiry Date (MM/YY)"
                      rules={[{ required: true, message: 'Please enter expiry date' }]}
                    >
                      <Input 
                        placeholder="12/25" 
                        maxLength={5}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '')
                          if (value.length >= 2) {
                            value = value.slice(0, 2) + '/' + value.slice(2, 4)
                          }
                          form.setFieldValue('expiryDate', value)
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* Delivery Information Section */}
              <Card title="Delivery Information" style={{ marginBottom: '16px' }}>
                <Alert
                  message="Home Delivery"
                  description="Since you're paying online, your medicines will be delivered to your specified address."
                  type="info"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="recipientName"
                      label="Recipient Name"
                      rules={[{ required: true, message: 'Please enter recipient name' }]}
                    >
                      <Input placeholder="Full name of person receiving the delivery" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="contactPhone"
                      label="Contact Phone"
                      rules={[
                        { required: true, message: 'Please enter contact phone' },
                        { pattern: /^[0-9+\-\s()]+$/, message: 'Please enter a valid phone number' }
                      ]}
                    >
                      <Input placeholder="+94 77 123 4567" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="alternatePhone"
                      label="Alternate Phone (Optional)"
                      rules={[
                        { pattern: /^[0-9+\-\s()]*$/, message: 'Please enter a valid phone number' }
                      ]}
                    >
                      <Input placeholder="+94 11 234 5678" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="email"
                      label="Email (Optional)"
                      rules={[
                        { type: 'email', message: 'Please enter a valid email' }
                      ]}
                    >
                      <Input placeholder="email@example.com" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="addressLine1"
                  label="Address Line 1"
                  rules={[{ required: true, message: 'Please enter address' }]}
                >
                  <Input placeholder="House number, street name" />
                </Form.Item>

                <Form.Item
                  name="addressLine2"
                  label="Address Line 2 (Optional)"
                >
                  <Input placeholder="Apartment, suite, unit, building, floor, etc." />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="city"
                      label="City"
                      rules={[{ required: true, message: 'Please enter city' }]}
                    >
                      <Input placeholder="Colombo" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="stateProvince"
                      label="State/Province"
                      rules={[{ required: true, message: 'Please enter state/province' }]}
                    >
                      <Input placeholder="Western Province" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="postalCode"
                      label="Postal Code"
                      rules={[{ required: true, message: 'Please enter postal code' }]}
                    >
                      <Input placeholder="00100" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="country"
                  label="Country"
                  rules={[{ required: true, message: 'Please select country' }]}
                >
                  <Select placeholder="Select country">
                    <Option value="Sri Lanka">Sri Lanka</Option>
                    <Option value="India">India</Option>
                    <Option value="Maldives">Maldives</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="deliveryInstructions"
                  label="Delivery Instructions (Optional)"
                >
                  <TextArea 
                    rows={3}
                    placeholder="Special delivery instructions (e.g., ring bell twice, leave with security, etc.)"
                  />
                </Form.Item>

                <Form.Item
                  name="preferredDeliveryTime"
                  label="Preferred Delivery Time (Optional)"
                >
                  <Select placeholder="Select preferred delivery time">
                    <Option value="Morning (9AM - 12PM)">Morning (9AM - 12PM)</Option>
                    <Option value="Afternoon (12PM - 5PM)">Afternoon (12PM - 5PM)</Option>
                    <Option value="Evening (5PM - 8PM)">Evening (5PM - 8PM)</Option>
                    <Option value="Anytime">Anytime</Option>
                  </Select>
                </Form.Item>
              </Card>

              <Divider />

              <Alert
                message="Secure Payment & Free Delivery"
                description="Your payment information is encrypted and secure. Home delivery is free for online payments."
                type="success"
                showIcon
                style={{ marginBottom: '16px' }}
              />

              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setPaymentModalVisible(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={processingPayment}
                    icon={<CreditCardOutlined />}
                  >
                    {processingPayment ? 'Processing...' : `Pay Rs. ${selectedBill.totalAmount.toFixed(2)} & Order`}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  )
}

export default CustomerBillsPage