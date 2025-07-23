import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_id?: number;
  related_type?: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  last_24h: number;
}

const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    last_24h: 0
  });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotificationStats();
      fetchNotifications();
    }
  }, [user, unreadOnly]);

  const fetchNotificationStats = async () => {
    try {
      console.log('🔍 Fetching notification stats...');
      const token = localStorage.getItem('token');
      console.log('Token:', token ? token.substring(0, 50) + '...' : 'No token found');
      
      const response = await fetch('http://localhost:5000/api/notifications/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Stats response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Stats data:', data);
        setStats(data.data);
      } else {
        const errorData = await response.json();
        console.error('Stats error:', errorData);
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  };

  const fetchNotifications = async (pageNum = 1, append = false) => {
    try {
      console.log('📧 Fetching notifications...');
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Token for notifications:', token ? token.substring(0, 50) + '...' : 'No token found');
      
      const response = await fetch(
        `http://localhost:5000/api/notifications?page=${pageNum}&limit=10&unread_only=${unreadOnly}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Notifications response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Notifications data:', data);
        
        if (append) {
          setNotifications(prev => [...prev, ...data.data.notifications]);
        } else {
          setNotifications(data.data.notifications);
        }
        
        setHasMore(data.data.pagination.current_page < data.data.pagination.total_pages);
        setPage(pageNum);
      } else {
        const errorData = await response.json();
        console.error('Notifications error:', errorData);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
        setStats(prev => ({ ...prev, unread: prev.unread - 1 }));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setStats(prev => ({ ...prev, unread: 0 }));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stock_alert':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'order_update':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      case 'supplier_update':
        return <Info className="h-4 w-4 text-orange-500" />;
      case 'payment_reminder':
        return <Info className="h-4 w-4 text-green-500" />;
      case 'system_alert':
        return <AlertTriangle className="h-4 w-4 text-purple-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'stock_alert':
        return 'border-l-red-500 bg-red-50';
      case 'order_update':
        return 'border-l-blue-500 bg-blue-50';
      case 'supplier_update':
        return 'border-l-orange-500 bg-orange-50';
      case 'payment_reminder':
        return 'border-l-green-500 bg-green-50';
      case 'system_alert':
        return 'border-l-purple-500 bg-purple-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchNotifications(page + 1, true);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
      >
        {stats.unread > 0 ? (
          <Bell className="h-6 w-6" />
        ) : (
          <BellOff className="h-6 w-6" />
        )}
        
        {stats.unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {stats.unread > 99 ? '99+' : stats.unread}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Stats */}
            <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
              <span>
                {stats.unread} unread
              </span>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setUnreadOnly(!unreadOnly)}
                  className={`text-xs px-2 py-1 rounded ${
                    unreadOnly 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {unreadOnly ? 'Show All' : 'Unread Only'}
                </button>
                
                {stats.unread > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 hover:bg-green-200"
                  >
                    Mark All Read
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {unreadOnly ? 'No unread notifications' : 'No notifications'}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                      !notification.is_read ? 'bg-blue-50' : 'bg-white'
                    } ${getTypeColor(notification.type)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getTypeIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className={`text-sm font-medium ${
                              !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {formatDate(notification.created_at)}
                            </span>
                            <div className="flex items-center space-x-2">
                              {notification.related_type && notification.related_id && (
                                <span className="text-xs text-blue-600 flex items-center space-x-1">
                                  <span>ID: {notification.related_id}</span>
                                </span>
                              )}
                              {!notification.is_read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-green-600 hover:text-green-800 flex items-center space-x-1"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Mark Read</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={loadMore}
                disabled={loading}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;

