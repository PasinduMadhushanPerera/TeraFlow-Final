import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Row, 
  Col, 
  Card, 
  Statistic, 
  List, 
  Badge, 
  Button, 
  Alert,
  Spin,
  Progress,
  Tag,
  Timeline,
  message
} from 'antd';
import {
  InboxOutlined,
  TruckOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  RiseOutlined,
  CalendarOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  totalDeliveries: number;
  onTimeDeliveries: number;
  performanceScore: number;
  currentMonthRequests: number;
}

interface MaterialRequest {
  id: number;
  material_type: string;
  quantity: number;
  unit: string;
  required_date: string;
  status: string;
  description: string;
  created_at: string;
  priority: string;
}

interface RecentActivity {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  status: string;
}

export const SupplierDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRequests, setRecentRequests] = useState<MaterialRequest[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('terraflow_token');
      
      if (!token) {
        message.error('Authentication token not found');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch dashboard statistics
      const dashboardResponse = await fetch('http://localhost:5000/api/supplier/dashboard', {
        headers
      });
      
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        if (dashboardData.success) {
          setStats(dashboardData.data.stats);
          setRecentActivity(dashboardData.data.recentActivity || []);
        }
      }

      // Fetch recent material requests
      const requestsResponse = await fetch('http://localhost:5000/api/supplier/requests?limit=5', {
        headers
      });
      
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        if (requestsData.success) {
          setRecentRequests(requestsData.data);
        }
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'orange';
      case 'approved': return 'blue';
      case 'in_progress': return 'purple';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return '#ff4d4f';
      case 'high': return '#fa8c16';
      case 'medium': return '#fadb14';
      case 'low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <Title level={2} className="text-amber-900 mb-2">
          Supplier Dashboard
        </Title>
        <Text className="text-gray-600">
          Welcome back, {user?.fullName}! Manage your material requests and deliveries.
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Requests"
              value={stats?.totalRequests || 0}
              prefix={<InboxOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Requests"
              value={stats?.pendingRequests || 0}
              prefix={<ClockCircleOutlined className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="In Progress"
              value={stats?.inProgressRequests || 0}
              prefix={<TruckOutlined className="text-purple-500" />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats?.completedRequests || 0}
              prefix={<CheckCircleOutlined className="text-green-500" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Performance and Recent Requests */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card title="Performance Overview" className="h-full">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Text>Performance Score</Text>
                  <Text strong>{stats?.performanceScore || 0}%</Text>
                </div>
                <Progress 
                  percent={stats?.performanceScore || 0} 
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Text>On-Time Delivery Rate</Text>
                  <Text strong>
                    {stats?.totalDeliveries ? 
                      Math.round(((stats.onTimeDeliveries || 0) / stats.totalDeliveries) * 100) : 0}%
                  </Text>
                </div>
                <Progress 
                  percent={stats?.totalDeliveries ? 
                    Math.round(((stats.onTimeDeliveries || 0) / stats.totalDeliveries) * 100) : 0}
                  strokeColor="#52c41a"
                />
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Total Deliveries"
                    value={stats?.totalDeliveries || 0}
                    prefix={<TruckOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="This Month"
                    value={stats?.currentMonthRequests || 0}
                    prefix={<CalendarOutlined />}
                  />
                </Col>
              </Row>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title="Recent Material Requests" 
            extra={
              <Button type="link" href="/supplier/requests">
                View All
              </Button>
            }
            className="h-full"
          >
            <List
              dataSource={recentRequests}
              renderItem={(request) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <div className="flex justify-between items-center">
                        <Text strong>{request.material_type}</Text>
                        <Badge 
                          color={getStatusColor(request.status)}
                          text={request.status.replace('_', ' ').toUpperCase()}
                        />
                      </div>
                    }
                    description={
                      <div>
                        <Text type="secondary">
                          Quantity: {request.quantity} {request.unit} | 
                          Required: {new Date(request.required_date).toLocaleDateString()}
                        </Text>
                        {request.priority && (
                          <Tag 
                            color={getPriorityColor(request.priority)}
                            className="ml-2"
                          >
                            {request.priority.toUpperCase()}
                          </Tag>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'No recent requests' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Activity Timeline */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Recent Activity">
            {recentActivity.length > 0 ? (
              <Timeline>
                {recentActivity.map((activity) => (
                  <Timeline.Item
                    key={activity.id}
                    color={getStatusColor(activity.status)}
                    dot={
                      activity.type === 'delivery' ? <TruckOutlined /> :
                      activity.type === 'request' ? <InboxOutlined /> :
                      <CheckCircleOutlined />
                    }
                  >
                    <div>
                      <Text strong>{activity.description}</Text>
                      <br />
                      <Text type="secondary" className="text-sm">
                        {new Date(activity.timestamp).toLocaleString()}
                      </Text>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Text type="secondary">No recent activity</Text>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Quick Actions">
            <div className="space-y-3">
              <Button 
                type="primary" 
                icon={<InboxOutlined />} 
                block
                href="/supplier/requests"
              >
                View Material Requests
              </Button>
              <Button 
                icon={<TruckOutlined />} 
                block
                href="/supplier/history"
              >
                Delivery History
              </Button>
              <Button 
                icon={<StarOutlined />} 
                block
                href="/supplier/profile"
              >
                Update Profile
              </Button>
              <Button 
                icon={<RiseOutlined />} 
                block
                href="/supplier/forecasts"
              >
                View Forecasts
              </Button>
            </div>
          </Card>

          {/* Performance Alert */}
          {stats && stats.performanceScore < 80 && (
            <Alert
              className="mt-4"
              message="Performance Notice"
              description="Your performance score is below 80%. Consider improving delivery times to maintain good standing."
              type="warning"
              icon={<WarningOutlined />}
              showIcon
            />
          )}
        </Col>
      </Row>
    </div>
  );
};