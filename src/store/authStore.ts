/**
 * Authentication Store using Zustand
 * 
 * This store manages the authentication state throughout the application,
 * including user login/logout, token management, and role-based access control.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, UserRole, LoginRequest, LoginResponse } from '@types/index'
import { authService } from '@services/authService'

// ============================================================================
// Store Interface
// ============================================================================

interface AuthState {
  // State
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  clearError: () => void
  setLoading: (loading: boolean) => void
  checkAuth: () => void
  updateUser: (user: Partial<User>) => void
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if user has required role
 */
const hasRole = (userRole: UserRole, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(userRole)
}

/**
 * Check if token is expired
 */
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

// ============================================================================
// Auth Store
// ============================================================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login action
      login: async (credentials: LoginRequest) => {
        try {
          set({ isLoading: true, error: null })

          const response: LoginResponse = await authService.login(credentials)
          
          // Store token and user data
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          // Set token in axios defaults for future requests
          authService.setAuthToken(response.token)

        } catch (error: any) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: error?.response?.data?.message ?? 'Login failed. Please try again.',
          })
          throw error
        }
      },

      // Logout action
      logout: () => {
        // Clear token from axios defaults
        authService.clearAuthToken()
        
        // Clear state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
      },

      // Clear error
      clearError: () => {
        set({ error: null })
      },

      // Set loading state
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      // Check authentication status
      checkAuth: () => {
        const { token, user } = get()
        
        if (token && user) {
          // Check if token is expired
          if (isTokenExpired(token)) {
            get().logout()
            return
          }

          // Set token in axios defaults
          authService.setAuthToken(token)
          
          // In development mode, skip backend verification
          if (import.meta.env.DEV) {
            set({ isAuthenticated: true })
            return
          }
          
          // Verify token with backend (production only)
          authService.verifyToken()
            .then((response) => {
              set({
                user: response.user,
                isAuthenticated: true,
              })
            })
            .catch(() => {
              get().logout()
            })
        }
      },

      // Update user data
      updateUser: (userData: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({
            user: { ...user, ...userData },
          })
        }
      },
    }),
    {
      name: 'philldesk-auth', // localStorage key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// ============================================================================
// Auth Hook Helpers
// ============================================================================

/**
 * Custom hook to check if user has required roles
 */
export const useHasRole = (requiredRoles: UserRole[]) => {
  const user = useAuthStore((state) => state.user)
  
  if (!user) return false
  return hasRole(user.role, requiredRoles)
}

/**
 * Custom hook to get current user role
 */
export const useUserRole = () => {
  const user = useAuthStore((state) => state.user)
  return user?.role ?? null
}

/**
 * Custom hook to check if user is authenticated
 */
export const useIsAuthenticated = () => {
  return useAuthStore((state) => state.isAuthenticated)
}

/**
 * Custom hook to get user data
 */
export const useCurrentUser = () => {
  return useAuthStore((state) => state.user)
}

// ============================================================================
// Role-based Access Control Helpers
// ============================================================================

export const ROLE_PERMISSIONS = {
  ADMIN: [
    'manage_users',
    'view_all_prescriptions',
    'view_reports',
    'manage_inventory',
    'manage_billing',
    'system_settings',
  ],
  PHARMACIST: [
    'view_prescriptions',
    'approve_prescriptions',
    'manage_inventory',
    'manage_billing',
    'view_basic_reports',
  ],
  CUSTOMER: [
    'upload_prescriptions',
    'view_own_prescriptions',
    'view_purchase_history',
  ],
} as const

/**
 * Check if user has specific permission
 */
export const useHasPermission = (permission: string) => {
  const user = useAuthStore((state) => state.user)
  
  if (!user) return false
  
  const rolePermissions = ROLE_PERMISSIONS[user.role] || []
  return rolePermissions.includes(permission as any)
}

// ============================================================================
// Auth Error Types
// ============================================================================

export interface AuthError {
  code: string
  message: string
}

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_LOCKED: 'Account has been locked. Please contact administrator',
  TOKEN_EXPIRED: 'Session has expired. Please login again',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to access this resource',
  NETWORK_ERROR: 'Network error. Please check your connection and try again',
} as const
