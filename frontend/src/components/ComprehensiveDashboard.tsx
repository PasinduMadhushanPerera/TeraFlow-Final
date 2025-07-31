import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Space, Button, Alert, Progress, Spin, Tabs } from 'antd';
import { 
  ShoppingCartOutlined, 
  DollarOutlined, 
  UserOutlined, 
  StockOutlined,
  // TrendingUpOutlined,  // Not available in @ant-design/icons
  WarningOutlined,
  // CheckCircleOutlined,  // Unused import
  ClockCircleOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';

const { TabPane } = Tabs;

interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    completed: number;
    revenue: number;
  };
  products: {
    total: number;
    low_stock: number;
    out_of_stock: number;
    categories: number;
  };
  customers: {
    total: number;
    active: number;
    new_this_month: number;
  };
  suppliers: {
    total: number;
    active: number;
    requests_pending: number;
  };
}

interface RecentOrder {
  id: number;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  current_stock: number;
  minimum_stock: number;
  category: string;
}

interface ProductionRecommendation {
  id: number;
  product_name: string;
  recommended_quantity: number;
  priority: string;
  reason: string;
  potential_revenue: number;
}

const ComprehensiveDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    orders: { total: 0, pending: 0, completed: 0, revenue: 0 },
    products: { total: 0, low_stock: 0, out_of_stock: 0, categories: 0 },
    customers: { total: 0, active: 0, new_this_month: 0 },
    suppliers: { total: 0, active: 0, requests_pending: 0 }
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [productionRecommendations] = useState<ProductionRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get authentication token
      const token = localStorage.getItem('terraflow_token');
      if (!token) {
        console.error('Authentication token not found');
        setLoading(false);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch dashboard statistics
      const statsResponse = await fetch('http://localhost:5000/api/admin/dashboard/stats', {
        headers
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          // Map the backend response to our expected format
          const backendData = statsData.data;
          setStats({
            orders: { 
              total: backendData.totalOrders || 0, 
              pending: backendData.pendingOrders || 0, 
              completed: (backendData.totalOrders || 0) - (backendData.pendingOrders || 0), 
              revenue: backendData.totalRevenue || 0 
            },
            products: { 
              total: backendData.totalProducts || 0, 
              low_stock: 0, // We'll fetch this separately
              out_of_stock: 0, // We'll fetch this separately
              categories: 5 // Default categories
            },
            customers: { 
              total: backendData.totalCustomers || 0, 
              active: backendData.totalCustomers || 0, 
              new_this_month: 0 
            },
            suppliers: { 
              total: backendData.totalSuppliers || 0, 
              active: backendData.totalSuppliers || 0, 
              requests_pending: 0 
            }
          });
        }
      }

      // Fetch recent orders
      const ordersResponse = await fetch('http://localhost:5000/api/admin/orders', {
        headers
      });
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        if (ordersData.success) {
          // Take the first 10 orders and format them
          const formattedOrders = ordersData.data.slice(0, 10).map((order: any) => ({
            id: order.id,
            order_number: `ORD-${order.id.toString().padStart(6, '0')}`,
            customer_name: order.customer_name || 'Unknown Customer',
            total_amount: order.total_amount || 0,
            status: order.status || 'pending',
            created_at: order.created_at
          }));
          setRecentOrders(formattedOrders);
        }
      }

      // Fetch products to check low stock
      const productsResponse = await fetch('http://localhost:5000/api/admin/products', {
        headers
      });
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        if (productsData.success) {
          // Check for low stock products
          const products = productsData.data;
          const lowStockProducts = products.filter((product: any) => 
            product.stock_quantity <= product.minimum_stock
          );
          const outOfStockProducts = products.filter((product: any) => 
            product.stock_quantity === 0
          );
          
          // Format low stock products for display
          const formattedLowStock = lowStockProducts.slice(0, 10).map((product: any) => ({
            id: product.id,
            name: product.name,
            sku: product.sku || `SKU-${product.id}`,
            current_stock: product.stock_quantity,
            minimum_stock: product.minimum_stock,
            category: product.category || 'general'
          }));
          
          setLowStockProducts(formattedLowStock);
          
          // Update stats with actual low stock and out of stock counts
          setStats(prevStats => ({
            ...prevStats,
            products: {
              ...prevStats.products,
              low_stock: lowStockProducts.length,
              out_of_stock: outOfStockProducts.length
            }
          }));
        }
      }

      // For now, let's skip production recommendations as that endpoint may not exist
      // setProductionRecommendations([]);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'confirmed': return 'blue';
      case 'processing': return 'purple';
      case 'shipped': return 'cyan';
      case 'delivered': return 'green';
      case 'cancelled': return 'red';
      default: return 'default';
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

  const orderColumns = [
    {
      title: 'Order #',
      dataIndex: 'order_number',
      key: 'order_number',
      width: 120,
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      ellipsis: true,
    },
    {
      title: 'Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => `Rs. ${amount.toFixed(2)}`,
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
      width: 100,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
      width: 100,
    }
  ];

  const lowStockColumns = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 100,
    },
    {
      title: 'Current Stock',
      dataIndex: 'current_stock',
      key: 'current_stock',
      render: (stock: number, record: LowStockProduct) => (
        <span style={{ color: stock === 0 ? 'red' : 'orange' }}>
          {stock} / {record.minimum_stock}
        </span>
      ),
      width: 120,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag>{category.replace('_', ' ').toUpperCase()}</Tag>
      ),
      width: 120,
    }
  ];

  const recommendationColumns = [
    {
      title: 'Product',
      dataIndex: 'product_name',
      key: 'product_name',
      ellipsis: true,
    },
    {
      title: 'Quantity',
      dataIndex: 'recommended_quantity',
      key: 'recommended_quantity',
      width: 100,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{priority.toUpperCase()}</Tag>
      ),
      width: 100,
    },
    {
      title: 'Revenue',
      dataIndex: 'potential_revenue',
      key: 'potential_revenue',
      render: (revenue: number) => `Rs. ${revenue.toFixed(2)}`,
      width: 100,
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
        TerraFlow SCM Dashboard
      </h1>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Overview" key="overview">
          {/* Key Metrics */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Orders"
                  value={stats.orders.total}
                  prefix={<ShoppingCartOutlined />}
                  suffix={
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {stats.orders.pending} pending
                    </div>
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Revenue"
                  value={stats.orders.revenue}
                  precision={2}
                  prefix={<DollarOutlined />}
                  suffix="Rs."
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Customers"
                  value={stats.customers.total}
                  prefix={<UserOutlined />}
                  suffix={
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {stats.customers.new_this_month} new this month
                    </div>
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Products"
                  value={stats.products.total}
                  prefix={<StockOutlined />}
                  suffix={
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {stats.products.categories} categories
                    </div>
                  }
                />
              </Card>
            </Col>
          </Row>

          {/* Alerts */}
          <Space direction="vertical" style={{ width: '100%', marginBottom: '24px' }}>
            {stats.products.out_of_stock > 0 && (
              <Alert
                message={`${stats.products.out_of_stock} products are out of stock`}
                type="error"
                showIcon
                icon={<ExclamationCircleOutlined />}
                action={
                  <Button size="small" type="primary" ghost onClick={() => setActiveTab('inventory')}>
                    View Details
                  </Button>
                }
              />
            )}
            {stats.products.low_stock > 0 && (
              <Alert
                message={`${stats.products.low_stock} products are running low on stock`}
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                action={
                  <Button size="small" type="primary" ghost onClick={() => setActiveTab('inventory')}>
                    View Details
                  </Button>
                }
              />
            )}
            {stats.suppliers.requests_pending > 0 && (
              <Alert
                message={`${stats.suppliers.requests_pending} supplier requests are pending`}
                type="info"
                showIcon
                icon={<ClockCircleOutlined />}
                action={
                  <Button size="small" type="primary" ghost onClick={() => setActiveTab('suppliers')}>
                    Review Requests
                  </Button>
                }
              />
            )}
          </Space>

          {/* Recent Orders */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card 
                title="Recent Orders" 
                extra={
                  <Button type="link" onClick={() => setActiveTab('orders')}>
                    View All
                  </Button>
                }
              >
                <Table
                  columns={orderColumns}
                  dataSource={recentOrders}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card 
                title="Low Stock Alert" 
                extra={
                  <Button type="link" onClick={() => setActiveTab('inventory')}>
                    View All
                  </Button>
                }
              >
                <Table
                  columns={lowStockColumns}
                  dataSource={lowStockProducts}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Production Recommendations" key="production">
          <Card title="Smart Production Recommendations">
            <Table
              columns={recommendationColumns}
              dataSource={productionRecommendations}
              rowKey="id"
              pagination={false}
              expandable={{
                expandedRowRender: (record: ProductionRecommendation) => (
                  <div style={{ padding: '16px' }}>
                    <p><strong>Recommendation Reason:</strong> {record.reason}</p>
                    <Space>
                      <Button type="primary" size="small">
                        Approve Production
                      </Button>
                      <Button size="small">
                        Modify Quantity
                      </Button>
                      <Button type="link" size="small">
                        View Details
                      </Button>
                    </Space>
                  </div>
                ),
                rowExpandable: () => true,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="System Health" key="health">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Order Processing">
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Order Completion Rate</span>
                    <span>{Math.round((stats.orders.completed / stats.orders.total) * 100)}%</span>
                  </div>
                  <Progress 
                    percent={Math.round((stats.orders.completed / stats.orders.total) * 100)} 
                    status="active" 
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Pending Orders</span>
                    <span>{stats.orders.pending}</span>
                  </div>
                  <Progress 
                    percent={Math.round((stats.orders.pending / stats.orders.total) * 100)} 
                    status="normal" 
                  />
                </div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Inventory Status">
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Stock Availability</span>
                    <span>{Math.round(((stats.products.total - stats.products.out_of_stock) / stats.products.total) * 100)}%</span>
                  </div>
                  <Progress 
                    percent={Math.round(((stats.products.total - stats.products.out_of_stock) / stats.products.total) * 100)} 
                    status="active" 
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Low Stock Items</span>
                    <span>{stats.products.low_stock}</span>
                  </div>
                  <Progress 
                    percent={Math.round((stats.products.low_stock / stats.products.total) * 100)} 
                    status={stats.products.low_stock > 5 ? "exception" : "normal"} 
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ComprehensiveDashboard;
