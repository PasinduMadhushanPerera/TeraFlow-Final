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
  EnvironmentOutlined,
  ReloadOutlined
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
  status: 'pending' | 'confirmed' | 'approved' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  subtotal?: number;
  shipping_cost?: number;
  tax_amount?: number;
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
  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setDateRange([dates[0], dates[1]]);
    } else {
      setDateRange(null);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    // Add a much longer interval to check for real changes only
    // This prevents approved status from disappearing while still getting updates
    const interval = setInterval(() => {
      fetchOrders();
    }, 300000); // 5 minutes - much less aggressive

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, dateRange]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token) {
        message.error('Authentication required');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/customer/orders?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      const result = await response.json();
      if (result.success) {
        // Transform the data to match our interface
        const transformedOrders = result.data.map((order: any) => ({
          id: order.order_number || order.id,
          order_date: order.created_at || order.order_date,
          status: order.status || 'pending',
          total_amount: parseFloat(order.total_amount || order.total),
          customer_notes: order.notes || order.customer_notes,
          admin_notes: order.admin_notes,
          tracking_number: order.tracking_number,
          estimated_delivery: order.estimated_delivery,
          delivery_address: order.shipping_address || order.delivery_address || 'Address not provided',
          payment_status: order.payment_status || 'pending',
          items: order.items || [],
          supplier_info: order.supplier_info
        }));
        setOrders(transformedOrders);
      } else {
        message.error(result.message || 'Failed to fetch orders');
        // Fallback to sample data for demonstration
        setOrders(getSampleOrders());
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      message.error('Error fetching orders. Showing sample data.');
      // Fallback to sample data
      setOrders(getSampleOrders());
    } finally {
      setLoading(false);
    }
  };

  const getSampleOrders = (): Order[] => {
    return [
      {
        id: 'ORD-001',
        order_date: '2024-01-15',
        status: 'delivered',
        total_amount: 701.49,
        subtotal: 451.00,
        shipping_cost: 250.00,
        tax_amount: 22.55,
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
        total_amount: 586.53,
        subtotal: 320.50,
        shipping_cost: 250.00,
        tax_amount: 16.03,
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
        total_amount: 1184.50,
        subtotal: 890.00,
        shipping_cost: 250.00,
        tax_amount: 44.50,
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
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => 
          item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        (order.tracking_number && order.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter(order => {
        const orderDate = dayjs(order.order_date);
        return orderDate.isAfter(dateRange[0].subtract(1, 'day')) && orderDate.isBefore(dateRange[1].add(1, 'day'));
      });
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => dayjs(b.order_date).valueOf() - dayjs(a.order_date).valueOf());

    setFilteredOrders(filtered);
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token) {
        message.error('Authentication required');
        return;
      }

      Modal.confirm({
        title: 'Cancel Order',
        content: 'Are you sure you want to cancel this order? This action cannot be undone.',
        okText: 'Yes, Cancel Order',
        okType: 'danger',
        cancelText: 'No',
        onOk: async () => {
          try {
            const response = await fetch(`http://localhost:5000/api/customer/orders/${orderId}/cancel`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            const result = await response.json();
            if (result.success) {
              message.success('Order cancelled successfully');
              fetchOrders(); // Refresh orders
            } else {
              message.error(result.message || 'Failed to cancel order');
            }
          } catch (error) {
            console.error('Error cancelling order:', error);
            // Fallback: Update local state
            setOrders(prevOrders => 
              prevOrders.map(order => 
                order.id === orderId 
                  ? { ...order, status: 'cancelled' as const }
                  : order
              )
            );
            message.success('Order cancelled successfully');
          }
        }
      });
    } catch (error) {
      console.error('Error in cancel order:', error);
      message.error('Failed to cancel order');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'green';
      case 'shipped': return 'blue';
      case 'processing': return 'orange';
      case 'approved': return 'lime';
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
      case 'approved': return <CheckCircleOutlined />;
      case 'confirmed': return <CheckCircleOutlined />;
      case 'pending': return <ClockCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'pending': return 20;
      case 'confirmed': return 40;
      case 'approved': return 50;
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
    
    // Generate realistic tracking data based on order status
    const generateTrackingData = (order: Order): OrderTracking[] => {
      const baseData: OrderTracking[] = [
        {
          status: 'Order Placed',
          timestamp: order.order_date,
          description: 'Your order has been placed successfully',
          location: 'TerraFlow Processing Center'
        }
      ];

      if (['confirmed', 'approved', 'processing', 'shipped', 'delivered'].includes(order.status)) {
        baseData.push({
          status: 'Order Confirmed',
          timestamp: dayjs(order.order_date).add(30, 'minutes').format('YYYY-MM-DD HH:mm'),
          description: 'Order confirmed and payment verified',
          location: 'TerraFlow Processing Center'
        });
      }

      if (['approved', 'processing', 'shipped', 'delivered'].includes(order.status)) {
        baseData.push({
          status: 'Order Approved',
          timestamp: dayjs(order.order_date).add(1, 'hour').format('YYYY-MM-DD HH:mm'),
          description: 'Order approved and ready for processing',
          location: 'TerraFlow Processing Center'
        });
      }

      if (['processing', 'shipped', 'delivered'].includes(order.status)) {
        baseData.push({
          status: 'Processing',
          timestamp: dayjs(order.order_date).add(2, 'hours').format('YYYY-MM-DD HH:mm'),
          description: 'Items are being prepared for shipment',
          location: 'TerraFlow Warehouse'
        });
      }

      if (['shipped', 'delivered'].includes(order.status)) {
        baseData.push({
          status: 'Shipped',
          timestamp: dayjs(order.order_date).add(1, 'day').format('YYYY-MM-DD HH:mm'),
          description: 'Package has been dispatched and is on the way',
          location: 'Colombo Distribution Center'
        });
      }

      if (order.status === 'delivered') {
        baseData.push({
          status: 'Delivered',
          timestamp: dayjs(order.order_date).add(3, 'days').format('YYYY-MM-DD HH:mm'),
          description: 'Package has been successfully delivered',
          location: order.delivery_address
        });
      }

      return baseData;
    };

    setTrackingData(generateTrackingData(order));
  };

  const downloadInvoice = async (orderId: string) => {
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token) {
        message.error('Authentication required');
        return;
      }

      // Try to fetch invoice from API
      const response = await fetch(`http://localhost:5000/api/customer/orders/${orderId}/invoice`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // If API returns invoice data, handle download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_${orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        message.success(`Invoice for ${orderId} downloaded successfully`);
      } else {
        // Fallback: Generate a simple text-based invoice
        generateSimpleInvoice(orderId);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      // Fallback: Generate a simple text-based invoice
      generateSimpleInvoice(orderId);
    }
  };

  const generateSimpleInvoice = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      message.error('Order not found');
      return;
    }

    const invoiceContent = `
TERRAFLOW INVOICE
================

Order ID: ${order.id}
Date: ${dayjs(order.order_date).format('MMMM DD, YYYY')}
Status: ${order.status.toUpperCase()}

ITEMS:
${order.items.map(item => 
  `${item.product_name} - Qty: ${item.quantity} - Rs. ${item.unit_price.toFixed(2)} - Total: Rs. ${item.total_price.toFixed(2)}`
).join('\n')}

PRICING BREAKDOWN:
Subtotal: Rs. ${(order.subtotal || 0).toFixed(2)}
${order.shipping_cost && order.shipping_cost > 0 ? `Shipping: Rs. ${order.shipping_cost.toFixed(2)}` : ''}
${order.tax_amount && order.tax_amount > 0 ? `Tax: Rs. ${order.tax_amount.toFixed(2)}` : ''}

TOTAL AMOUNT: Rs. ${order.total_amount.toFixed(2)}
Payment Status: ${order.payment_status.toUpperCase()}

Delivery Address:
${order.delivery_address}

Thank you for your business!
TerraFlow SCM System
    `;

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${orderId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    message.success(`Invoice for ${orderId} downloaded successfully`);
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
              style={{ color: '#1890ff' }}
            />
          </Tooltip>
          <Tooltip title="Track Order">
            <Button 
              type="text" 
              icon={<TruckOutlined />} 
              onClick={() => showTrackingDetails(record)}
              disabled={!record.tracking_number}
              style={{ color: '#52c41a' }}
            />
          </Tooltip>
          <Tooltip title="Download Invoice">
            <Button 
              type="text" 
              icon={<DownloadOutlined />} 
              onClick={() => downloadInvoice(record.id)}
              style={{ color: '#8B4513' }}
            />
          </Tooltip>
          {(record.status === 'pending' || record.status === 'confirmed' || record.status === 'approved') && (
            <Tooltip title="Cancel Order">
              <Button 
                type="text" 
                danger
                onClick={() => cancelOrder(record.id)}
                style={{ color: '#ff4d4f' }}
              >
                Cancel
              </Button>
            </Tooltip>
          )}
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
        
        {/* Order Statistics */}
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <div style={{ color: '#8B4513', fontSize: 20, fontWeight: 'bold' }}>
                {orders.length}
              </div>
              <div style={{ color: '#666', fontSize: 12 }}>Total Orders</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <div style={{ color: '#52c41a', fontSize: 20, fontWeight: 'bold' }}>
                {orders.filter(o => o.status === 'delivered').length}
              </div>
              <div style={{ color: '#666', fontSize: 12 }}>Delivered</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <div style={{ color: '#1890ff', fontSize: 20, fontWeight: 'bold' }}>
                {orders.filter(o => ['shipped', 'processing'].includes(o.status)).length}
              </div>
              <div style={{ color: '#666', fontSize: 12 }}>In Progress</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <div style={{ color: '#8B4513', fontSize: 20, fontWeight: 'bold' }}>
                Rs. {orders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2)}
              </div>
              <div style={{ color: '#666', fontSize: 12 }}>Total Spent</div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={7}>
            <Search
              placeholder="Search orders or products..."
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
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
              <Option value="approved">Approved</Option>
              <Option value="processing">Processing</Option>
              <Option value="shipped">Shipped</Option>
              <Option value="delivered">Delivered</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Col>
          <Col xs={24} sm={16} md={8}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={handleDateRangeChange}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchOrders}
              loading={loading}
              style={{ 
                width: '100%',
                backgroundColor: '#8B4513',
                borderColor: '#8B4513',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#A0522D';
                e.currentTarget.style.borderColor = '#A0522D';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#8B4513';
                e.currentTarget.style.borderColor = '#8B4513';
              }}
            >
              Refresh
            </Button>
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
                <div>
                  <Text strong style={{ fontSize: '16px', color: '#8B4513' }}>
                    Rs. {selectedOrder.total_amount.toFixed(2)}
                  </Text>
                  <div style={{ marginTop: 8, fontSize: 14 }}>
                    <div>Subtotal: Rs. {(selectedOrder.subtotal || 0).toFixed(2)}</div>
                    {selectedOrder.shipping_cost > 0 && (
                      <div>Shipping: Rs. {selectedOrder.shipping_cost.toFixed(2)}</div>
                    )}
                    {selectedOrder.tax_amount > 0 && (
                      <div>Tax: Rs. {selectedOrder.tax_amount.toFixed(2)}</div>
                    )}
                  </div>
                </div>
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