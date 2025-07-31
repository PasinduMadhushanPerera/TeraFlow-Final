import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Button, message, Tag, Input, Select, Space, Badge, Spin } from 'antd';
import { ShoppingCartOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';

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

export const CustomerProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [cartLoading, setCartLoading] = useState<{ [key: number]: boolean }>({});

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
                style={{ height: '100%' }}
                cover={
                  <div style={{ height: 200, overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
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
                  <Button
                    key="add-to-cart"
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    loading={cartLoading[product.id]}
                    onClick={() => addToCart(product.id)}
                    style={{ backgroundColor: '#8B4513', borderColor: '#8B4513' }}
                    disabled={product.stock_quantity <= 0}
                  >
                    Add to Cart
                  </Button>
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
                
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong style={{ fontSize: 18, color: '#8B4513' }}>
                      Rs. {product.price.toFixed(2)}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      /{product.unit}
                    </Text>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <Badge
                      count={product.stock_quantity}
                      style={{ backgroundColor: product.stock_quantity > 10 ? '#52c41a' : '#faad14' }}
                    />
                    <div>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        in stock
                      </Text>
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    SKU: {product.sku}
                  </Text>
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
    </div>
  );
};
