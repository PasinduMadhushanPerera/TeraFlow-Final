const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'terraflow_scm',
  port: process.env.DB_PORT || 3306
};

const clearDuplicateUsers = async () => {
  try {
    console.log('🔧 Clearing duplicate users...');
    const connection = await mysql.createConnection(dbConfig);
    
    // Delete only the sample customer and supplier users, keep admin
    await connection.execute('DELETE FROM users WHERE email IN (?, ?)', ['customer@example.com', 'supplier@clayworks.com']);
    console.log('✅ Removed duplicate sample users');
    
    await connection.end();
    console.log('✅ User cleanup completed');
    
  } catch (error) {
    console.error('❌ User cleanup failed:', error.message);
  }
};

clearDuplicateUsers();
