import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button, Layout, Drawer, Menu } from 'antd';
import { 
  HomeOutlined, 
  ShoppingOutlined, 
  InfoCircleOutlined, 
  ContactsOutlined, 
  LoginOutlined,
  UserAddOutlined,
  MenuOutlined,
  GlobalOutlined,
  CloseOutlined,
  SunOutlined,
  MoonOutlined
} from '@ant-design/icons';

const { Header } = Layout;

export const PublicNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Enhanced menu items with descriptions and icons
  const navItems = [
    {
      key: 'home',
      icon: <HomeOutlined className="text-lg" />,
      label: 'Home',
      path: '/',
      description: 'Main dashboard'
    },
    {
      key: 'products',
      icon: <ShoppingOutlined className="text-lg" />,
      label: 'Products',
      path: '/products',
      description: 'Browse catalog'
    },
    {
      key: 'about',
      icon: <InfoCircleOutlined className="text-lg" />,
      label: 'About',
      path: '/about',
      description: 'Our story'
    },
    {
      key: 'contact',
      icon: <ContactsOutlined className="text-lg" />,
      label: 'Contact',
      path: '/contact',
      description: 'Get in touch'
    }
  ];

  const handleMobileNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    // Apply dark mode to document root
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Mobile menu items for the drawer
  const mobileMenuItems = [
    ...navItems.map(item => ({
      key: item.key,
      icon: item.icon,
      label: item.label,
      onClick: () => handleMobileNavClick(item.path)
    }))
  ];

  return (
    <>
      <Header 
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out
          ${scrolled 
            ? 'navbar-glass navbar-shadow-glow bg-white/90' 
            : 'bg-white shadow-lg'
          }
          px-4 lg:px-6 flex items-center justify-between h-16
        `}
        style={{ padding: '0 16px' }}
      >
        {/* Logo Section */}
        <div className="flex items-center">
          <Link 
            to="/" 
            className="flex items-center group transition-all duration-300 hover:scale-105 navbar-logo-glow"
          >
            <div className="relative">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-xl flex items-center justify-center mr-2 lg:mr-4 shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:rotate-3">
                <GlobalOutlined className="text-white text-lg lg:text-xl" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl lg:text-3xl font-bold bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 bg-clip-text text-transparent tracking-tight">
                TerraFlow
              </span>
              <span className="text-xs text-gray-500 -mt-1 font-medium tracking-wide hidden sm:block">
                Supply Chain Excellence
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Menu */}
        <div className="hidden lg:flex items-center space-x-2">
          {navItems.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className={`
                group nav-item-hover flex items-center space-x-3 px-5 py-3 rounded-xl transition-all duration-300
                ${location.pathname === item.path
                  ? 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 shadow-md'
                  : 'text-gray-700 hover:text-amber-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50'
                }
              `}
            >
              <span className="group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                {item.icon}
              </span>
              <div className="flex flex-col">
                <span className="font-semibold text-sm leading-tight">{item.label}</span>
                <span className="text-xs text-gray-500 group-hover:text-amber-600 transition-colors leading-tight">
                  {item.description}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          {/* Dark Mode Toggle */}
          <Button
            type="text"
            icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleDarkMode}
            className="p-2 text-gray-700 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-all duration-300"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          />
          
          {/* Auth Buttons */}
          <div className="hidden sm:flex items-center space-x-3">
            <Button
              type="text"
              icon={<LoginOutlined />}
              onClick={() => navigate('/login')}
              className="flex items-center space-x-2 px-4 lg:px-5 py-2 h-10 lg:h-11 font-semibold text-gray-700 hover:text-amber-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 border-2 border-gray-200 hover:border-amber-300 rounded-xl transition-all duration-300 hover:shadow-lg"
            >
              <span className="hidden md:inline">Sign In</span>
            </Button>
            
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => navigate('/register')}
              className="btn-glow-amber flex items-center space-x-2 px-4 lg:px-6 py-2 h-10 lg:h-11 font-bold bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:via-amber-700 hover:to-amber-800 border-none rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <span className="hidden md:inline">Get Started</span>
              <span className="md:hidden">Join</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            type="text"
            icon={<MenuOutlined />}
            className="lg:hidden p-2 text-gray-700 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-all duration-300"
            onClick={() => setMobileMenuOpen(true)}
          />
        </div>
      </Header>

      {/* Mobile Menu Drawer */}
      <Drawer
        title={
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-lg flex items-center justify-center mr-3 shadow-lg">
              <GlobalOutlined className="text-white text-sm" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 bg-clip-text text-transparent">
              TerraFlow
            </span>
          </div>
        }
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={300}
        className="lg:hidden"
        closeIcon={<CloseOutlined className="text-gray-600" />}
        styles={{
          header: {
            borderBottom: '1px solid #f0f0f0',
            background: 'linear-gradient(135deg, #fef7e0 0%, #fef3c7 100%)'
          },
          body: { padding: 0 }
        }}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Navigation Menu */}
          <div className="flex-1 p-4">
            <Menu
              mode="inline"
              selectedKeys={[location.pathname.slice(1) || 'home']}
              items={mobileMenuItems}
              className="border-none bg-transparent"
              style={{ fontSize: '16px' }}
            />
          </div>

          {/* Mobile Auth Buttons */}
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <div className="space-y-3">
              {/* Dark Mode Toggle for Mobile */}
              <Button
                type="text"
                icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 h-12 font-semibold text-gray-700 hover:text-amber-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 border-2 border-gray-200 hover:border-amber-300 rounded-xl transition-all duration-300"
              >
                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </Button>
              
              <Button
                type="text"
                icon={<LoginOutlined />}
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 h-12 font-semibold text-gray-700 hover:text-amber-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 border-2 border-gray-200 hover:border-amber-300 rounded-xl transition-all duration-300"
              >
                <span>Sign In</span>
              </Button>
              
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => {
                  navigate('/register');
                  setMobileMenuOpen(false);
                }}
                className="w-full btn-glow-amber flex items-center justify-center space-x-2 px-4 py-3 h-12 font-bold bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:via-amber-700 hover:to-amber-800 border-none rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <span>Get Started</span>
              </Button>
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
};