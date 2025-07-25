/**
 * Manual Billing Service
 * 
 * Handles API calls for manual billing features including
 * medicine search, inventory checks, and bill generation
 */

import { api } from '../config/index';

export interface Medicine {
  id: string;
  name: string;
  strength: string;
  form: string;
  dosageForm?: string;
  unitPrice: number;
  stock: number;
  quantity?: number;
  category: string;
  manufacturer?: string;
  barcode?: string;
  batchNumber?: string;
}

export interface ManualBillItem {
  id: string;
  medicineId: string;
  medicineName: string;
  strength: string;
  form: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  subtotal: number;
}

export interface Customer {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface ManualBill {
  id?: string;
  billNumber: string;
  customer: Customer;
  items: ManualBillItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  receivedAmount?: number;
  changeAmount?: number;
  createdAt: Date;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
}

class ManualBillingService {
  private readonly basePath = '/pharmacist/manual-billing';


  /**
   * Get all available medicines for manual billing
   */
  async getAllMedicines(): Promise<Medicine[]> {
    try {
      const response = await api.get(`${this.basePath}/medicines`);
      return response.data.medicines || [];
    } catch (error) {
      console.error('Error fetching medicines:', error);
      
      // Return mock data for development
      return this.getMockMedicines();
    }
  }

  /**
   * Search medicines available for manual billing
   */
  async searchMedicines(query: string): Promise<Medicine[]> {
    try {
      const response = await api.get(`/medicines/search/suggestions`, {
        params: { query: query }
      });

      return response.data || [];
    } catch (error) {
      console.error('Error searching medicines:', error);
      
      // Return mock data for development
      return this.getMockMedicines().filter(med => 
        med.name.toLowerCase().includes(query.toLowerCase()) ||
        med.category.toLowerCase().includes(query.toLowerCase())
      );
    }
  }

  /**
   * Check medicine stock availability
   */
  async checkStock(medicineId: string, quantity: number): Promise<{ available: boolean; currentStock: number }> {
    try {
      const response = await api.get(`${this.basePath}/medicines/${medicineId}/stock`, {
        params: { quantity }
      });

      return response.data;
    } catch (error) {
      console.error('Error checking stock:', error);
      
      // Mock response for development
      const medicine = this.getMockMedicines().find(m => m.id === medicineId);
      return {
        available: medicine ? medicine.stock >= quantity : false,
        currentStock: medicine?.stock || 0
      };
    }
  }

  /**
   * Generate manual bill
   */
  async generateBill(billData: Omit<ManualBill, 'id' | 'billNumber' | 'createdAt' | 'status'>): Promise<ManualBill> {
    try {
      const response = await api.post(`${this.basePath}/generate-bill`, billData);
      return response.data;
    } catch (error) {
      console.error('Error generating bill:', error);
      
      // Mock response for development
      const bill: ManualBill = {
        id: `manual-${Date.now()}`,
        billNumber: `MAN-${Date.now()}`,
        ...billData,
        createdAt: new Date(),
        status: 'PAID'
      };
      
      return bill;
    }
  }

  /**
   * Get bill history
   */
  async getBillHistory(filters?: {
    startDate?: Date;
    endDate?: Date;
    customerName?: string;
    status?: string;
  }): Promise<ManualBill[]> {
    try {
      const params: any = {};
      if (filters?.startDate) params.startDate = filters.startDate.toISOString();
      if (filters?.endDate) params.endDate = filters.endDate.toISOString();
      if (filters?.customerName) params.customerName = filters.customerName;
      if (filters?.status) params.status = filters.status;

      const response = await api.get(`${this.basePath}/history`, { params });
      return response.data.bills || [];
    } catch (error) {
      console.error('Error fetching bill history:', error);
      return [];
    }
  }

  /**
   * Print bill
   */
  async printBill(billId: string): Promise<{ success: boolean; printJobId?: string }> {
    try {
      const response = await api.post(`${this.basePath}/${billId}/print`);
      return response.data;
    } catch (error) {
      console.error('Error printing bill:', error);
      return { success: false };
    }
  }

  /**
   * Get popular medicines for quick access
   */
  async getPopularMedicines(): Promise<Medicine[]> {
    try {
      const response = await api.get(`${this.basePath}/medicines/popular`);
      return response.data.medicines || [];
    } catch (error) {
      console.error('Error fetching popular medicines:', error);
      
      // Return subset of mock data
      return this.getMockMedicines().slice(0, 6);
    }
  }

  /**
   * Mock medicine data for development
   */
  private getMockMedicines(): Medicine[] {
    return [
      {
        id: '1',
        name: 'Paracetamol',
        strength: '500mg',
        form: 'Tablet',
        unitPrice: 2.50,
        stock: 100,
        category: 'Pain Relief',
        manufacturer: 'MedCorp',
        barcode: '123456789001'
      },
      {
        id: '2',
        name: 'Ibuprofen',
        strength: '400mg',
        form: 'Tablet',
        unitPrice: 3.75,
        stock: 85,
        category: 'Pain Relief',
        manufacturer: 'PharmaTech',
        barcode: '123456789002'
      },
      {
        id: '3',
        name: 'Aspirin',
        strength: '75mg',
        form: 'Tablet',
        unitPrice: 1.80,
        stock: 120,
        category: 'Cardiovascular',
        manufacturer: 'HealthPlus',
        barcode: '123456789003'
      },
      {
        id: '4',
        name: 'Cough Syrup',
        strength: '100ml',
        form: 'Syrup',
        unitPrice: 8.50,
        stock: 45,
        category: 'Cold & Flu',
        manufacturer: 'WellCare',
        barcode: '123456789004'
      },
      {
        id: '5',
        name: 'Vitamin D3',
        strength: '1000IU',
        form: 'Capsule',
        unitPrice: 12.00,
        stock: 60,
        category: 'Vitamins',
        manufacturer: 'NutriMax',
        barcode: '123456789005'
      },
      {
        id: '6',
        name: 'Antacid',
        strength: '200mg',
        form: 'Chewable',
        unitPrice: 4.25,
        stock: 75,
        category: 'Digestive',
        manufacturer: 'DigestWell',
        barcode: '123456789006'
      },
      {
        id: '7',
        name: 'Multivitamin',
        strength: '30 tablets',
        form: 'Tablet',
        unitPrice: 15.99,
        stock: 40,
        category: 'Vitamins',
        manufacturer: 'VitaLife',
        barcode: '123456789007'
      },
      {
        id: '8',
        name: 'Hand Sanitizer',
        strength: '250ml',
        form: 'Gel',
        unitPrice: 6.50,
        stock: 90,
        category: 'Personal Care',
        manufacturer: 'CleanCare',
        barcode: '123456789008'
      },
      {
        id: '9',
        name: 'Thermometer',
        strength: 'Digital',
        form: 'Device',
        unitPrice: 25.00,
        stock: 15,
        category: 'Medical Devices',
        manufacturer: 'MedTech',
        barcode: '123456789009'
      },
      {
        id: '10',
        name: 'Band-Aid',
        strength: '100 pieces',
        form: 'Adhesive',
        unitPrice: 8.99,
        stock: 65,
        category: 'First Aid',
        manufacturer: 'FirstAid Pro',
        barcode: '123456789010'
      }
    ];
  }
}

export const manualBillingService = new ManualBillingService();
export default manualBillingService;
