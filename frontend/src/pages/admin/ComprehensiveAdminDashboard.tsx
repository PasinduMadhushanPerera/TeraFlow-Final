import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Badge, 
  Space, 
  Button,
  Alert,
  List,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tabs
} from 'antd';
import {
  UserOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ShopOutlined,
  ExportOutlined,
  ReloadOutlined,
  BellOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface DashboardStats {
  totalUsers: number;
  totalCustomers: number;
  totalSuppliers: number;
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}

interface AnalyticsData {
  sales: any[];
  productPerformance: any[];
  customers: any[];
  inventory: any[];
}

interface LowStockAlert {
  id: number;
  name: string;
  category: string;
  stock_quantity: number;
  minimum_stock: number;
  sku: string;
  shortage: number;
  alert_level: string;
}

interface Notification {
  type: string;
  title: string;
  message: string;
  created_at: string;
  related_id: number;
}

export const ComprehensiveAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustmentForm] = Form.useForm();

  useEffect(() => {
    fetchDashboardData();
    fetchAnalytics();
    fetchLowStockAlerts();
    fetchNotifications();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('terraflow_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/dashboard/stats', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/analytics?period=30', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockAlerts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/inventory/alerts', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLowStockAlerts(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching low stock alerts:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/notifications', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleInventoryAdjustment = (product: LowStockAlert) => {
    setSelectedProduct(product);
    adjustmentForm.setFieldsValue({
      product_id: product.id,
      adjustment_type: 'increase',
      quantity: product.shortage
    });
    setAdjustmentModalVisible(true);
  };

  const submitInventoryAdjustment = async (values: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/inventory/adjustment', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(values)
      });

      const data = await response.json();
      if (data.success) {
        message.success('Inventory adjustment completed successfully');
        setAdjustmentModalVisible(false);
        adjustmentForm.resetFields();
        fetchLowStockAlerts();
        fetchDashboardData();
      } else {
        message.error(data.message || 'Failed to adjust inventory');
      }
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      message.error('Error adjusting inventory');
    }
  };

  const exportData = async (table?: string) => {
    try {
      const url = table ? `http://localhost:5000/api/admin/export?table=${table}` : 'http://localhost:5000/api/admin/export';
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const dataStr = JSON.stringify(data.data, null, 2);
          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
          const exportFileDefaultName = `terraflow_${table || 'all'}_export_${dayjs().format('YYYY-MM-DD')}.json`;
          
          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', dataUri);
          linkElement.setAttribute('download', exportFileDefaultName);
          linkElement.click();
          
          message.success('Data exported successfully');
        }
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      message.error('Error exporting data');
    }
  };

  const alertLevelColors = {
    'Critical': '#ff4d4f',
    'Very Low': '#ff7a45',
    'Low': '#faad14',
    'Normal': '#52c41a'
  };

  const lowStockColumns = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: LowStockAlert) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>SKU: {record.sku}</div>
        </div>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color="blue">{category.replace('_', ' ').toUpperCase()}</Tag>
      )
    },
    {
      title: 'Current Stock',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity'
    },
    {
      title: 'Minimum Stock',
      dataIndex: 'minimum_stock',
      key: 'minimum_stock'
    },
    {
      title: 'Shortage',
      dataIndex: 'shortage',
      key: 'shortage',
      render: (shortage: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          -{shortage}
        </span>
      )
    },
    {
      title: 'Alert Level',
      dataIndex: 'alert_level',
      key: 'alert_level',
      render: (level: string) => (
        <Tag color={alertLevelColors[level as keyof typeof alertLevelColors]}>
          {level.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: LowStockAlert) => (
        <Button 
          type="primary" 
          size="small"
          onClick={() => handleInventoryAdjustment(record)}
        >
          Adjust Stock
        </Button>
      )
    }
  ];

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2}>Admin Dashboard</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => {
            fetchDashboardData();
            fetchAnalytics();
            fetchLowStockAlerts();
            fetchNotifications();
          }}>
            Refresh
          </Button>
          <Button icon={<ExportOutlined />} onClick={() => exportData()}>
            Export All Data
          </Button>
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Overview" key="overview">
          {/* Key Statistics */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Users"
                  value={stats?.totalUsers || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Products"
                  value={stats?.totalProducts || 0}
                  prefix={<ShopOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Orders"
                  value={stats?.totalOrders || 0}
                  prefix={<ShoppingCartOutlined />}
                  suffix={
                    <Badge 
                      count={stats?.pendingOrders || 0} 
                      style={{ backgroundColor: '#faad14' }}
                    />
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Revenue"
                  value={stats?.totalRevenue || 0}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Notifications */}
          {notifications.length > 0 && (
            <Alert
              message={`${notifications.length} System Notifications`}
              description={
                <List
                  size="small"
                  dataSource={notifications.slice(0, 3)}
                  renderItem={(item: Notification) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<BellOutlined />}
                        title={item.title}
                        description={item.message}
                      />
                    </List.Item>
                  )}
                />
              }
              type="warning"
              style={{ marginBottom: '24px' }}
              action={
                <Button size="small" onClick={() => setActiveTab('notifications')}>
                  View All
                </Button>
              }
            />
          )}

          {/* Low Stock Alerts */}
          {lowStockAlerts.length > 0 && (
            <Card title="Critical Stock Alerts" style={{ marginBottom: '24px' }}>
              <Row gutter={[16, 16]}>
                {lowStockAlerts.slice(0, 6).map((alert) => (
                  <Col xs={24} sm={12} md={8} key={alert.id}>
                    <Card size="small">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text strong>{alert.name}</Text>
                          <br />
                          <Text type="secondary">Stock: {alert.stock_quantity}</Text>
                        </div>
                        <Tag color={alertLevelColors[alert.alert_level as keyof typeof alertLevelColors]}>
                          {alert.alert_level}
                        </Tag>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
              {lowStockAlerts.length > 6 && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <Button onClick={() => setActiveTab('inventory')}>
                    View All Alerts ({lowStockAlerts.length})
                  </Button>
                </div>
              )}
            </Card>
          )}
        </TabPane>

        <TabPane tab="Analytics" key="analytics">
          {analytics && (
            <div>
              {/* Sales Data */}
              <Card title="Sales Overview (Last 30 Days)" style={{ marginBottom: '24px' }}>
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Statistic
                      title="Total Revenue"
                      value={analytics.sales.reduce((sum, item) => sum + (item.revenue || 0), 0)}
                      precision={2}
                      prefix="$"
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Total Orders"
                      value={analytics.sales.reduce((sum, item) => sum + (item.orders_count || 0), 0)}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Average Order Value"
                      value={analytics.sales.reduce((sum, item) => sum + (item.avg_order_value || 0), 0) / analytics.sales.length}
                      precision={2}
                      prefix="$"
                    />
                  </Col>
                </Row>
                <Table
                  dataSource={analytics.sales}
                  size="small"
                  pagination={{ pageSize: 5 }}
                  columns={[
                    { title: 'Date', dataIndex: 'date', key: 'date' },
                    { title: 'Orders', dataIndex: 'orders_count', key: 'orders_count' },
                    { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', render: (value: number) => `$${value?.toFixed(2) || '0.00'}` }
                  ]}
                />
              </Card>

              {/* Product Performance */}
              <Card title="Top Performing Products" style={{ marginBottom: '24px' }}>
                <Table
                  dataSource={analytics.productPerformance}
                  size="small"
                  pagination={{ pageSize: 5 }}
                  columns={[
                    { title: 'Product', dataIndex: 'name', key: 'name' },
                    { title: 'Category', dataIndex: 'category', key: 'category' },
                    { title: 'Units Sold', dataIndex: 'total_sold', key: 'total_sold' },
                    { title: 'Revenue', dataIndex: 'total_revenue', key: 'total_revenue', render: (value: number) => `$${value?.toFixed(2) || '0.00'}` },
                    { title: 'Orders', dataIndex: 'order_count', key: 'order_count' }
                  ]}
                />
              </Card>

              {/* Inventory Distribution */}
              <Card title="Inventory by Category">
                <Table
                  dataSource={analytics.inventory}
                  size="small"
                  pagination={false}
                  columns={[
                    { title: 'Category', dataIndex: 'category', key: 'category', render: (cat: string) => cat.replace('_', ' ').toUpperCase() },
                    { title: 'Products', dataIndex: 'product_count', key: 'product_count' },
                    { title: 'Total Stock', dataIndex: 'total_stock', key: 'total_stock' },
                    { title: 'Inventory Value', dataIndex: 'inventory_value', key: 'inventory_value', render: (value: number) => `$${value?.toFixed(2) || '0.00'}` },
                    { title: 'Low Stock Items', dataIndex: 'low_stock_count', key: 'low_stock_count' }
                  ]}
                />
              </Card>
            </div>
          )}
        </TabPane>

        <TabPane tab="Inventory Alerts" key="inventory">
          <Card title="Low Stock Alerts" extra={
            <Button type="primary" onClick={fetchLowStockAlerts}>
              <ReloadOutlined /> Refresh
            </Button>
          }>
            <Table
              dataSource={lowStockAlerts}
              columns={lowStockColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Notifications" key="notifications">
          <Card title="System Notifications">
            <List
              dataSource={notifications}
              renderItem={(item: Notification) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<BellOutlined />}
                    title={item.title}
                    description={
                      <div>
                        <div>{item.message}</div>
                        <Text type="secondary">
                          {dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Inventory Adjustment Modal */}
      <Modal
        title="Inventory Adjustment"
        visible={adjustmentModalVisible}
        onCancel={() => setAdjustmentModalVisible(false)}
        footer={null}
      >
        {selectedProduct && (
          <Form
            form={adjustmentForm}
            layout="vertical"
            onFinish={submitInventoryAdjustment}
          >
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
              <Text strong>{selectedProduct.name}</Text>
              <br />
              <Text type="secondary">Current Stock: {selectedProduct.stock_quantity}</Text>
              <br />
              <Text type="secondary">Minimum Stock: {selectedProduct.minimum_stock}</Text>
            </div>

            <Form.Item name="product_id" hidden>
              <Input />
            </Form.Item>

            <Form.Item
              label="Adjustment Type"
              name="adjustment_type"
              rules={[{ required: true, message: 'Please select adjustment type' }]}
            >
              <Select>
                <Option value="increase">Increase Stock</Option>
                <Option value="decrease">Decrease Stock</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Quantity"
              name="quantity"
              rules={[{ required: true, message: 'Please enter quantity' }]}
            >
              <Input type="number" min={1} />
            </Form.Item>

            <Form.Item
              label="Notes"
              name="notes"
            >
              <Input.TextArea rows={3} placeholder="Enter reason for adjustment..." />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Submit Adjustment
                </Button>
                <Button onClick={() => setAdjustmentModalVisible(false)}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default ComprehensiveAdminDashboard;
