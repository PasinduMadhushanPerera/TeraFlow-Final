# TerraFlow - Clean Project Structure

## 📁 Project Overview
TerraFlow is a complete supply chain management system for pottery and ceramics businesses.

## 🏗️ Project Structure

```
TeraFlow-Final/
├── frontend/                 # React.js Frontend Application
│   ├── src/                 # Source code
│   ├── public/              # Static assets
│   ├── package.json         # Frontend dependencies
│   └── ...                  # React app files
├── TerraflowBackend/        # Node.js Backend API
│   ├── controllers/         # API controllers
│   ├── routes/              # API routes
│   ├── middleware/          # Authentication & validation
│   ├── config/              # Database configuration
│   ├── services/            # Business logic services
│   ├── utils/               # Utility functions
│   ├── uploads/             # File uploads directory
│   ├── server.js            # Main server file
│   ├── package.json         # Backend dependencies
│   └── .env                 # Environment variables
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MySQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TeraFlow-Final
   ```

2. **Install Backend Dependencies**
   ```bash
   cd TerraflowBackend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure Environment**
   ```bash
   cd ../TerraflowBackend
   # Copy .env.example to .env and configure your database settings
   ```

5. **Start the Application**
   
   **Backend (Terminal 1):**
   ```bash
   cd TerraflowBackend
   node server.js
   ```
   
   **Frontend (Terminal 2):**
   ```bash
   cd frontend
   npm run dev
   ```

## 📍 Access URLs

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## 🔐 Default Admin Credentials

- **Email**: admin@terraflow.com
- **Password**: admin123

## 🎯 Key Features

- **Inventory Management**: Track raw materials and finished products
- **Order Processing**: Complete order lifecycle management
- **User Management**: Admin, Customer, and Supplier roles
- **Notifications**: Real-time system notifications
- **Material Requests**: Supplier communication system
- **Dashboard Analytics**: Business insights and reports

## 🛠️ Technology Stack

### Frontend
- React 18.3.1
- TypeScript
- Ant Design UI Framework
- Vite Build Tool

### Backend
- Node.js
- Express.js
- MySQL Database
- JWT Authentication
- Multer File Upload

## 📝 Development Notes

- The project uses a clean architecture with separation of concerns
- All test files and debug utilities have been removed for production readiness
- Database migrations and setup are handled automatically on server start
- File uploads are stored in the `TerraflowBackend/uploads/` directory

## 🔧 Maintenance

- Regular database backups recommended
- Monitor `uploads/` directory size
- Update dependencies regularly
- Check logs for any errors or warnings

## 📞 Support

For technical support or questions about the system, refer to the documentation in the respective frontend and backend directories.

---

**TerraFlow SCM** - Complete Supply Chain Management Solution