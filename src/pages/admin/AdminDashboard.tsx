/**
 * Admin Dashboard Component
 * 
 * This component displays the main dashboard for administrators,
 * showing key metrics, alerts, and system overview with real data from the backend.
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Statistic, Typography, Space, Alert, List, Badge, Progress, Tag, Button, Spin, message } from 'antd'
import {
  UserOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  DollarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  WifiOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import dashboardService, { DashboardStats, SystemAlerts, RecentActivity } from '../../services/dashboardService'

const { Title } = Typography

// ============================================================================
// Admin Dashboard Component
// ============================================================================

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  
  // State for dashboard data
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [alerts, setAlerts] = useState<SystemAlerts | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null)
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all dashboard data in parallel
      const [statsData, alertsData, activityData, revenueData] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getSystemAlerts(),
        dashboardService.getRecentActivity(),
        dashboardService.getMonthlyRevenue()
      ])

      setStats(statsData)
      setAlerts(alertsData)
      setRecentActivity(activityData)
      setMonthlyRevenue(revenueData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      message.error('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    loadDashboardData()
  }, [])

  // Refresh data handler
  const handleRefresh = () => {
    setRefreshing(true)
    loadDashboardData()
  }

  // Helper functions for activity display
  const getActivityIcon = (type: string) => {
    if (!type) return <ClockCircleOutlined />
    
    switch (type.toLowerCase()) {
      case 'prescription': return <FileTextOutlined style={{ color: '#1890ff' }} />
      case 'inventory': return <MedicineBoxOutlined style={{ color: '#52c41a' }} />
      case 'user': return <UserOutlined style={{ color: '#722ed1' }} />
      case 'alert': return <WarningOutlined style={{ color: '#fa8c16' }} />
      case 'bill': return <DollarOutlined style={{ color: '#13c2c2' }} />
      default: return <ClockCircleOutlined />
    }
  }

  const getStatusBadge = (status: string) => {
    if (!status) return <Badge status="default" text="Unknown" />
    
    switch (status.toLowerCase()) {
      case 'pending': return <Badge status="processing" text="Pending" />
      case 'completed': return <Badge status="success" text="Completed" />
      case 'approved': return <Badge status="success" text="Approved" />
      case 'paid': return <Badge status="success" text="Paid" />
      case 'rejected': return <Badge status="error" text="Rejected" />
      case 'processing': return <Badge status="processing" text="Processing" />
      case 'unknown': return <Badge status="default" text="Unknown" />
      default: return <Badge status="default" text={status} />
    }
  }

  // System status (static data for now - can be enhanced with real monitoring later)
  const systemStatus = {
    database: { status: 'healthy', uptime: '99.9%', lastCheck: '1 min ago' },
    server: { status: 'healthy', uptime: '99.8%', lastCheck: '30 sec ago' },
    api: { status: 'healthy', uptime: '99.9%', lastCheck: '15 sec ago' },
    storage: { used: 65, total: 100, unit: 'GB' }
  }

  const getSystemStatusIcon = (status: string) => {
    return status === 'healthy' 
      ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
      : <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
  }

  // Convert backend activity data to display format
  const formatActivityData = () => {
    if (!recentActivity) return []
    
    const activities: Array<{
      id: string
      action: string
      user: string
      timestamp: string
      type: string
      status: string
    }> = []
    
    // Add recent prescriptions
    recentActivity.recentPrescriptions?.forEach(prescription => {
      if (prescription) {
        activities.push({
          id: `prescription-${prescription.id}`,
          action: 'New prescription uploaded',
          user: prescription.customer.firstName || 'Unknown User',
          timestamp: prescription.uploadedAt ? new Date(prescription.updatedAt).toLocaleDateString() : 'Unknown Time',
          type: 'prescription',
          status: prescription.status ? prescription.status.toLowerCase() : 'pending'
        })
      }
    })

    // Add recent bills
    recentActivity.recentBills?.forEach(bill => {
      if (bill) {
        activities.push({
          id: `bill-${bill.id}`,
          action: 'Bill generated',
          user: bill.customerName || 'Unknown User',
          timestamp: bill.createdAt ? new Date(bill.createdAt).toLocaleString() : 'Unknown Time',
          type: 'bill',
          status: bill.status ? bill.status.toLowerCase() : 'pending'
        })
      }
    })

    // Sort by timestamp (most recent first) and return top 5
    const sortedActivities = [...activities].sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime()
      const dateB = new Date(b.timestamp).getTime()
      // Handle invalid dates
      if (isNaN(dateA) && isNaN(dateB)) return 0
      if (isNaN(dateA)) return 1
      if (isNaN(dateB)) return -1
      return dateB - dateA
    })
    return sortedActivities.slice(0, 5)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          Admin Dashboard
          <Button 
            type="text" 
            icon={<ReloadOutlined spin={refreshing} />} 
            onClick={handleRefresh}
            style={{ marginLeft: '16px' }}
          >
            Refresh
          </Button>
        </Title>
        <p style={{ color: '#666', marginBottom: 0 }}>
          Welcome back! Here's what's happening at your pharmacy.
        </p>
      </div>

      {/* Alerts */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {stats && stats.lowStockMedicines > 0 && (
              <Alert
                message={`${stats.lowStockMedicines} medicines are running low on stock`}
                type="warning"
                icon={<WarningOutlined />}
                showIcon
                closable
              />
            )}
            {alerts?.lowStockMedicines?.length && alerts.lowStockMedicines.length > 0 && (
              <Alert
                message={`${alerts.lowStockMedicines.length} medicines are expiring soon`}
                type="error"
                icon={<WarningOutlined />}
                showIcon
                closable
              />
            )}
          </Space>
        </Col>
      </Row>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats?.totalUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Medicines"
              value={stats?.totalMedicines || 0}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Prescriptions"
              value={stats?.pendingPrescriptions || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Monthly Revenue"
              value={monthlyRevenue}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Additional Dashboard Content */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="Recent Activity" 
            style={{ height: '400px' }}
          >
            <List
              dataSource={formatActivityData()}
              size="small"
              locale={{ emptyText: 'No recent activity' }}
              renderItem={(item: any) => {
                if (!item) return null
                return (
                  <List.Item>
                    <List.Item.Meta
                      avatar={getActivityIcon(item.type || 'default')}
                      title={
                        <Space>
                          <span>{item.action || 'Unknown Action'}</span>
                          {getStatusBadge(item.status || 'unknown')}
                        </Space>
                      }
                      description={
                        <Space split={<span>•</span>}>
                          <span>{item.user || 'Unknown User'}</span>
                          <span style={{ color: '#999' }}>{item.timestamp || 'Unknown Time'}</span>
                        </Space>
                      }
                    />
                  </List.Item>
                )
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AdminDashboard
