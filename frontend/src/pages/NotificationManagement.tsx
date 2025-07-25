import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Button,
  Space,
  Typography,
  message,
  Popconfirm,
  Badge,
  Tag,
  Divider,
  Row,
  Col,
  Tooltip,
  Empty,
  Spin
} from 'antd';
import {
  DeleteOutlined,
  ClearOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import '../styles/NotificationManagement.css';

const { Title, Text } = Typography;

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'order_update' | 'stock_alert' | 'payment_reminder' | 'system_alert' | 'supplier_update' | 'material_update';
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

const NotificationManagement: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<number | string | null>(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('terraflow_token') || localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data); // Debug log
        setNotifications(data.notifications || data.data?.notifications || []);
      } else {
        message.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      message.error('Error fetching notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleDeleteNotification = async (notificationId: number) => {
    setDeleteLoading(notificationId);
    try {
      const token = localStorage.getItem('terraflow_token') || localStorage.getItem('token');
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
      const token = localStorage.getItem('terraflow_token') || localStorage.getItem('token');
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
        fetchNotifications(); // Refresh the list
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
      const token = localStorage.getItem('terraflow_token') || localStorage.getItem('token');
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
      const token = localStorage.getItem('terraflow_token') || localStorage.getItem('token');
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
        fetchNotifications(); // Refresh the list
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
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'order_update':
        return <BellOutlined style={{ color: '#1890ff' }} />;
      case 'stock_alert':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'payment_reminder':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'supplier_update':
      case 'material_update':
        return <BellOutlined style={{ color: '#722ed1' }} />;
      case 'system_alert':
        return <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />;
      default:
        return <BellOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getNotificationTagColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'green';
      case 'warning':
        return 'orange';
      case 'error':
        return 'red';
      case 'order_update':
        return 'blue';
      case 'stock_alert':
        return 'red';
      case 'payment_reminder':
        return 'green';
      case 'supplier_update':
      case 'material_update':
        return 'purple';
      case 'system_alert':
        return 'orange';
      default:
        return 'blue';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const readCount = notifications.filter(n => n.is_read).length;

  return (
    <div className="notification-management">
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>
            <BellOutlined /> Notification Management
          </Title>
          
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card size="small">
                <Badge count={notifications.length} overflowCount={999} color="#1890ff">
                  <Text strong>Total Notifications</Text>
                </Badge>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Badge count={unreadCount} overflowCount={999} color="#ff4d4f">
                  <Text strong>Unread</Text>
                </Badge>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Badge count={readCount} overflowCount={999} color="#52c41a">
                  <Text strong>Read</Text>
                </Badge>
              </Card>
            </Col>
          </Row>

          <Space wrap>
            <Popconfirm
              title="Clear all read notifications?"
              description="This action cannot be undone."
              onConfirm={handleClearReadNotifications}
              okText="Yes"
              cancelText="No"
              disabled={readCount === 0}
            >
              <Button 
                type="default" 
                icon={<ClearOutlined />}
                loading={deleteLoading === 'read'}
                disabled={readCount === 0}
              >
                Clear Read ({readCount})
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
              >
                Clear All ({notifications.length})
              </Button>
            </Popconfirm>
          </Space>
        </div>

        <Divider />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No notifications found"
          />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item
                key={notification.id}
                className={`notification-item ${!notification.is_read ? 'unread' : 'read'}`}
                actions={[
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
                ]}
              >
                <List.Item.Meta
                  avatar={getNotificationIcon(notification.type)}
                  title={
                    <Space>
                      <Text strong={!notification.is_read}>
                        {notification.title}
                      </Text>
                      <Tag color={getNotificationTagColor(notification.type)}>
                        {notification.type.toUpperCase()}
                      </Tag>
                      {!notification.is_read && (
                        <Badge status="processing" text="New" />
                      )}
                    </Space>
                  }
                  description={
                    <div>
                      <Text>{notification.message}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {formatDate(notification.created_at)}
                      </Text>
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

export default NotificationManagement;
