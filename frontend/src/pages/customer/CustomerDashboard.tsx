import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Statistic, 
  List, 
  Button, 
  Badge, 
  Progress, 
  Avatar,
  Space,
  Tag,
  Divider,
  Alert,
  Spin,
  message,
  Empty,
  Timeline
} from 'antd';
import { 
  ShoppingCartOutlined, 
  TruckOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  BellOutlined,
  DollarOutlined,
  StarOutlined,
  GiftOutlined,
  HistoryOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
const { Title, Text } = Typography;

interface DashboardStats {
  totalOrders: number;
  inTransit: number;
  delivered: number;
  pending: number;
  totalSpent: number;
  loyalty_points: number;
}

interface RecentOrder {
  id: string;
  product_name: string;
  status: string;
  order_date: string;
  total_amount: number;
  tracking_number?: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    inTransit: 0,
    delivered: 0,
    pending: 0,
    totalSpent: 0,
    loyalty_points: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('terraflow_token') || localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch dashboard stats
      const statsResponse = await fetch('http://localhost:5000/api/customer/dashboard', { headers });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data?.stats || {
          totalOrders: 12,
          inTransit: 2,
          delivered: 8,
          pending: 2,
          totalSpent: 2450.99,
          loyalty_points: 1250
        });
      }

      // Fetch recent orders
      const ordersResponse = await fetch('http://localhost:5000/api/customer/orders?limit=5', { headers });
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setRecentOrders(ordersData.data?.recentOrders || [
          {
            id: 'ORD-001',
            product_name: 'Premium Red Clay',
            status: 'delivered',
            order_date: '2024-01-15',
            total_amount: 450.99
          },
          {
            id: 'ORD-002',
            product_name: 'Stoneware Clay',
            status: 'in_transit',
            order_date: '2024-01-18',
            total_amount: 320.50
          },
          {
            id: 'ORD-003',
            product_name: 'Ceramic Tiles',
            status: 'processing',
            order_date: '2024-01-20',
            total_amount: 890.00
          }
        ]);
      }

      // Fetch recent notifications
      const notificationsResponse = await fetch('http://localhost:5000/api/notifications?limit=5', { headers });
      if (notificationsResponse.ok) {
        const notifData = await notificationsResponse.json();
        setNotifications(notifData.notifications || notifData.data?.notifications || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'green';
      case 'in_transit': return 'blue';
      case 'processing': return 'orange';
      case 'pending': return 'red';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return <CheckCircleOutlined />;
      case 'in_transit': return <TruckOutlined />;
      case 'processing': return <ClockCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const recommendations = [
    {
      name: 'Porcelain Clay',
      price: 'Rs. 68.99',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop',
      rating: 4.5
    },
    {
      name: 'Clay Pottery Set',
      price: 'Rs. 129.99',
      image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=100&h=100&fit=crop',
      rating: 4.8
    },
    {
      name: 'Ceramic Glazing Kit',
      price: 'Rs. 89.99',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop',
      rating: 4.6
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }
  return (
    <div className="w-full" style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: '#8B4513', marginBottom: '8px' }}>
          Welcome back, {user?.email?.split('@')[0] || 'Customer'}!
        </Title>
        <Text type="secondary">Here's your TerraFlow dashboard overview</Text>
      </div>

      {/* Quick Stats */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="Total Orders" 
              value={stats.totalOrders} 
              prefix={<ShoppingCartOutlined style={{ color: '#8B4513' }} />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="In Transit" 
              value={stats.inTransit} 
              prefix={<TruckOutlined style={{ color: '#1890ff' }} />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="Delivered" 
              value={stats.delivered} 
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="Loyalty Points" 
              value={stats.loyalty_points} 
              prefix={<StarOutlined style={{ color: '#faad14' }} />} 
            />
          </Card>
        </Col>
      </Row>

      {/* Spending Overview */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <DollarOutlined />
                Total Spending
              </Space>
            }
          >
            <Statistic 
              value={stats.totalSpent} 
              precision={2}
              prefix="Rs. "
              valueStyle={{ color: '#8B4513', fontSize: '24px' }}
            />
            <Progress 
              percent={75} 
              strokeColor="#8B4513"
              format={() => 'Good spending pattern'}
            />
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <BellOutlined />
                Recent Notifications
                <Badge count={notifications.filter(n => !n.is_read).length} />
              </Space>
            }
            extra={
              <Link to="/customer/notification-management">
                <Button type="text" icon={<RightOutlined />}>View All</Button>
              </Link>
            }
          >
            {notifications.length === 0 ? (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No notifications"
              />
            ) : (
              <List
                dataSource={notifications.slice(0, 3)}
                renderItem={(notification) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          style={{ 
                            backgroundColor: notification.is_read ? '#f0f0f0' : '#1890ff',
                            color: notification.is_read ? '#999' : '#fff'
                          }}
                          icon={<BellOutlined />}
                        />
                      }
                      title={
                        <Space>
                          <Text strong={!notification.is_read}>
                            {notification.title}
                          </Text>
                          {!notification.is_read && <Badge status="processing" />}
                        </Space>
                      }
                      description={notification.message.length > 60 ? 
                        `${notification.message.substring(0, 60)}...` : 
                        notification.message
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Recent Orders */}
        <Col xs={24} lg={14}>
          <Card 
            title={
              <Space>
                <HistoryOutlined />
                Recent Orders
              </Space>
            }
            extra={
              <Link to="/customer/orders">
                <Button type="text" icon={<RightOutlined />}>View All</Button>
              </Link>
            }
          >
            {recentOrders.length === 0 ? (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No orders yet"
                styles={{ image: { height: 60 } }}
              />
            ) : (
              <List
                dataSource={recentOrders}
                renderItem={(order) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={getStatusIcon(order.status)}
                      title={
                        <Space>
                          <Text strong>{order.id}</Text>
                          <Text>{order.product_name}</Text>
                        </Space>
                      }
                      description={`Order Date: ${new Date(order.order_date).toLocaleDateString()}`}
                    />
                    <Space direction="vertical" align="end">
                      <Tag color={getStatusColor(order.status)}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </Tag>
                      <Text strong>Rs. {order.total_amount}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        {/* Recommended Products */}
        <Col xs={24} lg={10}>
          <Card 
            title={
              <Space>
                <GiftOutlined />
                Recommended for You
              </Space>
            }
            extra={
              <Link to="/customer/products">
                <Button type="text" icon={<RightOutlined />}>Browse All</Button>
              </Link>
            }
          >
            <List
              dataSource={recommendations}
              renderItem={(product) => (
                <List.Item
                  actions={[
                    <Button 
                      type="primary" 
                      size="small" 
                      style={{ backgroundColor: '#8B4513', borderColor: '#8B4513' }}
                    >
                      Add to Cart
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        src={product.image} 
                        size={48}
                        shape="square"
                      />
                    }
                    title={
                      <Space>
                        <Text strong>{product.name}</Text>
                        <Space>
                          <StarOutlined style={{ color: '#faad14' }} />
                          <Text type="secondary">{product.rating}</Text>
                        </Space>
                      </Space>
                    }
                    description={
                      <Text strong style={{ color: '#8B4513' }}>
                        {product.price}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Divider />
      <Card title="Quick Actions" style={{ marginTop: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Link to="/customer/products">
              <Button 
                type="primary" 
                size="large" 
                block
                icon={<ShoppingCartOutlined />}
                style={{ backgroundColor: '#8B4513', borderColor: '#8B4513' }}
              >
                Browse Products
              </Button>
            </Link>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Link to="/customer/orders">
              <Button 
                size="large" 
                block
                icon={<TruckOutlined />}
              >
                Track Orders
              </Button>
            </Link>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Link to="/customer/cart">
              <Button 
                size="large" 
                block
                icon={<ShoppingCartOutlined />}
              >
                View Cart
              </Button>
            </Link>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Link to="/customer/profile">
              <Button 
                size="large" 
                block
                icon={<StarOutlined />}
              >
                My Profile
              </Button>
            </Link>
          </Col>
        </Row>
      </Card>
    </div>
  );
};