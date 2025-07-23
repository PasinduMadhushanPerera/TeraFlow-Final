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
  Badge,
  Tabs
} from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  TruckOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  EditOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface Supplier {
  id: number;
  full_name: string;
  business_name: string;
  email: string;
  mobile: string;
  address: string;
  is_active: boolean;
  created_at: string;
  material_requests?: number;
  completed_requests?: number;
  avg_delivery_days?: number;
  deliveries?: number;
}

interface MaterialRequest {
  id: number;
  supplier_id: number;
  material_type: string;
  quantity: number;
  unit: string;
  required_date: string;
  description: string;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  admin_notes?: string;
  supplier_response?: string;
  requested_date: string;
  completed_date?: string;
  supplier_name?: string;
  business_name?: string;
}

export const MaterialRequestManagement: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [statusUpdateModalVisible, setStatusUpdateModalVisible] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [form] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('requests');
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    activeSuppliers: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalRequests: 0
  });

  useEffect(() => {
    fetchSuppliers();
    fetchMaterialRequests();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [suppliers, materialRequests]);

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

  const calculateStats = () => {
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter(s => s.is_active).length;
    const pendingRequests = materialRequests.filter(r => r.status === 'pending').length;
    const completedRequests = materialRequests.filter(r => r.status === 'completed').length;
    const totalRequests = materialRequests.length;

    setStats({
      totalSuppliers,
      activeSuppliers,
      pendingRequests,
      completedRequests,
      totalRequests
    });
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/suppliers', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuppliers(data.data);
        } else {
          message.error('Failed to fetch suppliers: ' + data.message);
        }
      } else {
        message.error('Failed to fetch suppliers');
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      message.error('Error fetching suppliers');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterialRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/material-requests', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMaterialRequests(data.data);
        } else {
          message.error('Failed to fetch material requests: ' + data.message);
        }
      } else {
        message.error('Failed to fetch material requests');
      }
    } catch (error) {
      console.error('Error fetching material requests:', error);
      message.error('Error fetching material requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleViewSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDetailModalVisible(true);
  };

  const handleUpdateRequestStatus = (request: MaterialRequest) => {
    setSelectedRequest(request);
    statusForm.setFieldsValue({
      status: request.status,
      admin_notes: request.admin_notes || ''
    });
    setStatusUpdateModalVisible(true);
  };

  const submitRequest = async (values: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/material-requests', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...values,
          required_date: values.required_date.format('YYYY-MM-DD')
        })
      });

      const data = await response.json();
      if (data.success) {
        message.success('Material request created successfully');
        setModalVisible(false);
        form.resetFields();
        fetchMaterialRequests();
      } else {
        message.error(data.message || 'Failed to create material request');
      }
    } catch (error) {
      console.error('Error creating material request:', error);
      message.error('Error creating material request');
    }
  };

  const updateRequestStatus = async (values: any) => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(`http://localhost:5000/api/admin/material-requests/${selectedRequest.id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(values)
      });

      const data = await response.json();
      if (data.success) {
        message.success('Request status updated successfully');
        setStatusUpdateModalVisible(false);
        statusForm.resetFields();
        setSelectedRequest(null);
        fetchMaterialRequests();
      } else {
        message.error(data.message || 'Failed to update request status');
      }
    } catch (error) {
      console.error('Error updating request status:', error);
      message.error('Error updating request status');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'orange',
      approved: 'blue',
      in_progress: 'cyan',
      completed: 'green',
      cancelled: 'red'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: <ClockCircleOutlined />,
      approved: <CheckCircleOutlined />,
      in_progress: <TruckOutlined />,
      completed: <CheckCircleOutlined />,
      cancelled: <ClockCircleOutlined />
    };
    return icons[status as keyof typeof icons] || <ClockCircleOutlined />;
  };

  const supplierColumns: ColumnsType<Supplier> = [
    {
      title: 'Supplier Name',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (text: string, record: Supplier) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          {record.business_name && (
            <div style={{ fontSize: '12px', color: '#666' }}>{record.business_name}</div>
          )}
        </div>
      )
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (record: Supplier) => (
        <div>
          <div>{record.email}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.mobile}</div>
        </div>
      )
    },
    {
      title: 'Total Requests',
      dataIndex: 'material_requests',
      key: 'material_requests',
      render: (value: number) => value || 0
    },
    {
      title: 'Completed',
      dataIndex: 'completed_requests',
      key: 'completed_requests',
      render: (value: number) => value || 0
    },
    {
      title: 'Avg Delivery Days',
      dataIndex: 'avg_delivery_days',
      key: 'avg_delivery_days',
      render: (value: number) => value ? `${value} days` : 'N/A'
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Badge status={isActive ? 'success' : 'default'} text={isActive ? 'Active' : 'Inactive'} />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Supplier) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewSupplier(record)}>
            View
          </Button>
        </Space>
      )
    }
  ];

  const requestColumns: ColumnsType<MaterialRequest> = [
    {
      title: 'Material Type',
      dataIndex: 'material_type',
      key: 'material_type'
    },
    {
      title: 'Supplier',
      key: 'supplier',
      render: (record: MaterialRequest) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.supplier_name}</div>
          {record.business_name && (
            <div style={{ fontSize: '12px', color: '#666' }}>{record.business_name}</div>
          )}
        </div>
      )
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: (record: MaterialRequest) => `${record.quantity} ${record.unit}`
    },
    {
      title: 'Required Date',
      dataIndex: 'required_date',
      key: 'required_date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.toUpperCase().replace('_', ' ')}
        </Tag>
      )
    },
    {
      title: 'Requested Date',
      dataIndex: 'requested_date',
      key: 'requested_date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: MaterialRequest) => (
        <Space>
          <Button 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => handleUpdateRequestStatus(record)}
          >
            Update Status
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2}>Material Request Management</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => {
            fetchSuppliers();
            fetchMaterialRequests();
          }}>
            Refresh
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreateRequest}
          >
            Create Request
          </Button>
        </Space>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Suppliers"
              value={stats.totalSuppliers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Suppliers"
              value={stats.activeSuppliers}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Requests"
              value={stats.pendingRequests}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Completed Requests"
              value={stats.completedRequests}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Material Requests" key="requests">
          <Card title="Material Requests">
            <Table
              dataSource={materialRequests}
              columns={requestColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Suppliers" key="suppliers">
          <Card title="Supplier Performance">
            <Table
              dataSource={suppliers}
              columns={supplierColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Create Request Modal */}
      <Modal
        title="Create Material Request"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={submitRequest}
        >
          <Form.Item
            label="Supplier"
            name="supplier_id"
            rules={[{ required: true, message: 'Please select a supplier' }]}
          >
            <Select placeholder="Select supplier">
              {suppliers.filter(s => s.is_active).map(supplier => (
                <Option key={supplier.id} value={supplier.id}>
                  {supplier.full_name} {supplier.business_name ? `(${supplier.business_name})` : ''}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Material Type"
                name="material_type"
                rules={[{ required: true, message: 'Please enter material type' }]}
              >
                <Input placeholder="e.g., Red Clay, Glazes" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Quantity"
                name="quantity"
                rules={[{ required: true, message: 'Please enter quantity' }]}
              >
                <Input type="number" min={1} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Unit"
                name="unit"
                rules={[{ required: true, message: 'Please enter unit' }]}
              >
                <Input placeholder="kg, pieces, etc." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Required Date"
            name="required_date"
            rules={[{ required: true, message: 'Please select required date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <TextArea rows={3} placeholder="Additional requirements or specifications..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create Request
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        title="Update Request Status"
        visible={statusUpdateModalVisible}
        onCancel={() => setStatusUpdateModalVisible(false)}
        footer={null}
      >
        {selectedRequest && (
          <div>
            <Descriptions bordered size="small" style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="Material Type" span={3}>
                {selectedRequest.material_type}
              </Descriptions.Item>
              <Descriptions.Item label="Supplier" span={3}>
                {selectedRequest.supplier_name}
              </Descriptions.Item>
              <Descriptions.Item label="Quantity">
                {selectedRequest.quantity} {selectedRequest.unit}
              </Descriptions.Item>
              <Descriptions.Item label="Required Date">
                {dayjs(selectedRequest.required_date).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="Current Status">
                <Tag color={getStatusColor(selectedRequest.status)}>
                  {selectedRequest.status.toUpperCase().replace('_', ' ')}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Form
              form={statusForm}
              layout="vertical"
              onFinish={updateRequestStatus}
            >
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select>
                  <Option value="pending">Pending</Option>
                  <Option value="approved">Approved</Option>
                  <Option value="in_progress">In Progress</Option>
                  <Option value="completed">Completed</Option>
                  <Option value="cancelled">Cancelled</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Admin Notes"
                name="admin_notes"
              >
                <TextArea rows={3} placeholder="Add notes about this status update..." />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    Update Status
                  </Button>
                  <Button onClick={() => setStatusUpdateModalVisible(false)}>
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* Supplier Detail Modal */}
      <Modal
        title="Supplier Details"
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedSupplier && (
          <Descriptions bordered>
            <Descriptions.Item label="Full Name" span={3}>
              {selectedSupplier.full_name}
            </Descriptions.Item>
            <Descriptions.Item label="Business Name" span={3}>
              {selectedSupplier.business_name || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedSupplier.email}
            </Descriptions.Item>
            <Descriptions.Item label="Mobile">
              {selectedSupplier.mobile}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Badge 
                status={selectedSupplier.is_active ? 'success' : 'default'} 
                text={selectedSupplier.is_active ? 'Active' : 'Inactive'} 
              />
            </Descriptions.Item>
            <Descriptions.Item label="Address" span={3}>
              {selectedSupplier.address}
            </Descriptions.Item>
            <Descriptions.Item label="Total Requests">
              {selectedSupplier.material_requests || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Completed Requests">
              {selectedSupplier.completed_requests || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Avg Delivery Days">
              {selectedSupplier.avg_delivery_days ? `${selectedSupplier.avg_delivery_days} days` : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Member Since" span={3}>
              {dayjs(selectedSupplier.created_at).format('YYYY-MM-DD')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default MaterialRequestManagement;
