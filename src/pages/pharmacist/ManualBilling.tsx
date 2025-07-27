/**
 * Manual Billing Component
 * 
 * This component handles direct sales when customers arrive at the pharmacy
 * to purchase medicine without a prescription. Used for over-the-counter 
 * medications and walk-in purchases.
 */

import React, { useState, useEffect, useRef } from 'react'
import { 
  Typography, 
  Table, 
  Button, 
  Space, 
  Card, 
  Row, 
  Col,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  Divider,
  message,
  Descriptions,
  List,
  Avatar,
  AutoComplete,
  Spin,
  Empty
} from 'antd'
import { 
  PlusOutlined,
  DeleteOutlined,
  PrinterOutlined,
  ShoppingCartOutlined,
  SearchOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  CalculatorOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { manualBillingService, Medicine, ManualBillItem } from '../../services/manualBillingService'

const { Title, Text } = Typography
const { Option } = Select

interface Customer {
  id?: string
  name: string
  phone?: string
  email?: string
}

const ManualBilling: React.FC = () => {
  // State management
  const [billItems, setBillItems] = useState<ManualBillItem[]>([])
  const [customer, setCustomer] = useState<Customer>({ name: '' })
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [searchMedicine, setSearchMedicine] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [receivedAmount, setReceivedAmount] = useState<number>(0)
  const [discount, setDiscount] = useState<number>(0)
  const [tax, setTax] = useState<number>(0)
  const [billPreviewVisible, setBillPreviewVisible] = useState(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [medicineOptions, setMedicineOptions] = useState<Array<{ value: string; label: React.ReactNode; medicine: Medicine }>>([])
  
  const [form] = Form.useForm()

  // Payment methods
  const paymentMethods = [
    { value: 'CASH', label: 'Cash', icon: '💵' },
    { value: 'CREDIT_CARD', label: 'Credit Card', icon: '💳' },
    { value: 'DEBIT_CARD', label: 'Debit Card', icon: '💳' },
    { value: 'UPI', label: 'UPI/Digital', icon: '📱' },
    { value: 'CHECK', label: 'Check', icon: '🏦' }
  ]

  useEffect(() => {
    loadMedicines()
  }, [])

  // Load medicines from service
  const loadMedicines = async () => {
    try {
      setSearchLoading(true)
      const medicineData = await manualBillingService.getAllMedicines()
      setMedicines(medicineData)
    } catch (error) {
      console.error('Error loading medicines:', error)
      message.error('Failed to load medicines')
    } finally {
      setSearchLoading(false)
    }
  }

  // Search medicines with debouncing
  const searchMedicines = (query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      if (!query || query.length < 2) {
        setMedicineOptions([])
        return
      }

      try {
        setSearchLoading(true)
        console.log('Searching medicines with query:', query)
        const results = await manualBillingService.searchMedicines(query)
        console.log('Search results:', results)
        
        const options = results.map(medicine => ({
          value: medicine.id.toString(),
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div><Text strong>{medicine.name}</Text></div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {medicine.strength} • {medicine.dosageForm || medicine.form} • {medicine.manufacturer || 'Generic'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Text type="success">Rs.{medicine.unitPrice.toFixed(2)}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  Stock: {medicine.quantity || medicine.stock} | Batch No: {medicine.batchNumber || 'N/A'}
                </Text>
              </div>
            </div>
          ),
          medicine
        }))
        setMedicineOptions(options)
        console.log('Medicine options set:', options.length)
      } catch (error) {
        console.error('Error searching medicines:', error)
        setMedicineOptions([])
        message.error('Failed to search medicines. Please check your connection.')
      } finally {
        setSearchLoading(false)
      }
    }, 300)
  }

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchMedicine(value)
    searchMedicines(value)
  }

  // Add item to bill
  const addItemToBill = (medicineId: string) => {
    // First try to find from searched options
    const selectedOption = medicineOptions.find(option => option.value === medicineId)
    let medicine = selectedOption?.medicine

    // If not found in options, try from all medicines
    medicine ??= medicines.find(m => m.id === medicineId)

    if (!medicine) {
      message.error('Medicine not found')
      return
    }

    // Check stock availability
    const availableStock = medicine.quantity || medicine.stock || 0
    if (availableStock === 0) {
      message.error(`${medicine.name} is out of stock`)
      return
    }

    // Check if item already exists
    const existingItem = billItems.find(item => item.medicineId === medicineId)
    if (existingItem) {
      // Increase quantity by 1, but check stock first
      const newQuantity = existingItem.quantity + 1
      if (newQuantity > availableStock) {
        message.error(`Cannot add more units. Only ${availableStock} units available in stock for ${medicine.name}`)
        return
      }
      updateItemQuantity(existingItem.id, newQuantity)
      return
    }

    // Check if at least 1 unit is available for new item
    if (availableStock < 1) {
      message.error(`Cannot add ${medicine.name}. No stock available`)
      return
    }

    const newItem: ManualBillItem = {
      id: Date.now().toString(),
      medicineId: medicine.id,
      medicineName: medicine.name,
      strength: medicine.strength,
      form: medicine.form,
      unitPrice: medicine.unitPrice,
      quantity: 1,
      discount: 0,
      subtotal: medicine.unitPrice
    }

    setBillItems([...billItems, newItem])
    setSearchMedicine('')
    setMedicineOptions([]) // Clear search options after adding
    message.success(`${medicine.name} added to bill`)
  }

  // Update item quantity
  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromBill(itemId)
      return
    }

    // Find the bill item to get medicine details for stock validation
    const billItem = billItems.find(item => item.id === itemId)
    if (!billItem) {
      message.error('Item not found')
      return
    }

    // Find the medicine to check stock availability
    const medicine = medicines.find(m => m.id === billItem.medicineId)
    if (!medicine) {
      message.error('Medicine details not found')
      return
    }

    // Check if requested quantity exceeds available stock
    const availableStock = medicine.quantity || medicine.stock || 0
    if (quantity > availableStock) {
      message.error(`Cannot add ${quantity} units. Only ${availableStock} units available in stock for ${medicine.name}`)
      return
    }

    setBillItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { ...item, quantity, subtotal: (item.unitPrice * quantity) - item.discount }
          : item
      )
    )
  }

  // Update item discount
  const updateItemDiscount = (itemId: string, discount: number) => {
    setBillItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { ...item, discount, subtotal: (item.unitPrice * item.quantity) - discount }
          : item
      )
    )
  }

  // Remove item from bill
  const removeItemFromBill = (itemId: string) => {
    setBillItems(prevItems => prevItems.filter(item => item.id !== itemId))
    message.success('Item removed from bill')
  }

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = billItems.reduce((sum, item) => sum + item.subtotal, 0)
    const discountAmount = discount
    const taxPrecentage = 0.1
    const taxAmount = subtotal * taxPrecentage
    const total = subtotal - discountAmount + taxAmount
    const changeAmount = receivedAmount - total

    return {
      subtotal: subtotal.toFixed(2),
      discount: discountAmount.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      change: changeAmount.toFixed(2),
      totalItems: billItems.reduce((sum, item) => sum + item.quantity, 0)
    }
  }

  const totals = calculateTotals()

  // Generate bill
  const generateBill = async () => {
    if (billItems.length === 0) {
      message.error('Please add items to the bill')
      return
    }

    if (!customer.name.trim()) {
      message.error('Please enter customer name')
      return
    }

    if (paymentMethod === 'CASH' && parseFloat(totals.change) < 0) {
      message.error('Received amount is less than total')
      return
    }

    try {
      setLoading(true)

      // Prepare bill data
      const billData = {
        customer,
        items: billItems,
        subtotal: parseFloat(totals.subtotal),
        discount,
        total: parseFloat(totals.total),
        paymentMethod,
        receivedAmount: paymentMethod === 'CASH' ? receivedAmount : parseFloat(totals.total),
        changeAmount: paymentMethod === 'CASH' ? parseFloat(totals.change) : 0
      }

      // Call the service to generate bill
      await manualBillingService.generateBill(billData)

      message.success('Bill generated successfully!')
      setBillPreviewVisible(true)

    } catch (error) {
      message.error('Failed to generate bill')
      console.error('Bill generation error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Clear bill
  const clearBill = () => {
    setBillItems([])
    setCustomer({ name: '' })
    setDiscount(0)
    setReceivedAmount(0)
    form.resetFields()
    message.success('Bill cleared')
  }

  // Print bill
  const printBill = () => {
    message.success('Sending to printer...')
    setBillPreviewVisible(false)
    clearBill()
  }

  // Bill items table columns
  const columns = [
    {
      title: 'Medicine',
      key: 'medicine',
      render: (_: any, record: ManualBillItem) => {
        // Find the medicine to get stock information
        const medicine = medicines.find(m => m.id === record.medicineId)
        const availableStock = medicine ? (medicine.quantity || medicine.stock || 0) : 0
        
        return (
          <Space direction="vertical" size="small">
            <Text strong>{record.medicineName}</Text>
            <Text type="secondary">{record.strength} - {record.form}</Text>
            <Text 
              type={availableStock < 10 ? "warning" : "secondary"} 
              style={{ fontSize: '11px' }}
            >
              Stock: {availableStock} available
            </Text>
          </Space>
        )
      },
    },
    {
      title: 'Unit Price',
      key: 'unitPrice',
      render: (_: any, record: ManualBillItem) => (
        <Text>Rs.{record.unitPrice.toFixed(2)}</Text>
      ),
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: (_: any, record: ManualBillItem) => {
        // Find the medicine to get stock information
        const medicine = medicines.find(m => m.id === record.medicineId)
        const availableStock = medicine ? (medicine.quantity || medicine.stock || 0) : 99
        
        return (
          <InputNumber
            min={1}
            max={availableStock}
            value={record.quantity}
            onChange={(value) => updateItemQuantity(record.id, value || 1)}
            style={{ width: '80px' }}
            title={`Available stock: ${availableStock}`}
          />
        )
      },
    },
    {
      title: 'Subtotal',
      key: 'subtotal',
      render: (_: any, record: ManualBillItem) => (
        <Text strong>Rs.{record.subtotal.toFixed(2)}</Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ManualBillItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItemFromBill(record.id)}
        />
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <ShoppingCartOutlined style={{ marginRight: '8px' }} />
          Manual Billing
        </Title>
        <Text type="secondary">
          Generate bills for walk-in customers and over-the-counter purchases
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column - Bill Creation */}
        <Col xs={24} lg={16}>
          {/* Customer Information */}
          <Card title="Customer Information" style={{ marginBottom: '24px' }}>
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Customer Name"
                    name="customerName"
                    rules={[{ required: true, message: 'Please enter customer name' }]}
                  >
                    <Input
                      placeholder="Enter customer name"
                      prefix={<UserOutlined />}
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Phone Number" name="customerPhone">
                    <Input
                      placeholder="Enter phone number (optional)"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          {/* Add Medicine */}
          <Card title="Add Medicine" style={{ marginBottom: '24px' }}>
            <AutoComplete
              style={{ width: '100%' }}
              placeholder="Search medicine by name or category..."
              value={searchMedicine}
              onChange={handleSearchChange}
              onSelect={(value) => addItemToBill(value)}
              options={medicineOptions}
              filterOption={false}
              notFoundContent={searchLoading ? <Spin size="small" /> : <Empty />}
            >
              <Input
                prefix={<SearchOutlined />}
                suffix={
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    disabled={!searchMedicine || medicineOptions.length === 0}
                    onClick={() => {
                      if (medicineOptions.length > 0) {
                        addItemToBill(medicineOptions[0].value)
                      }
                    }}
                  >
                    Add
                  </Button>
                }
              />
            </AutoComplete>
            <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
              Type medicine name and press Enter or click Add to add to bill
            </Text>
          </Card>

          {/* Bill Items */}
          <Card 
            title={
              <Space>
                <FileTextOutlined />
                Bill Items ({billItems.length})
              </Space>
            }
            extra={
              billItems.length > 0 && (
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={clearBill}
                >
                  Clear All
                </Button>
              )
            }
          >
            {billItems.length === 0 ? (
              <Empty
                description="No items added yet"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Table
                dataSource={billItems}
                columns={columns}
                pagination={false}
                size="small"
                rowKey="id"
                scroll={{ x: 800 }}
              />
            )}
          </Card>
        </Col>

        {/* Right Column - Bill Summary */}
        <Col xs={24} lg={8}>
          {/* Bill Summary */}
          <Card
            title={
              <Space>
                <CalculatorOutlined />
                Bill Summary
              </Space>
            }
            style={{ position: 'sticky', top: '24px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* Totals */}
              <div>
                <Row justify="space-between">
                  <Col>Subtotal:</Col>
                  <Col><Text strong>Rs.{totals.subtotal}</Text></Col>
                </Row>
                <Row justify="space-between">
                  <Col>Items:</Col>
                  <Col><Text>{totals.totalItems}</Text></Col>
                </Row>
                <Row justify="space-between">
                  <Col>Tax(10%):</Col>
                  <Col><Text>{totals.taxAmount}</Text></Col>
                </Row>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              {/* Discount */}
              <div>
                <Row justify="space-between" style={{ marginBottom: '8px' }}>
                  <Col>Overall Discount:</Col>
                </Row>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={parseFloat(totals.subtotal)}
                  value={discount}
                  onChange={(value) => setDiscount(value || 0)}
                  prefix="Rs."
                  precision={2}
                />
              </div>

              <Divider style={{ margin: '12px 0' }} />

              {/* Total */}
              <Row justify="space-between">
                <Col><Text strong style={{ fontSize: '16px' }}>Total:</Text></Col>
                <Col><Text strong style={{ fontSize: '18px', color: '#52c41a' }}>Rs.{totals.total}</Text></Col>
              </Row>

              <Divider style={{ margin: '12px 0' }} />

              {/* Payment Method */}
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Payment Method:</Text>
                <Select
                  style={{ width: '100%' }}
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                >
                  {paymentMethods.map(method => (
                    <Option key={method.value} value={method.value}>
                      <Space>
                        <span>{method.icon}</span>
                        <span>{method.label}</span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </div>

              {/* Cash Payment Details */}
              {paymentMethod === 'CASH' && (
                <div>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>Amount Received:</Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    value={receivedAmount}
                    onChange={(value) => setReceivedAmount(value || 0)}
                    prefix="Rs."
                    precision={2}
                  />
                  {receivedAmount > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <Row justify="space-between">
                        <Col>Change:</Col>
                        <Col>
                          <Text 
                            strong 
                            style={{ 
                              color: parseFloat(totals.change) >= 0 ? '#52c41a' : '#ff4d4f' 
                            }}
                          >
                            Rs.{totals.change}
                          </Text>
                        </Col>
                      </Row>
                    </div>
                  )}
                </div>
              )}

              <Divider style={{ margin: '12px 0' }} />

              {/* Action Buttons */}
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckCircleOutlined />}
                  onClick={generateBill}
                  loading={loading}
                  disabled={billItems.length === 0}
                  style={{ width: '100%' }}
                >
                  Generate Bill
                </Button>
                <Button
                  icon={<CloseOutlined />}
                  onClick={clearBill}
                  disabled={billItems.length === 0}
                  style={{ width: '100%' }}
                >
                  Clear Bill
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Bill Preview Modal */}
      <Modal
        title="Bill Preview"
        open={billPreviewVisible}
        onCancel={() => setBillPreviewVisible(false)}
        width={600}
        footer={[
          <Button key="close" onClick={() => setBillPreviewVisible(false)}>
            Close
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={printBill}>
            Print Bill
          </Button>,
        ]}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={3}>PhillDesk Pharmacy</Title>
          <Text type="secondary">123 Healthcare Ave, Medical District</Text>
          <br />
          <Text type="secondary">Phone: +1 (555) 123-4567</Text>
        </div>

        <Divider />

        <Descriptions size="small" column={2}>
          <Descriptions.Item label="Bill No">MAN-{Date.now()}</Descriptions.Item>
          <Descriptions.Item label="Date">{new Date().toLocaleDateString()}</Descriptions.Item>
          <Descriptions.Item label="Customer">{customer.name}</Descriptions.Item>
          <Descriptions.Item label="Payment">{paymentMethods.find(p => p.value === paymentMethod)?.label}</Descriptions.Item>
        </Descriptions>

        <Divider />

        <List
          size="small"
          dataSource={billItems}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<MedicineBoxOutlined />} />}
                title={`${item.medicineName} - ${item.strength}`}
                description={`${item.form} | Qty: ${item.quantity} | Rs.${item.unitPrice.toFixed(2)} each`}
              />
              <Text strong>Rs.{item.subtotal.toFixed(2)}</Text>
            </List.Item>
          )}
        />

        <Divider />

        <Row justify="space-between" style={{ marginBottom: '8px' }}>
          <Col>Subtotal:</Col>
          <Col>Rs.{totals.subtotal}</Col>
        </Row>
        <Row justify="space-between" style={{ marginBottom: '8px' }}>
          <Col>Discount:</Col>
          <Col>Rs.{totals.discount}</Col>
        </Row>
        <Row justify="space-between" style={{ fontSize: '16px', fontWeight: 'bold' }}>
          <Col>Total:</Col>
          <Col>Rs.{totals.total}</Col>
        </Row>

        {paymentMethod === 'CASH' && (
          <>
            <Row justify="space-between" style={{ marginTop: '8px' }}>
              <Col>Received:</Col>
              <Col>Rs.{receivedAmount.toFixed(2)}</Col>
            </Row>
            <Row justify="space-between">
              <Col>Change:</Col>
              <Col>Rs.{totals.change}</Col>
            </Row>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Text type="secondary">Thank you for your purchase!</Text>
        </div>
      </Modal>
    </div>
  )
}

export default ManualBilling
