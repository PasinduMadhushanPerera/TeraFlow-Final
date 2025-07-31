import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Modal, 
  Descriptions, 
  Timeline, 
  Row, 
  Col,
  Input,
  Select,
  DatePicker,
  Empty,
  Spin,
  message,
  Avatar,
  Divider,
  Rate,
  Tooltip,
  Progress
} from 'antd';
import { 
  EyeOutlined, 
  TruckOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  StarOutlined,
  MessageOutlined,
  PhoneOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_image?: string;
}

interface Order {
  id: string;
  order_date: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  customer_notes?: string;
  admin_notes?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  delivery_address: string;
  payment_status: 'pending' | 'paid' | 'failed';
  items: OrderItem[];
  supplier_info?: {
    name: string;
    phone: string;
    email: string;
  };
}

interface OrderTracking {
  status: string;
  timestamp: string;
  description: string;
  location?: string;
}

export const MyOrders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [trackingData, setTrackingData] = useState<OrderTracking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // Handler for date range picker
  const handleDateRangeChange = (dates: any, dateStrings: [string, string]) => {
    if (dates && dates.length === 2) {
      setDateRange([dates[0], dates[1]]);
    } else {
      setDateRange(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, dateRange]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('terraflow_token') || localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/customer/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const ordersData = data.orders || [
          // Sample data for demonstration
          {
            id: 'ORD-001',
            order_date: '2024-01-15',
            status: 'delivered',
            total_amount: 450.99,
            customer_notes: 'Please handle with care',
            tracking_number: 'TF123456789',
            estimated_delivery: '2024-01-20',
            delivery_address: '123 Main St, Colombo 03',
            payment_status: 'paid',
            items: [
              {
                id: 1,
                product_name: 'Premium Red Clay',
                quantity: 2,
                unit_price: 225.50,
                total_price: 451.00
              }
            ],
            supplier_info: {
              name: 'Ceylon Clay Co.',
              phone: '+94-77-123-4567',
              email: 'supplier@ceylonclay.com'
            }
          },
          {
            id: 'ORD-002',
            order_date: '2024-01-18',
            status: 'shipped',
            total_amount: 320.50,
            tracking_number: 'TF987654321',
            estimated_delivery: '2024-01-23',
            delivery_address: '456 Galle Road, Mount Lavinia',
            payment_status: 'paid',
            items: [
              {
                id: 2,
                product_name: 'Stoneware Clay',
                quantity: 1,
                unit_price: 320.50,
                total_price: 320.50
              }
            ]
          },
          {
            id: 'ORD-003',
            order_date: '2024-01-20',
            status: 'processing',
            total_amount: 890.00,
            delivery_address: '789 Kandy Road, Peradeniya',
            payment_status: 'paid',
            items: [
              {
                id: 3,
                product_name: 'Ceramic Tiles',
                quantity: 5,
                unit_price: 178.00,
                total_price: 890.00
              }
            ]
          }
        ];
        setOrders(ordersData);
      } else {
        message.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      message.error('Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => 
          item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Date range filter
    if (dateRange) {
      filtered = filtered.filter(order => {
        const orderDate = dayjs(order.order_date);
        return orderDate.isAfter(dateRange[0]) && orderDate.isBefore(dateRange[1]);
      });
    }

    setFilteredOrders(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'green';
      case 'shipped': return 'blue';
      case 'processing': return 'orange';
      case 'confirmed': return 'cyan';
      case 'pending': return 'gold';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircleOutlined />;
      case 'shipped': return <TruckOutlined />;
      case 'processing': return <ClockCircleOutlined />;
      case 'confirmed': return <CheckCircleOutlined />;
      case 'pending': return <ClockCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'pending': return 20;
      case 'confirmed': return 40;
      case 'processing': return 60;
      case 'shipped': return 80;
      case 'delivered': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  const showOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setOrderModalVisible(true);
  };

  const showTrackingDetails = async (order: Order) => {
    if (!order.tracking_number) {
      message.info('Tracking information not available yet');
      return;
    }

    setSelectedOrder(order);
    setTrackingModalVisible(true);
    
    // Sample tracking data
    setTrackingData([
      {
        status: 'Order Placed',
        timestamp: order.order_date,
        description: 'Your order has been placed successfully',
        location: 'TerraFlow Processing Center'
      },
      {
        status: 'Order Confirmed',
        timestamp: dayjs(order.order_date).add(1, 'hour').format('YYYY-MM-DD HH:mm'),
        description: 'Order confirmed and being prepared',
        location: 'TerraFlow Processing Center'
      },
      {
        status: 'In Transit',
        timestamp: dayjs(order.order_date).add(1, 'day').format('YYYY-MM-DD HH:mm'),
        description: 'Package is on the way',
        location: 'Colombo Distribution Center'
      }
    ]);
  };

  const downloadInvoice = (orderId: string) => {
    message.success(`Invoice for ${orderId} will be downloaded`);
    // Implementation for invoice download
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Text strong style={{ color: '#8B4513' }}>{id}</Text>
      )
    },
    {
      title: 'Date',
      dataIndex: 'order_date',
      key: 'order_date',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY')
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items: OrderItem[]) => (
        <div>
          {items.slice(0, 2).map((item, index) => (
            <div key={index}>
              <Text>{item.product_name} x{item.quantity}</Text>
            </div>
          ))}
          {items.length > 2 && (
            <Text type="secondary">+{items.length - 2} more items</Text>
          )}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <div>
          <Tag 
            icon={getStatusIcon(status)} 
            color={getStatusColor(status)}
          >
            {status.toUpperCase()}
          </Tag>
          <div style={{ marginTop: 4, width: 100 }}>
            <Progress 
              percent={getStatusProgress(status)} 
              size="small" 
              strokeColor="#8B4513"
              showInfo={false}
            />
          </div>
        </div>
      )
    },
    {
      title: 'Total',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => (
        <Text strong style={{ color: '#8B4513' }}>
          Rs. {amount.toFixed(2)}
        </Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Order) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => showOrderDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Track Order">
            <Button 
              type="text" 
              icon={<TruckOutlined />} 
              onClick={() => showTrackingDetails(record)}
              disabled={!record.tracking_number}
            />
          </Tooltip>
          <Tooltip title="Download Invoice">
            <Button 
              type="text" 
              icon={<DownloadOutlined />} 
              onClick={() => downloadInvoice(record.id)}
            />
          </Tooltip>
        </Space>
      )
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
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: '#8B4513', marginBottom: '8px' }}>
          My Orders
        </Title>
        <Text type="secondary">Track and manage your orders</Text>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search orders or products..."
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="all">All Orders</Option>
              <Option value="pending">Pending</Option>
              <Option value="confirmed">Confirmed</Option>
              <Option value="processing">Processing</Option>
              <Option value="shipped">Shipped</Option>
              <Option value="delivered">Delivered</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={10}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={handleDateRangeChange}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
        </Row>
      </Card>

      {/* Orders Table */}
      <Card>
        {filteredOrders.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No orders found"
            styles={{ image: { height: 60 } }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredOrders}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} orders`
            }}
          />
        )}
      </Card>

      {/* Order Details Modal */}
      <Modal
        title="Order Details"
        open={orderModalVisible}
        onCancel={() => setOrderModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setOrderModalVisible(false)}>
            Close
          </Button>,
          selectedOrder?.tracking_number && (
            <Button 
              key="track" 
              type="primary" 
              icon={<TruckOutlined />}
              onClick={() => {
                setOrderModalVisible(false);
                showTrackingDetails(selectedOrder);
              }}
            >
              Track Order
            </Button>
          ),
          <Button 
            key="invoice" 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={() => downloadInvoice(selectedOrder?.id || '')}
            style={{ backgroundColor: '#8B4513', borderColor: '#8B4513' }}
          >
            Download Invoice
          </Button>
        ].filter(Boolean)}
        width={800}
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Order ID">{selectedOrder.id}</Descriptions.Item>
              <Descriptions.Item label="Order Date">
                {dayjs(selectedOrder.order_date).format('MMMM DD, YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag icon={getStatusIcon(selectedOrder.status)} color={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Payment Status">
                <Tag color={selectedOrder.payment_status === 'paid' ? 'green' : 'orange'}>
                  {selectedOrder.payment_status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Amount" span={2}>
                <Text strong style={{ fontSize: '16px', color: '#8B4513' }}>
                  Rs. {selectedOrder.total_amount.toFixed(2)}
                </Text>
              </Descriptions.Item>
              {selectedOrder.tracking_number && (
                <Descriptions.Item label="Tracking Number" span={2}>
                  <Text code>{selectedOrder.tracking_number}</Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Delivery Address" span={2}>
                {selectedOrder.delivery_address}
              </Descriptions.Item>
              {selectedOrder.customer_notes && (
                <Descriptions.Item label="Customer Notes" span={2}>
                  {selectedOrder.customer_notes}
                </Descriptions.Item>
              )}
              {selectedOrder.admin_notes && (
                <Descriptions.Item label="Admin Notes" span={2}>
                  {selectedOrder.admin_notes}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider orientation="left">Order Items</Divider>
            <Table
              size="small"
              dataSource={selectedOrder.items}
              pagination={false}
              columns={[
                {
                  title: 'Product',
                  dataIndex: 'product_name',
                  key: 'product_name',
                  render: (name: string, record: OrderItem) => (
                    <Space>
                      {record.product_image && (
                        <Avatar src={record.product_image} shape="square" />
                      )}
                      <Text>{name}</Text>
                    </Space>
                  )
                },
                {
                  title: 'Quantity',
                  dataIndex: 'quantity',
                  key: 'quantity'
                },
                {
                  title: 'Unit Price',
                  dataIndex: 'unit_price',
                  key: 'unit_price',
                  render: (price: number) => `Rs. ${price.toFixed(2)}`
                },
                {
                  title: 'Total',
                  dataIndex: 'total_price',
                  key: 'total_price',
                  render: (price: number) => (
                    <Text strong>Rs. {price.toFixed(2)}</Text>
                  )
                }
              ]}
            />

            {selectedOrder.supplier_info && (
              <>
                <Divider orientation="left">Supplier Information</Divider>
                <Space direction="vertical">
                  <Space>
                    <Avatar icon={<StarOutlined />} />
                    <Text strong>{selectedOrder.supplier_info.name}</Text>
                  </Space>
                  <Space>
                    <PhoneOutlined />
                    <Text>{selectedOrder.supplier_info.phone}</Text>
                  </Space>
                  <Space>
                    <MessageOutlined />
                    <Text>{selectedOrder.supplier_info.email}</Text>
                  </Space>
                </Space>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Tracking Modal */}
      <Modal
        title="Order Tracking"
        open={trackingModalVisible}
        onCancel={() => setTrackingModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setTrackingModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedOrder && (
          <div>
            <div style={{ marginBottom: '16px', textAlign: 'center' }}>
              <Text strong style={{ fontSize: '16px' }}>
                Tracking: {selectedOrder.tracking_number}
              </Text>
              <br />
              <Text type="secondary">Order ID: {selectedOrder.id}</Text>
            </div>
            
            <Timeline>
              {trackingData.map((item, index) => (
                <Timeline.Item
                  key={index}
                  dot={index === trackingData.length - 1 ? <ClockCircleOutlined style={{ fontSize: '16px' }} /> : undefined}
                  color={index === trackingData.length - 1 ? 'blue' : 'green'}
                >
                  <div>
                    <Text strong>{item.status}</Text>
                    <br />
                    <Text type="secondary">{dayjs(item.timestamp).format('MMMM DD, YYYY HH:mm')}</Text>
                    <br />
                    <Text>{item.description}</Text>
                    {item.location && (
                      <>
                        <br />
                        <Space>
                          <EnvironmentOutlined />
                          <Text type="secondary">{item.location}</Text>
                        </Space>
                      </>
                    )}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>

            {selectedOrder.estimated_delivery && (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f6ffed', borderRadius: '6px' }}>
                <Text strong style={{ color: '#52c41a' }}>
                  Estimated Delivery: {dayjs(selectedOrder.estimated_delivery).format('MMMM DD, YYYY')}
                </Text>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};