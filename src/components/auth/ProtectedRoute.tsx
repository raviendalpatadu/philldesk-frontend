/**
 * Protected Route Component
 * 
 * This component handles role-based access control for protected routes.
 * It checks authentication and user roles before allowing access to routes.
 */

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Result, Button } from 'antd'
import { useAuthStore, useHasRole } from '@store/authStore'
import { UserRole } from '@types/index'

// ============================================================================
// Types
// ============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  fallbackPath?: string
}

// ============================================================================
// Protected Route Component
// ============================================================================

/**
 * ProtectedRoute - Handles authentication and authorization
 * 
 * @param children - The component to render if authorized
 * @param requiredRoles - Array of roles required to access this route
 * @param fallbackPath - Path to redirect if unauthorized
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  fallbackPath = '/unauthorized',
}) => {
  const location = useLocation()
  const { isAuthenticated, user, isLoading } = useAuthStore()
  const hasRequiredRole = useHasRole(requiredRoles)

  console.log('ProtectedRoute - path:', location.pathname, 'isAuthenticated:', isAuthenticated, 'user:', user, 'isLoading:', isLoading, 'requiredRoles:', requiredRoles, 'hasRequiredRole:', hasRequiredRole);

  // Show loading if authentication check is in progress
  if (isLoading) {
    console.log('ProtectedRoute - showing loading');
    return <div>Loading...</div>
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    console.log('ProtectedRoute - redirecting to login, isAuthenticated:', isAuthenticated, 'user:', user);
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    )
  }

  // Check role-based access if roles are specified
  if (requiredRoles.length > 0 && !hasRequiredRole) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            Go Back
          </Button>
        }
      />
    )
  }

  // Render children if all checks pass
  return <>{children}</>
}

export default ProtectedRoute
