import { message, notification } from 'antd'
import { DollarOutlined, BellOutlined, WarningOutlined, AlertOutlined } from '@ant-design/icons'
import React from 'react'
import { api } from '../config'
import { Notification } from '../types'

interface BillNotification {
  billId: number
  billNumber: string
  prescriptionNumber: string
  amount: number
  createdAt: string
}

class NotificationService {
  
  /**
   * Show notification when a new bill is generated for the customer
   */
  showNewBillNotification(bill: BillNotification) {
    notification.open({
      message: 'New Bill Generated',
      description: `Bill ${bill.billNumber} for prescription ${bill.prescriptionNumber} is ready. Amount: Rs. ${bill.amount.toFixed(2)}`,
      icon: React.createElement(DollarOutlined, { style: { color: '#1890ff' } }),
      placement: 'topRight',
      duration: 8,
      btn: React.createElement('span', 
        { style: { display: 'flex', gap: '8px' } },
        React.createElement('a', 
          { 
            href: "/customer/bills",
            style: { 
              color: '#1890ff', 
              textDecoration: 'none',
              fontSize: '12px'
            }
          },
          'View Bills'
        )
      ),
    })
  }

  /**
   * Show notification when prescription is approved
   */
  showPrescriptionApprovedNotification(prescriptionNumber: string) {
    notification.success({
      message: 'Prescription Approved',
      description: `Your prescription ${prescriptionNumber} has been approved by the pharmacist. A bill will be generated shortly.`,
      placement: 'topRight',
      duration: 6,
    })
  }

  /**
   * Show notification when payment is successful
   */
  showPaymentSuccessNotification(billNumber: string, amount: number, method: string) {
    notification.success({
      message: 'Payment Successful',
      description: `Payment of Rs. ${amount.toFixed(2)} for bill ${billNumber} completed via ${method}.`,
      placement: 'topRight',
      duration: 6,
    })
  }

  /**
   * Show notification when prescription is ready for pickup
   */
  showReadyForPickupNotification(prescriptionNumber: string, paymentType: string) {
    const description = paymentType === 'PAY_ON_PICKUP' 
      ? `Your prescription ${prescriptionNumber} is ready for pickup. Please visit the pharmacy to collect and pay.`
      : `Your prescription ${prescriptionNumber} is ready for pickup.`

    notification.info({
      message: 'Prescription Ready',
      description,
      placement: 'topRight',
      duration: 8,
      icon: React.createElement(BellOutlined, { style: { color: '#52c41a' } }),
    })
  }

  /**
   * Show notification for prescription rejection
   */
  showPrescriptionRejectedNotification(prescriptionNumber: string, reason?: string) {
    const reasonText = reason ? `Reason: ${reason}` : 'Please check your prescription details.'
    notification.warning({
      message: 'Prescription Requires Attention',
      description: `Your prescription ${prescriptionNumber} needs clarification. ${reasonText}`,
      placement: 'topRight',
      duration: 10,
    })
  }

  // ============================================================================
  // Admin Notification Management Methods
  // ============================================================================

  /**
   * Get all notifications for admin dashboard
   */
  async getAllNotifications(page = 0, size = 10): Promise<{ content: Notification[], totalElements: number }> {
    try {
      const response = await api.get('/notifications', {
        params: { page, size }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching notifications:', error)
      message.error('Failed to load notifications')
      throw error
    }
  }

  /**
   * Get notifications by user ID
   */
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    try {
      const response = await api.get(`/notifications/user/${userId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching user notifications:', error)
      message.error('Failed to load user notifications')
      throw error
    }
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotificationsByUserId(userId: number): Promise<Notification[]> {
    try {
      const response = await api.get(`/notifications/user/${userId}/unread`)
      return response.data
    } catch (error) {
      console.error('Error fetching unread notifications:', error)
      throw error
    }
  }

  /**
   * Get notifications by type
   */
  async getNotificationsByType(type: string): Promise<Notification[]> {
    try {
      console.log(`🔍 Fetching notifications by type: ${type}`)
      const response = await api.get(`/notifications/type/${type}`)
      console.log(`📋 Raw API response for type ${type}:`, response)
      console.log(`📋 Notifications data for type ${type}:`, response.data)
      return response.data
    } catch (error) {
      console.error(`Error fetching notifications by type ${type}:`, error)
      message.error('Failed to load notifications')
      throw error
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number): Promise<void> {
    try {
      console.log(`🔄 Making API call to mark notification ${notificationId} as read...`)
      const response = await api.patch(`/notifications/${notificationId}/mark-read`)
      console.log(`✅ API response for marking notification ${notificationId} as read:`, response)
      console.log('✅ Notification marked as read successfully:', notificationId)
    } catch (error) {
      console.error('❌ Error marking notification as read:', error)
      console.error('❌ API call failed for notification:', notificationId)
      throw error
    }
  }

  /**
   * Mark notification as read by type and content (for toast notifications)
   */
  async markAsReadByContent(notificationType: string, contentKeyword: string): Promise<void> {
    try {
      console.log(`🔍 Searching for notifications to mark as read:`, { notificationType, contentKeyword })
      
      // Get notifications by type
      const notifications = await this.getNotificationsByType(notificationType)
      console.log(`📋 Found ${notifications.length} notifications of type ${notificationType}:`, notifications)
      
      // Find unread notifications matching the content
      const unreadNotifications = notifications.filter(n => {
        const isUnread = !n.isRead
        const titleMatch = n.title.toLowerCase().includes(contentKeyword.toLowerCase())
        const messageMatch = n.message.toLowerCase().includes(contentKeyword.toLowerCase())
        const contentMatch = titleMatch || messageMatch
        
        console.log(`🔍 Checking notification ${n.id}:`, {
          isRead: n.isRead,
          isUnread,
          title: n.title,
          message: n.message,
          titleMatch,
          messageMatch,
          contentMatch,
          shouldInclude: isUnread && contentMatch
        })
        
        return isUnread && contentMatch
      })
      
      console.log(`📝 Found ${unreadNotifications.length} unread notifications matching criteria:`, unreadNotifications)
      
      // Mark the first matching notification as read
      if (unreadNotifications.length > 0) {
        const notificationToMark = unreadNotifications[0]
        console.log(`✅ Marking notification ${notificationToMark.id} as read...`)
        await this.markAsRead(notificationToMark.id)
        console.log(`✅ Successfully marked notification as read: ${notificationType} - ${contentKeyword}`)
      } else {
        console.log(`⚠️ No unread notifications found matching: ${notificationType} - ${contentKeyword}`)
      }
    } catch (error) {
      console.error('❌ Error in markAsReadByContent:', error)
      console.log('Could not find specific notification to mark as read:', error)
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsReadForUser(userId: number): Promise<void> {
    try {
      await api.patch(`/notifications/user/${userId}/mark-all-read`)
      message.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      message.error('Failed to mark all notifications as read')
      throw error
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: number): Promise<void> {
    try {
      await api.delete(`/notifications/${notificationId}`)
      message.success('Notification deleted')
    } catch (error) {
      console.error('Error deleting notification:', error)
      message.error('Failed to delete notification')
      throw error
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCountForUser(userId: number): Promise<number> {
    try {
      const response = await api.get(`/notifications/user/${userId}/unread-count`)
      return response.data
    } catch (error) {
      console.error('Error fetching unread count:', error)
      return 0
    }
  }

  // ============================================================================
  // Scheduled Tasks Management
  // ============================================================================

  /**
   * Manually trigger expired bills processing
   */
  async processExpiredBills(): Promise<string> {
    try {
      const response = await api.post('/admin/scheduled-tasks/process-expired-bills')
      message.success('Expired bills processing triggered')
      return response.data
    } catch (error) {
      console.error('Error processing expired bills:', error)
      message.error('Failed to process expired bills')
      throw error
    }
  }

  /**
   * Get expired bills count
   */
  async getExpiredBillsCount(): Promise<number> {
    try {
      const response = await api.get('/admin/scheduled-tasks/expired-bills-count')
      return response.data
    } catch (error) {
      console.error('Error fetching expired bills count:', error)
      return 0
    }
  }

  /**
   * Manually trigger low stock check
   */
  async checkLowStock(): Promise<string> {
    try {
      const response = await api.post('/admin/scheduled-tasks/check-low-stock')
      message.success('Low stock check triggered')
      return response.data
    } catch (error) {
      console.error('Error checking low stock:', error)
      message.error('Failed to check low stock')
      throw error
    }
  }

  /**
   * Get low stock medicines count
   */
  async getLowStockCount(): Promise<number> {
    try {
      const response = await api.get('/admin/scheduled-tasks/low-stock-count')
      return response.data
    } catch (error) {
      console.error('Error fetching low stock count:', error)
      return 0
    }
  }

  /**
   * Manually trigger expiring medicines check
   */
  async checkExpiringMedicines(): Promise<string> {
    try {
      const response = await api.post('/admin/scheduled-tasks/check-expiring-medicines')
      message.success('Expiring medicines check triggered')
      return response.data
    } catch (error) {
      console.error('Error checking expiring medicines:', error)
      message.error('Failed to check expiring medicines')
      throw error
    }
  }

  /**
   * Get expiring medicines count
   */
  async getExpiringMedicinesCount(): Promise<number> {
    try {
      const response = await api.get('/admin/scheduled-tasks/expiring-medicines-count')
      return response.data
    } catch (error) {
      console.error('Error fetching expiring medicines count:', error)
      return 0
    }
  }

  /**
   * Show system notification for low stock
   */
  showLowStockAlert(medicineName: string, currentStock: number, reorderLevel: number) {
    notification.warning({
      message: 'Low Stock Alert',
      description: `${medicineName} is running low. Current stock: ${currentStock}, Reorder level: ${reorderLevel}`,
      icon: React.createElement(WarningOutlined, { style: { color: '#faad14' } }),
      placement: 'topRight',
      duration: 0, // Don't auto-close
    })
  }

  /**
   * Show system notification for expiring medicines
   */
  showExpiryAlert(medicineName: string, expiryDate: string, batchNumber?: string) {
    const batchInfo = batchNumber ? ` (Batch: ${batchNumber})` : ''
    notification.error({
      message: 'Medicine Expiry Alert',
      description: `${medicineName}${batchInfo} is expiring on ${expiryDate}`,
      icon: React.createElement(AlertOutlined, { style: { color: '#ff4d4f' } }),
      placement: 'topRight',
      duration: 0, // Don't auto-close
    })
  }
}

export const notificationService = new NotificationService()
export default notificationService
