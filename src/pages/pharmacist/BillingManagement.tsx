/**
 * Pharmacist Billing Management (SME Pharmacy Streamlined)
 * 
 * This component provides streamlined billing management for small pharmacy operations.
 * Bills are automatically generated when prescriptions are approved, eliminating invoice complexity.
 * Focus on direct billing, payment collection, and prescription dispensing.
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
  Spin,
  Result
} from 'antd'
import { 
  PlusOutlined,
  EyeOutlined,
  PrinterOutlined,
  MailOutlined,
  FileTextOutlined,
  SearchOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
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
  // Utility function to safely convert dates
  const safeFormatDate = (dateValue: any, format: 'date' | 'datetime' = 'date'): string => {
    if (!dateValue) return 'Not available'
    
    try {
      // Handle array format dates from backend [year, month, day, hour, minute, second, nanosecond]
      if (Array.isArray(dateValue)) {
        const [year, month, day, hour = 0, minute = 0, second = 0] = dateValue
        const date = new Date(year, month - 1, day, hour, minute, second) // month is 0-indexed
        return format === 'datetime' ? date.toLocaleString() : date.toLocaleDateString()
      }
      
      // Handle string dates
      if (typeof dateValue === 'string') {
        const date = new Date(dateValue)
        return format === 'datetime' ? date.toLocaleString() : date.toLocaleDateString()
      }
      
      // Handle Date objects
      if (dateValue instanceof Date) {
        return format === 'datetime' ? dateValue.toLocaleString() : dateValue.toLocaleDateString()
      }
      
      return 'Invalid date'
    } catch (error) {
      console.error('Date conversion error:', error, dateValue)
      return 'Invalid date'
    }
  }

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
  const [paidBills, setPaidBills] = useState<TransformedBill[]>([])
  const [readyForPickup, setReadyForPickup] = useState<any[]>([])
  const [filteredBills, setFilteredBills] = useState<TransformedBill[]>([])
  const [selectedBill, setSelectedBill] = useState<TransformedBill | null>(null)
  const [selectedPickup, setSelectedPickup] = useState<any>(null)
  const [paymentModalVisible, setPaymentModalVisible] = useState(false)
  const [pickupBillModalVisible, setPickupBillModalVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('pending')
  const [loading, setLoading] = useState(false)
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

      // Debug: Check if paid bills have shipping details
      if (paidResponse && paidResponse.length > 0) {
        console.log('First paid bill with details:', JSON.stringify(paidResponse[0], null, 2))
        paidResponse.forEach((bill: any, index: number) => {
          if (bill.shippingDetails) {
            console.log(`Paid bill ${index} has shipping details:`, bill.shippingDetails)
          } else {
            console.log(`Paid bill ${index} has NO shipping details`)
          }
        })
      }

      // Set pending bills (empty array if no data)
      const pendingData = pendingResponse || []
      setPendingBills(pendingData)
      setFilteredBills(pendingData)

      // Set paid bills (empty array if no data)
      const paidBillsData = paidResponse || []
      setPaidBills(paidBillsData)

      // Set ready-for-pickup prescriptions
      const pickupData = pickupResponse || []
      setReadyForPickup(pickupData)
      
    } catch (error) {
      console.error('Failed to load billing data:', error)
      message.error('Failed to load billing data from backend')
      // Set empty arrays instead of mock data
      setPendingBills([])
      setFilteredBills([])
      setPaidBills([])
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
    totalPaidBills: paidBills.length,
    paidBillsCount: paidBills.filter((bill: TransformedBill) => bill.status === 'Paid').length,
    totalRevenue: paidBills.reduce((sum: number, bill: TransformedBill) => sum + (bill.paidAmount || 0), 0),
    pendingPayments: paidBills.reduce((sum: number, bill: TransformedBill) => sum + ((bill.amount || bill.totalAmount || 0) - (bill.paidAmount || 0)), 0)
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

  // Handle payment processing
  const handlePaymentSubmit = async (paymentData: any) => {
    try {
      setLoading(true)
      console.log('Processing payment:', paymentData)

      const billId = selectedBill?.id
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

  // Print bill functionality
  const printBill = async (bill: any) => {
    try {
      setLoading(true)
      console.log('Printing bill for:', bill.id || bill.billId)
      
      const billId = bill.id || bill.billId
      if (!billId) {
        message.error('Bill ID not found')
        return
      }

      const pdfBlob = await pharmacistService.printInvoice(billId.toString())
      
      // Create a URL for the PDF blob and open in new window for printing
      const pdfUrl = URL.createObjectURL(pdfBlob)
      const printWindow = window.open(pdfUrl, '_blank')
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
          // Clean up the URL after printing
          setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000)
        }
        message.success('Bill opened for printing!')
      } else {
        message.error('Popup blocked. Please allow popups and try again.')
      }
    } catch (error) {
      console.error('Error printing bill:', error)
      message.error('Failed to print bill. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Email bill functionality
  const emailBill = async (bill: any, customEmail?: string) => {
    try {
      setLoading(true)
      console.log('Emailing bill for:', bill.id || bill.billId)
      
      const billId = bill.id || bill.billId
      if (!billId) {
        message.error('Bill ID not found')
        return
      }

      const result = await pharmacistService.emailInvoice(billId.toString(), customEmail)
      message.success('Bill emailed successfully!')
      console.log('Email result:', result)
    } catch (error) {
      console.error('Error emailing bill:', error)
      message.error('Failed to email bill. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Download bill PDF
  const downloadBillPDF = async (bill: any) => {
    try {
      setLoading(true)
      console.log('Downloading bill PDF for:', bill.id || bill.billId)
      
      const billId = bill.id || bill.billId
      if (!billId) {
        message.error('Bill ID not found')
        return
      }

      const pdfBlob = await pharmacistService.downloadInvoicePDF(billId.toString())
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bill-${bill.billNumber || bill.billId || billId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      message.success('Bill PDF downloaded!')
    } catch (error) {
      console.error('Error downloading bill PDF:', error)
      message.error('Failed to download bill PDF. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // View bill details - can be used for both regular bills and pickup bills
  const viewBillDetails = (bill: any) => {
    setSelectedBill(bill)
    // Check if this is a pickup prescription vs regular bill
    if (bill.status === 'READY_FOR_PICKUP' || bill.prescriptionNumber) {
      setSelectedPickup(bill)
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
          {safeFormatDate(record.approvedAt, 'datetime')}
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
            {safeFormatDate(record.orderDate, 'datetime')}
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
          <Text strong>Rs. {(record.total || record.totalAmount || 0).toFixed(2)}</Text>
          {record.subtotal > 0 && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Subtotal: Rs. {record.subtotal.toFixed(2)}
            </Text>
          )}
          {record.discount > 0 && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Discount: -Rs. {record.discount.toFixed(2)}
            </Text>
          )}
          {record.tax > 0 && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Tax: +Rs. {record.tax.toFixed(2)}
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
          {record.shippingDetails && (
            <Tag color="purple">Home Delivery</Tag>
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
                onClick={() => viewBillDetails(record)}
              />
            </Tooltip>
            
            <Tooltip title="Print">
              <Button 
                type="text" 
                icon={<PrinterOutlined />} 
                size="small"
                onClick={() => printBill(record)}
              />
            </Tooltip>
          </Space>
        </Space>
      ),
    },
  ]

  // Generated bills columns
  const billsColumns = [
    {
      title: 'Bill',
      key: 'bill',
      width: 150,
      render: (_: any, record: TransformedBill) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.billNumber}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.prescriptionNumber}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {safeFormatDate(record.generatedDate || record.createdAt, 'datetime')}
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
            <Text strong>Rs. {amount.toFixed(2)}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Paid: Rs. {paidAmount.toFixed(2)}
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
      title: 'Paid At',
      key: 'paidAt',
      width: 100,
      render: (_: any, record: TransformedBill) => {
        return (
          <Text type="secondary">
            {safeFormatDate(record.paidAt, 'datetime')}
          </Text>
        )
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string, record: TransformedBill) => {
        // Debug: Log shipping details for each record
        console.log(`Bill ${record.id} details:`, {
          hasShipping: !!record.shippingDetails,
          shippingDetails: record.shippingDetails,
          paymentType: record.paymentType,
          paidAt: record.paidAt,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt
        })
        
        return (
          <Space direction="vertical" size="small">
            {getStatusDisplay(status)}
            {record.paymentType === 'ONLINE' && (
              <Tag color="blue">Online Payment</Tag>
            )}
            {record.shippingDetails && (
              <Tag color="purple">Home Delivery</Tag>
            )}
          </Space>
        )
      },
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
              onClick={() => viewBillDetails(record)}
            />
          </Tooltip>
          
          <Tooltip title="Print Bill">
            <Button 
              type="text" 
              icon={<PrinterOutlined />} 
              size="small"
              onClick={() => printBill(record)}
            />
          </Tooltip>
          
          <Tooltip title="Send Email">
            <Button 
              type="text" 
              icon={<MailOutlined />} 
              size="small"
              onClick={() => emailBill(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  // Helper function to check if payment is pending
  const isPaymentPending = (pickup: any) => {
    if (!pickup) return false
    
    // Check if payment status is explicitly set to PAID
    if (pickup.paymentStatus === 'PAID') return false
    
    // Check if full amount has been paid
    const totalAmount = pickup.totalAmount || 0
    const paidAmount = pickup.paidAmount || 0
    
    return paidAmount < totalAmount
  }

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
            <DollarOutlined style={{ marginRight: '8px' }} />
            Prescription Billing
          </Title>
        <Text type="secondary">
          Manage prescription bills, collect payments, and process dispensing for approved prescriptions
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
              prefix="Rs. "
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
              prefix="Rs. "
              precision={2}
              valueStyle={{ color: '#fa541c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
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
          
          <TabPane tab={`Generated Bills (${stats.paidBillsCount})`} key="invoices">
            <Table
              columns={billsColumns}
              dataSource={paidBills}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} bills`,
              }}
              scroll={{ x: 1000 }}
              size="middle"
            />
          </TabPane>
        </Tabs>
      </Card>

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
              message={`Amount Due: Rs. ${((selectedBill.amount || selectedBill.totalAmount || 0) - (selectedBill.paidAmount || 0)).toFixed(2)}`}
              type="info"
              style={{ marginBottom: '16px' }}
            />
            
            <Form layout="vertical" form={paymentForm}>
              <Form.Item label="Payment Amount" name="amount" required>
                <InputNumber
                  prefix="Rs. "
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

      {/* Bill Details & Payment Collection Modal */}
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
          <Button key="print" icon={<PrinterOutlined />} onClick={() => selectedPickup && printBill(selectedPickup)}>
            Print Bill
          </Button>,
          // Only show payment collection button if payment is pending
          ...(isPaymentPending(selectedPickup) ? [
            <Button 
              key="collect" 
              type="primary" 
              icon={<DollarOutlined />}
              loading={loading}
              onClick={() => pickupPaymentForm.submit()}
              disabled={!selectedPickup}
            >
              Collect Payment
            </Button>
          ] : [])
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
                      {selectedPickup?.paymentType ? (
                        <Space>
                          <Tag color="blue">{selectedPickup.paymentType}</Tag>
                          {selectedPickup.shippingDetails && (
                            <Tag color="purple">Home Delivery</Tag>
                          )}
                        </Space>
                      ) : (
                        <Tag color="red">Not Specified</Tag>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Status">
                      {!isPaymentPending(selectedPickup) ? (
                        <Tag color="green" icon={<CheckCircleOutlined />}>
                          Payment Completed
                        </Tag>
                      ) : (
                        <Tag color="orange" icon={<ClockCircleOutlined />}>
                          Payment Pending           
                        </Tag>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ready Since">
                      {safeFormatDate(selectedPickup?.approvedAt)}
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

            {/* Shipping Details Section */}
            {selectedPickup?.shippingDetails && (
              <Card 
                title="Shipping & Delivery Information" 
                size="small" 
                style={{ marginBottom: '16px' }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Delivery Address">
                        <Space direction="vertical" size="small">
                          <Text>{selectedPickup.shippingDetails.addressLine1}</Text>
                          {selectedPickup.shippingDetails.addressLine2 && (
                            <Text type="secondary">{selectedPickup.shippingDetails.addressLine2}</Text>
                          )}
                          <Text>{selectedPickup.shippingDetails.city}, {selectedPickup.shippingDetails.stateProvince}</Text>
                          <Text>{selectedPickup.shippingDetails.postalCode}</Text>
                          <Text>{selectedPickup.shippingDetails.country}</Text>
                        </Space>
                      </Descriptions.Item>
                      <Descriptions.Item label="Contact Person">
                        {selectedPickup.shippingDetails.recipientName || selectedPickup.customerName}
                      </Descriptions.Item>
                      <Descriptions.Item label="Contact Phone">
                        {selectedPickup.shippingDetails.contactPhone || selectedPickup.customerPhone}
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                  <Col span={12}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Shipping Status">
                        {selectedPickup.shippingDetails.shippingStatus === 'PENDING' && (
                          <Tag color="orange" icon={<ClockCircleOutlined />}>Pending Shipment</Tag>
                        )}
                        {selectedPickup.shippingDetails.shippingStatus === 'PROCESSING' && (
                          <Tag color="blue" icon={<ClockCircleOutlined />}>Processing</Tag>
                        )}
                        {selectedPickup.shippingDetails.shippingStatus === 'SHIPPED' && (
                          <Tag color="green" icon={<CheckCircleOutlined />}>Shipped</Tag>
                        )}
                        {selectedPickup.shippingDetails.shippingStatus === 'DELIVERED' && (
                          <Tag color="green" icon={<CheckCircleOutlined />}>Delivered</Tag>
                        )}
                        {selectedPickup.shippingDetails.shippingStatus === 'CANCELLED' && (
                          <Tag color="red">Cancelled</Tag>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="Tracking Number">
                        {selectedPickup.shippingDetails.trackingNumber ? (
                          <Text copyable style={{ color: '#1890ff' }}>
                            {selectedPickup.shippingDetails.trackingNumber}
                          </Text>
                        ) : (
                          <Text type="secondary">Not generated yet</Text>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="Estimated Delivery">
                        {safeFormatDate(selectedPickup.shippingDetails.estimatedDeliveryDate)}
                      </Descriptions.Item>
                      {selectedPickup.shippingDetails.deliveryNotes && (
                        <Descriptions.Item label="Delivery Notes">
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {selectedPickup.shippingDetails.deliveryNotes}
                          </Text>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Col>
                </Row>
              </Card>
            )}

            {/* Payment Collection Section */}
            {isPaymentPending(selectedPickup) ? (
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
                  message="Important"
                  description="After collecting payment, the prescription will be marked as DISPENSED and the customer will receive their medication. This action cannot be undone."
                  type="warning"
                  showIcon
                  style={{ marginTop: '16px' }}
                />
              </Card>
            ) : (
              <Card 
                title="Payment Status" 
                size="small"
              >
                <Result
                  status="success"
                  title="Payment Already Completed"
                  subTitle="This prescription has already been paid for. No further payment collection is required."
                  extra={[
                    <div key="payment-info" style={{ textAlign: 'left', marginTop: '16px' }}>
                      <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label="Amount Paid">
                          <Text strong style={{ color: '#52c41a' }}>
                            Rs. {selectedPickup?.paidAmount?.toFixed(2) || selectedPickup?.totalAmount?.toFixed(2) || '0.00'}
                          </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Payment Date">
                          {safeFormatDate(selectedPickup?.paidAt)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Payment Method">
                          {selectedPickup?.paymentMethod || 'Not specified'}
                        </Descriptions.Item>
                      </Descriptions>
                    </div>
                  ]}
                />
              </Card>
            )}
          </div>
        )}
      </Modal>
      </div>
    </Spin>
  )
}

export default BillingManagement
