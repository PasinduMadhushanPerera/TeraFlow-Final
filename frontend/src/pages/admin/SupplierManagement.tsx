import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Statistic,
  Row,
  Col,
  Tag,
  Space,
  message,
  Descriptions,
  Badge
} from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  TruckOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Supplier {
  id: number;
  full_name: string;
  business_name: string;
  email: string;
  mobile: string;
  address: string;
  is_active: boolean;
  created_at: string;
  material_requests: number;
  deliveries: number;
}

interface MaterialRequest {
  id: number;
  supplier_id: number;
  material_type: string;
  quantity: number;
  unit: string;
  required_date: string;
  description: string;
  status: string;
  requested_date: string;
  supplier_name?: string;
}

export const SupplierManagement: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    activeSuppliers: 0,
    pendingRequests: 0,
    completedDeliveries: 0
  });

  useEffect(() => {
    fetchSuppliers();
    fetchMaterialRequests();
  }, []);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('terraflow_token');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/suppliers', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setSuppliers(data.data);
        calculateStats(data.data);
      } else {
        message.error('Failed to fetch suppliers: ' + data.message);
      }
    } catch (error) {
      message.error('Failed to fetch suppliers');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterialRequests = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/material-requests', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setMaterialRequests(data.data || []);
      } else {
        console.error('Failed to fetch material requests:', data.message);
      }
    } catch (error) {
      console.error('Failed to fetch material requests:', error);
    }
  };

  const calculateStats = (suppliersData: Supplier[]) => {
    const totalSuppliers = suppliersData.length;
    const activeSuppliers = suppliersData.filter(s => s.is_active).length;
    const pendingRequests = suppliersData.reduce((sum, s) => sum + (s.material_requests || 0), 0);
    const completedDeliveries = suppliersData.reduce((sum, s) => sum + (s.deliveries || 0), 0);

    setStats({
      totalSuppliers,
      activeSuppliers,
      pendingRequests,
      completedDeliveries
    });
  };

  const handleCreateMaterialRequest = async (values: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/material-requests', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...values,
          required_date: values.required_date?.format('YYYY-MM-DD'),
        }),
      });

      const data = await response.json();
      if (data.success) {
        message.success('Material request created successfully');
        setModalVisible(false);
        form.resetFields();
        fetchMaterialRequests();
        fetchSuppliers();
      } else {
        message.error(data.message || 'Failed to create material request');
      }
    } catch (error) {
      message.error('Failed to create material request');
    }
  };

  const supplierColumns: ColumnsType<Supplier> = [
    {
      title: 'Business Name',
      dataIndex: 'business_name',
      key: 'business_name',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary">{record.full_name}</Text>
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div>{record.email}</div>
          <div>{record.mobile}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Badge
          status={isActive ? 'success' : 'error'}
          text={isActive ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      title: 'Requests',
      dataIndex: 'material_requests',
      key: 'material_requests',
      render: (count) => (
        <Tag color="blue" icon={<ShoppingCartOutlined />}>
          {count || 0}
        </Tag>
      ),
    },
    {
      title: 'Deliveries',
      dataIndex: 'deliveries',
      key: 'deliveries',
      render: (count) => (
        <Tag color="green" icon={<TruckOutlined />}>
          {count || 0}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedSupplier(record);
              setDetailModalVisible(true);
            }}
          >
            View Details
          </Button>
        </Space>
      ),
    },
  ];

  const requestColumns: ColumnsType<MaterialRequest> = [
    {
      title: 'Material Type',
      dataIndex: 'material_type',
      key: 'material_type',
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: (_, record) => `${record.quantity} ${record.unit}`,
    },
    {
      title: 'Required Date',
      dataIndex: 'required_date',
      key: 'required_date',
      render: (date) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          pending: { color: 'orange', icon: <ClockCircleOutlined /> },
          approved: { color: 'blue', icon: <CheckCircleOutlined /> },
          in_progress: { color: 'cyan', icon: <TruckOutlined /> },
          completed: { color: 'green', icon: <CheckCircleOutlined /> },
          cancelled: { color: 'red', icon: <ClockCircleOutlined /> },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        return (
          <Tag color={config.color} icon={config.icon}>
            {status.replace('_', ' ').toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Requested',
      dataIndex: 'requested_date',
      key: 'requested_date',
      render: (date) => dayjs(date).format('MMM DD, YYYY'),
    },
  ];

  return (
    <div className="w-full">
      <Title level={2} className="text-amber-900 mb-6">
        Supplier Management
      </Title>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Suppliers"
              value={stats.totalSuppliers}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Suppliers"
              value={stats.activeSuppliers}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Material Requests"
              value={stats.pendingRequests}
              prefix={<ShoppingCartOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completed Deliveries"
              value={stats.completedDeliveries}
              prefix={<TruckOutlined style={{ color: '#13c2c2' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Suppliers Table */}
      <Card
        title="Suppliers"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
            className="bg-amber-600 hover:bg-amber-700"
          >
            New Material Request
          </Button>
        }
        className="mb-6"
      >
        <Table
          columns={supplierColumns}
          dataSource={suppliers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      {/* Material Requests Table */}
      <Card title="Material Requests">
        <Table
          columns={requestColumns}
          dataSource={materialRequests}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
          }}
        />
      </Card>

      {/* Create Material Request Modal */}
      <Modal
        title="Create Material Request"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateMaterialRequest}
        >
          <Form.Item
            name="supplier_id"
            label="Supplier"
            rules={[{ required: true, message: 'Please select a supplier' }]}
          >
            <Select placeholder="Select a supplier">
              {suppliers.filter(s => s.is_active).map(supplier => (
                <Option key={supplier.id} value={supplier.id}>
                  {supplier.business_name} - {supplier.full_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="material_type"
            label="Material Type"
            rules={[{ required: true, message: 'Please enter material type' }]}
          >
            <Input placeholder="e.g., Red Clay, White Clay, Glazing Materials" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="Quantity"
                rules={[{ required: true, message: 'Please enter quantity' }]}
              >
                <Input type="number" placeholder="Enter quantity" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unit"
                label="Unit"
                rules={[{ required: true, message: 'Please select unit' }]}
              >
                <Select placeholder="Select unit">
                  <Option value="kg">Kilograms (kg)</Option>
                  <Option value="tons">Tons</Option>
                  <Option value="liters">Liters</Option>
                  <Option value="pieces">Pieces</Option>
                  <Option value="boxes">Boxes</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="required_date"
            label="Required Date"
            rules={[{ required: true, message: 'Please select required date' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea
              rows={3}
              placeholder="Additional requirements or specifications..."
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                className="bg-amber-600 hover:bg-amber-700"
              >
                Create Request
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Supplier Details Modal */}
      <Modal
        title="Supplier Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedSupplier && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Business Name" span={2}>
              {selectedSupplier.business_name}
            </Descriptions.Item>
            <Descriptions.Item label="Contact Person">
              {selectedSupplier.full_name}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Badge
                status={selectedSupplier.is_active ? 'success' : 'error'}
                text={selectedSupplier.is_active ? 'Active' : 'Inactive'}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedSupplier.email}
            </Descriptions.Item>
            <Descriptions.Item label="Mobile">
              {selectedSupplier.mobile}
            </Descriptions.Item>
            <Descriptions.Item label="Address" span={2}>
              {selectedSupplier.address}
            </Descriptions.Item>
            <Descriptions.Item label="Material Requests">
              {selectedSupplier.material_requests || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Completed Deliveries">
              {selectedSupplier.deliveries || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Joined Date" span={2}>
              {dayjs(selectedSupplier.created_at).format('MMMM DD, YYYY')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};