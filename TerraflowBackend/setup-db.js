const mysql = require('mysql2/promise');
require('dotenv').config();

const setupDatabase = async () => {
  let connection;
  
  try {
    console.log('🔄 Setting up TerraFlow Database...');
    
    // Connect to MySQL without specifying database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'terraflow_scm';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✅ Database '${dbName}' created or already exists`);    // Use the database
    await connection.query(`USE ${dbName}`);
    console.log(`✅ Using database '${dbName}'`);

    console.log('✅ Database setup completed successfully!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Update the .env file with your MySQL password if needed');
    console.log('2. Run "npm run dev" to start the backend server');
    console.log('3. The server will automatically create all tables and sample data');
    console.log('');
    console.log('👤 Default Admin Account:');
    console.log('   Email: admin@terraflow.com');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Make sure MySQL is running');
    console.log('2. Check your database credentials in .env file');
    console.log('3. Ensure the MySQL user has permission to create databases');
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('4. Verify your MySQL username and password');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

setupDatabase();
