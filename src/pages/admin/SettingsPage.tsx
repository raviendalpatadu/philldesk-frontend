/**
 * Admin Settings Page
 * 
 * This component provides comprehensive system configuration and pharmacy
 * settings management for administrators, including business settings,
 * system preferences, security settings, and notification management.
 */

import React, { useState } from 'react'
import { 
  Typography, 
  Card, 
  Row, 
  Col,
  Form,
  Input,
  Switch,
  Button,
  Select,
  TimePicker,
  InputNumber,
  Tabs,
  Space,
  Divider,
  Alert,
  message,
  Modal,
  Tag,
  Table,
  Popconfirm
} from 'antd'
import { 
  SettingOutlined,
  ShopOutlined,
  SecurityScanOutlined,
  BellOutlined,
  DatabaseOutlined,
  SaveOutlined,
  ReloadOutlined,
  DeleteOutlined,
  PlusOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select
const { TabPane } = Tabs
const { TextArea } = Input

// Mock data for API keys
const mockApiKeys = [
  {
    key: '1',
    name: 'Payment Gateway',
    service: 'Stripe',
    status: 'active',
    created: '2024-01-15',
    lastUsed: '2024-01-17',
    permissions: ['read', 'write']
  },
  {
    key: '2',
    name: 'SMS Service',
    service: 'Twilio',
    status: 'active',
    created: '2024-01-10',
    lastUsed: '2024-01-17',
    permissions: ['read', 'write']
  },
  {
    key: '3',
    name: 'Email Service',
    service: 'SendGrid',
    status: 'inactive',
    created: '2024-01-08',
    lastUsed: '2024-01-16',
    permissions: ['read']
  }
]

const SettingsPage: React.FC = () => {
  const [businessForm] = Form.useForm()
  const [systemForm] = Form.useForm()
  const [securityForm] = Form.useForm()
  const [notificationForm] = Form.useForm()
  const [activeTab, setActiveTab] = useState('business')
  const [isApiKeyModalVisible, setIsApiKeyModalVisible] = useState(false)
  const [editingApiKey, setEditingApiKey] = useState<any>(null)

  // Business Settings
  const handleBusinessSave = (values: any) => {
    console.log('Business settings:', values)
    message.success('Business settings saved successfully!')
  }

  // System Settings  
  const handleSystemSave = (values: any) => {
    console.log('System settings:', values)
    message.success('System settings saved successfully!')
  }

  // Security Settings
  const handleSecuritySave = (values: any) => {
    console.log('Security settings:', values)
    message.success('Security settings saved successfully!')
  }

  // Notification Settings
  const handleNotificationSave = (values: any) => {
    console.log('Notification settings:', values)
    message.success('Notification settings saved successfully!')
  }

  // API Key Management
  const handleApiKeyAdd = () => {
    setEditingApiKey(null)
    setIsApiKeyModalVisible(true)
  }

  const handleApiKeyEdit = (record: any) => {
    setEditingApiKey(record)
    setIsApiKeyModalVisible(true)
  }

  const handleApiKeyDelete = (_key: string) => {
    message.success('API key deleted successfully!')
  }

  const apiKeyColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      render: (service: string) => <Tag color="blue">{service}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Last Used',
      dataIndex: 'lastUsed',
      key: 'lastUsed',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => (
        <Space>
          {permissions.map(perm => (
            <Tag key={perm}>{perm}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleApiKeyEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this API key?"
            onConfirm={() => handleApiKeyDelete(record.key)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <SettingOutlined style={{ marginRight: '8px' }} />
          System Settings
        </Title>
        <Text type="secondary">
          Configure pharmacy settings, system preferences, and security options
        </Text>
      </div>

      {/* Settings Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Business Settings */}
          <TabPane 
            tab={
              <Space>
                <ShopOutlined />
                Business Settings
              </Space>
            } 
            key="business"
          >
            <Form
              form={businessForm}
              layout="vertical"
              onFinish={handleBusinessSave}
              initialValues={{
                pharmacyName: 'PhillDesk Pharmacy',
                address: '123 Healthcare Ave, Medical District',
                phone: '+1 (555) 123-4567',
                email: 'info@philldesk.com',
                licenseNumber: 'PH-2024-001',
                operatingHours: [dayjs('09:00', 'HH:mm'), dayjs('21:00', 'HH:mm')],
                timezone: 'America/New_York',
                currency: 'USD',
                taxRate: 8.5,
                autoReorderEnabled: true,
                lowStockThreshold: 10,
                expiryWarningDays: 30
              }}
            >
              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Pharmacy Name"
                    name="pharmacyName"
                    rules={[{ required: true, message: 'Please enter pharmacy name' }]}
                  >
                    <Input placeholder="Enter pharmacy name" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="License Number"
                    name="licenseNumber"
                    rules={[{ required: true, message: 'Please enter license number' }]}
                  >
                    <Input placeholder="Enter license number" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    label="Address"
                    name="address"
                    rules={[{ required: true, message: 'Please enter address' }]}
                  >
                    <TextArea rows={2} placeholder="Enter complete address" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Phone"
                    name="phone"
                    rules={[{ required: true, message: 'Please enter phone number' }]}
                  >
                    <Input placeholder="Enter phone number" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
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
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Operating Hours"
                    name="operatingHours"
                  >
                    <TimePicker.RangePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Timezone"
                    name="timezone"
                  >
                    <Select placeholder="Select timezone">
                      <Option value="America/New_York">Eastern Time</Option>
                      <Option value="America/Chicago">Central Time</Option>
                      <Option value="America/Denver">Mountain Time</Option>
                      <Option value="America/Los_Angeles">Pacific Time</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Currency"
                    name="currency"
                  >
                    <Select placeholder="Select currency">
                      <Option value="USD">USD ($)</Option>
                      <Option value="EUR">EUR (€)</Option>
                      <Option value="GBP">GBP (£)</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Tax Rate (%)"
                    name="taxRate"
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      step={0.1}
                      style={{ width: '100%' }}
                      placeholder="Enter tax rate"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Low Stock Threshold"
                    name="lowStockThreshold"
                  >
                    <InputNumber
                      min={1}
                      style={{ width: '100%' }}
                      placeholder="Enter threshold"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Auto Reorder"
                    name="autoReorderEnabled"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Expiry Warning (Days)"
                    name="expiryWarningDays"
                  >
                    <InputNumber
                      min={1}
                      style={{ width: '100%' }}
                      placeholder="Days before expiry"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Space>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                  Save Business Settings
                </Button>
                <Button icon={<ReloadOutlined />} onClick={() => businessForm.resetFields()}>
                  Reset
                </Button>
              </Space>
            </Form>
          </TabPane>

          {/* System Settings */}
          <TabPane 
            tab={
              <Space>
                <DatabaseOutlined />
                System Settings
              </Space>
            } 
            key="system"
          >
            <Form
              form={systemForm}
              layout="vertical"
              onFinish={handleSystemSave}
              initialValues={{
                backupEnabled: true,
                backupFrequency: 'daily',
                logRetentionDays: 90,
                sessionTimeout: 30,
                maxUploadSize: 10,
                enableAuditLog: true,
                maintenanceMode: false
              }}
            >
              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Automatic Backup"
                    name="backupEnabled"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Backup Frequency"
                    name="backupFrequency"
                  >
                    <Select placeholder="Select frequency">
                      <Option value="hourly">Hourly</Option>
                      <Option value="daily">Daily</Option>
                      <Option value="weekly">Weekly</Option>
                      <Option value="monthly">Monthly</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Log Retention (Days)"
                    name="logRetentionDays"
                  >
                    <InputNumber
                      min={1}
                      max={365}
                      style={{ width: '100%' }}
                      placeholder="Days to keep logs"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Session Timeout (Minutes)"
                    name="sessionTimeout"
                  >
                    <InputNumber
                      min={5}
                      max={480}
                      style={{ width: '100%' }}
                      placeholder="Session timeout"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Max Upload Size (MB)"
                    name="maxUploadSize"
                  >
                    <InputNumber
                      min={1}
                      max={100}
                      style={{ width: '100%' }}
                      placeholder="Maximum file size"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Audit Logging"
                    name="enableAuditLog"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    label="Maintenance Mode"
                    name="maintenanceMode"
                    valuePropName="checked"
                  >
                    <Switch 
                      checkedChildren="ON" 
                      unCheckedChildren="OFF" 
                      style={{ backgroundColor: '#ff4d4f' }}
                    />
                  </Form.Item>
                  <Alert
                    message="Warning"
                    description="Enabling maintenance mode will prevent users from accessing the system."
                    type="warning"
                    showIcon
                    style={{ marginTop: '8px' }}
                  />
                </Col>
              </Row>

              <Divider />

              <Space>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                  Save System Settings
                </Button>
                <Button icon={<ReloadOutlined />} onClick={() => systemForm.resetFields()}>
                  Reset
                </Button>
              </Space>
            </Form>
          </TabPane>

          {/* Security Settings */}
          <TabPane 
            tab={
              <Space>
                <SecurityScanOutlined />
                Security Settings
              </Space>
            } 
            key="security"
          >
            <Form
              form={securityForm}
              layout="vertical"
              onFinish={handleSecuritySave}
              initialValues={{
                twoFactorEnabled: true,
                passwordExpiry: 90,
                maxLoginAttempts: 5,
                lockoutDuration: 30,
                ipWhitelistEnabled: false,
                sslEnabled: true
              }}
            >
              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Two-Factor Authentication"
                    name="twoFactorEnabled"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Password Expiry (Days)"
                    name="passwordExpiry"
                  >
                    <InputNumber
                      min={30}
                      max={365}
                      style={{ width: '100%' }}
                      placeholder="Password expiry days"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Max Login Attempts"
                    name="maxLoginAttempts"
                  >
                    <InputNumber
                      min={3}
                      max={10}
                      style={{ width: '100%' }}
                      placeholder="Maximum attempts"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Lockout Duration (Minutes)"
                    name="lockoutDuration"
                  >
                    <InputNumber
                      min={5}
                      max={120}
                      style={{ width: '100%' }}
                      placeholder="Lockout duration"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="IP Whitelist"
                    name="ipWhitelistEnabled"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="SSL/TLS"
                    name="sslEnabled"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                  </Form.Item>
                </Col>
              </Row>

              {/* API Keys Management */}
              <Divider />
              <Title level={4}>API Keys Management</Title>
              
              <div style={{ marginBottom: '16px' }}>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={handleApiKeyAdd}
                >
                  Add API Key
                </Button>
              </div>

              <Table
                columns={apiKeyColumns}
                dataSource={mockApiKeys}
                pagination={false}
                size="middle"
              />

              <Divider />

              <Space>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                  Save Security Settings
                </Button>
                <Button icon={<ReloadOutlined />} onClick={() => securityForm.resetFields()}>
                  Reset
                </Button>
              </Space>
            </Form>
          </TabPane>

          {/* Notification Settings */}
          <TabPane 
            tab={
              <Space>
                <BellOutlined />
                Notifications
              </Space>
            } 
            key="notifications"
          >
            <Form
              form={notificationForm}
              layout="vertical"
              onFinish={handleNotificationSave}
              initialValues={{
                emailNotifications: true,
                smsNotifications: true,
                lowStockAlerts: true,
                expiryAlerts: true,
                orderAlerts: true,
                systemAlerts: true,
                dailyReports: true,
                weeklyReports: false
              }}
            >
              <Row gutter={[24, 16]}>
                <Col xs={24}>
                  <Title level={4}>General Notifications</Title>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Email Notifications"
                    name="emailNotifications"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="SMS Notifications"
                    name="smsNotifications"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                  </Form.Item>
                </Col>
                
                <Col xs={24}>
                  <Title level={4}>System Alerts</Title>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Low Stock Alerts"
                    name="lowStockAlerts"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Expiry Alerts"
                    name="expiryAlerts"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Order Alerts"
                    name="orderAlerts"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="System Alerts"
                    name="systemAlerts"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                  </Form.Item>
                </Col>
                
                <Col xs={24}>
                  <Title level={4}>Reports</Title>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Daily Reports"
                    name="dailyReports"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Weekly Reports"
                    name="weeklyReports"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Space>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                  Save Notification Settings
                </Button>
                <Button icon={<ReloadOutlined />} onClick={() => notificationForm.resetFields()}>
                  Reset
                </Button>
              </Space>
            </Form>
          </TabPane>
        </Tabs>
      </Card>

      {/* API Key Modal */}
      <Modal
        title={editingApiKey ? 'Edit API Key' : 'Add New API Key'}
        open={isApiKeyModalVisible}
        onCancel={() => setIsApiKeyModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          layout="vertical"
          onFinish={(values) => {
            console.log('API Key values:', values)
            message.success(editingApiKey ? 'API key updated!' : 'API key added!')
            setIsApiKeyModalVisible(false)
          }}
          initialValues={editingApiKey || { status: 'active', permissions: ['read'] }}
        >
          <Form.Item
            label="Key Name"
            name="name"
            rules={[{ required: true, message: 'Please enter key name' }]}
          >
            <Input placeholder="Enter descriptive name" />
          </Form.Item>
          
          <Form.Item
            label="Service"
            name="service"
            rules={[{ required: true, message: 'Please select service' }]}
          >
            <Select placeholder="Select service">
              <Option value="Stripe">Stripe</Option>
              <Option value="Twilio">Twilio</Option>
              <Option value="SendGrid">SendGrid</Option>
              <Option value="Custom">Custom</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            label="API Key"
            name="apiKey"
            rules={[{ required: true, message: 'Please enter API key' }]}
          >
            <Input.Password placeholder="Enter API key" />
          </Form.Item>
          
          <Form.Item
            label="Status"
            name="status"
          >
            <Select>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            label="Permissions"
            name="permissions"
          >
            <Select mode="multiple" placeholder="Select permissions">
              <Option value="read">Read</Option>
              <Option value="write">Write</Option>
              <Option value="delete">Delete</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingApiKey ? 'Update' : 'Add'} API Key
              </Button>
              <Button onClick={() => setIsApiKeyModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SettingsPage
