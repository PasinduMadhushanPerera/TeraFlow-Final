import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Row,
  Col,
  Typography,
  message,
  Spin,
  Divider,
  Space,
  Avatar,
  Modal,
  Upload
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EditOutlined,
  LockOutlined,
  SaveOutlined,
  CameraOutlined,
  DeleteOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface AdminProfileData {
  id: number;
  role: string;
  full_name: string;
  email: string;
  mobile: string;
  address: string;
  business_name: string;
  business_address: string;
  contact_no: string;
  profile_image: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export const AdminProfile: React.FC = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<AdminProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('terraflow_token') || localStorage.getItem('token');
      
      if (!token) {
        message.error('No authentication token found. Please login again.');
        return;
      }

      const response = await fetch('http://localhost:5000/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setProfileData(data.data);
        form.setFieldsValue(data.data);
      } else {
        if (response.status === 401) {
          message.error('Session expired. Please login again.');
          // Clear invalid token
          localStorage.removeItem('terraflow_token');
          localStorage.removeItem('token');
        } else {
          message.error(data.message || 'Failed to fetch profile');
        }
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
      message.error('Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const handleUpdateProfile = async (values: any) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('terraflow_token') || localStorage.getItem('token');

      if (!token) {
        message.error('No authentication token found. Please login again.');
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

      const data = await response.json();

      if (data.success) {
        message.success('Profile updated successfully');
        setIsEditing(false);
        fetchProfile(); // Refresh data
      } else {
        if (response.status === 401) {
          message.error('Session expired. Please login again.');
          localStorage.removeItem('terraflow_token');
          localStorage.removeItem('token');
        } else {
          message.error(data.message || 'Failed to update profile');
        }
      }
    } catch (error) {
      console.error('Update profile error:', error);
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async (values: any) => {
    try {
      setPasswordLoading(true);
      const token = localStorage.getItem('terraflow_token') || localStorage.getItem('token');

      if (!token) {
        message.error('No authentication token found. Please login again.');
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

      const data = await response.json();

      if (data.success) {
        message.success('Password changed successfully');
        setPasswordModalVisible(false);
        passwordForm.resetFields();
      } else {
        if (response.status === 401) {
          message.error('Session expired. Please login again.');
          localStorage.removeItem('terraflow_token');
          localStorage.removeItem('token');
        } else {
          message.error(data.message || 'Failed to change password');
        }
      }
    } catch (error) {
      console.error('Change password error:', error);
      message.error('Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Upload profile image
  const handleImageUpload = async (file: any) => {
    try {
      setImageUploading(true);
      const token = localStorage.getItem('terraflow_token') || localStorage.getItem('token');

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
          localStorage.removeItem('terraflow_token');
          localStorage.removeItem('token');
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
      const token = localStorage.getItem('terraflow_token') || localStorage.getItem('token');

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
          localStorage.removeItem('terraflow_token');
          localStorage.removeItem('token');
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

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading && !profileData) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Title level={2} className="text-amber-900 mb-2">
            Admin Profile
          </Title>
          <Text className="text-gray-600">
            Manage your profile information and account settings
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          {/* Profile Overview Card */}
          <Col xs={24} lg={8}>
            <Card className="text-center shadow-md">
              <Space direction="vertical" size="large" className="w-full">
                <div className="relative">
                  {profileData?.profile_image ? (
                    <div className="relative">
                      <Avatar 
                        size={80} 
                        src={`http://localhost:5000${profileData.profile_image}`}
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
                    {profileData?.full_name || 'Admin User'}
                  </Title>
                  <Text className="text-gray-600">{profileData?.email}</Text>
                  <br />
                  <Text className="text-amber-700 font-semibold">Administrator</Text>
                </div>
                <div className="text-left w-full">
                  <div className="mb-2">
                    <Text strong>Status: </Text>
                    <Text className={profileData?.is_active ? 'text-green-600' : 'text-red-600'}>
                      {profileData?.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </div>
                  <div className="mb-2">
                    <Text strong>Verified: </Text>
                    <Text className={profileData?.is_verified ? 'text-green-600' : 'text-orange-600'}>
                      {profileData?.is_verified ? 'Yes' : 'Pending'}
                    </Text>
                  </div>
                  <div>
                    <Text strong>Member since: </Text>
                    <Text>{new Date(profileData?.created_at || '').toLocaleDateString()}</Text>
                  </div>
                </div>
              </Space>
            </Card>
          </Col>

          {/* Profile Form Card */}
          <Col xs={24} lg={16}>
            <Card
              title="Profile Information"
              extra={
                <Space>
                  <Button
                    type="default"
                    icon={<LockOutlined />}
                    onClick={() => setPasswordModalVisible(true)}
                  >
                    Change Password
                  </Button>
                  {!isEditing ? (
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={() => setIsEditing(true)}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <Button
                      type="default"
                      onClick={() => {
                        setIsEditing(false);
                        form.setFieldsValue(profileData);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </Space>
              }
              className="shadow-md"
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleUpdateProfile}
                disabled={!isEditing}
              >
                <Row gutter={[16, 0]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="full_name"
                      label="Full Name"
                      rules={[{ required: true, message: 'Please enter your full name' }]}
                    >
                      <Input
                        prefix={<UserOutlined className="text-gray-400" />}
                        placeholder="Enter full name"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="email"
                      label="Email Address"
                    >
                      <Input
                        prefix={<MailOutlined className="text-gray-400" />}
                        placeholder="Email address"
                        disabled
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[16, 0]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="mobile"
                      label="Mobile Number"
                      rules={[
                        { required: true, message: 'Please enter your mobile number' },
                        { pattern: /^[0-9]{10,15}$/, message: 'Please enter a valid mobile number (10-15 digits)' }
                      ]}
                    >
                      <Input
                        prefix={<PhoneOutlined className="text-gray-400" />}
                        placeholder="Enter mobile number (e.g., 1234567890)"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="contact_no"
                      label="Contact Number"
                    >
                      <Input
                        prefix={<PhoneOutlined className="text-gray-400" />}
                        placeholder="Enter contact number"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="address"
                  label="Personal Address"
                  rules={[{ required: true, message: 'Please enter your address' }]}
                >
                  <TextArea
                    rows={3}
                    placeholder="Enter personal address"
                  />
                </Form.Item>

                <Divider />

                <Form.Item
                  name="business_name"
                  label="Business/Organization Name"
                >
                  <Input
                    placeholder="Enter business or organization name"
                  />
                </Form.Item>

                <Form.Item
                  name="business_address"
                  label="Business Address"
                >
                  <TextArea
                    rows={3}
                    placeholder="Enter business address"
                  />
                </Form.Item>

                {isEditing && (
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      icon={<SaveOutlined />}
                      size="large"
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      Save Changes
                    </Button>
                  </Form.Item>
                )}
              </Form>
            </Card>
          </Col>
        </Row>

        {/* Change Password Modal */}
        <Modal
          title="Change Password"
          open={passwordModalVisible}
          onCancel={() => {
            setPasswordModalVisible(false);
            passwordForm.resetFields();
          }}
          footer={null}
          width={500}
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleChangePassword}
          >
            <Form.Item
              name="currentPassword"
              label="Current Password"
              rules={[{ required: true, message: 'Please enter your current password' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Enter current password"
              />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: 'Please enter new password' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Enter new password"
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
                    return Promise.reject(new Error('Passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Confirm new password"
              />
            </Form.Item>

            <Form.Item>
              <Space className="w-full justify-end">
                <Button
                  onClick={() => {
                    setPasswordModalVisible(false);
                    passwordForm.resetFields();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={passwordLoading}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Change Password
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};
