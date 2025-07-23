const { pool } = require('./config/database');

const checkDatabase = async () => {
  try {
    console.log('🔍 Checking database status...');
    
    // Check admin user
    const [users] = await pool.execute('SELECT id, email, role FROM users WHERE role = ?', ['admin']);
    console.log('Admin users found:', users.length);
    if (users.length > 0) {
      console.log('✅ Admin user exists:', users[0]);
    } else {
      console.log('❌ No admin users found!');
    }
    
    // Check products table structure
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'terraflow_scm']);
    
    console.log('\n📋 Products table columns:');
    columns.forEach(col => {
      console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
    });
    
    // Check if image columns exist
    const imageColumns = columns.filter(col => 
      col.COLUMN_NAME === 'image_url' || col.COLUMN_NAME === 'gallery_images'
    );
    console.log('\n🖼️  Image columns:');
    imageColumns.forEach(col => {
      console.log(`   ✅ ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
    });
    
    // Test product count
    const [productCount] = await pool.execute('SELECT COUNT(*) as count FROM products');
    console.log(`\n📦 Total products: ${productCount[0].count}`);
    
    console.log('\n✅ Database check completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  }
};

checkDatabase();
