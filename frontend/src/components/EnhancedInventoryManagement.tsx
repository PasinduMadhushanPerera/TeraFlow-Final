import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, Statistic, Row, Col, Alert, Pagination, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, StockOutlined, WarningOutlined } from '@ant-design/icons';

const { Option } = Select;
const { confirm } = Modal;

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  stock_quantity: number;
  minimum_stock: number;
  maximum_stock: number;
  unit: string;
  price: number;
  cost_price?: number;
  is_active: boolean;
}

interface InventoryStats {
  total_products: number;
  low_stock_items: number;
  out_of_stock: number;
  total_value: number;
}

const EnhancedInventoryManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState<InventoryStats>({
    total_products: 0,
    low_stock_items: 0,
    out_of_stock: 0,
    total_value: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    search: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [currentPage, pageSize, filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...filters
      });

      const response = await fetch(`http://localhost:5000/api/products?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data.products);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/inventory/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue(product);
    setModalVisible(true);
  };

  const handleDeleteProduct = (product: Product) => {
    confirm({
      title: 'Are you sure you want to delete this product?',
      icon: <ExclamationCircleOutlined />,
      content: `This will permanently delete "${product.name}" from inventory.`,
      onOk: async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/products/${product.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            fetchProducts();
            fetchStats();
          }
        } catch (error) {
          console.error('Failed to delete product:', error);
        }
      }
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      const url = editingProduct 
        ? `http://localhost:5000/api/products/${editingProduct.id}`
        : 'http://localhost:5000/api/products';
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(values)
      });
      
      if (response.ok) {
        setModalVisible(false);
        fetchProducts();
        fetchStats();
        form.resetFields();
      }
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) {
      return <Tag color="red">Out of Stock</Tag>;
    } else if (product.stock_quantity <= product.minimum_stock) {
      return <Tag color="orange">Low Stock</Tag>;
    } else if (product.stock_quantity >= product.maximum_stock) {
      return <Tag color="purple">Overstock</Tag>;
    } else {
      return <Tag color="green">In Stock</Tag>;
    }
  };

  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 100,
    },
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (category: string) => (
        <Tag>{category.replace('_', ' ').toUpperCase()}</Tag>
      )
    },
    {
      title: 'Stock',
      key: 'stock',
      width: 120,
      render: (record: Product) => (
        <div>
          <div>{record.stock_quantity} {record.unit}</div>
          {getStockStatus(record)}
        </div>
      )
    },
    {
      title: 'Stock Levels',
      key: 'stockLevels',
      width: 150,
      render: (record: Product) => (
        <div style={{ fontSize: '12px' }}>
          <div>Min: {record.minimum_stock}</div>
          <div>Max: {record.maximum_stock}</div>
        </div>
      )
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => `Rs. ${price.toFixed(2)}`
    },
    {
      title: 'Value',
      key: 'value',
      width: 100,
      render: (record: Product) => (
        `Rs. ${(record.stock_quantity * record.price).toFixed(2)}`
      )
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (record: Product) => (
        <Space size="small">
          <Tooltip title="Edit Product">
            <Button 
              type="primary" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleEditProduct(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Product">
            <Button 
              danger 
              size="small" 
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteProduct(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const lowStockItems = products.filter(p => p.stock_quantity <= p.minimum_stock && p.stock_quantity > 0);
  const outOfStockItems = products.filter(p => p.stock_quantity === 0);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          <StockOutlined /> Enhanced Inventory Management
        </h1>
        
        {/* Inventory Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Total Products"
                value={stats.total_products}
                prefix={<StockOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Low Stock Items"
                value={stats.low_stock_items}
                valueStyle={{ color: '#faad14' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Out of Stock"
                value={stats.out_of_stock}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Total Inventory Value"
                value={stats.total_value}
                precision={2}
                prefix="Rs."
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Alerts */}
        {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
          <Space direction="vertical" style={{ width: '100%', marginBottom: '16px' }}>
            {outOfStockItems.length > 0 && (
              <Alert
                message={`${outOfStockItems.length} products are out of stock`}
                description={`Items: ${outOfStockItems.map(p => p.name).join(', ')}`}
                type="error"
                showIcon
              />
            )}
            {lowStockItems.length > 0 && (
              <Alert
                message={`${lowStockItems.length} products are running low on stock`}
                description={`Items: ${lowStockItems.map(p => p.name).join(', ')}`}
                type="warning"
                showIcon
              />
            )}
          </Space>
        )}
      </div>

      {/* Filters and Actions */}
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <Space wrap>
            <Input.Search
              placeholder="Search products..."
              style={{ width: 200 }}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <Select
              placeholder="Category"
              style={{ width: 150 }}
              value={filters.category || undefined}
              onChange={(value) => setFilters({ ...filters, category: value || '' })}
              allowClear
            >
              <Option value="raw_materials">Raw Materials</Option>
              <Option value="finished_products">Finished Products</Option>
              <Option value="tools">Tools</Option>
              <Option value="packaging">Packaging</Option>
              <Option value="chemicals">Chemicals</Option>
            </Select>
            <Select
              placeholder="Status"
              style={{ width: 150 }}
              value={filters.status || undefined}
              onChange={(value) => setFilters({ ...filters, status: value || '' })}
              allowClear
            >
              <Option value="in_stock">In Stock</Option>
              <Option value="low_stock">Low Stock</Option>
              <Option value="out_of_stock">Out of Stock</Option>
              <Option value="overstock">Overstock</Option>
            </Select>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddProduct}
          >
            Add Product
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
        />

        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <Pagination
            current={currentPage}
            total={total}
            pageSize={pageSize}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
          />
        </div>
      </Card>

      {/* Add/Edit Product Modal */}
      <Modal
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Product Name"
                name="name"
                rules={[{ required: true, message: 'Product name is required' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="SKU"
                name="sku"
                rules={[{ required: true, message: 'SKU is required' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Description"
            name="description"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Category"
                name="category"
                rules={[{ required: true, message: 'Category is required' }]}
              >
                <Select>
                  <Option value="raw_materials">Raw Materials</Option>
                  <Option value="finished_products">Finished Products</Option>
                  <Option value="tools">Tools</Option>
                  <Option value="packaging">Packaging</Option>
                  <Option value="chemicals">Chemicals</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Unit"
                name="unit"
                rules={[{ required: true, message: 'Unit is required' }]}
              >
                <Select>
                  <Option value="pieces">Pieces</Option>
                  <Option value="kg">Kilograms</Option>
                  <Option value="liter">Liters</Option>
                  <Option value="set">Set</Option>
                  <Option value="roll">Roll</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Price (Rs.)"
                name="price"
                rules={[{ required: true, message: 'Price is required' }]}
              >
                <Input type="number" step="0.01" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Cost Price ($)"
                name="cost_price"
              >
                <Input type="number" step="0.01" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Current Stock"
                name="stock_quantity"
                rules={[{ required: true, message: 'Stock quantity is required' }]}
              >
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Minimum Stock"
                name="minimum_stock"
                rules={[{ required: true, message: 'Minimum stock is required' }]}
              >
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Maximum Stock"
                name="maximum_stock"
              >
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Status"
            name="is_active"
            valuePropName="checked"
          >
            <Select defaultValue={true}>
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingProduct ? 'Update' : 'Create'} Product
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EnhancedInventoryManagement;
