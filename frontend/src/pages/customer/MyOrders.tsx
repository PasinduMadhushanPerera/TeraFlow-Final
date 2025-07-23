import React from 'react';
import { Typography } from 'antd';
const {
  Title
} = Typography;
export const MyOrders: React.FC = () => {
  return <div className="w-full">
      <Title level={2} className="text-amber-900 mb-6">
        My Orders
      </Title>
      <p>My orders page content will be implemented here.</p>
    </div>;
};