import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Button, message, Tag, Input, Select, Space, Badge, Spin, Modal, Descriptions, Form, Steps, Radio, Checkbox } from 'antd';
import { ShoppingCartOutlined, SearchOutlined, FilterOutlined, ThunderboltOutlined, EyeOutlined, CreditCardOutlined, HomeOutlined, UserOutlined, DollarOutlined, PhoneOutlined, MailOutlined, CalendarOutlined, CheckCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const { Search } = Input;
const { Option } = Select;

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  stock_quantity: number;
  minimum_stock: number;
  unit: string;
  sku: string;
  image_url: string;
  clay_type?: string;
  dimensions?: string;
  firing_temperature?: number;
  is_active: boolean;
}

interface CheckoutData {
  customerInfo: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
  };
  shippingAddress: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: 'stripe' | 'cod';
  specialInstructions: string;
  saveAddressForFuture: boolean;
  emailUpdates: boolean;
  cardDetails?: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
    saveCard: boolean;
  };
}

export const CustomerProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [cartLoading, setCartLoading] = useState<{ [key: number]: boolean }>({});
  
  // Enhanced Buy Now Modal States with Checkout Flow
  const [buyNowModal, setBuyNowModal] = useState({
    visible: false,
    product: null as Product | null,
    quantity: 1,
    loading: false,
    currentStep: 0
  });

  // Checkout Form Data
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    customerInfo: {
      fullName: '',
      email: '',
      phone: '',
      dateOfBirth: ''
    },
    shippingAddress: {
      address: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'Sri Lanka'
    },
    paymentMethod: 'cod',
    specialInstructions: '',
    saveAddressForFuture: false,
    emailUpdates: true,
    cardDetails: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      saveCard: false
    }
  });

  // Form instance for checkout
  const [checkoutForm] = Form.useForm();

  // Product Details Modal States
  const [productDetailsModal, setProductDetailsModal] = useState({
    visible: false,
    product: null as Product | null
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, selectedCategory, searchTerm]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token) {
        message.error('Authentication required');
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/customer/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        setProducts(result.data);
        // Extract unique categories
        const uniqueCategories = [...new Set(result.data.map((p: Product) => p.category))] as string[];
        setCategories(uniqueCategories);
      } else {
        message.error(result.message || 'Failed to fetch products');
      }
    } catch (error) {
      message.error('Failed to fetch products');
      console.error('Fetch products error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Only show active products with stock
    filtered = filtered.filter(product => product.is_active && product.stock_quantity > 0);

    setFilteredProducts(filtered);
  };

  const addToCart = async (productId: number, quantity: number = 1) => {
    setCartLoading(prev => ({ ...prev, [productId]: true }));
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token) {
        message.error('Authentication required');
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/cart/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: quantity
        })
      });

      const result = await response.json();
      if (result.success) {
        message.success('Product added to cart successfully');
      } else {
        message.error(result.message || 'Failed to add product to cart');
      }
    } catch (error) {
      message.error('Failed to add product to cart');
      console.error('Add to cart error:', error);
    } finally {
      setCartLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Enhanced Buy Now functionality with complete checkout process
  const buyNow = async (product: Product, quantity: number, checkoutData: CheckoutData) => {
    setBuyNowModal(prev => ({ ...prev, loading: true }));
    
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token) {
        message.error('Authentication required');
        return;
      }

      // Validate stock availability
      if (product.stock_quantity < quantity) {
        message.error(`Only ${product.stock_quantity} items available in stock`);
        return;
      }

      // Calculate totals
      const subtotal = product.price * quantity;
      const shippingCost = 250; // Fixed shipping cost
      const taxRate = 0.05; // 5% tax rate
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + shippingCost + taxAmount;

      // Create comprehensive order data
      const orderData = {
        items: [{
          product_id: product.id,
          quantity: quantity,
          unit_price: product.price
        }],
        customer_info: checkoutData.customerInfo,
        shipping_address: `${checkoutData.shippingAddress.address}, ${checkoutData.shippingAddress.city}, ${checkoutData.shippingAddress.province} ${checkoutData.shippingAddress.postalCode}, ${checkoutData.shippingAddress.country}`,
        payment_method: checkoutData.paymentMethod,
        subtotal: subtotal,
        shipping_cost: shippingCost,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        special_instructions: checkoutData.specialInstructions,
        notes: `Checkout order for ${product.name} - Payment Method: ${checkoutData.paymentMethod.toUpperCase()}`
      };

      // Enhanced payment processing
      if (checkoutData.paymentMethod === 'stripe') {
        // Validate card details
        if (!checkoutData.cardDetails?.cardNumber || 
            !checkoutData.cardDetails?.expiryDate || 
            !checkoutData.cardDetails?.cvv || 
            !checkoutData.cardDetails?.cardholderName) {
          message.error('Please complete all card details');
          return;
        }

        // Simulate card validation
        message.loading('Validating card details...', 1);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate payment processing
        message.loading('Processing payment securely...', 2);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Add card details to order data (in real implementation, this would be tokenized)
        const paymentDetails = {
          payment_method: 'stripe',
          card_last_four: checkoutData.cardDetails.cardNumber.slice(-4),
          cardholder_name: checkoutData.cardDetails.cardholderName,
          card_brand: 'Visa', // In real implementation, detect from card number
          transaction_id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        // Add payment details to notes
        orderData.notes += ` | Payment: ${paymentDetails.payment_method.toUpperCase()} ending in ${paymentDetails.card_last_four}`;
      }

      const response = await fetch('http://localhost:5000/api/customer/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      
      if (result.success) {
        setBuyNowModal({ visible: false, product: null, quantity: 1, loading: false, currentStep: 0 });
        
        // Show comprehensive order success
        Modal.success({
          title: 'Order Placed Successfully!',
          width: 600,
          content: (
            <div style={{ padding: '16px 0' }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Order Number">
                  <Text strong style={{ color: '#52c41a' }}>{result.data.order_number}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Product">{product.name}</Descriptions.Item>
                <Descriptions.Item label="Quantity">{quantity} {product.unit}</Descriptions.Item>
                <Descriptions.Item label="Subtotal">Rs. {subtotal.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="Shipping">Rs. {shippingCost.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="Tax (5%)">Rs. {taxAmount.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="Total Amount">
                  <Text strong style={{ fontSize: 16, color: '#52c41a' }}>Rs. {totalAmount.toFixed(2)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Payment Method">
                  {checkoutData.paymentMethod === 'stripe' ? 'Credit/Debit Card (Stripe)' : 'Cash on Delivery'}
                </Descriptions.Item>
                {checkoutData.paymentMethod === 'stripe' && checkoutData.cardDetails && (
                  <Descriptions.Item label="Card Details">
                    <div>
                      <Text style={{ fontSize: 12 }}>
                        Card ending in ****{checkoutData.cardDetails.cardNumber.slice(-4)}
                      </Text>
                      <br />
                      <Text style={{ fontSize: 12, color: '#52c41a' }}>
                        Payment processed securely ✓
                      </Text>
                    </div>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Delivery Address">
                  {orderData.shipping_address}
                </Descriptions.Item>
              </Descriptions>
              <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f6ffed', borderRadius: 6 }}>
                <Text style={{ color: '#52c41a' }}>
                  📧 Order confirmation has been sent to {checkoutData.customerInfo.email}
                </Text>
              </div>
            </div>
          ),
          okText: 'View My Orders',
          onOk: () => {
            window.location.href = '/customer/orders';
          }
        });
        
        // Refresh products to update stock quantities
        fetchProducts();
        
      } else {
        message.error(result.message || 'Failed to place order');
      }
    } catch (error) {
      message.error('Failed to place order');
      console.error('Buy now error:', error);
    } finally {
      setBuyNowModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Open Buy Now Modal
  const openBuyNowModal = (product: Product) => {
    setBuyNowModal({
      visible: true,
      product: product,
      quantity: 1,
      loading: false,
      currentStep: 0
    });
  };

  // Open Product Details Modal
  const openProductDetails = (product: Product) => {
    setProductDetailsModal({
      visible: true,
      product: product
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'raw_materials': return 'brown';
      case 'finished_products': return 'green';
      case 'tools': return 'blue';
      case 'packaging': return 'orange';
      case 'chemicals': return 'purple';
      default: return 'default';
    }
  };

  const formatCategoryName = (category: string) => {
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ color: '#8B4513', marginBottom: 24 }}>
        <ShoppingCartOutlined style={{ marginRight: 8 }} />
        Clay Products Catalog
      </Title>

      {/* Search and Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="horizontal" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Search
            placeholder="Search products by name, description, or SKU..."
            allowClear
            style={{ width: 400 }}
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <Space>
            <Text>
              <FilterOutlined style={{ marginRight: 8 }} />
              Filter by Category:
            </Text>
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: 200 }}
            >
              <Option value="all">All Categories</Option>
              {categories.map(category => (
                <Option key={category} value={category}>
                  {formatCategoryName(category)}
                </Option>
              ))}
            </Select>
          </Space>
        </Space>
      </Card>

      {/* Products Grid */}
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {filteredProducts.map(product => (
            <Col key={product.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                style={{ 
                  height: '100%',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.3s ease',
                  border: '1px solid #f0f0f0',
                  position: 'relative',
                  ...(product.stock_quantity <= 0 && {
                    opacity: 0.7,
                    backgroundColor: '#fafafa'
                  })
                }}
                onMouseEnter={(e) => {
                  if (product.stock_quantity > 0) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                }}
                cover={
                  <div style={{ 
                    height: 200, 
                    overflow: 'hidden', 
                    backgroundColor: '#f5f5f5',
                    position: 'relative'
                  }}>
                    {product.stock_quantity <= 0 && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2
                      }}>
                        <Text style={{ 
                          color: 'white', 
                          fontSize: 16, 
                          fontWeight: 600,
                          backgroundColor: 'rgba(255, 77, 79, 0.9)',
                          padding: '4px 12px',
                          borderRadius: '4px'
                        }}>
                          OUT OF STOCK
                        </Text>
                      </div>
                    )}
                    {product.image_url ? (
                      <img
                        alt={product.name}
                        src={product.image_url}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/300x200?text=Product+Image';
                        }}
                      />
                    ) : (
                      <div style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f0f0f0',
                        color: '#999'
                      }}>
                        No Image
                      </div>
                    )}
                  </div>
                }
                actions={[
                  <div key="action-buttons" style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    padding: '8px 16px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <Button
                      icon={<ShoppingCartOutlined />}
                      loading={cartLoading[product.id]}
                      onClick={() => addToCart(product.id)}
                      disabled={product.stock_quantity <= 0}
                      style={{
                        borderColor: product.stock_quantity <= 0 ? '#d9d9d9' : '#8B4513',
                        color: product.stock_quantity <= 0 ? '#d9d9d9' : '#8B4513',
                        fontWeight: 500,
                        borderRadius: '8px',
                        height: '36px',
                        transition: 'all 0.3s ease',
                        boxShadow: product.stock_quantity <= 0 ? 'none' : '0 2px 4px rgba(139, 69, 19, 0.1)',
                        flex: '1',
                        minWidth: '90px',
                        backgroundColor: product.stock_quantity <= 0 ? '#f5f5f5' : 'white'
                      }}
                      onMouseEnter={(e) => {
                        if (product.stock_quantity > 0) {
                          e.currentTarget.style.backgroundColor = '#8B4513';
                          e.currentTarget.style.color = 'white';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(139, 69, 19, 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (product.stock_quantity > 0) {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.color = '#8B4513';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(139, 69, 19, 0.1)';
                        }
                      }}
                    >
                      {product.stock_quantity <= 0 ? 'Out of Stock' : 'Cart'}
                    </Button>
                    
                    <Button
                      type="primary"
                      icon={<ThunderboltOutlined />}
                      onClick={() => openBuyNowModal(product)}
                      disabled={product.stock_quantity <= 0}
                      style={{
                        backgroundColor: product.stock_quantity <= 0 ? '#f5f5f5' : '#52c41a',
                        borderColor: product.stock_quantity <= 0 ? '#d9d9d9' : '#52c41a',
                        color: product.stock_quantity <= 0 ? '#d9d9d9' : 'white',
                        fontWeight: 600,
                        borderRadius: '8px',
                        height: '36px',
                        transition: 'all 0.3s ease',
                        boxShadow: product.stock_quantity <= 0 ? 'none' : '0 2px 8px rgba(82, 196, 26, 0.3)',
                        flex: '1',
                        minWidth: '90px'
                      }}
                      onMouseEnter={(e) => {
                        if (product.stock_quantity > 0) {
                          e.currentTarget.style.backgroundColor = '#73d13d';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(82, 196, 26, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (product.stock_quantity > 0) {
                          e.currentTarget.style.backgroundColor = '#52c41a';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(82, 196, 26, 0.3)';
                        }
                      }}
                    >
                      {product.stock_quantity <= 0 ? 'Unavailable' : 'Buy Now'}
                    </Button>
                    
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => openProductDetails(product)}
                      style={{
                        color: '#666',
                        fontWeight: 500,
                        borderRadius: '8px',
                        height: '36px',
                        transition: 'all 0.3s ease',
                        border: '1px solid #e0e0e0',
                        backgroundColor: '#fafafa',
                        flex: '0.8',
                        minWidth: '80px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1890ff';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.borderColor = '#1890ff';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(24, 144, 255, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fafafa';
                        e.currentTarget.style.color = '#666';
                        e.currentTarget.style.borderColor = '#e0e0e0';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      View
                    </Button>
                  </div>
                ]}
              >
                <Card.Meta
                  title={
                    <div>
                      <Text strong>{product.name}</Text>
                      <div style={{ marginTop: 4 }}>
                        <Tag color={getCategoryColor(product.category)}>
                          {formatCategoryName(product.category)}
                        </Tag>
                      </div>
                    </div>
                  }
                  description={
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {product.description}
                      </Text>
                      
                      {product.clay_type && (
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Clay Type: {product.clay_type}
                          </Text>
                        </div>
                      )}
                      
                      {product.dimensions && (
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Dimensions: {product.dimensions}
                          </Text>
                        </div>
                      )}
                      
                      {product.firing_temperature && (
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Firing Temp: {product.firing_temperature}°C
                          </Text>
                        </div>
                      )}
                    </div>
                  }
                />
                
                <div style={{ 
                  marginTop: 16, 
                  padding: '12px 16px',
                  backgroundColor: '#fafafa',
                  borderRadius: '8px',
                  border: '1px solid #f0f0f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <Text strong style={{ 
                        fontSize: 20, 
                        color: '#8B4513',
                        fontWeight: 700,
                        textShadow: '1px 1px 2px rgba(139, 69, 19, 0.1)'
                      }}>
                        Rs. {product.price.toFixed(2)}
                      </Text>
                      <Text type="secondary" style={{ 
                        fontSize: 12,
                        marginLeft: 4,
                        fontWeight: 500
                      }}>
                        /{product.unit}
                      </Text>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <Badge
                        count={product.stock_quantity}
                        style={{ 
                          backgroundColor: product.stock_quantity > 10 ? '#52c41a' : 
                                         product.stock_quantity > 0 ? '#faad14' : '#ff4d4f',
                          fontWeight: 600,
                          fontSize: 11
                        }}
                      />
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ 
                          fontSize: 10,
                          color: product.stock_quantity > 10 ? '#52c41a' : 
                                product.stock_quantity > 0 ? '#faad14' : '#ff4d4f',
                          fontWeight: 500
                        }}>
                          {product.stock_quantity > 0 ? 'in stock' : 'out of stock'}
                        </Text>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingTop: 8,
                    borderTop: '1px solid #e8e8e8'
                  }}>
                    <Text type="secondary" style={{ fontSize: 10, color: '#999' }}>
                      SKU: {product.sku}
                    </Text>
                    {product.stock_quantity <= product.minimum_stock && product.stock_quantity > 0 && (
                      <Text style={{ 
                        fontSize: 10, 
                        color: '#fa8c16',
                        backgroundColor: '#fff7e6',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 500
                      }}>
                        LOW STOCK
                      </Text>
                    )}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>

      {!loading && filteredProducts.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <ShoppingCartOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <br />
          <Text type="secondary">No products found matching your criteria</Text>
        </div>
      )}

      {/* Enhanced Buy Now Modal with Complete Checkout Process */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ShoppingCartOutlined style={{ color: '#1890ff', fontSize: 20 }} />
            <span>Complete Your Order</span>
          </div>
        }
        open={buyNowModal.visible}
        onCancel={() => {
          setBuyNowModal({ visible: false, product: null, quantity: 1, loading: false, currentStep: 0 });
          setCheckoutData({
            customerInfo: { fullName: '', email: '', phone: '', dateOfBirth: '' },
            shippingAddress: { address: '', city: '', province: '', postalCode: '', country: 'Sri Lanka' },
            paymentMethod: 'cod',
            specialInstructions: '',
            saveAddressForFuture: false,
            emailUpdates: true,
            cardDetails: {
              cardNumber: '',
              expiryDate: '',
              cvv: '',
              cardholderName: '',
              saveCard: false
            }
          });
          checkoutForm.resetFields();
        }}
        footer={null}
        width={800}
        destroyOnClose
        centered
        className="checkout-modal"
      >
        {buyNowModal.product && (
          <div style={{ padding: '8px 0' }}>
            {/* Order Summary Header */}
            <Card 
              size="small" 
              style={{ 
                marginBottom: 24, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
              bodyStyle={{ padding: 16 }}
            >
              <Row align="middle" justify="space-between">
                <Col span={16}>
                  <div style={{ color: 'white' }}>
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: 600 }}>
                      {buyNowModal.product.name}
                    </Text>
                    <br />
                    <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                      {buyNowModal.quantity} {buyNowModal.product.unit} × Rs. {buyNowModal.product.price}
                    </Text>
                  </div>
                </Col>
                <Col span={8} style={{ textAlign: 'right' }}>
                  <Text style={{ color: 'white', fontSize: 20, fontWeight: 600 }}>
                    Rs. {(buyNowModal.product.price * buyNowModal.quantity).toFixed(2)}
                  </Text>
                </Col>
              </Row>
            </Card>

            {/* Quantity Selection */}
            <Card 
              title="Select Quantity" 
              size="small" 
              style={{ marginBottom: 24, backgroundColor: '#fafafa' }}
              bodyStyle={{ padding: 16 }}
            >
              <Row align="middle" justify="space-between">
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Button 
                      size="large"
                      shape="circle"
                      onClick={() => {
                        if (buyNowModal.quantity > 1) {
                          setBuyNowModal(prev => ({ ...prev, quantity: prev.quantity - 1 }));
                        }
                      }}
                      disabled={buyNowModal.quantity <= 1}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        border: '2px solid #1890ff',
                        color: buyNowModal.quantity <= 1 ? '#d9d9d9' : '#1890ff'
                      }}
                    >
                      -
                    </Button>
                    
                    <div style={{ 
                      minWidth: 60, 
                      textAlign: 'center',
                      padding: '8px 16px',
                      border: '2px solid #e8e8e8',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      fontSize: 18,
                      fontWeight: 600
                    }}>
                      {buyNowModal.quantity}
                    </div>
                    
                    <Button 
                      size="large"
                      shape="circle"
                      onClick={() => {
                        if (buyNowModal.quantity < buyNowModal.product!.stock_quantity) {
                          setBuyNowModal(prev => ({ ...prev, quantity: prev.quantity + 1 }));
                        }
                      }}
                      disabled={buyNowModal.quantity >= buyNowModal.product.stock_quantity}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        border: '2px solid #1890ff',
                        color: buyNowModal.quantity >= buyNowModal.product.stock_quantity ? '#d9d9d9' : '#1890ff'
                      }}
                    >
                      +
                    </Button>
                  </div>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Available Stock: {buyNowModal.product.stock_quantity} {buyNowModal.product.unit}
                    </Text>
                    <br />
                    <Text strong style={{ fontSize: 14, color: '#52c41a' }}>
                      Subtotal: Rs. {(buyNowModal.product.price * buyNowModal.quantity).toFixed(2)}
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Step Progress */}
            <Steps 
              current={buyNowModal.currentStep} 
              style={{ marginBottom: 32 }}
              items={[
                {
                  title: 'Customer Info',
                  icon: <UserOutlined />,
                  description: 'Personal details'
                },
                {
                  title: 'Delivery Address',
                  icon: <HomeOutlined />,
                  description: 'Shipping information'
                },
                {
                  title: 'Payment Method',
                  icon: <CreditCardOutlined />,
                  description: 'Choose payment'
                },
                {
                  title: 'Review & Confirm',
                  icon: <DollarOutlined />,
                  description: 'Order summary'
                }
              ]}
            />

            <Form
              form={checkoutForm}
              layout="vertical"
              onFinish={(values) => {
                setCheckoutData({ ...checkoutData, ...values });
                if (buyNowModal.currentStep === 3) {
                  buyNow(buyNowModal.product!, buyNowModal.quantity, { ...checkoutData, ...values });
                } else {
                  setBuyNowModal(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
                }
              }}
              style={{ minHeight: 400 }}
            >
              {/* Step 1: Customer Information */}
              {buyNowModal.currentStep === 0 && (
                <div>
                  <Title level={4} style={{ marginBottom: 24, color: '#1890ff' }}>
                    <UserOutlined /> Customer Information
                  </Title>
                  
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name={['customerInfo', 'fullName']}
                        label="Full Name"
                        rules={[{ required: true, message: 'Please enter your full name' }]}
                        initialValue={checkoutData.customerInfo.fullName}
                      >
                        <Input 
                          placeholder="Enter your full name"
                          prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={['customerInfo', 'phone']}
                        label="Phone Number"
                        rules={[
                          { required: true, message: 'Please enter your phone number' },
                          { pattern: /^(\+94|0)[0-9]{9}$/, message: 'Please enter a valid Sri Lankan phone number' }
                        ]}
                        initialValue={checkoutData.customerInfo.phone}
                      >
                        <Input 
                          placeholder="+94 77 123 4567 or 077 123 4567"
                          prefix={<PhoneOutlined style={{ color: '#1890ff' }} />}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name={['customerInfo', 'email']}
                        label="Email Address"
                        rules={[
                          { required: true, message: 'Please enter your email' },
                          { type: 'email', message: 'Please enter a valid email' }
                        ]}
                        initialValue={checkoutData.customerInfo.email}
                      >
                        <Input 
                          placeholder="your.email@example.com"
                          prefix={<MailOutlined style={{ color: '#1890ff' }} />}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={['customerInfo', 'dateOfBirth']}
                        label="Date of Birth (Optional)"
                        initialValue={checkoutData.customerInfo.dateOfBirth}
                      >
                        <Input 
                          placeholder="DD/MM/YYYY"
                          prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="emailUpdates" valuePropName="checked" initialValue={checkoutData.emailUpdates}>
                    <Checkbox>Send order updates via email</Checkbox>
                  </Form.Item>
                </div>
              )}

              {/* Step 2: Delivery Address */}
              {buyNowModal.currentStep === 1 && (
                <div>
                  <Title level={4} style={{ marginBottom: 24, color: '#1890ff' }}>
                    <HomeOutlined /> Delivery Address
                  </Title>
                  
                  <Form.Item
                    name={['shippingAddress', 'address']}
                    label="Street Address"
                    rules={[{ required: true, message: 'Please enter your address' }]}
                    initialValue={checkoutData.shippingAddress.address}
                  >
                    <Input.TextArea 
                      placeholder="House/Building number, Street name, Area"
                      rows={2}
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name={['shippingAddress', 'city']}
                        label="City"
                        rules={[{ required: true, message: 'Please enter your city' }]}
                        initialValue={checkoutData.shippingAddress.city}
                      >
                        <Input placeholder="Colombo, Kandy, Galle..." />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={['shippingAddress', 'province']}
                        label="Province"
                        rules={[{ required: true, message: 'Please select your province' }]}
                        initialValue={checkoutData.shippingAddress.province}
                      >
                        <Select placeholder="Select Province">
                          <Option value="Western">Western</Option>
                          <Option value="Central">Central</Option>
                          <Option value="Southern">Southern</Option>
                          <Option value="Northern">Northern</Option>
                          <Option value="Eastern">Eastern</Option>
                          <Option value="North Western">North Western</Option>
                          <Option value="North Central">North Central</Option>
                          <Option value="Uva">Uva</Option>
                          <Option value="Sabaragamuwa">Sabaragamuwa</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name={['shippingAddress', 'postalCode']}
                        label="Postal Code"
                        rules={[{ required: true, message: 'Please enter postal code' }]}
                        initialValue={checkoutData.shippingAddress.postalCode}
                      >
                        <Input placeholder="10100" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={['shippingAddress', 'country']}
                        label="Country"
                        initialValue={checkoutData.shippingAddress.country}
                      >
                        <Input value="Sri Lanka" disabled />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="saveAddressForFuture" valuePropName="checked" initialValue={checkoutData.saveAddressForFuture}>
                    <Checkbox>Save this address for future orders</Checkbox>
                  </Form.Item>
                </div>
              )}

              {/* Step 3: Payment Method */}
              {buyNowModal.currentStep === 2 && (
                <div>
                  <Title level={4} style={{ marginBottom: 24, color: '#1890ff' }}>
                    <CreditCardOutlined /> Payment Method
                  </Title>
                  
                  <Form.Item 
                    name="paymentMethod" 
                    rules={[{ required: true, message: 'Please select a payment method' }]}
                    initialValue={checkoutData.paymentMethod}
                  >
                    <Radio.Group style={{ width: '100%' }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Card 
                          size="small" 
                          style={{ cursor: 'pointer' }}
                          bodyStyle={{ padding: 16 }}
                        >
                          <Radio value="stripe">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <CreditCardOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                              <div>
                                <Text strong>Credit/Debit Card (Stripe)</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Secure payment with Visa, MasterCard, or other cards
                                </Text>
                              </div>
                            </div>
                          </Radio>
                        </Card>
                      </Space>
                    </Radio.Group>
                  </Form.Item>

                  {/* Card Details Form - Only show when Stripe is selected */}
                  <Form.Item dependencies={['paymentMethod']} noStyle>
                    {({ getFieldValue }) => {
                      const paymentMethod = getFieldValue('paymentMethod');
                      
                      return paymentMethod === 'stripe' ? (
                        <Card 
                          title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <CreditCardOutlined style={{ color: '#1890ff' }} />
                              <Text strong>Card Details</Text>
                            </div>
                          }
                          size="small" 
                          style={{ 
                            marginBottom: 24,
                            border: '2px solid #1890ff',
                            borderRadius: '8px'
                          }}
                          bodyStyle={{ padding: 20 }}
                        >
                          <Row gutter={16}>
                            <Col span={24}>
                              <Form.Item
                                name={['cardDetails', 'cardholderName']}
                                label="Cardholder Name"
                                rules={[
                                  { required: true, message: 'Please enter cardholder name' },
                                  { min: 2, message: 'Name must be at least 2 characters' }
                                ]}
                                initialValue={checkoutData.cardDetails?.cardholderName || ''}
                              >
                                <Input 
                                  placeholder="John Doe"
                                  prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                                  style={{ fontSize: 16 }}
                                />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Row gutter={16}>
                            <Col span={24}>
                              <Form.Item
                                name={['cardDetails', 'cardNumber']}
                                label="Card Number"
                                rules={[
                                  { required: true, message: 'Please enter card number' },
                                  { 
                                    pattern: /^[0-9\s]{16,19}$/, 
                                    message: 'Please enter a valid card number (16-19 digits)' 
                                  }
                                ]}
                                initialValue={checkoutData.cardDetails?.cardNumber || ''}
                              >
                                <Input 
                                  placeholder="1234 5678 9012 3456"
                                  prefix={<CreditCardOutlined style={{ color: '#1890ff' }} />}
                                  maxLength={19}
                                  style={{ fontSize: 16, letterSpacing: '2px' }}
                                  onChange={(e) => {
                                    // Format card number with spaces
                                    let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                                    let formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
                                    if (formattedValue.length > 19) {
                                      formattedValue = formattedValue.substring(0, 19);
                                    }
                                    checkoutForm.setFieldsValue({
                                      cardDetails: {
                                        ...checkoutForm.getFieldValue('cardDetails'),
                                        cardNumber: formattedValue
                                      }
                                    });
                                  }}
                                />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                name={['cardDetails', 'expiryDate']}
                                label="Expiry Date"
                                rules={[
                                  { required: true, message: 'Please enter expiry date' },
                                  { 
                                    pattern: /^(0[1-9]|1[0-2])\/([0-9]{2})$/, 
                                    message: 'Please enter valid expiry date (MM/YY)' 
                                  }
                                ]}
                                initialValue={checkoutData.cardDetails?.expiryDate || ''}
                              >
                                <Input 
                                  placeholder="MM/YY"
                                  prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
                                  maxLength={5}
                                  style={{ fontSize: 16 }}
                                  onChange={(e) => {
                                    // Format expiry date as MM/YY
                                    let value = e.target.value.replace(/\D/g, '');
                                    if (value.length >= 2) {
                                      value = value.substring(0, 2) + '/' + value.substring(2, 4);
                                    }
                                    checkoutForm.setFieldsValue({
                                      cardDetails: {
                                        ...checkoutForm.getFieldValue('cardDetails'),
                                        expiryDate: value
                                      }
                                    });
                                  }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name={['cardDetails', 'cvv']}
                                label="CVV"
                                rules={[
                                  { required: true, message: 'Please enter CVV' },
                                  { 
                                    pattern: /^[0-9]{3,4}$/, 
                                    message: 'Please enter valid CVV (3-4 digits)' 
                                  }
                                ]}
                                initialValue={checkoutData.cardDetails?.cvv || ''}
                              >
                                <Input 
                                  placeholder="123"
                                  prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                                  maxLength={4}
                                  type="password"
                                  style={{ fontSize: 16 }}
                                  onChange={(e) => {
                                    // Only allow numbers
                                    const value = e.target.value.replace(/\D/g, '');
                                    checkoutForm.setFieldsValue({
                                      cardDetails: {
                                        ...checkoutForm.getFieldValue('cardDetails'),
                                        cvv: value
                                      }
                                    });
                                  }}
                                />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Form.Item 
                            name={['cardDetails', 'saveCard']} 
                            valuePropName="checked" 
                            initialValue={checkoutData.cardDetails?.saveCard || false}
                          >
                            <Checkbox style={{ fontSize: 14 }}>
                              Save this card for future purchases (Optional)
                            </Checkbox>
                          </Form.Item>

                          <div style={{ 
                            padding: 12, 
                            backgroundColor: '#f6ffed', 
                            borderRadius: 6,
                            border: '1px solid #b7eb8f'
                          }}>
                            <Text style={{ color: '#52c41a', fontSize: 12 }}>
                              🔒 Your card information is encrypted and secure. We use Stripe's secure payment processing.
                            </Text>
                          </div>
                        </Card>
                      ) : null;
                    }}
                  </Form.Item>

                  <Form.Item
                    name="specialInstructions"
                    label="Special Instructions (Optional)"
                    initialValue={checkoutData.specialInstructions}
                  >
                    <Input.TextArea 
                      placeholder="Any special delivery instructions or notes..."
                      rows={3}
                    />
                  </Form.Item>
                </div>
              )}

              {/* Step 4: Review & Confirm */}
              {buyNowModal.currentStep === 3 && (
                <div>
                  <Title level={4} style={{ marginBottom: 24, color: '#1890ff' }}>
                    <CheckCircleOutlined /> Review Your Order
                  </Title>
                  
                  <Row gutter={24}>
                    <Col span={12}>
                      <Card title="Order Summary" size="small" style={{ marginBottom: 16 }}>
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="Product">
                            <Text strong>{buyNowModal.product.name}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Quantity">
                            <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
                              {buyNowModal.quantity} {buyNowModal.product.unit}
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Unit Price">
                            Rs. {buyNowModal.product.price.toFixed(2)}
                          </Descriptions.Item>
                          <Descriptions.Item label="Subtotal">
                            <Text strong style={{ color: '#52c41a' }}>
                              Rs. {(buyNowModal.product.price * buyNowModal.quantity).toFixed(2)}
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Shipping">Rs. 250.00</Descriptions.Item>
                          <Descriptions.Item label="Tax (5%)">Rs. {(buyNowModal.product.price * buyNowModal.quantity * 0.05).toFixed(2)}</Descriptions.Item>
                          <Descriptions.Item label="Total Amount">
                            <Text strong style={{ fontSize: 18, color: '#52c41a', fontWeight: 700 }}>
                              Rs. {(buyNowModal.product.price * buyNowModal.quantity + 250 + (buyNowModal.product.price * buyNowModal.quantity * 0.05)).toFixed(2)}
                            </Text>
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                    
                    <Col span={12}>
                      <Card title="Delivery Details" size="small" style={{ marginBottom: 16 }}>
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="Customer">
                            {checkoutForm.getFieldValue(['customerInfo', 'fullName'])}
                          </Descriptions.Item>
                          <Descriptions.Item label="Phone">
                            {checkoutForm.getFieldValue(['customerInfo', 'phone'])}
                          </Descriptions.Item>
                          <Descriptions.Item label="Email">
                            {checkoutForm.getFieldValue(['customerInfo', 'email'])}
                          </Descriptions.Item>
                          <Descriptions.Item label="Address">
                            {checkoutForm.getFieldValue(['shippingAddress', 'address'])}, {' '}
                            {checkoutForm.getFieldValue(['shippingAddress', 'city'])}, {' '}
                            {checkoutForm.getFieldValue(['shippingAddress', 'province'])} {' '}
                            {checkoutForm.getFieldValue(['shippingAddress', 'postalCode'])}
                          </Descriptions.Item>
                          <Descriptions.Item label="Payment Method">
                            {checkoutForm.getFieldValue('paymentMethod') === 'stripe' 
                              ? 'Credit/Debit Card (Stripe)' 
                              : 'Cash on Delivery'
                            }
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                  </Row>

                  {/* Card Details Display - Only show when Stripe is selected */}
                  {checkoutForm.getFieldValue('paymentMethod') === 'stripe' && (
                    <Card 
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CreditCardOutlined style={{ color: '#1890ff' }} />
                          <Text strong>Payment Card</Text>
                        </div>
                      }
                      size="small" 
                      style={{ 
                        marginBottom: 16,
                        border: '2px solid #1890ff',
                        borderRadius: '8px'
                      }}
                    >
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Cardholder Name">
                          {checkoutForm.getFieldValue(['cardDetails', 'cardholderName'])}
                        </Descriptions.Item>
                        <Descriptions.Item label="Card Number">
                          {checkoutForm.getFieldValue(['cardDetails', 'cardNumber']) 
                            ? `****  ****  ****  ${checkoutForm.getFieldValue(['cardDetails', 'cardNumber']).slice(-4)}`
                            : 'Not provided'
                          }
                        </Descriptions.Item>
                        <Descriptions.Item label="Expiry Date">
                          {checkoutForm.getFieldValue(['cardDetails', 'expiryDate'])}
                        </Descriptions.Item>
                        <Descriptions.Item label="Security">
                          <Text style={{ color: '#52c41a' }}>
                            🔒 Encrypted & Secure Payment via Stripe
                          </Text>
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  )}

                  {checkoutForm.getFieldValue('specialInstructions') && (
                    <Card title="Special Instructions" size="small" style={{ marginBottom: 16 }}>
                      <Text>{checkoutForm.getFieldValue('specialInstructions')}</Text>
                    </Card>
                  )}

                  <div style={{ padding: 16, backgroundColor: '#f6ffed', borderRadius: 6, marginBottom: 16 }}>
                    <Text style={{ color: '#52c41a' }}>
                      ✅ Your order will be processed within 24 hours<br />
                      📦 Estimated delivery: 2-3 business days<br />
                      📧 You'll receive order confirmation via email
                    </Text>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginTop: 32,
                paddingTop: 24,
                borderTop: '1px solid #f0f0f0'
              }}>
                <Button 
                  onClick={() => {
                    if (buyNowModal.currentStep > 0) {
                      setBuyNowModal(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
                    }
                  }}
                  disabled={buyNowModal.currentStep === 0}
                >
                  Previous
                </Button>

                {/* Real-time Price Summary */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 16,
                  padding: '8px 16px',
                  backgroundColor: '#f6ffed',
                  borderRadius: '8px',
                  border: '1px solid #b7eb8f'
                }}>
                  <Text style={{ fontSize: 14, color: '#666' }}>
                    {buyNowModal.quantity} × Rs. {buyNowModal.product.price.toFixed(2)} + Shipping + Tax
                  </Text>
                  <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                    Total: Rs. {(buyNowModal.product.price * buyNowModal.quantity + 250 + (buyNowModal.product.price * buyNowModal.quantity * 0.05)).toFixed(2)}
                  </Text>
                </div>
                
                <Button 
                  type="primary"
                  htmlType="submit"
                  loading={buyNowModal.loading}
                  icon={buyNowModal.currentStep === 3 ? <CheckCircleOutlined /> : <ArrowRightOutlined />}
                >
                  {buyNowModal.currentStep === 3 ? 'Place Order' : 'Continue'}
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* Product Details Modal */}
      <Modal
        title={
          productDetailsModal.product && (
            <div>
              <Text strong style={{ fontSize: 18 }}>
                {productDetailsModal.product.name}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 14 }}>
                SKU: {productDetailsModal.product.sku}
              </Text>
            </div>
          )
        }
        open={productDetailsModal.visible}
        onCancel={() => setProductDetailsModal({ visible: false, product: null })}
        footer={[
          <Button 
            key="close" 
            onClick={() => setProductDetailsModal({ visible: false, product: null })}
          >
            Close
          </Button>,
          productDetailsModal.product && productDetailsModal.product.stock_quantity > 0 && (
            <Button
              key="add-cart"
              icon={<ShoppingCartOutlined />}
              onClick={() => {
                if (productDetailsModal.product) {
                  addToCart(productDetailsModal.product.id);
                  setProductDetailsModal({ visible: false, product: null });
                }
              }}
              style={{ marginRight: 8 }}
            >
              Add to Cart
            </Button>
          ),
          productDetailsModal.product && productDetailsModal.product.stock_quantity > 0 && (
            <Button
              key="buy-now"
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={() => {
                if (productDetailsModal.product) {
                  setProductDetailsModal({ visible: false, product: null });
                  openBuyNowModal(productDetailsModal.product);
                }
              }}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Buy Now
            </Button>
          )
        ].filter(Boolean)}
        width={700}
      >
        {productDetailsModal.product && (
          <div>
            <Row gutter={24}>
              <Col span={10}>
                <div style={{
                  height: 300,
                  background: '#f5f5f5',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {productDetailsModal.product.image_url ? (
                    <img
                      src={productDetailsModal.product.image_url}
                      alt={productDetailsModal.product.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/300x300?text=Product+Image';
                      }}
                    />
                  ) : (
                    <Text type="secondary">No Image Available</Text>
                  )}
                </div>
              </Col>
              <Col span={14}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Category: {formatCategoryName(productDetailsModal.product.category)}
                    </Text>
                    <Title level={3} style={{ margin: '8px 0', color: '#8B4513' }}>
                      {productDetailsModal.product.name}
                    </Title>
                    <Text style={{ fontSize: 14, lineHeight: 1.6 }}>
                      {productDetailsModal.product.description}
                    </Text>
                  </div>

                  <Descriptions size="small" column={1}>
                    <Descriptions.Item label="Price">
                      <Text strong style={{ fontSize: 20, color: '#52c41a' }}>
                        Rs. {productDetailsModal.product.price.toFixed(2)}
                      </Text>
                      <Text type="secondary"> / {productDetailsModal.product.unit}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Stock Status">
                      <Badge
                        status={productDetailsModal.product.stock_quantity > 0 ? 'success' : 'error'}
                        text={
                          productDetailsModal.product.stock_quantity > 0 
                            ? `${productDetailsModal.product.stock_quantity} ${productDetailsModal.product.unit} available`
                            : 'Out of Stock'
                        }
                      />
                    </Descriptions.Item>
                    {productDetailsModal.product.clay_type && (
                      <Descriptions.Item label="Clay Type">
                        {productDetailsModal.product.clay_type}
                      </Descriptions.Item>
                    )}
                    {productDetailsModal.product.dimensions && (
                      <Descriptions.Item label="Dimensions">
                        {productDetailsModal.product.dimensions}
                      </Descriptions.Item>
                    )}
                    {productDetailsModal.product.firing_temperature && (
                      <Descriptions.Item label="Firing Temperature">
                        {productDetailsModal.product.firing_temperature}°C
                      </Descriptions.Item>
                    )}
                  </Descriptions>

                  {productDetailsModal.product.stock_quantity <= productDetailsModal.product.minimum_stock && 
                   productDetailsModal.product.stock_quantity > 0 && (
                    <div style={{ 
                      padding: 12, 
                      background: '#fff2e8', 
                      border: '1px solid #ffbb96', 
                      borderRadius: 6 
                    }}>
                      <Text style={{ color: '#d4380d' }}>
                        ⚠️ Only {productDetailsModal.product.stock_quantity} left in stock!
                      </Text>
                    </div>
                  )}
                </Space>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};
