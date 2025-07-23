import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Descriptions,
  Badge,
  Tooltip,
  Upload,
  Progress
} from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  TruckOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
  UploadOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface MaterialRequest {
  id: number;
  material_type: string;
  quantity: number;
  unit: string;
  required_date: string;
  status: string;
  description: string;
  created_at: string;
  updated_at: string;
  admin_notes: string;
  supplier_response: string;
  priority: string;
  estimated_delivery_date: string;
  actual_delivery_date: string;
  delivery_notes: string;
}

interface RequestStats {
  total: number;
  pending: number;
  approved: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export const MaterialRequests: React.FC = () => {
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [updateVisible, setUpdateVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState<RequestStats>({
    total: 0, pending: 0, approved: 0, inProgress: 0, completed: 0, cancelled: 0
  });
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
    calculateStats();
  }, [requests, statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('terraflow_token');
      
      if (!token) {
        message.error('Authentication token not found');
        return;
      }

      const response = await fetch('http://localhost:5000/api/supplier/requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRequests(data.data);
        } else {
          message.error(data.message || 'Failed to fetch requests');
        }
      } else {
        message.error('Failed to fetch material requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      message.error('Error loading material requests');
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }
    
    setFilteredRequests(filtered);
  };

  const calculateStats = () => {
    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      inProgress: requests.filter(r => r.status === 'in_progress').length,
      completed: requests.filter(r => r.status === 'completed').length,
      cancelled: requests.filter(r => r.status === 'cancelled').length,
    };
    setStats(stats);
  };

  const handleUpdateStatus = async (values: any) => {
    if (!selectedRequest) return;

    try {
      const token = localStorage.getItem('terraflow_user') ? 
        JSON.parse(localStorage.getItem('terraflow_user')!).token : null;

      const response = await fetch(`http://localhost:5000/api/supplier/requests/${selectedRequest.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          message.success('Request status updated successfully');
          setUpdateVisible(false);
          fetchRequests();
          form.resetFields();
        } else {
          message.error(data.message || 'Failed to update status');
        }
      } else {
        message.error('Failed to update request status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('Error updating request status');
    }
  };

  const handleConfirmDelivery = async (values: any) => {
    if (!selectedRequest) return;

    try {
      const token = localStorage.getItem('terraflow_user') ? 
        JSON.parse(localStorage.getItem('terraflow_user')!).token : null;

      const response = await fetch(`http://localhost:5000/api/supplier/requests/${selectedRequest.id}/confirm-delivery`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          delivery_notes: values.delivery_notes,
          delivery_date: values.delivery_date.format('YYYY-MM-DD')
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          message.success('Delivery confirmed successfully');
          setUpdateVisible(false);
          fetchRequests();
          form.resetFields();
        } else {
          message.error(data.message || 'Failed to confirm delivery');
        }
      } else {
        message.error('Failed to confirm delivery');
      }
    } catch (error) {
      console.error('Error confirming delivery:', error);
      message.error('Error confirming delivery');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'approved': return 'blue';
      case 'in_progress': return 'purple';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return '#ff4d4f';
      case 'high': return '#fa8c16';
      case 'medium': return '#fadb14';
      case 'low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const canUpdateStatus = (status: string) => {
    return ['pending', 'approved', 'in_progress'].includes(status);
  };

  const getAvailableStatuses = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return [
          { value: 'approved', label: 'Approved', color: 'blue' },
          { value: 'cancelled', label: 'Cancelled', color: 'red' }
        ];
      case 'approved':
        return [
          { value: 'in_progress', label: 'In Progress', color: 'purple' }
        ];
      case 'in_progress':
        return [
          { value: 'completed', label: 'Completed', color: 'green' }
        ];
      default:
        return [];
    }
  };

  const columns: ColumnsType<MaterialRequest> = [
    {
      title: 'Request ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id) => `#${id}`
    },
    {
      title: 'Material Type',
      dataIndex: 'material_type',
      key: 'material_type',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: (_, record) => `${record.quantity} ${record.unit}`,
      width: 120
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => priority ? (
        <Tag color={getPriorityColor(priority)}>
          {priority.toUpperCase()}
        </Tag>
      ) : <Text type="secondary">-</Text>
    },
    {
      title: 'Required Date',
      dataIndex: 'required_date',
      key: 'required_date',
      width: 130,
      render: (date) => {
        const reqDate = dayjs(date);
        const isOverdue = reqDate.isBefore(dayjs()) && !['completed', 'cancelled'].includes('status');
        return (
          <div className={isOverdue ? 'text-red-500' : ''}>
            <CalendarOutlined className="mr-1" />
            {reqDate.format('MMM DD, YYYY')}
            {isOverdue && <WarningOutlined className="ml-1 text-red-500" />}
          </div>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Badge 
          color={getStatusColor(status)}
          text={status.replace('_', ' ').toUpperCase()}
        />
      )
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      render: (date) => dayjs(date).format('MMM DD, YYYY')
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedRequest(record);
                setDetailsVisible(true);
              }}
            />
          </Tooltip>
          {canUpdateStatus(record.status) && (
            <Tooltip title="Update Status">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => {
                  setSelectedRequest(record);
                  setUpdateVisible(true);
                  form.setFieldsValue({
                    status: record.status,
                    supplier_response: record.supplier_response || ''
                  });
                }}
              />
            </Tooltip>
          )}
          {record.status === 'in_progress' && (
            <Tooltip title="Confirm Delivery">
              <Button
                type="text"
                icon={<TruckOutlined />}
                onClick={() => {
                  setSelectedRequest(record);
                  setUpdateVisible(true);
                  form.setFieldsValue({
                    action: 'delivery',
                    delivery_date: dayjs()
                  });
                }}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="w-full">
      <div className="mb-6">
        <Title level={2} className="text-amber-900 mb-2">
          Material Requests
        </Title>
        <Text className="text-gray-600">
          Manage your assigned material requests and update delivery status
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic
              title="Total"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ fontSize: '18px' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic
              title="Pending"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ fontSize: '18px', color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic
              title="Approved"
              value={stats.approved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ fontSize: '18px', color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic
              title="In Progress"
              value={stats.inProgress}
              prefix={<TruckOutlined />}
              valueStyle={{ fontSize: '18px', color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic
              title="Completed"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ fontSize: '18px', color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <div className="text-center">
              <Text className="text-sm text-gray-500">Completion Rate</Text>
              <div className="mt-1">
                <Progress
                  type="circle"
                  size={40}
                  percent={stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}
                  strokeWidth={8}
                  format={(percent) => `${percent}%`}
                />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filters and Table */}
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <Space>
            <Text>Filter by status:</Text>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
            >
              <Option value="all">All Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="approved">Approved</Option>
              <Option value="in_progress">In Progress</Option>
              <Option value="completed">Completed</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Space>
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            onClick={fetchRequests}
            loading={loading}
          >
            Refresh
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredRequests}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} requests`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Request Details Modal */}
      <Modal
        title={`Request Details - #${selectedRequest?.id}`}
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedRequest && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Material Type" span={2}>
                <Text strong>{selectedRequest.material_type}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Quantity">
                {selectedRequest.quantity} {selectedRequest.unit}
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                {selectedRequest.priority ? (
                  <Tag color={getPriorityColor(selectedRequest.priority)}>
                    {selectedRequest.priority.toUpperCase()}
                  </Tag>
                ) : <Text type="secondary">Not specified</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Required Date">
                {dayjs(selectedRequest.required_date).format('MMMM DD, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge 
                  color={getStatusColor(selectedRequest.status)}
                  text={selectedRequest.status.replace('_', ' ').toUpperCase()}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {dayjs(selectedRequest.created_at).format('MMMM DD, YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {dayjs(selectedRequest.updated_at).format('MMMM DD, YYYY HH:mm')}
              </Descriptions.Item>
              {selectedRequest.description && (
                <Descriptions.Item label="Description" span={2}>
                  {selectedRequest.description}
                </Descriptions.Item>
              )}
              {selectedRequest.admin_notes && (
                <Descriptions.Item label="Admin Notes" span={2}>
                  {selectedRequest.admin_notes}
                </Descriptions.Item>
              )}
              {selectedRequest.supplier_response && (
                <Descriptions.Item label="Your Response" span={2}>
                  {selectedRequest.supplier_response}
                </Descriptions.Item>
              )}
              {selectedRequest.estimated_delivery_date && (
                <Descriptions.Item label="Estimated Delivery">
                  {dayjs(selectedRequest.estimated_delivery_date).format('MMMM DD, YYYY')}
                </Descriptions.Item>
              )}
              {selectedRequest.actual_delivery_date && (
                <Descriptions.Item label="Actual Delivery">
                  {dayjs(selectedRequest.actual_delivery_date).format('MMMM DD, YYYY')}
                </Descriptions.Item>
              )}
              {selectedRequest.delivery_notes && (
                <Descriptions.Item label="Delivery Notes" span={2}>
                  {selectedRequest.delivery_notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal
        title={`Update Request #${selectedRequest?.id}`}
        open={updateVisible}
        onCancel={() => {
          setUpdateVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        {selectedRequest && (
          <Form
            form={form}
            layout="vertical"
            onFinish={form.getFieldValue('action') === 'delivery' ? handleConfirmDelivery : handleUpdateStatus}
          >
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <Text strong>{selectedRequest.material_type}</Text>
              <br />
              <Text type="secondary">
                Quantity: {selectedRequest.quantity} {selectedRequest.unit}
              </Text>
            </div>

            {form.getFieldValue('action') === 'delivery' ? (
              <>
                <Form.Item
                  label="Delivery Date"
                  name="delivery_date"
                  rules={[{ required: true, message: 'Please select delivery date' }]}
                >
                  <DatePicker className="w-full" />
                </Form.Item>
                <Form.Item
                  label="Delivery Notes"
                  name="delivery_notes"
                  rules={[{ required: true, message: 'Please provide delivery notes' }]}
                >
                  <TextArea rows={4} placeholder="Enter delivery confirmation details..." />
                </Form.Item>
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" icon={<TruckOutlined />}>
                      Confirm Delivery
                    </Button>
                    <Button onClick={() => {
                      setUpdateVisible(false);
                      form.resetFields();
                    }}>
                      Cancel
                    </Button>
                  </Space>
                </Form.Item>
              </>
            ) : (
              <>
                <Form.Item
                  label="Status"
                  name="status"
                  rules={[{ required: true, message: 'Please select status' }]}
                >
                  <Select placeholder="Select new status">
                    {getAvailableStatuses(selectedRequest.status).map(status => (
                      <Option key={status.value} value={status.value}>
                        <Badge color={status.color} text={status.label} />
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  label="Response/Notes"
                  name="supplier_response"
                  rules={[{ required: true, message: 'Please provide your response' }]}
                >
                  <TextArea rows={4} placeholder="Enter your response or notes..." />
                </Form.Item>
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />}>
                      Update Status
                    </Button>
                    <Button onClick={() => {
                      setUpdateVisible(false);
                      form.resetFields();
                    }}>
                      Cancel
                    </Button>
                  </Space>
                </Form.Item>
              </>
            )}
          </Form>
        )}
      </Modal>
    </div>
  );
};