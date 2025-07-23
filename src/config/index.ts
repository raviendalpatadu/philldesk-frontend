/**
 * Environment Configuration
 * 
 * This file contains all environment-specific configuration
 * and constants used throughout the application.
 */

import axios from 'axios'

// ============================================================================
// API Configuration
// ============================================================================

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
} as const

// ============================================================================
// Application Configuration
// ============================================================================

export const APP_CONFIG = {
  NAME: 'PhillDesk',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  DESCRIPTION: 'Pharmacy Management System',
  COMPANY: 'PhillDesk Solutions',
} as const

// ============================================================================
// Authentication Configuration
// ============================================================================

export const AUTH_CONFIG = {
  TOKEN_STORAGE_KEY: 'philldesk-auth-token',
  USER_STORAGE_KEY: 'philldesk-auth',
  TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000, // 5 minutes in milliseconds
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
} as const

// ============================================================================
// File Upload Configuration
// ============================================================================

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'image/webp',
  ],
  GOOGLE_DRIVE_CLIENT_ID: import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID,
} as const

// ============================================================================
// UI Configuration
// ============================================================================

export const UI_CONFIG = {
  SIDEBAR_WIDTH: 256,
  SIDEBAR_COLLAPSED_WIDTH: 80,
  HEADER_HEIGHT: 64,
  CONTENT_PADDING: 24,
  CARD_BORDER_RADIUS: 8,
  ANIMATION_DURATION: 300,
} as const

// ============================================================================
// Pagination Configuration
// ============================================================================

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: ['10', '20', '50', '100'],
  MAX_PAGE_SIZE: 100,
} as const

// ============================================================================
// Date/Time Configuration
// ============================================================================

export const DATE_CONFIG = {
  FORMAT: 'YYYY-MM-DD',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  DISPLAY_FORMAT: 'MMM DD, YYYY',
  DISPLAY_DATETIME_FORMAT: 'MMM DD, YYYY HH:mm',
  TIME_FORMAT: 'HH:mm',
} as const

// ============================================================================
// Role-based Configuration
// ============================================================================

export const ROLE_CONFIG = {
  ADMIN: {
    name: 'Administrator',
    description: 'Full system access',
    color: '#f50',
  },
  PHARMACIST: {
    name: 'Pharmacist',
    description: 'Manage prescriptions and inventory',
    color: '#108ee9',
  },
  CUSTOMER: {
    name: 'Customer',
    description: 'Upload prescriptions and view orders',
    color: '#87d068',
  },
} as const

// ============================================================================
// Status Configuration
// ============================================================================

export const STATUS_CONFIG = {
  PRESCRIPTION: {
    PENDING: { label: 'Pending', color: 'orange' },
    APPROVED: { label: 'Approved', color: 'green' },
    REJECTED: { label: 'Rejected', color: 'red' },
    COMPLETED: { label: 'Completed', color: 'blue' },
  },
  BILL: {
    DRAFT: { label: 'Draft', color: 'gray' },
    GENERATED: { label: 'Generated', color: 'blue' },
    PAID: { label: 'Paid', color: 'green' },
    CANCELLED: { label: 'Cancelled', color: 'red' },
  },
  STOCK: {
    IN_STOCK: { label: 'In Stock', color: 'green' },
    LOW_STOCK: { label: 'Low Stock', color: 'orange' },
    OUT_OF_STOCK: { label: 'Out of Stock', color: 'red' },
    EXPIRING: { label: 'Expiring', color: 'orange' },
    EXPIRED: { label: 'Expired', color: 'red' },
  },
} as const

// ============================================================================
// Notification Configuration
// ============================================================================

export const NOTIFICATION_CONFIG = {
  DURATION: 4, // seconds
  PLACEMENT: 'topRight',
  MAX_COUNT: 5,
} as const

// ============================================================================
// Local Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'philldesk-auth-token',
  AUTH_USER: 'philldesk-auth',
  SIDEBAR_COLLAPSED: 'philldesk-sidebar-collapsed',
  THEME: 'philldesk-theme',
  LANGUAGE: 'philldesk-language',
} as const

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. Insufficient permissions.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'An unexpected server error occurred. Please try again later.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  FILE_TOO_LARGE: 'File size is too large. Please choose a smaller file.',
  INVALID_FILE_TYPE: 'Invalid file type. Please choose a supported file format.',
} as const

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  SAVE_SUCCESS: 'Data saved successfully.',
  UPDATE_SUCCESS: 'Data updated successfully.',
  DELETE_SUCCESS: 'Data deleted successfully.',
  UPLOAD_SUCCESS: 'File uploaded successfully.',
  EMAIL_SENT: 'Email sent successfully.',
  PASSWORD_CHANGED: 'Password changed successfully.',
} as const

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert relative file URL to absolute URL with authentication token
 * @param relativeUrl - The relative URL returned from the backend (e.g., "/uploads/prescriptions/filename.pdf")
 * @returns Absolute URL with auth token that can be used in the frontend
 */
export const getFileUrl = (relativeUrl: string): string => {
  if (!relativeUrl) return ''
  
  // If it's already an absolute URL, return as is
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl
  }
  
  // Remove leading slash if present and construct absolute URL
  const cleanUrl = relativeUrl.startsWith('/') ? relativeUrl.slice(1) : relativeUrl
  const baseUrl = API_CONFIG.BASE_URL.replace('/api', '') // Remove /api suffix to get base server URL
  const fullUrl = `${baseUrl}/${cleanUrl}`
  
  // The backend expects Authorization header for file access, but since we're using this URL
  // directly in img src, iframe src, etc., we need to handle auth differently
  // For now, return the full URL - the actual auth will be handled by axios interceptors
  // when downloading files programmatically
  return fullUrl
}

// ============================================================================
// Development Configuration
// ============================================================================

export const DEV_CONFIG = {
  ENABLE_LOGGING: import.meta.env.DEV,
  MOCK_API_DELAY: 1000, // milliseconds
  SHOW_REDUX_DEVTOOLS: import.meta.env.DEV,
} as const

// ============================================================================
// Feature Flags
// ============================================================================

export const FEATURE_FLAGS = {
  ENABLE_DARK_MODE: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_ANALYTICS: false,
  ENABLE_OFFLINE_MODE: false,
  ENABLE_PWA: false,
} as const

// ============================================================================
// API Client Configuration
// ============================================================================

// Create axios instance with default configuration
export const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(new Error(error.message ?? 'Request failed'))
  }
)

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY)
      localStorage.removeItem(AUTH_CONFIG.USER_STORAGE_KEY)
      window.location.href = '/login'
    }
    return Promise.reject(new Error(error.response?.data?.message ?? error.message ?? 'Request failed'))
  }
)

export default {
  API_CONFIG,
  APP_CONFIG,
  AUTH_CONFIG,
  UPLOAD_CONFIG,
  UI_CONFIG,
  PAGINATION_CONFIG,
  DATE_CONFIG,
  ROLE_CONFIG,
  STATUS_CONFIG,
  NOTIFICATION_CONFIG,
  STORAGE_KEYS,
  getFileUrl,
  api,
}
