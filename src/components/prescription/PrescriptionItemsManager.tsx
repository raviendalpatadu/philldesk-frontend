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
  prescriptionStatus?: string // Add prescription status to control editing
}

const PrescriptionItemsManager: React.FC<PrescriptionItemsManagerProps> = ({
  prescriptionId,
  initialItems = [],
  onItemsChange,
  editable = true,
  showHeader = true,
  prescriptionStatus = 'PENDING'
}) => {
  const [items, setItems] = useState<PrescriptionItem[]>(initialItems)
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [medicineOptions, setMedicineOptions] = useState<Array<{ value: string; label: React.ReactNode; medicine: Medicine }>>([])
  const [itemsToDelete, setItemsToDelete] = useState<Set<number>>(new Set()) // Track items marked for deletion
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Check if editing is allowed based on prescription status
  const isEditingAllowed = editable && (prescriptionStatus === 'PENDING' || prescriptionStatus === 'Pending Review')

  useEffect(() => {
    if (prescriptionId) {
      loadPrescriptionItems()
    }
    loadCategories()
  }, [prescriptionId])

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const loadPrescriptionItems = async () => {
    if (!prescriptionId) return

    try {
      setLoading(true)
      console.log('Loading prescription items for ID:', prescriptionId)
      const prescriptionItems = await prescriptionItemsService.getPrescriptionItems(prescriptionId)
      console.log('Loaded prescription items:', prescriptionItems)
      setItems(prescriptionItems)
    } catch (error) {
      console.error('Error loading prescription items:', error)
      message.error('Failed to load prescription items. Please refresh and try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      console.log('Loading medicine categories...')
      const categoryList = await prescriptionItemsService.getMedicineCategories()
      console.log('Loaded categories:', categoryList)
      setCategories(categoryList)
    } catch (error) {
      console.error('Error loading categories:', error)
      message.error('Failed to load medicine categories')
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
        console.log('Searching medicines with query:', query)
        const results = await prescriptionItemsService.searchMedicines(query)
        console.log('Search results:', results)
        
        const options = results.map(medicine => ({
          value: medicine.id.toString(),
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
        console.log('Medicine options set:', options.length)
      } catch (error) {
        console.error('Error searching medicines:', error)
        setMedicineOptions([])
        message.error('Failed to search medicines. Please check your connection.')
      } finally {
        setSearchLoading(false)
      }
    }, 300)
  }

  const handleAddItem = () => {
    const newItem: PrescriptionItem = {
      medicineId: 0,
      quantity: 1,
      dosage: '',
      frequency: '',
      instructions: '',
      unitPrice: 0,
      totalPrice: 0,
      isDispensed: false
    }
    setItems([...items, newItem])
    console.log('Added new item. Total items:', items.length + 1)
  }

  const handleRemoveItem = (index: number) => {
    const item = items[index]
    
    if (item.id) {
      // Existing item: mark for deletion
      setItemsToDelete(prev => new Set([...prev, item.id!]))
      message.info('Item marked for deletion. Click "Save Items" to confirm changes.')
    }
    
    // Remove from current items list (both new and existing items)
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
  }

  const handleMedicineSelect = async (_value: string, option: any, index: number) => {
    if (!option?.medicine) {
      console.error('No medicine found in option:', option)
      return
    }

    const medicine = option.medicine as Medicine
    const newItems = [...items]
    
    console.log('Selecting medicine:', medicine.name, 'for index:', index)
    
    // Check availability
    try {
      const isAvailable = await prescriptionItemsService.checkMedicineAvailability(
        medicine.id, 
        newItems[index].quantity || 1
      )

      if (!isAvailable) {
        message.warning(`${medicine.name} has insufficient stock`)
      }
    } catch (error) {
      console.error('Error checking availability:', error)
      message.warning('Could not verify stock availability')
    }

    newItems[index] = {
      ...newItems[index],
      medicineId: medicine.id,
      medicine: medicine,
      unitPrice: medicine.unitPrice,
      totalPrice: medicine.unitPrice * (newItems[index].quantity || 1),
      dosage: `Take as directed with ${medicine.dosageForm}`,
      frequency: 'As needed'
    }
    
    setItems(newItems)
    console.log('Updated items:', newItems)
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

    // Check availability if medicine is selected
    if (newItems[index].medicineId && newItems[index].medicineId > 0) {
      prescriptionItemsService.checkMedicineAvailability(
        newItems[index].medicineId,
        value
      ).then(isAvailable => {
        if (!isAvailable) {
          const medicineName = newItems[index].medicineName || newItems[index].medicine?.name || 'Selected medicine'
          message.warning(`${medicineName} has insufficient stock for quantity ${value}`)
        }
      }).catch(error => {
        console.error('Error checking availability:', error)
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

  const handleDosageChange = (value: string, index: number) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      dosage: value
    }
    setItems(newItems)
  }

  const handleFrequencyChange = (value: string, index: number) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      frequency: value
    }
    setItems(newItems)
  }

  const handleSaveItems = async () => {
    if (!prescriptionId) {
      message.error('No prescription ID provided')
      return
    }

    if (!isEditingAllowed) {
      message.error('Cannot modify items. Prescription is not in pending status.')
      return
    }

    try {
      setLoading(true)
      
      // Step 1: Delete items marked for deletion
      if (itemsToDelete.size > 0) {
        console.log('Deleting items:', Array.from(itemsToDelete))
        for (const itemId of itemsToDelete) {
          try {
            await prescriptionItemsService.deletePrescriptionItem(itemId)
            console.log('Deleted item:', itemId)
          } catch (error) {
            console.error('Error deleting item:', itemId, error)
            message.error(`Failed to delete item ID ${itemId}`)
          }
        }
        setItemsToDelete(new Set()) // Clear deletion list
      }

      // Step 2: Filter out empty items (items with no medicine selected)
      const validItems = items.filter(item => item.medicineId && item.medicineId > 0)
      
      if (validItems.length === 0 && itemsToDelete.size === 0) {
        message.warning('No valid items to save')
        return
      }

      // Step 3: Validate all valid items
      const invalidItems = validItems.filter((item, index) => {
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

      // Step 4: Save/Update items (bulk update handles both new and existing items)
      let savedItems: PrescriptionItem[] = []
      if (validItems.length > 0) {
        const itemDTOs: PrescriptionItemDTO[] = validItems.map(item => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          dosage: item.dosage || '',
          frequency: item.frequency || '',
          instructions: item.instructions,
          unitPrice: item.unitPrice
        }))

        console.log('Saving prescription items:', itemDTOs)
        savedItems = await prescriptionItemsService.updatePrescriptionItems(prescriptionId, itemDTOs)
        console.log('Saved items response:', savedItems)
      }
      
      // Step 5: Update local state
      setItems(savedItems)
      
      const pricing = prescriptionItemsService.calculatePricing(savedItems)
      
      // Step 6: Notify parent component
      if (onItemsChange) {
        console.log('Notifying parent of saved items:', savedItems.length, 'Total:', pricing.total)
        onItemsChange(savedItems, pricing.total)
      }
      
      const deletedCount = itemsToDelete.size
      const actionMessage = deletedCount > 0 
        ? `Items saved successfully! ${deletedCount} item(s) deleted. Total: Rs.${pricing.total.toFixed(2)}`
        : `Items saved successfully! Total: Rs.${pricing.total.toFixed(2)}`
      
      message.success(actionMessage)
      
    } catch (error) {
      console.error('Error saving items:', error)
      // Show more detailed error message
      if (error instanceof Error) {
        message.error(`Failed to save prescription items: ${error.message}`)
      } else {
        message.error('Failed to save prescription items. Please check the console for details.')
      }
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

  const pricing = prescriptionItemsService.calculatePricing(items)

  const getAutocompleteValue = (record: PrescriptionItem) => {
    // Handle new response format with direct medicine fields
    if (record.medicineName && record.medicineStrength && record.dosageForm) {
      return `${record.medicineName} ${record.medicineStrength} (${record.dosageForm})`
    }
    // Handle old format with nested medicine object
    if (!record.medicine) return undefined
    const formattedName = prescriptionItemsService.formatMedicineName(record.medicine)
    console.log('Autocomplete value for record:', record, 'formatted name:', formattedName)
    return formattedName
  }

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
          onChange={(value) => {
            // Handle typing in the autocomplete
            if (!value) {
              const newItems = [...items]
              newItems[index] = {
                ...newItems[index],
                medicineId: 0,
                medicineName: undefined,
                medicineStrength: undefined,
                dosageForm: undefined,
                medicine: undefined,
                unitPrice: 0,
                totalPrice: 0
              }
              setItems(newItems)
            }
          }}
          value={getAutocompleteValue(record)}
          notFoundContent={searchLoading ? <Spin size="small" /> : 'No medicines found'}
          disabled={!isEditingAllowed}
          allowClear
          showSearch
          filterOption={false}
          onClear={() => {
            const newItems = [...items]
            newItems[index] = {
              ...newItems[index],
              medicineId: 0,
              medicineName: undefined,
              medicineStrength: undefined,
              dosageForm: undefined,
              medicine: undefined,
              unitPrice: 0,
              totalPrice: 0
            }
            setItems(newItems)
          }}
        />
      )
    },
    {
      title: 'Dosage',
      key: 'dosage',
      width: 200,
      render: (_: any, record: PrescriptionItem, index: number) => (
        <TextArea
          value={record.dosage}
          onChange={(e) => handleDosageChange(e.target.value, index)}
          placeholder="e.g., Take 1 tablet with food"
          rows={2}
          disabled={!isEditingAllowed}
        />
      )
    },
    {
      title: 'Frequency',
      key: 'frequency',
      width: 150,
      render: (_: any, record: PrescriptionItem, index: number) => (
        <Select
          value={record.frequency}
          onChange={(value) => handleFrequencyChange(value, index)}
          style={{ width: '100%' }}
          disabled={!isEditingAllowed}
          placeholder="Select frequency"
        >
          <Option value="Once daily">Once daily</Option>
          <Option value="Twice daily">Twice daily</Option>
          <Option value="Three times daily">Three times daily</Option>
          <Option value="Four times daily">Four times daily</Option>
          <Option value="Every 4 hours">Every 4 hours</Option>
          <Option value="Every 6 hours">Every 6 hours</Option>
          <Option value="Every 8 hours">Every 8 hours</Option>
          <Option value="Every 12 hours">Every 12 hours</Option>
          <Option value="As needed">As needed</Option>
          <Option value="Before meals">Before meals</Option>
          <Option value="After meals">After meals</Option>
          <Option value="At bedtime">At bedtime</Option>
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
          disabled={!isEditingAllowed}
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
          prefix="Rs."
          style={{ width: '100%' }}
          disabled={!isEditingAllowed}
        />
      )
    },
    {
      title: 'Total',
      key: 'totalPrice',
      width: 100,
      render: (_: any, record: PrescriptionItem) => (
        <Text strong>Rs.{(record.totalPrice || 0).toFixed(2)}</Text>
      )
    },
    {
      title: 'Instructions',
      key: 'instructions',
      render: (_: any, record: PrescriptionItem, index: number) => (
        <TextArea
          value={record.instructions}
          onChange={(e) => handleInstructionsChange(e.target.value, index)}
          placeholder="e.g., Additional instructions for patient"
          rows={2}
          disabled={!isEditingAllowed}
        />
      )
    },
    ...(isEditingAllowed ? [{
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_: any, _record: PrescriptionItem, index: number) => (
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
      extra={isEditingAllowed ? (
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
      ) : (
        <Tag color={prescriptionStatus === 'PENDING' ? 'orange' : 'blue'}>
          {prescriptionStatus === 'PENDING' ? 'Pending Review' : prescriptionStatus}
        </Tag>
      )}
    >

      {/* Filter Section */}
      {isEditingAllowed && (
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
        footer={isEditingAllowed ? () => (
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
              <Table.Summary.Cell index={0} colSpan={isEditingAllowed ? 4 : 3}>
                <Text strong>Subtotal:</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <Text strong>Rs{pricing.subtotal.toFixed(2)}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={isEditingAllowed ? 2 : 1}></Table.Summary.Cell>
            </Table.Summary.Row>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={isEditingAllowed ? 4 : 3}>
                <Text strong style={{ fontSize: '16px' }}>Total:</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                  Rs.{pricing.total.toFixed(2)}
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={isEditingAllowed ? 2 : 1}></Table.Summary.Cell>
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
                <Text>Rs.{pricing.subtotal.toFixed(2)}</Text>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong style={{ fontSize: '16px' }}>Total:</Text>
                <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                  Rs.{pricing.total.toFixed(2)}
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Instructions */}
      {items.length === 0 && isEditingAllowed && (
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
