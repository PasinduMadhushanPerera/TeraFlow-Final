const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { testConnection, initializeDatabase } = require('./config/database');
const { errorHandler, notFound, requestLogger } = require('./middleware/error');

// Import route modules
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const customerRoutes = require('./routes/customer');
const supplierRoutes = require('./routes/supplier');
const cartRoutes = require('./routes/cart');
const productionRoutes = require('./routes/production');
const invoiceRoutes = require('./routes/invoice');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const notificationRoutes = require('./routes/notifications');
const inventoryRoutes = require('./routes/inventory');
const recommendationRoutes = require('./routes/recommendations');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-production-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(requestLogger);
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const startTime = process.hrtime();
    await testConnection();
    const diff = process.hrtime(startTime);
    const dbResponseTime = (diff[0] * 1000 + diff[1] * 1e-6).toFixed(2);
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      database: {
        status: 'connected',
        response_time_ms: dbResponseTime
      },
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      database: {
        status: 'disconnected',
        error: error.message
      },
      version: '1.0.0'
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/recommendations', recommendationRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'TerraFlow SCM API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/register': 'User registration',
        'POST /api/login': 'User login',
        'GET /api/profile': 'Get user profile (Protected)',
        'PUT /api/profile': 'Update user profile (Protected)',
        'PUT /api/change-password': 'Change password (Protected)'
      },
      admin: {
        'GET /api/admin/dashboard/stats': 'Dashboard statistics',
        'GET /api/admin/users': 'Get all users',
        'PUT /api/admin/users/:id/status': 'Update user status',
        'DELETE /api/admin/users/:id': 'Delete user',
        'GET /api/admin/orders': 'Get all orders',
        'PUT /api/admin/orders/:id/status': 'Update order status',
        'GET /api/admin/suppliers': 'Get all suppliers',
        'GET /api/admin/material-requests': 'Get material requests',
        'POST /api/admin/material-requests': 'Create material request',
        'GET /api/admin/reports/:type': 'Get reports (sales, inventory, suppliers)'
      },
      products: {
        'GET /api/products': 'Get all products with filtering',
        'GET /api/products/categories': 'Get product categories',
        'GET /api/products/low-stock': 'Get low stock products (Admin)',
        'GET /api/products/:id': 'Get product by ID',
        'POST /api/products': 'Create product (Admin)',
        'PUT /api/products/:id': 'Update product (Admin)',
        'DELETE /api/products/:id': 'Delete product (Admin)',
        'GET /api/products/:id/inventory-history': 'Get inventory history (Admin)'
      },
      orders: {
        'POST /api/orders/create-from-cart': 'Create order from cart',
        'GET /api/orders/my-orders': 'Get customer orders',
        'GET /api/orders/:id': 'Get order details',
        'POST /api/orders/:id/cancel': 'Cancel order',
        'GET /api/orders': 'Get all orders (Admin)',
        'PUT /api/orders/:id/status': 'Update order status (Admin)',
        'GET /api/orders/statistics/overview': 'Get order statistics (Admin)'
      },
      customer: {
        'GET /api/customer/dashboard': 'Customer dashboard',
        'GET /api/customer/products': 'Get products',
        'GET /api/customer/orders': 'Get customer orders',
        'POST /api/customer/orders': 'Create order',
        'PUT /api/customer/orders/:id/cancel': 'Cancel order'
      },
      supplier: {
        'GET /api/supplier/dashboard': 'Supplier dashboard',
        'GET /api/supplier/requests': 'Get material requests',
        'PUT /api/supplier/requests/:id/status': 'Update request status',
        'PUT /api/supplier/requests/:id/confirm-delivery': 'Confirm delivery',
        'GET /api/supplier/history': 'Delivery history',
        'GET /api/supplier/forecast': 'Forecast data'
      },
      cart: {
        'GET /api/cart': 'Get customer cart items',
        'POST /api/cart/add': 'Add item to cart',
        'PUT /api/cart/item/:id': 'Update cart item quantity',
        'DELETE /api/cart/item/:id': 'Remove item from cart',
        'DELETE /api/cart/clear': 'Clear entire cart'
      },
      production: {
        'GET /api/production/recommendations/generate': 'Generate production recommendations',
        'POST /api/production/recommendations/save': 'Save recommendations',
        'GET /api/production/recommendations': 'Get saved recommendations',
        'PUT /api/production/recommendations/:id/implement': 'Mark recommendation as implemented',
        'GET /api/production/analytics': 'Get production analytics'
      },
      invoices: {
        'POST /api/invoices/generate/:order_id': 'Generate invoice for order',
        'GET /api/invoices/pdf/:invoice_id': 'Download invoice PDF',
        'GET /api/invoices': 'Get all invoices (admin)',
        'PUT /api/invoices/:id/status': 'Update invoice status',
        'POST /api/invoices/payments': 'Create payment record',
        'PUT /api/invoices/payments/:id/status': 'Update payment status',
        'GET /api/invoices/payments': 'Get payment history'
      },
      notifications: {
        'GET /api/notifications': 'Get user notifications',
        'GET /api/notifications/stats': 'Get notification statistics',
        'PATCH /api/notifications/:id/read': 'Mark notification as read',
        'PATCH /api/notifications/mark-all-read': 'Mark all notifications as read',
        'POST /api/notifications': 'Create notification (Admin)'
      },
      inventory: {
        'GET /api/inventory/overview': 'Get inventory overview with statistics',
        'GET /api/inventory/alerts': 'Get inventory alerts and recommendations',
        'GET /api/inventory/movements': 'Get inventory movements history',
        'POST /api/inventory/movements': 'Add inventory movement (stock in/out)',
        'PUT /api/inventory/bulk-update': 'Bulk update stock levels',
        'GET /api/inventory/reports': 'Generate inventory reports'
      }
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    message: 'TerraFlow Backend is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Handle 404 errors
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🚀 Starting TerraFlow Backend Server...');
    
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Please check your database configuration.');
      process.exit(1);
    }

    // Initialize database tables
    await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API Documentation: http://localhost:${PORT}/api`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
      console.log('');
      console.log('🔧 Database Configuration:');
      console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
      console.log(`   Database: ${process.env.DB_NAME || 'terraflow_scm'}`);
      console.log(`   Port: ${process.env.DB_PORT || 3306}`);
      console.log('');
      console.log('👤 Default Admin Account:');
      console.log('   Email: admin@terraflow.com');
      console.log('   Password: admin123');
      console.log('');
      console.log('🎯 Ready to accept connections!');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
