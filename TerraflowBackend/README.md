# TerraFlow SCM Backend

A comprehensive Supply Chain Management (SCM) backend system built with Node.js, Express, and MySQL, featuring role-based authentication and complete REST API endpoints.

## Features

- **Role-Based Authentication**: Admin, Customer, and Supplier roles with JWT tokens
- **MySQL Database**: Complete relational database with proper relationships
- **RESTful API**: Comprehensive endpoints for all SCM operations
- **Security**: Password hashing, login attempt limiting, and secure authentication
- **Input Validation**: Express-validator for robust data validation
- **Error Handling**: Comprehensive error handling and logging
- **CORS Support**: Configured for frontend integration

## Quick Setup

### Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

1. **Create MySQL Database**:
   ```sql
   CREATE DATABASE terraflow_scm;
   ```

2. **Configure Environment Variables**:
   - Copy `.env` file and update with your MySQL credentials
   - Update `DB_PASSWORD` with your MySQL root password
   - Optionally change other database settings

### 3. Start the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will:
- Automatically create all necessary database tables
- Insert sample data and default admin user
- Start on http://localhost:5000

## Default Admin Account

- **Email**: admin@terraflow.com
- **Password**: admin123

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/profile` - Get user profile (Protected)
- `PUT /api/profile` - Update user profile (Protected)
- `PUT /api/change-password` - Change password (Protected)

### Admin Routes (Admin Only)
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/status` - Update user status
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/products` - Get all products
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/suppliers` - Get all suppliers
- `GET /api/admin/material-requests` - Get material requests
- `POST /api/admin/material-requests` - Create material request
- `GET /api/admin/reports/sales` - Sales reports
- `GET /api/admin/reports/inventory` - Inventory reports
- `GET /api/admin/reports/suppliers` - Supplier reports

### Customer Routes (Customer/Admin Only)
- `GET /api/customer/dashboard` - Customer dashboard
- `GET /api/customer/products` - Get products for purchase
- `GET /api/customer/orders` - Get customer orders
- `POST /api/customer/orders` - Create new order
- `PUT /api/customer/orders/:id/cancel` - Cancel order

### Supplier Routes (Supplier/Admin Only)
- `GET /api/supplier/dashboard` - Supplier dashboard
- `GET /api/supplier/requests` - Get material requests
- `PUT /api/supplier/requests/:id/status` - Update request status
- `PUT /api/supplier/requests/:id/confirm-delivery` - Confirm delivery
- `GET /api/supplier/history` - Delivery history
- `GET /api/supplier/forecast` - Forecast data

## Database Schema

### Users Table
- User authentication and profile information
- Role-based access control (admin, customer, supplier)
- Account status and security features

### Products Table
- Product catalog management
- Inventory tracking with stock levels
- Category-based organization

### Orders Table
- Customer order management
- Order status tracking
- Payment status integration

### Material Requests Table
- Supplier material request system
- Status tracking and delivery management
- Admin approval workflow

### Performance Tracking
- Supplier performance metrics
- Delivery history and ratings
- Inventory movement logs

## Environment Variables

```env
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=terraflow_scm
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Security Settings
BCRYPT_SALT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=900000
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable salt rounds
- **Login Protection**: Account lockout after failed attempts
- **Role Authorization**: Middleware for role-based access control
- **Input Validation**: Express-validator for all endpoints
- **CORS Configuration**: Secure cross-origin resource sharing

## Error Handling

- Comprehensive error middleware
- Database error handling
- Validation error responses
- Development vs production error details

## Development

```bash
# Install dependencies
npm install

# Run in development mode (auto-restart)
npm run dev

# Run in production mode
npm start
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Update CORS origins in server.js
3. Use environment variables for all sensitive data
4. Enable SSL/TLS
5. Use process manager (PM2, Docker, etc.)

## Frontend Integration

This backend is designed to work with the TerraFlow React frontend. Ensure:

1. Frontend is configured to use `http://localhost:5000` as API base URL
2. CORS is properly configured for your frontend domain
3. JWT tokens are stored and sent in Authorization headers

## Support

For issues or questions:
1. Check the API documentation at `/api`
2. Review the error logs in the console
3. Verify database connection and credentials
4. Ensure all environment variables are properly set
