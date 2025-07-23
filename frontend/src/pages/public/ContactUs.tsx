import React from 'react';
import { Card, Row, Col, Typography, Form, Input, Button, Space, message } from 'antd';
import { MailOutlined, PhoneOutlined, EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons';
const {
  Title,
  Paragraph,
  Text
} = Typography;
const {
  TextArea
} = Input;
export const ContactUs: React.FC = () => {
  const [form] = Form.useForm();
  const onFinish = async (values: any) => {
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    message.success('Thank you for your message! We will get back to you soon.');
    form.resetFields();
  };
  const contactInfo = [{
    icon: <PhoneOutlined className="text-2xl text-amber-700" />,
    title: 'Phone',
    content: '072-2698542',
    subtitle: 'Mon-Fri 9AM-6PM EST'
  }, {
    icon: <MailOutlined className="text-2xl text-amber-700" />,
    title: 'Email',
    content: 'info@terraflow.com',
    subtitle: "We'll respond within 24 hours"
  }, {
    icon: <EnvironmentOutlined className="text-2xl text-amber-700" />,
    title: 'Address',
    content: '123 Clay Street, Pottery District',
    subtitle: 'New York, NY 10001'
  }, {
    icon: <ClockCircleOutlined className="text-2xl text-amber-700" />,
    title: 'Business Hours',
    content: 'Monday - Friday: 9AM - 6PM',
    subtitle: 'Saturday: 10AM - 4PM'
  }];
  return <div className="w-full py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Title level={1} className="text-amber-900 mb-4">
            Contact Us
          </Title>
          <Paragraph className="text-xl text-gray-600 max-w-3xl mx-auto">
            Have questions about our products or services? We'd love to hear
            from you. Send us a message and we'll respond as soon as possible.
          </Paragraph>
        </div>
        <Row gutter={[32, 32]}>
          {/* Contact Information */}
          <Col xs={24} lg={10}>
            <div className="mb-8">
              <Title level={2} className="text-amber-900 mb-6">
                Get in Touch
              </Title>
              <Space direction="vertical" size="large" className="w-full">
                {contactInfo.map((info, index) => <Card key={index} className="shadow-md">
                    <div className="flex items-start gap-4">
                      {info.icon}
                      <div>
                        <Title level={4} className="text-amber-800 mb-1">
                          {info.title}
                        </Title>
                        <Text strong className="text-gray-700 block">
                          {info.content}
                        </Text>
                        <Text className="text-gray-500">{info.subtitle}</Text>
                      </div>
                    </div>
                  </Card>)}
              </Space>
            </div>
            {/* Map Placeholder */}
            <Card className="shadow-md">
              <div className="h-64 bg-amber-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <EnvironmentOutlined className="text-4xl text-amber-700 mb-2" />
                  <Text className="text-amber-700">Interactive Map</Text>
                  <br />
                  <Text className="text-gray-500">Location: New York, NY</Text>
                </div>
              </div>
            </Card>
          </Col>
          {/* Contact Form */}
          <Col xs={24} lg={14}>
            <Card className="shadow-lg">
              <Title level={3} className="text-amber-800 mb-6">
                Send us a Message
              </Title>
              <Form form={form} layout="vertical" onFinish={onFinish} size="large">
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="firstName" label="First Name" rules={[{
                    required: true,
                    message: 'Please enter your first name'
                  }]}>
                      <Input placeholder="Enter your first name" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="lastName" label="Last Name" rules={[{
                    required: true,
                    message: 'Please enter your last name'
                  }]}>
                      <Input placeholder="Enter your last name" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="email" label="Email" rules={[{
                    required: true,
                    message: 'Please enter your email'
                  }, {
                    type: 'email',
                    message: 'Please enter a valid email'
                  }]}>
                      <Input placeholder="Enter your email" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="phone" label="Phone Number">
                      <Input placeholder="Enter your phone number" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="subject" label="Subject" rules={[{
                required: true,
                message: 'Please enter a subject'
              }]}>
                  <Input placeholder="What is this regarding?" />
                </Form.Item>
                <Form.Item name="message" label="Message" rules={[{
                required: true,
                message: 'Please enter your message'
              }]}>
                  <TextArea rows={6} placeholder="Tell us more about your inquiry..." />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" size="large" className="w-full bg-amber-700 hover:bg-amber-800">
                    Send Message
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
        {/* FAQ Section */}
        <div className="mt-16">
          <Title level={2} className="text-center text-amber-900 mb-8">
            Frequently Asked Questions
          </Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card className="h-full shadow-md">
                <Title level={4} className="text-amber-800 mb-3">
                  What types of clay products do you offer?
                </Title>
                <Paragraph className="text-gray-600">
                  We offer a wide range of clay products including raw
                  materials, finished pottery, ceramic tiles, and custom
                  sculpting clay.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card className="h-full shadow-md">
                <Title level={4} className="text-amber-800 mb-3">
                  How do I place a bulk order?
                </Title>
                <Paragraph className="text-gray-600">
                  For bulk orders, please contact our sales team directly or
                  register as a customer to access our online ordering system.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card className="h-full shadow-md">
                <Title level={4} className="text-amber-800 mb-3">
                  Do you offer international shipping?
                </Title>
                <Paragraph className="text-gray-600">
                  Yes, we ship to over 15 countries worldwide. Contact us for
                  specific shipping rates and delivery times.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card className="h-full shadow-md">
                <Title level={4} className="text-amber-800 mb-3">
                  How can I become a supplier?
                </Title>
                <Paragraph className="text-gray-600">
                  Register as a supplier through our platform and submit your
                  business documentation for approval by our team.
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>;
};