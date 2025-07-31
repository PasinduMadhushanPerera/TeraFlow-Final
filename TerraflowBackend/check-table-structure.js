const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'terraflow_scm',
  port: process.env.DB_PORT || 3306
};

const checkTableStructure = async () => {
  try {
    console.log('🔍 Checking products table structure...');
    const connection = await mysql.createConnection(dbConfig);
    
    // Check table structure
    const [columns] = await connection.execute('DESCRIBE products');
    console.log('📋 Products table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    // Check sample data
    const [products] = await connection.execute('SELECT * FROM products LIMIT 2');
    console.log('\n📦 Sample products:');
    if (products.length > 0) {
      console.log('Available fields:', Object.keys(products[0]));
      console.log('First product:', products[0]);
    } else {
      console.log('No products found');
    }
    
    await connection.end();
    console.log('✅ Table structure check completed');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
};

checkTableStructure();
