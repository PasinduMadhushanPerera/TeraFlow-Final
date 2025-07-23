import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Table, 
  Row, 
  Col, 
  Spin, 
  message,
  Select,
  Button,
  Alert,
  Progress,
  Statistic,
  Tag,
  Tooltip,
  Empty,
  List
} from 'antd';
import {
  BarChartOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  ReloadOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface DemandTrend {
  material_type: string;
  request_count: number;
  total_quantity: number;
  avg_quantity: number;
  month: string;
}

interface TopMaterial {
  material_type: string;
  request_count: number;
  total_quantity: number;
  avg_quantity: number;
}

interface ForecastData {
  demandTrend: DemandTrend[];
  topMaterials: TopMaterial[];
  insights: string[];
  forecastNote: string;
}

export const ForecastViewer: React.FC = () => {
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

  useEffect(() => {
    fetchForecastData();
  }, [selectedPeriod]);

  const fetchForecastData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('terraflow_user') ? 
        JSON.parse(localStorage.getItem('terraflow_user')!).token : null;
      
      if (!token) {
        message.error('Authentication token not found');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/supplier/forecast?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setForecastData(data.data);
        } else {
          message.error(data.message || 'Failed to fetch forecast data');
        }
      } else {
        message.error('Failed to fetch forecast data');
      }
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      message.error('Error fetching forecast data');
    } finally {
      setLoading(false);
    }
  };

  const getDemandTrend = (material: string) => {
    if (!forecastData?.demandTrend) return 0;
    
    const recentMonths = forecastData.demandTrend
      .filter(item => item.material_type === material)
      .slice(0, 3)
      .map(item => item.request_count);
    
    if (recentMonths.length < 2) return 0;
    
    const current = recentMonths[0];
    const previous = recentMonths[1];
    
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <RiseOutlined style={{ color: '#52c41a' }} />;
    if (trend < 0) return <FallOutlined style={{ color: '#ff4d4f' }} />;
    return null;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'green';
    if (trend < 0) return 'red';
    return 'default';
  };

  const topMaterialsColumns: ColumnsType<TopMaterial> = [
    {
      title: 'Material Type',
      dataIndex: 'material_type',
      key: 'material_type',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Total Requests',
      dataIndex: 'request_count',
      key: 'request_count',
      sorter: (a, b) => a.request_count - b.request_count,
      render: (count) => (
        <div className="flex items-center">
          <BarChartOutlined className="mr-2" />
          {count}
        </div>
      )
    },
    {
      title: 'Total Quantity',
      dataIndex: 'total_quantity',
      key: 'total_quantity',
      sorter: (a, b) => a.total_quantity - b.total_quantity,
      render: (quantity) => `${quantity} units`
    },
    {
      title: 'Average Quantity',
      dataIndex: 'avg_quantity',
      key: 'avg_quantity',
      sorter: (a, b) => a.avg_quantity - b.avg_quantity,
      render: (avg) => `${Math.round(avg)} units`
    },
    {
      title: 'Trend',
      key: 'trend',
      render: (_, record) => {
        const trend = getDemandTrend(record.material_type);
        return (
          <div className="flex items-center">
            {getTrendIcon(trend)}
            <Tag color={getTrendColor(trend)} className="ml-2">
              {trend > 0 ? '+' : ''}{trend}%
            </Tag>
          </div>
        );
      }
    }
  ];

  const generateInsights = () => {
    if (!forecastData?.topMaterials || forecastData.topMaterials.length === 0) {
      return [];
    }

    const insights = [];
    const topMaterial = forecastData.topMaterials[0];
    
    insights.push(`${topMaterial.material_type} is your most requested material with ${topMaterial.request_count} requests.`);
    
    if (forecastData.topMaterials.length > 1) {
      const secondMaterial = forecastData.topMaterials[1];
      insights.push(`Consider stocking up on ${secondMaterial.material_type} as it shows consistent demand.`);
    }

    // Add trend-based insights
    forecastData.topMaterials.slice(0, 3).forEach(material => {
      const trend = getDemandTrend(material.material_type);
      if (trend > 20) {
        insights.push(`${material.material_type} demand is growing rapidly (+${trend}%). Consider increasing capacity.`);
      } else if (trend < -20) {
        insights.push(`${material.material_type} demand is declining (${trend}%). Review your inventory levels.`);
      }
    });

    return insights;
  };

  const handleExportForecast = () => {
    if (!forecastData) return;

    const csvContent = [
      ['Material Type', 'Total Requests', 'Total Quantity', 'Average Quantity', 'Trend %'],
      ...forecastData.topMaterials.map(material => [
        material.material_type,
        material.request_count,
        material.total_quantity,
        Math.round(material.avg_quantity),
        getDemandTrend(material.material_type)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `material-forecast-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="text-amber-900 mb-0">
          Material Demand Forecast
        </Title>
        <div className="flex gap-2">
          <Select
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            style={{ width: 150 }}
          >
            <Option value="3months">Last 3 Months</Option>
            <Option value="6months">Last 6 Months</Option>
            <Option value="12months">Last 12 Months</Option>
          </Select>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchForecastData}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportForecast}
            disabled={!forecastData}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Export
          </Button>
        </div>
      </div>

      {/* Forecast Overview */}
      <Alert
        message="Forecast Information"
        description={
          <div>
            <Paragraph>
              This forecast is based on historical demand patterns and material request data. 
              Use this information to plan your inventory and production capacity.
            </Paragraph>
            {forecastData?.forecastNote && (
              <Text type="secondary" className="text-sm">
                {forecastData.forecastNote}
              </Text>
            )}
          </div>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        className="mb-6"
      />

      <Spin spinning={loading}>
        {forecastData ? (
          <Row gutter={[16, 16]}>
            {/* Top Materials Performance */}
            <Col xs={24}>
              <Card                title={
                  <div className="flex items-center">
                    <BarChartOutlined className="mr-2" />
                    Material Demand Analysis
                  </div>
                }
                extra={
                  <Tooltip title="Materials ranked by request frequency and quantity">
                    <InfoCircleOutlined />
                  </Tooltip>
                }
              >
                <Table
                  columns={topMaterialsColumns}
                  dataSource={forecastData.topMaterials}
                  rowKey="material_type"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>

            {/* Insights and Recommendations */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <div className="flex items-center">
                    <BarChartOutlined className="mr-2" />
                    Insights & Recommendations
                  </div>
                }
              >
                {generateInsights().length > 0 ? (
                  <List
                    dataSource={generateInsights()}
                    renderItem={(insight, index) => (
                      <List.Item>
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mr-3 mt-1">
                            <Text className="text-amber-600 text-sm font-bold">
                              {index + 1}
                            </Text>
                          </div>
                          <Text>{insight}</Text>
                        </div>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty
                    description="No insights available yet"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            </Col>

            {/* Quick Stats */}
            <Col xs={24} lg={12}>
              <Card title="Forecast Summary">
                <Row gutter={16}>
                  <Col span={24} className="mb-4">
                    <Statistic
                      title="Total Material Types"
                      value={forecastData.topMaterials.length}
                      prefix={<CalendarOutlined />}
                    />
                  </Col>
                  <Col span={24} className="mb-4">                    <Statistic
                      title="Most Requested Material"
                      value={forecastData.topMaterials[0]?.material_type || 'N/A'}
                      prefix={<BarChartOutlined />}
                    />
                  </Col>
                  <Col span={24} className="mb-4">
                    <div>
                      <Text className="text-sm text-gray-500">
                        Top Material Request Volume
                      </Text>
                      <Progress
                        percent={
                          forecastData.topMaterials.length > 0
                            ? Math.min(
                                (forecastData.topMaterials[0].request_count / 
                                 Math.max(...forecastData.topMaterials.map(m => m.request_count))) * 100,
                                100
                              )
                            : 0
                        }
                        strokeColor="#faad14"
                        className="mt-2"
                      />
                    </div>
                  </Col>
                  <Col span={24}>
                    <div>
                      <Text className="text-sm text-gray-500">
                        Forecast Period
                      </Text>
                      <br />
                      <Tag color="blue" className="mt-1">
                        {selectedPeriod === '3months' && 'Last 3 Months'}
                        {selectedPeriod === '6months' && 'Last 6 Months'}
                        {selectedPeriod === '12months' && 'Last 12 Months'}
                      </Tag>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Demand Trend Chart Placeholder */}
            <Col xs={24}>
              <Card
                title="Demand Trend Over Time"
                extra={
                  <Tooltip title="Visual representation of demand patterns">
                    <InfoCircleOutlined />
                  </Tooltip>
                }
              >
                <Alert
                  message="Advanced Analytics Coming Soon"
                  description="Interactive charts and detailed trend analysis will be available in the next update. For now, use the table data above for demand planning."
                  type="info"
                  showIcon
                  className="bg-blue-50 border-blue-200"
                />
                
                {/* Simple trend visualization */}
                <div className="mt-4">
                  <Text className="text-sm text-gray-500 mb-2 block">
                    Material Request Distribution
                  </Text>
                  {forecastData.topMaterials.slice(0, 5).map((material, index) => (
                    <div key={material.material_type} className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <Text className="text-sm">{material.material_type}</Text>
                        <Text className="text-sm text-gray-500">
                          {material.request_count} requests
                        </Text>
                      </div>
                      <Progress
                        percent={
                          (material.request_count / 
                           Math.max(...forecastData.topMaterials.map(m => m.request_count))) * 100
                        }
                        strokeColor={`hsl(${45 + index * 30}, 70%, 50%)`}
                        size="small"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        ) : (
          <Card>
            <Empty
              description="No forecast data available"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        )}
      </Spin>
    </div>
  );
};