const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'terraflow_scm',
  port: process.env.DB_PORT || 3306
};

const fixDatabase = async () => {
  try {
    console.log('🔧 Fixing database foreign key issues...');
    const connection = await mysql.createConnection(dbConfig);
    
    // Disable foreign key checks temporarily
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('✅ Disabled foreign key checks');
    
    // Clear problematic tables
    await connection.execute('DELETE FROM production_recommendations');
    await connection.execute('DELETE FROM order_items');
    await connection.execute('DELETE FROM orders');
    await connection.execute('DELETE FROM products');
    await connection.execute('DELETE FROM notifications WHERE user_id NOT IN (SELECT id FROM users)');
    console.log('✅ Cleared problematic data');
    
    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Re-enabled foreign key checks');
    
    await connection.end();
    console.log('✅ Database fix completed');
    
  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
  }
};

fixDatabase();
