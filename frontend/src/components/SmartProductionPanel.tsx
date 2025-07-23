import React, { useState, useEffect } from 'react';
import { Card, Table, Button, message, Tag, Typography, Space, Progress } from 'antd';
import { 
  BulbOutlined, 
  WarningOutlined, 
  CheckCircleOutlined,
  SyncOutlined,
  ThunderboltOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface ProductionRecommendation {
  id: number;
  product_id: number;
  product_name: string;
  category: string;
  current_stock: number;
  recommended_quantity: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reason: string;
  demand_forecast: number;
  profit_margin: number;
  created_at: string;
  is_implemented: boolean;
}

interface AnalyticsData {
  monthly_stats: {
    total_recommendations: number;
    urgent_count: number;
    high_count: number;
    total_recommended_units: number;
    avg_profit_margin: number;
  };
  top_products: Array<{
    name: string;
    category: string;
    total_sold: number;
    total_revenue: number;
  }>;
  low_stock_alerts: Array<{
    id: number;
    name: string;
    stock_quantity: number;
    minimum_stock: number;
    category: string;
  }>;
}

const SmartProductionPanel: React.FC = () => {
  const [recommendations, setRecommendations] = useState<ProductionRecommendation[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchRecommendations();
    fetchAnalytics();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/production/recommendations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        setRecommendations(result.data);
      } else {
        message.error(result.message || 'Failed to fetch recommendations');
      }
    } catch (error) {
      message.error('Failed to fetch recommendations');
      console.error('Fetch recommendations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/production/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error('Fetch analytics error:', error);
    }
  };

  const generateNewRecommendations = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/production/recommendations/generate?period_days=30', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        // Save the generated recommendations
        const saveResponse = await fetch('http://localhost:5000/api/production/recommendations/save', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ recommendations: result.data.recommendations })
        });

        const saveResult = await saveResponse.json();
        if (saveResult.success) {
          message.success('New production recommendations generated successfully');
          fetchRecommendations();
          fetchAnalytics();
        } else {
          message.error('Failed to save recommendations');
        }
      } else {
        message.error(result.message || 'Failed to generate recommendations');
      }
    } catch (error) {
      message.error('Failed to generate recommendations');
      console.error('Generate recommendations error:', error);
    } finally {
      setGenerating(false);
    }
  };

  const markAsImplemented = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/production/recommendations/${id}/implement`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        message.success('Recommendation marked as implemented');
        fetchRecommendations();
      } else {
        message.error(result.message || 'Failed to update recommendation');
      }
    } catch (error) {
      message.error('Failed to update recommendation');
      console.error('Mark implemented error:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <WarningOutlined />;
      case 'high': return <ThunderboltOutlined />;
      case 'medium': return <BulbOutlined />;
      case 'low': return <CheckCircleOutlined />;
      default: return null;
    }
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text: string, record: ProductionRecommendation) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary">{record.category.replace('_', ' ')}</Text>
        </div>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)} icon={getPriorityIcon(priority)}>
          {priority.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Current Stock',
      dataIndex: 'current_stock',
      key: 'current_stock',
      render: (stock: number) => (
        <Text>{stock} units</Text>
      ),
    },
    {
      title: 'Recommended Quantity',
      dataIndex: 'recommended_quantity',
      key: 'recommended_quantity',
      render: (quantity: number) => (
        <Text strong style={{ color: '#8B4513' }}>{quantity} units</Text>
      ),
    },
    {
      title: 'Profit Margin',
      dataIndex: 'profit_margin',
      key: 'profit_margin',
      render: (margin: number) => (
        <Progress 
          percent={margin} 
          size="small" 
          strokeColor="#52c41a"
          format={percent => `${percent}%`}
        />
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string) => (
        <Text type="secondary">{reason}</Text>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: ProductionRecommendation) => (
        <Button 
          type="primary" 
          size="small"
          onClick={() => markAsImplemented(record.id)}
          style={{ backgroundColor: '#8B4513', borderColor: '#8B4513' }}
        >
          Mark as Implemented
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>
          <BulbOutlined style={{ marginRight: 8, color: '#8B4513' }} />
          Smart Production Recommendations
        </Title>
        <Button 
          type="primary" 
          icon={<SyncOutlined />}
          loading={generating}
          onClick={generateNewRecommendations}
          style={{ backgroundColor: '#8B4513', borderColor: '#8B4513' }}
        >
          Generate New Recommendations
        </Button>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div style={{ marginBottom: 24 }}>
          <Space direction="horizontal" size="large" style={{ width: '100%', justifyContent: 'space-around' }}>
            <Card size="small" style={{ textAlign: 'center', minWidth: 150 }}>
              <Title level={4} style={{ margin: 0, color: '#8B4513' }}>
                {analytics.monthly_stats.total_recommendations}
              </Title>
              <Text type="secondary">Total Recommendations</Text>
            </Card>
            
            <Card size="small" style={{ textAlign: 'center', minWidth: 150 }}>
              <Title level={4} style={{ margin: 0, color: '#ff4d4f' }}>
                {analytics.monthly_stats.urgent_count}
              </Title>
              <Text type="secondary">Urgent Items</Text>
            </Card>
            
            <Card size="small" style={{ textAlign: 'center', minWidth: 150 }}>
              <Title level={4} style={{ margin: 0, color: '#fa8c16' }}>
                {analytics.monthly_stats.high_count}
              </Title>
              <Text type="secondary">High Priority</Text>
            </Card>
            
            <Card size="small" style={{ textAlign: 'center', minWidth: 150 }}>
              <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                {analytics.monthly_stats.total_recommended_units}
              </Title>
              <Text type="secondary">Total Units to Produce</Text>
            </Card>
            
            <Card size="small" style={{ textAlign: 'center', minWidth: 150 }}>
              <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                {analytics.monthly_stats.avg_profit_margin?.toFixed(1)}%
              </Title>
              <Text type="secondary">Avg Profit Margin</Text>
            </Card>
          </Space>
        </div>
      )}

      {/* Low Stock Alerts */}
      {analytics?.low_stock_alerts && analytics.low_stock_alerts.length > 0 && (
        <Card 
          title={
            <span>
              <WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
              Low Stock Alerts
            </span>
          }
          style={{ marginBottom: 24 }}
          size="small"
        >
          <Space wrap>
            {analytics.low_stock_alerts.map((item) => (
              <Tag key={item.id} color="red">
                {item.name}: {item.stock_quantity}/{item.minimum_stock}
              </Tag>
            ))}
          </Space>
        </Card>
      )}

      {/* Recommendations Table */}
      <Card title="Production Recommendations">
        <Table
          columns={columns}
          dataSource={recommendations}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} recommendations`
          }}
          locale={{
            emptyText: (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <BulbOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                <br />
                <Text type="secondary">No recommendations available</Text>
                <br />
                <Button 
                  type="primary" 
                  onClick={generateNewRecommendations}
                  loading={generating}
                  style={{ marginTop: 16, backgroundColor: '#8B4513', borderColor: '#8B4513' }}
                >
                  Generate Recommendations
                </Button>
              </div>
            )
          }}
        />
      </Card>
    </div>
  );
};

export default SmartProductionPanel;
