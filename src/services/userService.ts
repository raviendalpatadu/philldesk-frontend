/**
 * User Management Service
 * 
 * This service handles all user management-related API calls including
 * CRUD operations for admin user management functionality.
 */

import axios, { AxiosResponse } from 'axios'

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
      localStorage.removeItem('philldesk-user-info')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ============================================================================
// Type Definitions
// ============================================================================

export interface User {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  address?: string
  isActive: boolean
  role: Role
  createdAt: string | number[]
  updatedAt: string | number[]
}

export interface Role {
  id: number
  name: 'ADMIN' | 'PHARMACIST' | 'CUSTOMER'
  description: string
}

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  address?: string
  roleId: number
}

export interface UpdateUserRequest {
  username?: string
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  isActive?: boolean
  roleId?: number
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  numberOfElements: number
}

export interface UserStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  adminUsers: number
  pharmacistUsers: number
  customerUsers: number
  recentLogins: number
}

// ============================================================================
// API Service Functions
// ============================================================================

export class UserService {
  
  /**
   * Check if a user is a walk-in customer
   */
  static isWalkInCustomer(user: User): boolean {
    return user.email.startsWith('walkin_')
  }

  /**
   * Check if a user is a walk-in customer by email
   */
  static isWalkInCustomerEmail(email: string): boolean {
    return email.startsWith('walkin_')
  }

  /**
   * Convert Java LocalDateTime array to JavaScript Date
   * Java sends dates as: [year, month, day, hour, minute, second, nanosecond]
   * Note: Java month is 1-based, JavaScript month is 0-based
   */
  static convertJavaDateArrayToDate(dateArray: number[] | string): Date {
    try {
      // If it's already a string, try to parse it directly
      if (typeof dateArray === 'string') {
        return new Date(dateArray)
      }
      
      // If it's an array from Java LocalDateTime
      if (Array.isArray(dateArray) && dateArray.length >= 6) {
        const [year, month, day, hour, minute, second, nanosecond = 0] = dateArray
        // Convert nanoseconds to milliseconds and adjust month (Java is 1-based, JS is 0-based)
        const milliseconds = Math.floor(nanosecond / 1000000)
        return new Date(year, month - 1, day, hour, minute, second, milliseconds)
      }
      
      // If it's neither, try to create a date from it
      return new Date(dateArray as any)
    } catch (error) {
      console.error('Error converting Java date array:', dateArray, error)
      return new Date() // Return current date as fallback
    }
  }

  /**
   * Safely format a date, handling both string and Java array formats
   */
  static formatDate(dateInput: number[] | string, fallback: string = 'Invalid Date'): string {
    try {
      const date = this.convertJavaDateArrayToDate(dateInput)
      if (isNaN(date.getTime())) {
        return fallback
      }
      return date.toLocaleDateString()
    } catch (error) {
      console.error('Error formatting date:', dateInput, error)
      return fallback
    }
  }

  /**
   * Safely format a date and time, handling both string and Java array formats
   */
  static formatDateTime(dateInput: number[] | string, fallback: string = 'Invalid Date'): string {
    try {
      const date = this.convertJavaDateArrayToDate(dateInput)
      if (isNaN(date.getTime())) {
        return fallback
      }
      return date.toLocaleString()
    } catch (error) {
      console.error('Error formatting datetime:', dateInput, error)
      return fallback
    }
  }

  /**
   * Safely format just the time part, handling both string and Java array formats
   */
  static formatTime(dateInput: number[] | string, fallback: string = 'Invalid Time'): string {
    try {
      const date = this.convertJavaDateArrayToDate(dateInput)
      if (isNaN(date.getTime())) {
        return fallback
      }
      return date.toLocaleTimeString()
    } catch (error) {
      console.error('Error formatting time:', dateInput, error)
      return fallback
    }
  }

  /**
   * Check if a date input is valid, handling both string and Java array formats
   */
  static isValidDate(dateInput: number[] | string): boolean {
    try {
      const date = this.convertJavaDateArrayToDate(dateInput)
      return !isNaN(date.getTime())
    } catch (error) {
      console.error('Error validating date:', dateInput, error)
      return false
    }
  }
  
  /**
   * Get all users (non-paginated)
   * Excludes walk-in customers
   */
  static async getAllUsers(): Promise<User[]> {
    try {
      const response: AxiosResponse<User[]> = await apiClient.get('/users')
      // Filter out walk-in customers (identified by email starting with "walkin_")
      const filteredUsers = response.data.filter(user => !user.email.startsWith('walkin_'))
      return filteredUsers
    } catch (error) {
      console.error('Error fetching all users:', error)
      throw error
    }
  }

  /**
   * Get paginated users with sorting
   * Excludes walk-in customers
   */
  static async getUsers(
    page: number = 0,
    size: number = 10,
    sortBy: string = 'id',
    sortDir: string = 'asc'
  ): Promise<PaginatedResponse<User>> {
    try {
      const response: AxiosResponse<PaginatedResponse<User>> = await apiClient.get('/users/paged', {
        params: { page, size, sortBy, sortDir }
      })
      
      // Filter out walk-in customers from the paginated results
      const filteredContent = response.data.content.filter(user => !user.email.startsWith('walkin_'))
      
      return {
        ...response.data,
        content: filteredContent,
        totalElements: filteredContent.length,
        numberOfElements: filteredContent.length
      }
    } catch (error) {
      console.error('Error fetching paginated users:', error)
      throw error
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: number): Promise<User> {
    try {
      const response: AxiosResponse<User> = await apiClient.get(`/users/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error)
      throw error
    }
  }

  /**
   * Get user by username
   */
  static async getUserByUsername(username: string): Promise<User> {
    try {
      const response: AxiosResponse<User> = await apiClient.get(`/users/username/${username}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching user with username ${username}:`, error)
      throw error
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User> {
    try {
      const response: AxiosResponse<User> = await apiClient.get(`/users/email/${email}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching user with email ${email}:`, error)
      throw error
    }
  }

  /**
   * Get users by role
   * Excludes walk-in customers
   */
  static async getUsersByRole(roleName: string): Promise<User[]> {
    try {
      const response: AxiosResponse<User[]> = await apiClient.get(`/users/role/${roleName}`)
      // Filter out walk-in customers
      const filteredUsers = response.data.filter(user => !user.email.startsWith('walkin_'))
      return filteredUsers
    } catch (error) {
      console.error(`Error fetching users with role ${roleName}:`, error)
      throw error
    }
  }

  /**
   * Get active users only
   * Excludes walk-in customers
   */
  static async getActiveUsers(): Promise<User[]> {
    try {
      const response: AxiosResponse<User[]> = await apiClient.get('/users/active')
      // Filter out walk-in customers
      const filteredUsers = response.data.filter(user => !user.email.startsWith('walkin_'))
      return filteredUsers
    } catch (error) {
      console.error('Error fetching active users:', error)
      throw error
    }
  }

  /**
   * Create a new user
   * Prevents creating users with walk-in email patterns
   */
  static async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      // Prevent creating users with walk-in email patterns
      if (this.isWalkInCustomerEmail(userData.email)) {
        throw new Error('Email addresses starting with "walkin_" are reserved for system use')
      }

      const response: AxiosResponse<User> = await apiClient.post('/users', userData)
      return response.data
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  /**
   * Update an existing user
   * Prevents updating walk-in customers
   */
  static async updateUser(id: number, userData: UpdateUserRequest): Promise<User> {
    try {
      // First check if the user is a walk-in customer
      const existingUser = await this.getUserById(id)
      if (this.isWalkInCustomer(existingUser)) {
        throw new Error('Walk-in customers cannot be updated through the admin panel')
      }

      const response: AxiosResponse<User> = await apiClient.put(`/users/${id}`, userData)
      return response.data
    } catch (error) {
      console.error(`Error updating user with ID ${id}:`, error)
      throw error
    }
  }

  /**
   * Delete a user
   * Prevents deleting walk-in customers
   */
  static async deleteUser(id: number): Promise<void> {
    try {
      // First check if the user is a walk-in customer
      const existingUser = await this.getUserById(id)
      if (this.isWalkInCustomer(existingUser)) {
        throw new Error('Walk-in customers cannot be deleted through the admin panel')
      }

      await apiClient.delete(`/users/${id}`)
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error)
      throw error
    }
  }

  /**
   * Activate a user
   * Prevents activating walk-in customers
   */
  static async activateUser(id: number): Promise<void> {
    try {
      // First check if the user is a walk-in customer
      const existingUser = await this.getUserById(id)
      if (this.isWalkInCustomer(existingUser)) {
        throw new Error('Walk-in customer status cannot be modified through the admin panel')
      }

      await apiClient.patch(`/users/${id}/activate`)
    } catch (error) {
      console.error(`Error activating user with ID ${id}:`, error)
      throw error
    }
  }

  /**
   * Deactivate a user
   * Prevents deactivating walk-in customers
   */
  static async deactivateUser(id: number): Promise<void> {
    try {
      // First check if the user is a walk-in customer
      const existingUser = await this.getUserById(id)
      if (this.isWalkInCustomer(existingUser)) {
        throw new Error('Walk-in customer status cannot be modified through the admin panel')
      }

      await apiClient.patch(`/users/${id}/deactivate`)
    } catch (error) {
      console.error(`Error deactivating user with ID ${id}:`, error)
      throw error
    }
  }

  /**
   * Check if username is available
   */
  static async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const response: AxiosResponse<boolean> = await apiClient.get(`/users/check-username/${username}`)
      return response.data
    } catch (error) {
      console.error(`Error checking username availability for ${username}:`, error)
      throw error
    }
  }

  /**
   * Check if email is available
   */
  static async isEmailAvailable(email: string): Promise<boolean> {
    try {
      const response: AxiosResponse<boolean> = await apiClient.get(`/users/check-email/${email}`)
      return response.data
    } catch (error) {
      console.error(`Error checking email availability for ${email}:`, error)
      throw error
    }
  }

  /**
   * Get user statistics for dashboard
   * Excludes walk-in customers from statistics
   */
  static async getUserStats(): Promise<UserStats> {
    try {
      const users = await this.getAllUsers() // This already filters out walk-in customers
      
      const stats: UserStats = {
        totalUsers: users.length,
        activeUsers: users.filter(user => user.isActive).length,
        inactiveUsers: users.filter(user => !user.isActive).length,
        adminUsers: users.filter(user => user.role.name === 'ADMIN').length,
        pharmacistUsers: users.filter(user => user.role.name === 'PHARMACIST').length,
        customerUsers: users.filter(user => user.role.name === 'CUSTOMER').length,
        recentLogins: users.filter(user => {
          try {
            // Use updatedAt as a proxy for recent activity since we don't have lastLogin field
            const lastActivity = this.convertJavaDateArrayToDate(user.updatedAt)
            const today = new Date()
            
            // Check if the date is valid
            if (isNaN(lastActivity.getTime())) {
              return false
            }
            
            const diffTime = Math.abs(today.getTime() - lastActivity.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            return diffDays <= 7
          } catch (error) {
            console.error('Error parsing date for user:', user.id, error)
            return false
          }
        }).length
      }
      
      return stats
    } catch (error) {
      console.error('Error calculating user statistics:', error)
      throw error
    }
  }

  /**
   * Search users by term (name, email, username)
   * Excludes walk-in customers from search results
   */
  static async searchUsers(searchTerm: string): Promise<User[]> {
    try {
      const users = await this.getAllUsers() // This already filters out walk-in customers
      
      if (!searchTerm.trim()) {
        return users
      }
      
      const term = searchTerm.toLowerCase()
      
      return users.filter(user => 
        user.firstName.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(term)
      )
    } catch (error) {
      console.error('Error searching users:', error)
      throw error
    }
  }

  /**
   * Filter users by multiple criteria
   */
  static async filterUsers(
    users: User[],
    filters: {
      role?: string
      status?: string
      searchTerm?: string
    }
  ): Promise<User[]> {
    try {
      let filtered = [...users]

      // Filter by search term
      if (filters.searchTerm?.trim()) {
        const term = filters.searchTerm.toLowerCase()
        filtered = filtered.filter(user => 
          user.firstName.toLowerCase().includes(term) ||
          user.lastName.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.username.toLowerCase().includes(term) ||
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(term)
        )
      }

      // Filter by role
      if (filters.role && filters.role !== 'all') {
        filtered = filtered.filter(user => user.role.name === filters.role)
      }

      // Filter by status
      if (filters.status && filters.status !== 'all') {
        const isActive = filters.status === 'Active'
        filtered = filtered.filter(user => user.isActive === isActive)
      }

      return filtered
    } catch (error) {
      console.error('Error filtering users:', error)
      throw error
    }
  }
}

export default UserService
