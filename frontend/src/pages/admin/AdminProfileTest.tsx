import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Text } = Typography;

// Simple test version of AdminProfile to check if the basic component works
export const AdminProfileTest: React.FC = () => {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <Title level={2} className="text-amber-900 mb-2">
            Admin Profile Test
          </Title>
          <Text className="text-gray-600">
            This is a simple test version of the admin profile. If you can see this, the component is working.
          </Text>
          <div className="mt-4">
            <p>✅ React component is rendering</p>
            <p>✅ Ant Design components are working</p>
            <p>✅ Tailwind classes are being applied</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
