const mysql = require('mysql2/promise');
require('dotenv').config();

const addImageColumns = async () => {
  let connection;
  
  try {
    console.log('🔄 Adding image columns to products table...');
    
    // Connect to MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'terraflow_scm',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database');

    // Check if columns already exist
    console.log('📋 Checking current table structure...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'
    `, [process.env.DB_NAME || 'terraflow_scm']);

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('📄 Existing columns:', existingColumns.join(', '));

    // Add image_url column if it doesn't exist
    if (!existingColumns.includes('image_url')) {
      console.log('🔧 Adding image_url column...');
      await connection.execute(`
        ALTER TABLE products 
        ADD COLUMN image_url VARCHAR(500) DEFAULT NULL 
        AFTER sku
      `);
      console.log('✅ image_url column added');
    } else {
      console.log('✅ image_url column already exists');
    }

    // Add gallery_images column if it doesn't exist
    if (!existingColumns.includes('gallery_images')) {
      console.log('🔧 Adding gallery_images column...');
      await connection.execute(`
        ALTER TABLE products 
        ADD COLUMN gallery_images JSON DEFAULT NULL 
        AFTER image_url
      `);
      console.log('✅ gallery_images column added');
    } else {
      console.log('✅ gallery_images column already exists');
    }

    // Verify the columns were added
    console.log('🔍 Verifying updated table structure...');
    const [updatedColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'terraflow_scm']);

    console.log('📋 Updated products table structure:');
    updatedColumns.forEach(col => {
      console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    console.log('');
    console.log('🎉 Database migration completed successfully!');
    console.log('✅ Products table now supports image uploads');
    console.log('');
    console.log('🔄 Please restart the backend server to apply changes:');
    console.log('   Ctrl+C to stop the server');
    console.log('   npm run dev to restart');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('🔧 Troubleshooting:');
      console.log('1. Check your MySQL username and password in .env file');
      console.log('2. Make sure MySQL is running');
      console.log('3. Verify the user has ALTER privileges');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

addImageColumns();
