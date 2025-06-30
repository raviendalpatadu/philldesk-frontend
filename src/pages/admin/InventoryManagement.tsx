import React from 'react'
import { Typography } from 'antd'

const { Title } = Typography

const InventoryManagement: React.FC = () => {
  return (
    <div>
      <Title level={2}>Inventory Management</Title>
      <p>This page will allow management of medicine inventory, stock levels, and expiry tracking.</p>
    </div>
  )
}

export default InventoryManagement
