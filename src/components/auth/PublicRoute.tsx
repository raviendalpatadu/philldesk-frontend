/**
 * Public Route Component
 * 
 * This component handles routes that should only be accessible
 * to non-authenticated users (like login and register pages).
 */

import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore, useUserRole } from '@store/authStore'

// ============================================================================
// Types
// ============================================================================

interface PublicRouteProps {
  children: React.ReactNode
  redirectPath?: string
}

// ============================================================================
// Public Route Component
// ============================================================================

/**
 * PublicRoute - Redirects authenticated users away from public pages
 * 
 * @param children - The component to render if not authenticated
 * @param redirectPath - Path to redirect authenticated users
 */
const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectPath,
}) => {
  const { isAuthenticated } = useAuthStore()
  const userRole = useUserRole()

  // If user is authenticated, redirect to appropriate dashboard
  if (isAuthenticated && userRole) {
    const defaultRedirectPath = redirectPath || getDashboardPath(userRole)
    return <Navigate to={defaultRedirectPath} replace />
  }

  // Render children if not authenticated
  return <>{children}</>
}

/**
 * Get dashboard path based on user role
 */
const getDashboardPath = (role: string): string => {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard'
    case 'PHARMACIST':
      return '/pharmacist/dashboard'
    case 'CUSTOMER':
      return '/customer/dashboard'
    default:
      return '/'
  }
}

export default PublicRoute
