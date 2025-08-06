const { pool } = require('./config/database');

async function updateOrderStatusEnum() {
  try {
    console.log('🔄 Updating orders table to include approved status...');
    
    // Update the ENUM to include 'approved'
    await pool.execute(`
      ALTER TABLE orders 
      MODIFY COLUMN status ENUM(
        'pending',
        'confirmed', 
        'approved',
        'processing',
        'shipped',
        'delivered',
        'cancelled'
      ) DEFAULT 'pending'
    `);
    
    console.log('✅ Successfully updated orders table status ENUM');
    
    // Verify the update
    const [rows] = await pool.execute('SHOW COLUMNS FROM orders LIKE "status"');
    console.log('📋 Updated column definition:');
    console.log('   Type:', rows[0].Type);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating database schema:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

updateOrderStatusEnum();
