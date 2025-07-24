// Check supplier data and fix notification issue
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugSupplierData() {
  try {
    console.log('🔍 Debugging Supplier Data...\n');
    
    // Login as admin
    const adminLogin = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@terraflow.com',
        password: 'admin123'
      })
    });
    
    const adminData = await adminLogin.json();
    const adminToken = adminData.token;
    
    // Get suppliers
    console.log('📋 Getting supplier details...');
    const suppliersResponse = await fetch('http://localhost:5000/api/admin/suppliers', {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const suppliersData = await suppliersResponse.json();
    if (suppliersData.success) {
      console.log(`✅ Found ${suppliersData.data.length} suppliers:`);
      suppliersData.data.forEach((supplier, index) => {
        console.log(`  ${index + 1}. ID: ${supplier.id}, Name: ${supplier.full_name}, Email: ${supplier.email}, Active: ${supplier.is_active}`);
      });
      
      // Test notification creation with first active supplier
      const activeSupplier = suppliersData.data.find(s => s.is_active);
      if (activeSupplier) {
        console.log(`\n🧪 Testing notification creation for supplier ID: ${activeSupplier.id}`);
        
        // Try to create notification directly
        const testNotification = await fetch('http://localhost:5000/api/notifications', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: activeSupplier.id,
            type: 'test_supplier_notification',
            title: '🧪 Test Supplier Notification',
            message: `Test notification for supplier ${activeSupplier.full_name}`,
            related_type: 'test',
            related_id: 999
          })
        });
        
        const testResult = await testNotification.json();
        if (testResult.success) {
          console.log('✅ Direct notification creation successful');
          console.log(`📬 Notification ID: ${testResult.data.id}`);
        } else {
          console.log('❌ Direct notification creation failed:', testResult);
        }
      }
    } else {
      console.log('❌ Failed to get suppliers:', suppliersData);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugSupplierData();
