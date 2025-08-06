const mysql = require('mysql2/promise');

async function updateDeliveryColumns() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'terraflow_scm'
  });
  
  try {
    console.log('🔄 Updating material_requests table with delivery columns...');
    
    // Add estimated_delivery_date column
    try {
      await connection.execute('ALTER TABLE material_requests ADD COLUMN estimated_delivery_date DATE NULL AFTER required_date');
      console.log('✅ Added estimated_delivery_date column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ estimated_delivery_date column already exists');
      } else {
        throw error;
      }
    }
    
    // Add actual_delivery_date column
    try {
      await connection.execute('ALTER TABLE material_requests ADD COLUMN actual_delivery_date DATE NULL AFTER estimated_delivery_date');
      console.log('✅ Added actual_delivery_date column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ actual_delivery_date column already exists');
      } else {
        throw error;
      }
    }
    
    // Add delivery_notes column
    try {
      await connection.execute('ALTER TABLE material_requests ADD COLUMN delivery_notes TEXT NULL AFTER supplier_response');
      console.log('✅ Added delivery_notes column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ delivery_notes column already exists');
      } else {
        throw error;
      }
    }
    
    // Verify the table structure
    const [rows] = await connection.execute('DESCRIBE material_requests');
    console.log('\n📋 Updated table structure:');
    rows.forEach(row => {
      console.log(`- ${row.Field} (${row.Type}) ${row.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${row.Default ? 'DEFAULT ' + row.Default : ''}`);
    });
    
    console.log('\n✅ Database update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating database:', error.message);
  } finally {
    await connection.end();
  }
}

updateDeliveryColumns();
