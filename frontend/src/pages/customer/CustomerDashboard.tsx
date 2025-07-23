import React from 'react';
import { Card, Row, Col, Typography, Statistic, List, Button, Badge, Progress } from 'antd';
import { ShoppingCartOutlined, TruckOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
const {
  Title
} = Typography;
export const CustomerDashboard: React.FC = () => {
  const recentOrders = [{
    id: 'ORD-001',
    product: 'Premium Red Clay',
    status: 'Delivered',
    date: '2024-01-15'
  }, {
    id: 'ORD-002',
    product: 'Stoneware Clay',
    status: 'In Transit',
    date: '2024-01-18'
  }, {
    id: 'ORD-003',
    product: 'Ceramic Tiles',
    status: 'Processing',
    date: '2024-01-20'
  }];
  const recommendations = [{
    name: 'Porcelain Clay',
    price: 'Rs. 68.99',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop'
  }, {
    name: 'Clay Pottery Set',
    price: 'Rs. 129.99',
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=100&h=100&fit=crop'
  }];
  return <div className="w-full">
      <Title level={2} className="text-amber-900 mb-6">
        Customer Dashboard
      </Title>
      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Total Orders" value={12} prefix={<ShoppingCartOutlined className="text-amber-700" />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="In Transit" value={2} prefix={<TruckOutlined className="text-blue-600" />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Delivered" value={8} prefix={<CheckCircleOutlined className="text-green-600" />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Pending" value={2} prefix={<ClockCircleOutlined className="text-orange-600" />} />
          </Card>
        </Col>
      </Row>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="Recent Orders" className="mb-6">
            <List dataSource={recentOrders} renderItem={order => <List.Item>
                  <List.Item.Meta title={`${order.id} - ${order.product}`} description={`Order Date: ${order.date}`} />
                  <Badge status={order.status === 'Delivered' ? 'success' : order.status === 'In Transit' ? 'processing' : 'default'} text={order.status} />
                </List.Item>} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Recommended Products" className="mb-6">
            <List dataSource={recommendations} renderItem={product => <List.Item>
                  <List.Item.Meta avatar={<img src={product.image} alt={product.name} className="w-12 h-12 rounded" />} title={product.name} description={product.price} />
                  <Button type="primary" size="small" className="bg-amber-700">
                    Add to Cart
                  </Button>
                </List.Item>} />
          </Card>
        </Col>
      </Row>
    </div>;
};