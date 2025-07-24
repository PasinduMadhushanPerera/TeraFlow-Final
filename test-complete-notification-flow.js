// Check if supplier received the notification
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function checkSupplierNotifications() {
  try {
    console.log('🔍 Checking Supplier Notifications...\n');
    
    // We'll create a test supplier account that we can login to
    console.log('1️⃣ Creating test supplier account...');
    
    // Login as admin first
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
    
    // Create a test supplier
    const createSupplier = await fetch('http://localhost:5000/api/admin/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        full_name: 'Test Supplier',
        email: 'testsupplier@notifications.com',
        password: 'supplier123',
        mobile: '1234567890',
        address: 'Test Address',
        business_name: 'Test Supplier Business',
        role: 'supplier'
      })
    });
    
    const supplierResult = await createSupplier.json();
    let testSupplierId;
    
    if (supplierResult.success) {
      testSupplierId = supplierResult.data.id;
      console.log(`✅ Test supplier created (ID: ${testSupplierId})`);
    } else {
      // Supplier might already exist
      console.log('⚠️ Supplier might already exist, trying to login...');
      
      // Try to login with existing credentials
      const supplierLogin = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'testsupplier@notifications.com',
          password: 'supplier123'
        })
      });
      
      const loginResult = await supplierLogin.json();
      if (loginResult.success) {
        testSupplierId = loginResult.user.id;
        console.log(`✅ Using existing supplier (ID: ${testSupplierId})`);
      } else {
        console.log('❌ Could not create or login test supplier');
        return;
      }
    }
    
    // Create material request for the test supplier
    console.log('\n2️⃣ Creating material request for test supplier...');
    const materialRequest = {
      supplier_id: testSupplierId,
      material_type: `Notification Test Material - ${new Date().toLocaleTimeString()}`,
      quantity: 200,
      unit: 'units',
      required_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Testing supplier notification system'
    };
    
    const createRequest = await fetch('http://localhost:5000/api/admin/material-requests', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(materialRequest)
    });
    
    const requestResult = await createRequest.json();
    if (!requestResult.success) {
      console.error('❌ Material request creation failed:', requestResult);
      return;
    }
    
    const requestId = requestResult.data.id;
    console.log(`✅ Material request created (ID: ${requestId})`);
    
    // Wait a moment for notification to be created
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Login as the test supplier and check notifications
    console.log('\n3️⃣ Logging in as test supplier...');
    const supplierLogin = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testsupplier@notifications.com',
        password: 'supplier123'
      })
    });
    
    const supplierData = await supplierLogin.json();
    if (!supplierData.success) {
      console.error('❌ Supplier login failed:', supplierData);
      return;
    }
    
    const supplierToken = supplierData.token;
    console.log('✅ Supplier logged in successfully');
    
    // Check supplier notifications
    console.log('\n4️⃣ Checking supplier notifications...');
    const notificationsResponse = await fetch('http://localhost:5000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${supplierToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const notificationsData = await notificationsResponse.json();
    if (notificationsData.success) {
      console.log(`📊 Supplier has ${notificationsData.data?.unreadCount || 0} unread notifications`);
      console.log(`📋 Total notifications: ${notificationsData.data.notifications.length}`);
      
      // Look for our specific notification
      const ourNotification = notificationsData.data.notifications.find(n => 
        n.related_id == requestId && n.type === 'delivery_request'
      );
      
      if (ourNotification) {
        console.log('\n🎉 SUCCESS! Supplier received the notification');
        console.log(`📬 Title: ${ourNotification.title}`);
        console.log(`💬 Message: ${ourNotification.message}`);
        console.log(`📖 Read status: ${ourNotification.is_read ? 'Read' : 'UNREAD'}`);
        console.log(`⏰ Created: ${new Date(ourNotification.created_at).toLocaleString()}`);
        
        console.log('\n✅ REAL-TIME NOTIFICATION SYSTEM IS WORKING!');
        console.log('\n📋 Frontend Testing Steps:');
        console.log('1. Open http://localhost:5173 in browser');
        console.log('2. Login as supplier:');
        console.log('   Email: testsupplier@notifications.com');
        console.log('   Password: supplier123');
        console.log('3. Check notification bell - should show unread notification');
        console.log('4. Create more material requests as admin and watch real-time updates');
        
      } else {
        console.log('\n❌ Supplier did not receive the expected notification');
        console.log('🔍 Recent notifications:');
        notificationsData.data.notifications.slice(0, 5).forEach(n => {
          console.log(`  - ${n.title}: ${n.message} (type: ${n.type}, related_id: ${n.related_id})`);
        });
      }
    } else {
      console.error('❌ Failed to fetch supplier notifications:', notificationsData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

checkSupplierNotifications();
