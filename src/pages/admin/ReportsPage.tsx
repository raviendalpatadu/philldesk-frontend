/**
 * Admin Reports Page
 * 
 * This component provides comprehensive reporting functionality for administrators,
 * including sales reports, inventory reports, user activity, and financial analytics.
 */

import React, { useState } from 'react'
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
  Tooltip
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

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker
const { TabPane } = Tabs

// Mock data for reports
const mockSalesData = [
  {
    key: '1',
    date: '2024-01-17',
    invoices: 24,
    revenue: 1245.80,
    prescriptions: 18,
    otc: 6,
    averageValue: 51.91,
    topMedicine: 'Paracetamol 500mg'
  },
  {
    key: '2',
    date: '2024-01-16',
    invoices: 31,
    revenue: 1567.45,
    prescriptions: 22,
    otc: 9,
    averageValue: 50.56,
    topMedicine: 'Amoxicillin 250mg'
  },
  {
    key: '3',
    date: '2024-01-15',
    invoices: 28,
    revenue: 1398.20,
    prescriptions: 20,
    otc: 8,
    averageValue: 49.94,
    topMedicine: 'Insulin Pen'
  }
]

const mockInventoryReport = [
  {
    key: '1',
    category: 'Pain Relief',
    totalItems: 45,
    totalValue: 2450.00,
    lowStock: 3,
    expiringSoon: 2,
    turnoverRate: 85
  },
  {
    key: '2',
    category: 'Antibiotics',
    totalItems: 32,
    totalValue: 3200.00,
    lowStock: 5,
    expiringSoon: 1,
    turnoverRate: 92
  },
  {
    key: '3',
    category: 'Diabetes',
    totalItems: 18,
    totalValue: 1800.00,
    lowStock: 2,
    expiringSoon: 0,
    turnoverRate: 78
  }
]

const mockUserActivity = [
  {
    key: '1',
    role: 'PHARMACIST',
    activeUsers: 8,
    totalUsers: 12,
    avgSessionTime: '4h 32m',
    prescriptionsProcessed: 156,
    efficiency: 94
  },
  {
    key: '2',
    role: 'CUSTOMER',
    activeUsers: 245,
    totalUsers: 320,
    avgSessionTime: '12m',
    prescriptionsProcessed: 89,
    efficiency: 87
  },
  {
    key: '3',
    role: 'ADMIN',
    activeUsers: 3,
    totalUsers: 4,
    avgSessionTime: '2h 15m',
    prescriptionsProcessed: 0,
    efficiency: 100
  }
]

// Sales table summary component
const SalesTableSummary = ({ summaryStats, mockSalesData }: { summaryStats: any, mockSalesData: any[] }) => (
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
        <Text strong>{mockSalesData.reduce((sum, day) => sum + day.otc, 0)}</Text>
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
const InventoryTableSummary = ({ summaryStats, mockInventoryReport }: { summaryStats: any, mockInventoryReport: any[] }) => (
  <Table.Summary>
    <Table.Summary.Row>
      <Table.Summary.Cell index={0}>
        <Text strong>Total</Text>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={1}>
        <Text strong>{mockInventoryReport.reduce((sum, cat) => sum + cat.totalItems, 0)}</Text>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={2}>
        <Text strong>${summaryStats.inventoryValue.toFixed(2)}</Text>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={3}>
        <Text strong>{mockInventoryReport.reduce((sum, cat) => sum + cat.lowStock, 0)} items</Text>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={4}>
        <Text strong>{mockInventoryReport.reduce((sum, cat) => sum + cat.expiringSoon, 0)} items</Text>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={5}>
        <Text strong>{summaryStats.avgTurnover.toFixed(1)}%</Text>
      </Table.Summary.Cell>
    </Table.Summary.Row>
  </Table.Summary>
)

const ReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('last_7_days')
  const [reportType, setReportType] = useState('overview')
  const [activeTab, setActiveTab] = useState('sales')

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
    totalRevenue: mockSalesData.reduce((sum, day) => sum + day.revenue, 0),
    totalInvoices: mockSalesData.reduce((sum, day) => sum + day.invoices, 0),
    averageOrderValue: mockSalesData.reduce((sum, day) => sum + day.averageValue, 0) / mockSalesData.length,
    totalPrescriptions: mockSalesData.reduce((sum, day) => sum + day.prescriptions, 0),
    inventoryValue: mockInventoryReport.reduce((sum, cat) => sum + cat.totalValue, 0),
    activeUsers: mockUserActivity.reduce((sum, role) => sum + role.activeUsers, 0),
    avgTurnover: mockInventoryReport.reduce((sum, cat) => sum + cat.turnoverRate, 0) / mockInventoryReport.length
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
    },
    {
      title: 'Top Medicine',
      dataIndex: 'topMedicine',
      key: 'topMedicine',
    },
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
              <RangePicker style={{ width: '100%' }} />
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>Actions</Text>
              <Space>
                <Button 
                  type="primary" 
                  icon={<ExportOutlined />}
                  onClick={() => message.success('Report exported!')}
                >
                  Export
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
                <Tooltip title="8.5% increase from last period">
                  <ArrowUpOutlined style={{ color: '#52c41a', marginLeft: '8px' }} />
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

      {/* Key Insights */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24}>
          <Alert
            message="Key Insights"
            description={
              <div>
                <p>• Revenue increased by 8.5% compared to the previous period</p>
                <p>• Average inventory turnover rate is {summaryStats.avgTurnover.toFixed(1)}%</p>
                <p>• {summaryStats.totalPrescriptions} prescriptions processed with 94% efficiency</p>
                <p>• Total inventory value: ${summaryStats.inventoryValue.toFixed(2)}</p>
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
              dataSource={mockSalesData}
              pagination={false}
              size="middle"
              summary={() => SalesTableSummary({ summaryStats, mockSalesData })}
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
              dataSource={mockInventoryReport}
              pagination={false}
              size="middle"
              summary={() => InventoryTableSummary({ summaryStats, mockInventoryReport })}
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
              dataSource={mockUserActivity}
              pagination={false}
              size="middle"
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
              onClick={() => message.success('PDF report generated!')}
            >
              Download PDF
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button 
              block 
              icon={<DownloadOutlined />}
              onClick={() => message.success('Excel file exported!')}
            >
              Export to Excel
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button 
              block 
              icon={<FileTextOutlined />}
              onClick={() => message.success('CSV file exported!')}
            >
              Export to CSV
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button 
              block 
              icon={<CalendarOutlined />}
              onClick={() => message.info('Schedule report functionality')}
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
