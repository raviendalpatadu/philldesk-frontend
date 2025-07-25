/**
 * Register Page Component
 * 
 * This component provides the registration interface for customers to create
 * new accounts in the PhillDesk pharmacy management system.
 */

import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Row,
  Col,
  Space,
  Divider,
  Checkbox,
} from 'antd'
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@store/authStore'
import { RegisterRequest } from '@/types'

const { Title, Text } = Typography

// ============================================================================
// Types
// ============================================================================

interface RegisterFormValues {
  username: string
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  phoneNumber?: string
  agreeToTerms: boolean
}

// ============================================================================
// Register Page Component
// ============================================================================

const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError, isAuthenticated } = useAuthStore()
  const [form] = Form.useForm()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Handle form submission
  const handleSubmit = async (values: RegisterFormValues) => {
    try {
      clearError()
      
      const userData: RegisterRequest = {
        username: values.username,
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.phoneNumber,
        role: 'CUSTOMER', // Default role for customer registration
      }

      await register(userData)
      
      message.success('Registration successful! Please log in with your credentials.')
      navigate('/login')
      
    } catch (error: any) {
      console.error('Registration failed:', error)
      message.error(error.message ?? 'Registration failed. Please try again.')
    }
  }

  // Handle input change to clear errors
  const handleInputChange = () => {
    if (error) {
      clearError()
    }
  }

  return (
    <div 
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '20px',
        paddingBottom: '20px'
      }}
    >
      <Row justify="center" style={{ width: '100%', padding: '10px', minHeight: '100vh' }}>
        <Col xs={24} sm={22} md={18} lg={14} xl={10} xxl={8}>
          <Card
            style={{
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              margin: '20px 0'
            }}
          >
            {/* Header */}
            <div className="text-center" style={{ marginBottom: '24px' }}>
              <Space direction="vertical" size="small">
                <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                  Join PhillDesk
                </Title>
                <Text type="secondary">
                  Create your customer account
                </Text>
              </Space>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            {/* Registration Form */}
            <Form
              form={form}
              name="register"
              onFinish={handleSubmit}
              autoComplete="off"
              layout="vertical"
              size="large"
              style={{ marginBottom: 0 }}
            >
              {/* Name Fields */}
              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="firstName"
                    label="First Name"
                    rules={[
                      {
                        required: true,
                        message: 'Please enter your first name',
                      },
                      {
                        min: 2,
                        message: 'First name must be at least 2 characters',
                      },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="Enter your first name"
                      onChange={handleInputChange}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="lastName"
                    label="Last Name"
                    rules={[
                      {
                        required: true,
                        message: 'Please enter your last name',
                      },
                      {
                        min: 2,
                        message: 'Last name must be at least 2 characters',
                      },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="Enter your last name"
                      onChange={handleInputChange}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Username */}
              <Form.Item
                name="username"
                label="Username"
                rules={[
                  {
                    required: true,
                    message: 'Please enter a username',
                  },
                  {
                    min: 3,
                    message: 'Username must be at least 3 characters',
                  },
                  {
                    max: 20,
                    message: 'Username must be less than 20 characters',
                  },
                  {
                    pattern: /^\w+$/,
                    message: 'Username can only contain letters, numbers, and underscores',
                  },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Choose a username"
                  onChange={handleInputChange}
                />
              </Form.Item>

              {/* Email */}
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  {
                    required: true,
                    message: 'Please enter your email address',
                  },
                  {
                    type: 'email',
                    message: 'Please enter a valid email address',
                  },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Enter your email address"
                  onChange={handleInputChange}
                />
              </Form.Item>

              {/* Phone Number (Optional) */}
              <Form.Item
                name="phoneNumber"
                label="Phone Number (Optional)"
                rules={[
                  {
                    pattern: /^\+?[1-9]\d{0,15}$/,
                    message: 'Please enter a valid phone number',
                  },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="Enter your phone number"
                  onChange={handleInputChange}
                />
              </Form.Item>

              {/* Password Fields */}
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  {
                    required: true,
                    message: 'Please enter a password',
                  },
                  {
                    min: 6,
                    message: 'Password must be at least 6 characters',
                  },
                  {
                    max: 40,
                    message: 'Password must be less than 40 characters',
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Enter your password"
                  onChange={handleInputChange}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm Password"
                dependencies={['password']}
                rules={[
                  {
                    required: true,
                    message: 'Please confirm your password',
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('Passwords do not match'))
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Confirm your password"
                  onChange={handleInputChange}
                />
              </Form.Item>

              {/* Terms and Conditions */}
              <Form.Item
                name="agreeToTerms"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, value) =>
                      value
                        ? Promise.resolve()
                        : Promise.reject(new Error('Please accept the terms and conditions')),
                  },
                ]}
              >
                <Checkbox>
                  I agree to the{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer">
                    Terms and Conditions
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </a>
                </Checkbox>
              </Form.Item>

              {/* Display error message */}
              {error && (
                <div style={{ marginBottom: '16px' }}>
                  <Text type="danger">{error}</Text>
                </div>
              )}

              {/* Submit Button */}
              <Form.Item style={{ marginBottom: '12px' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  block
                  style={{
                    height: '48px',
                    fontSize: '16px',
                    borderRadius: '8px',
                  }}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </Form.Item>

              {/* Additional Links */}
              <div className="text-center" style={{ marginBottom: 0 }}>
                <Space direction="vertical" size="small">
                  <Divider style={{ margin: '12px 0' }}>
                    <Text type="secondary">Already have an account?</Text>
                  </Divider>
                  
                  <Link to="/login">
                    <Button type="default" block>
                      Sign In Instead
                    </Button>
                  </Link>
                </Space>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default RegisterPage
