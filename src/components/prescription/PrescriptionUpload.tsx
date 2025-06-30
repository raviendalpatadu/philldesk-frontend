/**
 * Prescription Upload Component
 * 
 * Handles file upload to Google Drive and saving metadata to database
 */

import React, { useState } from 'react'
import {
  Modal,
  Upload,
  Button,
  message,
  Progress,
  Typography,
  Space,
  Alert,
  Form,
  Input
} from 'antd'
import {
  UploadOutlined,
  InboxOutlined,
  FileTextOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import { usePrescriptionStore } from '../../store/prescriptionStore'
import { validateFile } from '../../services/prescriptionUploadService'
import { UPLOAD_CONFIG } from '../../config/index'

const { Dragger } = Upload
const { Title, Text } = Typography
const { TextArea } = Input

interface PrescriptionUploadProps {
  visible: boolean
  onClose: () => void
  onSuccess?: () => void
}

const PrescriptionUpload: React.FC<PrescriptionUploadProps> = ({
  visible,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const { 
    uploadPrescription, 
    uploadState, 
    resetUploadState 
  } = usePrescriptionStore()

  const resetState = () => {
    setFileList([])
    setSelectedFile(null)
    resetUploadState()
    form.resetFields()
  }

  const getUploadStatusText = (progress: number): string => {
    if (progress < 50) return 'Uploading to secure storage...'
    if (progress < 90) return 'Saving prescription details...'
    return 'Upload complete!'
  }

  const handleClose = () => {
    if (!uploadState.isUploading) {
      resetState()
      onClose()
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      message.error('Please select a file to upload')
      return
    }

    try {
      const formValues = form.getFieldsValue()
      
      const fileData = {
        file: selectedFile,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
      }

      const metadata = {
        patientNotes: formValues.notes,
      }

      await uploadPrescription(fileData, metadata)
      
      message.success('Prescription uploaded successfully!')
      
      setTimeout(() => {
        onSuccess?.()
        handleClose()
      }, 1000)

    } catch (error: any) {
      console.error('Upload error:', error)
      message.error(error.message ?? 'Failed to upload prescription')
    }
  }

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    fileList,
    accept: UPLOAD_CONFIG.ALLOWED_TYPES.join(','),
    beforeUpload: (file) => {
      const validation = validateFile(file)
      if (!validation.valid) {
        message.error(validation.error)
        return Upload.LIST_IGNORE
      }
      
      setFileList([{
        uid: '-1',
        name: file.name,
        status: 'done',
        originFileObj: file
      }])
      setSelectedFile(file)
      return Upload.LIST_IGNORE // Prevent automatic upload
    },
    onRemove: () => {
      setFileList([])
      setSelectedFile(null)
    },
    showUploadList: {
      showRemoveIcon: !uploadState.isUploading,
      showPreviewIcon: false
    }
  }

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          Upload Prescription
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={600}
      closable={!uploadState.isUploading}
      maskClosable={!uploadState.isUploading}
    >
      <div style={{ padding: '0 0 24px 0' }}>
        {uploadState.uploadProgress < 100 ? (
          <>
            <Alert
              message="Upload Instructions"
              description="Please upload a clear image or PDF of your prescription. Accepted formats: JPEG, PNG, PDF, WebP. Maximum size: 10MB."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form form={form} layout="vertical">
              <Form.Item label="Upload Prescription" required>
                <Dragger {...uploadProps} disabled={uploadState.isUploading}>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag prescription file to this area to upload
                  </p>
                  <p className="ant-upload-hint">
                    Support for single file upload. Accepted formats: JPEG, PNG, PDF, WebP
                  </p>
                </Dragger>
              </Form.Item>

              <Form.Item
                name="notes"
                label="Additional Notes (Optional)"
              >
                <TextArea
                  rows={3}
                  placeholder="Any specific instructions or notes about this prescription..."
                  disabled={uploadState.isUploading}
                />
              </Form.Item>
            </Form>

            {uploadState.isUploading && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Uploading prescription...</Text>
                <Progress 
                  percent={uploadState.uploadProgress} 
                  status={uploadState.uploadError ? 'exception' : 'active'}
                  showInfo
                />
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                  {getUploadStatusText(uploadState.uploadProgress)}
                </div>
              </div>
            )}

            {uploadState.uploadError && (
              <Alert
                message="Upload Failed"
                description={uploadState.uploadError}
                type="error"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Space>
                <Button 
                  onClick={handleClose}
                  disabled={uploadState.isUploading}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={handleUpload}
                  loading={uploadState.isUploading}
                  disabled={fileList.length === 0}
                >
                  Upload Prescription
                </Button>
              </Space>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CheckCircleOutlined 
              style={{ 
                fontSize: '64px', 
                color: '#52c41a',
                marginBottom: 16
              }} 
            />
            <Title level={3} style={{ color: '#52c41a' }}>
              Upload Successful!
            </Title>
            <Text type="secondary">
              Your prescription has been uploaded and is now being reviewed by our pharmacists.
              You will be notified once the review is complete.
            </Text>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default PrescriptionUpload
