import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Card, Typography, Checkbox } from 'antd';
import { MailOutlined, LockOutlined, ArrowLeftOutlined, UserAddOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title } = Typography;

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Load saved credentials on component mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem('terraflow_remember_login');
    if (savedCredentials) {
      try {
        const credentials = JSON.parse(savedCredentials);
        form.setFieldsValue({
          email: credentials.email
        });
        setRememberMe(true);
      } catch (error) {
        console.error('Error loading saved credentials:', error);
      }
    }
  }, [form]);

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  const saveCredentials = (email: string) => {
    if (rememberMe) {
      const credentialsToSave = { email };
      localStorage.setItem('terraflow_remember_login', JSON.stringify(credentialsToSave));
    } else {
      localStorage.removeItem('terraflow_remember_login');
    }
  };
  const clearSavedInformation = () => {
    localStorage.removeItem('terraflow_remember_login');
    form.resetFields();
    setRememberMe(false);
    message.success('Saved information cleared');
  };

  const onFinish = async (values: any) => {
    const { email, password } = values;

    console.log('=== LOGIN DEBUG START ===');
    console.log('Email:', email);
    console.log('Password length:', password?.length);
    console.log('Login function available:', typeof login);

    setLoading(true);
    try {
      // Save credentials if remember me is checked
      saveCredentials(email);
      
      console.log('Calling login function...');
      const success = await login(email, password);
      console.log('Login function returned:', success);
      
      if (success) {
        console.log('Login successful, checking localStorage...');
        
        // Get user from localStorage to determine role
        const userData = localStorage.getItem('terraflow_user');
        console.log('User data from localStorage:', userData);
        
        if (userData) {
          const user = JSON.parse(userData);
          const role = user.role;
          console.log('User role:', role);
          
          message.success('Login successful!');
          
          // Navigate based on role
          if (role === 'admin') {
            console.log('Navigating to /admin');
            navigate('/admin');
          } else if (role === 'customer') {
            console.log('Navigating to /customer');
            navigate('/customer');
          } else if (role === 'supplier') {
            console.log('Navigating to /supplier');
            navigate('/supplier');
          } else {
            console.log('Unknown role, navigating to /');
            navigate('/');
          }
        } else {
          console.error('No user data found in localStorage after successful login');
          message.error('Login successful but user data not found. Please try again.');
        }
      } else {
        console.log('Login failed, success = false');
        message.error('Invalid email or password. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      console.log('=== LOGIN DEBUG END ===');
    }
  };return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <Card className="w-full max-w-md p-6 rounded-xl shadow-lg border-0">
        {/* Back Button */}
        <div className="mb-4">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleGoBack}
            className="text-gray-600 hover:text-indigo-600 font-medium"
          >
            Back
          </Button>
        </div>

        <div className="text-center mb-8">
          <Title level={2} className="text-indigo-600 mb-2">TerraFlow SCM</Title>
          <p className="text-gray-600">Sign in to your account</p>
        </div>        <Form 
          layout="vertical" 
          onFinish={onFinish} 
          size="large" 
          form={form}
          onFinishFailed={(errorInfo) => {
            console.log('=== FORM VALIDATION FAILED ===');
            console.log('Failed fields:', errorInfo);
          }}
        >
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input 
              prefix={<MailOutlined className="text-gray-400" />} 
              placeholder="Enter your email address"
              className="h-12 rounded-lg"
              onPressEnter={() => {
                console.log('Email field Enter pressed');
                form.submit();
              }}
            />
          </Form.Item>
            <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter your password!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined className="text-gray-400" />} 
              placeholder="Enter your password"
              className="h-12 rounded-lg"
              onPressEnter={() => {
                console.log('Password field Enter pressed');
                form.submit();
              }}
            />
          </Form.Item>

          {/* Remember Me Checkbox */}
          <Form.Item className="mb-4">
            <div className="flex items-center justify-between">
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="text-gray-600"
              >
                Remember my email
              </Checkbox>
              {localStorage.getItem('terraflow_remember_login') && (
                <Button
                  type="link"
                  size="small"
                  onClick={clearSavedInformation}
                  className="text-red-500 hover:text-red-600 p-0"
                >
                  Clear Saved
                </Button>
              )}
            </div>
          </Form.Item>
            <Form.Item className="mb-0">            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="h-12 rounded-lg bg-indigo-600 hover:bg-indigo-700 border-0 text-white font-semibold"
              onClick={() => {
                console.log('=== SIGN IN BUTTON CLICKED ===');
                console.log('Form values:', form.getFieldsValue());
                console.log('Loading state:', loading);
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>          </Form.Item>
        </Form>

        <div className="text-center mt-6">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Button 
              type="link" 
              icon={<UserAddOutlined />}
              onClick={() => navigate('/register')}
              className="p-0 text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Create Account
            </Button>
          </p>
        </div>
      </Card>
    </div>
  );
};
