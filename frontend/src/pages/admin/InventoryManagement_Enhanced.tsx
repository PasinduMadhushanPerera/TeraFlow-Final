import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Switch, 
  Input, 
  Select, 
  message,
  Card,
  Row,
  Col,
  Statistic,
  Popconfirm,
  Modal,
  Form,
  InputNumber,
  Progress,
  Upload,
  Image,
  Carousel
} from 'antd';
import {
  ShoppingOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  WarningOutlined,
  UploadOutlined,
  EyeOutlined,
  DeleteFilled
} from '@ant-design/icons';

const { Title } = Typography;
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
  is_active: boolean;
  image_url?: string;
  gallery_images?: string[];
  created_at: string;
}

interface ProductForm {
  name: string;
  description: string;
  category: string;
  price: number;
  stock_quantity: number;
  minimum_stock: number;
  unit: string;
  sku: string;
  is_active: boolean;
}

export const EnhancedInventoryManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editForm] = Form.useForm();
  const [createForm] = Form.useForm();
  
  // Image handling state
  const [mainImageFileList, setMainImageFileList] = useState<any[]>([]);
  const [galleryFileList, setGalleryFileList] = useState<any[]>([]);
  const [editMainImageFileList, setEditMainImageFileList] = useState<any[]>([]);
  const [editGalleryFileList, setEditGalleryFileList] = useState<any[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const categories = [
    { value: 'raw_materials', label: 'Raw Materials' },
    { value: 'finished_products', label: 'Finished Products' },
    { value: 'tools', label: 'Tools' },
    { value: 'packaging', label: 'Packaging' },
    { value: 'chemicals', label: 'Chemicals' }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, searchText, categoryFilter, stockFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('terraflow_token');
      if (!token) {
        message.error('Authentication required');
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/admin/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        // Parse gallery_images JSON field
        const productsWithParsedImages = data.data.map((product: any) => ({
          ...product,
          gallery_images: product.gallery_images ? 
            (typeof product.gallery_images === 'string' ? 
              JSON.parse(product.gallery_images) : 
              product.gallery_images
            ) : []
        }));
        setProducts(productsWithParsedImages);
      } else {
        message.error(data.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      message.error('Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    if (stockFilter !== 'all') {
      if (stockFilter === 'low') {
        filtered = filtered.filter(product => product.stock_quantity <= product.minimum_stock);
      } else if (stockFilter === 'out') {
        filtered = filtered.filter(product => product.stock_quantity === 0);
      } else if (stockFilter === 'good') {
        filtered = filtered.filter(product => product.stock_quantity > product.minimum_stock);
      }
    }

    if (searchText) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchText.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchText.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    editForm.setFieldsValue({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      stock_quantity: product.stock_quantity,
      minimum_stock: product.minimum_stock,
      unit: product.unit,
      sku: product.sku,
      is_active: product.is_active
    });
    
    // Load existing images
    const existingMainImage: any[] = [];
    const existingGalleryImages: any[] = [];
    
    if (product.image_url) {
      existingMainImage.push({
        uid: 'main-existing',
        name: 'main-image',
        status: 'done',
        url: `http://localhost:5000${product.image_url}`,
        response: { url: product.image_url }
      });
    }
    
    if (product.gallery_images && product.gallery_images.length > 0) {
      product.gallery_images.forEach((imageUrl, index) => {
        existingGalleryImages.push({
          uid: `gallery-existing-${index}`,
          name: `gallery-image-${index}`,
          status: 'done',
          url: `http://localhost:5000${imageUrl}`,
          response: { url: imageUrl }
        });
      });
    }
    
    setEditMainImageFileList(existingMainImage);
    setEditGalleryFileList(existingGalleryImages);
    setEditModalVisible(true);
  };

  const handleCreateProduct = () => {
    createForm.resetFields();
    resetImageUploads();
    setCreateModalVisible(true);
  };

  const handleUpdateProduct = async (values: ProductForm) => {
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token || !selectedProduct) return;

      const formData = new FormData();
      
      // Append form values with proper boolean handling
      Object.keys(values).forEach(key => {
        const value = (values as any)[key];
        if (value !== undefined && value !== null) {
          // Convert boolean values to string for FormData
          if (typeof value === 'boolean') {
            formData.append(key, value.toString());
          } else {
            formData.append(key, value);
          }
        }
      });

      // Handle main image
      const newMainImage = editMainImageFileList.find(file => file.originFileObj);
      if (newMainImage) {
        formData.append('image', newMainImage.originFileObj);
      }

      // Handle gallery images
      const newGalleryImages = editGalleryFileList.filter(file => file.originFileObj);
      newGalleryImages.forEach((file) => {
        formData.append('gallery_images', file.originFileObj);
      });

      // Keep existing images that weren't replaced
      const existingMainImageUrl = editMainImageFileList.find(file => file.response?.url && !file.originFileObj)?.response?.url;
      if (existingMainImageUrl && !newMainImage) {
        formData.append('existing_main_image', existingMainImageUrl);
      }

      const existingGalleryUrls = editGalleryFileList
        .filter(file => file.response?.url && !file.originFileObj)
        .map(file => file.response.url);
      if (existingGalleryUrls.length > 0) {
        formData.append('existing_gallery_images', JSON.stringify(existingGalleryUrls));
      }

      const response = await fetch(`http://localhost:5000/api/admin/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        message.success('Product updated successfully');
        setEditModalVisible(false);
        resetEditImageUploads();
        fetchProducts();
      } else {
        message.error(data.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      message.error('Error updating product');
    }
  };

  const handleCreateNewProduct = async (values: ProductForm) => {
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token) return;

      const formData = new FormData();
      
      // Append form values with proper boolean handling
      Object.keys(values).forEach(key => {
        const value = (values as any)[key];
        if (value !== undefined && value !== null) {
          // Convert boolean values to string for FormData
          if (typeof value === 'boolean') {
            formData.append(key, value.toString());
          } else {
            formData.append(key, value);
          }
        }
      });

      // Append main image
      if (mainImageFileList.length > 0 && mainImageFileList[0].originFileObj) {
        formData.append('image', mainImageFileList[0].originFileObj);
      }

      // Append gallery images
      galleryFileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append('gallery_images', file.originFileObj);
        }
      });

      const response = await fetch('http://localhost:5000/api/admin/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        message.success('Product created successfully');
        setCreateModalVisible(false);
        createForm.resetFields();
        resetImageUploads();
        fetchProducts();
      } else {
        message.error(data.message || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      message.error('Error creating product');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token) {
        message.error('Authentication required');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        message.success('Product deleted successfully');
        fetchProducts();
      } else {
        message.error(data.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      message.error('Error deleting product');
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) return { status: 'Out of Stock', color: 'red' };
    if (product.stock_quantity <= product.minimum_stock) return { status: 'Low Stock', color: 'orange' };
    return { status: 'In Stock', color: 'green' };
  };

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'raw_materials': 'blue',
      'finished_products': 'green',
      'tools': 'purple',
      'packaging': 'orange',
      'chemicals': 'red'
    };
    return colorMap[category] || 'default';
  };

  const columns = [
    {
      title: 'Product',
      key: 'product',
      render: (_: any, record: Product) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            SKU: {record.sku || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      title: 'Image',
      key: 'image',
      width: 80,
      render: (_: any, record: Product) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {record.image_url ? (
            <Image
              width={50}
              height={50}
              src={`http://localhost:5000${record.image_url}`}
              alt={record.name}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              preview={true}
            />
          ) : (
            <div 
              style={{ 
                width: 50, 
                height: 50, 
                backgroundColor: '#f5f5f5', 
                borderRadius: 4, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '12px',
                color: '#999'
              }}
            >
              No Image
            </div>
          )}
          {record.gallery_images && record.gallery_images.length > 0 && (
            <div style={{ fontSize: '10px', color: '#1890ff' }}>
              +{record.gallery_images.length}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color={getCategoryColor(category)}>
          {category.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `Rs. ${Number(price).toFixed(2)}`,
    },
    {
      title: 'Stock',
      key: 'stock',
      render: (_: any, record: Product) => {
        const stockStatus = getStockStatus(record);
        const percentage = record.minimum_stock > 0 
          ? Math.min((record.stock_quantity / (record.minimum_stock * 3)) * 100, 100)
          : 100;

        return (
          <div style={{ minWidth: 120 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 500 }}>{record.stock_quantity}</span>
              <span style={{ fontSize: '12px', color: '#666' }}>
                Min: {record.minimum_stock}
              </span>
            </div>
            <Progress
              percent={percentage}
              size="small"
              status={stockStatus.color === 'red' ? 'exception' : 'normal'}
              strokeColor={stockStatus.color}
              showInfo={false}
            />
            <Tag 
              color={stockStatus.color} 
              style={{ marginTop: 4 }}
            >
              {stockStatus.status}
            </Tag>
          </div>
        );
      },
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Product) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditProduct(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this product?"
            description="This action cannot be undone."
            onConfirm={() => handleDeleteProduct(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const stats = {
    total: products.length,
    lowStock: products.filter(p => p.stock_quantity <= p.minimum_stock).length,
    outOfStock: products.filter(p => p.stock_quantity === 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0),
  };

  // Image handling functions
  const getBase64 = (file: any): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const beforeUpload = (file: any) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png' || file.type === 'image/gif' || file.type === 'image/webp';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG/GIF/WebP files!');
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
      return false;
    }
    return false; // Prevent auto upload
  };

  const handlePreview = async (file: any) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewVisible(true);
    setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
  };

  const resetImageUploads = () => {
    setMainImageFileList([]);
    setGalleryFileList([]);
  };

  const resetEditImageUploads = () => {
    setEditMainImageFileList([]);
    setEditGalleryFileList([]);
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <Title level={2} className="text-amber-900 mb-2">
          Inventory Management
        </Title>
        <p className="text-gray-600 mb-4">
          Manage product inventory, track stock levels, and monitor product performance.
        </p>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Products"
              value={stats.total}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Low Stock"
              value={stats.lowStock}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Out of Stock"
              value={stats.outOfStock}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Value"
              value={stats.totalValue}
              prefix="Rs."
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Controls */}
      <Card className="mb-6">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Search
              placeholder="Search products..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: '100%' }}
              placeholder="Filter by category"
            >
              <Option value="all">All Categories</Option>
              {categories.map(cat => (
                <Option key={cat.value} value={cat.value}>{cat.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              value={stockFilter}
              onChange={setStockFilter}
              style={{ width: '100%' }}
              placeholder="Filter by stock"
            >
              <Option value="all">All Stock</Option>
              <Option value="good">Good Stock</Option>
              <Option value="low">Low Stock</Option>
              <Option value="out">Out of Stock</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4} md={10} style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchProducts} 
                loading={loading}
              >
                Refresh
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleCreateProduct}
                style={{ backgroundColor: '#8B4513', borderColor: '#8B4513' }}
              >
                Add Product
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Products Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} products`,
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Edit Product Modal */}
      <Modal
        title="Edit Product"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateProduct}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Product Name"
                rules={[{ required: true, message: 'Please enter product name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sku"
                label="SKU"
                rules={[{ required: true, message: 'Please enter SKU' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            
            {/* Image Upload Section for Edit */}
            <Col span={24}>
              <div style={{ marginBottom: 16 }}>
                <Typography.Title level={5}>Product Images</Typography.Title>
              </div>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Main Product Image"
                help="Upload a main product image (Max 5MB, JPG/PNG/GIF/WebP)"
              >
                <Upload
                  listType="picture-card"
                  fileList={editMainImageFileList}
                  onPreview={handlePreview}
                  beforeUpload={beforeUpload}
                  onChange={({ fileList }) => setEditMainImageFileList(fileList)}
                  maxCount={1}
                >
                  {editMainImageFileList.length >= 1 ? null : (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Gallery Images"
                help="Upload additional product images (Max 9 images, 5MB each)"
              >
                <Upload
                  listType="picture-card"
                  fileList={editGalleryFileList}
                  onPreview={handlePreview}
                  beforeUpload={beforeUpload}
                  onChange={({ fileList }) => setEditGalleryFileList(fileList)}
                  maxCount={9}
                  multiple
                >
                  {editGalleryFileList.length >= 9 ? null : (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Form.Item
                name="description"
                label="Description"
                rules={[{ required: true, message: 'Please enter description' }]}
              >
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select>
                  {categories.map(cat => (
                    <Option key={cat.value} value={cat.value}>{cat.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unit"
                label="Unit"
                rules={[{ required: true, message: 'Please enter unit' }]}
              >
                <Input placeholder="e.g., kg, pcs, ltr" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="price"
                label="Price (Rs.)"
                rules={[{ required: true, message: 'Please enter price' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="stock_quantity"
                label="Stock Quantity"
                rules={[{ required: true, message: 'Please enter stock quantity' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="minimum_stock"
                label="Minimum Stock"
                rules={[{ required: true, message: 'Please enter minimum stock' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="Status"
                valuePropName="checked"
              >
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setEditModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Update Product
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Create Product Modal */}
      <Modal
        title="Create New Product"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateNewProduct}
          initialValues={{ is_active: true }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Product Name"
                rules={[{ required: true, message: 'Please enter product name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sku"
                label="SKU"
                rules={[{ required: true, message: 'Please enter SKU' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            
            {/* Image Upload Section */}
            <Col span={24}>
              <div style={{ marginBottom: 16 }}>
                <Typography.Title level={5}>Product Images</Typography.Title>
              </div>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Main Product Image"
                help="Upload a main product image (Max 5MB, JPG/PNG/GIF/WebP)"
              >
                <Upload
                  listType="picture-card"
                  fileList={mainImageFileList}
                  onPreview={handlePreview}
                  beforeUpload={beforeUpload}
                  onChange={({ fileList }) => setMainImageFileList(fileList)}
                  maxCount={1}
                >
                  {mainImageFileList.length >= 1 ? null : (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Gallery Images"
                help="Upload additional product images (Max 9 images, 5MB each)"
              >
                <Upload
                  listType="picture-card"
                  fileList={galleryFileList}
                  onPreview={handlePreview}
                  beforeUpload={beforeUpload}
                  onChange={({ fileList }) => setGalleryFileList(fileList)}
                  maxCount={9}
                  multiple
                >
                  {galleryFileList.length >= 9 ? null : (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Form.Item
                name="description"
                label="Description"
                rules={[{ required: true, message: 'Please enter description' }]}
              >
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select>
                  {categories.map(cat => (
                    <Option key={cat.value} value={cat.value}>{cat.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unit"
                label="Unit"
                rules={[{ required: true, message: 'Please enter unit' }]}
              >
                <Input placeholder="e.g., kg, pcs, ltr" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="price"
                label="Price (Rs.)"
                rules={[{ required: true, message: 'Please enter price' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="stock_quantity"
                label="Initial Stock"
                rules={[{ required: true, message: 'Please enter initial stock' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="minimum_stock"
                label="Minimum Stock"
                rules={[{ required: true, message: 'Please enter minimum stock' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="Status"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Create Product
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <Image alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>
  );
};

export default EnhancedInventoryManagement;
