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
  Divider,
  Descriptions,
  Alert,
  Popconfirm
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
  CalendarOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { UserService, User, CreateUserRequest, UpdateUserRequest, UserStats } from '../../services/userService'
import { RoleService, Role } from '../../services/roleService'

const { Title, Text } = Typography
const { Option } = Select

const UserManagement: React.FC = () => {
  // State management
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userModalVisible, setUserModalVisible] = useState(false)
  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    adminUsers: 0,
    pharmacistUsers: 0,
    customerUsers: 0,
    recentLogins: 0
  })
  const [form] = Form.useForm()

  // ============================================================================
  // Data Loading Functions
  // ============================================================================

  /**
   * Load all users from backend
   */
  const loadUsers = async () => {
    try {
      setLoading(true)
      const usersData = await UserService.getAllUsers()
      setUsers(usersData)
      setFilteredUsers(usersData)
      
      // Calculate and set statistics
      const statsData = await UserService.getUserStats()
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load users:', error)
      message.error('Failed to load users. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Load all roles from backend
   */
  const loadRoles = async () => {
    try {
      const rolesData = await RoleService.getAllRoles()
      setRoles(rolesData)
    } catch (error) {
      console.error('Failed to load roles:', error)
      message.error('Failed to load roles.')
    }
  }

  /**
   * Initial data loading
   */
  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [])

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Get full name from user object
   */
  const getFullName = (user: User): string => {
    return `${user.firstName} ${user.lastName}`
  }

  /**
   * Get avatar color based on role
   */
  const getAvatarColor = (role: string): string => {
    switch (role) {
      case 'ADMIN': return '#722ed1'
      case 'PHARMACIST': return '#1890ff'
      case 'CUSTOMER': return '#52c41a'
      default: return '#d9d9d9'
    }
  }

  /**
   * Get status display
   */
  const getStatusDisplay = (isActive: boolean) => {
    return (
      <Tag color={isActive ? 'green' : 'red'}>
        {isActive ? 'Active' : 'Inactive'}
      </Tag>
    )
  }

  /**
   * Get role display
   */
  const getRoleDisplay = (role: Role) => {
    const configs = {
      'ADMIN': { color: 'purple', icon: <SecurityScanOutlined />, text: 'Admin' },
      'PHARMACIST': { color: 'blue', icon: <UserOutlined />, text: 'Pharmacist' },
      'CUSTOMER': { color: 'green', icon: <TeamOutlined />, text: 'Customer' }
    }
    
    const config = configs[role.name] || { 
      color: 'default', 
      icon: <UserOutlined />, 
      text: role.name 
    }
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    )
  }

  // ============================================================================
  // Filtering Functions
  // ============================================================================

  /**
   * Apply filters to user list
   */
  const applyFilters = async () => {
    try {
      const filtered = await UserService.filterUsers(users, {
        role: roleFilter,
        status: statusFilter === 'Active' ? 'Active' : statusFilter === 'Inactive' ? 'Inactive' : undefined,
        searchTerm: searchText
      })
      setFilteredUsers(filtered)
    } catch (error) {
      console.error('Error applying filters:', error)
      message.error('Error filtering users')
    }
  }

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchText('')
    setRoleFilter('all')
    setStatusFilter('all')
    setFilteredUsers(users)
  }

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters()
  }, [searchText, roleFilter, statusFilter, users])

  // ============================================================================
  // CRUD Operations
  // ============================================================================

  /**
   * Create new user
   */
  const handleCreateUser = async (values: any) => {
    try {
      setSubmitting(true)

      const createUserData: CreateUserRequest = {
        username: values.username,
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        address: values.address,
        roleId: values.roleId
      }

      await UserService.createUser(createUserData)
      message.success('User created successfully!')
      setUserModalVisible(false)
      form.resetFields()
      await loadUsers() // Refresh the user list
    } catch (error: any) {
      console.error('Error creating user:', error)
      const errorMessage = error.response?.data?.message || 'Failed to create user'
      message.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * Update existing user
   */
  const handleUpdateUser = async (values: any) => {
    if (!selectedUser) return

    try {
      setSubmitting(true)

      // Ensure roleId is present - use existing role if not provided
      const roleId = values.roleId || selectedUser.role.id

      const updateUserData: UpdateUserRequest = {
        username: values.username,
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || null, // Allow clearing phone
        address: values.address || null, // Allow clearing address
        isActive: values.isActive,
        roleId: roleId
      }

      console.log('Update user data:', updateUserData) // Debug log
      console.log('Form values:', values) // Debug log

      await UserService.updateUser(selectedUser.id, updateUserData)
      message.success('User updated successfully!')
      setUserModalVisible(false)
      setSelectedUser(null)
      await loadUsers() // Refresh the user list
    } catch (error: any) {
      console.error('Error updating user:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update user'
      message.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * Delete user
   */
  const handleDeleteUser = async (user: User) => {
    try {
      await UserService.deleteUser(user.id)
      message.success('User deleted successfully!')
      await loadUsers() // Refresh the user list
    } catch (error: any) {
      console.error('Error deleting user:', error)
      const errorMessage = error.response?.data?.message || 'Failed to delete user'
      message.error(errorMessage)
    }
  }

  /**
   * Toggle user status (activate/deactivate)
   */
  const handleToggleUserStatus = async (user: User) => {
    try {
      if (user.isActive) {
        await UserService.deactivateUser(user.id)
        message.success('User deactivated successfully!')
      } else {
        await UserService.activateUser(user.id)
        message.success('User activated successfully!')
      }
      await loadUsers() // Refresh the user list
    } catch (error: any) {
      console.error('Error toggling user status:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update user status'
      message.error(errorMessage)
    }
  }

  // ============================================================================
  // Modal Functions
  // ============================================================================

  /**
   * Open create/edit user modal
   */
  const handleUserModal = (user?: User) => {
    setSelectedUser(user || null)
    setIsEditing(!!user)
    setUserModalVisible(true)
    
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: user.address,
        isActive: user.isActive,
        roleId: user.role.id
      })
    } else {
      form.resetFields()
    }
  }

  /**
   * Open user details modal
   */
  const viewUserDetails = (user: User) => {
    setSelectedUser(user)
    setViewModalVisible(true)
  }

  /**
   * Handle form submission
   */
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      if (isEditing) {
        await handleUpdateUser(values)
      } else {
        await handleCreateUser(values)
      }
    } catch (error) {
      console.error('Form validation failed:', error)
    }
  }

  // Table columns
  const columns = [
    {
      title: 'User',
      key: 'user',
      width: 250,
      render: (_: any, record: User) => {
        const isWalkInCustomer = record.email.startsWith('walkin_')
        
        return (
          <Space>
            <Avatar 
              icon={<UserOutlined />} 
              style={{ backgroundColor: getAvatarColor(record.role.name) }}
            />
            <div>
              <div style={{ fontWeight: 'bold' }}>
                {getFullName(record)}
                {isWalkInCustomer && (
                  <Tag 
                    color="orange" 
                    style={{ marginLeft: '8px', fontSize: '10px', padding: '0 4px' }}
                  >
                    Walk-in
                  </Tag>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>@{record.username}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
            </div>
          </Space>
        )
      },
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
      onFilter: (value: any, record: User) => record.role.name === value,
      render: (role: Role) => getRoleDisplay(role),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      width: 120,
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value: any, record: User) => record.isActive === value,
      render: (isActive: boolean) => getStatusDisplay(isActive),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (phone: string) => phone || <Text type="secondary">-</Text>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      sorter: (a: User, b: User) => {
        const dateA = UserService.isValidDate(a.createdAt) ? UserService.convertJavaDateArrayToDate(a.createdAt).getTime() : 0
        const dateB = UserService.isValidDate(b.createdAt) ? UserService.convertJavaDateArrayToDate(b.createdAt).getTime() : 0
        return dateA - dateB
      },
      render: (createdAt: string | number[]) => (
        <div>
          <div>{UserService.formatDate(createdAt, 'Invalid Date')}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {UserService.formatTime(createdAt, 'Invalid Time')}
          </div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: User) => {
        // Check if this is a walk-in customer (email starts with "walkin_")
        const isWalkInCustomer = record.email.startsWith('walkin_')
        
        if (isWalkInCustomer) {
          return (
            <Space size="small">
              <Tooltip title="View Details">
                <Button 
                  type="text" 
                  icon={<EyeOutlined />} 
                  size="small"
                  onClick={() => viewUserDetails(record)}
                />
              </Tooltip>
              
              <Tooltip title="Walk-in customers cannot be modified">
                <Button 
                  type="text" 
                  icon={<EditOutlined />} 
                  size="small"
                  disabled
                />
              </Tooltip>
              
              <Tooltip title="Walk-in customers cannot be modified">
                <Button 
                  type="text" 
                  icon={<LockOutlined />} 
                  size="small"
                  disabled
                />
              </Tooltip>
              
              <Tooltip title="Walk-in customers cannot be deleted">
                <Button 
                  type="text" 
                  icon={<DeleteOutlined />} 
                  size="small"
                  disabled
                  danger
                />
              </Tooltip>
            </Space>
          )
        }
        
        return (
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
            
            <Tooltip title={record.isActive ? 'Deactivate' : 'Activate'}>
              <Popconfirm
                title={`${record.isActive ? 'Deactivate' : 'Activate'} User`}
                description={`Are you sure you want to ${record.isActive ? 'deactivate' : 'activate'} this user?`}
                onConfirm={() => handleToggleUserStatus(record)}
                okText="Yes"
                cancelText="No"
              >
                <Button 
                  type="text" 
                  icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />} 
                  size="small"
                />
              </Popconfirm>
            </Tooltip>
            
            <Tooltip title="Delete User">
              <Popconfirm
                title="Delete User"
                description={`Are you sure you want to delete ${getFullName(record)}? This action cannot be undone.`}
                onConfirm={() => handleDeleteUser(record)}
                okText="Delete"
                okType="danger"
                cancelText="Cancel"
              >
                <Button 
                  type="text" 
                  icon={<DeleteOutlined />} 
                  size="small"
                  danger
                />
              </Popconfirm>
            </Tooltip>
          </Space>
        )
      },
    },
  ]

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
              loading={loading}
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
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pharmacists"
              value={stats.pharmacistUsers}
              prefix={<SecurityScanOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Recent Activity"
              value={stats.recentLogins}
              prefix={<CalendarOutlined style={{ color: '#fa541c' }} />}
              valueStyle={{ color: '#fa541c' }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions & Alerts */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={16}>
          {stats.inactiveUsers > 0 && (
            <Alert
              message={`${stats.inactiveUsers} user(s) are currently inactive`}
              description="Review inactive accounts and take appropriate action."
              type="warning"
              showIcon
              action={
                <Button size="small" onClick={() => setStatusFilter('Inactive')}>
                  View Inactive
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
                loading={submitting}
              >
                Add New User
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                block
                onClick={loadUsers}
                loading={loading}
              >
                Refresh Data
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
              onClick={clearFilters}
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
          rowKey="id"
          loading={loading}
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
        onCancel={() => {
          setUserModalVisible(false)
          setSelectedUser(null)
          form.resetFields()
        }}
        confirmLoading={submitting}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => {
              setUserModalVisible(false)
              setSelectedUser(null)
              form.resetFields()
            }}
          >
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={submitting}
            onClick={handleFormSubmit}
          >
            {isEditing ? 'Update' : 'Create'} User
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="Username" 
                name="username" 
                rules={[
                  { required: true, message: 'Please enter username' },
                  { min: 3, message: 'Username must be at least 3 characters' }
                ]}
              >
                <Input placeholder="Enter username" />
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
                label="First Name" 
                name="firstName" 
                rules={[{ required: true, message: 'Please enter first name' }]}
              >
                <Input placeholder="Enter first name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="Last Name" 
                name="lastName" 
                rules={[{ required: true, message: 'Please enter last name' }]}
              >
                <Input placeholder="Enter last name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="Phone Number" 
                name="phone"
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="Role" 
                name="roleId" 
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select placeholder="Select user role">
                  {roles.map(role => (
                    <Option key={role.id} value={role.id}>
                      {role.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            label="Address" 
            name="address"
          >
            <Input.TextArea placeholder="Enter address" rows={3} />
          </Form.Item>

          {isEditing && (
            <Form.Item 
              label="Status" 
              name="isActive" 
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select placeholder="Select status">
                <Option value={true}>Active</Option>
                <Option value={false}>Inactive</Option>
              </Select>
            </Form.Item>
          )}

          {!isEditing && (
            <Form.Item 
              label="Initial Password" 
              name="password" 
              rules={[
                { required: true, message: 'Please enter initial password' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
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
          ...(selectedUser && !selectedUser.email.startsWith('walkin_') ? [
            <Button key="edit" type="primary" onClick={() => {
              setViewModalVisible(false)
              handleUserModal(selectedUser || undefined)
            }}>
              Edit User
            </Button>
          ] : []),
        ]}
      >
        {selectedUser && (
          <div>
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={4}>
                <Avatar 
                  size={80} 
                  icon={<UserOutlined />} 
                  style={{ backgroundColor: getAvatarColor(selectedUser.role.name) }}
                />
              </Col>
              <Col span={20}>
                <Title level={4}>
                  {getFullName(selectedUser)}
                  {selectedUser.email.startsWith('walkin_') && (
                    <Tag 
                      color="orange" 
                      style={{ marginLeft: '8px', fontSize: '12px' }}
                    >
                      Walk-in Customer
                    </Tag>
                  )}
                </Title>
                <Space direction="vertical" size="small">
                  {getRoleDisplay(selectedUser.role)}
                  {getStatusDisplay(selectedUser.isActive)}
                  <Text type="secondary">@{selectedUser.username}</Text>
                </Space>
              </Col>
            </Row>

            {selectedUser.email.startsWith('walkin_') && (
              <Alert
                message="Walk-in Customer"
                description="This user was automatically created for a walk-in transaction. Walk-in customers cannot be modified or deleted through the admin panel."
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}

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
                  {selectedUser.phone || 'Not provided'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Address">
                {selectedUser.address || 'Not provided'}
              </Descriptions.Item>
              <Descriptions.Item label="Role">
                {selectedUser.role.name}
              </Descriptions.Item>
              <Descriptions.Item label="Account Created">
                {UserService.formatDate(selectedUser.createdAt, 'Invalid Date')}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {UserService.formatDate(selectedUser.updatedAt, 'Invalid Date')}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Account Information</Divider>
            <Space wrap>
              <Tag color="blue">User ID: {selectedUser.id}</Tag>
              <Tag color={selectedUser.isActive ? 'green' : 'red'}>
                {selectedUser.isActive ? 'Active Account' : 'Inactive Account'}
              </Tag>
              <Tag color="purple">
                {selectedUser.role.description || selectedUser.role.name}
              </Tag>
              {selectedUser.email.startsWith('walkin_') && (
                <Tag color="orange">Walk-in Customer</Tag>
              )}
            </Space>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default UserManagement
