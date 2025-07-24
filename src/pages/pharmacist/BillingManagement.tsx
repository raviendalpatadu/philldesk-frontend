/**
 * Pharmacist Billing Management
 * 
 * This component provides comprehensive billing management functionality for pharmacists,
 * including invoice generation, payment processing, insurance claims, and financial reporting.
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
  Form,
  InputNumber,
  Divider,
  message,
  Tooltip,
  Alert,
  Progress,
  Descriptions,
  Tabs,
  Spin
} from 'antd'
import { 
  PlusOutlined,
  EyeOutlined,
  PrinterOutlined,
  MailOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  SearchOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  ShoppingCartOutlined,
  PhoneOutlined,
  BarChartOutlined,
  DollarOutlined
} from '@ant-design/icons'
import { pharmacistService, TransformedBill } from '../../services/pharmacistService'

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker
const { TabPane } = Tabs

const BillingManagement: React.FC = () => {
  // Payment methods - could be fetched from backend in the future
  const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CREDIT_CARD', label: 'Credit Card' },
    { value: 'DEBIT_CARD', label: 'Debit Card' },
    { value: 'INSURANCE', label: 'Insurance' },
    { value: 'CHECK', label: 'Check' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' }
  ]

  // State for bills and UI
  const [pendingBills, setPendingBills] = useState<TransformedBill[]>([])
  const [generatedInvoices, setGeneratedInvoices] = useState<TransformedBill[]>([])
  const [readyForPickup, setReadyForPickup] = useState<any[]>([])
  const [filteredBills, setFilteredBills] = useState<TransformedBill[]>([])
  const [selectedBill, setSelectedBill] = useState<TransformedBill | null>(null)
  const [selectedPickup, setSelectedPickup] = useState<any | null>(null)
  const [billingModalVisible, setBillingModalVisible] = useState(false)
  const [paymentModalVisible, setPaymentModalVisible] = useState(false)
  const [pickupBillModalVisible, setPickupBillModalVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('pending')
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [paymentForm] = Form.useForm()
  const [pickupPaymentForm] = Form.useForm()

  // Load initial data
  useEffect(() => {
    loadBillingData()
  }, [])

  // Load billing data from backend
  const loadBillingData = async () => {
    try {
      setLoading(true)
      console.log('Loading billing data from backend...')

      // Load pending bills, paid bills, and ready-for-pickup prescriptions in parallel
      const [pendingResponse, paidResponse, pickupResponse] = await Promise.all([
        pharmacistService.getPendingBills(),
        pharmacistService.getPaidBills(),
        pharmacistService.getPrescriptionsReadyForPickup()
      ])

      console.log('Pending bills:', pendingResponse)
      console.log('Paid bills:', paidResponse)
      console.log('Ready for pickup:', pickupResponse)

      // Set pending bills (empty array if no data)
      const pendingData = pendingResponse || []
      setPendingBills(pendingData)
      setFilteredBills(pendingData)
      
      if (pendingData.length > 0) {
        message.success(`Loaded ${pendingData.length} pending bills from backend`)
      } else {
        message.info('No pending bills found')
      }

      // Set paid bills/invoices (empty array if no data)
      const invoiceData = paidResponse || []
      setGeneratedInvoices(invoiceData)
      
      if (invoiceData.length > 0) {
        message.success(`Loaded ${invoiceData.length} invoices from backend`)
      } else {
        message.info('No invoices found')
      }

      // Set ready-for-pickup prescriptions
      const pickupData = pickupResponse || []
      setReadyForPickup(pickupData)
      
      if (pickupData.length > 0) {
        message.success(`Loaded ${pickupData.length} prescriptions ready for pickup`)
      } else {
        message.info('No prescriptions ready for pickup')
      }
    } catch (error) {
      console.error('Failed to load billing data:', error)
      message.error('Failed to load billing data from backend')
      // Set empty arrays instead of mock data
      setPendingBills([])
      setFilteredBills([])
      setGeneratedInvoices([])
    } finally {
      setLoading(false)
    }
  }

  // Collect payment for pickup
  const collectPickupPayment = async (prescriptionId: string, paymentData: any) => {
    try {
      setLoading(true)
      console.log('Collecting payment for prescription:', prescriptionId, paymentData)

      await pharmacistService.collectPayment(prescriptionId, paymentData)
      message.success('Payment collected successfully and prescription dispensed!')
      
      // Refresh data
      await loadBillingData()
      setPickupBillModalVisible(false)
      pickupPaymentForm.resetFields()
    } catch (error) {
      console.error('Error collecting payment:', error)
      message.error('Failed to collect payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle pickup payment submission
  const handlePickupPaymentSubmit = async (values: any) => {
    if (!selectedPickup) return

    await collectPickupPayment(selectedPickup.id.toString(), {
      paymentMethod: values.paymentMethod,
      notes: values.notes
    })
  }

  // Open combined pickup bill and payment modal
  const openPickupBillModal = (prescription: any) => {
    setSelectedPickup(prescription)
    setSelectedBill(prescription) // Set bill data for viewing
    setPickupBillModalVisible(true)
    pickupPaymentForm.resetFields()
  }

  // Calculate statistics
  const stats = {
    pendingBills: pendingBills.length,
    totalPendingAmount: pendingBills.reduce((sum, bill) => sum + (bill.total || bill.totalAmount || 0), 0),
    readyForBilling: pendingBills.filter(bill => bill.status === 'Ready for Billing').length,
    insuranceVerification: pendingBills.filter(bill => bill.status === 'Insurance Verification').length,
    readyForPickup: readyForPickup.length,
    totalInvoices: generatedInvoices.length,
    paidInvoices: generatedInvoices.filter(inv => inv.status === 'Paid').length,
    totalRevenue: generatedInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0),
    pendingPayments: generatedInvoices.reduce((sum, inv) => sum + ((inv.amount || inv.totalAmount || 0) - (inv.paidAmount || 0)), 0)
  }

  // Filter pending bills
  const handleFilter = async () => {
    try {
      let filtered = pendingBills

      // If search text is provided and long enough, use backend search
      if (searchText && searchText.length > 2) {
        setLoading(true)
        try {
          const searchResults = await pharmacistService.searchBills(searchText)
          filtered = searchResults.filter(bill => 
            bill.paymentStatus === 'PENDING' || bill.status?.includes('Pending')
          )
          console.log('Search results from backend:', filtered)
        } catch (error) {
          console.error('Backend search failed, using local filter:', error)
          // Fallback to local filtering
          filtered = filtered.filter(bill => 
            bill.customerName?.toLowerCase().includes(searchText.toLowerCase()) ||
            bill.orderId?.toLowerCase().includes(searchText.toLowerCase()) ||
            bill.prescriptionId?.toString().toLowerCase().includes(searchText.toLowerCase()) ||
            bill.prescriptionNumber?.toLowerCase().includes(searchText.toLowerCase())
          )
        } finally {
          setLoading(false)
        }
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter(bill => 
          bill.status === statusFilter || 
          bill.paymentStatus === statusFilter.toUpperCase()
        )
      }

      setFilteredBills(filtered)
      console.log(`Filtered bills: ${filtered.length} items`)
    } catch (error) {
      console.error('Error filtering bills:', error)
      message.error('Failed to filter bills')
    }
  }

  // Generate bill/invoice
  const generateBill = async (bill: any) => {
    try {
      setLoading(true)
      console.log('Generating bill for prescription:', bill.prescriptionId || bill.id)

      // If we have a prescription ID, generate bill from prescription
      if (bill.prescriptionId || bill.id) {
        const prescriptionId = bill.prescriptionId || bill.id
        const generatedBill = await pharmacistService.generateBillFromPrescription(prescriptionId.toString())
        
        console.log('Bill generated successfully:', generatedBill)
        message.success('Bill generated successfully!')
        
        // Refresh billing data
        await loadBillingData()
        
        // Show the generated bill details
        setSelectedBill(generatedBill)
        setBillingModalVisible(true)
      } else {
        // Fallback to manual billing modal
        setSelectedBill(bill)
        setBillingModalVisible(true)
        form.setFieldsValue({
          orderId: bill.orderId || bill.id,
          customerName: bill.customerName || 'Unknown Customer',
          subtotal: bill.subtotal || bill.totalAmount || 0,
          tax: bill.tax || 0,
          shipping: bill.shipping || 0,
          discount: bill.discount || 0,
          total: bill.total || bill.totalAmount || 0,
          dueDate: null,
          paymentTerms: 'Net 15',
          notes: ''
        })
      }
    } catch (error) {
      console.error('Error generating bill:', error)
      message.error('Failed to generate bill. Please try again.')
      
      // Fallback to manual billing
      setSelectedBill(bill)
      setBillingModalVisible(true)
      form.setFieldsValue({
        orderId: bill.orderId || bill.id,
        customerName: bill.customerName || 'Unknown Customer',
        subtotal: bill.subtotal || bill.totalAmount || 0,
        tax: bill.tax || 0,
        shipping: bill.shipping || 0,
        discount: bill.discount || 0,
        total: bill.total || bill.totalAmount || 0,
        dueDate: null,
        paymentTerms: 'Net 15',
        notes: ''
      })
    } finally {
      setLoading(false)
    }
  }

  // Process payment
  const processPayment = async (invoice: any) => {
    try {
      setSelectedBill(invoice)
      setPaymentModalVisible(true)
    } catch (error) {
      console.error('Error processing payment:', error)
      message.error('Failed to open payment modal')
    }
  }

  // Handle payment processing
  const handlePaymentSubmit = async (paymentData: any) => {
    try {
      setLoading(true)
      console.log('Processing payment:', paymentData)

      const billId = selectedBill?.id || selectedBill?.invoiceId
      if (billId && selectedBill) {
        await pharmacistService.markBillAsPaid(billId.toString(), paymentData.paymentMethod)
        message.success('Payment processed successfully!')
        
        // Refresh billing data
        await loadBillingData()
        setPaymentModalVisible(false)
      } else {
        throw new Error('Bill ID not found')
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      message.error('Failed to process payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // View invoice details - can be used for both regular bills and pickup bills
  const viewInvoiceDetails = (invoice: any) => {
    setSelectedBill(invoice)
    // Check if this is a pickup prescription vs regular bill
    if (invoice.status === 'READY_FOR_PICKUP' || invoice.prescriptionNumber) {
      setSelectedPickup(invoice)
      setPickupBillModalVisible(true)
    } else {
      setPickupBillModalVisible(true) // Use same modal for consistency
    }
  }

  // Get status display
  const getStatusDisplay = (status: string) => {
    const configs = {
      'Pending Billing': { color: 'blue', icon: <ClockCircleOutlined /> },
      'Ready for Billing': { color: 'green', icon: <CheckCircleOutlined /> },
      'Insurance Verification': { color: 'orange', icon: <ExclamationCircleOutlined /> },
      'Paid': { color: 'green', icon: <CheckCircleOutlined /> },
      'Partially Paid': { color: 'orange', icon: <ExclamationCircleOutlined /> },
      'Overdue': { color: 'red', icon: <WarningOutlined /> }
    }
    
    const config = configs[status as keyof typeof configs] || { color: 'default', icon: <ClockCircleOutlined /> }
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {status}
      </Tag>
    )
  }

  // Pickup columns for ready-for-pickup prescriptions
  const pickupColumns = [
    {
      title: 'Prescription Details',
      key: 'prescriptionDetails',
      width: 200,
      render: (_: any, record: any) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.prescriptionNumber || `RX-${record.id}`}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Customer: {record.customer?.firstName} {record.customer?.lastName}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Doctor: {record.doctorName || 'Not specified'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      width: 150,
      render: (_: any, record: any) => (
        <Space direction="vertical" size="small">
          <Text>{record.customerName}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.customerEmail}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.customerPhone}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Bill Amount',
      key: 'totalAmount',
      width: 120,
      render: (_: any, record: any) => {
        // Fetch bill amount from associated bill
        return <Text strong>Rs. {record.totalAmount?.toFixed(2) || '0.00'}</Text>
      },
    },
    {
      title: 'Ready Since',
      key: 'approvedAt',
      dataIndex: 'approvedAt',
      width: 120,
      render: (_: any, record: any) => (
        <Text type="secondary">
          {record.approvedAt ? new Date(record.approvedAt).toLocaleDateString() : 'Unknown'}
        </Text>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: () => (
        <Tag color="orange" icon={<ClockCircleOutlined />}>
          Ready for Pickup
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: any, record: any) => (
        <Space direction="vertical" size="small">
          <Space size="small">
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openPickupBillModal(record)}
            >
              View Bill & Collect Payment
            </Button>
          </Space>
        </Space>
      ),
    },
  ]

  // Pending bills columns
  const pendingBillsColumns = [
    {
      title: 'Order Details',
      key: 'orderDetails',
      width: 180,
      render: (_: any, record: TransformedBill) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.billNumber || record.orderId || 'No Bill Number'}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.prescriptionNumber ? `Rx: ${record.prescriptionNumber}` : 
             record.prescriptionId ? `Prescription ID: ${record.prescriptionId}` : 
             'No Prescription'}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.orderDate ? new Date(record.orderDate).toLocaleDateString() : 'No date'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      width: 200,
      render: (_: any, record: TransformedBill) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.customerName || 'Unknown Customer'}</Text>
          {record.customerPhone && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <PhoneOutlined /> {record.customerPhone}
            </Text>
          )}
          {record.customerEmail && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <MailOutlined /> {record.customerEmail}
            </Text>
          )}
          {!record.customerPhone && !record.customerEmail && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Customer ID: {record.id}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      width: 120,
      sorter: (a: TransformedBill, b: TransformedBill) => (a.total || a.totalAmount || 0) - (b.total || b.totalAmount || 0),
      render: (_: any, record: TransformedBill) => (
        <Space direction="vertical" size="small">
          <Text strong>${(record.total || record.totalAmount || 0).toFixed(2)}</Text>
          {record.subtotal > 0 && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Subtotal: ${record.subtotal.toFixed(2)}
            </Text>
          )}
          {record.discount > 0 && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Discount: -${record.discount.toFixed(2)}
            </Text>
          )}
          {record.tax > 0 && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Tax: +${record.tax.toFixed(2)}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      filters: [
        { text: 'Pending Billing', value: 'Pending Billing' },
        { text: 'Ready for Billing', value: 'Ready for Billing' },
        { text: 'Insurance Verification', value: 'Insurance Verification' },
      ],
      onFilter: (value: any, record: TransformedBill) => record.status === value,
      render: (status: string, record: TransformedBill) => (
        <Space direction="vertical" size="small">
          {getStatusDisplay(status)}
          {record.paymentType === 'ONLINE' && (
            <Tag color="blue">Online Payment</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: any, record: TransformedBill) => (
        <Space size="small" direction="vertical">
          <Space size="small">
            <Tooltip title="View Details">
              <Button 
                type="text" 
                icon={<EyeOutlined />} 
                size="small"
                onClick={() => viewInvoiceDetails(record)}
              />
            </Tooltip>
            
            <Tooltip title="Print">
              <Button 
                type="text" 
                icon={<PrinterOutlined />} 
                size="small"
                onClick={() => message.success('Printing...')}
              />
            </Tooltip>
          </Space>
          
          {record.status === 'Ready for Billing' && (
            <Button 
              type="primary" 
              size="small"
              onClick={() => generateBill(record)}
            >
              Generate Invoice
            </Button>
          )}
        </Space>
      ),
    },
  ]

  // Generated invoices columns
  const invoicesColumns = [
    {
      title: 'Invoice',
      key: 'invoice',
      width: 150,
      render: (_: any, record: TransformedBill) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.invoiceId || record.billNumber}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.orderId}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {new Date(record.generatedDate || record.createdAt).toLocaleDateString()}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 150,
    },
    {
      title: 'Amount',
      key: 'amount',
      width: 120,
      render: (_: any, record: TransformedBill) => {
        const amount = record.amount || record.totalAmount || 0
        const paidAmount = record.paidAmount || 0
        return (
          <Space direction="vertical" size="small">
            <Text strong>${amount.toFixed(2)}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Paid: ${paidAmount.toFixed(2)}
            </Text>
            {amount > paidAmount && (
              <Progress
                percent={amount > 0 ? Math.round((paidAmount / amount) * 100) : 0}
                size="small"
                strokeColor={paidAmount === 0 ? '#ff4d4f' : '#fa8c16'}
              />
            )}
          </Space>
        )
      },
    },
    {
      title: 'Due Date',
      key: 'dueDate',
      width: 100,
      render: (_: any, record: TransformedBill) => {
        // Calculate due date as 30 days from creation if not provided
        const dueDate = new Date(record.createdAt)
        dueDate.setDate(dueDate.getDate() + 30)
        return dueDate.toLocaleDateString()
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => getStatusDisplay(status),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_: any, record: TransformedBill) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => viewInvoiceDetails(record)}
            />
          </Tooltip>
          
          <Tooltip title="Print Invoice">
            <Button 
              type="text" 
              icon={<PrinterOutlined />} 
              size="small"
              onClick={() => message.success('Invoice printed!')}
            />
          </Tooltip>
          
          <Tooltip title="Send Email">
            <Button 
              type="text" 
              icon={<MailOutlined />} 
              size="small"
              onClick={() => message.success('Invoice emailed!')}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  // Apply filters
  useEffect(() => {
    handleFilter()
  }, [searchText, statusFilter])

  return (
    <Spin spinning={loading} tip="Loading billing data...">
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>
            <ShoppingCartOutlined style={{ marginRight: '8px' }} />
            Billing Management
          </Title>
        <Text type="secondary">
          Generate invoices, process payments, and manage billing operations
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Bills"
              value={stats.pendingBills}
              prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Ready for Billing"
              value={stats.readyForBilling}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={stats.totalRevenue}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Payments"
              value={stats.pendingPayments}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#fa541c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={16}>
          {stats.readyForBilling > 0 && (
            <Alert
              message={`${stats.readyForBilling} orders are ready for billing`}
              description="Generate invoices for completed orders."
              type="success"
              showIcon
              action={
                <Button size="small" type="primary" onClick={() => setActiveTab('pending')}>
                  View Orders
                </Button>
              }
              style={{ marginBottom: '16px' }}
            />
          )}

          {stats.readyForPickup > 0 && (
            <Alert
              message={`${stats.readyForPickup} prescriptions ready for pickup`}
              description="Customers are waiting to collect their medications and pay."
              type="info"
              showIcon
              action={
                <Button size="small" type="primary" onClick={() => setActiveTab('pickup')}>
                  View Pickups
                </Button>
              }
              style={{ marginBottom: '16px' }}
            />
          )}
          
          {stats.insuranceVerification > 0 && (
            <Alert
              message={`${stats.insuranceVerification} orders awaiting insurance verification`}
              description="Complete insurance verification to proceed with billing."
              type="warning"
              showIcon
              action={
                <Button size="small" onClick={() => setStatusFilter('Insurance Verification')}>
                  Review Insurance
                </Button>
              }
            />
          )}
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                block
                onClick={() => message.info('Manual billing creation')}
              >
                Create Manual Bill
              </Button>
              <Button 
                icon={<BarChartOutlined />} 
                block
                onClick={() => message.info('Generate financial reports')}
              >
                Financial Reports
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search orders, customers, prescriptions..."
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
              <Option value="Pending Billing">Pending Billing</Option>
              <Option value="Ready for Billing">Ready for Billing</Option>
              <Option value="Insurance Verification">Insurance Verification</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button 
              icon={<FilterOutlined />}
              onClick={() => {
                setSearchText('')
                setStatusFilter('all')
                setFilteredBills(pendingBills)
              }}
            >
              Clear Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Main Content Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={`Pending Bills (${stats.pendingBills})`} key="pending">
            <Table
              columns={pendingBillsColumns}
              dataSource={filteredBills}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} pending bills`,
              }}
              scroll={{ x: 1200 }}
              size="middle"
            />
          </TabPane>

          <TabPane tab={`Ready for Pickup (${stats.readyForPickup})`} key="pickup">
            <Table
              columns={pickupColumns}
              dataSource={readyForPickup}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} prescriptions ready for pickup`,
              }}
              scroll={{ x: 1200 }}
              size="middle"
            />
          </TabPane>
          
          <TabPane tab={`Generated Invoices (${stats.totalInvoices})`} key="invoices">
            <Table
              columns={invoicesColumns}
              dataSource={generatedInvoices}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} invoices`,
              }}
              scroll={{ x: 1000 }}
              size="middle"
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Generate Bill Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Generate Invoice - {selectedBill?.orderId}
          </Space>
        }
        open={billingModalVisible}
        onCancel={() => setBillingModalVisible(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setBillingModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="save-draft" onClick={() => message.success('Invoice saved as draft!')}>
            Save Draft
          </Button>,
          <Button 
            key="generate" 
            type="primary" 
            onClick={() => {
              message.success('Invoice generated successfully!')
              setBillingModalVisible(false)
            }}
          >
            Generate & Send
          </Button>,
        ]}
      >
        {selectedBill && (
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Order ID" name="orderId">
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Customer" name="customerName">
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">Billing Details</Divider>
            
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Subtotal" name="subtotal">
                  <InputNumber
                    prefix="$"
                    style={{ width: '100%' }}
                    precision={2}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Tax" name="tax">
                  <InputNumber
                    prefix="$"
                    style={{ width: '100%' }}
                    precision={2}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Shipping" name="shipping">
                  <InputNumber
                    prefix="$"
                    style={{ width: '100%' }}
                    precision={2}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Discount" name="discount">
                  <InputNumber
                    prefix="$"
                    style={{ width: '100%' }}
                    precision={2}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Due Date" name="dueDate">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Payment Terms" name="paymentTerms">
                  <Select>
                    <Option value="Net 15">Net 15</Option>
                    <Option value="Net 30">Net 30</Option>
                    <Option value="Due on Receipt">Due on Receipt</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Notes" name="notes">
              <Input.TextArea rows={3} placeholder="Additional notes for the invoice..." />
            </Form.Item>

            {selectedBill.insurance && (
              <>
                <Divider orientation="left">Insurance Information</Divider>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Provider">{selectedBill.insurance.provider}</Descriptions.Item>
                  <Descriptions.Item label="Policy Number">{selectedBill.insurance.policyNumber}</Descriptions.Item>
                  <Descriptions.Item label="Coverage">{selectedBill.insurance.coverage}%</Descriptions.Item>
                  <Descriptions.Item label="Estimated Coverage">${selectedBill.insurance.estimatedCoverage.toFixed(2)}</Descriptions.Item>
                </Descriptions>
              </>
            )}
          </Form>
        )}
      </Modal>

      {/* Payment Processing Modal */}
      <Modal
        title="Process Payment"
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        onOk={() => {
          // This will be handled by the form submission
          const formData = paymentForm.getFieldsValue()
          handlePaymentSubmit(formData)
        }}
        confirmLoading={loading}
      >
        {selectedBill && (
          <div>
            <Alert
              message={`Amount Due: $${((selectedBill.amount || selectedBill.totalAmount || 0) - (selectedBill.paidAmount || 0)).toFixed(2)}`}
              type="info"
              style={{ marginBottom: '16px' }}
            />
            
            <Form layout="vertical" form={paymentForm}>
              <Form.Item label="Payment Amount" name="amount" required>
                <InputNumber
                  prefix="$"
                  style={{ width: '100%' }}
                  precision={2}
                  max={(selectedBill.amount || selectedBill.totalAmount || 0) - (selectedBill.paidAmount || 0)}
                />
              </Form.Item>
              
              <Form.Item label="Payment Method" name="paymentMethod" required>
                <Select placeholder="Select payment method">
                  {paymentMethods.map((method: { value: string; label: string }) => (
                    <Option key={method.value} value={method.value}>
                      {method.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item label="Reference Number">
                <Input placeholder="Transaction/Check reference number" />
              </Form.Item>
              
              <Form.Item label="Notes">
                <Input.TextArea rows={2} placeholder="Payment notes..." />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* Combined Pickup Bill & Payment Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Bill Details & Payment Collection
          </Space>
        }
        open={pickupBillModalVisible}
        onCancel={() => setPickupBillModalVisible(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setPickupBillModalVisible(false)}>
            Close
          </Button>,
          <Button key="print" icon={<PrinterOutlined />} onClick={() => message.success('Bill printed!')}>
            Print Bill
          </Button>,
          <Button 
            key="collect" 
            type="primary" 
            icon={<DollarOutlined />}
            loading={loading}
            onClick={() => pickupPaymentForm.submit()}
            disabled={!selectedPickup}
          >
            Collect Payment
          </Button>,
        ]}
      >
        {(selectedBill || selectedPickup) && (
          <div>
            {/* Bill Information Section */}
            <Card 
              title="Bill Information" 
              size="small" 
              style={{ marginBottom: '16px' }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Prescription Number">
                      {selectedPickup?.prescriptionNumber || `RX-${selectedPickup?.id}`}
                    </Descriptions.Item>
                    <Descriptions.Item label="Customer">
                      {selectedPickup?.customerName || `${selectedPickup?.customer?.firstName} ${selectedPickup?.customer?.lastName}`}
                    </Descriptions.Item>
                    <Descriptions.Item label="Doctor">
                      {selectedPickup?.doctorName || 'Not specified'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">
                      {selectedPickup?.customerPhone || selectedPickup?.customer?.phone || 'Not provided'}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Bill Amount">
                      <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                        Rs. {selectedPickup?.totalAmount?.toFixed(2) || '0.00'}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Type">
                      <Tag color="orange">Pay on Pickup</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color="orange" icon={<ClockCircleOutlined />}>
                        Ready for Pickup
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Ready Since">
                      {selectedPickup?.approvedAt ? new Date(selectedPickup.approvedAt).toLocaleDateString() : 'Unknown'}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* Medicine Items Section */}
            {selectedPickup?.items && (
              <Card 
                title="Prescription Items" 
                size="small" 
                style={{ marginBottom: '16px' }}
              >
                <Table
                  dataSource={selectedPickup.items.map((item: any, index: number) => ({ ...item, key: index }))}
                  columns={[
                    { 
                      title: 'Medicine', 
                      dataIndex: 'medicineName', 
                      key: 'name',
                      render: (text: string, record: any) => (
                        <Space direction="vertical" size="small">
                            <Text strong>{text} ({record.strength}) - {record.manufacturer} (Batch: {record.batchNumber})</Text>
                          {record.dosage && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              Dosage: {record.dosage}
                            </Text>
                          )}
                          {record.instructions && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              Instructions: {record.instructions}
                            </Text>
                          )}
                        </Space>
                      )
                    },
                    { title: 'Qty', dataIndex: 'quantity', key: 'quantity', width: 60 },
                    { 
                      title: 'Unit Price', 
                      dataIndex: 'unitPrice', 
                      key: 'unitPrice', 
                      width: 100,
                      render: (price: number) => `Rs. ${price?.toFixed(2) || '0.00'}`
                    },
                    { 
                      title: 'Total', 
                      dataIndex: 'totalPrice', 
                      key: 'total', 
                      width: 100,
                      render: (total: number) => (
                        <Text strong>Rs. {total?.toFixed(2) || '0.00'}</Text>
                      )
                    },
                  ]}
                  pagination={false}
                  size="small"
                />
              </Card>
            )}

            {/* Payment Collection Section */}
            <Card 
              title="Payment Collection" 
              size="small"
            >
              <Alert
                message="Ready to Collect Payment"
                description="Select payment method and collect payment from customer. This will mark the prescription as dispensed."
                type="info"
                style={{ marginBottom: '16px' }}
              />
              
              <Form 
                layout="vertical" 
                form={pickupPaymentForm}
                onFinish={handlePickupPaymentSubmit}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item 
                      label="Payment Method" 
                      name="paymentMethod" 
                      rules={[{ required: true, message: 'Please select a payment method' }]}
                      initialValue="CASH"
                    >
                      <Select placeholder="Select payment method" size="large">
                        <Option value="CASH">💰 Cash</Option>
                        <Option value="CARD">💳 Card (Debit/Credit)</Option>
                        <Option value="BANK_TRANSFER">🏦 Bank Transfer</Option>
                        <Option value="OTHER">📝 Other</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Amount to Collect">
                      <Input 
                        size="large"
                        value={`Rs. ${selectedPickup?.totalAmount?.toFixed(2) || '0.00'}`}
                        disabled
                        style={{ fontWeight: 'bold', fontSize: '16px' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Form.Item label="Notes (Optional)" name="notes">
                  <Input.TextArea 
                    rows={2} 
                    placeholder="Add any notes about the payment collection..."
                  />
                </Form.Item>
              </Form>

              <Alert
                message="⚠️ Important"
                description="After collecting payment, the prescription will be marked as DISPENSED and the customer will receive their medication. This action cannot be undone."
                type="warning"
                showIcon
                style={{ marginTop: '16px' }}
              />
            </Card>
          </div>
        )}
      </Modal>
      </div>
    </Spin>
  )
}

export default BillingManagement
