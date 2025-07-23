import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Typography, Select, Input, Button, Tag, Space, 
  Pagination, Spin, message, Modal, InputNumber 
} from 'antd';
import { 
  FilterOutlined, ShoppingCartOutlined, 
  EyeOutlined, PlusOutlined 
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
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
  image_url?: string;
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
    items_per_page: 12
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [addToCartLoading, setAddToCartLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [currentPage, searchTerm, categoryFilter, priceRange]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

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

  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) {
      return 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop';
    }
    
    // If it's already a full URL (starts with http), return as is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // If it's a relative path, construct full URL with backend domain
    return `http://localhost:5000${imageUrl}`;
  };

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
            <Col xs={24} sm={12} md={8}>
              <Space>
                <Button 
                  icon={<FilterOutlined />} 
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
                <Text type="secondary">
                  {pagination.total_items} products found
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Products Grid */}
        <Spin spinning={loading}>
          <Row gutter={[24, 24]}>
            {products.map((product) => (
              <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                <Card
                  hoverable
                  cover={
                    <img
                      alt={product.name}
                      src={getImageUrl(product.image_url)}
                      style={{ height: 200, objectFit: 'cover' }}
                    />
                  }
                  actions={[
                    <Button
                      key="view"
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => showProductDetails(product)}
                    >
                      Details
                    </Button>,
                    <Button
                      key="add"
                      type="text"
                      icon={<ShoppingCartOutlined />}
                      onClick={() => showProductDetails(product)}
                      disabled={product.stock_quantity === 0}
                    >
                      Add to Cart
                    </Button>
                  ]}
                >
                  <Card.Meta
                    title={
                      <div>
                        <Text strong className="text-amber-900">
                          {product.name}
                        </Text>
                        <br />
                        <Text type="secondary" className="text-sm">
                          SKU: {product.sku}
                        </Text>
                      </div>
                    }
                    description={
                      <div>
                        <Paragraph ellipsis={{ rows: 2 }} className="text-gray-600 mb-2">
                          {product.description}
                        </Paragraph>
                        <Space direction="vertical" size="small" className="w-full">
                          <div className="flex justify-between items-center">
                            <Text strong className="text-xl text-amber-700">
                              Rs. {product.price}
                            </Text>
                            <Text className="text-sm text-gray-500">
                              per {product.unit}
                            </Text>
                          </div>
                          <div className="flex justify-between items-center">
                            <Tag color={getStockStatusColor(product.stock_status)}>
                              {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                            </Tag>
                            <Tag color="blue">
                              {getCategoryDisplayName(product.category)}
                            </Tag>
                          </div>
                        </Space>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
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

        {/* Product Details Modal */}
        <Modal
          title={selectedProduct?.name}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setModalVisible(false)}>
              Close
            </Button>,
            selectedProduct && selectedProduct.stock_quantity > 0 && (
              <Button
                key="add"
                type="primary"
                icon={<PlusOutlined />}
                loading={addToCartLoading}
                onClick={() => selectedProduct && addToCart(selectedProduct.id, quantity)}
                className="bg-amber-700 hover:bg-amber-800"
              >
                Add to Cart
              </Button>
            )
          ]}
          width={800}
        >
          {selectedProduct && (
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <img
                  src={getImageUrl(selectedProduct.image_url)}
                  alt={selectedProduct.name}
                  style={{ width: '100%', borderRadius: 8 }}
                />
              </Col>
              <Col xs={24} md={12}>
                <Space direction="vertical" size="middle" className="w-full">
                  <div>
                    <Title level={4} className="text-amber-900 mb-2">
                      {selectedProduct.name}
                    </Title>
                    <Text type="secondary">SKU: {selectedProduct.sku}</Text>
                  </div>
                  
                  <Paragraph className="text-gray-600">
                    {selectedProduct.description}
                  </Paragraph>

                  <div>
                    <Text strong className="text-2xl text-amber-700">
                      Rs. {selectedProduct.price}
                    </Text>
                    <Text className="text-gray-500 ml-2">
                      per {selectedProduct.unit}
                    </Text>
                  </div>

                  <Space wrap>
                    <Tag color="blue">
                      {getCategoryDisplayName(selectedProduct.category)}
                    </Tag>
                    <Tag color={getStockStatusColor(selectedProduct.stock_status)}>
                      {selectedProduct.stock_quantity > 0 ? `${selectedProduct.stock_quantity} in stock` : 'Out of stock'}
                    </Tag>
                    {selectedProduct.is_custom_order && (
                      <Tag color="purple">Custom Order</Tag>
                    )}
                  </Space>

                  {selectedProduct.stock_quantity > 0 && (
                    <div>
                      <Text strong className="block mb-2">Quantity:</Text>
                      <InputNumber
                        min={1}
                        max={selectedProduct.stock_quantity}
                        value={quantity}
                        onChange={(value) => setQuantity(value || 1)}
                        style={{ width: 120 }}
                      />
                    </div>
                  )}

                  {/* Additional product details */}
                  {(selectedProduct.clay_type || selectedProduct.firing_temperature || selectedProduct.dimensions) && (
                    <div>
                      <Title level={5} className="text-amber-800 mb-2">Specifications:</Title>
                      <Space direction="vertical" size="small">
                        {selectedProduct.clay_type && (
                          <Text><strong>Clay Type:</strong> {selectedProduct.clay_type}</Text>
                        )}
                        {selectedProduct.firing_temperature && (
                          <Text><strong>Firing Temperature:</strong> {selectedProduct.firing_temperature}°C</Text>
                        )}
                        {selectedProduct.dimensions && (
                          <Text><strong>Dimensions:</strong> {selectedProduct.dimensions}</Text>
                        )}
                        {selectedProduct.weight_kg && (
                          <Text><strong>Weight:</strong> {selectedProduct.weight_kg}kg</Text>
                        )}
                        {selectedProduct.production_time_days && (
                          <Text><strong>Production Time:</strong> {selectedProduct.production_time_days} days</Text>
                        )}
                      </Space>
                    </div>
                  )}
                </Space>
              </Col>
            </Row>
          )}
        </Modal>
      </div>
    </div>
  );
};
