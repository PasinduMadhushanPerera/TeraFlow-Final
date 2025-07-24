import React from 'react';
import { Button, Card, Row, Col, Typography, Space } from 'antd';
import { 
  ArrowRightOutlined, 
  ShoppingCartOutlined, 
  StarOutlined, 
  SafetyOutlined,
  TruckOutlined,
  CustomerServiceOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Premium Clay Products',
      description: 'High-quality clay materials sourced from the finest deposits worldwide',
      icon: <SafetyOutlined className="text-4xl text-amber-600" />,
      color: 'amber'
    },
    {
      title: 'Reliable Supply Chain',
      description: 'Consistent delivery and advanced inventory management system',
      icon: <TruckOutlined className="text-4xl text-blue-600" />,
      color: 'blue'
    },
    {
      title: 'Expert Support',
      description: '24/7 professional guidance for all your clay product needs',
      icon: <CustomerServiceOutlined className="text-4xl text-green-600" />,
      color: 'green'
    }
  ];

  const benefits = [
    'Premium Quality Materials',
    'Fast & Reliable Delivery',
    'Competitive Pricing',
    'Expert Customer Support',
    'Advanced Inventory Management',
    'Sustainable Sourcing'
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      company: 'Pottery Studio Pro',
      text: 'TerraFlow has revolutionized our clay sourcing process. The quality is exceptional and delivery is always on time.',
      rating: 5
    },
    {
      name: 'Mike Chen',
      company: 'Ceramic Arts Inc',
      text: 'The supply chain management system is intuitive and has streamlined our entire ordering process.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      company: 'Terra Ceramics',
      text: 'Outstanding customer service and premium clay products. Highly recommend TerraFlow to any ceramic business.',
      rating: 5
    }
  ];

  return (
    <div className="w-full min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 py-20 lg:py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-white/10"></div>
        <div className="relative max-w-7xl mx-auto">
          <Row align="middle" gutter={[48, 48]}>
            <Col xs={24} lg={12}>
              <div className="text-center lg:text-left">
                <Title level={1} className="text-amber-900 mb-6 text-4xl lg:text-6xl font-bold leading-tight">
                  Welcome to <span className="text-amber-700">TerraFlow</span>
                </Title>
                <Paragraph className="text-xl lg:text-2xl text-gray-700 mb-8 leading-relaxed">
                  Your premier destination for high-quality clay products and 
                  comprehensive supply chain management solutions.
                </Paragraph>
                <Space size="large" className="flex flex-col sm:flex-row items-center lg:items-start">
                  <Button 
                    type="primary" 
                    size="large" 
                    icon={<ShoppingCartOutlined />} 
                    onClick={() => navigate('/products')} 
                    className="bg-amber-700 hover:bg-amber-800 border-amber-700 h-14 px-8 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Browse Products
                  </Button>
                  <Button 
                    size="large" 
                    icon={<ArrowRightOutlined />} 
                    onClick={() => navigate('/login')} 
                    className="h-14 px-8 text-lg font-medium border-2 border-amber-700 text-amber-700 hover:bg-amber-700 hover:text-white transition-all duration-300"
                  >
                    Access Dashboard
                  </Button>
                </Space>
              </div>
            </Col>
            <Col xs={24} lg={12}>
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-80 h-80 lg:w-96 lg:h-96 bg-gradient-to-br from-amber-200 to-orange-300 rounded-full flex items-center justify-center shadow-2xl">
                    <div className="text-8xl lg:text-9xl">🏺</div>
                  </div>
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-600 rounded-full flex items-center justify-center shadow-xl">
                    <CheckCircleOutlined className="text-white text-2xl" />
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 lg:py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Title level={2} className="text-amber-900 mb-6 text-3xl lg:text-4xl font-bold">
              Why Choose TerraFlow?
            </Title>
            <Paragraph className="text-xl text-gray-600 max-w-3xl mx-auto">
              We provide comprehensive solutions that transform your clay product sourcing 
              and supply chain management experience.
            </Paragraph>
          </div>
          <Row gutter={[32, 32]}>
            {features.map((feature, index) => (
              <Col xs={24} md={8} key={index}>
                <Card 
                  className="text-center h-full shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0"
                  styles={{ body: { padding: '2rem' } }}
                >
                  <div className="mb-6">{feature.icon}</div>
                  <Title level={4} className="text-gray-800 mb-4 text-xl">
                    {feature.title}
                  </Title>
                  <Paragraph className="text-gray-600 text-base leading-relaxed">
                    {feature.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 lg:py-32 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} lg={12}>
              <Title level={2} className="text-amber-900 mb-8 text-3xl lg:text-4xl font-bold">
                Experience Excellence
              </Title>
              <Paragraph className="text-xl text-gray-600 mb-8 leading-relaxed">
                Our commitment to quality and innovation ensures you receive the best 
                clay products and services in the industry.
              </Paragraph>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircleOutlined className="text-green-600 text-xl" />
                    <Text className="text-lg text-gray-700">{benefit}</Text>
                  </div>
                ))}
              </div>
            </Col>
            <Col xs={24} lg={12}>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-100 p-6 rounded-lg text-center">
                  <Title level={3} className="text-amber-800 mb-2">500+</Title>
                  <Text className="text-amber-700">Happy Customers</Text>
                </div>
                <div className="bg-blue-100 p-6 rounded-lg text-center">
                  <Title level={3} className="text-blue-800 mb-2">50+</Title>
                  <Text className="text-blue-700">Product Varieties</Text>
                </div>
                <div className="bg-green-100 p-6 rounded-lg text-center">
                  <Title level={3} className="text-green-800 mb-2">99.9%</Title>
                  <Text className="text-green-700">Uptime</Text>
                </div>
                <div className="bg-purple-100 p-6 rounded-lg text-center">
                  <Title level={3} className="text-purple-800 mb-2">24/7</Title>
                  <Text className="text-purple-700">Support</Text>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 lg:py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Title level={2} className="text-amber-900 mb-6 text-3xl lg:text-4xl font-bold">
              What Our Customers Say
            </Title>
            <Paragraph className="text-xl text-gray-600 max-w-3xl mx-auto">
              Don't just take our word for it - hear from our satisfied customers 
              who have transformed their businesses with TerraFlow.
            </Paragraph>
          </div>
          <Row gutter={[32, 32]}>
            {testimonials.map((testimonial, index) => (
              <Col xs={24} lg={8} key={index}>
                <Card 
                  className="h-full shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                  styles={{ body: { padding: '2rem' } }}
                >
                  <div className="mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarOutlined key={i} className="text-yellow-500 text-xl mr-1" />
                    ))}
                  </div>
                  <Paragraph className="text-gray-700 mb-6 text-base leading-relaxed italic">
                    "{testimonial.text}"
                  </Paragraph>
                  <div className="border-t pt-4">
                    <Text strong className="text-amber-800 text-lg block">
                      {testimonial.name}
                    </Text>
                    <Text className="text-gray-600">{testimonial.company}</Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 lg:py-32 px-6 bg-gradient-to-r from-amber-800 to-amber-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <Title level={2} className="text-white mb-6 text-3xl lg:text-4xl font-bold">
            Ready to Transform Your Supply Chain?
          </Title>
          <Paragraph className="text-xl lg:text-2xl text-amber-100 mb-10 leading-relaxed">
            Join thousands of satisfied customers who trust TerraFlow for their 
            clay product needs and supply chain excellence.
          </Paragraph>
          <Space size="large" className="flex flex-col sm:flex-row justify-center">
            <Button 
              type="primary" 
              size="large" 
              onClick={() => navigate('/register')} 
              className="bg-white text-amber-800 hover:bg-amber-50 border-white h-14 px-10 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Your Journey Today
            </Button>
            <Button 
              size="large" 
              onClick={() => navigate('/contact')} 
              className="h-14 px-10 text-lg font-medium border-2 border-white text-white hover:bg-white hover:text-amber-800 transition-all duration-300"
            >
              Contact Us
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};