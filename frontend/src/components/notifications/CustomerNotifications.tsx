import React, { useState, useEffect } from 'react';
import { 
  Card, 
  List, 
  Badge, 
  Button, 
  Typography, 
  Space, 
  Spin, 
  Empty, 
  message,
  Tag,
  Tooltip,
  Row,
  Col,
  Statistic,
  Popconfirm,
  Divider
} from 'antd';
import { 
  BellOutlined, 
  EyeOutlined, 
  CheckOutlined, 
  ShoppingCartOutlined,
  DollarOutlined,
  TruckOutlined,
  ReloadOutlined,
  GiftOutlined,
  DeleteOutlined,
  ClearOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

interface Notification {
  id: number;
  type: 'order_update' | 'stock_alert' | 'payment_reminder' | 'system_alert' | 'supplier_update';
  title: string;
  message: string;
  is_read: boolean;
  related_id?: number;
  related_type?: string;
  created_at: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  last_24h: number;
}

export const CustomerNotifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({ total: 0, unread: 0, last_24h: 0 });
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState<number | null>(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      message.error('Failed to load notifications');
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/notifications/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    setMarkingAsRead(notificationId);
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true }
              : notif
          )
        );
        await fetchStats();
        message.success('Notification marked as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      message.error('Failed to mark notification as read');
    } finally {
      setMarkingAsRead(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, is_read: true }))
        );
        await fetchStats();
        message.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      message.error('Failed to mark all notifications as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_update':
        return <ShoppingCartOutlined className="text-blue-500" />;
      case 'payment_reminder':
        return <DollarOutlined className="text-green-500" />;
      case 'system_alert':
        return <BellOutlined className="text-orange-500" />;
      default:
        return <GiftOutlined className="text-purple-500" />;
    }
  };

  const getNotificationTag = (type: string) => {
    const tagConfig = {
      order_update: { color: 'blue', text: 'Order Update' },
      payment_reminder: { color: 'green', text: 'Payment' },
      system_alert: { color: 'orange', text: 'System Alert' },
      stock_alert: { color: 'gold', text: 'New Products' }
    };
    
    const config = tagConfig[type as keyof typeof tagConfig] || { color: 'default', text: 'Notification' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchNotifications(), fetchStats()]);
      setLoading(false);
    };

    if (user?.role === 'customer') {
      loadData();
      
      // Set up real-time polling every 10 seconds
      const pollInterval = setInterval(async () => {
        await Promise.all([fetchNotifications(), fetchStats()]);
      }, 10000);

      // Cleanup interval on component unmount
      return () => clearInterval(pollInterval);
    }
  }, [user]);

  const refreshData = async () => {
    await Promise.all([fetchNotifications(), fetchStats()]);
  };

  if (user?.role !== 'customer') {
    return null;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Title level={3} className="m-0">
            <BellOutlined className="mr-2 text-blue-500" />
            My Notifications
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={refreshData}
              type="text"
            />
            {stats.unread > 0 && (
              <Button 
                type="primary" 
                onClick={markAllAsRead}
                size="small"
              >
                Mark All Read
              </Button>
            )}
          </Space>
        </div>

        {/* Notification Statistics */}
        <Row gutter={16} className="mb-6">
          <Col span={8}>
            <Card className="text-center">
              <Statistic
                title="Total Notifications"
                value={stats.total}
                prefix={<BellOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card className="text-center">
              <Statistic
                title="Unread"
                value={stats.unread}
                prefix={<EyeOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card className="text-center">
              <Statistic
                title="Recent"
                value={stats.last_24h}
                prefix={<TruckOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <Card>
        {loading ? (
          <div className="text-center py-8">
            <Spin size="large" />
          </div>
        ) : notifications.length === 0 ? (
          <Empty 
            description="No notifications yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item
                className={`transition-all duration-200 hover:bg-gray-50 ${
                  !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                actions={[
                  !notification.is_read && (
                    <Tooltip title="Mark as read">
                      <Button
                        type="text"
                        icon={<CheckOutlined />}
                        loading={markingAsRead === notification.id}
                        onClick={() => markAsRead(notification.id)}
                        size="small"
                        className="text-blue-500 hover:text-blue-700"
                      />
                    </Tooltip>
                  )
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={
                    <div className="relative">
                      {getNotificationIcon(notification.type)}
                      {!notification.is_read && (
                        <Badge
                          dot
                          status="processing"
                          className="absolute -top-1 -right-1"
                        />
                      )}
                    </div>
                  }
                  title={
                    <div className="flex items-center justify-between">
                      <span className={!notification.is_read ? 'font-semibold text-gray-800' : 'text-gray-600'}>
                        {notification.title}
                      </span>
                      <div className="flex items-center gap-2">
                        {getNotificationTag(notification.type)}
                        <Text type="secondary" className="text-xs">
                          {formatTimeAgo(notification.created_at)}
                        </Text>
                      </div>
                    </div>
                  }
                  description={
                    <div className="mt-1">
                      <Text className={!notification.is_read ? 'text-gray-700' : 'text-gray-500'}>
                        {notification.message}
                      </Text>
                      {notification.related_type === 'order' && notification.related_id && (
                        <div className="mt-2">
                          <Button 
                            type="link" 
                            size="small" 
                            className="p-0 h-auto"
                            onClick={() => {
                              // Navigate to order details
                              window.location.href = `/orders/${notification.related_id}`;
                            }}
                          >
                            View Order Details →
                          </Button>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};
