/**
 * Prescription Upload Service
 * 
 * Handles prescription file uploads to Google Drive and
 * metadata storage in the database.
 */

import { api, UPLOAD_CONFIG } from '../config/index'

// ============================================================================
// Types and Interfaces
// ============================================================================

export type UploadProgressCallback = (progress: number) => void

export interface PrescriptionFile {
  file: File
  fileName: string
  fileSize: number
  fileType: string
}

export interface UploadResponse {
  success: boolean
  prescriptionId: string
  googleDriveFileId: string
  fileUrl: string
  fileName: string
  uploadedAt: string
  message: string
}

export interface PrescriptionMetadata {
  fileName: string
  fileSize: number
  fileType: string
  googleDriveFileId: string
  fileUrl: string
  uploadedAt: string
  patientNotes?: string
  doctorName?: string
  prescriptionDate?: string
}

// ============================================================================
// Validation Functions
// ============================================================================

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf']

export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`
    }
  }

  // Check file type
  const allowedTypes = UPLOAD_CONFIG.ALLOWED_TYPES as readonly string[]
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Please upload: ${allowedTypes.join(', ')}`
    }
  }

  // Check file extension
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return {
      valid: false,
      error: `File extension ${fileExtension} is not allowed. Please upload: ${ALLOWED_EXTENSIONS.join(', ')}`
    }
  }

  return { valid: true }
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ============================================================================
// Upload Service
// ============================================================================

export class PrescriptionUploadService {
  /**
   * Upload prescription file to Google Drive and save metadata
   */
  static async uploadPrescription(
    prescriptionFile: PrescriptionFile,
    metadata: Partial<PrescriptionMetadata>,
    onProgress?: UploadProgressCallback
  ): Promise<UploadResponse> {
    try {
      // Validate file
      const validation = validateFile(prescriptionFile.file)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // Create form data for file upload
      const formData = new FormData()
      formData.append('file', prescriptionFile.file)
      formData.append('fileName', prescriptionFile.fileName)
      formData.append('fileType', prescriptionFile.fileType)
      
      // Add metadata
      if (metadata.patientNotes) {
        formData.append('patientNotes', metadata.patientNotes)
      }
      if (metadata.doctorName) {
        formData.append('doctorName', metadata.doctorName)
      }
      if (metadata.prescriptionDate) {
        formData.append('prescriptionDate', metadata.prescriptionDate)
      }

      // Upload with progress tracking
      const response = await api.post<UploadResponse>('/prescriptions/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes for large files
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(progress)
          }
        },
      })

      return response.data
    } catch (error: any) {
      console.error('Prescription upload error:', error)
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      } else if (error.message) {
        throw new Error(error.message)
      } else {
        throw new Error('Failed to upload prescription. Please try again.')
      }
    }
  }

  /**
   * Get prescription upload status
   */
  static async getUploadStatus(prescriptionId: string): Promise<any> {
    try {
      const response = await api.get(`/prescriptions/${prescriptionId}/status`)
      return response.data
    } catch (error: any) {
      console.error('Error getting upload status:', error)
      throw new Error(error.response?.data?.message ?? 'Failed to get upload status')
    }
  }

  /**
   * Delete prescription and associated file
   */
  static async deletePrescription(prescriptionId: string): Promise<void> {
    try {
      await api.delete(`/prescriptions/${prescriptionId}`)
    } catch (error: any) {
      console.error('Error deleting prescription:', error)
      throw new Error(error.response?.data?.message ?? 'Failed to delete prescription')
    }
  }

  /**
   * Get user's prescription statistics
   */
  static async getPrescriptionStats(): Promise<any> {
    try {
      const response = await api.get('/prescriptions/stats')
      return response.data
    } catch (error: any) {
      console.error('Error getting prescription stats:', error)
      throw new Error(error.response?.data?.message ?? 'Failed to get prescription statistics')
    }
  }

  /**
   * Get user's prescriptions with pagination
   */
  static async getPrescriptions(page = 1, limit = 10, status?: string): Promise<any> {
    try {
      const params: any = { page, limit }
      if (status) {
        params.status = status
      }

      const response = await api.get('/prescriptions', { params })
      return response.data
    } catch (error: any) {
      console.error('Error getting prescriptions:', error)
      throw new Error(error.response?.data?.message ?? 'Failed to get prescriptions')
    }
  }
}

export default PrescriptionUploadService
