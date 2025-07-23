import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Table, 
  Tag, 
  Statistic, 
  Row, 
  Col, 
  Spin, 
  message,
  Button,
  Input,
  DatePicker,
  Modal,
  Descriptions,
  Badge
} from 'antd';
import {
  TruckOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FilterOutlined,
  EyeOutlined,
  StarOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface DeliveryRecord {
  id: number;
  material_type: string;
  quantity: number;
  unit: string;
  required_date: string;
  completed_date: string;
  admin_notes: string;
  supplier_response: string;
  delivery_days: number;
}

interface DeliveryStats {
  totalDeliveries: number;
  avgDeliveryTime: number;
  onTimeDeliveries: number;
  delayedDeliveries: number;
}

export const DeliveryHistory: React.FC = () => {
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [stats, setStats] = useState<DeliveryStats | null>(null);  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<any>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRecord | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  useEffect(() => {
    fetchDeliveryHistory();
  }, []);

  const fetchDeliveryHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('terraflow_user') ? 
        JSON.parse(localStorage.getItem('terraflow_user')!).token : null;
      
      if (!token) {
        message.error('Authentication token not found');
        return;
      }

      const response = await fetch('http://localhost:5000/api/supplier/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDeliveries(data.data);
          calculateStats(data.data);
        } else {
          message.error(data.message || 'Failed to fetch delivery history');
        }
      } else {
        message.error('Failed to fetch delivery history');
      }
    } catch (error) {
      console.error('Error fetching delivery history:', error);
      message.error('Error fetching delivery history');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (deliveryData: DeliveryRecord[]) => {
    const totalDeliveries = deliveryData.length;
    const avgDeliveryTime = totalDeliveries > 0 ? 
      deliveryData.reduce((sum, d) => sum + d.delivery_days, 0) / totalDeliveries : 0;
    const onTimeDeliveries = deliveryData.filter(d => d.delivery_days <= 3).length;
    const delayedDeliveries = totalDeliveries - onTimeDeliveries;

    setStats({
      totalDeliveries,
      avgDeliveryTime: Math.round(avgDeliveryTime * 10) / 10,
      onTimeDeliveries,
      delayedDeliveries
    });
  };

  const getDeliveryStatusColor = (days: number) => {
    if (days <= 1) return 'green';
    if (days <= 3) return 'blue';
    if (days <= 7) return 'orange';
    return 'red';
  };

  const getDeliveryStatusText = (days: number) => {
    if (days <= 1) return 'Excellent';
    if (days <= 3) return 'On Time';
    if (days <= 7) return 'Delayed';
    return 'Very Late';
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = delivery.material_type.toLowerCase().includes(searchText.toLowerCase()) ||
                         delivery.supplier_response?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesDate = !dateRange || 
      (dayjs(delivery.completed_date).isAfter(dateRange[0].startOf('day')) && 
       dayjs(delivery.completed_date).isBefore(dateRange[1].endOf('day')));
    
    return matchesSearch && matchesDate;
  });

  const columns: ColumnsType<DeliveryRecord> = [
    {
      title: 'Material Type',
      dataIndex: 'material_type',
      key: 'material_type',
      sorter: (a, b) => a.material_type.localeCompare(b.material_type),
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a.quantity - b.quantity,
      render: (quantity, record) => `${quantity} ${record.unit}`
    },
    {
      title: 'Required Date',
      dataIndex: 'required_date',
      key: 'required_date',
      sorter: (a, b) => new Date(a.required_date).getTime() - new Date(b.required_date).getTime(),
      render: (date) => (
        <div className="flex items-center">
          <CalendarOutlined className="mr-2" />
          {new Date(date).toLocaleDateString()}
        </div>
      )
    },
    {
      title: 'Delivery Date',
      dataIndex: 'completed_date',
      key: 'completed_date',
      sorter: (a, b) => new Date(a.completed_date).getTime() - new Date(b.completed_date).getTime(),
      render: (date) => (
        <div className="flex items-center">
          <CheckCircleOutlined className="mr-2 text-green-500" />
          {new Date(date).toLocaleDateString()}
        </div>
      )
    },
    {
      title: 'Performance',
      dataIndex: 'delivery_days',
      key: 'delivery_days',
      sorter: (a, b) => a.delivery_days - b.delivery_days,
      render: (days) => (
        <div className="flex items-center">
          <ClockCircleOutlined className="mr-2" />
          <Tag color={getDeliveryStatusColor(days)}>
            {days} {days === 1 ? 'day' : 'days'} - {getDeliveryStatusText(days)}
          </Tag>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedDelivery(record);
            setDetailVisible(true);
          }}
        >
          View Details
        </Button>
      )
    }
  ];

  const handleExport = () => {
    // Simple CSV export functionality
    const csvContent = [
      ['Material Type', 'Quantity', 'Unit', 'Required Date', 'Delivery Date', 'Delivery Days', 'Performance'],
      ...filteredDeliveries.map(d => [
        d.material_type,
        d.quantity,
        d.unit,
        new Date(d.required_date).toLocaleDateString(),
        new Date(d.completed_date).toLocaleDateString(),
        d.delivery_days,
        getDeliveryStatusText(d.delivery_days)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delivery-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="text-amber-900 mb-0">
          Delivery History
        </Title>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          className="bg-amber-600 hover:bg-amber-700"
        >
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Deliveries"
                value={stats.totalDeliveries}
                prefix={<TruckOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Average Delivery Time"
                value={stats.avgDeliveryTime}
                suffix="days"
                prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="On-Time Deliveries"
                value={stats.onTimeDeliveries}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Delayed Deliveries"
                value={stats.delayedDeliveries}
                prefix={<CalendarOutlined style={{ color: '#ff4d4f' }} />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Search by material type or notes..."
              prefix={<FilterOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col>
            <RangePicker
              placeholder={['Start Date', 'End Date']}
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
            />
          </Col>
          <Col>
            <Button onClick={() => {
              setSearchText('');
              setDateRange(null);
            }}>
              Clear Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Delivery History Table */}
      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredDeliveries}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} deliveries`
            }}
            locale={{
              emptyText: loading ? 'Loading...' : 'No delivery history found'
            }}
          />
        </Spin>
      </Card>

      {/* Delivery Detail Modal */}
      <Modal
        title="Delivery Details"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedDelivery && (
          <div>
            <Row gutter={16} className="mb-4">
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Delivery Performance"
                    value={`${selectedDelivery.delivery_days} ${selectedDelivery.delivery_days === 1 ? 'day' : 'days'}`}
                    prefix={<StarOutlined />}
                  />
                  <div className="mt-2">
                    <Badge 
                      color={getDeliveryStatusColor(selectedDelivery.delivery_days)}
                      text={getDeliveryStatusText(selectedDelivery.delivery_days)}
                    />
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Quantity Delivered"
                    value={`${selectedDelivery.quantity} ${selectedDelivery.unit}`}
                    prefix={<TruckOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Descriptions bordered column={1}>
              <Descriptions.Item label="Material Type">
                {selectedDelivery.material_type}
              </Descriptions.Item>
              <Descriptions.Item label="Required Date">
                {new Date(selectedDelivery.required_date).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Actual Delivery Date">
                {new Date(selectedDelivery.completed_date).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Admin Notes">
                {selectedDelivery.admin_notes || 'No notes provided'}
              </Descriptions.Item>
              <Descriptions.Item label="Your Response/Notes">
                {selectedDelivery.supplier_response || 'No response provided'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};