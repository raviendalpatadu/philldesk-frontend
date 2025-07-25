/**
 * Admin Service
 * 
 * This service handles all admin-specific API calls including inventory management,
 * user management, and system administration functions.
 */

import { api } from '../config'

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface Medicine {
  id?: number
  name: string
  genericName?: string
  manufacturer?: string
  category?: string
  dosageForm?: string
  strength?: string
  quantity: number
  unitPrice: number
  costPrice?: number
  expiryDate?: string
  batchNumber?: string
  reorderLevel: number
  description?: string
  isPrescriptionRequired: boolean
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface MedicineFormData {
  name: string
  genericName: string
  manufacturer: string
  category: string
  dosageForm: string
  strength: string
  quantity: number
  unitPrice: number
  costPrice: number
  expiryDate: string
  batchNumber: string
  reorderLevel: number
  description: string
  isPrescriptionRequired: boolean
  isActive: boolean
}

export interface InventoryStats {
  totalItems: number
  inStock: number
  lowStock: number
  outOfStock: number
  totalValue: number
  expiringItems: number
  expiredItems: number
  suppliersCount: number
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

// ============================================================================
// Admin Service Class
// ============================================================================

class AdminService {
  
  // ========================================
  // Medicine/Inventory Management
  // ========================================

  /**
   * Get all medicines with pagination and sorting
   */
  async getMedicines(
    page: number = 0,
    size: number = 10,
    sortBy: string = 'name',
    sortDir: string = 'asc'
  ): Promise<PaginatedResponse<Medicine>> {
    try {
      const response = await api.get('/admin/medicines', {
        params: { page, size, sortBy, sortDir }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching medicines:', error)
      throw new Error('Failed to fetch medicines')
    }
  }

  /**
   * Get all medicines (non-paginated)
   */
  async getAllMedicines(): Promise<Medicine[]> {
    try {
      const response = await api.get('/admin/medicines/all')
      return response.data
    } catch (error) {
      console.error('Error fetching all medicines:', error)
      throw new Error('Failed to fetch medicines')
    }
  }

  /**
   * Get medicine by ID
   */
  async getMedicineById(id: number): Promise<Medicine> {
    try {
      const response = await api.get(`/medicines/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching medicine:', error)
      throw new Error('Failed to fetch medicine')
    }
  }

  /**
   * Create new medicine
   */
  async createMedicine(medicine: MedicineFormData): Promise<Medicine> {
    try {
      const response = await api.post('/admin/medicines', medicine)
      return response.data.medicine
    } catch (error: any) {
      console.error('Error creating medicine:', error)
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.error || 'Medicine already exists'
        throw new Error(errorMessage)
      }
      throw new Error('Failed to create medicine')
    }
  }

  /**
   * Update existing medicine
   */
  async updateMedicine(id: number, medicine: MedicineFormData): Promise<Medicine> {
    try {
      const response = await api.put(`/admin/medicines/${id}`, medicine)
      return response.data.medicine
    } catch (error) {
      console.error('Error updating medicine:', error)
      throw new Error('Failed to update medicine')
    }
  }

  /**
   * Delete medicine
   */
  async deleteMedicine(id: number): Promise<void> {
    try {
      await api.delete(`/admin/medicines/${id}`)
    } catch (error) {
      console.error('Error deleting medicine:', error)
      throw new Error('Failed to delete medicine')
    }
  }

  /**
   * Update medicine stock
   */
  async updateMedicineStock(id: number, quantity: number): Promise<void> {
    try {
      await api.patch(`/admin/medicines/${id}/stock`, null, {
        params: { quantity, operation: 'set' }
      })
    } catch (error) {
      console.error('Error updating stock:', error)
      throw new Error('Failed to update stock')
    }
  }

  /**
   * Increase medicine stock
   */
  async increaseMedicineStock(id: number, quantity: number): Promise<void> {
    try {
      await api.patch(`/admin/medicines/${id}/stock`, null, {
        params: { quantity, operation: 'increase' }
      })
    } catch (error) {
      console.error('Error increasing stock:', error)
      throw new Error('Failed to increase stock')
    }
  }

  /**
   * Decrease medicine stock
   */
  async decreaseMedicineStock(id: number, quantity: number): Promise<void> {
    try {
      await api.patch(`/admin/medicines/${id}/stock`, null, {
        params: { quantity, operation: 'decrease' }
      })
    } catch (error) {
      console.error('Error decreasing stock:', error)
      throw new Error('Failed to decrease stock')
    }
  }

  /**
   * Search medicines
   */
  async searchMedicines(searchTerm: string): Promise<Medicine[]> {
    try {
      const response = await api.get('/admin/medicines/search', {
        params: { searchTerm }
      })
      return response.data
    } catch (error) {
      console.error('Error searching medicines:', error)
      throw new Error('Failed to search medicines')
    }
  }

  /**
   * Get medicines by category
   */
  async getMedicinesByCategory(category: string): Promise<Medicine[]> {
    try {
      const response = await api.get(`/admin/medicines/category/${category}`)
      return response.data
    } catch (error) {
      console.error('Error fetching medicines by category:', error)
      throw new Error('Failed to fetch medicines by category')
    }
  }

  /**
   * Get low stock medicines
   */
  async getLowStockMedicines(threshold: number = 10): Promise<Medicine[]> {
    try {
      const response = await api.get('/admin/medicines/low-stock', {
        params: { threshold }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching low stock medicines:', error)
      throw new Error('Failed to fetch low stock medicines')
    }
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStats(): Promise<InventoryStats> {
    try {
      const response = await api.get('/admin/inventory/stats')
      return response.data
    } catch (error) {
      console.error('Error fetching inventory stats:', error)
      throw new Error('Failed to fetch inventory statistics')
    }
  }

  /**
   * Get system overview
   */
  async getSystemOverview(): Promise<any> {
    try {
      const response = await api.get('/admin/system/overview')
      return response.data
    } catch (error) {
      console.error('Error fetching system overview:', error)
      throw new Error('Failed to fetch system overview')
    }
  }

  /**
   * Check medicine availability
   */
  async checkMedicineAvailability(id: number, quantity: number): Promise<boolean> {
    try {
      const response = await api.get(`/medicines/${id}/availability`, {
        params: { quantity }
      })
      return response.data
    } catch (error) {
      console.error('Error checking availability:', error)
      throw new Error('Failed to check availability')
    }
  }

  // ========================================
  // Export and Reporting
  // ========================================

  /**
   * Export inventory data
   */
  async exportInventory(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    try {
      const medicines = await this.getAllMedicines()
      
      if (format === 'csv') {
        const csvContent = this.convertToCSV(medicines)
        return new Blob([csvContent], { type: 'text/csv' })
      }
      
      throw new Error('Excel export not implemented yet')
    } catch (error) {
      console.error('Error exporting inventory:', error)
      throw new Error('Failed to export inventory')
    }
  }

  /**
   * Convert medicines data to CSV format
   */
  private convertToCSV(medicines: Medicine[]): string {
    const headers = [
      'ID', 'Name', 'Generic Name', 'Manufacturer', 'Category', 
      'Dosage Form', 'Strength', 'Quantity', 'Unit Price', 'Cost Price',
      'Expiry Date', 'Batch Number', 'Reorder Level', 'Prescription Required',
      'Active', 'Total Value'
    ]
    
    const csvRows = [
      headers.join(','),
      ...medicines.map(medicine => [
        medicine.id || '',
        `"${medicine.name}"`,
        `"${medicine.genericName || ''}"`,
        `"${medicine.manufacturer || ''}"`,
        `"${medicine.category || ''}"`,
        `"${medicine.dosageForm || ''}"`,
        `"${medicine.strength || ''}"`,
        medicine.quantity,
        medicine.unitPrice,
        medicine.costPrice || '',
        medicine.expiryDate || '',
        `"${medicine.batchNumber || ''}"`,
        medicine.reorderLevel,
        medicine.isPrescriptionRequired ? 'Yes' : 'No',
        medicine.isActive ? 'Yes' : 'No',
        (medicine.quantity * medicine.unitPrice).toFixed(2)
      ].join(','))
    ]
    
    return csvRows.join('\n')
  }

  // ========================================
  // Utility Methods
  // ========================================

  /**
   * Get available categories
   */
  async getAvailableCategories(): Promise<string[]> {
    try {
      const medicines = await this.getAllMedicines()
      const categories = [...new Set(medicines.map(m => m.category).filter((cat): cat is string => Boolean(cat)))]
      return categories.sort((a, b) => a.localeCompare(b))
    } catch (error) {
      console.error('Error fetching categories:', error)
      return []
    }
  }

  /**
   * Get available manufacturers
   */
  async getAvailableManufacturers(): Promise<string[]> {
    try {
      const medicines = await this.getAllMedicines()
      const manufacturers = [...new Set(medicines.map(m => m.manufacturer).filter((man): man is string => Boolean(man)))]
      return manufacturers.sort((a, b) => a.localeCompare(b))
    } catch (error) {
      console.error('Error fetching manufacturers:', error)
      return []
    }
  }

  /**
   * Get available dosage forms
   */
  async getAvailableDosageForms(): Promise<string[]> {
    try {
      const medicines = await this.getAllMedicines()
      const dosageForms = [...new Set(medicines.map(m => m.dosageForm).filter((form): form is string => Boolean(form)))]
      return dosageForms.sort((a, b) => a.localeCompare(b))
    } catch (error) {
      console.error('Error fetching dosage forms:', error)
      return []
    }
  }
}

// ============================================================================
// Export Service Instance
// ============================================================================

const adminService = new AdminService()
export default adminService
