const { pool } = require('./TerraflowBackend/config/database');
const bcrypt = require('bcrypt');

async function createTestCustomer() {
  try {
    console.log('🔧 Creating test customer account...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Delete if exists
    await pool.execute('DELETE FROM users WHERE email = ?', ['customer@test.com']);
    
    // Create new customer
    const [result] = await pool.execute(
      'INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)',
      ['customer@test.com', hashedPassword, 'Test Customer', 'customer']
    );
    
    console.log(`✅ Test customer created successfully with ID: ${result.insertId}`);
    console.log('   Email: customer@test.com');
    console.log('   Password: password123');
    
    // Test login
    console.log('\n🔐 Testing login...');
    const fetch = require('node-fetch');
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@test.com',
        password: 'password123'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Login test successful!');
    } else {
      console.log('❌ Login test failed:', data.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

createTestCustomer();
