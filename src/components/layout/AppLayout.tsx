/**
 * App Layout Component
 * 
 * This component provides the main layout structure for authenticated users,
 * including navigation, header, and content areas.
 */

import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Space,
  Typography,
  Badge,
} from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  UsergroupAddOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  HistoryOutlined,
  PieChartOutlined,
  WarningOutlined,
  AlertOutlined,
  BoxPlotOutlined,
  ShopOutlined,
  DatabaseOutlined
} from '@ant-design/icons'
import { useAuthStore, useUserRole } from '@store/authStore'

const { Header, Sider, Content } = Layout
const { Title } = Typography

// ============================================================================
// App Layout Component
// ============================================================================

const AppLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const userRole = useUserRole()
  const [collapsed, setCollapsed] = useState(false)
  const [openKeys, setOpenKeys] = useState<string[]>([])

  // Update openKeys when location changes
  useEffect(() => {
    setOpenKeys(getOpenKeys())
  }, [location.pathname])

  // Handle submenu open/close
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys)
  }

  // Calculate active menu keys based on current location
  const getActiveKeys = () => {
    const path = location.pathname
    const searchParams = new URLSearchParams(location.search)
    
    // Handle special cases with query parameters
    if (path === '/pharmacist/prescriptions') {
      const status = searchParams.get('status')
      if (status === 'pending') return ['/pharmacist/prescriptions/pending']
      if (status === 'approved') return ['/pharmacist/prescriptions/approved']
      return ['/pharmacist/prescriptions']
    }
    
    if (path === '/pharmacist/inventory') {
      const filter = searchParams.get('filter')
      if (filter === 'low-stock') return ['/pharmacist/inventory/low-stock']
      if (filter === 'out-of-stock') return ['/pharmacist/inventory/out-of-stock']
      return ['/pharmacist/inventory']
    }
    
    if (path === '/pharmacist/billing') {
      const view = searchParams.get('view')
      if (view === 'history') return ['/pharmacist/sales']
      return ['/pharmacist/billing']
    }
    
    // Default to exact path match
    return [path]
  }

  // Calculate open submenu keys
  const getOpenKeys = () => {
    const path = location.pathname
    const openKeys: string[] = []
    
    if (path.startsWith('/pharmacist/prescriptions')) {
      openKeys.push('prescriptions')
    }
    if (path.startsWith('/pharmacist/inventory') || path === '/pharmacist/reorder-management') {
      openKeys.push('inventory')
    }
    if (path.startsWith('/pharmacist/billing') || path === '/pharmacist/manual-billing') {
      openKeys.push('billing')
    }
    if (path.startsWith('/admin/')) {
      if (path.includes('/inventory') || path.includes('/users')) {
        openKeys.push('management')
      }
      if (path.includes('/reports') || path.includes('/analytics')) {
        openKeys.push('analytics')
      }
    }
    if (path.startsWith('/customer/prescriptions') || path.startsWith('/customer/upload') || path.startsWith('/customer/pending')) {
      openKeys.push('prescriptions')
    }
    if (path.startsWith('/customer/orders') || path.startsWith('/customer/billing')) {
      openKeys.push('orders')
    }
    
    return openKeys
  }

  // Calculate notification count based on user role
  const getNotificationCount = () => {
    switch (userRole) {
      case 'ADMIN': return 13
      case 'PHARMACIST': return 8
      case 'CUSTOMER': return 3
      default: return 0
    }
  }

  // Handle notification click
  const handleNotificationClick = () => {
    // Future enhancement: Open notification drawer/modal
    console.log('Notifications clicked for', userRole)
  }

  // Handle user logout
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Get menu items based on user role with enhanced navigation structure
  const getMenuItems = () => {
    switch (userRole) {
      case 'ADMIN':
        return [
          {
            key: '/admin/dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
            onClick: () => navigate('/admin/dashboard'),
          },
          {
            type: 'divider' as const,
          },
          {
            key: 'management',
            icon: <MedicineBoxOutlined />,
            label: 'Management',
            children: [
              {
                key: '/admin/inventory',
                icon: <MedicineBoxOutlined />,
                label: 'Inventory Management',
                onClick: () => navigate('/admin/inventory'),
              },
              {
                key: '/admin/users',
                icon: <UsergroupAddOutlined />,
                label: (
                  <Space>
                    User Management
                    <Badge count={2} size="small" />
                  </Space>
                ),
                onClick: () => navigate('/admin/users'),
              },
            ],
          },
          {
            key: 'analytics',
            icon: <BarChartOutlined />,
            label: 'Analytics & Reports',
            children: [
              {
                key: '/admin/reports',
                icon: <BarChartOutlined />,
                label: 'Reports',
                onClick: () => navigate('/admin/reports'),
              },
              {
                key: '/admin/analytics',
                icon: <PieChartOutlined />,
                label: 'Analytics Dashboard',
                onClick: () => navigate('/admin/analytics'),
              },
            ],
          },
          {
            key: '/admin/settings',
            icon: <SettingOutlined />,
            label: 'System Settings',
            onClick: () => navigate('/admin/settings'),
          },
          {
            type: 'divider' as const,
          },
          {
            key: '/profile',
            icon: <UserOutlined />,
            label: 'My Profile',
            onClick: () => navigate('/profile'),
          },
        ]

      case 'PHARMACIST':
        return [
          {
            key: '/pharmacist/dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
            onClick: () => navigate('/pharmacist/dashboard'),
          },
          {
            type: 'divider' as const,
          },
          {
            key: 'prescriptions',
            icon: <FileTextOutlined />,
            label: 'Prescription Management',
            children: [
              {
                key: '/pharmacist/prescriptions',
                icon: <FileTextOutlined />,
                label: 'All Prescriptions',
                onClick: () => navigate('/pharmacist/prescriptions'),
              },
              {
                key: '/pharmacist/prescriptions/pending',
                icon: <ClockCircleOutlined />,
                label: (
                  <Space>
                    Pending Approvals
                    <Badge count={8} size="small" />
                  </Space>
                ),
                onClick: () => navigate('/pharmacist/prescriptions?status=pending'),
              },
              {
                key: '/pharmacist/prescriptions/approved',
                icon: <CheckCircleOutlined />,
                label: 'Approved Today',
                onClick: () => navigate('/pharmacist/prescriptions?status=approved'),
              },
            ],
          },
          {
            key: 'billing',
            icon: <ShoppingCartOutlined />,
            label: 'Billing & Sales',
            children: [
              {
                key: '/pharmacist/billing',
                icon: <FileTextOutlined />,
                label: 'Prescription Bills',
                onClick: () => navigate('/pharmacist/billing'),
              },
              {
                key: '/pharmacist/manual-billing',
                icon: <ShoppingCartOutlined />,
                label: 'Manual Billing',
                onClick: () => navigate('/pharmacist/manual-billing'),
              },
            ],
          },
          {
            key: 'inventory',
            icon: <BoxPlotOutlined />,
            label: 'Inventory Management',
            children: [
              {
                key: '/pharmacist/inventory',
                icon: <DatabaseOutlined />,
                label: 'All Inventory',
                onClick: () => navigate('/pharmacist/inventory'),
              },
              {
                key: '/pharmacist/inventory/low-stock',
                icon: <WarningOutlined />,
                label: (
                  <Space>
                    Low Stock Items
                  </Space>
                ),
                onClick: () => navigate('/pharmacist/inventory?filter=low-stock'),
              },
              {
                key: '/pharmacist/inventory/out-of-stock',
                icon: <AlertOutlined />,
                label: (
                  <Space>
                    Out of Stock
                  </Space>
                ),
                onClick: () => navigate('/pharmacist/inventory?filter=out-of-stock'),
              }
            ],
          },
          {
            type: 'divider' as const,
          },
          {
            key: '/profile',
            icon: <UserOutlined />,
            label: 'My Profile',
            onClick: () => navigate('/profile'),
          },
        ]

      case 'CUSTOMER':
        return [
          {
            key: '/customer/dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
            onClick: () => navigate('/customer/dashboard'),
          },
          {
            type: 'divider' as const,
          },
          {
            key: 'prescriptions',
            icon: <FileTextOutlined />,
            label: 'My Prescriptions',
            children: [
              {
                key: '/customer/prescriptions',
                icon: <FileTextOutlined />,
                label: 'All Prescriptions',
                onClick: () => navigate('/customer/prescriptions'),
              },
              {
                key: '/customer/upload',
                icon: <UploadOutlined />,
                label: 'Upload New',
                onClick: () => navigate('/customer/upload'),
              },
              {
                key: '/customer/pending',
                icon: <ClockCircleOutlined />,
                label: (
                  <Space>
                    Pending
                  </Space>
                ),
                onClick: () => navigate('/customer/pending'),
              },
              {
                key: '/customer/prescriptions/completed',
                icon: <CheckCircleOutlined />,
                label: 'Completed',
                onClick: () => navigate('/customer/prescriptions?status=completed'),
              },
            ],
          },
          {
            key: 'orders',
            icon: <ShoppingCartOutlined />,
            label: 'Orders & Billing',
            children: [
              {
                key: '/customer/orders',
                icon: <HistoryOutlined />,
                label: 'Order History',
                onClick: () => navigate('/customer/orders'),
              },
              {
                key: '/customer/billing',
                icon: <ShoppingCartOutlined />,
                label: 'Bills & Payments',
                onClick: () => navigate('/customer/billing'),
              },
            ],
          },
          {
            type: 'divider' as const,
          },
          {
            key: '/profile',
            icon: <UserOutlined />,
            label: 'My Profile',
            onClick: () => navigate('/profile'),
          },
        ]

      default:
        return [
          {
            key: '/profile',
            icon: <UserOutlined />,
            label: 'Profile',
            onClick: () => navigate('/profile'),
          },
        ]
    }
  }

  // User dropdown menu
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            height: '64px',
            margin: '16px',
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MedicineBoxOutlined
            style={{
              fontSize: '24px',
              color: '#fff',
            }}
          />
          {!collapsed && (
            <Title level={4} style={{ color: '#fff', margin: '0 0 0 8px' }}>
              PhillDesk
            </Title>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getActiveKeys()}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          items={getMenuItems()}
          style={{ border: 'none' }}
        />
      </Sider>

      {/* Main Layout */}
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        {/* Header */}
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            justifyContent: 'space-between',
          }}
        >
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
          </Space>

          <Space size="large">
            {/* Notifications */}
            <Badge count={getNotificationCount()} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{ fontSize: '16px' }}
                onClick={handleNotificationClick}
              />
            </Badge>

            {/* User Menu */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  size="default"
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                >
                  {user?.firstName?.charAt(0)}
                </Avatar>
                <span>
                  {user?.firstName} {user?.lastName}
                </span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Content */}
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#fff',
            borderRadius: '8px',
            minHeight: 'calc(100vh - 112px)',
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout
