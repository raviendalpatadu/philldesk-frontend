import React from 'react'
import { Card, Typography, Alert } from 'antd'
import PrescriptionItemsManager from '../../components/prescription/PrescriptionItemsManager'

const { Title } = Typography

/**
 * Test page for PrescriptionItemsManager component
 * This page is used to test the prescription items functionality in isolation
 */
const PrescriptionItemsTest: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Prescription Items Manager Test</Title>
      
      <Alert
        message="Test Component"
        description="This page tests the PrescriptionItemsManager component functionality including medicine search, selection, and calculation."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Card title="Test with No Prescription ID (New Items Only)">
        <PrescriptionItemsManager
          prescriptionId={undefined}
          initialItems={[]}
          onItemsChange={(items, total) => {
            console.log('Test: Items changed:', items)
            console.log('Test: Total:', total)
          }}
          editable={true}
          showHeader={true}
          taxRate={0.1}
        />
      </Card>

      <Card title="Test with Mock Prescription ID" style={{ marginTop: '24px' }}>
        <PrescriptionItemsManager
          prescriptionId={999}
          initialItems={[]}
          onItemsChange={(items, total) => {
            console.log('Test: Items changed:', items)
            console.log('Test: Total:', total)
          }}
          editable={true}
          showHeader={true}
          taxRate={0.1}
        />
      </Card>
    </div>
  )
}

export default PrescriptionItemsTest
