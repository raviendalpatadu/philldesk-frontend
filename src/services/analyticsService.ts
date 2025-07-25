/**
 * Analytics Service
 * 
 * This service handles all analytics and dashboard-related API calls
 * for fetching statistics, metrics, and dashboard data.
 */

import { api } from '../config'

// ============================================================================
// Types and Interfaces
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

export interface InventoryStats {
  totalItems: number
  inStock: number
  lowStock: number
  outOfStock: number
  totalValue: number
  suppliersCount: number
}

export interface RevenueStats {
  totalRevenue: number
  dailyRevenue: number
  weeklyRevenue: number
  monthlyRevenue: number
  yearlyRevenue: number
}

export interface TopMedication {
  id: number
  name: string
  sales: number
  revenue: string
  trend: string
}

export interface SystemAlerts {
  lowStockMedicines: Medicine[]
  pendingPrescriptions: Prescription[]
  pendingBills: Bill[]
}

export interface Medicine {
  id: number
  name: string
  quantity: number
  reorderLevel: number
  category?: string
  manufacturer?: string
}

export interface Prescription {
  id: number
  prescriptionNumber: string
  patientName: string
  doctorName: string
  status: string
  createdAt: string
}

export interface Bill {
  id: number
  billNumber: string
  customerName: string
  totalAmount: number
  paymentStatus: string
  createdAt: string
}

export interface AnalyticsResponse<T> {
  success: boolean
  message: string
  data: T
}

// ============================================================================
// Analytics Service Class
// ============================================================================

class AnalyticsService {
  private readonly baseUrl = '/dashboard'
  private readonly adminUrl = '/admin'
  private readonly analyticsUrl = '/analytics'

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await api.get<AnalyticsResponse<DashboardStats>>(`${this.baseUrl}/stats`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw new Error('Failed to fetch dashboard statistics')
    }
  }

  /**
   * Get analytics overview from the new analytics controller
   */
  async getAnalyticsOverview(): Promise<any> {
    try {
      const response = await api.get<AnalyticsResponse<any>>(`${this.analyticsUrl}/overview`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching analytics overview:', error)
      throw new Error('Failed to fetch analytics overview')
    }
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStats(): Promise<InventoryStats> {
    try {
      const response = await api.get<InventoryStats>(`${this.adminUrl}/inventory/stats`)
      return response.data
    } catch (error) {
      console.error('Error fetching inventory stats:', error)
      throw new Error('Failed to fetch inventory statistics')
    }
  }

  /**
   * Get revenue statistics for a date range
   */
  async getRevenueStats(startDate: string, endDate: string): Promise<RevenueStats> {
    try {
      const response = await api.get<AnalyticsResponse<RevenueStats>>(
        `${this.baseUrl}/revenue`, 
        {
          params: { startDate, endDate }
        }
      )
      return response.data.data
    } catch (error) {
      console.error('Error fetching revenue stats:', error)
      throw new Error('Failed to fetch revenue statistics')
    }
  }

  /**
   * Get system alerts (low stock, pending items, etc.)
   */
  async getSystemAlerts(): Promise<SystemAlerts> {
    try {
      const response = await api.get<AnalyticsResponse<SystemAlerts>>(`${this.baseUrl}/alerts`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching system alerts:', error)
      throw new Error('Failed to fetch system alerts')
    }
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(): Promise<any> {
    try {
      const response = await api.get<AnalyticsResponse<any>>(`${this.baseUrl}/summary`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching dashboard summary:', error)
      throw new Error('Failed to fetch dashboard summary')
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(): Promise<any> {
    try {
      const response = await api.get<AnalyticsResponse<any>>(`${this.baseUrl}/recent-activity`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      throw new Error('Failed to fetch recent activity')
    }
  }

  /**
   * Get top selling medications
   */
  async getTopMedications(): Promise<TopMedication[]> {
    try {
      const response = await api.get<AnalyticsResponse<TopMedication[]>>(`${this.analyticsUrl}/top-medications?limit=10`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching top medications:', error)
      // Return mock data as fallback
      const mockData: TopMedication[] = [
        {
          id: 1,
          name: 'Paracetamol 500mg',
          sales: 245,
          revenue: '$1,225.00',
          trend: '+12%'
        },
        {
          id: 2,
          name: 'Amoxicillin 250mg',
          sales: 189,
          revenue: '$945.00',
          trend: '+8%'
        },
        {
          id: 3,
          name: 'Insulin Pen',
          sales: 87,
          revenue: '$2,175.00',
          trend: '+15%'
        },
        {
          id: 4,
          name: 'Lisinopril 10mg',
          sales: 156,
          revenue: '$780.00',
          trend: '+5%'
        }
      ]
      return mockData
    }
  }

  /**
   * Get user distribution statistics
   */
  async getUserDistribution(): Promise<{ customers: number; pharmacists: number; activeUsersPercentage: number }> {
    try {
      const analyticsOverview = await this.getAnalyticsOverview()
      const dashboardStats = await this.getDashboardStats()
      
      // Calculate user distribution from analytics data
      const totalUsers = analyticsOverview.totalUsers || dashboardStats.totalUsers || 0
      const activeUsers = analyticsOverview.activeUsers || dashboardStats.activeUsers || 0
      
      return {
        customers: Math.max(0, totalUsers - 12), // Assuming 12 pharmacists (mock)
        pharmacists: 12, // Mock value for now - in real scenario, you'd filter by role
        activeUsersPercentage: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
      }
    } catch (error) {
      console.error('Error fetching user distribution:', error)
      throw new Error('Failed to fetch user distribution')
    }
  }

  /**
   * Get inventory status breakdown
   */
  async getInventoryStatus(): Promise<{ inStock: number; lowStock: number; outOfStock: number }> {
    try {
      const response = await api.get<AnalyticsResponse<any>>(`${this.analyticsUrl}/inventory`)
      const data = response.data.data
      
      return {
        inStock: data.inStockPercentage || 0,
        lowStock: data.lowStockPercentage || 0,
        outOfStock: data.outOfStockPercentage || 0
      }
    } catch (error) {
      console.error('Error fetching inventory status:', error)
      // Fallback to admin endpoint
      try {
        const inventoryStats = await this.getInventoryStats()
        const total = inventoryStats.totalItems || 1
        
        return {
          inStock: Math.round((inventoryStats.inStock / total) * 100),
          lowStock: Math.round((inventoryStats.lowStock / total) * 100),
          outOfStock: Math.round((inventoryStats.outOfStock / total) * 100)
        }
      } catch (fallbackError) {
        console.error('Error fetching inventory status fallback:', fallbackError)
        throw new Error('Failed to fetch inventory status')
      }
    }
  }

  /**
   * Get sales analytics for a specific period
   */
  async getSalesAnalytics(startDate: string, endDate: string): Promise<any> {
    try {
      const response = await api.get<AnalyticsResponse<any>>(
        `${this.analyticsUrl}/sales`,
        {
          params: { startDate, endDate }
        }
      )
      return response.data.data
    } catch (error) {
      console.error('Error fetching sales analytics:', error)
      throw new Error('Failed to fetch sales analytics')
    }
  }

  /**
   * Get prescription analytics
   */
  async getPrescriptionAnalytics(): Promise<any> {
    try {
      const response = await api.get<AnalyticsResponse<any>>(`${this.analyticsUrl}/prescriptions`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching prescription analytics:', error)
      throw new Error('Failed to fetch prescription analytics')
    }
  }

  /**
   * Get unread notifications count for a user
   */
  async getUnreadNotificationsCount(userId: number): Promise<number> {
    try {
      const response = await api.get<AnalyticsResponse<number>>(`${this.baseUrl}/user/${userId}/notifications/unread-count`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching unread notifications count:', error)
      return 0 // Return 0 on error to prevent UI issues
    }
  }

  /**
   * Get medicines expiring within specified days
   */
  async getExpiringMedicines(days: number = 30): Promise<Medicine[]> {
    try {
      const response = await api.get<AnalyticsResponse<Medicine[]>>(`${this.baseUrl}/medicines/expiring?days=${days}`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching expiring medicines:', error)
      throw new Error('Failed to fetch expiring medicines')
    }
  }
}

// ============================================================================
// Export Service Instance
// ============================================================================

export const analyticsService = new AnalyticsService()
export default analyticsService
