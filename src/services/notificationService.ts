import { message, notification } from 'antd'
import { DollarOutlined, BellOutlined } from '@ant-design/icons'
import React from 'react'

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
    notification.warning({
      message: 'Prescription Requires Attention',
      description: `Your prescription ${prescriptionNumber} needs clarification. ${reason ? `Reason: ${reason}` : 'Please check your prescription details.'}`,
      placement: 'topRight',
      duration: 10,
    })
  }
}

export const notificationService = new NotificationService()
export default notificationService
