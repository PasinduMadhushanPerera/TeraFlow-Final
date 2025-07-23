import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Package, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Truck,
  Star,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface MaterialRequest {
  id: number;
  material_type: string;
  quantity_required: number;
  required_by: string;
  status: 'pending' | 'preparing' | 'shipped' | 'delivered';
  created_at: string;
  notes?: string;
}

interface SupplierStats {
  total_requests: number;
  pending_requests: number;
  completed_deliveries: number;
  average_rating: number;
  total_revenue: number;
  on_time_delivery_rate: number;
}

const EnhancedSupplierDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<SupplierStats>({
    total_requests: 0,
    pending_requests: 0,
    completed_deliveries: 0,
    average_rating: 0,
    total_revenue: 0,
    on_time_delivery_rate: 0
  });
  const [recentRequests, setRecentRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch supplier stats
      const statsResponse = await fetch('http://localhost:5000/api/supplier/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }
      
      // Fetch recent requests
      const requestsResponse = await fetch('http://localhost:5000/api/supplier/material-requests?limit=5', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setRecentRequests(requestsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: number, status: string) => {
    try {
      const response = await fetch(`/api/supplier/material-requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'preparing':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPriorityLevel = (requiredBy: string) => {
    const daysUntilRequired = Math.ceil(
      (new Date(requiredBy).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilRequired <= 3) return { level: 'urgent', color: 'text-red-600' };
    if (daysUntilRequired <= 7) return { level: 'high', color: 'text-orange-600' };
    return { level: 'normal', color: 'text-green-600' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.fullName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Last updated</p>
          <p className="text-sm font-medium text-gray-900">
            {new Date().toLocaleString()}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_requests}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending_requests}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed_deliveries}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rating</p>
              <p className="text-2xl font-bold text-purple-600">{stats.average_rating.toFixed(1)}</p>
            </div>
            <Star className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-green-600">Rs. {stats.total_revenue.toFixed(0)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On-Time %</p>
              <p className="text-2xl font-bold text-blue-600">{stats.on_time_delivery_rate.toFixed(0)}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Recent Material Requests */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Recent Material Requests</h2>
            <a href="/supplier/requests" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </a>
          </div>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-2">Loading requests...</p>
            </div>
          ) : recentRequests.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No material requests yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRequests.map((request) => {
                const priority = getPriorityLevel(request.required_by);
                return (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">
                          {request.material_type}
                        </h3>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(request.status)}`}>
                          <span className="mr-1">{getStatusIcon(request.status)}</span>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Required by</p>
                        <p className={`text-sm font-medium ${priority.color}`}>
                          {formatDate(request.required_by)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div>
                          <p className="text-sm text-gray-500">Quantity</p>
                          <p className="font-medium">{request.quantity_required} units</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Request Date</p>
                          <p className="font-medium">{formatDate(request.created_at)}</p>
                        </div>
                        {request.notes && (
                          <div>
                            <p className="text-sm text-gray-500">Notes</p>
                            <p className="text-sm text-gray-700 max-w-md truncate">{request.notes}</p>
                          </div>
                        )}
                      </div>
                      
                      {request.status !== 'delivered' && (
                        <div className="flex items-center space-x-2">
                          {request.status === 'pending' && (
                            <button
                              onClick={() => updateRequestStatus(request.id, 'preparing')}
                              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                            >
                              Start Preparing
                            </button>
                          )}
                          {request.status === 'preparing' && (
                            <button
                              onClick={() => updateRequestStatus(request.id, 'shipped')}
                              className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                            >
                              Mark as Shipped
                            </button>
                          )}
                          {request.status === 'shipped' && (
                            <button
                              onClick={() => updateRequestStatus(request.id, 'delivered')}
                              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                            >
                              Mark as Delivered
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Performance Overview</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Performance charts will be displayed here</p>
            <p className="text-sm text-gray-400 mt-2">
              Track delivery times, customer satisfaction, and revenue trends
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/supplier/requests"
          className="block bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-blue-500" />
            <div>
              <h3 className="font-medium text-gray-900">View All Requests</h3>
              <p className="text-sm text-gray-500">Manage material requests</p>
            </div>
          </div>
        </a>

        <a
          href="/supplier/forecasts"
          className="block bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-green-500" />
            <div>
              <h3 className="font-medium text-gray-900">View Forecasts</h3>
              <p className="text-sm text-gray-500">Check demand forecasts</p>
            </div>
          </div>
        </a>

        <a
          href="/supplier/profile"
          className="block bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3">
            <Star className="h-8 w-8 text-purple-500" />
            <div>
              <h3 className="font-medium text-gray-900">Update Profile</h3>
              <p className="text-sm text-gray-500">Manage your information</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
};

export default EnhancedSupplierDashboard;

