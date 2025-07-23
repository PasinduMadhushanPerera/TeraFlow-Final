import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Layout, Dropdown, Avatar } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import NotificationCenter from '../NotificationCenter';

const { Header } = Layout;

interface DashboardNavbarProps {
  userRole: 'admin' | 'supplier' | 'customer';
}

export const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ userRole }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Fetch profile data to get the profile image
  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        // Try to get token from multiple possible storage keys
        let token = localStorage.getItem('terraflow_token') || localStorage.getItem('token');
        if (!token) {
          const userData = localStorage.getItem('terraflow_user');
          if (userData) {
            try {
              token = JSON.parse(userData).token;
            } catch (e) {
              console.error('Error parsing terraflow_user data:', e);
            }
          }
        }
        
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        if (data.success && data.data.profile_image) {
          setProfileImage(`http://localhost:5000${data.data.profile_image}`);
        } else {
          setProfileImage(null);
        }
      } catch (error) {
        console.error('Failed to fetch profile image:', error);
        setProfileImage(null);
      }
    };

    if (user) {
      fetchProfileImage();
    }

    // Listen for profile image updates
    const handleProfileUpdate = () => {
      fetchProfileImage();
    };

    window.addEventListener('profileImageUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileImageUpdated', handleProfileUpdate);
  }, [user]);

  const getMenuItems = () => {
    switch (userRole) {
      case 'customer':
        return [
          { key: 'dashboard', label: <Link to="/customer">Dashboard</Link> },
          { key: 'products', label: <Link to="/customer/products">Products</Link> },
          { key: 'orders', label: <Link to="/customer/orders">My Orders</Link> },
          { key: 'cart', label: <Link to="/customer/cart">Cart</Link> }
        ];
      case 'supplier':
        return [
          { key: 'dashboard', label: <Link to="/supplier">Dashboard</Link> },
          { key: 'requests', label: <Link to="/supplier/requests">Requests</Link> },
          { key: 'forecasts', label: <Link to="/supplier/forecasts">Forecasts</Link> },
          { key: 'history', label: <Link to="/supplier/history">History</Link> }
        ];
      case 'admin':
        return [
          { key: 'dashboard', label: <Link to="/admin">Dashboard</Link> },
          { key: 'users', label: <Link to="/admin/users">Users</Link> },
          { key: 'inventory', label: <Link to="/admin/inventory">Inventory</Link> },
          { key: 'orders', label: <Link to="/admin/orders">Orders</Link> },
          { key: 'suppliers', label: <Link to="/admin/suppliers">Suppliers</Link> },
          { key: 'forecast', label: <Link to="/admin/forecast">Forecast</Link> },
          { key: 'reports', label: <Link to="/admin/reports">Reports</Link> }
        ];
      default:
        return [];
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <SettingOutlined />,
      label: <Link to={`/${userRole}/profile`}>Profile</Link>
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout
    }
  ];

  return (
    <Header className="bg-white shadow-md px-6 flex items-center justify-between">
      <div className="flex items-center">
        <Link to="/" className="text-2xl font-bold text-amber-800 mr-8">
          TerraFlow
        </Link>
        <Menu 
          mode="horizontal" 
          items={getMenuItems()} 
          className="border-none bg-transparent" 
          style={{
            minWidth: 0,
            flex: 'auto'
          }} 
        />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-gray-600">Welcome, {user?.fullName}</span>
        <Dropdown 
          menu={{ items: userMenuItems }} 
          placement="bottomRight"
        >
          {profileImage ? (
            <Avatar 
              size="large" 
              src={profileImage} 
              className="cursor-pointer border-2 border-amber-200" 
            />
          ) : (
            <Avatar 
              size="large" 
              icon={<UserOutlined />} 
              className="cursor-pointer bg-amber-700" 
            />
          )}
        </Dropdown>
        <NotificationCenter />
      </div>
    </Header>
  );
};