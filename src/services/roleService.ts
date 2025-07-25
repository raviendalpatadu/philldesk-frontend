/**
 * Role Service
 * 
 * This service handles role-related API calls for user management
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

// ============================================================================
// Type Definitions
// ============================================================================

export interface Role {
  id: number
  name: 'ADMIN' | 'PHARMACIST' | 'CUSTOMER'
  description: string
}

// ============================================================================
// API Service Functions
// ============================================================================

export class RoleService {
  
  /**
   * Get all roles
   */
  static async getAllRoles(): Promise<Role[]> {
    try {
      const response: AxiosResponse<Role[]> = await apiClient.get('/roles')
      return response.data
    } catch (error) {
      console.error('Error fetching roles:', error)
      throw error
    }
  }

  /**
   * Get role by ID
   */
  static async getRoleById(id: number): Promise<Role> {
    try {
      const response: AxiosResponse<Role> = await apiClient.get(`/roles/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching role with ID ${id}:`, error)
      throw error
    }
  }

  /**
   * Get role by name
   */
  static async getRoleByName(name: string): Promise<Role> {
    try {
      const response: AxiosResponse<Role> = await apiClient.get(`/roles/name/${name}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching role with name ${name}:`, error)
      throw error
    }
  }
}

export default RoleService
