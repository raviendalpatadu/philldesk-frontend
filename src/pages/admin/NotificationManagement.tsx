import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Popconfirm,
  message,
  Row,
  Col,
  Statistic,
  Select,
  Input,
  Badge,
  Typography,
  Tooltip,
  Divider
} from 'antd'
import {
  BellOutlined,
  DeleteOutlined,
  CheckOutlined,
  ReloadOutlined,
  WarningOutlined,
  AlertOutlined,
  ExclamationCircleOutlined,
  PlayCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { Notification, NotificationType, NotificationPriority } from '../../types'
import { notificationService } from '../../services/notificationService'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select
const { Search } = Input

interface ScheduledTaskStats {
  expiredBillsCount: number
  lowStockCount: number
  expiringMedicinesCount: number
}

const NotificationManagement: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [taskStats, setTaskStats] = useState<ScheduledTaskStats>({
    expiredBillsCount: 0,
    lowStockCount: 0,
    expiringMedicinesCount: 0
  })
  const [filterType, setFilterType] = useState<string>('ALL')
  const [filterPriority, setFilterPriority] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  useEffect(() => {
    loadNotifications()
    loadTaskStats()
  }, [pagination.current, pagination.pageSize, filterType, filterPriority, searchTerm])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const response = await notificationService.getAllNotifications(
        pagination.current - 1,
        pagination.pageSize
      )
      
      let filteredNotifications = response.content

      // Apply filters
      if (filterType !== 'ALL') {
        filteredNotifications = filteredNotifications.filter(
          (notification) => notification.notificationType === filterType
        )
      }

      if (filterPriority !== 'ALL') {
        filteredNotifications = filteredNotifications.filter(
          (notification) => notification.priority === filterPriority
        )
      }

      if (searchTerm) {
        filteredNotifications = filteredNotifications.filter(
          (notification) =>
            notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notification.message.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      setNotifications(filteredNotifications)
      setPagination(prev => ({
        ...prev,
        total: response.totalElements
      }))
    } catch (error) {
      console.error('Failed to load notifications:', error)
      message.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const loadTaskStats = async () => {
    try {
      const [expiredBills, lowStock, expiringMedicines] = await Promise.all([
        notificationService.getExpiredBillsCount(),
        notificationService.getLowStockCount(),
        notificationService.getExpiringMedicinesCount()
      ])

      setTaskStats({
        expiredBillsCount: expiredBills,
        lowStockCount: lowStock,
        expiringMedicinesCount: expiringMedicines
      })
    } catch (error) {
      console.error('Failed to load task statistics:', error)
    }
  }

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId)
      loadNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleDelete = async (notificationId: number) => {
    try {
      await notificationService.deleteNotification(notificationId)
      loadNotifications()
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const handleBulkMarkAsRead = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select notifications to mark as read')
      return
    }

    try {
      await Promise.all(
        selectedRowKeys.map(id => notificationService.markAsRead(Number(id)))
      )
      setSelectedRowKeys([])
      loadNotifications()
      message.success(`${selectedRowKeys.length} notifications marked as read`)
    } catch (error) {
      console.error('Failed to mark notifications as read:', error)
      message.error('Failed to mark notifications as read')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select notifications to delete')
      return
    }

    try {
      await Promise.all(
        selectedRowKeys.map(id => notificationService.deleteNotification(Number(id)))
      )
      setSelectedRowKeys([])
      loadNotifications()
      message.success(`${selectedRowKeys.length} notifications deleted`)
    } catch (error) {
      console.error('Failed to delete notifications:', error)
      message.error('Failed to delete notifications')
    }
  }

  const handleScheduledTask = async (task: 'expiredBills' | 'lowStock' | 'expiringMedicines') => {
    try {
      switch (task) {
        case 'expiredBills':
          await notificationService.processExpiredBills()
          break
        case 'lowStock':
          await notificationService.checkLowStock()
          break
        case 'expiringMedicines':
          await notificationService.checkExpiringMedicines()
          break
      }
      loadTaskStats()
      loadNotifications()
    } catch (error) {
      console.error('Error executing scheduled task:', error)
    }
  }

  const getNotificationTypeColor = (type: NotificationType): string => {
    switch (type) {
      case 'LOW_STOCK':
        return 'orange'
      case 'EXPIRY_ALERT':
        return 'red'
      case 'PRESCRIPTION_UPLOADED':
        return 'blue'
      case 'PRESCRIPTION_APPROVED':
        return 'green'
      case 'PRESCRIPTION_REJECTED':
        return 'red'
      case 'BILL_GENERATED':
        return 'cyan'
      case 'SYSTEM_ALERT':
        return 'purple'
      case 'USER_REGISTRATION':
        return 'lime'
      default:
        return 'default'
    }
  }

  const getPriorityIcon = (priority: NotificationPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return <AlertOutlined style={{ color: '#ff4d4f' }} />
      case 'HIGH':
        return <WarningOutlined style={{ color: '#faad14' }} />
      case 'MEDIUM':
        return <ExclamationCircleOutlined style={{ color: '#1890ff' }} />
      case 'LOW':
        return <BellOutlined style={{ color: '#52c41a' }} />
      default:
        return <BellOutlined />
    }
  }

  const columns: ColumnsType<Notification> = [
    {
      title: 'Status',
      dataIndex: 'isRead',
      key: 'isRead',
      width: 80,
      render: (isRead: boolean) => (
        <Badge status={isRead ? 'default' : 'processing'} />
      )
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: NotificationPriority) => (
        <Tooltip title={priority}>
          {getPriorityIcon(priority)}
        </Tooltip>
      )
    },
    {
      title: 'Type',
      dataIndex: 'notificationType',
      key: 'notificationType',
      width: 140,
      render: (type: NotificationType) => (
        <Tag color={getNotificationTypeColor(type)}>
          {type.replace('_', ' ')}
        </Tag>
      )
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (title: string, record: Notification) => (
        <div>
          <Text strong={!record.isRead}>{title}</Text>
        </div>
      )
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (message: string, record: Notification) => (
        <Tooltip title={message}>
          <Text type={record.isRead ? 'secondary' : undefined}>
            {message}
          </Text>
        </Tooltip>
      )
    },
    {
      title: 'User',
      key: 'user',
      width: 150,
      render: (_, record: Notification) => (
        <Text>
          {record.user.firstName} {record.user.lastName}
        </Text>
      )
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (createdAt: string) => (
        <Text>{dayjs(createdAt).format('MMM DD, YYYY HH:mm')}</Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record: Notification) => (
        <Space>
          {!record.isRead && (
            <Tooltip title="Mark as read">
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleMarkAsRead(record.id)}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="Are you sure you want to delete this notification?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record: Notification) => ({
      name: record.title
    })
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <BellOutlined /> Notification Management
      </Title>

      {/* Scheduled Tasks Statistics */}
      <Card title="Scheduled Tasks Overview" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Expired Bills"
                value={taskStats.expiredBillsCount}
                prefix={<ExclamationCircleOutlined />}
                suffix={
                  <Button
                    type="link"
                    size="small"
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleScheduledTask('expiredBills')}
                  >
                    Process Now
                  </Button>
                }
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Low Stock Medicines"
                value={taskStats.lowStockCount}
                prefix={<WarningOutlined />}
                suffix={
                  <Button
                    type="link"
                    size="small"
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleScheduledTask('lowStock')}
                  >
                    Check Now
                  </Button>
                }
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Expiring Medicines"
                value={taskStats.expiringMedicinesCount}
                prefix={<AlertOutlined />}
                suffix={
                  <Button
                    type="link"
                    size="small"
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleScheduledTask('expiringMedicines')}
                  >
                    Check Now
                  </Button>
                }
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Notifications Table */}
      <Card
        title="System Notifications"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                loadNotifications()
                loadTaskStats()
              }}
            >
              Refresh
            </Button>
          </Space>
        }
      >
        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Search
              placeholder="Search notifications"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={loadNotifications}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: '100%' }}
              placeholder="Filter by type"
            >
              <Option value="ALL">All Types</Option>
              <Option value="LOW_STOCK">Low Stock</Option>
              <Option value="EXPIRY_ALERT">Expiry Alert</Option>
              <Option value="PRESCRIPTION_UPLOADED">Prescription Uploaded</Option>
              <Option value="PRESCRIPTION_APPROVED">Prescription Approved</Option>
              <Option value="PRESCRIPTION_REJECTED">Prescription Rejected</Option>
              <Option value="BILL_GENERATED">Bill Generated</Option>
              <Option value="SYSTEM_ALERT">System Alert</Option>
              <Option value="USER_REGISTRATION">User Registration</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              value={filterPriority}
              onChange={setFilterPriority}
              style={{ width: '100%' }}
              placeholder="Filter by priority"
            >
              <Option value="ALL">All Priorities</Option>
              <Option value="CRITICAL">Critical</Option>
              <Option value="HIGH">High</Option>
              <Option value="MEDIUM">Medium</Option>
              <Option value="LOW">Low</Option>
            </Select>
          </Col>
        </Row>

        {/* Bulk Actions */}
        {selectedRowKeys.length > 0 && (
          <>
            <Space style={{ marginBottom: 16 }}>
              <Text>Selected {selectedRowKeys.length} notifications</Text>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={handleBulkMarkAsRead}
              >
                Mark as Read
              </Button>
              <Popconfirm
                title={`Are you sure you want to delete ${selectedRowKeys.length} notifications?`}
                onConfirm={handleBulkDelete}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                >
                  Delete Selected
                </Button>
              </Popconfirm>
            </Space>
            <Divider />
          </>
        )}

        <Table
          columns={columns}
          dataSource={notifications}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} notifications`
          }}
          onChange={(paginationConfig) => {
            setPagination({
              current: paginationConfig.current || 1,
              pageSize: paginationConfig.pageSize || 10,
              total: pagination.total
            })
          }}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>
    </div>
  )
}

export default NotificationManagement
