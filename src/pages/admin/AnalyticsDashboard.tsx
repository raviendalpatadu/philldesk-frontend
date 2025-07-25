/**
 * Analytics Dashboard Page for Admins
 * 
 * This page provides comprehensive analytics and insights
 * for pharmacy operations, sales, and user activity.
 */

import React, { useState, useEffect } from 'react'
import {
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Select,
  DatePicker,
  message,
  Spin,
  Alert,
  Button
} from 'antd'
import {
  RiseOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  TeamOutlined,
  WarningOutlined,
  LoadingOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { 
  analyticsService, 
  DashboardStats, 
  InventoryStats, 
  TopMedication, 
  SystemAlerts 
} from '../../services/analyticsService'
import dayjs from 'dayjs'

const { Title } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

interface AnalyticsData {
  dashboardStats: DashboardStats | null
  inventoryStats: InventoryStats | null
  topMedications: TopMedication[]
  systemAlerts: SystemAlerts | null
  userDistribution: { 
    customers: number
    pharmacists: number
    activeUsersPercentage: number 
  } | null
  inventoryStatus: { 
    inStock: number
    lowStock: number
    outOfStock: number 
  } | null
}

const AnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    dashboardStats: null,
    inventoryStats: null,
    topMedications: [],
    systemAlerts: null,
    userDistribution: null,
    inventoryStatus: null
  })
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs()
  ])
  const [refreshing, setRefreshing] = useState<boolean>(false)

  // Data fetching functions
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch all analytics data in parallel
      const [
        dashboardStats,
        inventoryStats,
        topMedications,
        systemAlerts,
        userDistribution,
        inventoryStatus
      ] = await Promise.all([
        analyticsService.getDashboardStats(),
        analyticsService.getInventoryStats(),
        analyticsService.getTopMedications(),
        analyticsService.getSystemAlerts(),
        analyticsService.getUserDistribution(),
        analyticsService.getInventoryStatus()
      ])

      setAnalyticsData({
        dashboardStats,
        inventoryStats,
        topMedications,
        systemAlerts,
        userDistribution,
        inventoryStatus
      })
    } catch (err: any) {
      console.error('Error fetching analytics data:', err)
      setError(err.message || 'Failed to fetch analytics data')
      message.error('Failed to load analytics data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalyticsData()
    setRefreshing(false)
    message.success('Analytics data refreshed successfully')
  }

  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      setDateRange([dates[0], dates[1]])
      // You can trigger a refresh with new date range here
      // fetchAnalyticsData() - if needed for revenue stats
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  // Table columns configuration
  const medicationColumns = [
    {
      title: 'Medication',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Units Sold',
      dataIndex: 'sales',
      key: 'sales'
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue'
    },
    {
      title: 'Trend',
      dataIndex: 'trend',
      key: 'trend',
      render: (trend: string) => (
        <span style={{ color: trend.includes('+') ? '#52c41a' : '#ff4d4f' }}>
          {trend}
        </span>
      )
    }
  ]

  // Show loading spinner
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <Spin 
          size="large" 
          indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} 
        />
        <span style={{ marginLeft: 16 }}>Loading analytics data...</span>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Error Loading Analytics"
          description={error}
          type="error"
          showIcon
          action={
            <Button onClick={handleRefresh} icon={<ReloadOutlined />}>
              Retry
            </Button>
          }
        />
      </div>
    )
  }

  // Calculate revenue trend (mock calculation for now)
  const calculateRevenueTrend = () => {
    if (analyticsData.inventoryStats?.totalValue) {
      return '+12%' // Mock trend
    }
    return '+0%'
  }

  // Get revenue value
  const getTotalRevenue = () => {
    return analyticsData.inventoryStats?.totalValue || 0
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24 
      }}>
        <Title level={2}>Analytics Dashboard</Title>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Select defaultValue="thisMonth" style={{ width: 150 }}>
            <Option value="today">Today</Option>
            <Option value="thisWeek">This Week</Option>
            <Option value="thisMonth">This Month</Option>
            <Option value="thisYear">This Year</Option>
          </Select>
          <RangePicker 
            value={dateRange}
            onChange={handleDateRangeChange}
            style={{ width: 250 }}
          />
          <Button 
            onClick={handleRefresh}
            loading={refreshing}
            icon={<ReloadOutlined />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={getTotalRevenue()}
              precision={2}
              prefix="$"
              suffix={<RiseOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
              {calculateRevenueTrend()} from last month
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Orders"
              value={analyticsData.dashboardStats?.paidBills || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
              +8% from last month
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={analyticsData.dashboardStats?.activeUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
              +5% from last month
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Prescriptions Processed"
              value={analyticsData.dashboardStats?.completedPrescriptions || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
              +15% from last month
            </div>
          </Card>
        </Col>
      </Row>

      {/* Secondary Metrics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card title="Inventory Status" extra="View Details">
            <div style={{ marginBottom: 16 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: 8 
              }}>
                <span>In Stock</span>
                <span>{analyticsData.inventoryStatus?.inStock || 0}%</span>
              </div>
              <Progress 
                percent={analyticsData.inventoryStatus?.inStock || 0} 
                status="active" 
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: 8 
              }}>
                <span>Low Stock</span>
                <span>{analyticsData.inventoryStatus?.lowStock || 0}%</span>
              </div>
              <Progress 
                percent={analyticsData.inventoryStatus?.lowStock || 0} 
                status="exception" 
              />
            </div>
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: 8 
              }}>
                <span>Out of Stock</span>
                <span>{analyticsData.inventoryStatus?.outOfStock || 0}%</span>
              </div>
              <Progress 
                percent={analyticsData.inventoryStatus?.outOfStock || 0} 
                status="exception" 
              />
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="User Distribution">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Customers"
                  value={analyticsData.userDistribution?.customers || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ fontSize: '20px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Pharmacists"
                  value={analyticsData.userDistribution?.pharmacists || 0}
                  prefix={<TeamOutlined />}
                  valueStyle={{ fontSize: '20px' }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: 8 
              }}>
                <span>Active Users (24h)</span>
                <span>{analyticsData.userDistribution?.activeUsersPercentage || 0}%</span>
              </div>
              <Progress 
                percent={analyticsData.userDistribution?.activeUsersPercentage || 0} 
              />
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card 
            title="System Alerts" 
            extra={<WarningOutlined style={{ color: '#fa8c16' }} />}
          >
            <div style={{ marginBottom: 12 }}>
              <span style={{ color: '#fa8c16' }}>
                • {analyticsData.systemAlerts?.lowStockMedicines?.length || 0} medications low in stock
              </span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ color: '#ff4d4f' }}>• 2 expired medications</span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ color: '#1890ff' }}>
                • {analyticsData.systemAlerts?.pendingPrescriptions?.length || 0} pending prescriptions
              </span>
            </div>
            <div>
              <span style={{ color: '#52c41a' }}>• System backup completed</span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Top Medications Table */}
      <Card title="Top Selling Medications" style={{ marginBottom: 24 }}>
        <Table 
          columns={medicationColumns}
          dataSource={analyticsData.topMedications}
          pagination={false}
          size="small"
          loading={refreshing}
        />
      </Card>
    </div>
  )
}

export default AnalyticsDashboard