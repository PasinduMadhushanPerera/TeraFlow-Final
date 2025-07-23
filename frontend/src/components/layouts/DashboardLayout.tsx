import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import { DashboardNavbar } from '../navigation/DashboardNavbar';
import { Footer } from '../common/Footer';
const {
  Content
} = Layout;
interface DashboardLayoutProps {
  userRole: 'admin' | 'supplier' | 'customer';
}
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  userRole
}) => {
  return <Layout className="min-h-screen">
      <DashboardNavbar userRole={userRole} />
      <Content className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </Content>
      <Footer />
    </Layout>;
};