# TerraFlow SCM - Complete Setup Guide

## Prerequisites Installation

### 1. Install MySQL Server

**Option A: XAMPP (Recommended for Development)**
1. Download XAMPP from https://www.apachefriends.org/
2. Install XAMPP to default location (C:\xampp)
3. Start Apache and MySQL services from XAMPP Control Panel
4. MySQL will be available on localhost:3306 with root user and no password

**Option B: MySQL Server Direct Installation**
1. Download MySQL Community Server from https://dev.mysql.com/downloads/mysql/
2. Install with default settings
3. Set root password (or leave empty to match backend config)
4. Ensure MySQL service is running

### 2. Verify Installation
```powershell
# Test MySQL connection (adjust path if needed)
C:\xampp\mysql\bin\mysql.exe -u root -p
# Or if MySQL is in PATH:
mysql -u root -p
```

## Backend Setup

### 1. Install Dependencies
```powershell
cd "C:\Users\ASUS\Desktop\TerraFlow_SCM_Final\TerraFlow_SCM_Final\TerraflowBackend"
npm install
```

### 2. Initialize Database
```powershell
node setup-db.js
```

### 3. Start Backend Server
```powershell
node server.js
# Or with auto-restart:
npm run dev
```

Backend will be available at: http://localhost:5000

## Frontend Setup

### 1. Install Dependencies
```powershell
cd "C:\Users\ASUS\Desktop\TerraFlow_SCM_Final\TerraFlow_SCM_Final\frontend"
npm install
```

### 2. Start Frontend Development Server
```powershell
npm run dev
```

Frontend will be available at: http://localhost:5173

## Default Admin Account
- Email: admin@terraflow.com
- Password: admin123

## Testing the Integration

1. Start backend server (port 5000)
2. Start frontend server (port 5173)
3. Navigate to http://localhost:5173
4. Try logging in with admin credentials
5. Test different user roles and API endpoints

## Troubleshooting

### Backend Issues:
- **Database Connection Error**: Ensure MySQL is running
- **Port 5000 in use**: Change PORT in .env file
- **Module not found**: Run `npm install` in backend directory

### Frontend Issues:
- **Port 5173 in use**: Vite will suggest alternative port
- **API calls failing**: Ensure backend is running on port 5000
- **CORS errors**: Check CORS configuration in server.js

### Common Solutions:
1. Restart both servers
2. Clear browser cache and localStorage
3. Check Windows Firewall settings
4. Verify all dependencies are installed
