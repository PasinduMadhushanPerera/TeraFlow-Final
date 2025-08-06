const { pool } = require('./TerraflowBackend/config/database');

async function checkCustomers() {
  try {
    console.log('🔍 Checking customer accounts...');
    
    const [users] = await pool.execute(
      'SELECT id, email, full_name, role FROM users WHERE role = "customer" LIMIT 5'
    );
    
    console.log(`Found ${users.length} customer accounts:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.full_name}) - ID: ${user.id}`);
    });
    
    if (users.length === 0) {
      console.log('\n🆕 Creating test customer account...');
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await pool.execute(
        'INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)',
        ['customer@test.com', hashedPassword, 'Test Customer', 'customer']
      );
      
      console.log('✅ Test customer created: customer@test.com / password123');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkCustomers();
