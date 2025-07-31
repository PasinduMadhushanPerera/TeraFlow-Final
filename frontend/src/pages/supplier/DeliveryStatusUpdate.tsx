import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  Button, 
  message, 
  Descriptions, 
  Tag, 
  DatePicker, 
  Divider,
  Steps,
  Row,
  Col,
  Typography,
  Space
} from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  SyncOutlined, 
  CarOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface MaterialRequest {
  id: number;
  material_type: string;
  quantity: number;
  unit: string;
  required_date: string;
  description: string;
  status: string;
  admin_notes?: string;
  supplier_response?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  delivery_notes?: string;
  priority: string;
  requested_date: string;
}

export const DeliveryStatusUpdate: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState<MaterialRequest | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    if (requestId) {
      fetchMaterialRequest();
    }
  }, [requestId]);

  const fetchMaterialRequest = async () => {
    try {
      const userStr = localStorage.getItem('terraflow_user');
      const token = userStr ? JSON.parse(userStr).token : null;

      const response = await fetch(`http://localhost:5000/api/supplier/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const foundRequest = data.data.find((req: MaterialRequest) => req.id === parseInt(requestId!));
          if (foundRequest) {
            setRequest(foundRequest);
            // Set initial form values
            form.setFieldsValue({
              status: foundRequest.status,
              supplier_response: foundRequest.supplier_response || '',
              estimated_delivery_date: foundRequest.estimated_delivery_date ? 
                dayjs(foundRequest.estimated_delivery_date) : null,
              delivery_notes: foundRequest.delivery_notes || ''
            });
          } else {
            message.error('Material request not found');
            navigate('/supplier/requests');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching material request:', error);
      message.error('Failed to fetch material request details');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleUpdateStatus = async (values: any) => {
    if (!request) return;

    setLoading(true);
    try {
      const userStr = localStorage.getItem('terraflow_user');
      const token = userStr ? JSON.parse(userStr).token : null;

      const updateData: any = {
        status: values.status,
        supplier_response: values.supplier_response
      };

      // Add estimated delivery date if provided
      if (values.estimated_delivery_date) {
        updateData.estimated_delivery_date = values.estimated_delivery_date.format('YYYY-MM-DD');
      }

      const response = await fetch(`http://localhost:5000/api/supplier/requests/${request.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          message.success('Delivery status updated successfully');
          
          // If status is completed, also handle delivery confirmation
          if (values.status === 'completed' && values.delivery_notes) {
            await handleConfirmDelivery(values);
          } else {
            setTimeout(() => {
              navigate('/supplier/requests');
            }, 1500);
          }
        } else {
          message.error(data.message || 'Failed to update status');
        }
      } else {
        message.error('Failed to update delivery status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('Error updating delivery status');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelivery = async (values: any) => {
    if (!request) return;

    try {
      const userStr = localStorage.getItem('terraflow_user');
      const token = userStr ? JSON.parse(userStr).token : null;

      const response = await fetch(`http://localhost:5000/api/supplier/requests/${request.id}/confirm-delivery`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          delivery_notes: values.delivery_notes,
          delivery_date: values.actual_delivery_date ? 
            values.actual_delivery_date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          message.success('Delivery confirmed successfully');
          setTimeout(() => {
            navigate('/supplier/requests');
          }, 1500);
        }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockCircleOutlined />;
      case 'approved': return <CheckCircleOutlined />;
      case 'in_progress': return <SyncOutlined spin />;
      case 'completed': return <CheckCircleOutlined />;
      case 'cancelled': return <ExclamationCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const getStepsStatus = () => {
    if (!request) return { current: 0, status: 'process' };
    
    switch (request.status) {
      case 'pending': return { current: 0, status: 'process' };
      case 'approved': return { current: 1, status: 'process' };
      case 'in_progress': return { current: 2, status: 'process' };
      case 'completed': return { current: 3, status: 'finish' };
      case 'cancelled': return { current: 0, status: 'error' };
      default: return { current: 0, status: 'process' };
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <SyncOutlined spin className="text-2xl" />
        <span className="ml-2">Loading material request details...</span>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-8">
        <Text type="secondary">Material request not found</Text>
      </div>
    );
  }

  const steps = getStepsStatus();

  return (
    <div className="p-6">
      <Title level={2}>Update Delivery Status</Title>
      <Text type="secondary">Manage delivery status for material request #{request.id}</Text>

      <Row gutter={24} className="mt-6">
        <Col span={24} lg={16}>
          {/* Request Details Card */}
          <Card title="Material Request Details" className="mb-6">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Request ID">#{request.id}</Descriptions.Item>
              <Descriptions.Item label="Current Status">
                <Tag color={getStatusColor(request.status)} icon={getStatusIcon(request.status)}>
                  {request.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Material Type">{request.material_type}</Descriptions.Item>
              <Descriptions.Item label="Quantity">{request.quantity} {request.unit}</Descriptions.Item>
              <Descriptions.Item label="Required Date">
                {dayjs(request.required_date).format('MMMM DD, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={request.priority === 'urgent' ? 'red' : request.priority === 'high' ? 'orange' : 'blue'}>
                  {request.priority?.toUpperCase() || 'NORMAL'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {request.description}
              </Descriptions.Item>
              {request.admin_notes && (
                <Descriptions.Item label="Admin Notes" span={2}>
                  {request.admin_notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Status Update Form */}
          <Card title="Update Delivery Status">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateStatus}
              className="mt-4"
            >
              <Row gutter={16}>
                <Col span={24} md={12}>
                  <Form.Item
                    label="Delivery Status"
                    name="status"
                    rules={[{ required: true, message: 'Please select a status' }]}
                  >
                    <Select placeholder="Select delivery status">
                      <Option value="pending">Pending Review</Option>
                      <Option value="approved">Approved</Option>
                      <Option value="in_progress">In Progress</Option>
                      <Option value="completed">Completed</Option>
                      <Option value="cancelled">Cancelled</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={24} md={12}>
                  <Form.Item
                    label="Estimated Delivery Date"
                    name="estimated_delivery_date"
                  >
                    <DatePicker 
                      className="w-full"
                      placeholder="Select estimated delivery date"
                      disabledDate={(current) => current && current < dayjs().startOf('day')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Response Message"
                name="supplier_response"
                rules={[{ required: true, message: 'Please provide a response message' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Enter your response or notes about this request..."
                />
              </Form.Item>

              {/* Delivery Confirmation Fields (show when status is completed) */}
              <Form.Item shouldUpdate={() => true}>
                {({ getFieldValue }) => {
                  const currentStatus = getFieldValue('status');
                  return currentStatus === 'completed' ? (
                    <>
                      <Divider orientation="left">Delivery Confirmation</Divider>
                      <Row gutter={16}>
                        <Col span={24} md={12}>
                          <Form.Item
                            label="Actual Delivery Date"
                            name="actual_delivery_date"
                          >
                            <DatePicker 
                              className="w-full"
                              placeholder="Select actual delivery date"
                              defaultValue={dayjs()}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item
                        label="Delivery Notes"
                        name="delivery_notes"
                        rules={currentStatus === 'completed' ? [
                          { required: true, message: 'Please provide delivery notes' }
                        ] : []}
                      >
                        <TextArea
                          rows={3}
                          placeholder="Enter delivery confirmation details, recipient name, any special notes..."
                        />
                      </Form.Item>
                    </>
                  ) : null;
                }}
              </Form.Item>

              <Space className="mt-6">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<CheckCircleOutlined />}
                >
                  Update Status
                </Button>
                <Button onClick={() => navigate('/supplier/requests')}>
                  Cancel
                </Button>
              </Space>
            </Form>
          </Card>
        </Col>

        <Col span={24} lg={8}>
          {/* Delivery Progress */}
          <Card title="Delivery Progress" className="mb-6">
            <Steps
              direction="vertical"
              current={steps.current}
              status={steps.status as any}
              items={[
                {
                  title: 'Request Received',
                  description: 'Material request received from admin',
                  icon: <ClockCircleOutlined />
                },
                {
                  title: 'Request Approved',
                  description: 'Request reviewed and approved',
                  icon: <CheckCircleOutlined />
                },
                {
                  title: 'In Progress',
                  description: 'Preparing and processing order',
                  icon: <SyncOutlined />
                },
                {
                  title: 'Completed',
                  description: 'Material delivered successfully',
                  icon: <CarOutlined />
                }
              ]}
            />
          </Card>

          {/* Quick Actions */}
          <Card title="Quick Actions">
            <Space direction="vertical" className="w-full">
              <Button 
                type="dashed" 
                block 
                onClick={() => navigate('/supplier/requests')}
              >
                Back to All Requests
              </Button>
              <Button 
                type="dashed" 
                block 
                onClick={() => navigate('/supplier/history')}
              >
                View Delivery History
              </Button>
              <Button 
                type="dashed" 
                block 
                onClick={() => navigate('/supplier/notifications')}
              >
                View Notifications
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
