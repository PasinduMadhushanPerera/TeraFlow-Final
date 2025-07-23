import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Form, 
  Input, 
  Button, 
  Row, 
  Col, 
  message, 
  Spin,
  Avatar,
  Divider,
  Statistic,
  Progress,
  Tag,
  Space,
  Alert,
  Upload
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  PhoneOutlined,
  MailOutlined,
  ShopOutlined,
  TruckOutlined,
  StarOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  LockOutlined,
  CameraOutlined,
  DeleteOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface SupplierProfile {
  id: number;
  full_name: string;
  email: string;
  mobile: string;
  address: string;
  business_name: string;
  business_address: string;
  business_document: string;
  contact_no: string;
  profile_image: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

interface PerformanceMetrics {
  total_requests: number;
  completed_requests: number;
  avg_delivery_days: number;
  rating: number;
}

export const SupplierProfile: React.FC = () => {
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Try to get token from both possible storage keys
      let token = localStorage.getItem('terraflow_token');
      if (!token) {
        const userData = localStorage.getItem('terraflow_user');
        if (userData) {
          token = JSON.parse(userData).token;
        }
      }
      
      if (!token) {
        message.error('Authentication token not found');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch profile data using auth endpoint
      const profileResponse = await fetch('http://localhost:5000/api/auth/profile', {
        headers
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.success) {
          setProfile(profileData.data);
          form.setFieldsValue(profileData.data);
        } else {
          message.error(profileData.message || 'Failed to fetch profile');
        }
      } else {
        // Fallback to old endpoint if auth endpoint fails
        const fallbackResponse = await fetch('http://localhost:5000/api/profile', {
          headers
        });
        
        if (fallbackResponse.ok) {
          const profileData = await fallbackResponse.json();
          if (profileData.success) {
            setProfile(profileData.data);
            form.setFieldsValue(profileData.data);
          }
        }
      }

      // Fetch performance data from dashboard
      const performanceResponse = await fetch('http://localhost:5000/api/supplier/dashboard', {
        headers
      });

      if (performanceResponse.ok) {
        const performanceData = await performanceResponse.json();
        if (performanceData.success && performanceData.data.performance) {
          setPerformance(performanceData.data.performance);
        }
      }

    } catch (error) {
      console.error('Error fetching profile:', error);
      message.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (values: any) => {
    try {
      setSaving(true);
      
      // Try to get token from both possible storage keys
      let token = localStorage.getItem('terraflow_token');
      if (!token) {
        const userData = localStorage.getItem('terraflow_user');
        if (userData) {
          token = JSON.parse(userData).token;
        }
      }

      if (!token) {
        message.error('Authentication token not found. Please login again.');
        return;
      }

      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          message.success('Profile updated successfully');
          setProfile({ ...profile, ...values } as SupplierProfile);
          setEditing(false);
        } else {
          if (response.status === 401) {
            message.error('Session expired. Please login again.');
          } else {
            message.error(data.message || 'Failed to update profile');
          }
        }
      } else {
        if (response.status === 401) {
          message.error('Session expired. Please login again.');
        } else {
          message.error('Failed to update profile');
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (values: any) => {
    try {
      setSaving(true);
      
      // Try to get token from both possible storage keys
      let token = localStorage.getItem('terraflow_token');
      if (!token) {
        const userData = localStorage.getItem('terraflow_user');
        if (userData) {
          token = JSON.parse(userData).token;
        }
      }

      if (!token) {
        message.error('Authentication token not found. Please login again.');
        return;
      }

      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          message.success('Password changed successfully');
          passwordForm.resetFields();
          setChangingPassword(false);
        } else {
          if (response.status === 401) {
            message.error('Session expired. Please login again.');
          } else {
            message.error(data.message || 'Failed to change password');
          }
        }
      } else {
        if (response.status === 401) {
          message.error('Session expired. Please login again.');
        } else {
          message.error('Failed to change password');
        }
      }
    } catch (error) {
      console.error('Error changing password:', error);
      message.error('Error changing password');
    } finally {
      setSaving(false);
    }
  };

  // Upload profile image
  const handleImageUpload = async (file: any) => {
    try {
      setImageUploading(true);
      
      // Try to get token from both possible storage keys
      let token = localStorage.getItem('terraflow_token');
      if (!token) {
        const userData = localStorage.getItem('terraflow_user');
        if (userData) {
          token = JSON.parse(userData).token;
        }
      }

      if (!token) {
        message.error('No authentication token found. Please login again.');
        return false;
      }

      const formData = new FormData();
      formData.append('profile_image', file);

      const response = await fetch('http://localhost:5000/api/auth/upload-profile-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        message.success('Profile image uploaded successfully');
        fetchProfile(); // Refresh profile data
        // Dispatch event to update navbar
        window.dispatchEvent(new CustomEvent('profileImageUpdated'));
        return false; // Prevent default upload behavior
      } else {
        if (response.status === 401) {
          message.error('Session expired. Please login again.');
        } else {
          message.error(data.message || 'Failed to upload image');
        }
        return false;
      }
    } catch (error) {
      console.error('Image upload error:', error);
      message.error('Failed to upload image');
      return false;
    } finally {
      setImageUploading(false);
    }
  };

  // Remove profile image
  const handleRemoveImage = async () => {
    try {
      setImageUploading(true);
      
      // Try to get token from both possible storage keys
      let token = localStorage.getItem('terraflow_token');
      if (!token) {
        const userData = localStorage.getItem('terraflow_user');
        if (userData) {
          token = JSON.parse(userData).token;
        }
      }

      if (!token) {
        message.error('No authentication token found. Please login again.');
        return;
      }

      const response = await fetch('http://localhost:5000/api/auth/delete-profile-image', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        message.success('Profile image removed successfully');
        fetchProfile(); // Refresh profile data
        // Dispatch event to update navbar
        window.dispatchEvent(new CustomEvent('profileImageUpdated'));
      } else {
        if (response.status === 401) {
          message.error('Session expired. Please login again.');
        } else {
          message.error(data.message || 'Failed to remove image');
        }
      }
    } catch (error) {
      console.error('Remove image error:', error);
      message.error('Failed to remove image');
    } finally {
      setImageUploading(false);
    }
  };

  const getCompletionRate = () => {
    if (!performance || performance.total_requests === 0) return 0;
    return Math.round((performance.completed_requests / performance.total_requests) * 100);
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <StarOutlined 
          key={i} 
          style={{ 
            color: i <= rating ? '#faad14' : '#d9d9d9',
            fontSize: '18px'
          }} 
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <Title level={2} className="text-amber-900 mb-6">
        Supplier Profile
      </Title>

      <Row gutter={[16, 16]}>
        {/* Profile Information Card */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Avatar 
                    size={40} 
                    icon={<UserOutlined />} 
                    className="mr-3 bg-amber-600"
                  />
                  <div>
                    <Text strong>Profile Information</Text>
                    <br />
                    <Text type="secondary" className="text-sm">
                      Manage your profile details
                    </Text>
                  </div>
                </div>
                <Button
                  type={editing ? "default" : "primary"}
                  icon={editing ? <SaveOutlined /> : <EditOutlined />}
                  onClick={() => {
                    if (editing) {
                      form.submit();
                    } else {
                      setEditing(true);
                    }
                  }}
                  loading={saving}
                >
                  {editing ? 'Save Changes' : 'Edit Profile'}
                </Button>
              </div>
            }
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
              disabled={!editing}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Full Name"
                    name="full_name"
                    rules={[{ required: true, message: 'Please enter your full name' }]}
                  >
                    <Input prefix={<UserOutlined />} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: 'Please enter your email' },
                      { type: 'email', message: 'Please enter a valid email' }
                    ]}
                  >
                    <Input prefix={<MailOutlined />} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Mobile Number"
                    name="mobile"
                    rules={[{ required: true, message: 'Please enter your mobile number' }]}
                  >
                    <Input prefix={<PhoneOutlined />} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Contact Number"
                    name="contact_no"
                  >
                    <Input prefix={<PhoneOutlined />} />
                  </Form.Item>
                </Col>
                <Col xs={24}>                  <Form.Item
                    label="Address"
                    name="address"
                    rules={[{ required: true, message: 'Please enter your address' }]}
                  >
                    <TextArea rows={2} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider>Business Information</Divider>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Business Name"
                    name="business_name"
                    rules={[{ required: true, message: 'Please enter your business name' }]}
                  >
                    <Input prefix={<ShopOutlined />} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Business Document"
                    name="business_document"
                  >
                    <Input prefix={<UploadOutlined />} />
                  </Form.Item>
                </Col>
                <Col xs={24}>                  <Form.Item
                    label="Business Address"
                    name="business_address"
                  >
                    <TextArea rows={2} />
                  </Form.Item>
                </Col>
              </Row>

              {editing && (
                <div className="flex justify-end gap-2">
                  <Button 
                    onClick={() => {
                      setEditing(false);
                      form.setFieldsValue(profile);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={saving}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </Form>
          </Card>

          {/* Change Password Card */}
          <Card
            title="Change Password"
            className="mt-4"
            extra={
              <Button
                type="primary"
                icon={<LockOutlined />}
                onClick={() => setChangingPassword(!changingPassword)}
              >
                {changingPassword ? 'Cancel' : 'Change Password'}
              </Button>
            }
          >
            {changingPassword ? (
              <Form
                form={passwordForm}
                layout="vertical"
                onFinish={handleChangePassword}
              >
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Current Password"
                      name="currentPassword"
                      rules={[{ required: true, message: 'Please enter current password' }]}
                    >
                      <Input.Password />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="New Password"
                      name="newPassword"
                      rules={[
                        { required: true, message: 'Please enter new password' },
                        { min: 6, message: 'Password must be at least 6 characters' }
                      ]}
                    >
                      <Input.Password />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      label="Confirm New Password"
                      name="confirmPassword"
                      rules={[
                        { required: true, message: 'Please confirm new password' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('Passwords do not match!'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password />
                    </Form.Item>
                  </Col>
                </Row>
                <div className="flex justify-end gap-2">
                  <Button onClick={() => {
                    setChangingPassword(false);
                    passwordForm.resetFields();
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={saving}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    Change Password
                  </Button>
                </div>
              </Form>
            ) : (
              <Text type="secondary">
                Click "Change Password" to update your password
              </Text>
            )}
          </Card>
        </Col>

        {/* Performance & Status Sidebar */}
        <Col xs={24} lg={8}>
          {/* Profile Overview Card */}
          <Card className="text-center shadow-md mb-4">
            <Space direction="vertical" size="large" className="w-full">
              <div className="relative">
                {profile?.profile_image ? (
                  <div className="relative">
                    <Avatar 
                      size={80} 
                      src={`http://localhost:5000${profile.profile_image}`}
                      className="border-2 border-amber-200"
                    />
                    <Button
                      type="primary"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      className="absolute -top-1 -right-1 rounded-full w-6 h-6 flex items-center justify-center p-0"
                      onClick={handleRemoveImage}
                      loading={imageUploading}
                    />
                  </div>
                ) : (
                  <Avatar size={80} icon={<UserOutlined />} className="bg-amber-600" />
                )}
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={handleImageUpload}
                  disabled={imageUploading}
                >
                  <Button
                    type="primary"
                    icon={<CameraOutlined />}
                    size="small"
                    className="absolute -bottom-1 -right-1 rounded-full bg-amber-600 hover:bg-amber-700 border-white"
                    loading={imageUploading}
                  />
                </Upload>
              </div>
              <div>
                <Title level={4} className="text-amber-800 mb-1">
                  {profile?.full_name || 'Supplier User'}
                </Title>
                <Text className="text-gray-600">{profile?.email}</Text>
                <br />
                <Text className="text-amber-700 font-semibold">Supplier</Text>
              </div>
            </Space>
          </Card>

          {/* Account Status */}
          <Card title="Account Status" className="mb-4">
            <Space direction="vertical" className="w-full">
              <div className="flex justify-between">
                <Text>Account Status:</Text>
                <Tag color={profile?.is_active ? 'green' : 'red'}>
                  {profile?.is_active ? 'Active' : 'Inactive'}
                </Tag>
              </div>
              <div className="flex justify-between">
                <Text>Verification:</Text>
                <Tag color={profile?.is_verified ? 'blue' : 'orange'}>
                  {profile?.is_verified ? 'Verified' : 'Pending'}
                </Tag>
              </div>
              <div className="flex justify-between">
                <Text>Member Since:</Text>
                <Text type="secondary">
                  {profile ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </Text>
              </div>
            </Space>
          </Card>

          {/* Performance Metrics */}
          {performance && (
            <Card title="Performance Metrics">
              <Space direction="vertical" className="w-full">
                <Statistic
                  title="Total Requests"
                  value={performance.total_requests}
                  prefix={<TruckOutlined />}
                />
                
                <Statistic
                  title="Completed Requests"
                  value={performance.completed_requests}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                />
                
                <div>
                  <Text className="text-sm text-gray-500">Completion Rate</Text>
                  <Progress 
                    percent={getCompletionRate()} 
                    strokeColor="#52c41a"
                    className="mt-1"
                  />
                </div>

                <Statistic
                  title="Average Delivery Time"
                  value={performance.avg_delivery_days || 0}
                  suffix="days"
                  prefix={<StarOutlined />}
                />

                <div>
                  <Text className="text-sm text-gray-500">Rating</Text>
                  <div className="flex items-center mt-1">
                    {getRatingStars(performance.rating || 0)}
                    <Text className="ml-2">({performance.rating || 0}/5)</Text>
                  </div>
                </div>
              </Space>
            </Card>
          )}

          {/* Verification Notice */}
          {!profile?.is_verified && (
            <Alert
              message="Account Verification Pending"
              description="Your account is under review. You can still use the system, but some features may be limited until verification is complete."
              type="warning"
              showIcon
              className="mt-4"
            />
          )}
        </Col>
      </Row>
    </div>
  );
};