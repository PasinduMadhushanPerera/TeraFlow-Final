import React from 'react';
import { Card, Row, Col, Typography, Timeline, Space } from 'antd';
import { TeamOutlined, TrophyOutlined, GlobalOutlined, HeartOutlined } from '@ant-design/icons';
const {
  Title,
  Paragraph,
  Text
} = Typography;
export const AboutUs: React.FC = () => {
  const values = [{
    icon: <HeartOutlined className="text-4xl text-amber-700" />,
    title: 'Quality First',
    description: 'We never compromise on the quality of our clay products and services.'
  }, {
    icon: <TeamOutlined className="text-4xl text-amber-700" />,
    title: 'Customer Focus',
    description: 'Our customers are at the heart of everything we do.'
  }, {
    icon: <GlobalOutlined className="text-4xl text-amber-700" />,
    title: 'Sustainability',
    description: 'We are committed to environmentally responsible practices.'
  }, {
    icon: <TrophyOutlined className="text-4xl text-amber-700" />,
    title: 'Excellence',
    description: 'We strive for excellence in every aspect of our business.'
  }];
  const milestones = [{
    year: '2018',
    title: 'Company Founded',
    description: 'TerraFlow was established with a vision to revolutionize clay supply chains.'
  }, {
    year: '2019',
    title: 'First Major Contract',
    description: 'Secured our first major contract with a leading pottery manufacturer.'
  }, {
    year: '2021',
    title: 'Digital Platform Launch',
    description: 'Launched our comprehensive digital supply chain management platform.'
  }, {
    year: '2023',
    title: 'International Expansion',
    description: 'Expanded operations to serve customers across multiple countries.'
  }, {
    year: '2024',
    title: 'Sustainability Initiative',
    description: 'Launched our green supply chain initiative for environmental responsibility.'
  }];
  return <div className="w-full py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Title level={1} className="text-amber-900 mb-6">
            About TerraFlow
          </Title>
          <Paragraph className="text-xl text-gray-600 max-w-4xl mx-auto">
            Since 2018, TerraFlow has been at the forefront of clay product
            supply chain management, connecting suppliers, manufacturers, and
            customers through innovative technology and unwavering commitment to
            quality.
          </Paragraph>
        </div>
        {/* Mission & Vision */}
        <Row gutter={[32, 32]} className="mb-16">
          <Col xs={24} md={12}>
            <Card className="h-full shadow-lg">
              <Title level={3} className="text-amber-800 mb-4">
                Our Mission
              </Title>
              <Paragraph className="text-gray-700 text-lg">
                To provide the highest quality clay products and supply chain
                solutions while fostering sustainable practices and building
                lasting partnerships with our customers and suppliers.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card className="h-full shadow-lg">
              <Title level={3} className="text-amber-800 mb-4">
                Our Vision
              </Title>
              <Paragraph className="text-gray-700 text-lg">
                To be the global leader in clay product supply chain management,
                setting industry standards for quality, innovation, and
                sustainability while empowering artisans and manufacturers
                worldwide.
              </Paragraph>
            </Card>
          </Col>
        </Row>
        {/* Values */}
        <div className="mb-16">
          <Title level={2} className="text-center text-amber-900 mb-12">
            Our Core Values
          </Title>
          <Row gutter={[32, 32]}>
            {values.map((value, index) => <Col xs={24} sm={12} lg={6} key={index}>
                <Card className="text-center h-full shadow-lg hover:shadow-xl transition-shadow">
                  <Space direction="vertical" size="large" className="w-full">
                    {value.icon}
                    <Title level={4} className="text-amber-800">
                      {value.title}
                    </Title>
                    <Paragraph className="text-gray-600">
                      {value.description}
                    </Paragraph>
                  </Space>
                </Card>
              </Col>)}
          </Row>
        </div>
        {/* Company Timeline */}
        <div className="mb-16">
          <Title level={2} className="text-center text-amber-900 mb-12">
            Our Journey
          </Title>
          <Card className="shadow-lg">
            <Timeline mode="alternate" items={milestones.map(milestone => ({
            children: <div>
                    <Title level={4} className="text-amber-800 mb-2">
                      {milestone.year} - {milestone.title}
                    </Title>
                    <Paragraph className="text-gray-600">
                      {milestone.description}
                    </Paragraph>
                  </div>
          }))} />
          </Card>
        </div>
        {/* Statistics */}
        <div className="bg-amber-50 rounded-lg p-8">
          <Title level={2} className="text-center text-amber-900 mb-8">
            TerraFlow by the Numbers
          </Title>
          <Row gutter={[32, 32]} className="text-center">
            <Col xs={24} sm={6}>
              <div>
                <Title level={2} className="text-amber-700 mb-2">
                  500+
                </Title>
                <Text className="text-gray-600 text-lg">Happy Customers</Text>
              </div>
            </Col>
            <Col xs={24} sm={6}>
              <div>
                <Title level={2} className="text-amber-700 mb-2">
                  50+
                </Title>
                <Text className="text-gray-600 text-lg">Trusted Suppliers</Text>
              </div>
            </Col>
            <Col xs={24} sm={6}>
              <div>
                <Title level={2} className="text-amber-700 mb-2">
                  1M+
                </Title>
                <Text className="text-gray-600 text-lg">
                  Products Delivered
                </Text>
              </div>
            </Col>
            <Col xs={24} sm={6}>
              <div>
                <Title level={2} className="text-amber-700 mb-2">
                  15+
                </Title>
                <Text className="text-gray-600 text-lg">Countries Served</Text>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </div>;
};