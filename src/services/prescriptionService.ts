/**
 * Prescription Service
 * 
 * Handles prescription-related API calls and business logic
 */

import { api } from '@config/index'

export interface PrescriptionMetadata {
  id?: string
  customerId: string
  fileName: string
  fileUrl: string
  fileId: string
  mimeType: string
  size: number
  uploadedAt: string
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'completed'
  notes?: string
  pharmacistId?: string
  reviewedAt?: string
  estimatedCost?: number
  medications?: Array<{
    name: string
    quantity: number
    dosage: string
    instructions: string
  }>
}

export interface CreatePrescriptionData {
  fileName: string
  fileUrl: string
  fileId: string
  mimeType: string
  size: number
  notes?: string
}

class PrescriptionService {
  /**
   * Create prescription metadata in database
   */
  async createPrescription(data: CreatePrescriptionData): Promise<PrescriptionMetadata> {
    try {
      const response = await api.post('/prescriptions', {
        ...data,
        uploadedAt: new Date().toISOString(),
        status: 'pending'
      })
      return response.data
    } catch (error) {
      console.error('Error creating prescription:', error)
      throw new Error('Failed to save prescription metadata')
    }
  }

  /**
   * Get all prescriptions for current user
   */
  async getUserPrescriptions(status?: string): Promise<PrescriptionMetadata[]> {
    try {
      const params = status ? { status } : {}
      const response = await api.get('/prescriptions', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
      throw new Error('Failed to fetch prescriptions')
    }
  }

  /**
   * Get prescription by ID
   */
  async getPrescriptionById(id: string): Promise<PrescriptionMetadata> {
    try {
      const response = await api.get(`/prescriptions/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching prescription:', error)
      throw new Error('Failed to fetch prescription')
    }
  }

  /**
   * Update prescription status
   */
  async updatePrescriptionStatus(
    id: string, 
    status: PrescriptionMetadata['status'],
    notes?: string
  ): Promise<PrescriptionMetadata> {
    try {
      const response = await api.patch(`/prescriptions/${id}/status`, {
        status,
        notes,
        reviewedAt: new Date().toISOString()
      })
      return response.data
    } catch (error) {
      console.error('Error updating prescription status:', error)
      throw new Error('Failed to update prescription status')
    }
  }

  /**
   * Delete prescription and associated file
   */
  async deletePrescription(id: string): Promise<void> {
    try {
      await api.delete(`/prescriptions/${id}`)
    } catch (error) {
      console.error('Error deleting prescription:', error)
      throw new Error('Failed to delete prescription')
    }
  }

  /**
   * Add medications to prescription
   */
  async addMedications(
    id: string, 
    medications: PrescriptionMetadata['medications']
  ): Promise<PrescriptionMetadata> {
    try {
      const response = await api.patch(`/prescriptions/${id}/medications`, {
        medications
      })
      return response.data
    } catch (error) {
      console.error('Error adding medications:', error)
      throw new Error('Failed to add medications')
    }
  }

  /**
   * Get prescription statistics for dashboard
   */
  async getPrescriptionStats(): Promise<{
    total: number
    pending: number
    underReview: number
    approved: number
    rejected: number
    completed: number
  }> {
    try {
      const response = await api.get('/prescriptions/stats')
      return response.data
    } catch (error) {
      console.error('Error fetching prescription stats:', error)
      throw new Error('Failed to fetch prescription statistics')
    }
  }
}

export const prescriptionService = new PrescriptionService()
