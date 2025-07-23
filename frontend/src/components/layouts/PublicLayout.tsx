import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import { PublicNavbar } from '../navigation/PublicNavbar';
import { Footer } from '../common/Footer';
const {
  Content
} = Layout;
export const PublicLayout: React.FC = () => {
  return (
    <Layout className="min-h-screen">
      <PublicNavbar />
      <Content className="flex-1 pt-16">
        <Outlet />
      </Content>
      <Footer />
    </Layout>
  );
};