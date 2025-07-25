import React from 'react';
import { Layout, Row, Col, Typography, Space } from 'antd';
import { FacebookOutlined, TwitterOutlined, LinkedinOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
const {
  Footer: AntFooter
} = Layout;
const {
  Title,
  Text,
  Link
} = Typography;
export const Footer: React.FC = () => {
  return <AntFooter className="bg-gradient-to-br from-amber-100 via-orange-100 to-amber-200 text-amber-900 mt-auto">
      <div className="max-w-7xl mx-auto py-8">
        <Row gutter={[32, 32]}>
          <Col xs={24} sm={12} md={6}>
            <Title level={4} className="text-amber-900 mb-4">
              TerraFlow
            </Title>
            <Text className="text-amber-800">
              Leading provider of premium clay products and supply chain
              solutions.
            </Text>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Title level={5} className="text-amber-900 mb-4">
              Quick Links
            </Title>
            <div className="flex flex-col gap-2">
              <Link href="/about" className="text-amber-700 hover:text-amber-900">
                About Us
              </Link>
              <Link href="/products" className="text-amber-700 hover:text-amber-900">
                Products
              </Link>
              <Link href="/contact" className="text-amber-700 hover:text-amber-900">
                Contact
              </Link>
              <Link href="#" className="text-amber-700 hover:text-amber-900">
                Privacy Policy
              </Link>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Title level={5} className="text-amber-900 mb-4">
              Contact Info
            </Title>
            <Space direction="vertical" className="text-amber-800">
              <div className="flex items-center gap-2">
                <PhoneOutlined />
                <Text className="text-amber-800">072-2698542</Text>
              </div>
              <div className="flex items-center gap-2">
                <MailOutlined />
                <Text className="text-amber-800">info@terraflow.com</Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Title level={5} className="text-amber-900 mb-4">
              Follow Us
            </Title>
            <Space size="large">
              <FacebookOutlined className="text-amber-700 hover:text-amber-900 text-xl cursor-pointer" />
              <TwitterOutlined className="text-amber-700 hover:text-amber-900 text-xl cursor-pointer" />
              <LinkedinOutlined className="text-amber-700 hover:text-amber-900 text-xl cursor-pointer" />
            </Space>
          </Col>
        </Row>
        <div className="border-t border-amber-300 mt-8 pt-6 text-center">
          <Text className="text-amber-800">
            © 2024 TerraFlow. All rights reserved.
          </Text>
        </div>
      </div>
    </AntFooter>;
};