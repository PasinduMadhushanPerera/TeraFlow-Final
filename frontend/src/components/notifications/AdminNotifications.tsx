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
  WarningOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  UserOutlined,
  ReloadOutlined,
  DeleteOutlined,
  ClearOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

interface Notification {
  id: number;
  type: 'order_update' | 'stock_alert' | 'payment_reminder' | 'system_alert' | 'supplier_update' | 'material_update';
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

export const AdminNotifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({ total: 0, unread: 0, last_24h: 0 });
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | string | null>(null);

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

  const handleDeleteNotification = async (notificationId: number) => {
    setDeleteLoading(notificationId);
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        message.success('Notification deleted successfully');
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        await fetchStats();
      } else {
        const errorData = await response.json();
        message.error(errorData.message || 'Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      message.error('Error deleting notification');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleClearReadNotifications = async () => {
    setDeleteLoading('read');
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/notifications/read/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        message.success(result.message || 'Read notifications cleared successfully');
        await Promise.all([fetchNotifications(), fetchStats()]);
      } else {
        const errorData = await response.json();
        message.error(errorData.message || 'Failed to clear read notifications');
      }
    } catch (error) {
      console.error('Error clearing read notifications:', error);
      message.error('Error clearing read notifications');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleClearAllNotifications = async () => {
    setDeleteLoading('all');
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/notifications', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        message.success(result.message || 'All notifications cleared successfully');
        setNotifications([]);
        await fetchStats();
      } else {
        const errorData = await response.json();
        message.error(errorData.message || 'Failed to clear all notifications');
      }
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      message.error('Error clearing all notifications');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleClearOldNotifications = async () => {
    setDeleteLoading('old');
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/notifications/old/cleanup', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        message.success(result.message || 'Old notifications cleaned up successfully');
        await Promise.all([fetchNotifications(), fetchStats()]);
      } else {
        const errorData = await response.json();
        message.error(errorData.message || 'Failed to cleanup old notifications');
      }
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      message.error('Error cleaning up old notifications');
    } finally {
      setDeleteLoading(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_update':
        return <ShoppingCartOutlined className="text-blue-500" />;
      case 'stock_alert':
        return <WarningOutlined className="text-red-500" />;
      case 'payment_reminder':
        return <DollarOutlined className="text-green-500" />;
      case 'supplier_update':
      case 'material_update':
        return <UserOutlined className="text-purple-500" />;
      case 'system_alert':
        return <BellOutlined className="text-orange-500" />;
      default:
        return <BellOutlined className="text-gray-500" />;
    }
  };

  const getNotificationTag = (type: string) => {
    const tagConfig = {
      order_update: { color: 'blue', text: 'Order' },
      stock_alert: { color: 'red', text: 'Stock Alert' },
      payment_reminder: { color: 'green', text: 'Payment' },
      supplier_update: { color: 'purple', text: 'Supplier' },
      material_update: { color: 'purple', text: 'Material' },
      system_alert: { color: 'orange', text: 'System' }
    };
    
    const config = tagConfig[type as keyof typeof tagConfig] || { color: 'default', text: 'General' };
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

    if (user?.role === 'admin') {
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

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Title level={3} className="m-0">
            <BellOutlined className="mr-2" />
            Admin Notifications
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

        {/* Delete Actions */}
        <div className="mb-4">
          <Space wrap>
            <Popconfirm
              title="Clear all read notifications?"
              description="This action cannot be undone."
              onConfirm={handleClearReadNotifications}
              okText="Yes"
              cancelText="No"
              disabled={notifications.filter(n => n.is_read).length === 0}
            >
              <Button 
                type="default" 
                icon={<ClearOutlined />}
                loading={deleteLoading === 'read'}
                disabled={notifications.filter(n => n.is_read).length === 0}
                size="small"
              >
                Clear Read ({notifications.filter(n => n.is_read).length})
              </Button>
            </Popconfirm>

            <Popconfirm
              title="Clear old notifications?"
              description="This will delete notifications older than 7 days."
              onConfirm={handleClearOldNotifications}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                type="default" 
                icon={<ClockCircleOutlined />}
                loading={deleteLoading === 'old'}
                size="small"
              >
                Clear Old (7+ days)
              </Button>
            </Popconfirm>

            <Popconfirm
              title="Clear all notifications?"
              description="This will delete ALL notifications. This action cannot be undone."
              onConfirm={handleClearAllNotifications}
              okText="Yes"
              cancelText="No"
              disabled={notifications.length === 0}
            >
              <Button 
                type="primary" 
                danger 
                icon={<DeleteOutlined />}
                loading={deleteLoading === 'all'}
                disabled={notifications.length === 0}
                size="small"
              >
                Clear All ({notifications.length})
              </Button>
            </Popconfirm>
          </Space>
        </div>

        <Divider />

        {/* Notification Statistics */}
        <Row gutter={16} className="mb-6">
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Notifications"
                value={stats.total}
                prefix={<BellOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Unread"
                value={stats.unread}
                prefix={<EyeOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Last 24 Hours"
                value={stats.last_24h}
                prefix={<BellOutlined />}
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
            description="No notifications"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item
                className={`transition-all duration-200 ${
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
                      />
                    </Tooltip>
                  ),
                  <Tooltip title="Delete notification">
                    <Popconfirm
                      title="Delete this notification?"
                      description="This action cannot be undone."
                      onConfirm={() => handleDeleteNotification(notification.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        loading={deleteLoading === notification.id}
                        size="small"
                      />
                    </Popconfirm>
                  </Tooltip>
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
                      <span className={!notification.is_read ? 'font-semibold' : ''}>
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
                    <Text className={!notification.is_read ? 'text-gray-700' : 'text-gray-500'}>
                      {notification.message}
                    </Text>
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
