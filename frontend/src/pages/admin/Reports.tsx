import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Row,
  Col,
  Table,  DatePicker,
  Button,
  Space,
  Statistic,
  Tag,
  Progress,
  message
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TrophyOutlined,
  ShoppingCartOutlined,
  DollarCircleOutlined,
  UserOutlined,
  WarningOutlined,
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface SalesData {
  date: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
}

interface InventoryData {
  name: string;
  category: string;
  stock_quantity: number;
  minimum_stock: number;
  stock_status: string;
  inventory_value: number;
}

interface SupplierData {
  supplier_name: string;
  business_name: string;
  email: string;
  total_requests: number;
  completed_requests: number;
  total_deliveries: number;
  avg_delivery_days: number;
}

export const Reports: React.FC = () => {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryData[]>([]);
  const [supplierData, setSupplierData] = useState<SupplierData[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [activeReport, setActiveReport] = useState<'sales' | 'inventory' | 'suppliers'>('sales');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSalesReport(),
        fetchInventoryReport(),
        fetchSupplierReport()
      ]);
    } catch (error) {
      message.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesReport = async () => {
    try {
      let url = 'http://localhost:5000/api/admin/reports/sales';
      if (dateRange) {
        const [start, end] = dateRange;
        url += `?start_date=${start.format('YYYY-MM-DD')}&end_date=${end.format('YYYY-MM-DD')}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setSalesData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch sales report:', error);
    }
  };

  const fetchInventoryReport = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/reports/inventory');
      const data = await response.json();
      if (data.success) {
        setInventoryData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch inventory report:', error);
    }
  };

  const fetchSupplierReport = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/reports/suppliers');
      const data = await response.json();
      if (data.success) {
        setSupplierData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch supplier report:', error);
    }
  };

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
    if (dates && activeReport === 'sales') {
      fetchSalesReport();
    }
  };

  const salesColumns: ColumnsType<SalesData> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Orders',
      dataIndex: 'total_orders',
      key: 'total_orders',
      render: (count) => (
        <Tag color="blue" icon={<ShoppingCartOutlined />}>
          {count}
        </Tag>
      ),
    },
    {
      title: 'Revenue',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      render: (amount) => (
        <Text strong style={{ color: '#52c41a' }}>
          ${Number(amount).toFixed(2)}
        </Text>
      ),
    },
    {
      title: 'Avg Order Value',
      dataIndex: 'avg_order_value',
      key: 'avg_order_value',
      render: (amount) => `$${Number(amount).toFixed(2)}`,
    },
  ];

  const inventoryColumns: ColumnsType<InventoryData> = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary">{record.category}</Text>
        </div>
      ),
    },
    {
      title: 'Stock Level',
      key: 'stock_level',
      render: (_, record) => {
        const percentage = (record.stock_quantity / (record.minimum_stock * 3)) * 100;
        const status = record.stock_status;
        const color = status === 'Low Stock' ? 'red' : status === 'Medium Stock' ? 'orange' : 'green';
        
        return (
          <div>
            <Progress
              percent={Math.min(percentage, 100)}
              status={status === 'Low Stock' ? 'exception' : 'normal'}
              strokeColor={color}
              size="small"
            />
            <Text type="secondary">
              {record.stock_quantity} / {record.minimum_stock} min
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'stock_status',
      key: 'stock_status',
      render: (status) => {
        const color = status === 'Low Stock' ? 'red' : status === 'Medium Stock' ? 'orange' : 'green';
        const icon = status === 'Low Stock' ? <WarningOutlined /> : undefined;
        return (
          <Tag color={color} icon={icon}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Inventory Value',
      dataIndex: 'inventory_value',
      key: 'inventory_value',
      render: (value) => (
        <Text strong>${Number(value).toFixed(2)}</Text>
      ),
    },
  ];

  const supplierColumns: ColumnsType<SupplierData> = [
    {
      title: 'Supplier',
      key: 'supplier',
      render: (_, record) => (
        <div>
          <Text strong>{record.business_name}</Text>
          <br />
          <Text type="secondary">{record.supplier_name}</Text>
          <br />
          <Text type="secondary">{record.email}</Text>
        </div>
      ),
    },
    {
      title: 'Requests',
      key: 'requests',
      render: (_, record) => (
        <div>
          <div>
            <Text>Total: </Text>
            <Tag color="blue">{record.total_requests}</Tag>
          </div>
          <div>
            <Text>Completed: </Text>
            <Tag color="green">{record.completed_requests}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Performance',
      key: 'performance',
      render: (_, record) => {
        const completionRate = record.total_requests > 0 
          ? (record.completed_requests / record.total_requests) * 100 
          : 0;
        
        return (
          <div>
            <div>
              <Text>Completion Rate:</Text>
              <Progress
                percent={completionRate}
                size="small"
                status={completionRate >= 80 ? 'success' : completionRate >= 60 ? 'normal' : 'exception'}
              />
            </div>
            <div>
              <Text type="secondary">
                Avg Delivery: {record.avg_delivery_days || 'N/A'} days
              </Text>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Deliveries',
      dataIndex: 'total_deliveries',
      key: 'total_deliveries',
      render: (count) => (
        <Tag color="cyan" icon={<TrophyOutlined />}>
          {count}
        </Tag>
      ),
    },
  ];

  // Calculate summary statistics
  const salesSummary = {
    totalRevenue: salesData.reduce((sum, item) => sum + Number(item.total_revenue), 0),
    totalOrders: salesData.reduce((sum, item) => sum + item.total_orders, 0),
    avgOrderValue: salesData.length > 0 
      ? salesData.reduce((sum, item) => sum + Number(item.avg_order_value), 0) / salesData.length 
      : 0,
  };

  const inventorySummary = {
    totalProducts: inventoryData.length,
    lowStockItems: inventoryData.filter(item => item.stock_status === 'Low Stock').length,
    totalInventoryValue: inventoryData.reduce((sum, item) => sum + Number(item.inventory_value), 0),
  };

  const supplierSummary = {
    totalSuppliers: supplierData.length,
    topPerformer: supplierData.length > 0 
      ? supplierData.reduce((prev, current) => 
          (prev.completed_requests > current.completed_requests) ? prev : current
        ).business_name
      : 'N/A',
    avgCompletionRate: supplierData.length > 0
      ? supplierData.reduce((sum, supplier) => 
          sum + (supplier.total_requests > 0 ? (supplier.completed_requests / supplier.total_requests) * 100 : 0), 0
        ) / supplierData.length
      : 0,
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="text-amber-900 mb-0">
          Reports & Analytics
        </Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchReports}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Export Reports
          </Button>
        </Space>
      </div>

      {/* Report Type Selector */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={24}>
          <Card>
            <Space size="large">
              <Button
                type={activeReport === 'sales' ? 'primary' : 'default'}
                icon={<BarChartOutlined />}
                onClick={() => setActiveReport('sales')}
                className={activeReport === 'sales' ? 'bg-amber-600 hover:bg-amber-700' : ''}
              >
                Sales Report
              </Button>
              <Button
                type={activeReport === 'inventory' ? 'primary' : 'default'}
                icon={<PieChartOutlined />}
                onClick={() => setActiveReport('inventory')}
                className={activeReport === 'inventory' ? 'bg-amber-600 hover:bg-amber-700' : ''}
              >
                Inventory Report
              </Button>
              <Button
                type={activeReport === 'suppliers' ? 'primary' : 'default'}
                icon={<LineChartOutlined />}
                onClick={() => setActiveReport('suppliers')}
                className={activeReport === 'suppliers' ? 'bg-amber-600 hover:bg-amber-700' : ''}
              >
                Supplier Report
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Sales Report */}
      {activeReport === 'sales' && (
        <>
          {/* Sales Summary Cards */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total Revenue"
                  value={salesSummary.totalRevenue}
                  precision={2}
                  prefix={<DollarCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total Orders"
                  value={salesSummary.totalOrders}
                  prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Avg Order Value"
                  value={salesSummary.avgOrderValue}
                  precision={2}
                  prefix="$"
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Date Range Picker */}
          <Row className="mb-4">
            <Col span={24}>
              <Card size="small">
                <Space>
                  <Text>Date Range:</Text>
                  <RangePicker
                    value={dateRange}
                    onChange={handleDateRangeChange}
                    format="YYYY-MM-DD"
                  />
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Sales Data Table */}
          <Card title="Daily Sales Report">
            <Table
              columns={salesColumns}
              dataSource={salesData}
              rowKey="date"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
              }}
            />
          </Card>
        </>
      )}

      {/* Inventory Report */}
      {activeReport === 'inventory' && (
        <>
          {/* Inventory Summary Cards */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total Products"
                  value={inventorySummary.totalProducts}
                  prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Low Stock Items"
                  value={inventorySummary.lowStockItems}
                  prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total Inventory Value"
                  value={inventorySummary.totalInventoryValue}
                  precision={2}
                  prefix={<DollarCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Inventory Data Table */}
          <Card title="Inventory Status Report">
            <Table
              columns={inventoryColumns}
              dataSource={inventoryData}
              rowKey="name"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
              }}
            />
          </Card>
        </>
      )}

      {/* Supplier Report */}
      {activeReport === 'suppliers' && (
        <>
          {/* Supplier Summary Cards */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total Suppliers"
                  value={supplierSummary.totalSuppliers}
                  prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Top Performer"
                  value={supplierSummary.topPerformer}
                  prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Avg Completion Rate"
                  value={supplierSummary.avgCompletionRate}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Supplier Data Table */}
          <Card title="Supplier Performance Report">
            <Table
              columns={supplierColumns}
              dataSource={supplierData}
              rowKey="email"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
              }}
            />
          </Card>
        </>
      )}
    </div>
  );
};