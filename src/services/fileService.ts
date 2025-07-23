/**
 * File Service
 * 
 * Handles secure file operations including downloading, viewing, and managing
 * prescription files with proper authentication.
 */

import { API_CONFIG, AUTH_CONFIG } from '../config'

export interface FileInfo {
  filename: string
  contentType: string
  size: number
  lastModified: string
}

export class FileService {
  private static instance: FileService
  private blobUrlCache = new Map<string, string>()

  public static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService()
    }
    return FileService.instance
  }

  /**
   * Get authentication token from localStorage
   */
  private getAuthToken(): string | null {
    return localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY)
  }

  /**
   * Create headers with authentication
   */
  private getAuthHeaders(): HeadersInit {
    const token = this.getAuthToken()
    if (!token) {
      throw new Error('No authentication token available')
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  /**
   * Convert relative file URL to the authenticated API endpoint
   */
  private getApiUrl(relativeUrl: string): string {
    if (!relativeUrl) {
      throw new Error('File URL is required')
    }

    // If it's already a full API URL, use it directly
    if (relativeUrl.startsWith(`${API_CONFIG.BASE_URL}/files/`)) {
      return relativeUrl
    }

    // If it's a relative API URL like "/api/files/prescriptions/filename.pdf"
    if (relativeUrl.startsWith('/api/files/')) {
      return `${API_CONFIG.BASE_URL.replace('/api', '')}${relativeUrl}`
    }

    // If it's an old format like "/uploads/prescriptions/filename.pdf", convert it
    if (relativeUrl.includes('/uploads/prescriptions/')) {
      const filename = relativeUrl.split('/').pop()
      return `${API_CONFIG.BASE_URL}/files/prescriptions/${filename}`
    }

    // If it's just a filename, construct the full API URL
    if (!relativeUrl.startsWith('http')) {
      const filename = relativeUrl.startsWith('/') ? relativeUrl.slice(1) : relativeUrl
      return `${API_CONFIG.BASE_URL}/files/prescriptions/${filename}`
    }

    // If it's already a full URL, use as is
    return relativeUrl
  }

  /**
   * Download file securely and create a blob URL
   */
  public async getSecureFileUrl(relativeUrl: string): Promise<string> {
    try {
      // Check cache first
      if (this.blobUrlCache.has(relativeUrl)) {
        const cachedUrl = this.blobUrlCache.get(relativeUrl)!
        // Verify the blob URL is still valid
        try {
          await fetch(cachedUrl, { method: 'HEAD' })
          return cachedUrl
        } catch {
          // Cached URL is invalid, remove it and continue
          this.blobUrlCache.delete(relativeUrl)
          URL.revokeObjectURL(cachedUrl)
        }
      }

      const apiUrl = this.getApiUrl(relativeUrl)
      console.log('Fetching secure file from:', apiUrl)

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
      }

      // Create blob and blob URL
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      
      // Cache the blob URL
      this.blobUrlCache.set(relativeUrl, blobUrl)
      
      console.log('Created secure blob URL for file')
      return blobUrl

    } catch (error) {
      console.error('Error creating secure file URL:', error)
      throw error
    }
  }

  /**
   * Download file directly (for download action)
   */
  public async downloadFile(relativeUrl: string, filename?: string): Promise<void> {
    try {
      const blobUrl = await this.getSecureFileUrl(relativeUrl)
      
      // Create download link
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename || this.extractFilename(relativeUrl) || 'download'
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('File download initiated')
    } catch (error) {
      console.error('Error downloading file:', error)
      throw error
    }
  }

  /**
   * Open file in new window (for print/view action)
   */
  public async openFileInNewWindow(relativeUrl: string): Promise<Window | null> {
    try {
      const blobUrl = await this.getSecureFileUrl(relativeUrl)
      const newWindow = window.open(blobUrl, '_blank')
      
      if (!newWindow) {
        throw new Error('Failed to open new window - popup might be blocked')
      }
      
      console.log('File opened in new window')
      return newWindow
    } catch (error) {
      console.error('Error opening file in new window:', error)
      throw error
    }
  }

  /**
   * Get file information
   */
  public async getFileInfo(relativeUrl: string): Promise<FileInfo> {
    try {
      const apiUrl = this.getApiUrl(relativeUrl).replace('/prescriptions/', '/prescriptions/') + '/info'
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Failed to get file info: ${response.status} ${response.statusText}`)
      }

      const fileInfo: FileInfo = await response.json()
      return fileInfo
    } catch (error) {
      console.error('Error getting file info:', error)
      throw error
    }
  }

  /**
   * Extract filename from URL
   */
  private extractFilename(url: string): string | null {
    try {
      const parts = url.split('/')
      return parts[parts.length - 1] || null
    } catch {
      return null
    }
  }

  /**
   * Check if file URL is valid format
   */
  public isValidFileUrl(url: string): boolean {
    if (!url) return false
    
    return (
      url.includes('/uploads/prescriptions/') ||
      url.includes('/api/files/prescriptions/') ||
      url.startsWith('http') ||
      /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(pdf|jpg|jpeg|png)$/i.test(url)
    )
  }

  /**
   * Clean up cached blob URLs
   */
  public clearCache(): void {
    this.blobUrlCache.forEach((blobUrl) => {
      URL.revokeObjectURL(blobUrl)
    })
    this.blobUrlCache.clear()
    console.log('File cache cleared')
  }

  /**
   * Clean up specific cached URL
   */
  public clearCachedUrl(relativeUrl: string): void {
    if (this.blobUrlCache.has(relativeUrl)) {
      const blobUrl = this.blobUrlCache.get(relativeUrl)!
      URL.revokeObjectURL(blobUrl)
      this.blobUrlCache.delete(relativeUrl)
      console.log('Cleared cached URL:', relativeUrl)
    }
  }

  /**
   * Get fallback URL for development (non-authenticated)
   */
  public getFallbackUrl(relativeUrl: string): string {
    if (!relativeUrl) return ''
    
    // If it's already an absolute URL, return as is
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
      return relativeUrl
    }
    
    // Remove leading slash if present and construct absolute URL
    const cleanUrl = relativeUrl.startsWith('/') ? relativeUrl.slice(1) : relativeUrl
    const baseUrl = API_CONFIG.BASE_URL.replace('/api', '') // Remove /api suffix
    
    return `${baseUrl}/${cleanUrl}`
  }
}

// Export singleton instance
export const fileService = FileService.getInstance()

// Export convenience functions
export const getSecureFileUrl = (relativeUrl: string) => fileService.getSecureFileUrl(relativeUrl)
export const downloadFile = (relativeUrl: string, filename?: string) => fileService.downloadFile(relativeUrl, filename)
export const openFileInNewWindow = (relativeUrl: string) => fileService.openFileInNewWindow(relativeUrl)
export const getFileInfo = (relativeUrl: string) => fileService.getFileInfo(relativeUrl)
export const isValidFileUrl = (url: string) => fileService.isValidFileUrl(url)
export const clearFileCache = () => fileService.clearCache()
