/**
 * Notification Service Hook
 * 
 * Provides notification toast functionality for different user roles
 */

import React from 'react'
import { notification } from 'antd'
import {
  DollarOutlined,
  WarningOutlined,
  AlertOutlined,
} from '@ant-design/icons'
import { useUserRole } from '@store/authStore'
import { notificationService } from '../../services/notificationService'

// Export hook for showing notification toasts
export const useNotificationToasts = (notificationCount: number, onNotificationCountChange: (count: number) => void) => {
  const userRole = useUserRole()

  // Function to mark notification as read
  const markNotificationAsRead = async (notificationType: string, contentKeyword: string) => {
    try {
      console.log(`🎯 Toast notification dismissed - attempting to mark as read:`, { userRole, notificationType, contentKeyword })
      
      if (userRole === 'ADMIN') {
        // For admin users, try to find and mark actual notifications as read
        await notificationService.markAsReadByContent(notificationType, contentKeyword)
      } else {
        console.log(`ℹ️ Skipping API call for non-admin user: ${userRole}`)
      }
      
      console.log(`✅ Completed mark-as-read process: ${notificationType} - ${contentKeyword}`)
    } catch (error) {
      console.error('❌ Error in markNotificationAsRead:', error)
    }
  }

  const showNotifications = () => {
    if (userRole === 'ADMIN') {
      // Show recent admin notifications as toast notifications
      notification.warning({
        message: 'Low Stock Alert',
        description: 'Paracetamol is running low (5 units remaining). Please reorder soon.',
        icon: React.createElement(WarningOutlined, { style: { color: '#faad14' } }),
        placement: 'topRight',
        duration: 8,
        onClose: () => {
          // Mark this notification as read when it disappears
          markNotificationAsRead('LOW_STOCK', 'Paracetamol')
        }
      })

      setTimeout(() => {
        notification.error({
          message: 'Medicine Expiry Alert',
          description: 'Aspirin (Batch: ASP001) is expiring on 2025-08-15',
          icon: React.createElement(AlertOutlined, { style: { color: '#ff4d4f' } }),
          placement: 'topRight',
          duration: 8,
          onClose: () => {
            // Mark this notification as read when it disappears
            markNotificationAsRead('EXPIRY_ALERT', 'Aspirin')
          }
        })
      }, 1000)

      setTimeout(() => {
        notification.info({
          message: 'System Update',
          description: 'PhillDesk system has been updated with new features.',
          placement: 'topRight',
          duration: 6,
          onClose: () => {
            // Mark this notification as read when it disappears
            markNotificationAsRead('SYSTEM_ALERT', 'System Update')
          }
        })
      }, 2000)

      // Update notification count to show they've been "viewed"
      onNotificationCountChange(Math.max(0, notificationCount - 3))
    } else if (userRole === 'PHARMACIST') {
      // Show recent pharmacist notifications as toast notifications
      notification.warning({
        message: 'Low Stock Alert',
        description: 'Ibuprofen is running low (3 units remaining)',
        icon: React.createElement(WarningOutlined, { style: { color: '#faad14' } }),
        placement: 'topRight',
        duration: 8,
        onClose: () => {
          // Mark this notification as read when it disappears
          markNotificationAsRead('LOW_STOCK', 'Ibuprofen')
        }
      })

      setTimeout(() => {
        notification.info({
          message: 'New Prescription',
          description: 'Prescription P-2025-001 has been submitted for review.',
          placement: 'topRight',
          duration: 6,
          onClose: () => {
            // Mark this notification as read when it disappears
            markNotificationAsRead('PRESCRIPTION_UPLOADED', 'P-2025-001')
          }
        })
      }, 1000)

      // Update notification count
      onNotificationCountChange(Math.max(0, notificationCount - 2))
    } else if (userRole === 'CUSTOMER') {
      // Show recent customer notifications as toast notifications
      notification.success({
        message: 'Prescription Approved',
        description: 'Your prescription P-2025-001 has been approved. A bill will be generated shortly.',
        placement: 'topRight',
        duration: 6,
        onClose: () => {
          // Mark this notification as read when it disappears
          markNotificationAsRead('PRESCRIPTION_APPROVED', 'P-2025-001')
        }
      })

      setTimeout(() => {
        notification.open({
          message: 'New Bill Generated',
          description: 'Bill B-2025-001 for prescription P-2025-001 is ready. Amount: Rs. 450.00',
          icon: React.createElement(DollarOutlined, { style: { color: '#1890ff' } }),
          placement: 'topRight',
          duration: 8,
          onClose: () => {
            // Mark this notification as read when it disappears
            markNotificationAsRead('BILL_GENERATED', 'B-2025-001')
          }
        })
      }, 1500)

      // Update notification count
      onNotificationCountChange(Math.max(0, notificationCount - 2))
    }
  }

  return { showNotifications }
}

// Default export for compatibility
export default useNotificationToasts
