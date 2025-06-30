import React from 'react'
import { Typography } from 'antd'

const { Title } = Typography

const PrescriptionManagement: React.FC = () => {
  return (
    <div>
      <Title level={2}>Prescription Management</Title>
      <p>This page will allow pharmacists to manage and approve prescriptions.</p>
    </div>
  )
}

export default PrescriptionManagement
