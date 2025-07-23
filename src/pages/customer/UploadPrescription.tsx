/**
 * Upload Prescription Page
 * 
 * This component provides a dedicated interface for customers to upload
 * new prescriptions with comprehensive form validation and file handling.
 */

import React, { useState } from 'react'
import {
  Typography,
  Card,
  Row,
  Col,
  Upload,
  Button,
  Form,
  Input,
  message,
  Steps,
  Space,
  Divider,
  Alert,
  List,
  Tag
} from 'antd'
import {
  UploadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd/es/upload'
import type { RcFile } from 'antd/es/upload/interface'
import customerService from '../../services/customerService'

interface PrescriptionUpload {
  file: File
  doctorName: string
  doctorLicense?: string
  notes?: string
}

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { Step } = Steps

// ============================================================================
// Types and Interfaces
// ============================================================================

interface UploadedFile extends UploadFile {
  preview?: string
}

interface PrescriptionForm {
  doctorName: string
  doctorLicense?: string
  notes?: string
}

// ============================================================================
// Upload Prescription Component
// ============================================================================

const UploadPrescription: React.FC = () => {
  const [form] = Form.useForm<PrescriptionForm>()
  const [currentStep, setCurrentStep] = useState(0)
  const [fileList, setFileList] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)

  // File upload configuration
  const uploadProps: UploadProps = {
    name: 'prescription',
    multiple: true,
    fileList,
    beforeUpload: (file: RcFile) => {
      // Validate file type
      const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes(file.type)
      if (!isValidType) {
        message.error('Please upload only images (JPG, PNG, GIF) or PDF files!')
        return Upload.LIST_IGNORE
      }

      // Validate file size (10MB limit)
      const isValidSize = file.size / 1024 / 1024 < 10
      if (!isValidSize) {
        message.error('File must be smaller than 10MB!')
        return Upload.LIST_IGNORE
      }

      // Create file object with preserved originFileObj
      const newFile: UploadedFile = {
        ...file,
        uid: file.uid,
        name: file.name,
        status: 'done',
        originFileObj: file, // Preserve the original file object
        size: file.size,
        type: file.type,
      }

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          newFile.preview = e.target?.result as string
          // Update the file list with the preview
          setFileList(prev => {
            const updated = [...prev]
            const index = updated.findIndex(f => f.uid === newFile.uid)
            if (index >= 0) {
              updated[index] = { ...updated[index], preview: newFile.preview }
            }
            return updated
          })
        }
        reader.readAsDataURL(file)
        // Add file immediately (preview will be added later)
        setFileList(prev => [...prev, newFile])
      } else {
        // For non-image files, add directly
        setFileList(prev => [...prev, newFile])
      }

      return false // Prevent automatic upload
    },
    onRemove: (file) => {
      setFileList(prev => prev.filter(item => item.uid !== file.uid))
    },
    showUploadList: false, // We'll create custom upload list
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get file type tag
  const getFileTypeTag = (type: string) => {
    if (type.includes('pdf')) {
      return <Tag color="red">PDF</Tag>
    } else if (type.includes('image')) {
      return <Tag color="blue">Image</Tag>
    }
    return <Tag>File</Tag>
  }

  // Debug file information
  const debugFileInfo = (file: File) => {
    console.log('File debug info:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      constructor: file.constructor.name,
      isFile: file instanceof File,
      isBlob: file instanceof Blob
    })
  }

  // Handle form submission
  const handleSubmit = async (values: PrescriptionForm) => {
    if (fileList.length === 0) {
      message.error('Please upload at least one prescription file!')
      return
    }

    // Validate that the file object exists
    const firstFile = fileList[0]
    if (!firstFile.originFileObj) {
      message.error('File upload error. Please try uploading the file again.')
      console.error('No originFileObj found in:', firstFile)
      return
    }

    setUploading(true)

    try {
      const fileToUpload = firstFile.originFileObj as File
      
      // Debug file information
      debugFileInfo(fileToUpload)

      // Additional validation to ensure file is a proper File object
      if (!(fileToUpload instanceof File)) {
        console.error('originFileObj is not a File instance:', fileToUpload)
        message.error('Invalid file object. Please try uploading again.')
        return
      }

      // Prepare upload data with proper file object
      const uploadData: PrescriptionUpload = {
        file: fileToUpload,
        doctorName: values.doctorName,
        doctorLicense: values.doctorLicense,
        notes: values.notes
      }

      console.log('=== UPLOAD SUBMISSION DEBUG ===')
      console.log('Form values:', values)
      console.log('FileList:', fileList)
      console.log('First file:', firstFile)
      console.log('File to upload (originFileObj):', fileToUpload)
      console.log('Upload data object:', {
        fileName: uploadData.file.name,
        fileSize: uploadData.file.size,
        fileType: uploadData.file.type,
        doctorName: uploadData.doctorName,
        doctorLicense: uploadData.doctorLicense,
        notes: uploadData.notes
      })

      // Upload using real API
      console.log('Calling customerService.uploadPrescription...')
      const response = await customerService.uploadPrescription(uploadData)
      console.log('Upload response received:', response)

      message.success('Prescription uploaded successfully!')
      
      // Reset form and move to success step
      form.resetFields()
      setFileList([])
      setCurrentStep(2)
      
    } catch (error) {
      message.error('Failed to upload prescription. Please try again.')
      console.error('Upload error:', error)
      
      // Check if it's a network error or validation error
      if (error instanceof Error) {
        console.error('Error message:', error.message)
      }
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('API response error:', (error as any).response?.data)
      }
    } finally {
      setUploading(false)
    }
  }

  // Handle next step
  const handleNext = () => {
    if (currentStep === 0 && fileList.length === 0) {
      message.error('Please upload at least one file to continue!')
      return
    }
    
    // Check if all files have proper file objects
    const invalidFiles = fileList.filter(file => !file.originFileObj)
    if (invalidFiles.length > 0) {
      message.error('Some files failed to upload properly. Please remove and re-upload them.')
      return
    }
    
    setCurrentStep(prev => prev + 1)
  }

  // Handle previous step
  const handlePrev = () => {
    setCurrentStep(prev => prev - 1)
  }

  // Start new upload
  const startNewUpload = () => {
    setCurrentStep(0)
    form.resetFields()
    setFileList([])
  }

  const steps = [
    {
      title: 'Upload Files',
      description: 'Select prescription files',
      icon: <UploadOutlined />
    },
    {
      title: 'Add Details',
      description: 'Prescription information',
      icon: <FileTextOutlined />
    },
    {
      title: 'Complete',
      description: 'Upload successful',
      icon: <CheckCircleOutlined />
    }
  ]

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Upload New Prescription</Title>
        <Paragraph style={{ color: '#666', fontSize: '16px' }}>
          Upload your prescription files and provide necessary details for our pharmacists to review.
        </Paragraph>
      </div>

      {/* Upload Guidelines */}
      <Alert
        message="Upload Guidelines"
        description={
          <div>
            <Text>• Accepted formats: JPG, PNG, GIF, PDF</Text><br />
            <Text>• Maximum file size: 10MB per file</Text><br />
            <Text>• Ensure prescription is clearly visible and readable</Text><br />
            <Text>• Multiple files can be uploaded for the same prescription</Text>
          </div>
        }
        type="info"
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '24px' }}
        showIcon
      />

      {/* Progress Steps */}
      <Card style={{ marginBottom: '24px' }}>
        <Steps current={currentStep} style={{ marginBottom: '24px' }}>
          {steps.map((step, index) => (
            <Step
              key={index}
              title={step.title}
              description={step.description}
              icon={step.icon}
            />
          ))}
        </Steps>

        {/* Step Content */}
        {currentStep === 0 && (
          <div>
            <Title level={4}>Step 1: Upload Prescription Files</Title>
            
            {/* File Upload Area */}
            <Upload.Dragger {...uploadProps} style={{ marginBottom: '24px' }}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">
                Click or drag prescription files to this area to upload
              </p>
              <p className="ant-upload-hint">
                Support for JPG, PNG, GIF, and PDF files. Maximum 10MB per file.
              </p>
            </Upload.Dragger>

            {/* File List */}
            {fileList.length > 0 && (
              <Card title="Uploaded Files" size="small">
                <List
                  dataSource={fileList}
                  renderItem={(file) => (
                    <List.Item
                      actions={[
                        file.preview && (
                          <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => {
                              const previewWindow = window.open('', '_blank')
                              previewWindow?.document.write(`
                                <img src="${file.preview}" style="max-width: 100%; height: auto;" />
                              `)
                            }}
                          >
                            Preview
                          </Button>
                        ),
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => setFileList(prev => prev.filter(item => item.uid !== file.uid))}
                        >
                          Remove
                        </Button>
                      ].filter(Boolean)}
                    >
                      <List.Item.Meta
                        avatar={<FileTextOutlined style={{ fontSize: '24px', color: file.originFileObj ? '#1890ff' : '#ff4d4f' }} />}
                        title={
                          <Space>
                            {file.name}
                            {getFileTypeTag(file.type || '')}
                            {file.originFileObj ? (
                              <Tag color="green">Ready</Tag>
                            ) : (
                              <Tag color="red">Error</Tag>
                            )}
                          </Space>
                        }
                        description={
                          <div>
                            <div>Size: {formatFileSize(file.size || 0)}</div>
                            {!file.originFileObj && (
                              <div style={{ color: '#ff4d4f', fontSize: '12px' }}>
                                File object missing - try re-uploading
                              </div>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}

            <div style={{ textAlign: 'right', marginTop: '24px' }}>
              <Button type="primary" onClick={handleNext} disabled={fileList.length === 0}>
                Next Step
              </Button>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div>
            <Title level={4}>Step 2: Prescription Details</Title>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              style={{ maxWidth: '600px' }}
            >
              <Row gutter={[16, 0]}>
                <Col xs={24}>
                  <Form.Item
                    name="doctorName"
                    label="Doctor's Name"
                    rules={[
                      { required: true, message: 'Please enter the doctor\'s name!' },
                      { min: 2, message: 'Name must be at least 2 characters!' }
                    ]}
                  >
                    <Input placeholder="Dr. John Smith" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    name="doctorLicense"
                    label="Doctor License Number (Optional)"
                  >
                    <Input placeholder="Enter doctor's license number" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="notes"
                label="Additional Notes (Optional)"
                extra="Any additional information about your prescription or medical condition"
              >
                <TextArea
                  rows={4}
                  placeholder="e.g., Chronic condition, emergency prescription, specific instructions..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Divider />

              <Space>
                <Button onClick={handlePrev}>
                  Previous
                </Button>
                <Button type="primary" htmlType="submit" loading={uploading}>
                  Upload Prescription
                </Button>
              </Space>
            </Form>
          </div>
        )}

        {currentStep === 2 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CheckCircleOutlined style={{ fontSize: '64px', color: '#52c41a', marginBottom: '16px' }} />
            <Title level={3}>Upload Successful!</Title>
            <Paragraph style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
              Your prescription has been uploaded successfully and is now pending review by our pharmacists.
              You will be notified once the review is complete.
            </Paragraph>
            
            <Space>
              <Button type="primary" onClick={startNewUpload}>
                Upload Another Prescription
              </Button>
              <Button onClick={() => window.location.href = '/customer/dashboard'}>
                Back to Dashboard
              </Button>
            </Space>
          </div>
        )}
      </Card>
    </div>
  )
}

export default UploadPrescription
