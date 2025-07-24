// Test supplier notification when admin creates material request
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testSupplierNotificationFlow() {
  try {
    console.log('🔄 Testing Supplier Notification Flow...\n');
    
    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
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
    console.log('✅ Admin logged in');
    
    // Step 2: Get suppliers
    console.log('\n2️⃣ Getting supplier list...');
    const suppliersResponse = await fetch('http://localhost:5000/api/admin/suppliers', {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const suppliersData = await suppliersResponse.json();
    if (!suppliersData.success || suppliersData.data.length === 0) {
      console.error('❌ No suppliers found');
      return;
    }
    
    const supplier = suppliersData.data[0];
    console.log(`✅ Found supplier: ${supplier.full_name} (ID: ${supplier.id}, Email: ${supplier.email})`);
    
    // Step 3: Check current supplier notifications (baseline)
    console.log('\n3️⃣ Checking supplier notifications (before)...');
    
    // Try to login as supplier (we'll skip if it fails)
    let supplierToken = null;
    try {
      const supplierLogin = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: supplier.email,
          password: 'supplier123' // Try common password
        })
      });
      
      const supplierLoginData = await supplierLogin.json();
      if (supplierLoginData.success) {
        supplierToken = supplierLoginData.token;
        console.log('✅ Supplier logged in successfully');
        
        // Get current notifications
        const currentNotifications = await fetch('http://localhost:5000/api/notifications', {
          headers: {
            'Authorization': `Bearer ${supplierToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        const currentData = await currentNotifications.json();
        console.log(`📊 Supplier has ${currentData.data?.unreadCount || 0} unread notifications`);
      } else {
        console.log('⚠️ Could not login as supplier, will check notifications manually later');
      }
    } catch (error) {
      console.log('⚠️ Supplier login failed, continuing with admin flow only');
    }
    
    // Step 4: Create material request
    console.log('\n4️⃣ Creating material request...');
    const materialRequest = {
      supplier_id: supplier.id,
      material_type: `Test Material - ${new Date().toLocaleTimeString()}`,
      quantity: 150,
      unit: 'kg',
      required_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Testing real-time supplier notification system'
    };
    
    console.log(`📋 Request details: ${materialRequest.quantity} ${materialRequest.unit} of ${materialRequest.material_type}`);
    
    const createResponse = await fetch('http://localhost:5000/api/admin/material-requests', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(materialRequest)
    });
    
    const createData = await createResponse.json();
    if (!createData.success) {
      console.error('❌ Material request creation failed:', createData);
      return;
    }
    
    const requestId = createData.data.id;
    console.log(`✅ Material request created (ID: ${requestId})`);
    
    // Step 5: Check if supplier received notification
    console.log('\n5️⃣ Checking supplier notifications (after)...');
    
    // Wait a moment for notification to be created
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (supplierToken) {
      const newNotifications = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${supplierToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const newData = await newNotifications.json();
      if (newData.success) {
        console.log(`📊 Supplier now has ${newData.data?.unreadCount || 0} unread notifications`);
        
        // Look for our specific notification
        const ourNotification = newData.data.notifications.find(n => 
          n.related_id == requestId && n.type === 'delivery_request'
        );
        
        if (ourNotification) {
          console.log('🎉 SUCCESS! Supplier received the notification');
          console.log(`📬 Title: ${ourNotification.title}`);
          console.log(`💬 Message: ${ourNotification.message}`);
          console.log(`📖 Read status: ${ourNotification.is_read ? 'Read' : 'UNREAD'}`);
        } else {
          console.log('❌ Supplier did not receive the expected notification');
          console.log('🔍 Recent notifications:');
          newData.data.notifications.slice(0, 3).forEach(n => {
            console.log(`  - ${n.title}: ${n.message} (type: ${n.type}, related_id: ${n.related_id})`);
          });
        }
      }
    } else {
      console.log('⚠️ Cannot check supplier notifications (login failed)');
      console.log('📧 Supplier should have received notification about the material request');
    }
    
    console.log('\n📋 Frontend Testing Instructions:');
    console.log('1. Login as supplier in another browser tab/window');
    console.log(`2. Use email: ${supplier.email} and password: supplier123`);
    console.log('3. Check the notification bell - should show new notification');
    console.log('4. Run this script again to create more test requests');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSupplierNotificationFlow();
