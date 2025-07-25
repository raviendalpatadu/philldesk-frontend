/**
 * Add Medicine Modal Component
 * 
 * This component provides a form modal for adding and editing medicines
 * in the admin inventory management system.
 */

import React, { useState, useEffect } from 'react'
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  Button,
  Row,
  Col,
  message,
  Divider
} from 'antd'
import { PlusOutlined, SaveOutlined, EditOutlined } from '@ant-design/icons'
import type { Medicine, MedicineFormData } from '../../services/adminService'
import adminService from '../../services/adminService'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

interface AddMedicineModalProps {
  visible: boolean
  onCancel: () => void
  onSuccess: () => void
  editingMedicine?: Medicine | null
  mode: 'add' | 'edit'
}

const AddMedicineModal: React.FC<AddMedicineModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  editingMedicine,
  mode
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [manufacturers, setManufacturers] = useState<string[]>([])
  const [dosageForms, setDosageForms] = useState<string[]>([])

  // Load dropdown data on mount
  useEffect(() => {
    loadDropdownData()
  }, [])

  // Populate form when editing
  useEffect(() => {
    if (visible && editingMedicine && mode === 'edit') {
      form.setFieldsValue({
        ...editingMedicine,
        expiryDate: editingMedicine.expiryDate ? dayjs(editingMedicine.expiryDate) : null
      })
    } else if (visible && mode === 'add') {
      form.resetFields()
      // Set default values
      form.setFieldsValue({
        quantity: 0,
        reorderLevel: 10,
        isPrescriptionRequired: false,
        isActive: true
      })
    }
  }, [visible, editingMedicine, mode, form])

  // Load dropdown data
  const loadDropdownData = async () => {
    try {
      const [categoriesData, manufacturersData, dosageFormsData] = await Promise.all([
        adminService.getAvailableCategories(),
        adminService.getAvailableManufacturers(),
        adminService.getAvailableDosageForms()
      ])
      
      setCategories(categoriesData)
      setManufacturers(manufacturersData)
      setDosageForms(dosageFormsData)
    } catch (error) {
      console.error('Error loading dropdown data:', error)
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const medicineData: MedicineFormData = {
        ...values,
        expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : undefined
      }

      if (mode === 'edit' && editingMedicine) {
        await adminService.updateMedicine(editingMedicine.id!, medicineData)
        message.success('Medicine updated successfully!')
      } else {
        await adminService.createMedicine(medicineData)
        message.success('Medicine created successfully!')
      }

      form.resetFields()
      onSuccess()
      onCancel()
    } catch (error: any) {
      console.error('Error saving medicine:', error)
      if (error.message.includes('already exists')) {
        message.error(error.message)
      } else {
        message.error(`Failed to ${mode} medicine. Please try again.`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle modal cancel
  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title={
        <span>
          {mode === 'edit' ? <EditOutlined style={{ marginRight: 8 }} /> : <PlusOutlined style={{ marginRight: 8 }} />}
          {mode === 'edit' ? 'Edit Medicine' : 'Add New Medicine'}
        </span>
      }
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading}
          onClick={handleSubmit}
          icon={<SaveOutlined />}
        >
          {mode === 'edit' ? 'Update Medicine' : 'Add Medicine'}
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Medicine Name"
              rules={[
                { required: true, message: 'Please enter medicine name' },
                { min: 2, message: 'Name must be at least 2 characters' }
              ]}
            >
              <Input placeholder="e.g., Paracetamol" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="genericName"
              label="Generic Name"
            >
              <Input placeholder="e.g., Acetaminophen" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="strength"
              label="Strength"
              rules={[{ required: true, message: 'Please enter strength' }]}
            >
              <Input placeholder="e.g., 500mg" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="dosageForm"
              label="Dosage Form"
              rules={[{ required: true, message: 'Please select dosage form' }]}
            >
              <Select
                placeholder="Select form"
                showSearch
                allowClear
                dropdownRender={menu => (
                  <div>
                    {menu}
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ padding: '0 8px 4px' }}>
                      <small>Common forms: Tablet, Capsule, Syrup, Injection</small>
                    </div>
                  </div>
                )}
              >
                {dosageForms.map(form => (
                  <Option key={form} value={form}>{form}</Option>
                ))}
                <Option value="Tablet">Tablet</Option>
                <Option value="Capsule">Capsule</Option>
                <Option value="Syrup">Syrup</Option>
                <Option value="Injection">Injection</Option>
                <Option value="Cream">Cream</Option>
                <Option value="Ointment">Ointment</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: 'Please select category' }]}
            >
              <Select
                placeholder="Select category"
                showSearch
                allowClear
                dropdownRender={menu => (
                  <div>
                    {menu}
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ padding: '0 8px 4px' }}>
                      <small>Common categories: Pain Relief, Antibiotics, Vitamins</small>
                    </div>
                  </div>
                )}
              >
                {categories.map(category => (
                  <Option key={category} value={category}>{category}</Option>
                ))}
                <Option value="Pain Relief">Pain Relief</Option>
                <Option value="Antibiotics">Antibiotics</Option>
                <Option value="Vitamins">Vitamins</Option>
                <Option value="Cardiovascular">Cardiovascular</Option>
                <Option value="Diabetes">Diabetes</Option>
                <Option value="Respiratory">Respiratory</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="manufacturer"
              label="Manufacturer"
              rules={[{ required: true, message: 'Please enter manufacturer' }]}
            >
              <Select
                placeholder="Select or enter manufacturer"
                showSearch
                allowClear
                dropdownRender={menu => (
                  <div>
                    {menu}
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ padding: '0 8px 4px' }}>
                      <small>Enter manufacturer name</small>
                    </div>
                  </div>
                )}
              >
                {manufacturers.map(manufacturer => (
                  <Option key={manufacturer} value={manufacturer}>{manufacturer}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="batchNumber"
              label="Batch Number"
            >
              <Input placeholder="e.g., PC001-2024" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="quantity"
              label="Current Stock"
              rules={[
                { required: true, message: 'Please enter quantity' },
                { type: 'number', min: 0, message: 'Quantity must be non-negative' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0"
                min={0}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="reorderLevel"
              label="Reorder Level"
              rules={[
                { required: true, message: 'Please enter reorder level' },
                { type: 'number', min: 0, message: 'Reorder level must be non-negative' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="10"
                min={0}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="expiryDate"
              label="Expiry Date"
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="Select expiry date"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="unitPrice"
              label="Unit Price ($)"
              rules={[
                { required: true, message: 'Please enter unit price' },
                { type: 'number', min: 0, message: 'Price must be non-negative' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0.00"
                min={0}
                step={0.01}
                precision={2}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="costPrice"
              label="Cost Price ($)"
              rules={[
                { type: 'number', min: 0, message: 'Cost price must be non-negative' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0.00"
                min={0}
                step={0.01}
                precision={2}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea
            rows={3}
            placeholder="Enter medicine description, usage instructions, or additional notes..."
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="isPrescriptionRequired"
              label="Prescription Required"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="isActive"
              label="Active"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

export default AddMedicineModal
