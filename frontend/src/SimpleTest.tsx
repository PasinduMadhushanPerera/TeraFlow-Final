import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Space } from 'antd';

const SimpleTest: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<string>('Testing...');
  const [loginStatus, setLoginStatus] = useState<string>('Not tested');
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testBackend = async () => {
    try {
      const response = await fetch('http://localhost:5000/health');
      const data = await response.json();
      setBackendStatus(`✅ Backend OK: ${data.status}`);
    } catch (error) {
      setBackendStatus(`❌ Backend Error: ${error}`);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@terraflow.com',
          password: 'admin123'
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        setToken(data.token);
        setLoginStatus('✅ Login successful');
        localStorage.setItem('token', data.token);
      } else {
        setLoginStatus(`❌ Login failed: ${data.message}`);
      }
    } catch (error) {
      setLoginStatus(`❌ Login error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testBackend();
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#8B4513' }}>
        TerraFlow SCM - System Test
      </h1>
      
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card title="Backend Connection Test">
          <p>{backendStatus}</p>
          <Button onClick={testBackend}>Test Backend</Button>
        </Card>

        <Card title="Authentication Test">
          <p>Status: {loginStatus}</p>
          <Button onClick={testLogin} loading={loading}>
            Test Login
          </Button>
          {token && (
            <div style={{ marginTop: '16px' }}>
              <Alert
                message="Token received!"
                description={`Token: ${token.substring(0, 50)}...`}
                type="success"
                showIcon
              />
            </div>
          )}
        </Card>

        <Card title="Frontend Status">
          <Alert
            message="Frontend is working!"
            description="React app is loading and displaying correctly"
            type="success"
            showIcon
          />
        </Card>

        <Card title="Quick Actions">
          <Space>
            <Button type="primary" onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </Button>
            <Button type="link" onClick={() => window.open('http://localhost:5000/health', '_blank')}>
              View Backend Health
            </Button>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default SimpleTest;
