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
  DatePicker
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  TeamOutlined,
  ShopOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface User {
  id: number;
  role: string;
  full_name: string;
  email: string;
  mobile: string;
  address: string;
  business_name?: string;
  is_active: boolean;
  created_at: string;
}

interface EditUserForm {
  full_name: string;
  email: string;
  mobile: string;
  address: string;
  business_name?: string;
  role: string;
  is_active: boolean;
}

interface CreateUserForm extends EditUserForm {
  password: string;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm] = Form.useForm();
  const [createForm] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchText, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Get authentication token
      const token = localStorage.getItem('terraflow_token');
      if (!token) {
        message.error('Authentication required');
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
      } else {
        message.error(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(user => user.is_active === isActive);
    }

    if (searchText) {
      filtered = filtered.filter(user => 
        user.full_name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase()) ||
        user.business_name?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    editForm.setFieldsValue({
      full_name: user.full_name,
      email: user.email,
      mobile: user.mobile,
      address: user.address,
      business_name: user.business_name || '',
      role: user.role,
      is_active: user.is_active
    });
    setEditModalVisible(true);
  };

  const handleCreateUser = () => {
    createForm.resetFields();
    setCreateModalVisible(true);
  };

  const handleUpdateUser = async (values: EditUserForm) => {
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token || !selectedUser) return;

      const response = await fetch(`http://localhost:5000/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();

      if (data.success) {
        message.success('User updated successfully');
        setEditModalVisible(false);
        fetchUsers();
      } else {
        message.error(data.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      message.error('Error updating user');
    }
  };

  const handleCreateNewUser = async (values: CreateUserForm) => {
    try {
      const token = localStorage.getItem('terraflow_token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();

      if (data.success) {
        message.success('User created successfully');
        setCreateModalVisible(false);
        createForm.resetFields();
        fetchUsers();
      } else {
        message.error(data.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      message.error('Error creating user');
    }
  };

  const handleStatusToggle = async (userId: number, newStatus: boolean) => {
    try {
      // Get authentication token
      const token = localStorage.getItem('terraflow_token');
      if (!token) {
        message.error('Authentication required');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        message.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
        fetchUsers(); // Refresh the user list
      } else {
        message.error(data.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      message.error('Error updating user status');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      // Get authentication token
      const token = localStorage.getItem('terraflow_token');
      if (!token) {
        message.error('Authentication required');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        message.success('User deleted successfully');
        fetchUsers(); // Refresh the user list
      } else {
        message.error(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error('Error deleting user');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'red';
      case 'supplier': return 'blue';
      case 'customer': return 'green';
      default: return 'default';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <UserOutlined />;
      case 'supplier': return <ShopOutlined />;
      case 'customer': return <TeamOutlined />;
      default: return <UserOutlined />;
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (text: string, record: User) => (
        <Space>
          {getRoleIcon(record.role)}
          <div>
            <div>{text}</div>
            {record.business_name && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                {record.business_name}
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={getRoleColor(role)} icon={getRoleIcon(role)}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Mobile',
      dataIndex: 'mobile',
      key: 'mobile',
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record: User) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleStatusToggle(record.id, checked)}
          disabled={record.role === 'admin'}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: 'Joined Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
          >
            Edit
          </Button>
          {record.role !== 'admin' && (
            <Popconfirm
              title="Are you sure you want to delete this user?"
              description="This action cannot be undone."
              onConfirm={() => handleDeleteUser(record.id)}
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
          )}
        </Space>
      ),
    },
  ];

  const stats = {
    total: users.length,
    customers: users.filter(u => u.role === 'customer').length,
    suppliers: users.filter(u => u.role === 'supplier').length,
    active: users.filter(u => u.is_active).length,
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <Title level={2} className="text-amber-900 mb-2">
          User Management
        </Title>
        <p className="text-gray-600 mb-4">
          Manage customer and supplier accounts, monitor user activity, and control access permissions.
        </p>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Customers"
              value={stats.customers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Suppliers"
              value={stats.suppliers}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={stats.active}
              prefix={<PlusOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Card className="mb-4">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search by name, email, or business name"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by role"
              value={roleFilter}
              onChange={setRoleFilter}
            >
              <Option value="all">All Roles</Option>
              <Option value="customer">Customers</Option>
              <Option value="supplier">Suppliers</Option>
              <Option value="admin">Administrators</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={10}>
            <Space>
              <Button onClick={fetchUsers} loading={loading}>
                <ReloadOutlined />
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateUser}
              >
                Add New User
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Users Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} users`,
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Edit User Modal */}
      <Modal
        title="Edit User"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateUser}
        >
          <Form.Item
            name="full_name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter the full name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: 'Please enter the email' }, { type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="mobile"
            label="Mobile"
            rules={[{ required: true, message: 'Please enter the mobile number' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please enter the address' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="business_name"
            label="Business Name"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select>
              <Option value="admin">Admin</Option>
              <Option value="customer">Customer</Option>
              <Option value="supplier">Supplier</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="is_active"
            label="Status"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update User
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create User Modal */}
      <Modal
        title="Create User"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateNewUser}
        >
          <Form.Item
            name="full_name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter the full name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: 'Please enter the email' }, { type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="mobile"
            label="Mobile"
            rules={[{ required: true, message: 'Please enter the mobile number' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please enter the address' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="business_name"
            label="Business Name"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select>
              <Option value="admin">Admin</Option>
              <Option value="customer">Customer</Option>
              <Option value="supplier">Supplier</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter a password' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="is_active"
            label="Status"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Create User
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};