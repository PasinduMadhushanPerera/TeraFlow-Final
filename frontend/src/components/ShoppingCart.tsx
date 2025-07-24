import React, { useState, useEffect } from 'react';
import { Card, Table, Button, message, Badge, Space, Modal, Typography, Tag } from 'antd';
import { ShoppingCartOutlined, DeleteOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface CartItem {
  id: number;
  quantity: number;
  product_id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
  unit: string;
  subtotal: number;
}

interface CartData {
  items: CartItem[];
  total_amount: string;
  item_count: number;
}

const ShoppingCart: React.FC = () => {
  const [cartData, setCartData] = useState<CartData>({ items: [], total_amount: '0.00', item_count: 0 });
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        setCartData(result.data);
      } else {
        message.error(result.message || 'Failed to fetch cart');
      }
    } catch (error) {
      message.error('Failed to fetch cart');
      console.error('Fetch cart error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/cart/item/${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: newQuantity })
      });

      const result = await response.json();
      if (result.success) {
        fetchCart(); // Refresh cart
        message.success('Cart updated successfully');
      } else {
        message.error(result.message || 'Failed to update cart');
      }
    } catch (error) {
      message.error('Failed to update cart');
      console.error('Update cart error:', error);
    }
  };

  const removeItem = async (itemId: number) => {
    Modal.confirm({
      title: 'Remove Item',
      content: 'Are you sure you want to remove this item from your cart?',
      okText: 'Remove',
      okType: 'danger',
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:5000/api/cart/item/${itemId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          const result = await response.json();
          if (result.success) {
            fetchCart(); // Refresh cart
            message.success('Item removed from cart');
          } else {
            message.error(result.message || 'Failed to remove item');
          }
        } catch (error) {
          message.error('Failed to remove item');
          console.error('Remove item error:', error);
        }
      }
    });
  };

  const clearCart = async () => {
    Modal.confirm({
      title: 'Clear Cart',
      content: 'Are you sure you want to remove all items from your cart?',
      okText: 'Clear All',
      okType: 'danger',
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:5000/api/cart/clear', {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          const result = await response.json();
          if (result.success) {
            fetchCart(); // Refresh cart
            message.success('Cart cleared successfully');
          } else {
            message.error(result.message || 'Failed to clear cart');
          }
        } catch (error) {
          message.error('Failed to clear cart');
          console.error('Clear cart error:', error);
        }
      }
    });
  };

  const handleCheckout = () => {
    if (cartData.items.length === 0) {
      message.warning('Your cart is empty');
      return;
    }

    setCheckoutLoading(true);
    // Simulate checkout process
    setTimeout(() => {
      setCheckoutLoading(false);
      message.success('Checkout functionality will be implemented with payment integration');
    }, 2000);
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: CartItem) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {record.image_url && (
            <img 
              src={record.image_url} 
              alt={record.name}
              style={{ width: 50, height: 50, objectFit: 'cover', marginRight: 12, borderRadius: 4 }}
            />
          )}
          <div>
            <Text strong>{text}</Text>
            <br />
            <Text type="secondary">{record.description}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number, record: CartItem) => (
        <div>
          <Text strong>Rs. {price.toFixed(2)}</Text>
          <br />
          <Text type="secondary">per {record.unit}</Text>
        </div>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number, record: CartItem) => (
        <Space>
          <Button 
            type="text" 
            icon={<MinusOutlined />} 
            size="small"
            onClick={() => updateQuantity(record.id, quantity - 1)}
          />
          <Badge count={quantity} style={{ backgroundColor: '#8B4513' }} />
          <Button 
            type="text" 
            icon={<PlusOutlined />} 
            size="small"
            onClick={() => updateQuantity(record.id, quantity + 1)}
            disabled={quantity >= record.stock_quantity}
          />
        </Space>
      ),
    },
    {
      title: 'Stock',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      render: (stock: number) => (
        <Tag color={stock > 10 ? 'green' : stock > 0 ? 'orange' : 'red'}>
          {stock} available
        </Tag>
      ),
    },
    {
      title: 'Subtotal',
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: (subtotal: number) => (
        <Text strong style={{ color: '#8B4513' }}>Rs. {subtotal.toFixed(2)}</Text>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: CartItem) => (
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />}
          onClick={() => removeItem(record.id)}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={2}>
            <ShoppingCartOutlined style={{ marginRight: 8, color: '#8B4513' }} />
            Shopping Cart
            <Badge count={cartData.item_count} style={{ marginLeft: 8, backgroundColor: '#8B4513' }} />
          </Title>
          {cartData.items.length > 0 && (
            <Button type="text" danger onClick={clearCart}>
              Clear Cart
            </Button>
          )}
        </div>

        <Table
          columns={columns}
          dataSource={cartData.items}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{
            emptyText: (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <ShoppingCartOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                <br />
                <Text type="secondary">Your cart is empty</Text>
                <br />
                <Button type="primary" href="/customer/products" style={{ marginTop: 16 }}>
                  Browse Products
                </Button>
              </div>
            )
          }}
        />

        {cartData.items.length > 0 && (
          <Card 
            style={{ marginTop: 24, backgroundColor: '#f9f9f9' }}
            styles={{ body: { textAlign: 'right' } }}
          >
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">Total Items: {cartData.item_count}</Text>
            </div>
            <div style={{ marginBottom: 24 }}>
              <Title level={3} style={{ margin: 0, color: '#8B4513' }}>
                Total: Rs. {cartData.total_amount}
              </Title>
            </div>
            <Space>
              <Button size="large" href="/customer/products">
                Continue Shopping
              </Button>
              <Button 
                type="primary" 
                size="large" 
                loading={checkoutLoading}
                onClick={handleCheckout}
                style={{ backgroundColor: '#8B4513', borderColor: '#8B4513' }}
              >
                Proceed to Checkout
              </Button>
            </Space>
          </Card>
        )}
      </Card>
    </div>
  );
};

export default ShoppingCart;
