/**
 * Dashboard Service
 * 
 * This service handles all dashboard-related API calls for retrieving
 * system statistics, alerts, and activity data.
 */

import { AxiosResponse } from 'axios'
import { api } from '../config'

// ============================================================================
// Dashboard API Methods
// ============================================================================

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalMedicines: number
  availableMedicines: number
  lowStockMedicines: number
  pendingPrescriptions: number
  processingPrescriptions: number
  completedPrescriptions: number
  pendingBills: number
  paidBills: number
}

export interface RevenueStats {
  totalRevenue: number
  totalBills: number
  averageOrderValue: number
  startDate: string
  endDate: string
}

export interface SystemAlerts {
  lowStockMedicines: Medicine[]
  pendingPrescriptions: Prescription[]
  pendingBills: Bill[]
}

export interface RecentActivity {
  recentPrescriptions: Prescription[]
  recentBills: Bill[]
  period: string
}

export interface DashboardSummary {
  totalMedicines: number
  pendingPrescriptions: number
  lowStockAlerts: number
  activeUsers: number
  todayRevenue: number
}

// Basic entity interfaces for dashboard
export interface Medicine {
  id: number
  name: string
  genericName?: string
  manufacturer?: string
  category?: string
  strength?: string
  quantity: number
  unitPrice: number
  expiryDate?: string
  threshold?: number
}

export interface Prescription {
  id: number
  customerName: string
  fileName: string
  status: string
  uploadedAt: string
  totalAmount?: number
}

export interface Bill {
  id: number
  prescriptionId?: number
  customerName: string
  totalAmount: number
  status: string
  createdAt: string
}

// Backend API response wrapper
interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

class DashboardService {
  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response: AxiosResponse<ApiResponse<DashboardStats>> = await api.get('/dashboard/stats')
      return response.data.data
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw error
    }
  }

  /**
   * Get revenue statistics for a date range
   */
  async getRevenueStats(startDate: string, endDate: string): Promise<RevenueStats> {
    try {
      const response: AxiosResponse<ApiResponse<RevenueStats>> = await api.get('/dashboard/revenue', {
        params: { startDate, endDate }
      })
      return response.data.data
    } catch (error) {
      console.error('Error fetching revenue stats:', error)
      throw error
    }
  }

  /**
   * Get system alerts (low stock, pending items, etc.)
   */
  async getSystemAlerts(): Promise<SystemAlerts> {
    try {
      const response: AxiosResponse<ApiResponse<SystemAlerts>> = await api.get('/dashboard/alerts')
      return response.data.data
    } catch (error) {
      console.error('Error fetching system alerts:', error)
      throw error
    }
  }

  /**
   * Get recent system activity
   */
  async getRecentActivity(): Promise<RecentActivity> {
    try {
      const response: AxiosResponse<ApiResponse<RecentActivity>> = await api.get('/dashboard/recent-activity')
      return response.data.data
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      throw error
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadNotificationCount(userId: number): Promise<number> {
    try {
      const response: AxiosResponse<ApiResponse<number>> = await api.get(`/dashboard/user/${userId}/notifications/unread-count`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching unread notification count:', error)
      throw error
    }
  }

  /**
   * Get medicines expiring within specified days
   */
  async getExpiringMedicines(days: number = 30): Promise<Medicine[]> {
    try {
      const response: AxiosResponse<ApiResponse<Medicine[]>> = await api.get('/dashboard/medicines/expiring', {
        params: { days }
      })
      return response.data.data
    } catch (error) {
      console.error('Error fetching expiring medicines:', error)
      throw error
    }
  }

  /**
   * Get dashboard summary (quick overview)
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const response: AxiosResponse<ApiResponse<DashboardSummary>> = await api.get('/dashboard/summary')
      return response.data.data
    } catch (error) {
      console.error('Error fetching dashboard summary:', error)
      throw error
    }
  }

  /**
   * Get monthly revenue for current month
   */
  async getMonthlyRevenue(): Promise<number> {
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      const revenueStats = await this.getRevenueStats(
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0]
      )
      
      return revenueStats.totalRevenue
    } catch (error) {
      console.error('Error fetching monthly revenue:', error)
      throw error
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService()
export default dashboardService
