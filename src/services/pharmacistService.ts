/**
 * Pharmacist Service
 * 
 * Handles pharmacist-specific API calls and business logic
 */

import { api } from '../config/index'

// Backend API response interfaces
export interface PrescriptionApiResponse {
  id: number
  prescriptionNumber: string
  doctorName: string
  doctorLicense?: string
  prescriptionDate: number[] // [year, month, day, hour, minute, second, nanosecond]
  fileUrl: string
  fileName: string
  fileType: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISPENSED' | 'COMPLETED'
  notes?: string
  rejectionReason?: string
  createdAt: number[]
  updatedAt: number[]
  approvedAt?: number[]
  customerId: number
  customerName: string
  pharmacistId?: number
  pharmacistName?: string
}

export interface PaginatedPrescriptionResponse {
  content: PrescriptionApiResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  empty: boolean
}

// Bill API response interface
export interface BillApiResponse {
  id: number
  billNumber: string
  prescription?: any
  customer: {
    id: number
    username: string
    email: string
    firstName: string
    lastName: string
    phone?: string
    address?: string
    isActive: boolean
    role: {
      id: number
      name: string
      description: string
    }
    createdAt: number[]
    updatedAt: number[]
  }
  pharmacist: {
    id: number
    username: string
    email: string
    firstName: string
    lastName: string
    phone?: string
    address?: string
    isActive: boolean
    role: {
      id: number
      name: string
      description: string
    }
    createdAt: number[]
    updatedAt: number[]
  }
  billItems: any[]
  subtotal: number
  discount: number
  tax: number
  totalAmount: number
  paymentStatus: string
  paymentMethod?: string
  paymentType: string
  notes?: string
  createdAt: number[]
  updatedAt: number[]
  paidAt?: number[]
}

// Transformed bill interface for frontend use
export interface TransformedBill {
  id: number
  billNumber: string
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  pharmacistName: string
  subtotal: number
  discount: number
  tax: number
  total: number
  totalAmount: number
  amount?: number // Alias for totalAmount
  shipping?: number
  paymentStatus: string
  paymentMethod?: string
  paymentType: string
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
  paidAt?: string
  orderDate: string
  billItems: any[]
  items?: any[] // Alias for billItems
  prescriptionId?: number
  prescriptionNumber?: string
  invoiceId?: string
  generatedDate?: string
  paidAmount?: number
  insurance?: {
    provider: string
    policyNumber: string
    coverage: number
    estimatedCoverage: number
  }
}

// Utility function to convert date array to ISO string
const convertDateArrayToString = (dateArray: number[]): string => {
  if (!dateArray || dateArray.length < 3) {
    return new Date().toISOString()
  }
  
  // Extract date components [year, month, day, hour, minute, second, nanosecond]
  const [year, month, day, hour = 0, minute = 0, second = 0] = dateArray
  
  // Note: JavaScript Date months are 0-indexed, so subtract 1 from month
  const date = new Date(year, month - 1, day, hour, minute, second)
  return date.toISOString()
}

// Transform API response to expected UI format
const transformPrescriptionData = (apiData: PrescriptionApiResponse): any => {
  // Map backend status to UI status
  const getUIStatus = (backendStatus: string) => {
    switch (backendStatus) {
      case 'PENDING':
        return 'Pending Review'
      case 'APPROVED':
        return 'Under Review'
      case 'DISPENSED':
        return 'Ready for Pickup'
      case 'REJECTED':
        return 'Requires Clarification'
      case 'COMPLETED':
        return 'Completed'
      default:
        return backendStatus
    }
  }

  // Determine priority based on notes
  const getPriority = (notes?: string): string => {
    if (!notes) return 'Normal'
    const lowerNotes = notes.toLowerCase()
    if (lowerNotes.includes('emergency')) return 'Emergency'
    if (lowerNotes.includes('urgent')) return 'Urgent'
    return 'Normal'
  }

  return {
    id: apiData.id,
    prescriptionId: apiData.prescriptionNumber,
    prescriptionNumber: apiData.prescriptionNumber,
    patientName: apiData.customerName,
    doctorName: apiData.doctorName,
    doctorLicense: apiData.doctorLicense,
    status: getUIStatus(apiData.status),
    priority: getPriority(apiData.notes),
    submittedDate: convertDateArrayToString(apiData.createdAt),
    createdAt: convertDateArrayToString(apiData.createdAt),
    updatedAt: convertDateArrayToString(apiData.updatedAt),
    approvedAt: apiData.approvedAt ? convertDateArrayToString(apiData.approvedAt) : undefined,
    prescriptionDate: convertDateArrayToString(apiData.prescriptionDate),
    fileUrl: apiData.fileUrl,
    fileName: apiData.fileName,
    fileType: apiData.fileType,
    notes: apiData.notes,
    rejectionReason: apiData.rejectionReason,
    customerId: apiData.customerId,
    customerName: apiData.customerName,
    pharmacistId: apiData.pharmacistId,
    pharmacistName: apiData.pharmacistName,
    // Mock additional fields that the UI expects
    customer: {
      id: apiData.customerId,
      firstName: apiData.customerName.split(' ')[0] || '',
      lastName: apiData.customerName.split(' ').slice(1).join(' ') || '',
      age: 'N/A',
      gender: 'N/A'
    },
    medications: [], // This would need to come from a separate API call if needed
    customerInputs: {
      patientNotes: apiData.notes,
      emergencyRequest: apiData.notes?.toLowerCase().includes('emergency') || false,
      doctorNameProvided: apiData.doctorName,
      prescriptionDateProvided: convertDateArrayToString(apiData.prescriptionDate),
      additionalInstructions: apiData.notes
    }
  }
}

// Transform bill API response to expected UI format
const transformBillData = (apiData: BillApiResponse): TransformedBill => {
  // Map payment status to UI status
  const getUIStatus = (paymentStatus: string, paymentType: string) => {
    if (paymentStatus === 'PENDING') {
      return paymentType === 'PAY_ON_PICKUP' ? 'Ready for Billing' : 'Pending Billing'
    }
    return paymentStatus === 'PAID' ? 'Paid' : 'Pending Billing'
  }

  return {
    id: apiData.id,
    billNumber: apiData.billNumber,
    orderId: apiData.billNumber, // Use bill number as order ID
    customerName: `${apiData.customer.firstName} ${apiData.customer.lastName}`,
    customerEmail: apiData.customer.email,
    customerPhone: apiData.customer.phone,
    pharmacistName: `${apiData.pharmacist.firstName} ${apiData.pharmacist.lastName}`,
    subtotal: apiData.subtotal,
    discount: apiData.discount,
    tax: apiData.tax,
    total: apiData.totalAmount,
    totalAmount: apiData.totalAmount,
    amount: apiData.totalAmount, // Alias for compatibility
    shipping: 0, // Default shipping to 0 if not provided
    paymentStatus: apiData.paymentStatus,
    paymentMethod: apiData.paymentMethod,
    paymentType: apiData.paymentType,
    status: getUIStatus(apiData.paymentStatus, apiData.paymentType),
    notes: apiData.notes,
    createdAt: convertDateArrayToString(apiData.createdAt),
    updatedAt: convertDateArrayToString(apiData.updatedAt),
    paidAt: apiData.paidAt ? convertDateArrayToString(apiData.paidAt) : undefined,
    orderDate: convertDateArrayToString(apiData.createdAt),
    billItems: apiData.billItems || [],
    items: apiData.billItems || [], // Alias for compatibility
    prescriptionId: apiData.prescription?.id,
    prescriptionNumber: apiData.prescription?.prescriptionNumber,
    invoiceId: apiData.billNumber, // Use bill number as invoice ID
    generatedDate: convertDateArrayToString(apiData.createdAt),
    paidAmount: apiData.paymentStatus === 'PAID' ? apiData.totalAmount : 0,
    // Mock insurance data if not provided
    insurance: undefined // Insurance data would need to come from prescription or separate API
  }
}

export interface PrescriptionReviewData {
  decision: 'approve' | 'approve_hold' | 'clarification' | 'reject'
  notes?: string
  estimatedReady?: string
}

export interface DashboardStats {
  total: number
  pending: number
  underReview: number
  readyForPickup: number
  completed: number
  approvedToday: number
  emergency: number
  pendingApproval: number
  totalInventoryItems: number
  lowStockItems: number
  outOfStockItems: number
  criticalLowItems: number
  totalInventoryValue: number
}

export interface InventoryData {
  medicines: Array<{
    id: number
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
  }>
  lowStock: any[]
  criticalLow: any[]
  outOfStock: any[]
}

export interface WorkflowStats {
  submittedToday: number
  reviewedToday: number
  completedToday: number
  averageProcessingTimeHours: number
  averagePickupTimeHours: number
}

class PharmacistService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await api.get('/pharmacist/dashboard/stats')
      return response.data
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw new Error('Failed to fetch dashboard statistics')
    }
  }

  /**
   * Get pending prescriptions for review
   */
  async getPendingPrescriptions(): Promise<any[]> {
    try {
      const response = await api.get('/pharmacist/prescriptions/pending')
      return response.data
    } catch (error) {
      console.error('Error fetching pending prescriptions:', error)
      throw new Error('Failed to fetch pending prescriptions')
    }
  }

  /**
   * Get prescriptions that require clarification
   */
  async getRequiresClarificationPrescriptions(): Promise<any[]> {
    try {
      const response = await api.get('/pharmacist/prescriptions/requires-clarification')
      return response.data
    } catch (error) {
      console.error('Error fetching clarification prescriptions:', error)
      throw new Error('Failed to fetch prescriptions requiring clarification')
    }
  }

  /**
   * Review a prescription (approve/reject/request clarification)
   */
  async reviewPrescription(id: string, reviewData: PrescriptionReviewData): Promise<any> {
    try {
      const response = await api.post(`/pharmacist/prescriptions/${id}/review`, reviewData)
      return response.data
    } catch (error) {
      console.error('Error reviewing prescription:', error)
      throw new Error('Failed to review prescription')
    }
  }

  /**
   * Get prescriptions assigned to a specific pharmacist
   */
  async getAssignedPrescriptions(pharmacistId: string): Promise<any[]> {
    try {
      const response = await api.get(`/pharmacist/prescriptions/assigned/${pharmacistId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching assigned prescriptions:', error)
      throw new Error('Failed to fetch assigned prescriptions')
    }
  }

  /**
   * Mark prescription as ready for pickup
   */
  async markReadyForPickup(id: string): Promise<any> {
    try {
      const response = await api.post(`/pharmacist/prescriptions/${id}/ready`)
      return response.data
    } catch (error) {
      console.error('Error marking prescription ready:', error)
      throw new Error('Failed to mark prescription as ready')
    }
  }

  /**
   * Complete prescription (mark as picked up)
   */
  async completePrescription(id: string): Promise<any> {
    try {
      const response = await api.post(`/pharmacist/prescriptions/${id}/complete`)
      return response.data
    } catch (error) {
      console.error('Error completing prescription:', error)
      throw new Error('Failed to complete prescription')
    }
  }

  /**
   * Get inventory management data
   */
  async getInventoryData(): Promise<InventoryData> {
    try {
      const response = await api.get('/pharmacist/inventory')
      return response.data
    } catch (error) {
      console.error('Error fetching inventory data:', error)
      throw new Error('Failed to fetch inventory data')
    }
  }

  /**
   * Update medicine stock
   */
  async updateMedicineStock(
    medicineId: string, 
    quantity: number, 
    operation: 'increase' | 'decrease' | 'set'
  ): Promise<any> {
    try {
      const response = await api.patch(`/pharmacist/inventory/${medicineId}/stock`, null, {
        params: { quantity, operation }
      })
      return response.data
    } catch (error) {
      console.error('Error updating medicine stock:', error)
      throw new Error('Failed to update medicine stock')
    }
  }

  /**
   * Search prescriptions by patient name, prescription number, or doctor name
   */
  async searchPrescriptions(query: string): Promise<any[]> {
    try {
      const response = await api.get('/pharmacist/prescriptions/search', {
        params: { query }
      })
      return response.data
    } catch (error) {
      console.error('Error searching prescriptions:', error)
      throw new Error('Failed to search prescriptions')
    }
  }

  /**
   * Get prescription workflow statistics
   */
  async getWorkflowStats(): Promise<WorkflowStats> {
    try {
      const response = await api.get('/pharmacist/workflow/stats')
      return response.data
    } catch (error) {
      console.error('Error fetching workflow stats:', error)
      throw new Error('Failed to fetch workflow statistics')
    }
  }

  /**
   * Get all pharmacists for assignment
   */
  async getAllPharmacists(): Promise<any[]> {
    try {
      const response = await api.get('/pharmacist/pharmacists')
      return response.data
    } catch (error) {
      console.error('Error fetching pharmacists:', error)
      throw new Error('Failed to fetch pharmacists')
    }
  }

  /**
   * Assign prescription to pharmacist
   */
  async assignPrescription(prescriptionId: string, pharmacistId: string): Promise<any> {
    try {
      const response = await api.post(`/pharmacist/prescriptions/${prescriptionId}/assign`, null, {
        params: { pharmacistId }
      })
      return response.data
    } catch (error) {
      console.error('Error assigning prescription:', error)
      throw new Error('Failed to assign prescription')
    }
  }

  /**
   * Get all prescriptions with pagination and filtering
   */
  async getAllPrescriptions(filters?: {
    status?: string
    page?: number
    size?: number
    sortBy?: string
    sortDir?: string
  }): Promise<any> {
    try {
      const response = await api.get('/prescriptions/paged', {
        params: filters
      })
      
      const paginatedResponse: PaginatedPrescriptionResponse = response.data
      
      // Transform the prescription data
      const transformedContent = paginatedResponse.content.map(transformPrescriptionData)
      
      console.log('Transformed prescriptions:', transformedContent)
      
      // Return the transformed data in the same paginated structure
      return {
        ...paginatedResponse,
        content: transformedContent
      }
    } catch (error) {
      console.error('Error fetching all prescriptions:', error)
      throw new Error('Failed to fetch prescriptions')
    }
  }

  /**
   * Get prescription by ID with full details
   */
  async getPrescriptionById(id: string): Promise<any> {
    try {
      const response = await api.get(`/prescriptions/${id}`)
      const apiData: PrescriptionApiResponse = response.data
      
      // Transform the prescription data
      return transformPrescriptionData(apiData)
    } catch (error) {
      console.error('Error fetching prescription details:', error)
      throw new Error('Failed to fetch prescription details')
    }
  }

  // ==================== BILLING MANAGEMENT ====================

  /**
   * Get all bills with pagination
   */
  async getAllBills(params: {
    page?: number
    size?: number
    sortBy?: string
    sortDir?: string
  } = {}): Promise<any> {
    try {
      const { page = 0, size = 20, sortBy = 'createdAt', sortDir = 'desc' } = params
      const response = await api.get('/bills/paged', {
        params: { page, size, sortBy, sortDir }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching bills:', error)
      throw new Error('Failed to fetch bills')
    }
  }

  /**
   * Get pending bills for billing management
   */
  async getPendingBills(): Promise<TransformedBill[]> {
    try {
      const response = await api.get('/bills/pending')
      const apiData: BillApiResponse[] = response.data
      
      // Transform the bill data
      return apiData.map(bill => transformBillData(bill))
    } catch (error) {
      console.error('Error fetching pending bills:', error)
      throw new Error('Failed to fetch pending bills')
    }
  }

  /**
   * Get paid bills
   */
  async getPaidBills(): Promise<TransformedBill[]> {
    try {
      const response = await api.get('/bills/paid')
      const apiData: BillApiResponse[] = response.data
      
      // Transform the bill data
      return apiData.map(bill => transformBillData(bill))
    } catch (error) {
      console.error('Error fetching paid bills:', error)
      throw new Error('Failed to fetch paid bills')
    }
  }

  /**
   * Get bills by status
   */
  async getBillsByStatus(status: string): Promise<any[]> {
    try {
      const response = await api.get(`/bills/status/${status}`)
      return response.data
    } catch (error) {
      console.error('Error fetching bills by status:', error)
      throw new Error('Failed to fetch bills by status')
    }
  }

  /**
   * Get bill by prescription ID
   */
  async getBillByPrescription(prescriptionId: string): Promise<any> {
    try {
      const response = await api.get(`/bills/prescription/${prescriptionId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching bill by prescription:', error)
      throw new Error('Failed to fetch bill by prescription')
    }
  }

  /**
   * Generate bill from prescription
   */
  async generateBillFromPrescription(prescriptionId: string): Promise<any> {
    try {
      const response = await api.post(`/bills/generate/${prescriptionId}`)
      return response.data
    } catch (error) {
      console.error('Error generating bill:', error)
      throw new Error('Failed to generate bill')
    }
  }

  /**
   * Calculate total amount for prescription
   */
  async calculatePrescriptionAmount(prescriptionId: string): Promise<number> {
    try {
      const response = await api.get(`/bills/calculate/${prescriptionId}`)
      return response.data
    } catch (error) {
      console.error('Error calculating prescription amount:', error)
      throw new Error('Failed to calculate prescription amount')
    }
  }

  /**
   * Create or update bill
   */
  async saveBill(billData: any): Promise<any> {
    try {
      const response = await api.post('/bills', billData)
      return response.data
    } catch (error) {
      console.error('Error saving bill:', error)
      throw new Error('Failed to save bill')
    }
  }

  /**
   * Update bill
   */
  async updateBill(billId: string, billData: any): Promise<any> {
    try {
      const response = await api.put(`/bills/${billId}`, billData)
      return response.data
    } catch (error) {
      console.error('Error updating bill:', error)
      throw new Error('Failed to update bill')
    }
  }

  /**
   * Update bill status
   */
  async updateBillStatus(billId: string, status: string): Promise<void> {
    try {
      await api.patch(`/bills/${billId}/status`, null, {
        params: { status }
      })
    } catch (error) {
      console.error('Error updating bill status:', error)
      throw new Error('Failed to update bill status')
    }
  }

  /**
   * Mark bill as paid
   */
  async markBillAsPaid(billId: string, paymentMethod: string): Promise<void> {
    try {
      await api.patch(`/bills/${billId}/mark-paid`, null, {
        params: { paymentMethod }
      })
    } catch (error) {
      console.error('Error marking bill as paid:', error)
      throw new Error('Failed to mark bill as paid')
    }
  }

  /**
   * Search bills
   */
  async searchBills(searchTerm: string): Promise<any[]> {
    try {
      const response = await api.get('/bills/search', {
        params: { searchTerm }
      })
      return response.data
    } catch (error) {
      console.error('Error searching bills:', error)
      throw new Error('Failed to search bills')
    }
  }

  /**
   * Get bills by customer
   */
  async getBillsByCustomer(customerId: string): Promise<any[]> {
    try {
      const response = await api.get(`/bills/customer/${customerId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching bills by customer:', error)
      throw new Error('Failed to fetch bills by customer')
    }
  }

  /**
   * Get revenue data
   */
  async getRevenue(startDate: string, endDate: string): Promise<number> {
    try {
      const response = await api.get('/bills/revenue', {
        params: { startDate, endDate }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching revenue:', error)
      throw new Error('Failed to fetch revenue')
    }
  }

  /**
   * Get bill count
   */
  async getBillCount(startDate: string, endDate: string): Promise<number> {
    try {
      const response = await api.get('/bills/count', {
        params: { startDate, endDate }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching bill count:', error)
      throw new Error('Failed to fetch bill count')
    }
  }

  /**
   * Get bills by date range
   */
  async getBillsByDateRange(startDate: string, endDate: string): Promise<any[]> {
    try {
      const response = await api.get('/bills/date-range', {
        params: { startDate, endDate }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching bills by date range:', error)
      throw new Error('Failed to fetch bills by date range')
    }
  }

  /**
   * Get bills by payment method
   */
  async getBillsByPaymentMethod(paymentMethod: string): Promise<any[]> {
    try {
      const response = await api.get(`/bills/payment-method/${paymentMethod}`)
      return response.data
    } catch (error) {
      console.error('Error fetching bills by payment method:', error)
      throw new Error('Failed to fetch bills by payment method')
    }
  }

  // ============================================================================
  // Enhanced Prescription Completion Methods
  // ============================================================================

  /**
   * Complete prescription with enhanced details
   */
  async completeWithDetails(prescriptionId: string, completionDetails: {
    instructions?: string
    followUpDate?: string
    dispensingNotes?: string
    medicineDetails?: any[]
  }): Promise<any> {
    try {
      const response = await api.post(`/pharmacist/prescriptions/${prescriptionId}/complete-with-details`, completionDetails)
      return response.data
    } catch (error) {
      console.error('Error completing prescription with details:', error)
      throw new Error('Failed to complete prescription with details')
    }
  }

  /**
   * Generate receipt for completed prescription
   */
  async generateReceipt(prescriptionId: string): Promise<any> {
    try {
      const response = await api.get(`/pharmacist/prescriptions/${prescriptionId}/receipt`)
      return response.data
    } catch (error) {
      console.error('Error generating receipt:', error)
      throw new Error('Failed to generate receipt')
    }
  }

  /**
   * Create dispensing record for regulatory compliance
   */
  async createDispensingRecord(prescriptionId: string, dispensingDetails: {
    medicineRecords: any[]
    pharmacistSignature: string
    dispensingDate: string
  }): Promise<any> {
    try {
      const response = await api.post(`/pharmacist/prescriptions/${prescriptionId}/dispense-record`, dispensingDetails)
      return response.data
    } catch (error) {
      console.error('Error creating dispensing record:', error)
      throw new Error('Failed to create dispensing record')
    }
  }

  /**
   * Get completion details for a prescription
   */
  async getCompletionDetails(prescriptionId: string): Promise<any> {
    try {
      const response = await api.get(`/pharmacist/prescriptions/${prescriptionId}/completion-details`)
      return response.data
    } catch (error) {
      console.error('Error getting completion details:', error)
      throw new Error('Failed to get completion details')
    }
  }
}

export const pharmacistService = new PharmacistService()
