import React, { useState, useEffect, useRef } from 'react'
import {
  Table,
  Input,
  Button,
  Select,
  InputNumber,
  AutoComplete,
  Space,
  Tag,
  Popconfirm,
  Alert,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  message,
  Spin
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  WarningOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons'
import prescriptionItemsService, { 
  Medicine, 
  PrescriptionItem, 
  PrescriptionItemDTO 
} from '../../services/prescriptionItemsService'

const { Text } = Typography
const { Option } = Select
const { TextArea } = Input

interface PrescriptionItemsManagerProps {
  prescriptionId?: number
  initialItems?: PrescriptionItem[]
  onItemsChange?: (items: PrescriptionItem[], total: number) => void
  editable?: boolean
  showHeader?: boolean
  taxRate?: number
}

const PrescriptionItemsManager: React.FC<PrescriptionItemsManagerProps> = ({
  prescriptionId,
  initialItems = [],
  onItemsChange,
  editable = true,
  showHeader = true,
  taxRate = 0.1
}) => {
  const [items, setItems] = useState<PrescriptionItem[]>(initialItems)
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [medicineOptions, setMedicineOptions] = useState<Array<{ value: string; label: React.ReactNode; medicine: Medicine }>>([])
  const searchTimeoutRef = useRef<number>()

  useEffect(() => {
    if (prescriptionId) {
      loadPrescriptionItems()
    }
    loadCategories()
  }, [prescriptionId])

  useEffect(() => {
    if (onItemsChange) {
      const pricing = prescriptionItemsService.calculatePricing(items, taxRate)
      onItemsChange(items, pricing.total)
    }
  }, [items, onItemsChange, taxRate])

  const loadPrescriptionItems = async () => {
    if (!prescriptionId) return

    try {
      setLoading(true)
      const prescriptionItems = await prescriptionItemsService.getPrescriptionItems(prescriptionId)
      setItems(prescriptionItems)
    } catch (error) {
      console.error('Error loading prescription items:', error)
      message.error('Failed to load prescription items')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const categoryList = await prescriptionItemsService.getMedicineCategories()
      setCategories(categoryList)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const searchMedicines = async (query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      if (!query || query.length < 2) {
        setMedicineOptions([])
        return
      }

      try {
        setSearchLoading(true)
        const results = await prescriptionItemsService.searchMedicines(query)
        const options = results.map(medicine => ({
          value: prescriptionItemsService.formatMedicineName(medicine),
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div><Text strong>{medicine.name}</Text></div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {medicine.strength} • {medicine.dosageForm} • {medicine.manufacturer}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Text type="success">${medicine.unitPrice.toFixed(2)}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  Stock: {medicine.quantity}
                </Text>
              </div>
            </div>
          ),
          medicine
        }))
        setMedicineOptions(options)
      } catch (error) {
        console.error('Error searching medicines:', error)
        setMedicineOptions([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)
  }

  const handleAddItem = () => {
    const newItem: PrescriptionItem = {
      medicineId: 0,
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      instructions: '',
      dosageForm: 'Tablet'
    }
    setItems([...items, newItem])
  }

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
  }

  const handleMedicineSelect = async (value: string, option: any, index: number) => {
    if (!option?.medicine) return

    const medicine = option.medicine as Medicine
    const newItems = [...items]
    
    // Check availability
    const isAvailable = await prescriptionItemsService.checkMedicineAvailability(
      medicine.id, 
      newItems[index].quantity || 1
    )

    if (!isAvailable) {
      message.warning(`${medicine.name} has insufficient stock`)
    }

    newItems[index] = {
      ...newItems[index],
      medicineId: medicine.id,
      medicine: medicine,
      unitPrice: medicine.unitPrice,
      totalPrice: medicine.unitPrice * (newItems[index].quantity || 1),
      dosageForm: medicine.dosageForm
    }
    
    setItems(newItems)
  }

  const handleQuantityChange = (value: number | null, index: number) => {
    if (!value || value <= 0) return

    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      quantity: value,
      totalPrice: (newItems[index].unitPrice || 0) * value
    }
    setItems(newItems)

    // Check availability
    if (newItems[index].medicine) {
      prescriptionItemsService.checkMedicineAvailability(
        newItems[index].medicine!.id,
        value
      ).then(isAvailable => {
        if (!isAvailable) {
          message.warning(`${newItems[index].medicine!.name} has insufficient stock for quantity ${value}`)
        }
      })
    }
  }

  const handleUnitPriceChange = (value: number | null, index: number) => {
    if (!value || value <= 0) return

    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      unitPrice: value,
      totalPrice: value * (newItems[index].quantity || 1)
    }
    setItems(newItems)
  }

  const handleInstructionsChange = (value: string, index: number) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      instructions: value
    }
    setItems(newItems)
  }

  const handleDosageFormChange = (value: string, index: number) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      dosageForm: value
    }
    setItems(newItems)
  }

  const handleSaveItems = async () => {
    if (!prescriptionId) {
      message.error('No prescription ID provided')
      return
    }

    // Validate all items
    const invalidItems = items.filter((item, index) => {
      const validation = prescriptionItemsService.validatePrescriptionItem(item)
      if (!validation.isValid) {
        message.error(`Item ${index + 1}: ${validation.errors.join(', ')}`)
        return true
      }
      return false
    })

    if (invalidItems.length > 0) {
      return
    }

    try {
      setLoading(true)
      
      const itemDTOs: PrescriptionItemDTO[] = items.map(item => ({
        medicineId: item.medicineId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        instructions: item.instructions
      }))

      const savedItems = await prescriptionItemsService.updatePrescriptionItems(prescriptionId, itemDTOs)
      setItems(savedItems)
      
      const pricing = prescriptionItemsService.calculatePricing(savedItems, taxRate)
      message.success(`Items saved! Total: $${pricing.total.toFixed(2)}`)
    } catch (error) {
      console.error('Error saving items:', error)
      message.error('Failed to save prescription items')
    } finally {
      setLoading(false)
    }
  }

  const validateAllItems = async () => {
    if (!prescriptionId) return

    try {
      const unavailableItems = await prescriptionItemsService.validateAvailability(prescriptionId)
      if (unavailableItems.length > 0) {
        message.warning(`${unavailableItems.length} items have insufficient stock`)
      } else {
        message.success('All items are available')
      }
    } catch (error) {
      console.error('Error validating items:', error)
    }
  }

  const loadMedicinesByCategory = async (category: string) => {
    try {
      const medicines = await prescriptionItemsService.getMedicinesByCategory(category)
      // Process medicines for autocomplete if needed
      console.log('Loaded medicines for category:', category, medicines)
    } catch (error) {
      console.error('Error loading medicines by category:', error)
    }
  }

  const pricing = prescriptionItemsService.calculatePricing(items, taxRate)

  const columns = [
    {
      title: 'Medicine',
      key: 'medicine',
      width: 300,
      render: (_: any, record: PrescriptionItem, index: number) => (
        <AutoComplete
          style={{ width: '100%' }}
          placeholder="Search and select medicine..."
          options={medicineOptions}
          onSearch={searchMedicines}
          onSelect={(value, option) => handleMedicineSelect(value, option, index)}
          value={record.medicine ? prescriptionItemsService.formatMedicineName(record.medicine) : ''}
          notFoundContent={searchLoading ? <Spin size="small" /> : 'No medicines found'}
          disabled={!editable}
        />
      )
    },
    {
      title: 'Form',
      key: 'dosageForm',
      width: 120,
      render: (_: any, record: PrescriptionItem, index: number) => (
        <Select
          value={record.dosageForm}
          onChange={(value) => handleDosageFormChange(value, index)}
          style={{ width: '100%' }}
          disabled={!editable}
        >
          <Option value="Tablet">Tablet</Option>
          <Option value="Capsule">Capsule</Option>
          <Option value="Syrup">Syrup</Option>
          <Option value="Injection">Injection</Option>
          <Option value="Cream">Cream</Option>
          <Option value="Drops">Drops</Option>
          <Option value="Powder">Powder</Option>
          <Option value="Ointment">Ointment</Option>
        </Select>
      )
    },
    {
      title: 'Qty',
      key: 'quantity',
      width: 80,
      render: (_: any, record: PrescriptionItem, index: number) => (
        <InputNumber
          value={record.quantity}
          onChange={(value) => handleQuantityChange(value, index)}
          min={1}
          style={{ width: '100%' }}
          disabled={!editable}
        />
      )
    },
    {
      title: 'Unit Price',
      key: 'unitPrice',
      width: 120,
      render: (_: any, record: PrescriptionItem, index: number) => (
        <InputNumber
          value={record.unitPrice}
          onChange={(value) => handleUnitPriceChange(value, index)}
          min={0}
          step={0.01}
          prefix="$"
          style={{ width: '100%' }}
          disabled={!editable}
        />
      )
    },
    {
      title: 'Total',
      key: 'totalPrice',
      width: 100,
      render: (_: any, record: PrescriptionItem) => (
        <Text strong>${(record.totalPrice || 0).toFixed(2)}</Text>
      )
    },
    {
      title: 'Instructions',
      key: 'instructions',
      render: (_: any, record: PrescriptionItem, index: number) => (
        <TextArea
          value={record.instructions}
          onChange={(e) => handleInstructionsChange(e.target.value, index)}
          placeholder="e.g., Take 1 tablet twice daily after meals"
          rows={2}
          disabled={!editable}
        />
      )
    },
    ...(editable ? [{
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_: any, record: PrescriptionItem, index: number) => (
        <Popconfirm
          title="Remove this item?"
          onConfirm={() => handleRemoveItem(index)}
        >
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }] : [])
  ]

  return (
    <Card 
      title={showHeader ? (
        <Space>
          <MedicineBoxOutlined />
          Prescription Items Management
          <Tag color="blue">{items.length} items</Tag>
        </Space>
      ) : null}
      extra={editable ? (
        <Space>
          <Button 
            icon={<WarningOutlined />}
            onClick={validateAllItems}
          >
            Check Stock
          </Button>
          <Button 
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveItems}
            loading={loading}
          >
            Save Items
          </Button>
        </Space>
      ) : null}
    >
      {/* Filter Section */}
      {editable && (
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={8}>
            <Select
              placeholder="Filter by category"
              value={selectedCategory}
              onChange={(value) => {
                setSelectedCategory(value)
                if (value) {
                  loadMedicinesByCategory(value)
                }
              }}
              style={{ width: '100%' }}
              allowClear
            >
              {categories.map(category => (
                <Option key={category} value={category}>{category}</Option>
              ))}
            </Select>
          </Col>
          <Col span={16}>
            <Alert
              message="Medicine Search"
              description="Type medicine name, strength, or manufacturer to search. Results show real-time stock and pricing."
              type="info"
              showIcon
              style={{ fontSize: '12px' }}
            />
          </Col>
        </Row>
      )}

      {/* Items Table */}
      <Table
        dataSource={items}
        columns={columns}
        pagination={false}
        size="small"
        scroll={{ x: 1000 }}
        loading={loading}
        rowKey={(record, index) => `item-${index}-${record.medicineId}`}
        footer={editable ? () => (
          <Button
            type="dashed"
            onClick={handleAddItem}
            block
            icon={<PlusOutlined />}
          >
            Add Medicine Item
          </Button>
        ) : undefined}
        summary={() => (
          <Table.Summary>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={editable ? 4 : 3}>
                <Text strong>Subtotal:</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <Text strong>${pricing.subtotal.toFixed(2)}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={editable ? 2 : 1}></Table.Summary.Cell>
            </Table.Summary.Row>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={editable ? 4 : 3}>
                <Text strong>Tax ({(taxRate * 100).toFixed(0)}%):</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <Text strong>${pricing.tax.toFixed(2)}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={editable ? 2 : 1}></Table.Summary.Cell>
            </Table.Summary.Row>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={editable ? 4 : 3}>
                <Text strong style={{ fontSize: '16px' }}>Total:</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                  ${pricing.total.toFixed(2)}
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={editable ? 2 : 1}></Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />

      {/* Pricing Summary */}
      <Row justify="end" style={{ marginTop: '16px' }}>
        <Col>
          <Card size="small" style={{ minWidth: 250 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Items:</Text>
                <Text>{items.length}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Subtotal:</Text>
                <Text>${pricing.subtotal.toFixed(2)}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Tax ({(taxRate * 100).toFixed(0)}%):</Text>
                <Text>${pricing.tax.toFixed(2)}</Text>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong style={{ fontSize: '16px' }}>Total:</Text>
                <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                  ${pricing.total.toFixed(2)}
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Instructions */}
      {items.length === 0 && editable && (
        <Alert
          message="No prescription items added"
          description={
            <div>
              <p>Click "Add Medicine Item" to start adding medicines to this prescription.</p>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>Search for medicines by name, strength, or manufacturer</li>
                <li>Quantities are checked against current stock levels</li>
                <li>Prices are automatically populated from inventory</li>
                <li>Instructions help guide patient medication usage</li>
              </ul>
            </div>
          }
          type="info"
          showIcon
        />
      )}
    </Card>
  )
}

export default PrescriptionItemsManager
