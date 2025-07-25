/**
 * Login Page Component
 * 
 * This component provides the login interface for users to authenticate
 * with the PhillDesk system using email and password.
 */

import React, { useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
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
} from 'antd'
import {
  UserOutlined,
  LockOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@store/authStore'
import { LoginRequest } from '@/types'

const { Title, Text } = Typography

// ============================================================================
// Types
// ============================================================================

interface LoginFormValues {
  email: string
  password: string
  remember: boolean
}

// ============================================================================
// Login Page Component
// ============================================================================

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore()
  const [form] = Form.useForm()

  // Get the page user was trying to access before login
  const from = location.state?.from

  // Redirect when authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = from?.pathname ?? '/'
      navigate(redirectTo, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  // Handle form submission
  const handleSubmit = async (values: LoginFormValues) => {
    try {
      clearError()
      
      const credentials: LoginRequest = {
        username: values.email,
        password: values.password,
      }

      await login(credentials)
      message.success('Login successful!')
      // Navigation will happen in useEffect when isAuthenticated changes
      
    } catch (error: any) {
      console.error('Login failed:', error)
      message.error(error.message ?? 'Login failed. Please try again.')
    }
  }

  // Handle input change to clear errors
  const handleInputChange = () => {
    if (error) {
      clearError()
    }
  }

  return (
    <div className="full-height flex-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Row justify="center" style={{ width: '100%', padding: '20px' }}>
        <Col xs={22} sm={16} md={12} lg={8} xl={6}>
          <Card
            style={{
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Header */}
            <div className="text-center" style={{ marginBottom: '32px' }}>
              <Space direction="vertical" size="small">
                <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                  PhillDesk
                </Title>
                <Text type="secondary">
                  Online Pharmacy Management System
                </Text>
              </Space>
            </div>

            <Divider />

            {/* Login Form */}
            <Form
              form={form}
              name="login"
              onFinish={handleSubmit}
              autoComplete="off"
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  {
                    required: true,
                    message: 'Please enter your email address',
                  }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Enter your email"
                  onChange={handleInputChange}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[
                  {
                    required: true,
                    message: 'Please enter your password',
                  },
                  {
                    min: 6,
                    message: 'Password must be at least 6 characters',
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Enter your password"
                  onChange={handleInputChange}
                />
              </Form.Item>

              {/* Display error message */}
              {error && (
                <div style={{ marginBottom: '16px' }}>
                  <Text type="danger">{error}</Text>
                </div>
              )}

              <Form.Item style={{ marginBottom: '16px' }}>
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
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </Form.Item>

              {/* Additional Links */}
              <div className="text-center">
                <Space direction="vertical" size="small">
                  <Link to="/forgot-password">
                    <Text type="secondary">Forgot your password?</Text>
                  </Link>
                  
                  <Divider style={{ margin: '16px 0' }}>
                    <Text type="secondary">New to PhillDesk?</Text>
                  </Divider>
                  
                  <Link to="/register">
                    <Button type="default" block>
                      Create Account
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

export default LoginPage
