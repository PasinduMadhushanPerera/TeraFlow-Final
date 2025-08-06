import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, Button, message, Tag, Space, Modal, Descriptions, Row, Col, Input, Select, DatePicker, Divider } from 'antd';
import { ShoppingCartOutlined, EyeOutlined, StopOutlined, DownloadOutlined, SearchOutlined, FilterOutlined, TruckOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Helper function to safely format numbers
const formatCurrency = (value: any): string => {
  const numValue = typeof value === 'number' ? value : parseFloat(String(value || 0));
  return isNaN(numValue) ? '0.00' : numValue.toFixed(2);
};

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_sku?: string;
}

interface Order {
  id: number;
  order_number: string;
  status: 'pending' | 'confirmed' | 'approved' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  subtotal: number;
  shipping_cost: number;
  tax_amount?: number;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  shipping_address: string;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  customer_info?: {
    fullName: string;
    email: string;
    phone: string;
  };
  payment_details?: {
    card_last_four?: string;
    cardholder_name?: string;
    transaction_id?: string;
  };
}

const CustomerOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailsModal, setOrderDetailsModal] = useState(false);
  const [cancelOrderModal, setCancelOrderModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [filters, setFilters] = useState<{
    status: string;
    search: string;
    dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  }>({
    status: 'all',
    search: '',
    dateRange: null
  });

  useEffect(() => {
    fetchOrders();
    
    // No auto-refresh - only manual refresh to prevent approved status disappearing
    // Status should stay stable until admin manually changes it
    
    return () => {}; // No cleanup needed
  }, []); // Empty dependency array - only runs once on mount

  const fetchOrders = async (showMessage = false) => {
    // Don't fetch if already loading to prevent conflicts
    if (loading && !showMessage) return;
    
    setLoading(true);
    
    if (showMessage) {
      message.loading('Refreshing orders...', 0.5);
    }
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token) {
        message.error('Authentication required');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/customer/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        setOrders(result.data || []);
        
        if (showMessage) {
          message.success('Orders refreshed successfully');
        }
      } else {
        message.error(result.message || 'Failed to fetch orders');
      }
    } catch (error) {
      message.error('Failed to fetch orders');
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'confirmed': return 'blue';
      case 'approved': return 'lime';
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
      case 'confirmed': return <CheckCircleOutlined />;
      case 'approved': return <CheckCircleOutlined />;
      case 'processing': return <TruckOutlined />;
      case 'shipped': return <TruckOutlined />;
      case 'delivered': return <CheckCircleOutlined />;
      case 'cancelled': return <ExclamationCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const canCancelOrder = (order: Order) => {
    return ['pending', 'confirmed', 'approved'].includes(order.status);
  };

  const cancelOrder = async (orderId: number) => {
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token) {
        message.error('Authentication required');
        return;
      }

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
        fetchOrders();
        setCancelOrderModal(false);
        setOrderToCancel(null);
      } else {
        message.error(result.message || 'Failed to cancel order');
      }
    } catch (error) {
      message.error('Failed to cancel order');
      console.error('Cancel order error:', error);
    }
  };

  const downloadInvoice = async (order: Order) => {
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token) {
        message.error('Authentication required');
        return;
      }

      message.loading('Generating invoice...', 1);

      // Create HTML content for invoice
      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice - ${order.order_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #8B4513; }
            .invoice-title { font-size: 20px; margin: 10px 0; }
            .invoice-info { display: flex; justify-content: space-between; margin: 20px 0; }
            .customer-info, .order-info { width: 45%; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .totals { margin-top: 20px; text-align: right; }
            .total-row { margin: 5px 0; }
            .grand-total { font-size: 18px; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">TeraFlow SCM</div>
            <div class="invoice-title">INVOICE</div>
          </div>
          
          <div class="invoice-info">
            <div class="customer-info">
              <h3>Bill To:</h3>
              <p><strong>${order.customer_info?.fullName || 'N/A'}</strong></p>
              <p>${order.customer_info?.email || 'N/A'}</p>
              <p>${order.customer_info?.phone || 'N/A'}</p>
              <p>${order.shipping_address}</p>
            </div>
            <div class="order-info">
              <h3>Order Details:</h3>
              <p><strong>Order Number:</strong> ${order.order_number}</p>
              <p><strong>Order Date:</strong> ${dayjs(order.created_at).format('DD/MM/YYYY')}</p>
              <p><strong>Payment Method:</strong> Credit/Debit Card</p>
              <p><strong>Payment Status:</strong> Paid</p>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.product_name}</td>
                  <td>${item.product_sku || 'N/A'}</td>
                  <td>${item.quantity}</td>
                  <td>Rs. ${formatCurrency(item.unit_price)}</td>
                  <td>Rs. ${formatCurrency(item.total_price)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-row">Subtotal: Rs. ${formatCurrency(order.subtotal)}</div>
            <div class="total-row">Shipping: Rs. ${formatCurrency(order.shipping_cost)}</div>
            ${order.tax_amount ? `<div class="total-row">Tax: Rs. ${formatCurrency(order.tax_amount)}</div>` : ''}
            <div class="total-row grand-total">Total: Rs. ${formatCurrency(order.total_amount)}</div>
          </div>
          
          ${order.special_instructions ? `
            <div style="margin-top: 20px;">
              <h4>Special Instructions:</h4>
              <p>${order.special_instructions}</p>
            </div>
          ` : ''}
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>TeraFlow SCM - Clay Products Supply Chain Management</p>
          </div>
        </body>
        </html>
      `;

      // Create and download the invoice
      const blob = new Blob([invoiceHTML], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${order.order_number}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('Invoice downloaded successfully');
    } catch (error) {
      message.error('Failed to download invoice');
      console.error('Download invoice error:', error);
    }
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailsModal(true);
  };

  const openCancelModal = (order: Order) => {
    setOrderToCancel(order);
    setCancelOrderModal(true);
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filters.status === 'all' || order.status === filters.status;
    const matchesSearch = !filters.search || 
      order.order_number.toLowerCase().includes(filters.search.toLowerCase()) ||
      order.items.some(item => item.product_name.toLowerCase().includes(filters.search.toLowerCase()));
    
    const matchesDateRange = !filters.dateRange || 
      (dayjs(order.created_at).isAfter(filters.dateRange[0]) && 
       dayjs(order.created_at).isBefore(filters.dateRange[1]));

    return matchesStatus && matchesSearch && matchesDateRange;
  });

  const columns: ColumnsType<Order> = [
    {
      title: 'Order Number',
      dataIndex: 'order_number',
      key: 'order_number',
      render: (text: string) => (
        <Text strong style={{ color: '#1890ff' }}>{text}</Text>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items: OrderItem[]) => (
        <div>
          <Text>{items.length} item(s)</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {items.slice(0, 2).map(item => item.product_name).join(', ')}
            {items.length > 2 && '...'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => (
        <Text strong style={{ fontSize: 16 }}>
          Rs. {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag 
          icon={getStatusIcon(status)} 
          color={getStatusColor(status)}
          style={{ fontWeight: 600 }}
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Payment',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: () => (
        <div>
          <Tag color="green">
            PAID
          </Tag>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            Card Payment
          </Text>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: Order) => (
        <Space direction="vertical" size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openOrderDetails(record)}
            style={{ width: '100%' }}
          >
            View Details
          </Button>
          {canCancelOrder(record) && (
            <Button
              danger
              size="small"
              icon={<StopOutlined />}
              onClick={() => openCancelModal(record)}
              style={{ width: '100%' }}
            >
              Cancel Order
            </Button>
          )}
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => downloadInvoice(record)}
            style={{ width: '100%' }}
          >
            Download Invoice
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ color: '#8B4513', marginBottom: 24 }}>
        <ShoppingCartOutlined style={{ marginRight: 8 }} />
        My Orders
      </Title>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input
              placeholder="Search orders or products..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              style={{ width: '100%' }}
              prefix={<FilterOutlined />}
            >
              <Option value="all">All Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="confirmed">Confirmed</Option>
              <Option value="approved">Approved</Option>
              <Option value="processing">Processing</Option>
              <Option value="shipped">Shipped</Option>
              <Option value="delivered">Delivered</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null })}
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
          <Col span={4}>
            <Button 
              onClick={() => fetchOrders(true)} 
              loading={loading}
              type="primary"
              style={{ width: '100%' }}
            >
              {loading ? 'Refreshing...' : 'Refresh Orders'}
            </Button>
          </Col>
          <Col span={4}>
            <Text type="secondary">
              Total: {filteredOrders.length} orders
            </Text>
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
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} orders`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Order Details Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ShoppingCartOutlined style={{ color: '#1890ff' }} />
            <span>Order Details - {selectedOrder?.order_number}</span>
          </div>
        }
        open={orderDetailsModal}
        onCancel={() => {
          setOrderDetailsModal(false);
          setSelectedOrder(null);
        }}
        footer={[
          <Button key="close" onClick={() => setOrderDetailsModal(false)}>
            Close
          </Button>,
          selectedOrder && canCancelOrder(selectedOrder) && (
            <Button 
              key="cancel" 
              danger 
              icon={<StopOutlined />}
              onClick={() => {
                setOrderDetailsModal(false);
                openCancelModal(selectedOrder);
              }}
            >
              Cancel Order
            </Button>
          ),
          selectedOrder && (
            <Button 
              key="invoice" 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={() => downloadInvoice(selectedOrder)}
            >
              Download Invoice
            </Button>
          )
        ].filter(Boolean)}
        width={900}
      >
        {selectedOrder && (
          <div>
            <Row gutter={24}>
              <Col span={12}>
                <Card title="Order Information" size="small" style={{ marginBottom: 16 }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Order Number">
                      <Text strong style={{ color: '#1890ff' }}>{selectedOrder.order_number}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Order Date">
                      {dayjs(selectedOrder.created_at).format('DD/MM/YYYY HH:mm')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag 
                        icon={getStatusIcon(selectedOrder.status)} 
                        color={getStatusColor(selectedOrder.status)}
                      >
                        {selectedOrder.status.toUpperCase()}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Last Updated">
                      {dayjs(selectedOrder.updated_at).format('DD/MM/YYYY HH:mm')}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

              <Col span={12}>
                <Card title="Payment Information" size="small" style={{ marginBottom: 16 }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Payment Method">
                      Credit/Debit Card
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Status">
                      <Tag color="green">
                        PAID
                      </Tag>
                    </Descriptions.Item>
                    {selectedOrder.payment_details?.card_last_four && (
                      <Descriptions.Item label="Card">
                        ****  ****  ****  {selectedOrder.payment_details.card_last_four}
                      </Descriptions.Item>
                    )}
                    {selectedOrder.payment_details?.transaction_id && (
                      <Descriptions.Item label="Transaction ID">
                        <Text code>{selectedOrder.payment_details.transaction_id}</Text>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            <Card title="Order Items" size="small" style={{ marginBottom: 16 }}>
              <Table
                dataSource={selectedOrder.items}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Product',
                    dataIndex: 'product_name',
                    key: 'product_name',
                  },
                  {
                    title: 'SKU',
                    dataIndex: 'product_sku',
                    key: 'product_sku',
                    render: (sku: string) => sku || 'N/A'
                  },
                  {
                    title: 'Quantity',
                    dataIndex: 'quantity',
                    key: 'quantity',
                  },
                  {
                    title: 'Unit Price',
                    dataIndex: 'unit_price',
                    key: 'unit_price',
                    render: (price: number) => `Rs. ${formatCurrency(price)}`,
                  },
                  {
                    title: 'Total',
                    dataIndex: 'total_price',
                    key: 'total_price',
                    render: (price: number) => (
                      <Text strong>Rs. {formatCurrency(price)}</Text>
                    ),
                  },
                ]}
              />
            </Card>

            <Row gutter={24}>
              <Col span={12}>
                <Card title="Shipping Address" size="small" style={{ marginBottom: 16 }}>
                  <Text>{selectedOrder.shipping_address}</Text>
                </Card>
              </Col>

              <Col span={12}>
                <Card title="Order Summary" size="small" style={{ marginBottom: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text>Subtotal: Rs. {formatCurrency(selectedOrder.subtotal)}</Text>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Text>Shipping: Rs. {formatCurrency(selectedOrder.shipping_cost)}</Text>
                    </div>
                    {selectedOrder.tax_amount && (
                      <div style={{ marginBottom: 8 }}>
                        <Text>Tax: Rs. {formatCurrency(selectedOrder.tax_amount)}</Text>
                      </div>
                    )}
                    <Divider style={{ margin: '8px 0' }} />
                    <div>
                      <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                        Total: Rs. {formatCurrency(selectedOrder.total_amount)}
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            {selectedOrder.special_instructions && (
              <Card title="Special Instructions" size="small">
                <Text>{selectedOrder.special_instructions}</Text>
              </Card>
            )}
          </div>
        )}
      </Modal>

      {/* Cancel Order Modal */}
      <Modal
        title="Cancel Order"
        open={cancelOrderModal}
        onCancel={() => {
          setCancelOrderModal(false);
          setOrderToCancel(null);
        }}
        onOk={() => orderToCancel && cancelOrder(orderToCancel.id)}
        okText="Yes, Cancel Order"
        cancelText="Keep Order"
        okButtonProps={{ danger: true }}
      >
        {orderToCancel && (
          <div>
            <p>Are you sure you want to cancel this order?</p>
            <Card size="small" style={{ marginTop: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Order Number">
                  <Text strong>{orderToCancel.order_number}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Total Amount">
                  <Text strong>Rs. {formatCurrency(orderToCancel.total_amount)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Items">
                  {orderToCancel.items.length} product(s)
                </Descriptions.Item>
              </Descriptions>
            </Card>
            <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fff2e8', borderRadius: 6 }}>
              <Text style={{ color: '#fa8c16' }}>
                ⚠️ This action cannot be undone. If payment was made via card, refund will be processed within 5-7 business days.
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerOrders;
