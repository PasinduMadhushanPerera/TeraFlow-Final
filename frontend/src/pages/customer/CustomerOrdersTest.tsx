import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, Button } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const CustomerOrdersTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('terraflow_token');
      console.log('Token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        setError('Authentication required - please log in');
        return;
      }

      console.log('Making API call to fetch orders...');
      const response = await fetch('http://localhost:5000/api/customer/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('API Result:', result);
      
      if (result.success) {
        setOrders(result.data);
        console.log('Orders loaded successfully:', result.data.length);
      } else {
        setError(result.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
      setError('Network error - failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ color: '#8B4513', marginBottom: 24 }}>
        <ShoppingCartOutlined style={{ marginRight: 8 }} />
        My Orders (Test Component)
      </Title>

      <Card>
        <div style={{ textAlign: 'center', padding: 20 }}>
          {loading && <Spin size="large" />}
          
          {error && (
            <div>
              <Text type="danger" style={{ fontSize: 16 }}>
                {error}
              </Text>
              <br />
              <Button 
                type="primary" 
                onClick={fetchOrders} 
                style={{ marginTop: 16 }}
              >
                Retry
              </Button>
            </div>
          )}
          
          {!loading && !error && (
            <div>
              <Text style={{ fontSize: 16 }}>
                ✅ Component loaded successfully!
              </Text>
              <br />
              <Text style={{ fontSize: 14, color: '#666' }}>
                Found {orders.length} orders
              </Text>
              
              <div style={{ marginTop: 20, padding: 16, backgroundColor: '#f6ffed', borderRadius: 8 }}>
                <Text strong>Debug Info:</Text>
                <ul style={{ textAlign: 'left', marginTop: 8 }}>
                  <li>Backend API: Connected</li>
                  <li>Authentication: {localStorage.getItem('terraflow_token') ? 'Valid' : 'Missing'}</li>
                  <li>User Role: {localStorage.getItem('terraflow_role') || 'Not set'}</li>
                  <li>Orders Count: {orders.length}</li>
                </ul>
              </div>

              {orders.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <Text strong>Sample Order Data:</Text>
                  <pre style={{ 
                    textAlign: 'left', 
                    backgroundColor: '#f5f5f5', 
                    padding: 12, 
                    borderRadius: 4,
                    marginTop: 8,
                    fontSize: 12
                  }}>
                    {JSON.stringify(orders[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CustomerOrdersTest;
