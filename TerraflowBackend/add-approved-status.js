const mysql = require('mysql2/promise');

async function addApprovedStatus() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Update with your MySQL password if needed
    database: 'terraflow_scm'
  });

  try {
    console.log('🔧 Adding "approved" status to orders table...');
    
    // Modify the orders table to add 'approved' status
    await connection.execute(`
      ALTER TABLE orders 
      MODIFY COLUMN status ENUM('pending', 'confirmed', 'approved', 'processing', 'shipped', 'delivered', 'cancelled') 
      DEFAULT 'pending'
    `);
    
    console.log('✅ Successfully added "approved" status to orders table');
    console.log('📋 Available order statuses now: pending, confirmed, approved, processing, shipped, delivered, cancelled');
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ "approved" status already exists in orders table');
    } else {
      console.error('❌ Error adding approved status:', error.message);
    }
  } finally {
    await connection.end();
  }
}

// Run the migration
addApprovedStatus().catch(console.error);
