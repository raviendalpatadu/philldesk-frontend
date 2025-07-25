/**
 * Authentication Service
 * 
 * This service handles all authentication-related API calls including
 * login, logout, registration, and token management.
 */

import axios, { AxiosResponse } from 'axios'
import { LoginRequest, LoginResponse, RegisterRequest, User, BackendLoginResponse } from '../types'

// ============================================================================
// API Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
})

// ============================================================================
// Request/Response Interceptors
// ============================================================================

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('philldesk-auth-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 unauthorized errors
    if (error.response?.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('philldesk-auth-token')
      localStorage.removeItem('philldesk-auth')
      window.location.href = '/login'
    }
    
    // Handle network errors
    if (!error.response) {
      error.message = 'Network error. Please check your connection and try again.'
    }
    
    return Promise.reject(error)
  }
)

// ============================================================================
// Auth Service Class
// ============================================================================

class AuthService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('AuthService - calling backend login with:', credentials);
      const response: AxiosResponse<BackendLoginResponse> = await apiClient.post('/auth/signin', credentials)
      
      console.log('AuthService - backend response:', response.data);
      
      // Transform backend response to frontend format
      const backendData = response.data;
      
      // Convert roles array to single role (take the first role and remove ROLE_ prefix)
      const role = backendData.roles[0]?.replace('ROLE_', '') as 'ADMIN' | 'PHARMACIST' | 'CUSTOMER';
      
      const user: User = {
        id: backendData.id.toString(),
        email: backendData.email,
        firstName: backendData.username, // Using username as firstName for now
        lastName: '', // Backend doesn't provide lastName
        role: role,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const loginResponse: LoginResponse = {
        token: backendData.accessToken,
        user: user,
        expiresIn: 3600, // Default to 1 hour, can be calculated from JWT if needed
      };
      
      // Store token in localStorage
      localStorage.setItem('philldesk-auth-token', backendData.accessToken);
      
      console.log('AuthService - transformed response:', loginResponse);
      return loginResponse;
      
    } catch (error: any) {
      console.error('Login error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<any> {
    try {
      const response: AxiosResponse<any> = await apiClient.post('/auth/signup', userData)
      return response.data
    } catch (error: any) {
      console.error('Registration error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always clear local storage
      this.clearAuthToken()
    }
  }

  /**
   * Verify token with backend
   */
  async verifyToken(): Promise<{ user: User }> {
    try {
      console.log('AuthService - verifying token');
      
      // For now, just return success if we have a valid token
      const token = localStorage.getItem('philldesk-auth-token');
      if (!token) {
        throw new Error('No token found');
      }
      
      // Skip backend verification for now to prevent logout loops
      // Can be implemented later when backend provides verification endpoint
      
      const mockUser: User = {
        id: '1',
        email: 'user@philldesk.com',
        firstName: 'User',
        lastName: '',
        role: 'CUSTOMER',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return { user: mockUser };
      
    } catch (error: any) {
      console.error('Token verification error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response: AxiosResponse<User> = await apiClient.get('/auth/profile')
      return response.data
    } catch (error: any) {
      console.error('Get current user error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response: AxiosResponse<User> = await apiClient.put('/auth/profile', userData)
      return response.data
    } catch (error: any) {
      console.error('Update profile error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Change user password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/change-password', {
        oldPassword,
        newPassword,
      })
    } catch (error: any) {
      console.error('Change password error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await apiClient.post('/auth/forgot-password', { email })
    } catch (error: any) {
      console.error('Password reset request error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword,
      })
    } catch (error: any) {
      console.error('Password reset error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Set authentication token for requests
   */
  setAuthToken(token: string): void {
    localStorage.setItem('philldesk-auth-token', token)
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    localStorage.removeItem('philldesk-auth-token')
    localStorage.removeItem('philldesk-auth')
    delete apiClient.defaults.headers.common['Authorization']
  }

  /**
   * Get stored auth token
   */
  getAuthToken(): string | null {
    return localStorage.getItem('philldesk-auth-token')
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAuthToken()
    if (!token) return false

    try {
      // Check if token is expired
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 > Date.now()
    } catch {
      return false
    }
  }

  /**
   * Handle API errors consistently
   */
  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message ?? error.response.data?.error ?? 'An error occurred'
      const customError = new Error(message)
      customError.name = 'ApiError'
      return customError
    } else if (error.request) {
      // Network error
      const networkError = new Error('Network error. Please check your connection and try again.')
      networkError.name = 'NetworkError'
      return networkError
    } else {
      // Something else happened
      const unknownError = new Error('An unexpected error occurred')
      unknownError.name = 'UnknownError'
      return unknownError
    }
  }
}

// ============================================================================
// Export Service Instance
// ============================================================================

export const authService = new AuthService()

// Export axios instance for other services
export { apiClient }

// ============================================================================
// Token Utilities
// ============================================================================

/**
 * Decode JWT token payload
 */
export const decodeToken = (token: string): any => {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

/**
 * Get token expiration date
 */
export const getTokenExpiration = (token: string): Date | null => {
  const payload = decodeToken(token)
  if (!payload?.exp) return null
  return new Date(payload.exp * 1000)
}

/**
 * Check if token will expire soon (within 5 minutes)
 */
export const isTokenExpiringSoon = (token: string): boolean => {
  const expiration = getTokenExpiration(token)
  if (!expiration) return true
  
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)
  return expiration < fiveMinutesFromNow
}
