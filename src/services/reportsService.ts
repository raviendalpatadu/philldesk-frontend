import { api } from '../config'

// Utility function to convert Java LocalDateTime array to Date string
const convertJavaDateArrayToDate = (dateArray: any): string => {
  if (Array.isArray(dateArray) && dateArray.length >= 3) {
    // Java LocalDateTime array format [year, month, day, hour, minute, second, nanosecond]
    const [year, month, day] = dateArray
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  } else if (typeof dateArray === 'string') {
    // ISO string format
    return new Date(dateArray).toISOString().split('T')[0]
  } else {
    // Fallback to current date
    console.warn('Unknown date format:', dateArray)
    return new Date().toISOString().split('T')[0]
  }
}

export interface SalesReportData {
  date: string
  invoices: number
  revenue: number
  prescriptions: number
  otc: number
  averageValue: number
}

export interface InventoryReportData {
  category: string
  totalItems: number
  totalValue: number
  lowStock: number
  expiringSoon: number
  turnoverRate: number
}

export interface UserActivityData {
  role: string
  activeUsers: number
  totalUsers: number
  avgSessionTime: string
  prescriptionsProcessed: number
  efficiency: number
}

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

export interface InventoryStats {
  totalItems: number
  inStock: number
  lowStock: number
  outOfStock: number
  totalValue: number
  suppliersCount: number
}

export interface SystemAlerts {
  lowStockMedicines: any[]
  pendingPrescriptions: any[]
  pendingBills: any[]
}

const reportsService = {
  // Dashboard Statistics
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/dashboard/stats')
    return response.data.data
  },

  // Revenue and Sales Reports
  async getRevenueStats(startDate: string, endDate: string): Promise<RevenueStats> {
    const response = await api.get('/dashboard/revenue', {
      params: { startDate, endDate }
    })
    return response.data.data
  },

  async getTotalRevenue(startDate: string, endDate: string): Promise<number> {
    const response = await api.get('/bills/revenue', {
      params: { startDate, endDate }
    })
    return response.data
  },

  async getBillsByDateRange(startDate: string, endDate: string): Promise<any[]> {
    const response = await api.get('/bills/date-range', {
      params: { startDate, endDate }
    })
    return response.data
  },

  async getPaidBills(): Promise<any[]> {
    const response = await api.get('/bills/paid')
    return response.data
  },

  async getPendingBills(): Promise<any[]> {
    const response = await api.get('/bills/pending')
    return response.data
  },

  // Inventory Reports
  async getInventoryStats(): Promise<InventoryStats> {
    const response = await api.get('/admin/inventory/stats')
    return response.data
  },

  async getAllMedicines(): Promise<any[]> {
    const response = await api.get('/admin/medicines/all')
    return response.data
  },

  async getLowStockMedicines(threshold: number = 10): Promise<any[]> {
    const response = await api.get('/admin/medicines/low-stock', {
      params: { threshold }
    })
    return response.data
  },

  async getMedicinesByCategory(category: string): Promise<any[]> {
    const response = await api.get(`/admin/medicines/category/${category}`)
    return response.data
  },

  // User Activity Reports
  async getAllUsers(): Promise<any[]> {
    const response = await api.get('/users')
    return response.data
  },

  async getActiveUsers(): Promise<any[]> {
    const response = await api.get('/users/active')
    return response.data
  },

  async getUsersByRole(role: string): Promise<any[]> {
    const response = await api.get(`/users/role/${role}`)
    return response.data
  },

  // System Alerts
  async getSystemAlerts(): Promise<SystemAlerts> {
    const response = await api.get('/dashboard/alerts')
    return response.data.data
  },

  // Recent Activity
  async getRecentActivity(): Promise<any> {
    const response = await api.get('/dashboard/recent-activity')
    return response.data.data
  },

  // Prescription Reports
  async getPendingPrescriptions(): Promise<any[]> {
    const response = await api.get('/prescriptions/status/PENDING')
    return response.data
  },

  async getProcessingPrescriptions(): Promise<any[]> {
    const response = await api.get('/prescriptions/status/PROCESSING')
    return response.data
  },

  async getCompletedPrescriptions(): Promise<any[]> {
    const response = await api.get('/prescriptions/status/COMPLETED')
    return response.data
  },

  async getPrescriptionsByDateRange(startDate: string, endDate: string): Promise<any[]> {
    const response = await api.get('/prescriptions/date-range', {
      params: { startDate, endDate }
    })
    return response.data
  },

  // Utility Functions for Report Generation
  async generateSalesReport(startDate: string, endDate: string): Promise<SalesReportData[]> {
    try {
      console.log(`Generating sales report for date range: ${startDate} to ${endDate}`)
      
      // Get bills for the date range
      const bills = await this.getBillsByDateRange(startDate, endDate)
      console.log(`Retrieved ${bills.length} bills from API`)
      
      if (bills.length > 0) {
        console.log('Sample bill data:', bills[0])
        console.log('Bill createdAt field:', bills[0].createdAt)
        console.log('Bill note field:', bills[0].note)
        console.log('Is OTC (note starts with "Manual billing"):', bills[0].note?.startsWith('Manual billing'))
      }
      
      // Group bills by date
      const salesByDate = new Map<string, {
        invoices: number
        revenue: number
        prescriptions: number
        otc: number
        amounts: number[]
      }>()

      bills.forEach((bill: any) => {
        let billDate: string
        
        try {
          billDate = convertJavaDateArrayToDate(bill.createdAt)
        } catch (error) {
          console.error('Error parsing bill date:', error, bill.createdAt)
          billDate = new Date().toISOString().split('T')[0]
        }
        
        const current = salesByDate.get(billDate) || {
          invoices: 0,
          revenue: 0,
          prescriptions: 0,
          otc: 0,
          amounts: []
        }

        current.invoices++
        current.revenue += parseFloat(bill.totalAmount)
        current.amounts.push(parseFloat(bill.totalAmount))
        
        // Check if bill is OTC by looking at the note field
        const isOTC = bill.notes && bill.notes.startsWith('Manual billing')
        if (isOTC) {
          current.otc++
          console.log(`Bill ${bill.id} classified as OTC (note: "${bill.notes}")`)
        } else {
          current.prescriptions++
          console.log(`Bill ${bill.id} classified as Prescription (note: "${bill.notes}")`)
        }

        salesByDate.set(billDate, current)
      })

      // Convert to array format
      const salesReport: SalesReportData[] = Array.from(salesByDate.entries()).map(([date, data]) => ({
        date,
        invoices: data.invoices,
        revenue: data.revenue,
        prescriptions: data.prescriptions,
        otc: data.otc,
        averageValue: data.amounts.length > 0 ? data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length : 0 // Would need additional API to get top medicine per day
      }))

      console.log(`Generated sales report with ${salesReport.length} days of data`)
      return salesReport.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } catch (error) {
      console.error('Error generating sales report:', error)
      return []
    }
  },

  async generateInventoryReport(): Promise<InventoryReportData[]> {
    try {
      const medicines = await this.getAllMedicines()
      
      // Group medicines by category
      const categoriesMap = new Map<string, {
        totalItems: number
        totalValue: number
        lowStock: number
        expiringSoon: number
        medicines: any[]
      }>()

      medicines.forEach((medicine: any) => {
        const category = medicine.category || 'Uncategorized'
        const current = categoriesMap.get(category) || {
          totalItems: 0,
          totalValue: 0,
          lowStock: 0,
          expiringSoon: 0,
          medicines: []
        }

        current.totalItems++
        current.totalValue += parseFloat(medicine.unitPrice) * medicine.quantity
        current.medicines.push(medicine)
        
        if (medicine.quantity <= medicine.reorderLevel) {
          current.lowStock++
        }

        // Check for expiring soon (this would need additional logic for expiry dates)
        // For now, we'll use a placeholder
        if (medicine.quantity > 0 && medicine.quantity <= 5) {
          current.expiringSoon++
        }

        categoriesMap.set(category, current)
      })

      // Convert to array format
      const inventoryReport: InventoryReportData[] = Array.from(categoriesMap.entries()).map(([category, data]) => ({
        category,
        totalItems: data.totalItems,
        totalValue: data.totalValue,
        lowStock: data.lowStock,
        expiringSoon: data.expiringSoon,
        turnoverRate: Math.min(95, Math.max(60, 80 + Math.random() * 20)) // Placeholder calculation
      }))

      return inventoryReport.sort((a, b) => b.totalValue - a.totalValue)
    } catch (error) {
      console.error('Error generating inventory report:', error)
      return []
    }
  },

  async generateUserActivityReport(): Promise<UserActivityData[]> {
    try {
      const allUsers = await this.getAllUsers()
      
      // Group users by role
      const roleStats = new Map<string, {
        total: number
        active: number
        prescriptionsProcessed: number
      }>()

      allUsers.forEach((user: any) => {
        const role = user.role?.name || 'UNKNOWN'
        const current = roleStats.get(role) || {
          total: 0,
          active: 0,
          prescriptionsProcessed: 0
        }

        current.total++
        if (user.isActive) {
          current.active++
        }

        // Add prescription count if available
        if (user.handledPrescriptions) {
          current.prescriptionsProcessed += user.handledPrescriptions.length || 0
        }

        roleStats.set(role, current)
      })

      // Convert to array format
      const userActivityReport: UserActivityData[] = Array.from(roleStats.entries()).map(([role, data]) => ({
        role,
        activeUsers: data.active,
        totalUsers: data.total,
        avgSessionTime: this.generateMockSessionTime(role),
        prescriptionsProcessed: data.prescriptionsProcessed,
        efficiency: Math.min(100, Math.max(70, 85 + Math.random() * 15)) // Placeholder calculation
      }))

      return userActivityReport
    } catch (error) {
      console.error('Error generating user activity report:', error)
      return []
    }
  },

  // Helper method for generating mock session times
  generateMockSessionTime(role: string): string {
    const baseTimes = {
      'ADMIN': 120, // 2 hours
      'PHARMACIST': 270, // 4.5 hours
      'CUSTOMER': 15 // 15 minutes
    }
    
    const baseTime = baseTimes[role as keyof typeof baseTimes] || 60
    const variation = Math.random() * 30 - 15 // ±15 minutes
    const totalMinutes = Math.max(5, baseTime + variation)
    
    const hours = Math.floor(totalMinutes / 60)
    const minutes = Math.round(totalMinutes % 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  },

  // PDF Generation Methods
  
  /**
   * Download PDF report with all data
   */
  async downloadPdfReport(reportData: {
    title: string
    startDate: string
    endDate: string
    summaryStats: any
    salesData: SalesReportData[]
    inventoryData: InventoryReportData[]
    userActivityData: UserActivityData[]
  }): Promise<Blob> {
    try {
      console.log('Downloading PDF report...')
      const response = await api.post('/reports/download/pdf', reportData, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf'
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Error downloading PDF report:', error)
      throw new Error('Failed to download PDF report')
    }
  },

  /**
   * Download sales report PDF
   */
  async downloadSalesReportPdf(startDate: string, endDate: string, salesData: SalesReportData[], summaryStats: any): Promise<Blob> {
    try {
      console.log('Downloading sales report PDF...')
      const response = await api.post(`/reports/sales/pdf?startDate=${startDate}&endDate=${endDate}`, {
        salesData,
        summaryStats
      }, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf'
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Error downloading sales report PDF:', error)
      throw new Error('Failed to download sales report PDF')
    }
  },

  /**
   * Download inventory report PDF
   */
  async downloadInventoryReportPdf(inventoryData: InventoryReportData[], summaryStats: any): Promise<Blob> {
    try {
      console.log('Downloading inventory report PDF...')
      const response = await api.post('/reports/inventory/pdf', {
        inventoryData,
        summaryStats
      }, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf'
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Error downloading inventory report PDF:', error)
      throw new Error('Failed to download inventory report PDF')
    }
  },

  /**
   * Download user activity report PDF
   */
  async downloadUserActivityReportPdf(userActivityData: UserActivityData[]): Promise<Blob> {
    try {
      console.log('Downloading user activity report PDF...')
      const response = await api.post('/reports/user-activity/pdf', {
        userActivityData
      }, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf'
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Error downloading user activity report PDF:', error)
      throw new Error('Failed to download user activity report PDF')
    }
  }
}

export default reportsService
