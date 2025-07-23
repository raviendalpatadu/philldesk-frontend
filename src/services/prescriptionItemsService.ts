/**
 * Prescription Items Service
 * 
 * Handles prescription items management with auto-suggestions
 */

import { api } from '../config/index'

export interface Medicine {
  id: number
  name: string
  strength: string
  dosageForm: string
  manufacturer: string
  category: string
  unitPrice: number
  quantity: number
  description?: string
  isActive: boolean
  reorderLevel: number
}

export interface PrescriptionItem {
  id?: number
  medicineId: number
  medicine?: Medicine
  quantity: number
  unitPrice: number
  totalPrice: number
  instructions: string
  dosageForm?: string
}

export interface PrescriptionItemDTO {
  medicineId: number
  quantity: number
  unitPrice: number
  instructions: string
}

export interface PrescriptionItemsManager {
  items: PrescriptionItem[]
  subtotal: number
  tax: number
  total: number
}

class PrescriptionItemsService {
  /**
   * Search medicines for auto-suggestions
   */
  async searchMedicines(query: string): Promise<Medicine[]> {
    try {
      if (!query || query.length < 2) {
        return []
      }

      const response = await api.get('/medicines/search/suggestions', {
        params: { query }
      })
      
      return response.data || []
    } catch (error) {
      console.error('Error searching medicines:', error)
      return []
    }
  }

  /**
   * Get all available medicines
   */
  async getAllMedicines(): Promise<Medicine[]> {
    try {
      const response = await api.get('/medicines/available')
      return response.data || []
    } catch (error) {
      console.error('Error fetching medicines:', error)
      throw new Error('Failed to fetch medicines')
    }
  }

  /**
   * Get medicine by ID
   */
  async getMedicineById(id: number): Promise<Medicine | null> {
    try {
      const response = await api.get(`/medicines/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching medicine:', error)
      return null
    }
  }

  /**
   * Get prescription items by prescription ID
   */
  async getPrescriptionItems(prescriptionId: number): Promise<PrescriptionItem[]> {
    try {
      const response = await api.get(`/prescription-items/prescription/${prescriptionId}`)
      return response.data || []
    } catch (error) {
      console.error('Error fetching prescription items:', error)
      return []
    }
  }

  /**
   * Create prescription items in bulk
   */
  async createPrescriptionItems(prescriptionId: number, items: PrescriptionItemDTO[]): Promise<PrescriptionItem[]> {
    try {
      const response = await api.post(`/prescription-items/prescription/${prescriptionId}/bulk`, items)
      return response.data || []
    } catch (error) {
      console.error('Error creating prescription items:', error)
      throw new Error('Failed to create prescription items')
    }
  }

  /**
   * Update prescription items in bulk
   */
  async updatePrescriptionItems(prescriptionId: number, items: PrescriptionItemDTO[]): Promise<PrescriptionItem[]> {
    try {
      const response = await api.put(`/prescription-items/prescription/${prescriptionId}/bulk`, {
        items: items
      })
      return response.data || []
    } catch (error) {
      console.error('Error updating prescription items:', error)
      throw new Error('Failed to update prescription items')
    }
  }

  /**
   * Validate prescription items availability
   */
  async validateAvailability(prescriptionId: number): Promise<PrescriptionItem[]> {
    try {
      const response = await api.get(`/prescription-items/prescription/${prescriptionId}/validate-availability`)
      return response.data || []
    } catch (error) {
      console.error('Error validating availability:', error)
      return []
    }
  }

  /**
   * Calculate prescription total
   */
  async calculateTotal(prescriptionId: number): Promise<number> {
    try {
      const response = await api.get(`/prescription-items/prescription/${prescriptionId}/total`)
      return response.data || 0
    } catch (error) {
      console.error('Error calculating total:', error)
      return 0
    }
  }

  /**
   * Delete prescription item
   */
  async deletePrescriptionItem(itemId: number): Promise<void> {
    try {
      await api.delete(`/prescription-items/${itemId}`)
    } catch (error) {
      console.error('Error deleting prescription item:', error)
      throw new Error('Failed to delete prescription item')
    }
  }

  /**
   * Check medicine availability
   */
  async checkMedicineAvailability(medicineId: number, quantity: number): Promise<boolean> {
    try {
      const response = await api.get(`/medicines/${medicineId}/availability`, {
        params: { quantity }
      })
      return response.data
    } catch (error) {
      console.error('Error checking availability:', error)
      return false
    }
  }

  /**
   * Get medicine categories for filtering
   */
  async getMedicineCategories(): Promise<string[]> {
    try {
      const medicines = await this.getAllMedicines()
      const categories = [...new Set(medicines.map(m => m.category))]
      return categories.filter(Boolean).sort()
    } catch (error) {
      console.error('Error fetching categories:', error)
      return []
    }
  }

  /**
   * Get medicines by category
   */
  async getMedicinesByCategory(category: string): Promise<Medicine[]> {
    try {
      const response = await api.get(`/medicines/category/${category}`)
      return response.data || []
    } catch (error) {
      console.error('Error fetching medicines by category:', error)
      return []
    }
  }

  /**
   * Calculate pricing with tax
   */
  calculatePricing(items: PrescriptionItem[], taxRate: number = 0.1): PrescriptionItemsManager {
    const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
    const tax = subtotal * taxRate
    const total = subtotal + tax

    return {
      items,
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2))
    }
  }

  /**
   * Format medicine display name
   */
  formatMedicineName(medicine: Medicine): string {
    return `${medicine.name} ${medicine.strength} (${medicine.dosageForm})`
  }

  /**
   * Create prescription item from medicine
   */
  createItemFromMedicine(medicine: Medicine, quantity: number = 1, instructions: string = ''): PrescriptionItem {
    return {
      medicineId: medicine.id,
      medicine: medicine,
      quantity: quantity,
      unitPrice: medicine.unitPrice,
      totalPrice: medicine.unitPrice * quantity,
      instructions: instructions,
      dosageForm: medicine.dosageForm
    }
  }

  /**
   * Update item total price
   */
  updateItemTotalPrice(item: PrescriptionItem): PrescriptionItem {
    return {
      ...item,
      totalPrice: (item.unitPrice || 0) * (item.quantity || 1)
    }
  }

  /**
   * Validate prescription item
   */
  validatePrescriptionItem(item: PrescriptionItem): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!item.medicineId) {
      errors.push('Medicine is required')
    }

    if (!item.quantity || item.quantity <= 0) {
      errors.push('Quantity must be greater than 0')
    }

    if (!item.unitPrice || item.unitPrice <= 0) {
      errors.push('Unit price must be greater than 0')
    }

    if (!item.instructions?.trim()) {
      errors.push('Instructions are required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export const prescriptionItemsService = new PrescriptionItemsService()
export default prescriptionItemsService
