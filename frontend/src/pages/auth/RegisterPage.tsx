import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Upload, Typography, Modal, message, Row, Col } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  PhoneOutlined,
  UploadOutlined,
  ShopOutlined,
  TeamOutlined,
  BankOutlined,
  ArrowLeftOutlined,
  LoginOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

export const RegisterPage: React.FC = () => {
  const [form] = Form.useForm();
  const [userRole, setUserRole] = useState<string>('customer');
  const [loading, setLoading] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };
  const onFinish = async (values: any) => {
    if (!termsAccepted) {
      setTermsModalVisible(true);
      return;
    }
    
    console.log('=== REGISTRATION DEBUG START ===');
    console.log('Form values received:', values);
    console.log('User role:', userRole);
    
    setLoading(true);
    try {
      const formData = { ...values, role: userRole };
      
      // If role is supplier, handle document file info
      if (userRole === 'supplier') {
        if (values.businessDocument?.length > 0) {
          formData.businessDocument = values.businessDocument[0].name;
          console.log('Business document file:', values.businessDocument[0]);
        } else {
          // Make businessDocument optional for now
          formData.businessDocument = null;
          console.log('No business document uploaded');
        }
      }

      console.log('Final form data to submit:', formData);
      console.log('Calling register function...');
      
      const success = await register(formData);
      console.log('Register function returned:', success);
      
      if (success) {
        console.log('Registration successful!');
        message.success('Registration successful! Please login to continue.');
        navigate('/login');
      } else {
        message.error('Registration failed. Please check your information and try again.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error?.message || 'Registration failed. Please try again.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTermsAccept = () => {
    setTermsAccepted(true);
    setTermsModalVisible(false);
    form.submit();
  };

  const renderRoleSelection = () => (
    <div className="mb-6">
      <Typography.Title level={5} className="text-center mb-4 text-gray-700 font-medium">
        Account Type
      </Typography.Title>
      <div className="flex justify-center gap-4 mb-6">
        <Button
          size="large"
          className={`h-12 px-6 rounded-lg border-2 transition-all duration-300 ${
            userRole === 'customer'
              ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-md'
              : 'border-gray-300 bg-white text-gray-600 hover:border-amber-300 hover:text-amber-600'
          }`}
          onClick={() => setUserRole('customer')}
        >
          <TeamOutlined className={`mr-2 ${userRole === 'customer' ? 'text-amber-600' : 'text-gray-500'}`} />
          Customer
        </Button>
        <Button
          size="large"
          className={`h-12 px-6 rounded-lg border-2 transition-all duration-300 ${
            userRole === 'supplier'
              ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-md'
              : 'border-gray-300 bg-white text-gray-600 hover:border-amber-300 hover:text-amber-600'
          }`}
          onClick={() => setUserRole('supplier')}
        >
          <ShopOutlined className={`mr-2 ${userRole === 'supplier' ? 'text-amber-600' : 'text-gray-500'}`} />
          Supplier
        </Button>
      </div>
    </div>
  );

  const renderCustomerFields = () => (
    <>
      <Form.Item
        name="fullName"
        label="Full Name"
        rules={[{ required: true, message: 'Please input your full name!' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Enter your full name" className="h-11 rounded-lg" />
      </Form.Item>
      <Form.Item
        name="mobile"
        label="Mobile Number"
        rules={[{ required: true, message: 'Please input your mobile number!' }]}
      >
        <Input prefix={<PhoneOutlined />} placeholder="Enter your mobile number" className="h-11 rounded-lg" />
      </Form.Item>
      <Form.Item
        name="address"
        label="Address"
        rules={[{ required: true, message: 'Please input your address!' }]}
      >
        <Input.TextArea rows={3} placeholder="Enter your address" className="rounded-lg" />
      </Form.Item>
    </>
  );

  const renderSupplierFields = () => (
    <>
      <Form.Item
        name="fullName"
        label="Full Name"
        rules={[{ required: true, message: 'Please input your full name!' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Enter your full name" className="h-11 rounded-lg" />
      </Form.Item>
      <Form.Item
        name="businessName"
        label="Business Name"
        rules={[{ required: true, message: 'Please input your business name!' }]}
      >
        <Input prefix={<BankOutlined />} placeholder="Enter your business name" className="h-11 rounded-lg" />
      </Form.Item>      <Form.Item
        name="contactNo"
        label="Contact Number"
        rules={[{ required: true, message: 'Please input your contact number!' }]}
      >
        <Input prefix={<PhoneOutlined />} placeholder="Enter your contact number" className="h-11 rounded-lg" />
      </Form.Item>
      <Form.Item
        name="mobile"
        label="Mobile Number (Optional)"
      >
        <Input prefix={<PhoneOutlined />} placeholder="Enter your mobile number" className="h-11 rounded-lg" />
      </Form.Item>
      <Form.Item
        name="businessAddress"
        label="Business Address"
        rules={[{ required: true, message: 'Please input your business address!' }]}
      >
        <Input.TextArea rows={3} placeholder="Enter your business address" className="rounded-lg" />
      </Form.Item>      <Form.Item
        name="businessDocument"
        label="Business Registration Document (Optional)"
        valuePropName="fileList"
        getValueFromEvent={(e) => {
          if (Array.isArray(e)) {
            return e;
          }
          return e && e.fileList;
        }}
      >
        <Upload beforeUpload={() => false} maxCount={1} className="w-full">
          <Button icon={<UploadOutlined />} className="w-full h-11 rounded-lg border-dashed">
            Upload Document (Optional)
          </Button>
        </Upload>
      </Form.Item>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-5xl shadow-2xl rounded-2xl border-0">
        {/* Back Button */}
        <div className="mb-4">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleGoBack}
            className="text-gray-600 hover:text-amber-600 font-medium"
          >
            Back
          </Button>
        </div>

        <div className="text-center mb-8">
          <Title level={2} className="text-amber-800 mb-2 font-bold">
            Join TerraFlow
          </Title>
          <Text className="text-gray-600 text-lg">
            Create your professional account to get started
          </Text>
        </div>

        {renderRoleSelection()}

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Row gutter={32}>
            <Col span={12}>
              <Card
                title={<span className="text-lg font-semibold text-gray-700">Personal Information</span>}
                className="h-full rounded-xl border border-gray-200"
                styles={{
                  header: { borderBottom: '1px solid #f0f0f0', padding: '16px 24px' },
                  body: { padding: '24px' }
                }}
              >
                {userRole === 'customer' ? renderCustomerFields() : renderSupplierFields()}
              </Card>
            </Col>

            <Col span={12}>
              <Card
                title={<span className="text-lg font-semibold text-gray-700">Account Security</span>}
                className="h-full rounded-xl border border-gray-200"
                styles={{
                  header: { borderBottom: '1px solid #f0f0f0', padding: '16px 24px' },
                  body: { padding: '24px' }
                }}
              >
                <Form.Item
                  name="email"
                  label="Email Address"
                  rules={[
                    { required: true, message: 'Please input your email!' },
                    { type: 'email', message: 'Please enter a valid email!' }
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder="Enter your email" className="h-11 rounded-lg" />
                </Form.Item>
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: 'Please input your password!' },
                    { min: 6, message: 'Password must be at least 6 characters!' }
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Enter your password" className="h-11 rounded-lg" />
                </Form.Item>
                <Form.Item
                  name="confirmPassword"
                  label="Confirm Password"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Please confirm your password!' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Passwords do not match!'));
                      }
                    })
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Confirm your password" className="h-11 rounded-lg" />
                </Form.Item>
              </Card>
            </Col>
          </Row>

          <Form.Item className="mt-6 mb-0">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full h-14 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 border-0 rounded-xl text-lg font-semibold shadow-lg"
            >
              Register
            </Button>
          </Form.Item>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Button 
                type="link" 
                icon={<LoginOutlined />}
                onClick={() => navigate('/login')}
                className="p-0 text-amber-600 hover:text-amber-700 font-semibold"
              >
                Sign In
              </Button>
            </p>
          </div>
        </Form>
      </Card>

      {/* Terms Modal */}
      <Modal
        title="Terms and Conditions"
        open={termsModalVisible}
        onOk={handleTermsAccept}
        onCancel={() => setTermsModalVisible(false)}
        okText="I Accept"
        cancelText="Decline"
      >
        <p>Please read and accept our terms and conditions to proceed with registration.</p>
      </Modal>
    </div>
  );
};
