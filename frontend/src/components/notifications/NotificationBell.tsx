import React, { useState, useEffect } from 'react';
import { Badge, Button, Dropdown, List, Typography, Empty, Spin, Popconfirm, message } from 'antd';
import { BellOutlined, DeleteOutlined, ClearOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Text } = Typography;

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token) return;

      // Fetch recent notifications (last 5)
      const response = await fetch('http://localhost:5000/api/notifications?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications);
        
        // Count unread notifications
        const unread = data.data.notifications.filter((n: Notification) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
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
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
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
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        setUnreadCount(prev => {
          const deletedNotif = notifications.find(n => n.id === notificationId);
          return deletedNotif && !deletedNotif.is_read ? Math.max(0, prev - 1) : prev;
        });
        message.success('Notification deleted successfully');
      } else {
        message.error('Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      message.error('Failed to delete notification');
    }
  };

  const clearAllNotifications = async (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
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
        const data = await response.json();
        setNotifications([]);
        setUnreadCount(0);
        message.success(data.message || 'All notifications cleared');
      } else {
        message.error('Failed to clear notifications');
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
      message.error('Failed to clear notifications');
    }
  };

  const clearReadNotifications = async (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
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
        const data = await response.json();
        setNotifications(prev => prev.filter(notif => !notif.is_read));
        message.success(data.message || 'Read notifications cleared');
      } else {
        message.error('Failed to clear read notifications');
      }
    } catch (error) {
      console.error('Error clearing read notifications:', error);
      message.error('Failed to clear read notifications');
    }
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

  const getNotificationRoute = () => {
    switch (user?.role) {
      case 'admin':
        return '/admin/notifications';
      case 'customer':
        return '/customer/notifications';
      case 'supplier':
        return '/supplier/notifications';
      default:
        return '/notifications';
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Poll for new notifications every 15 seconds for better real-time experience
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const dropdownMenu = (
    <div className="w-80 max-h-96 overflow-hidden bg-white rounded-lg shadow-lg border">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-center mb-2">
          <Text strong>Recent Notifications</Text>
          <Button 
            type="link" 
            size="small"
            onClick={() => {
              window.location.href = getNotificationRoute();
              setDropdownVisible(false);
            }}
          >
            View All
          </Button>
        </div>
        <div className="flex gap-2 mt-2">
          <Popconfirm
            title="Clear read notifications?"
            description="This will delete all read notifications"
            onConfirm={clearReadNotifications}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              size="small" 
              icon={<ClearOutlined />}
              type="text"
              onClick={(e) => e.stopPropagation()}
            >
              Clear Read
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Clear all notifications?"
            description="This will permanently delete all your notifications"
            onConfirm={clearAllNotifications}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              size="small" 
              icon={<DeleteOutlined />}
              type="text"
              danger
              onClick={(e) => e.stopPropagation()}
            >
              Clear All
            </Button>
          </Popconfirm>
        </div>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <Spin size="small" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4">
            <Empty 
              description="No notifications" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              imageStyle={{ height: 40 }}
            />
          </div>
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item
                className={`cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                  !notification.is_read ? 'bg-blue-50' : ''
                }`}
                onClick={() => {
                  if (!notification.is_read) {
                    markAsRead(notification.id);
                  }
                  setDropdownVisible(false);
                  window.location.href = getNotificationRoute();
                }}
              >
                <div className="w-full px-4 py-2">
                  <div className="flex justify-between items-start mb-1">
                    <Text 
                      strong={!notification.is_read} 
                      className={`text-sm ${!notification.is_read ? 'text-gray-800' : 'text-gray-600'} flex-1 pr-2`}
                      ellipsis
                    >
                      {notification.title}
                    </Text>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Text type="secondary" className="text-xs">
                        {formatTimeAgo(notification.created_at)}
                      </Text>
                      <Popconfirm
                        title="Delete this notification?"
                        onConfirm={(e) => {
                          e?.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          className="text-gray-400 hover:text-red-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Popconfirm>
                    </div>
                  </div>
                  <Text 
                    type="secondary" 
                    className="text-xs"
                    ellipsis
                  >
                    {notification.message}
                  </Text>
                  {!notification.is_read && (
                    <div className="mt-1">
                      <Badge dot status="processing" />
                    </div>
                  )}
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

  if (!user) {
    return null;
  }

  return (
    <Dropdown
      menu={{ items: [] }}
      dropdownRender={() => dropdownMenu}
      trigger={['click']}
      placement="bottomRight"
      open={dropdownVisible}
      onOpenChange={setDropdownVisible}
    >
      <Button 
        type="text" 
        icon={
          <Badge count={unreadCount} size="small" overflowCount={99}>
            <BellOutlined className="text-lg" />
          </Badge>
        } 
        className="flex items-center justify-center"
      />
    </Dropdown>
  );
};
