/**
 * Type definitions for PhillDesk application
 * 
 * This file contains all the TypeScript interfaces and types used throughout
 * the application for type safety and better development experience.
 */

import React from 'react';

// ============================================================================
// Authentication & User Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'ADMIN' | 'PHARMACIST' | 'CUSTOMER';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn: number;
}

// Backend API response format
export interface BackendLoginResponse {
  accessToken: string;
  id: number;
  username: string;
  email: string;
  roles: string[];
  tokenType: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: string;
}

// ============================================================================
// Prescription Types
// ============================================================================

export interface Prescription {
  id: string;
  customerId: string;
  customerName: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  status: PrescriptionStatus;
  uploadedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  pharmacistNotes?: string;
  totalAmount?: number;
  billId?: string;
}

export type PrescriptionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface PrescriptionUploadRequest {
  file: File;
  notes?: string;
}

export interface PrescriptionApprovalRequest {
  prescriptionId: string;
  status: 'APPROVED' | 'REJECTED';
  notes?: string;
  medicines?: PrescriptionMedicine[];
}

export interface PrescriptionMedicine {
  medicineId: string;
  quantity: number;
  dosage: string;
  instructions: string;
  price: number;
}

// ============================================================================
// Medicine & Inventory Types
// ============================================================================

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  manufacturer: string;
  category: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  threshold: number; // Low stock threshold
  expiryDate: string;
  batchNumber: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineRequest {
  name: string;
  genericName: string;
  manufacturer: string;
  category: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  threshold: number;
  expiryDate: string;
  batchNumber: string;
}

export interface StockAlert {
  id: string;
  medicineId: string;
  medicineName: string;
  alertType: 'LOW_STOCK' | 'EXPIRY_WARNING' | 'EXPIRED';
  currentQuantity?: number;
  threshold?: number;
  expiryDate?: string;
  daysToExpiry?: number;
  isRead: boolean;
  createdAt: string;
}

// ============================================================================
// Billing Types
// ============================================================================

export interface Bill {
  id: string;
  prescriptionId: string;
  customerId: string;
  customerName: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: BillStatus;
  generatedBy: string;
  generatedAt: string;
  paidAt?: string;
}

export type BillStatus = 'DRAFT' | 'GENERATED' | 'PAID' | 'CANCELLED';

export interface BillItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  dosage?: string;
  instructions?: string;
}

export interface BillRequest {
  prescriptionId: string;
  items: BillItemRequest[];
  discount?: number;
  notes?: string;
}

export interface BillItemRequest {
  medicineId: string;
  quantity: number;
  unitPrice: number;
  dosage?: string;
  instructions?: string;
}

// ============================================================================
// Report Types
// ============================================================================

export interface SalesReport {
  id: string;
  reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  startDate: string;
  endDate: string;
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  topMedicines: TopMedicine[];
  salesByDate: SalesByDate[];
  generatedAt: string;
  generatedBy: string;
}

export interface InventoryReport {
  id: string;
  reportType: 'CURRENT' | 'LOW_STOCK' | 'EXPIRY' | 'CUSTOM';
  totalMedicines: number;
  totalValue: number;
  lowStockItems: number;
  expiringItems: number;
  medicines: InventoryReportItem[];
  generatedAt: string;
  generatedBy: string;
}

export interface TopMedicine {
  medicineId: string;
  medicineName: string;
  quantitySold: number;
  revenue: number;
}

export interface SalesByDate {
  date: string;
  sales: number;
  orders: number;
}

export interface InventoryReportItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  expiryDate: string;
  daysToExpiry: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'EXPIRING' | 'EXPIRED';
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
}

// ============================================================================
// UI Component Props Types
// ============================================================================

export interface TableColumn<T> {
  title: string;
  dataIndex: keyof T;
  key: string;
  render?: (value: any, record: T) => React.ReactNode;
  sorter?: boolean;
  filterable?: boolean;
  width?: number;
}

export interface FilterOptions {
  search?: string;
  status?: string;
  category?: string;
  dateRange?: [string, string];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  size: number;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardStats {
  totalPrescriptions: number;
  pendingPrescriptions: number;
  totalMedicines: number;
  lowStockAlerts: number;
  todaySales: number;
  monthlyRevenue: number;
  totalCustomers: number;
  expiringMedicines: number;
}

export interface DashboardChart {
  name: string;
  value: number;
  date?: string;
}

// ============================================================================
// Form Types
// ============================================================================

export interface FormErrors {
  [key: string]: string | string[];
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string | number }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: number;
  title: string;
  message: string;
  notificationType: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  referenceId?: number;
  referenceType?: string;
  createdAt: string;
  readAt?: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export type NotificationType = 
  | 'LOW_STOCK'
  | 'EXPIRY_ALERT'
  | 'PRESCRIPTION_UPLOADED'
  | 'PRESCRIPTION_APPROVED'
  | 'PRESCRIPTION_REJECTED'
  | 'BILL_GENERATED'
  | 'SYSTEM_ALERT'
  | 'USER_REGISTRATION';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ScheduledTaskInfo {
  expiredBillsCount: number;
  lowStockMedicinesCount: number;
  expiringMedicinesCount: number;
}

// ============================================================================
// Route Types
// ============================================================================

export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  roles: UserRole[];
  title: string;
  icon?: React.ReactNode;
  children?: RouteConfig[];
}
