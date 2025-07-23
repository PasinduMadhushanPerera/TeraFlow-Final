// Quick Login Test Component
import React, { useState } from 'react';
import { Button, Input, Card, message } from 'antd';

export const LoginTest: React.FC = () => {
  const [email, setEmail] = useState('admin@terraflow.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    try {
      console.log('Testing login...');
      
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok && result.success) {
        message.success(`Login successful! Role: ${result.user.role}`);
        console.log('Token received:', result.token);
        
        // Store in localStorage for testing
        localStorage.setItem('test_login', JSON.stringify({
          user: result.user,
          token: result.token
        }));
      } else {
        message.error(`Login failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error(`Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Direct Login Test" style={{ margin: '20px', maxWidth: '400px' }}>
      <div style={{ marginBottom: '10px' }}>
        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginBottom: '10px' }}
        />
        <Input.Password
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: '10px' }}
        />
        <Button 
          type="primary" 
          onClick={testLogin} 
          loading={loading}
          block
        >
          Test Direct Login
        </Button>
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>
        Check browser console for detailed logs
      </div>
    </Card>
  );
};
