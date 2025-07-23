import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  message,
  Row,
  Col,
  Divider,
  Space
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';
import customerService, { CustomerProfile } from '../../services/customerService';

const { Title } = Typography;
const { TextArea } = Input;

const CustomerProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await customerService.getProfile();
      setProfile(data);
      form.setFieldsValue(data);
    } catch (error) {
      message.error('Failed to load profile');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      form.setFieldsValue(profile);
    }
  };

  const handleSave = async (values: any) => {
    try {
      setSaving(true);
      await customerService.updateProfile(values);
      setProfile({ ...profile!, ...values });
      setEditing(false);
      message.success('Profile updated successfully');
    } catch (error) {
      message.error('Failed to update profile');
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2}>My Profile</Title>
          <p style={{ color: '#666', marginBottom: 0 }}>
            View and manage your account information
          </p>
        </div>
        {!editing && (
          <Button 
            type="primary" 
            icon={<EditOutlined />}
            onClick={handleEdit}
            loading={loading}
          >
            Edit Profile
          </Button>
        )}
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card loading={loading}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              disabled={!editing}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="firstName"
                    label="First Name"
                    rules={[{ required: true, message: 'Please enter your first name' }]}
                  >
                    <Input 
                      prefix={<UserOutlined />} 
                      placeholder="Enter your first name"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="lastName"
                    label="Last Name"
                    rules={[{ required: true, message: 'Please enter your last name' }]}
                  >
                    <Input 
                      prefix={<UserOutlined />} 
                      placeholder="Enter your last name"
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="Enter your email address"
                  size="large"
                  disabled // Email usually shouldn't be editable
                />
              </Form.Item>

              <Form.Item
                name="username"
                label="Username"
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="Username"
                  size="large"
                  disabled // Username usually shouldn't be editable
                />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Phone Number"
              >
                <Input 
                  prefix={<PhoneOutlined />} 
                  placeholder="Enter your phone number"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="address"
                label="Address"
              >
                <TextArea 
                  rows={3}
                  placeholder="Enter your address"
                />
              </Form.Item>

              {editing && (
                <>
                  <Divider />
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                      <Button 
                        onClick={handleCancel}
                        icon={<CloseOutlined />}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={saving}
                        icon={<SaveOutlined />}
                      >
                        Save Changes
                      </Button>
                    </Space>
                  </Form.Item>
                </>
              )}
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Account Information" loading={loading}>
            {profile && (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ color: '#666' }}>Account Status:</span>
                  <br />
                  <span style={{ 
                    color: profile.isActive ? '#52c41a' : '#ff4d4f',
                    fontWeight: 'bold'
                  }}>
                    {profile.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ color: '#666' }}>Member Since:</span>
                  <br />
                  <span style={{ fontWeight: 'bold' }}>
                    {formatDate(profile.createdAt)}
                  </span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <span style={{ color: '#666' }}>Customer ID:</span>
                  <br />
                  <span style={{ fontFamily: 'monospace', color: '#1890ff' }}>
                    #{profile.id.toString().padStart(6, '0')}
                  </span>
                </div>
              </div>
            )}
          </Card>

          <Card title="Account Security" style={{ marginTop: '16px' }}>
            <div>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                Keep your account secure by managing your password and security settings.
              </p>
              <Button block>
                Change Password
              </Button>
            </div>
          </Card>

          <Card title="Privacy Settings" style={{ marginTop: '16px' }}>
            <div>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                Manage your privacy preferences and data sharing settings.
              </p>
              <Button block>
                Privacy Settings
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CustomerProfilePage;
