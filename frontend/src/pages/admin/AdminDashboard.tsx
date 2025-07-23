import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Row, 
  Col,   Card, 
  Statistic, 
  Badge, 
  Space, 
  Button,
  Alert,
  List,
  Progress
} from 'antd';
import {
  UserOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ShopOutlined,
  WarningOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface DashboardStats {
  totalUsers: number;
  totalCustomers: number;
  totalSuppliers: number;
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}

interface ProductionRecommendation {
  product_name: string;
  stock_quantity: number;
  minimum_stock: number;
  avg_weekly_sales: number;
  priority: 'Urgent' | 'Medium' | 'Low';
  recommended_production: number;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recommendations, setRecommendations] = useState<ProductionRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get token from localStorage
      const storedUser = localStorage.getItem('terraflow_user');
      let token = null;
      
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          token = userData.token;
        } catch (e) {
          console.error('Error parsing stored user data:', e);
        }
      }
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log('Fetching admin dashboard data with token:', token?.substring(0, 20) + '...');
      
      // Fetch dashboard stats
      const statsResponse = await fetch('http://localhost:5000/api/admin/dashboard/stats', {
        headers
      });
      console.log('Stats response status:', statsResponse.status);
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('Stats data received:', statsData);
        if (statsData.success) {
          setStats(statsData.data);
        }
      } else {
        console.error('Stats response error:', await statsResponse.text());
      }
      
      // Fetch production recommendations - let's skip this for now and focus on basic stats
      // const recsResponse = await fetch('http://localhost:5000/api/admin/production-recommendations', {
      //   headers
      // });
      // if (recsResponse.ok) {
      //   const recsData = await recsResponse.json();
      //   if (recsData.success) setRecommendations(recsData.data);
      // }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return '#ff4d4f';
      case 'Medium': return '#faad14';
      default: return '#52c41a';
    }
  };
  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, "error" | "warning" | "success"> = {
      'Urgent': 'error',
      'Medium': 'warning',
      'Low': 'success'
    };
    return <Badge status={colors[priority] || 'success'} text={priority} />;
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <Title level={2} className="text-amber-900 mb-2">
          Admin Dashboard
        </Title>
        <Text className="text-gray-600">
          Welcome to TerraFlow SCM Administration Panel. Monitor your system performance and manage operations.
        </Text>
      </div>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats?.totalUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Orders"
              value={stats?.totalOrders || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={stats?.totalRevenue || 0}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Suppliers"
              value={stats?.totalSuppliers || 0}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Secondary Metrics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} md={12}>
          <Card title="Order Status Overview" className="h-full">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Pending Orders"
                  value={stats?.pendingOrders || 0}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Completion Rate"
                  value={stats?.totalOrders ? 
                    ((stats.totalOrders - stats.pendingOrders) / stats.totalOrders * 100) : 0}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                  precision={1}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="User Distribution" className="h-full">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Customers"
                  value={stats?.totalCustomers || 0}
                  valueStyle={{ color: '#1890ff' }}
                />
                <Progress 
                  percent={stats?.totalUsers ? 
                    (stats.totalCustomers / stats.totalUsers * 100) : 0} 
                  size="small" 
                  showInfo={false}
                  strokeColor="#1890ff"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Suppliers"
                  value={stats?.totalSuppliers || 0}
                  valueStyle={{ color: '#722ed1' }}
                />
                <Progress 
                  percent={stats?.totalUsers ? 
                    (stats.totalSuppliers / stats.totalUsers * 100) : 0} 
                  size="small" 
                  showInfo={false}
                  strokeColor="#722ed1"
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Smart Production Recommendations */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card            title={
              <Space>
                <RiseOutlined />
                Smart Production Recommendations
              </Space>
            }
            extra={<Button onClick={fetchDashboardData} loading={loading}>Refresh</Button>}
          >
            {recommendations.length === 0 ? (
              <Alert
                message="All Products Well Stocked"
                description="No immediate production recommendations. All products are above minimum stock levels."
                type="success"
                showIcon
              />
            ) : (
              <List
                dataSource={recommendations}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Text key="stock" type="secondary">
                        Current: {item.stock_quantity} | Min: {item.minimum_stock}
                      </Text>,
                      <Text key="recommendation" strong style={{ color: getPriorityColor(item.priority) }}>
                        Produce: {item.recommended_production} units
                      </Text>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: '50%', 
                          backgroundColor: getPriorityColor(item.priority),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <WarningOutlined style={{ color: 'white' }} />
                        </div>
                      }
                      title={
                        <Space>
                          {item.product_name}
                          {getPriorityBadge(item.priority)}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size="small">
                          <Text>Weekly Sales: {item.avg_weekly_sales.toFixed(1)} units</Text>
                          <Progress 
                            percent={(item.stock_quantity / (item.minimum_stock * 3)) * 100}
                            size="small"
                            strokeColor={getPriorityColor(item.priority)}
                            format={() => `${item.stock_quantity} units`}
                          />
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Quick Actions" style={{ backgroundColor: '#f9f9f9' }}>
            <Space size="large">
              <Button 
                type="primary" 
                icon={<RiseOutlined />}
                href="/admin/forecast-panel"
                style={{ backgroundColor: '#8B4513', borderColor: '#8B4513' }}
              >
                Smart Production Recommendations
              </Button>
              <Button 
                icon={<ShopOutlined />}
                href="/admin/inventory-management"
              >
                Manage Inventory
              </Button>
              <Button 
                icon={<ShoppingCartOutlined />}
                href="/admin/order-management"
              >
                View All Orders
              </Button>
              <Button 
                icon={<UserOutlined />}
                href="/admin/user-management"
              >
                Manage Users
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};