import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Typography, Select, Input, Button, Tag, Space, 
  Pagination, Spin, message, Modal, InputNumber, Switch, Divider, Carousel 
} from 'antd';
import { 
  FilterOutlined, ShoppingCartOutlined, 
  EyeOutlined, PlusOutlined, LeftOutlined, RightOutlined 
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface ProductImage {
  image_url: string;
  image_alt?: string;
  display_order: number;
  is_primary: boolean;
}

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
  image_url?: string;
  images: ProductImage[];
  primary_image: string;
  firing_temperature?: number;
  clay_type?: string;
  glaze_type?: string;
  dimensions?: string;
  weight_kg?: number;
  production_time_days?: number;
  is_custom_order: boolean;
  stock_status: 'low' | 'medium' | 'good';
}

export const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 20
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [addToCartLoading, setAddToCartLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showOutOfStock, setShowOutOfStock] = useState(true);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [currentPage, searchTerm, categoryFilter, priceRange, showOutOfStock, sortBy, sortOrder]);

  // Helper function to get proper image URL
  const getImageUrl = (url: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop';
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url}`;
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      if (!showOutOfStock) {
        params.append('inStock', 'true');
      }

      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);
      if (priceRange.min) params.append('minPrice', priceRange.min.toString());
      if (priceRange.max) params.append('maxPrice', priceRange.max.toString());

      const response = await fetch(`http://localhost:5000/api/products?${params}`);
      const result = await response.json();

      if (result.success) {
        setProducts(result.data.products);
        setPagination(result.data.pagination);
      } else {
        message.error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      message.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products/categories');
      const result = await response.json();

      if (result.success) {
        setCategories(result.data.map((cat: any) => cat.category));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const handlePriceRangeChange = (type: 'min' | 'max', value: number | null) => {
    setPriceRange(prev => ({
      ...prev,
      [type]: value || undefined
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setPriceRange({});
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-');
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };

  const addToCart = async (productId: number, quantity: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.warning('Please login to add items to cart');
      return;
    }

    setAddToCartLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: productId,
          quantity
        })
      });

      const result = await response.json();

      if (result.success) {
        message.success('Product added to cart successfully');
        setModalVisible(false);
        setQuantity(1);
      } else {
        message.error(result.message || 'Failed to add product to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      message.error('Failed to add product to cart');
    } finally {
      setAddToCartLoading(false);
    }
  };

  const showProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setModalVisible(true);
    setQuantity(1);
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'red';
      case 'medium': return 'orange';
      case 'good': return 'green';
      default: return 'default';
    }
  };

  const getCategoryDisplayName = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Custom carousel arrows
  const CustomArrow = ({ direction, onClick }: { direction: 'left' | 'right', onClick?: () => void }) => (
    <Button
      type="text"
      icon={direction === 'left' ? <LeftOutlined /> : <RightOutlined />}
      onClick={onClick}
      style={{
        position: 'absolute',
        top: '50%',
        [direction]: 10,
        transform: 'translateY(-50%)',
        zIndex: 2,
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    />
  );

  return (
    <div className="w-full py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Title level={1} className="text-amber-900 mb-4">
            Product Catalog
          </Title>
          <Paragraph className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our comprehensive range of clay products, from raw materials to finished pottery. 
            Quality craftsmanship for all your ceramic needs.
          </Paragraph>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8} md={6}>
              <Input.Search
                placeholder="Search products..."
                allowClear
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={8} md={4}>
              <Select
                placeholder="Category"
                style={{ width: '100%' }}
                allowClear
                value={categoryFilter || undefined}
                onChange={handleCategoryChange}
              >
                {categories.map(category => (
                  <Option key={category} value={category}>
                    {getCategoryDisplayName(category)}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={4} md={3}>
              <InputNumber
                placeholder="Min Price"
                style={{ width: '100%' }}
                min={0}
                value={priceRange.min}
                onChange={(value) => handlePriceRangeChange('min', value)}
              />
            </Col>
            <Col xs={12} sm={4} md={3}>
              <InputNumber
                placeholder="Max Price"
                style={{ width: '100%' }}
                min={0}
                value={priceRange.max}
                onChange={(value) => handlePriceRangeChange('max', value)}
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Sort by"
                style={{ width: '100%' }}
                value={`${sortBy}-${sortOrder}`}
                onChange={handleSortChange}
              >
                <Option value="name-ASC">Name (A-Z)</Option>
                <Option value="name-DESC">Name (Z-A)</Option>
                <Option value="price-ASC">Price (Low-High)</Option>
                <Option value="price-DESC">Price (High-Low)</Option>
                <Option value="stock_quantity-DESC">Stock (High-Low)</Option>
                <Option value="created_at-DESC">Newest First</Option>
                <Option value="created_at-ASC">Oldest First</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Switch
                    checked={showOutOfStock}
                    onChange={setShowOutOfStock}
                    size="small"
                  />
                  <span style={{ fontSize: '12px' }}>Show out of stock</span>
                </div>
              </Space>
            </Col>
          </Row>
          <Divider style={{ margin: '16px 0 8px 0' }} />
          <Row gutter={[16, 8]} align="middle">
            <Col xs={24} sm={12}>
              <Space>
                <Button 
                  icon={<FilterOutlined />} 
                  onClick={clearFilters}
                  size="small"
                >
                  Clear Filters
                </Button>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  {pagination.total_items} products found
                </Text>
              </Space>
            </Col>
            <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Page {pagination.current_page} of {pagination.total_pages}
              </Text>
            </Col>
          </Row>
        </Card>

        {/* Products Grid */}
        <Spin spinning={loading}>
          <Row gutter={[24, 24]}>
            {products.length === 0 && !loading ? (
              <Col span={24}>
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <Text type="secondary" style={{ fontSize: '16px' }}>
                    No products found matching your criteria
                  </Text>
                </div>
              </Col>
            ) : (
              products.map((product) => (
                <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                  <Card
                    hoverable
                    className={product.stock_quantity === 0 ? 'opacity-75' : ''}
                    cover={
                      <div style={{ position: 'relative', height: '200px' }}>
                        {product.images && product.images.length > 1 ? (
                          <Carousel
                            arrows
                            prevArrow={<CustomArrow direction="left" />}
                            nextArrow={<CustomArrow direction="right" />}
                            dots={{ className: 'custom-dots' }}
                            style={{ height: '200px' }}
                          >
                            {product.images.map((image, index) => (
                              <div key={index}>
                                <img
                                  alt={image.image_alt || product.name}
                                  src={getImageUrl(image.image_url)}
                                  style={{ 
                                    height: '200px', 
                                    width: '100%', 
                                    objectFit: 'cover' 
                                  }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop';
                                  }}
                                />
                              </div>
                            ))}
                          </Carousel>
                        ) : (
                          <img
                            alt={product.name}
                            src={getImageUrl(product.primary_image)}
                            style={{ height: '200px', objectFit: 'cover', width: '100%' }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop';
                            }}
                          />
                        )}
                        
                        {/* Overlay for out of stock */}
                        {product.stock_quantity === 0 && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Text style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>
                              OUT OF STOCK
                            </Text>
                          </div>
                        )}
                        
                        {/* Low stock badge */}
                        {product.stock_quantity <= product.minimum_stock && product.stock_quantity > 0 && (
                          <Tag color="red" style={{ position: 'absolute', top: 8, right: 8 }}>
                            Low Stock
                          </Tag>
                        )}
                        
                        {/* Images count badge */}
                        {product.images && product.images.length > 1 && (
                          <Tag 
                            color="blue" 
                            style={{ 
                              position: 'absolute', 
                              top: 8, 
                              left: 8,
                              fontSize: '10px'
                            }}
                          >
                            {product.images.length} Photos
                          </Tag>
                        )}
                      </div>
                    }
                    actions={[
                      <Button
                        key="view"
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => showProductDetails(product)}
                        size="small"
                      >
                        Details
                      </Button>,
                      <Button
                        key="add"
                        type="text"
                        icon={<ShoppingCartOutlined />}
                        onClick={() => showProductDetails(product)}
                        disabled={product.stock_quantity === 0}
                        size="small"
                      >
                        {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                    ]}
                  >
                    <Card.Meta
                      title={
                        <div>
                          <Text strong className="text-amber-900" style={{ fontSize: '16px' }}>
                            {product.name}
                          </Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            SKU: {product.sku}
                          </Text>
                        </div>
                      }
                      description={
                        <div>
                          <Paragraph 
                            ellipsis={{ rows: 2 }} 
                            className="text-gray-600 mb-2"
                            style={{ fontSize: '13px', minHeight: '40px' }}
                          >
                            {product.description}
                          </Paragraph>
                          <Space direction="vertical" size="small" className="w-full">
                            <div className="flex justify-between items-center">
                              <Text strong className="text-xl text-amber-700">
                                Rs. {product.price.toLocaleString()}
                              </Text>
                              <Text className="text-sm text-gray-500">
                                per {product.unit}
                              </Text>
                            </div>
                            <div className="flex justify-between items-center">
                              <Tag 
                                color={product.stock_quantity === 0 ? 'red' : getStockStatusColor(product.stock_status)}
                                style={{ fontSize: '11px' }}
                              >
                                {product.stock_quantity === 0 ? 'Out of Stock' : `${product.stock_quantity} in stock`}
                              </Tag>
                              <Tag color="blue" style={{ fontSize: '11px' }}>
                                {getCategoryDisplayName(product.category)}
                              </Tag>
                            </div>
                          </Space>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))
            )}
          </Row>
        </Spin>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="text-center mt-8">
            <Pagination
              current={pagination.current_page}
              total={pagination.total_items}
              pageSize={pagination.items_per_page}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) => 
                `${range[0]}-${range[1]} of ${total} products`
              }
              onChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}

        {/* Enhanced Product Details Modal with Image Carousel */}
        <Modal
          title={
            <div>
              <Text strong style={{ fontSize: '18px', color: '#92400e' }}>
                {selectedProduct?.name}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '14px' }}>
                SKU: {selectedProduct?.sku}
              </Text>
            </div>
          }
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setModalVisible(false)}>
              Close
            </Button>,
            selectedProduct && selectedProduct.stock_quantity > 0 ? (
              <Button
                key="add"
                type="primary"
                icon={<PlusOutlined />}
                loading={addToCartLoading}
                onClick={() => selectedProduct && addToCart(selectedProduct.id, quantity)}
                style={{ backgroundColor: '#92400e', borderColor: '#92400e' }}
              >
                Add {quantity} to Cart
              </Button>
            ) : (
              <Button key="disabled" disabled>
                Out of Stock
              </Button>
            )
          ]}
          width={1000}
        >
          {selectedProduct && (
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <div style={{ position: 'relative' }}>
                  {selectedProduct.images && selectedProduct.images.length > 1 ? (
                    <Carousel
                      arrows
                      prevArrow={<CustomArrow direction="left" />}
                      nextArrow={<CustomArrow direction="right" />}
                      dots={{ className: 'custom-dots-modal' }}
                    >
                      {selectedProduct.images.map((image, index) => (
                        <div key={index}>
                          <img
                            src={getImageUrl(image.image_url)}
                            alt={image.image_alt || selectedProduct.name}
                            style={{ 
                              width: '100%', 
                              borderRadius: 8, 
                              maxHeight: '400px', 
                              objectFit: 'cover' 
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=400&fit=crop';
                            }}
                          />
                        </div>
                      ))}
                    </Carousel>
                  ) : (
                    <img
                      src={getImageUrl(selectedProduct.primary_image)}
                      alt={selectedProduct.name}
                      style={{ 
                        width: '100%', 
                        borderRadius: 8, 
                        maxHeight: '400px', 
                        objectFit: 'cover' 
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=400&fit=crop';
                      }}
                    />
                  )}
                  
                  {selectedProduct.stock_quantity === 0 && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8
                    }}>
                      <Text style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                        OUT OF STOCK
                      </Text>
                    </div>
                  )}
                </div>
              </Col>
              <Col xs={24} md={12}>
                <Space direction="vertical" size="middle" className="w-full">
                  <div>
                    <Title level={4} style={{ color: '#92400e', marginBottom: '8px' }}>
                      {selectedProduct.name}
                    </Title>
                    <Paragraph style={{ color: '#6b7280', fontSize: '15px', lineHeight: '1.6' }}>
                      {selectedProduct.description}
                    </Paragraph>
                  </div>

                  <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                    <Text strong style={{ fontSize: '28px', color: '#92400e' }}>
                      Rs. {selectedProduct.price.toLocaleString()}
                    </Text>
                    <Text style={{ color: '#6b7280', marginLeft: '8px', fontSize: '16px' }}>
                      per {selectedProduct.unit}
                    </Text>
                  </div>

                  <Space wrap size="small">
                    <Tag color="blue" style={{ fontSize: '12px', padding: '4px 8px' }}>
                      {getCategoryDisplayName(selectedProduct.category)}
                    </Tag>
                    <Tag 
                      color={selectedProduct.stock_quantity === 0 ? 'red' : getStockStatusColor(selectedProduct.stock_status)}
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      {selectedProduct.stock_quantity === 0 ? 'Out of Stock' : `${selectedProduct.stock_quantity} in stock`}
                    </Tag>
                    {selectedProduct.is_custom_order && (
                      <Tag color="purple" style={{ fontSize: '12px', padding: '4px 8px' }}>
                        Custom Order Available
                      </Tag>
                    )}
                    {selectedProduct.images && selectedProduct.images.length > 1 && (
                      <Tag color="green" style={{ fontSize: '12px', padding: '4px 8px' }}>
                        {selectedProduct.images.length} Images
                      </Tag>
                    )}
                  </Space>

                  {selectedProduct.stock_quantity > 0 && (
                    <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                      <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                        Select Quantity:
                      </Text>
                      <InputNumber
                        min={1}
                        max={selectedProduct.stock_quantity}
                        value={quantity}
                        onChange={(value) => setQuantity(value || 1)}
                        style={{ width: '120px' }}
                        size="large"
                      />
                      <Text type="secondary" style={{ marginLeft: '12px' }}>
                        (Max: {selectedProduct.stock_quantity})
                      </Text>
                    </div>
                  )}

                  {/* Specifications */}
                  {(selectedProduct.clay_type || selectedProduct.firing_temperature || selectedProduct.dimensions || selectedProduct.weight_kg || selectedProduct.production_time_days) && (
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                      <Title level={5} style={{ color: '#92400e', marginBottom: '12px' }}>
                        Product Specifications
                      </Title>
                      <Row gutter={[16, 8]}>
                        {selectedProduct.clay_type && (
                          <Col span={24}>
                            <Text><strong>Clay Type:</strong> <span style={{ color: '#6b7280' }}>{selectedProduct.clay_type}</span></Text>
                          </Col>
                        )}
                        {selectedProduct.firing_temperature && (
                          <Col span={24}>
                            <Text><strong>Firing Temperature:</strong> <span style={{ color: '#6b7280' }}>{selectedProduct.firing_temperature}°C</span></Text>
                          </Col>
                        )}
                        {selectedProduct.dimensions && (
                          <Col span={24}>
                            <Text><strong>Dimensions:</strong> <span style={{ color: '#6b7280' }}>{selectedProduct.dimensions}</span></Text>
                          </Col>
                        )}
                        {selectedProduct.weight_kg && (
                          <Col span={24}>
                            <Text><strong>Weight:</strong> <span style={{ color: '#6b7280' }}>{selectedProduct.weight_kg} kg</span></Text>
                          </Col>
                        )}
                        {selectedProduct.production_time_days && (
                          <Col span={24}>
                            <Text><strong>Production Time:</strong> <span style={{ color: '#6b7280' }}>{selectedProduct.production_time_days} days</span></Text>
                          </Col>
                        )}
                        {selectedProduct.glaze_type && (
                          <Col span={24}>
                            <Text><strong>Glaze Type:</strong> <span style={{ color: '#6b7280' }}>{selectedProduct.glaze_type}</span></Text>
                          </Col>
                        )}
                      </Row>
                    </div>
                  )}

                  {/* Stock Information */}
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                    <Title level={5} style={{ color: '#92400e', marginBottom: '12px' }}>
                      Stock Information
                    </Title>
                    <Row gutter={[16, 8]}>
                      <Col span={12}>
                        <Text><strong>Available:</strong> <span style={{ color: selectedProduct.stock_quantity > 0 ? '#059669' : '#dc2626' }}>{selectedProduct.stock_quantity}</span></Text>
                      </Col>
                      <Col span={12}>
                        <Text><strong>Min. Stock:</strong> <span style={{ color: '#6b7280' }}>{selectedProduct.minimum_stock}</span></Text>
                      </Col>
                    </Row>
                  </div>
                </Space>
              </Col>
            </Row>
          )}
        </Modal>
      </div>
      
      {/* Custom CSS for carousel styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-dots .slick-dots {
            bottom: 10px;
          }
          .custom-dots .slick-dots li button {
            background: rgba(255,255,255,0.7);
            border-radius: 50%;
          }
          .custom-dots .slick-dots li.slick-active button {
            background: #92400e;
          }
          .custom-dots-modal .slick-dots {
            bottom: 10px;
          }
          .custom-dots-modal .slick-dots li button {
            background: rgba(146,64,14,0.5);
            border-radius: 50%;
          }
          .custom-dots-modal .slick-dots li.slick-active button {
            background: #92400e;
          }
        `
      }} />
    </div>
  );
};
