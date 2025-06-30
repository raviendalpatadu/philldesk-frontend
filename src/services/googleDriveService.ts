/**
 * Google Drive Service
 * 
 * Handles file uploads to Google Drive using service account authentication
 */

import axios from 'axios'

export interface UploadResponse {
  fileId: string
  fileName: string
  fileUrl: string
  mimeType: string
  size: number
  uploadedAt: string
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

class GoogleDriveService {
  private readonly baseUrl = '/api/upload'

  /**
   * Upload a file to Google Drive
   */
  async uploadFile(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileName', file.name)
    formData.append('mimeType', file.type)

    try {
      const response = await axios.post(`${this.baseUrl}/prescription`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress: UploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
            }
            onProgress(progress)
          }
        }
      })

      return response.data
    } catch (error) {
      console.error('Error uploading file:', error)
      throw new Error('Failed to upload prescription. Please try again.')
    }
  }

  /**
   * Get file URL from Google Drive
   */
  async getFileUrl(fileId: string): Promise<string> {
    try {
      const response = await axios.get(`${this.baseUrl}/file/${fileId}/url`)
      return response.data.url
    } catch (error) {
      console.error('Error getting file URL:', error)
      throw new Error('Failed to get file URL')
    }
  }

  /**
   * Delete file from Google Drive
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/file/${fileId}`)
    } catch (error) {
      console.error('Error deleting file:', error)
      throw new Error('Failed to delete file')
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
      'image/webp'
    ]

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size must be less than 10MB'
      }
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Only JPEG, PNG, PDF, and WebP files are allowed'
      }
    }

    return { valid: true }
  }
}

export const googleDriveService = new GoogleDriveService()
