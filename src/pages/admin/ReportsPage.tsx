/**
 * Admin Reports Page
 * 
 * This component provides comprehensive reporting functionality for administrators,
 * including sales reports, inventory reports, user activity, and financial analytics.
 */

import React, { useState, useEffect } from 'react'
import { 
  Typography, 
  Card, 
  Row, 
  Col,
  Statistic,
  Select,
  DatePicker,
  Button,
  Table,
  Space,
  Tag,
  Progress,
  Alert,
  Tabs,
  message,
  Tooltip,
  Spin
} from 'antd'
import { 
  FileTextOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  BarChartOutlined,
  DownloadOutlined,
  PrinterOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  ExportOutlined
} from '@ant-design/icons'
import reportsService, { 
  SalesReportData, 
  InventoryReportData, 
  UserActivityData,
  DashboardStats,
  InventoryStats 
} from '../../services/reportsService'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker
const { TabPane } = Tabs

// Sales table summary component
const SalesTableSummary = ({ summaryStats, salesData }: { summaryStats: any, salesData: SalesReportData[] }) => (
  <Table.Summary>
    <Table.Summary.Row>
      <Table.Summary.Cell index={0}>
        <Text strong>Total</Text>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={1}>
        <Text strong>{summaryStats.totalInvoices}</Text>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={2}>
        <Text strong>${summaryStats.totalRevenue.toFixed(2)}</Text>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={3}>
        <Text strong>{summaryStats.totalPrescriptions}</Text>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={4}>
        <Text strong>{salesData.reduce((sum, day) => sum + day.otc, 0)}</Text>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={5}>
        <Text strong>${summaryStats.averageOrderValue.toFixed(2)}</Text>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={6}>
        <Text>-</Text>
      </Table.Summary.Cell>
    </Table.Summary.Row>
  </Table.Summary>
)

// Inventory table summary component
const InventoryTableSummary = ({ summaryStats, inventoryData }: { summaryStats: any, inventoryData: InventoryReportData[] }) => (
  <Table.Summary>
    <Table.Summary.Row>
      <Table.Summary.Cell index={0}>
        <Text strong>Total</Text>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={1}>
        <Text strong>{inventoryData.reduce((sum, cat) => sum + cat.totalItems, 0)}</Text>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={2}>
        <Text strong>${summaryStats.inventoryValue.toFixed(2)}</Text>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={3}>
        <Text strong>{inventoryData.reduce((sum, cat) => sum + cat.lowStock, 0)} items</Text>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={4}>
        <Text strong>{inventoryData.reduce((sum, cat) => sum + cat.expiringSoon, 0)} items</Text>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={5}>
        <Text strong>{summaryStats.avgTurnover.toFixed(2)}%</Text>
      </Table.Summary.Cell>
    </Table.Summary.Row>
  </Table.Summary>
)

const ReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('last_7_days')
  const [reportType, setReportType] = useState('overview')
  const [activeTab, setActiveTab] = useState('sales')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  
  // State for data
  const [loading, setLoading] = useState(false)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null)
  const [salesData, setSalesData] = useState<SalesReportData[]>([])
  const [inventoryData, setInventoryData] = useState<InventoryReportData[]>([])
  const [userActivityData, setUserActivityData] = useState<UserActivityData[]>([])
  const [revenueGrowth, setRevenueGrowth] = useState(0)

  // Load initial data
  useEffect(() => {
    loadAllData()
  }, [])

  // Reload data when date range or period changes
  useEffect(() => {
    if (selectedPeriod !== 'custom') {
      loadAllData()
    }
  }, [selectedPeriod])

  useEffect(() => {
    if (dateRange && dateRange[0] && dateRange[1] && selectedPeriod === 'custom') {
      loadAllData()
    }
  }, [dateRange])

  const getDateRange = () => {
    const today = dayjs()
    
    if (selectedPeriod === 'custom' && dateRange?.[0] && dateRange?.[1]) {
      return {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD')
      }
    }
    
    switch (selectedPeriod) {
      case 'today':
        return {
          startDate: today.format('YYYY-MM-DD'),
          endDate: today.format('YYYY-MM-DD')
        }
      case 'last_7_days':
        return {
          startDate: today.subtract(7, 'day').format('YYYY-MM-DD'),
          endDate: today.format('YYYY-MM-DD')
        }
      case 'last_30_days':
        return {
          startDate: today.subtract(30, 'day').format('YYYY-MM-DD'),
          endDate: today.format('YYYY-MM-DD')
        }
      case 'last_quarter':
        return {
          startDate: today.subtract(3, 'month').format('YYYY-MM-DD'),
          endDate: today.format('YYYY-MM-DD')
        }
      case 'last_7_days':
      default:
        return {
          startDate: today.subtract(7, 'day').format('YYYY-MM-DD'),
          endDate: today.format('YYYY-MM-DD')
        }
    }
  }

  const loadAllData = async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRange()
      
      // Load dashboard stats
      const statsData = await reportsService.getDashboardStats()
      setDashboardStats(statsData)
      
      // Load inventory stats
      const inventoryStatsData = await reportsService.getInventoryStats()
      setInventoryStats(inventoryStatsData)
      
      // Load sales report data
      const salesReportData = await reportsService.generateSalesReport(startDate, endDate)
      setSalesData(salesReportData)
      
      // Load inventory report data
      const inventoryReportData = await reportsService.generateInventoryReport()
      setInventoryData(inventoryReportData)
      
      // Load user activity data
      const userActivityReportData = await reportsService.generateUserActivityReport()
      setUserActivityData(userActivityReportData)
      
      // Calculate revenue growth (compare with previous period)
      await calculateRevenueGrowth(startDate, endDate)
      
    } catch (error) {
      console.error('Error loading reports data:', error)
      message.error('Failed to load reports data')
    } finally {
      setLoading(false)
    }
  }

  const calculateRevenueGrowth = async (startDate: string, endDate: string) => {
    try {
      const currentRevenue = await reportsService.getTotalRevenue(startDate, endDate)
      
      // Calculate previous period dates
      const start = dayjs(startDate)
      const end = dayjs(endDate)
      const periodDays = end.diff(start, 'day')
      
      const prevEndDate = start.subtract(1, 'day').format('YYYY-MM-DD')
      const prevStartDate = start.subtract(periodDays + 1, 'day').format('YYYY-MM-DD')
      
      const previousRevenue = await reportsService.getTotalRevenue(prevStartDate, prevEndDate)
      
      if (previousRevenue > 0) {
        const growth = ((currentRevenue - previousRevenue) / previousRevenue) * 100
        setRevenueGrowth(growth)
      } else {
        setRevenueGrowth(0)
      }
    } catch (error) {
      console.error('Error calculating revenue growth:', error)
      setRevenueGrowth(0)
    }
  }

  // Helper function for turnover rate color
  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      setLoading(true)
      
      // In a real implementation, you would call backend endpoints to generate exports
      // For now, we'll simulate the export process
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      message.success(`${format.toUpperCase()} report exported successfully!`)
      
      // Here you would typically trigger a file download
      // Example: window.open(`/api/reports/export?format=${format}&startDate=${startDate}&endDate=${endDate}`)
      
    } catch (error) {
      console.error('Export error:', error)
      message.error(`Failed to export ${format.toUpperCase()} report`)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadAllData()
    message.success('Reports refreshed successfully!')
  }

  // Helper function for turnover rate color
  const getTurnoverRateColor = (rate: number): string => {
    if (rate >= 90) return '#52c41a'
    if (rate >= 70) return '#fa8c16'
    return '#ff4d4f'
  }

  // Helper function for efficiency color
  const getEfficiencyColor = (efficiency: number): string => {
    if (efficiency >= 95) return '#52c41a'
    if (efficiency >= 85) return '#fa8c16'
    return '#ff4d4f'
  }
  const summaryStats = {
    totalRevenue: salesData.reduce((sum, day) => sum + day.revenue, 0),
    totalInvoices: salesData.reduce((sum, day) => sum + day.invoices, 0),
    averageOrderValue: salesData.length > 0 
      ? salesData.reduce((sum, day) => sum + day.averageValue, 0) / salesData.length 
      : 0,
    totalPrescriptions: salesData.reduce((sum, day) => sum + day.prescriptions, 0),
    inventoryValue: inventoryStats?.totalValue || 0,
    activeUsers: dashboardStats?.activeUsers || 0,
    avgTurnover: inventoryData.length > 0 
      ? inventoryData.reduce((sum, cat) => sum + cat.turnoverRate, 0) / inventoryData.length 
      : 0
  }

  // Sales report columns
  const salesColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Invoices',
      dataIndex: 'invoices',
      key: 'invoices',
      sorter: (a: any, b: any) => a.invoices - b.invoices,
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      sorter: (a: any, b: any) => a.revenue - b.revenue,
      render: (revenue: number) => <Text strong>${revenue.toFixed(2)}</Text>,
    },
    {
      title: 'Prescriptions',
      dataIndex: 'prescriptions',
      key: 'prescriptions',
      render: (prescriptions: number) => <Tag color="blue">{prescriptions}</Tag>,
    },
    {
      title: 'OTC Sales',
      dataIndex: 'otc',
      key: 'otc',
      render: (otc: number) => <Tag color="green">{otc}</Tag>,
    },
    {
      title: 'Avg Order Value',
      dataIndex: 'averageValue',
      key: 'averageValue',
      render: (avg: number) => `$${avg.toFixed(2)}`,
    }
  ]

  // Inventory report columns
  const inventoryColumns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Total Items',
      dataIndex: 'totalItems',
      key: 'totalItems',
      sorter: (a: any, b: any) => a.totalItems - b.totalItems,
    },
    {
      title: 'Total Value',
      dataIndex: 'totalValue',
      key: 'totalValue',
      sorter: (a: any, b: any) => a.totalValue - b.totalValue,
      render: (value: number) => <Text strong>${value.toFixed(2)}</Text>,
    },
    {
      title: 'Low Stock',
      dataIndex: 'lowStock',
      key: 'lowStock',
      render: (count: number) => (
        <Tag color={count > 0 ? 'orange' : 'green'}>
          {count} items
        </Tag>
      ),
    },
    {
      title: 'Expiring Soon',
      dataIndex: 'expiringSoon',
      key: 'expiringSoon',
      render: (count: number) => (
        <Tag color={count > 0 ? 'red' : 'green'}>
          {count} items
        </Tag>
      ),
    },
    {
      title: 'Turnover Rate',
      dataIndex: 'turnoverRate',
      key: 'turnoverRate',
      render: (rate: number) => {
        const color = getTurnoverRateColor(rate)
        return (
          <Progress
            percent={rate}
            size="small"
            strokeColor={color}
            format={(percent) => `${percent?.toFixed(2)}%`}
          />
        )
      },
    },
  ]

  // User activity columns
  const userActivityColumns = [
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colors = {
          'ADMIN': 'purple',
          'PHARMACIST': 'blue',
          'CUSTOMER': 'green'
        }
        return <Tag color={colors[role as keyof typeof colors]}>{role}</Tag>
      },
    },
    {
      title: 'Active Users',
      key: 'activeUsers',
      render: (_: any, record: any) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.activeUsers} / {record.totalUsers}</Text>
          <Progress
            percent={Math.round((record.activeUsers / record.totalUsers) * 100)}
            size="small"
          />
        </Space>
      ),
    },
    {
      title: 'Avg Session Time',
      dataIndex: 'avgSessionTime',
      key: 'avgSessionTime',
    },
    {
      title: 'Prescriptions',
      dataIndex: 'prescriptionsProcessed',
      key: 'prescriptionsProcessed',
      render: (count: number) => count > 0 ? <Tag color="blue">{count}</Tag> : '-',
    },
    {
      title: 'Efficiency',
      dataIndex: 'efficiency',
      key: 'efficiency',
      render: (efficiency: number) => {
        const color = getEfficiencyColor(efficiency)
        return (
          <Progress
            percent={efficiency}
            size="small"
            strokeColor={color}
          />
        )
      },
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <BarChartOutlined style={{ marginRight: '8px' }} />
          Reports & Analytics
        </Title>
        <Text type="secondary">
          Comprehensive business intelligence and reporting
        </Text>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>Time Period</Text>
              <Select
                value={selectedPeriod}
                onChange={setSelectedPeriod}
                style={{ width: '100%' }}
              >
                <Option value="today">Today</Option>
                <Option value="last_7_days">Last 7 Days</Option>
                <Option value="last_30_days">Last 30 Days</Option>
                <Option value="last_quarter">Last Quarter</Option>
                <Option value="custom">Custom Range</Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>Report Type</Text>
              <Select
                value={reportType}
                onChange={setReportType}
                style={{ width: '100%' }}
              >
                <Option value="overview">Overview</Option>
                <Option value="detailed">Detailed</Option>
                <Option value="comparison">Comparison</Option>
                <Option value="forecast">Forecast</Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>Date Range</Text>
              <RangePicker 
                style={{ width: '100%' }} 
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                disabled={selectedPeriod !== 'custom'}
              />
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>Actions</Text>
              <Space>
                <Button 
                  type="primary" 
                  icon={<ExportOutlined />}
                  onClick={handleRefresh}
                  loading={loading}
                >
                  Refresh
                </Button>
                <Button 
                  icon={<PrinterOutlined />}
                  onClick={() => message.success('Printing report...')}
                >
                  Print
                </Button>
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Summary Statistics */}
      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Revenue"
                value={summaryStats.totalRevenue}
                prefix="$"
                precision={2}
                valueStyle={{ color: '#52c41a' }}
                suffix={
                  <Tooltip title={`${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}% from previous period`}>
                    <ArrowUpOutlined 
                      style={{ 
                        color: revenueGrowth >= 0 ? '#52c41a' : '#ff4d4f', 
                        marginLeft: '8px',
                        transform: revenueGrowth < 0 ? 'rotate(180deg)' : 'none' 
                      }} 
                    />
                  </Tooltip>
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Orders"
                value={summaryStats.totalInvoices}
                prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Avg Order Value"
                value={summaryStats.averageOrderValue}
                prefix="$"
                precision={2}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Active Users"
                value={summaryStats.activeUsers}
                prefix={<UserOutlined style={{ color: '#fa541c' }} />}
                valueStyle={{ color: '#fa541c' }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24}>
          <Alert
            message="Key Insights"
            description={
              <div>
                <p>• Revenue {revenueGrowth >= 0 ? 'increased' : 'decreased'} by {Math.abs(revenueGrowth).toFixed(1)}% compared to the previous period</p>
                <p>• Average inventory turnover rate is {summaryStats.avgTurnover.toFixed(2)}%</p>
                <p>• {summaryStats.totalPrescriptions} prescriptions processed</p>
                <p>• Total inventory value: ${summaryStats.inventoryValue.toFixed(2)}</p>
                {inventoryStats && (
                  <>
                    <p>• {inventoryStats.lowStock} items are low in stock</p>
                    <p>• {inventoryStats.outOfStock} items are out of stock</p>
                  </>
                )}
              </div>
            }
            type="info"
            showIcon
          />
        </Col>
      </Row>

      {/* Detailed Reports Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <Space>
                <DollarOutlined />
                Sales Report
              </Space>
            } 
            key="sales"
          >
            <Table
              columns={salesColumns}
              dataSource={salesData.map((item, index) => ({
                ...item,
                key: index.toString()
              }))}
              pagination={false}
              size="middle"
              loading={loading}
              summary={() => SalesTableSummary({ summaryStats, salesData })}
            />
          </TabPane>

          <TabPane 
            tab={
              <Space>
                <MedicineBoxOutlined />
                Inventory Report
              </Space>
            } 
            key="inventory"
          >
            <Table
              columns={inventoryColumns}
              dataSource={inventoryData.map((item, index) => ({
                ...item,
                key: index.toString()
              }))}
              pagination={false}
              size="middle"
              loading={loading}
              summary={() => InventoryTableSummary({ summaryStats, inventoryData })}
            />
          </TabPane>

          <TabPane 
            tab={
              <Space>
                <UserOutlined />
                User Activity
              </Space>
            } 
            key="users"
          >
            <Table
              columns={userActivityColumns}
              dataSource={userActivityData.map((item, index) => ({
                ...item,
                key: index.toString()
              }))}
              pagination={false}
              size="middle"
              loading={loading}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Export Options */}
      <Card style={{ marginTop: '24px' }}>
        <Title level={4}>Export Options</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Button 
              block 
              icon={<DownloadOutlined />}
              onClick={() => handleExport('pdf')}
              loading={loading}
            >
              Download PDF
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button 
              block 
              icon={<DownloadOutlined />}
              onClick={() => handleExport('excel')}
              loading={loading}
            >
              Export to Excel
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button 
              block 
              icon={<FileTextOutlined />}
              onClick={() => handleExport('csv')}
              loading={loading}
            >
              Export to CSV
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button 
              block 
              icon={<CalendarOutlined />}
              onClick={() => message.info('Schedule report functionality coming soon')}
            >
              Schedule Report
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default ReportsPage
