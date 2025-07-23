/**
 * Admin User Management
 * 
 * This component provides comprehensive user management functionality for admins,
 * including user creation, role management, account status control, and user analytics.
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
  Modal,
  Form,
  message,
  Tooltip,
  Avatar,
  Badge,
  Divider,
  Descriptions,
  Alert
} from 'antd'
import { 
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  SearchOutlined,
  FilterOutlined,
  TeamOutlined,
  SecurityScanOutlined,
  UserAddOutlined,
  ExportOutlined,
  CalendarOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography
const { Option } = Select

// Mock data for users
const mockUsers = [
  {
    key: '1',
    id: 'USR-001',
    name: 'Dr. Sarah Wilson',
    email: 'sarah.wilson@philldesk.com',
    phone: '+1-555-0101',
    role: 'PHARMACIST',
    status: 'Active',
    lastLogin: '2024-01-17T10:30:00Z',
    createdAt: '2023-06-15T09:00:00Z',
    department: 'Pharmacy Operations',
    permissions: ['prescriptions_read', 'prescriptions_write', 'inventory_read', 'billing_write'],
    loginCount: 245,
    profilePicture: null
  },
  {
    key: '2',
    id: 'USR-002',
    name: 'John Smith',
    email: 'john.smith@gmail.com',
    phone: '+1-555-0102',
    role: 'CUSTOMER',
    status: 'Active',
    lastLogin: '2024-01-16T15:45:00Z',
    createdAt: '2023-08-22T14:20:00Z',
    department: null,
    permissions: ['prescriptions_read', 'orders_read', 'billing_read'],
    loginCount: 89,
    profilePicture: null
  },
  {
    key: '3',
    id: 'USR-003',
    name: 'Admin User',
    email: 'admin@philldesk.com',
    phone: '+1-555-0103',
    role: 'ADMIN',
    status: 'Active',
    lastLogin: '2024-01-17T11:15:00Z',
    createdAt: '2023-01-10T08:00:00Z',
    department: 'System Administration',
    permissions: ['all_permissions'],
    loginCount: 1024,
    profilePicture: null
  },
  {
    key: '4',
    id: 'USR-004',
    name: 'Dr. Michael Brown',
    email: 'michael.brown@philldesk.com',
    phone: '+1-555-0104',
    role: 'PHARMACIST',
    status: 'Inactive',
    lastLogin: '2023-12-20T16:30:00Z',
    createdAt: '2023-03-05T10:15:00Z',
    department: 'Pharmacy Operations',
    permissions: ['prescriptions_read', 'inventory_read'],
    loginCount: 156,
    profilePicture: null
  },
  {
    key: '5',
    id: 'USR-005',
    name: 'Emma Davis',
    email: 'emma.davis@gmail.com',
    phone: '+1-555-0105',
    role: 'CUSTOMER',
    status: 'Suspended',
    lastLogin: '2024-01-10T09:20:00Z',
    createdAt: '2023-11-12T12:45:00Z',
    department: null,
    permissions: [],
    loginCount: 23,
    profilePicture: null
  }
]

const UserManagement: React.FC = () => {
  const [users] = useState(mockUsers)
  const [filteredUsers, setFilteredUsers] = useState(mockUsers)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [userModalVisible, setUserModalVisible] = useState(false)
  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isEditing, setIsEditing] = useState(false)
  const [form] = Form.useForm()

  // Calculate statistics
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(user => user.status === 'Active').length,
    pharmacists: users.filter(user => user.role === 'PHARMACIST').length,
    customers: users.filter(user => user.role === 'CUSTOMER').length,
    admins: users.filter(user => user.role === 'ADMIN').length,
    suspendedUsers: users.filter(user => user.status === 'Suspended').length,
    recentLogins: users.filter(user => {
      const loginDate = new Date(user.lastLogin)
      const today = new Date()
      const diffTime = Math.abs(today.getTime() - loginDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 7
    }).length
  }

  // Get avatar color based on role
  const getAvatarColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return '#722ed1'
      case 'PHARMACIST': return '#1890ff'
      case 'CUSTOMER': return '#52c41a'
      default: return '#d9d9d9'
    }
  }

  // Filter users
  const handleFilter = () => {
    let filtered = users

    if (searchText) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase()) ||
        user.id.toLowerCase().includes(searchText.toLowerCase())
      )
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter)
    }

    setFilteredUsers(filtered)
  }

  // Get status display
  const getStatusDisplay = (status: string) => {
    const configs = {
      'Active': { color: 'green', text: 'Active' },
      'Inactive': { color: 'orange', text: 'Inactive' },
      'Suspended': { color: 'red', text: 'Suspended' },
      'Pending': { color: 'blue', text: 'Pending Approval' }
    }
    
    const config = configs[status as keyof typeof configs] || { color: 'default', text: status }
    
    return (
      <Tag color={config.color}>
        {config.text}
      </Tag>
    )
  }

  // Get role display
  const getRoleDisplay = (role: string) => {
    const configs = {
      'ADMIN': { color: 'purple', icon: <SecurityScanOutlined />, text: 'Admin' },
      'PHARMACIST': { color: 'blue', icon: <UserOutlined />, text: 'Pharmacist' },
      'CUSTOMER': { color: 'green', icon: <TeamOutlined />, text: 'Customer' }
    }
    
    const config = configs[role as keyof typeof configs] || { color: 'default', icon: <UserOutlined />, text: role }
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    )
  }

  // Create/Edit user
  const handleUserModal = (user?: any) => {
    setSelectedUser(user)
    setIsEditing(!!user)
    setUserModalVisible(true)
    
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        department: user.department
      })
    } else {
      form.resetFields()
    }
  }

  // View user details
  const viewUserDetails = (user: any) => {
    setSelectedUser(user)
    setViewModalVisible(true)
  }

  // Toggle user status
  const toggleUserStatus = (user: any) => {
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active'
    message.success(`User ${newStatus.toLowerCase()} successfully!`)
  }

  // Delete user
  const deleteUser = (user: any) => {
    Modal.confirm({
      title: 'Delete User',
      content: `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        message.success('User deleted successfully!')
      }
    })
  }

  // Table columns
  const columns = [
    {
      title: 'User',
      key: 'user',
      width: 250,
      render: (_: any, record: any) => (
        <Space>
          <Avatar 
            icon={<UserOutlined />} 
            src={record.profilePicture}
            style={{ backgroundColor: getAvatarColor(record.role) }}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.id}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      filters: [
        { text: 'Admin', value: 'ADMIN' },
        { text: 'Pharmacist', value: 'PHARMACIST' },
        { text: 'Customer', value: 'CUSTOMER' },
      ],
      onFilter: (value: any, record: any) => record.role === value,
      render: (role: string) => getRoleDisplay(role),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: [
        { text: 'Active', value: 'Active' },
        { text: 'Inactive', value: 'Inactive' },
        { text: 'Suspended', value: 'Suspended' },
      ],
      onFilter: (value: any, record: any) => record.status === value,
      render: (status: string) => getStatusDisplay(status),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 150,
      render: (department: string) => department || <Text type="secondary">-</Text>,
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 150,
      sorter: (a: any, b: any) => new Date(a.lastLogin).getTime() - new Date(b.lastLogin).getTime(),
      render: (lastLogin: string) => (
        <div>
          <div>{new Date(lastLogin).toLocaleDateString()}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {new Date(lastLogin).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => viewUserDetails(record)}
            />
          </Tooltip>
          
          <Tooltip title="Edit User">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleUserModal(record)}
            />
          </Tooltip>
          
          <Tooltip title={record.status === 'Active' ? 'Deactivate' : 'Activate'}>
            <Button 
              type="text" 
              icon={record.status === 'Active' ? <LockOutlined /> : <UnlockOutlined />} 
              size="small"
              onClick={() => toggleUserStatus(record)}
            />
          </Tooltip>
          
          <Tooltip title="Delete User">
            <Button 
              type="text" 
              icon={<DeleteOutlined />} 
              size="small"
              danger
              onClick={() => deleteUser(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  // Apply filters
  useEffect(() => {
    handleFilter()
  }, [searchText, roleFilter, statusFilter])

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <TeamOutlined style={{ marginRight: '8px' }} />
          User Management
        </Title>
        <Text type="secondary">
          Manage system users, roles, and permissions
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={stats.activeUsers}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pharmacists"
              value={stats.pharmacists}
              prefix={<SecurityScanOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Recent Logins"
              value={stats.recentLogins}
              prefix={<CalendarOutlined style={{ color: '#fa541c' }} />}
              valueStyle={{ color: '#fa541c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions & Alerts */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={16}>
          {stats.suspendedUsers > 0 && (
            <Alert
              message={`${stats.suspendedUsers} user(s) are currently suspended`}
              description="Review suspended accounts and take appropriate action."
              type="warning"
              showIcon
              action={
                <Button size="small" onClick={() => setStatusFilter('Suspended')}>
                  View Suspended
                </Button>
              }
              style={{ marginBottom: '16px' }}
            />
          )}
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                icon={<UserAddOutlined />} 
                block
                onClick={() => handleUserModal()}
              >
                Add New User
              </Button>
              <Button 
                icon={<ExportOutlined />} 
                block
                onClick={() => message.info('Exporting user data...')}
              >
                Export Users
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
              placeholder="Search users by name, email, or ID..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Role"
              value={roleFilter}
              onChange={setRoleFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">All Roles</Option>
              <Option value="ADMIN">Admin</Option>
              <Option value="PHARMACIST">Pharmacist</Option>
              <Option value="CUSTOMER">Customer</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">All Status</Option>
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
              <Option value="Suspended">Suspended</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Button 
              icon={<FilterOutlined />}
              onClick={() => {
                setSearchText('')
                setRoleFilter('all')
                setStatusFilter('all')
                setFilteredUsers(users)
              }}
            >
              Clear Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Users Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
          }}
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>

      {/* Create/Edit User Modal */}
      <Modal
        title={
          <Space>
            <UserAddOutlined />
            {isEditing ? 'Edit User' : 'Create New User'}
          </Space>
        }
        open={userModalVisible}
        onCancel={() => setUserModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setUserModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={() => {
              message.success(`User ${isEditing ? 'updated' : 'created'} successfully!`)
              setUserModalVisible(false)
            }}
          >
            {isEditing ? 'Update' : 'Create'} User
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="Full Name" 
                name="name" 
                rules={[{ required: true, message: 'Please enter full name' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="Email" 
                name="email" 
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="Phone Number" 
                name="phone"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="Role" 
                name="role" 
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select placeholder="Select user role">
                  <Option value="ADMIN">Admin</Option>
                  <Option value="PHARMACIST">Pharmacist</Option>
                  <Option value="CUSTOMER">Customer</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Department" name="department">
                <Select placeholder="Select department" allowClear>
                  <Option value="System Administration">System Administration</Option>
                  <Option value="Pharmacy Operations">Pharmacy Operations</Option>
                  <Option value="Customer Service">Customer Service</Option>
                  <Option value="Finance">Finance</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="Status" 
                name="status" 
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select placeholder="Select status">
                  <Option value="Active">Active</Option>
                  <Option value="Inactive">Inactive</Option>
                  <Option value="Suspended">Suspended</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {!isEditing && (
            <Form.Item 
              label="Initial Password" 
              name="password" 
              rules={[{ required: true, message: 'Please enter initial password' }]}
            >
              <Input.Password placeholder="Enter initial password" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* User Details Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            User Details
          </Space>
        }
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
          <Button key="edit" type="primary" onClick={() => {
            setViewModalVisible(false)
            handleUserModal(selectedUser)
          }}>
            Edit User
          </Button>,
        ]}
      >
        {selectedUser && (
          <div>
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={4}>
                <Avatar 
                  size={80} 
                  icon={<UserOutlined />} 
                  src={selectedUser.profilePicture}
                  style={{ backgroundColor: getAvatarColor(selectedUser.role) }}
                />
              </Col>
              <Col span={20}>
                <Title level={4}>{selectedUser.name}</Title>
                <Space direction="vertical" size="small">
                  {getRoleDisplay(selectedUser.role)}
                  {getStatusDisplay(selectedUser.status)}
                  <Text type="secondary">ID: {selectedUser.id}</Text>
                </Space>
              </Col>
            </Row>

            <Divider />

            <Descriptions column={2} size="small">
              <Descriptions.Item label="Email">
                <Space>
                  <MailOutlined />
                  {selectedUser.email}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                <Space>
                  <PhoneOutlined />
                  {selectedUser.phone}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {selectedUser.department || 'Not assigned'}
              </Descriptions.Item>
              <Descriptions.Item label="Login Count">
                <Badge count={selectedUser.loginCount} showZero />
              </Descriptions.Item>
              <Descriptions.Item label="Last Login">
                {new Date(selectedUser.lastLogin).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {new Date(selectedUser.createdAt).toLocaleDateString()}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Permissions</Divider>
            <Space wrap>
              {selectedUser.permissions.map((permission: string) => (
                <Tag key={permission} color="blue">
                  {permission.replace('_', ' ').toUpperCase()}
                </Tag>
              ))}
            </Space>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default UserManagement
