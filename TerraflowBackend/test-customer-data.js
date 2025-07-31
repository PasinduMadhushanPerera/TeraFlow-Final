const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'terraflow_scm',
  port: process.env.DB_PORT || 3306
};

const testCustomerAuth = async () => {
  try {
    console.log('🔍 Testing customer authentication...');
    const connection = await mysql.createConnection(dbConfig);
    
    // Check if customer user exists
    const [customers] = await connection.execute('SELECT id, email, role FROM users WHERE role = "customer"');
    console.log('👥 Customer users found:', customers);
    
    // Check products
    const [products] = await connection.execute('SELECT COUNT(*) as count FROM products WHERE is_active = true');
    console.log('📦 Active products:', products[0].count);
    
    // Check orders
    const [orders] = await connection.execute('SELECT COUNT(*) as count FROM orders');
    console.log('📋 Total orders:', orders[0].count);
    
    await connection.end();
    console.log('✅ Database check completed');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
};

testCustomerAuth();
