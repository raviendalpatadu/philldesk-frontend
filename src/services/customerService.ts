import { api } from '../config';

// Utility function to convert date array to ISO string
const convertDateArrayToString = (dateArray: number[]): string => {
  if (!dateArray || dateArray.length < 3) {
    return new Date().toISOString();
  }
  
  // Extract date components [year, month, day, hour, minute, second, nanosecond]
  const [year, month, day, hour = 0, minute = 0, second = 0] = dateArray;
  
  // Note: JavaScript Date months are 0-indexed, so subtract 1 from month
  const date = new Date(year, month - 1, day, hour, minute, second);
  return date.toISOString();
};

// Transform API response to expected Bill format
const transformBillData = (apiData: any): Bill => {
  return {
    id: apiData.id,
    billNumber: apiData.billNumber,
    subtotal: apiData.subtotal,
    discount: apiData.discount || 0,
    tax: apiData.tax || 0,
    totalAmount: apiData.totalAmount,
    paymentStatus: apiData.paymentStatus,
    paymentMethod: apiData.paymentMethod,
    paymentType: apiData.paymentType,
    notes: apiData.notes,
    billItems: apiData.billItems ? apiData.billItems.map((item: any) => ({
      id: item.id,
      medicationName: item.medicineName || 'Unknown Medicine',
      manufacturer: item.manufacturer,
      batchNumber: item.batchNumber,
      strength: item.strength,
      quantity: item.quantity || 0,
      unitPrice: item.unitPrice || 0,
      totalPrice: item.totalPrice || 0,
      dosage: item.dosage || item.notes || 'N/A', // Use notes as dosage if dosage not available
      instructions: item.notes || item.instructions
    })) : [],
    createdAt: convertDateArrayToString(apiData.createdAt),
    updatedAt: apiData.updatedAt ? convertDateArrayToString(apiData.updatedAt) : undefined,
    paidAt: apiData.paidAt ? convertDateArrayToString(apiData.paidAt) : undefined,
    customerId: apiData.customer?.id,
    customerName: apiData.customer ? `${apiData.customer.firstName} ${apiData.customer.lastName}` : undefined,
    prescriptionId: apiData.prescription?.id,
    prescriptionNumber: apiData.prescription?.prescriptionNumber,
    prescription: apiData.prescription ? transformPrescriptionData(apiData.prescription) : undefined,
    shippingDetails: apiData.shippingDetails ? {
      recipientName: apiData.shippingDetails.recipientName,
      contactPhone: apiData.shippingDetails.contactPhone,
      alternatePhone: apiData.shippingDetails.alternatePhone,
      email: apiData.shippingDetails.email,
      addressLine1: apiData.shippingDetails.addressLine1,
      addressLine2: apiData.shippingDetails.addressLine2,
      city: apiData.shippingDetails.city,
      stateProvince: apiData.shippingDetails.stateProvince,
      postalCode: apiData.shippingDetails.postalCode,
      country: apiData.shippingDetails.country,
      deliveryInstructions: apiData.shippingDetails.deliveryInstructions,
      preferredDeliveryTime: apiData.shippingDetails.preferredDeliveryTime,
      deliveryFee: apiData.shippingDetails.deliveryFee
    } : undefined
  };
};

// Transform API response to expected Prescription format
const transformPrescriptionData = (apiData: PrescriptionApiResponse): Prescription => {
  return {
    id: apiData.id,
    prescriptionNumber: apiData.prescriptionNumber,
    doctorName: apiData.doctorName,
    doctorLicense: apiData.doctorLicense,
    prescriptionDate: convertDateArrayToString(apiData.prescriptionDate),
    fileUrl: apiData.fileUrl,
    fileName: apiData.fileName,
    fileType: apiData.fileType,
    status: apiData.status,
    notes: apiData.notes,
    rejectionReason: apiData.rejectionReason,
    createdAt: convertDateArrayToString(apiData.createdAt),
    updatedAt: convertDateArrayToString(apiData.updatedAt),
    approvedAt: apiData.approvedAt ? convertDateArrayToString(apiData.approvedAt) : undefined,
    uploadedAt: convertDateArrayToString(apiData.createdAt),
    fileSize: undefined, // Not provided by API yet
    reviewedAt: apiData.status !== 'PENDING' ? convertDateArrayToString(apiData.updatedAt) : undefined,
    patientNotes: apiData.notes,
    reviewerNotes: apiData.rejectionReason,
  };
};

export interface PrescriptionUpload {
  file: File;
  doctorName: string;
  doctorLicense?: string;
  notes?: string;
}

export interface CustomerStats {
  totalPrescriptions: number;
  pendingPrescriptions: number;
  approvedPrescriptions: number;
  readyForPickup: number;
  completedPrescriptions: number;
  rejectedPrescriptions: number;
  totalSpent: number;
}

export interface PrescriptionApiResponse {
  id: number;
  prescriptionNumber: string;
  doctorName: string;
  doctorLicense?: string;
  prescriptionDate: number[]; // [year, month, day, hour, minute, second, nanosecond]
  fileUrl: string;
  fileName: string;
  fileType: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISPENSED' | 'COMPLETED';
  notes?: string;
  rejectionReason?: string;
  createdAt: number[];
  updatedAt: number[];
  approvedAt?: number[];
  customerId: number;
  customerName: string;
  pharmacistId?: number;
  pharmacistName?: string;
}

export interface Prescription {
  id: number;
  prescriptionNumber: string;
  doctorName: string;
  doctorLicense?: string;
  prescriptionDate: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISPENSED' | 'COMPLETED';
  notes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  uploadedAt: string; // Will be mapped from createdAt
  fileSize?: number; // Optional for now
  reviewedAt?: string; // Will be mapped from updatedAt if status is not PENDING
  patientNotes?: string; // Will be mapped from notes
  reviewerNotes?: string; // Will be mapped from rejectionReason
}

export interface BillItem {
  id?: number;
  medicationName: string;
  manufacturer?: string;
  batchNumber?: string;
  strength?: string; 
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  dosage?: string;
  instructions?: string;
}

export interface Bill {
  id: number;
  billNumber: string;
  subtotal: number;
  discount?: number;
  tax?: number;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';
  paymentMethod?: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'ONLINE' | 'OTHER';
  paymentType?: 'ONLINE' | 'PAY_ON_PICKUP';
  notes?: string;
  billItems?: BillItem[];
  createdAt: string;
  updatedAt?: string;
  paidAt?: string;
  customerId?: number;
  customerName?: string;
  prescriptionId?: number;
  prescriptionNumber?: string;
  prescription?: Prescription;
  shippingDetails?: ShippingDetails;
}

export interface ShippingDetails {
  recipientName: string;
  contactPhone: string;
  alternatePhone?: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  deliveryInstructions?: string;
  preferredDeliveryTime?: string;
  deliveryFee?: number;
}

export interface PaymentData {
  paymentMethod: string;
  cardNumber?: string;
  cvv?: string;
  expiryDate?: string;
  cardHolderName?: string;
  shippingDetails?: ShippingDetails;
}

export interface CustomerProfile {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
}

class CustomerService {
  // Dashboard Stats
  async getDashboardStats(): Promise<CustomerStats> {
    try {
      const response = await api.get('/customer/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  // Prescription Upload
  async uploadPrescription(uploadData: PrescriptionUpload): Promise<any> {
    try {
      console.log('Creating FormData with upload data:', {
        fileName: uploadData.file.name,
        fileSize: uploadData.file.size,
        fileType: uploadData.file.type,
        doctorName: uploadData.doctorName,
        doctorLicense: uploadData.doctorLicense,
        notes: uploadData.notes
      });

      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('doctorName', uploadData.doctorName);
      if (uploadData.doctorLicense) {
        formData.append('doctorLicense', uploadData.doctorLicense);
      }
      if (uploadData.notes) {
        formData.append('notes', uploadData.notes);
      }

      // Debug FormData contents
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}:`, {
            name: value.name,
            size: value.size,
            type: value.type,
            lastModified: value.lastModified
          });
        } else {
          console.log(`${key}:`, value);
        }
      }

      console.log('Making API request to /customer/prescriptions/upload');
      const response = await api.post(
        '/customer/prescriptions/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      console.log('Upload successful, response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error uploading prescription:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      }
      throw error;
    }
  }

  // Get My Prescriptions
  async getMyPrescriptions(): Promise<Prescription[]> {
    try {
      const response = await api.get('/customer/prescriptions');
      const apiData: PrescriptionApiResponse[] = response.data;
      
      // Transform the API data to match our expected format
      return apiData.map(transformPrescriptionData);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      throw error;
    }
  }

  // Get My Pending Prescriptions
  async getMyPendingPrescriptions(): Promise<Prescription[]> {
    try {
      const response = await api.get('/customer/prescriptions/pending');
      const apiData: PrescriptionApiResponse[] = response.data;
      
      console.log('Raw pending prescriptions from API:', apiData);
      
      // Transform the API data to match our expected format
      const transformedData = apiData.map(transformPrescriptionData);
      
      console.log('Transformed pending prescriptions:', transformedData);
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching pending prescriptions:', error);
      throw error;
    }
  }

  // Get Prescription by ID
  async getPrescriptionById(id: number): Promise<Prescription> {
    try {
      const response = await api.get(`/customer/prescriptions/${id}`);
      const apiData: PrescriptionApiResponse = response.data;
      
      // Transform the API data to match our expected format
      return transformPrescriptionData(apiData);
    } catch (error) {
      console.error('Error fetching prescription:', error);
      throw error;
    }
  }

  // Get Purchase History
  async getPurchaseHistory(): Promise<Bill[]> {
    try {
      const response = await api.get('/customer/purchase-history');
      return response.data;
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      throw error;
    }
  }

  // Get Bill by ID
  async getBillById(id: number): Promise<Bill> {
    try {
      const response = await api.get(`/customer/bills/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bill:', error);
      throw error;
    }
  }

  // Get Profile
  async getProfile(): Promise<CustomerProfile> {
    try {
      const response = await api.get('/customer/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  // Update Profile
  async updateProfile(profileData: Partial<CustomerProfile>): Promise<any> {
    try {
      const response = await api.put(
        '/customer/profile',
        profileData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Helper method to get status badge color
  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'orange';
      case 'APPROVED':
        return 'blue';
      case 'REJECTED':
        return 'red';
      case 'DISPENSED':
        return 'green';
      case 'COMPLETED':
        return 'gray';
      default:
        return 'default';
    }
  }

  // Helper method to get payment status color
  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'orange';
      case 'PAID':
        return 'green';
      case 'PARTIALLY_PAID':
        return 'blue';
      case 'CANCELLED':
        return 'red';
      default:
        return 'default';
    }
  }

  // ============================================================================
  // Bill Notification Methods
  // ============================================================================

  /**
   * Check for recent bill notifications
   */
  async getRecentBillNotifications(): Promise<{
    hasNewBills: boolean;
    newBillsCount: number;
    newBills?: Array<{
      billId: number;
      billNumber: string;
      prescriptionNumber: string;
      amount: number;
      createdAt: string;
    }>;
  }> {
    try {
      const response = await api.get('/customer/bills/recent-notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching recent bill notifications:', error);
      throw error;
    }
  }

  // ============================================================================
  // Enhanced Prescription Completion Methods
  // ============================================================================

  /**
   * Download receipt for completed prescription
   */
  async downloadReceipt(prescriptionId: number): Promise<any> {
    try {
      const response = await api.get(`/customer/prescriptions/${prescriptionId}/receipt`);
      return response.data;
    } catch (error) {
      console.error('Error downloading receipt:', error);
      throw new Error('Failed to download receipt');
    }
  }

  /**
   * Get completion details for customer's prescription
   */
  async getCompletionDetails(prescriptionId: number): Promise<any> {
    try {
      const response = await api.get(`/customer/prescriptions/${prescriptionId}/completion-details`);
      return response.data;
    } catch (error) {
      console.error('Error getting completion details:', error);
      throw new Error('Failed to get completion details');
    }
  }

  /**
   * Check if prescription has receipt available
   */
  isReceiptAvailable(prescription: Prescription): boolean {
    return prescription.status === 'COMPLETED';
  }

  /**
   * Get completion instructions from prescription
   */
  getCompletionInstructions(prescription: Prescription): string | null {
    if (prescription.status === 'COMPLETED' && prescription.notes) {
      // Extract completion instructions from notes
      const match = /Completion Instructions:\s*([^\n]*)/.exec(prescription.notes);
      return match ? match[1].trim() : null;
    }
    return null;
  }

  /**
   * Get follow-up date from prescription
   */
  getFollowUpDate(prescription: Prescription): string | null {
    if (prescription.status === 'COMPLETED' && prescription.notes) {
      // Extract follow-up date from notes
      const match = /Follow-up Date:\s*([^\n]*)/.exec(prescription.notes);
      return match ? match[1].trim() : null;
    }
    return null;
  }

  // ============================================================================
  // Payment Methods
  // ============================================================================

  /**
   * Get customer bills
   */
  async getMyBills(): Promise<Bill[]> {
    try {
      const response = await api.get('/customer/bills');
      // Transform the data to match our Bill interface
      return response.data.map(transformBillData);
    } catch (error) {
      console.error('Error fetching customer bills:', error);
      throw error;
    }
  }

  /**
   * Update payment type for a bill
   */
  async updatePaymentType(billId: number, paymentType: 'ONLINE' | 'PAY_ON_PICKUP'): Promise<void> {
    try {
      await api.put(`/customer/bills/${billId}/payment-type`, {
        paymentType
      });
    } catch (error) {
      console.error('Error updating payment type:', error);
      throw error;
    }
  }

  /**
   * Process online payment for a bill
   */
  async payOnline(billId: number, paymentData: PaymentData): Promise<{
    billId: number;
    amount: number;
    paymentStatus: string;
    transactionId: string;
  }> {
    try {
      const response = await api.post(`/customer/bills/${billId}/pay-online`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error processing online payment:', error);
      throw error;
    }
  }

  /**
   * Get payment details for a bill
   */
  async getPaymentDetails(billId: number): Promise<{
    billId: number;
    billNumber: string;
    totalAmount: number;
    paymentStatus: string;
    paymentType: string;
    paymentMethod?: string;
    paidAt?: string;
    createdAt: string;
  }> {
    try {
      const response = await api.get(`/customer/bills/${billId}/payment-details`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment details:', error);
      throw error;
    }
  }

  /**
   * Get customer's order history
   */
  async getOrderHistory(): Promise<Order[]> {
    try {
      const response = await api.get('/customer/orders');
      return response.data.map((order: any) => transformOrderData(order));
    } catch (error) {
      console.error('Error fetching order history:', error);
      throw error;
    }
  }

  /**
   * Get tracking information for a specific order
   */
  async getOrderTracking(orderId: string): Promise<OrderTracking> {
    try {
      const response = await api.get(`/customer/orders/${orderId}/tracking`);
      return transformTrackingData(response.data);
    } catch (error) {
      console.error('Error fetching order tracking:', error);
      throw error;
    }
  }

  // Download bill as PDF
  async downloadBill(billId: number): Promise<void> {
    try {
      const response = await api.get(`/customer/bills/${billId}/download`, {
        responseType: 'blob',
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `bill-${billId}.pdf`;
      if (contentDisposition && contentDisposition.includes('filename=')) {
        filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading bill:', error);
      throw error;
    }
  }
}

// Transform API order data to frontend Order format
const transformOrderData = (apiData: any): Order => {
  return {
    key: apiData.orderId,
    orderId: apiData.orderId,
    billId: apiData.billId,
    date: apiData.date,
    prescriptionId: apiData.prescriptionId,
    doctorName: apiData.doctorName,
    items: apiData.items ? apiData.items.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      manufacturer: item.manufacturer,
      instructions: item.instructions,
      dosage: item.dosage,
      frequency: item.frequency
    })) : [],
    status: apiData.status,
    statusCode: getStatusCode(apiData.status),
    total: apiData.total || 0,
    shippingCost: apiData.shippingCost || 0,
    discount: apiData.discount || 0,
    tax: apiData.tax || 0,
    netTotal: apiData.netTotal || 0,
    estimatedDelivery: apiData.estimatedDelivery,
    actualDelivery: apiData.actualDelivery,
    trackingNumber: apiData.trackingNumber,
    courier: apiData.courier || 'PhillDesk Delivery',
    shippingAddress: apiData.shippingAddress,
    paymentMethod: apiData.paymentMethod,
    paymentStatus: apiData.paymentStatus,
    orderNotes: apiData.orderNotes,
    canReorder: apiData.canReorder || false,
    rating: undefined,
    feedback: undefined
  };
};

// Transform API tracking data to frontend format
const transformTrackingData = (apiData: any): OrderTracking => {
  return {
    orderId: apiData.orderId,
    prescriptionNumber: apiData.prescriptionNumber,
    trackingNumber: apiData.trackingNumber,
    courier: apiData.courier || 'PhillDesk Delivery',
    shippingStatus: apiData.shippingStatus,
    estimatedDelivery: apiData.estimatedDelivery,
    actualDelivery: apiData.actualDelivery,
    timeline: apiData.timeline ? apiData.timeline.map((item: any) => ({
      status: item.status,
      description: item.description,
      timestamp: item.timestamp,
      completed: item.completed
    })) : []
  };
};

// Helper function to map status to status code
const getStatusCode = (status: string): number => {
  switch (status) {
    case 'Processing': return 1;
    case 'Confirmed': return 2;
    case 'Shipped': return 3;
    case 'In Transit': return 3;
    case 'Delivered': return 4;
    case 'Cancelled': return -1;
    default: return 0;
  }
};

// Define Order and related interfaces
interface Order {
  key: string;
  orderId: string;
  billId: number;
  date: string;
  prescriptionId: string;
  doctorName: string;
  items: OrderItem[];
  status: string;
  statusCode: number;
  total: number;
  shippingCost: number;
  discount: number;
  tax: number;
  netTotal: number;
  estimatedDelivery?: string;
  actualDelivery?: string;
  trackingNumber?: string;
  courier: string;
  shippingAddress?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  orderNotes?: string;
  canReorder: boolean;
  rating?: number;
  feedback?: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  manufacturer: string;
  instructions?: string;
  dosage?: string;
  frequency?: string;
}

interface OrderTracking {
  orderId: string;
  prescriptionNumber: string;
  trackingNumber?: string;
  courier?: string;
  shippingStatus?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  timeline: TrackingEvent[];
}

interface TrackingEvent {
  status: string;
  description: string;
  timestamp?: string;
  completed: boolean;
}

export default new CustomerService();
