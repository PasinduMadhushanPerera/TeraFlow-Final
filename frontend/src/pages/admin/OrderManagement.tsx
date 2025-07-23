import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Select, 
  message,
  Card,
  Statistic,
  Row,
  Col,
  Timeline,
  Descriptions,
  Input,
  DatePicker
} from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,  FilterOutlined,
  SearchOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { RangePicker } = DatePicker;

interface Order {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: 'pending' | 'approved' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: string;
  order_items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, searchText, dateRange]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Get authentication token
      const token = localStorage.getItem('terraflow_token');
      if (!token) {
        message.error('Authentication required');
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.data);
      } else {
        message.error('Failed to fetch orders: ' + data.message);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      message.error('Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(order => 
        order.customer_name.toLowerCase().includes(searchText.toLowerCase()) ||
        order.customer_email.toLowerCase().includes(searchText.toLowerCase()) ||
        order.id.toString().includes(searchText)
      );
    }

    // Filter by date range
    if (dateRange) {
      filtered = filtered.filter(order => {
        const orderDate = dayjs(order.created_at);
        return orderDate.isAfter(dateRange[0]) && orderDate.isBefore(dateRange[1]);
      });
    }

    setFilteredOrders(filtered);
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      // Get authentication token
      const token = localStorage.getItem('terraflow_token');
      if (!token) {
        message.error('Authentication required');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        message.success('Order status updated successfully');
        fetchOrders();
      } else {
        message.error(data.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      message.error('Error updating order status');
    }
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('terraflow_token');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const handleViewOrderDetails = async (orderId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/orders/${orderId}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedOrder(data.data);
          setDetailsVisible(true);
        } else {
          message.error('Failed to fetch order details');
        }
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      message.error('Error fetching order details');
    }
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'approved': return 'blue';
      case 'processing': return 'cyan';
      case 'shipped': return 'purple';
      case 'delivered': return 'green';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockCircleOutlined />;
      case 'delivered': return <CheckCircleOutlined />;
      default: return <ShoppingCartOutlined />;
    }
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: number) => `#${id.toString().padStart(4, '0')}`,
      sorter: (a: Order, b: Order) => a.id - b.id,
    },
    {
      title: 'Customer',      key: 'customer',
      render: (_: any, record: Order) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.customer_name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.customer_email}
          </div>
        </div>
      ),
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => `Rs.${Number(amount).toFixed(2)}`,
      sorter: (a: Order, b: Order) => a.total_amount - b.total_amount,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Order) => (
        <Space>
          <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
            {status.toUpperCase()}
          </Tag>
          <Select
            size="small"
            value={status}
            style={{ width: 120 }}
            onChange={(newStatus) => handleStatusChange(record.id, newStatus)}
          >
            <Option value="pending">Pending</Option>
            <Option value="approved">Approved</Option>
            <Option value="processing">Processing</Option>
            <Option value="shipped">Shipped</Option>
            <Option value="delivered">Delivered</Option>
            <Option value="cancelled">Cancelled</Option>
          </Select>
        </Space>
      ),
    },
    {
      title: 'Order Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY HH:mm'),
      sorter: (a: Order, b: Order) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
    {
      title: 'Actions',      key: 'actions',
      render: (_: any, record: Order) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => viewOrderDetails(record)}
          >
            View Details
          </Button>
        </Space>
      ),
    },
  ];

  const stats = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + order.total_amount, 0),
    pendingOrders: orders.filter(order => order.status === 'pending').length,
    deliveredOrders: orders.filter(order => order.status === 'delivered').length,
  };

  const orderStatusTimeline = (order: Order) => {
    const statusSteps = [
      { key: 'pending', title: 'Order Placed', color: 'orange' },
      { key: 'approved', title: 'Order Approved', color: 'blue' },
      { key: 'processing', title: 'Processing', color: 'cyan' },
      { key: 'shipped', title: 'Shipped', color: 'purple' },
      { key: 'delivered', title: 'Delivered', color: 'green' },
    ];

    const currentStatusIndex = statusSteps.findIndex(step => step.key === order.status);

    return (
      <Timeline>
        {statusSteps.map((step, index) => (
          <Timeline.Item
            key={step.key}
            color={index <= currentStatusIndex ? step.color : 'gray'}
            dot={index === currentStatusIndex ? getStatusIcon(step.key) : undefined}
          >
            <div>
              <Text strong={index <= currentStatusIndex}>{step.title}</Text>
              {index === 0 && <div style={{ fontSize: '12px', color: '#666' }}>
                {dayjs(order.created_at).format('MMM DD, YYYY HH:mm')}
              </div>}
              {index === currentStatusIndex && order.updated_at !== order.created_at && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {dayjs(order.updated_at).format('MMM DD, YYYY HH:mm')}
                </div>
              )}
            </div>
          </Timeline.Item>
        ))}
      </Timeline>
    );
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <Title level={2} className="text-amber-900 mb-2">
          Order Management
        </Title>
        <p className="text-gray-600 mb-4">
          Review, approve, and track customer orders throughout the fulfillment process.
        </p>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Orders"
              value={stats.totalOrders}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={stats.totalRevenue}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Pending Orders"
              value={stats.pendingOrders}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Delivered Orders"
              value={stats.deliveredOrders}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Search
              placeholder="Search by customer name, email, or order ID"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="all">All Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="approved">Approved</Option>
              <Option value="processing">Processing</Option>
              <Option value="shipped">Shipped</Option>
              <Option value="delivered">Delivered</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6}>            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
          <Col xs={24} sm={4}>
            <Button onClick={fetchOrders} loading={loading} block>
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Orders Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} orders`,
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Order Details Modal */}
      <Modal
        title={`Order Details - #${selectedOrder?.id.toString().padStart(4, '0')}`}
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={null}
        width={800}
      >
        {selectedOrder && (
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="Customer Information" size="small">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Name">{selectedOrder.customer_name}</Descriptions.Item>
                  <Descriptions.Item label="Email">{selectedOrder.customer_email}</Descriptions.Item>
                  <Descriptions.Item label="Shipping Address">
                    {selectedOrder.shipping_address || 'Not provided'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Order Information" size="small">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Order ID">
                    #{selectedOrder.id.toString().padStart(4, '0')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Amount">
                    Rs.{Number(selectedOrder.total_amount).toFixed(2)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Current Status">
                    <Tag color={getStatusColor(selectedOrder.status)} icon={getStatusIcon(selectedOrder.status)}>
                      {selectedOrder.status.toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Order Date">
                    {dayjs(selectedOrder.created_at).format('MMM DD, YYYY HH:mm')}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Order Timeline" size="small">
                {orderStatusTimeline(selectedOrder)}
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Order Items" size="small">
                {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                  <Table
                    dataSource={selectedOrder.order_items}
                    columns={[
                      {
                        title: 'Product',
                        dataIndex: 'product_name',
                        key: 'product_name',
                      },
                      {
                        title: 'Qty',
                        dataIndex: 'quantity',
                        key: 'quantity',
                      },
                      {
                        title: 'Price',
                        dataIndex: 'unit_price',
                        key: 'unit_price',
                        render: (price: number) => `Rs.${Number(price).toFixed(2)}`,
                      },
                      {
                        title: 'Total',
                        dataIndex: 'total_price',
                        key: 'total_price',
                        render: (price: number) => `Rs.${Number(price).toFixed(2)}`,
                      },
                    ]}
                    pagination={false}
                    size="small"
                  />
                ) : (
                  <Text type="secondary">Order items not available</Text>
                )}
              </Card>
            </Col>
          </Row>
        )}
      </Modal>
    </div>
  );
};