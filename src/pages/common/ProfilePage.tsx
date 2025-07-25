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
  Space,
  Modal,
  Spin
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons';
import { User } from '../../types';
import { authService } from '../../services/authService';
import customerService, { CustomerProfile } from '../../services/customerService';
import { useUserRole } from '../../store/authStore';

const { Title } = Typography;

// Reusable icon renderer for password inputs
const passwordIconRender = (visible: boolean) => (
  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
);

const ProfilePage: React.FC = () => {
  const userRole = useUserRole();
  const [profile, setProfile] = useState<User | CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    fetchProfile();
  }, [userRole]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      let profileData;
      
      if (userRole === 'CUSTOMER') {
        profileData = await customerService.getProfile();
      } else {
        profileData = await authService.getCurrentUser();
      }
      
      setProfile(profileData);
      form.setFieldsValue(profileData);
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
      
      if (userRole === 'CUSTOMER') {
        await customerService.updateProfile(values);
      } else {
        await authService.updateProfile(values);
      }
      
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

  const handlePasswordChange = async (values: any) => {
    try {
      setChangingPassword(true);
      await authService.changePassword(values.oldPassword, values.newPassword);
      message.success('Password changed successfully');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      message.error(errorMessage);
      console.error('Error:', error);
    } finally {
      setChangingPassword(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isCustomerProfile = (prof: any): prof is CustomerProfile => {
    return userRole === 'CUSTOMER' && prof && 'username' in prof;
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2}>My Profile</Title>
          <p style={{ color: '#666', marginBottom: 0 }}>
            Manage your account settings and profile information
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

              {isCustomerProfile(profile) && (
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
              )}

              {isCustomerProfile(profile) && (
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
              )}

              {isCustomerProfile(profile) && (
                <Form.Item
                  name="address"
                  label="Address"
                >
                  <Input.TextArea 
                    rows={3}
                    placeholder="Enter your address"
                  />
                </Form.Item>
              )}

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
                  <span style={{ color: '#666' }}>User Role:</span>
                  <br />
                  <span style={{ 
                    fontWeight: 'bold',
                    color: '#1890ff',
                    textTransform: 'capitalize'
                  }}>
                    {userRole?.toLowerCase()}
                  </span>
                </div>

                {isCustomerProfile(profile) && (
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ color: '#666' }}>Customer ID:</span>
                    <br />
                    <span style={{ fontFamily: 'monospace', color: '#1890ff' }}>
                      #{profile.id.toString().padStart(6, '0')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card title="Account Security" style={{ marginTop: '16px' }}>
            <div>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                Keep your account secure by changing your password regularly.
              </p>
              <Button 
                block 
                icon={<LockOutlined />}
                onClick={() => setPasswordModalVisible(true)}
              >
                Change Password
              </Button>
            </div>
          </Card>

          <Card title="Privacy Settings" style={{ marginTop: '16px' }}>
            <div>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                Manage your privacy preferences and data sharing settings.
              </p>
              <Button block disabled>
                Privacy Settings
              </Button>
              <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                Coming soon
              </p>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Password Change Modal */}
      <Modal
        title="Change Password"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
          <Form.Item
            name="oldPassword"
            label="Current Password"
            rules={[{ required: true, message: 'Please enter your current password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your current password"
              iconRender={passwordIconRender}
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter your new password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your new password"
              iconRender={passwordIconRender}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm your new password"
              iconRender={passwordIconRender}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setPasswordModalVisible(false);
                passwordForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={changingPassword}
                icon={<SaveOutlined />}
              >
                Change Password
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
