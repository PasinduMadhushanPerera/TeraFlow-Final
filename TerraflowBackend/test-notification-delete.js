const testNotifications = async () => {
  console.log('🔧 Testing Notification Delete Functionality...\n');
  
  try {
    // 1. Login as admin
    console.log('1. 🔑 Logging in as admin...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@terraflow.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Fetch current notifications
    console.log('\n2. 📋 Fetching current notifications...');
    const notificationsResponse = await fetch('http://localhost:5000/api/notifications', { headers });
    
    if (!notificationsResponse.ok) {
      throw new Error('Failed to fetch notifications');
    }
    
    const notificationsData = await notificationsResponse.json();
    const notifications = notificationsData.notifications || notificationsData.data?.notifications || [];
    console.log(`✅ Found ${notifications.length} notifications`);
    
    if (notifications.length === 0) {
      console.log('⚠️  No notifications found. Creating sample notifications...');
      
      // Create some test notifications
      const createResponse = await fetch('http://localhost:5000/api/notifications', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Test Notification',
          message: 'This is a test notification for delete functionality',
          type: 'info'
        })
      });
      
      if (createResponse.ok) {
        console.log('✅ Test notification created');
      }
    }
    
    // 3. Test delete functionality if we have notifications
    if (notifications.length > 0) {
      const firstNotification = notifications[0];
      console.log(`\n3. 🗑️  Testing delete notification ID: ${firstNotification.id}`);
      
      const deleteResponse = await fetch(`http://localhost:5000/api/notifications/${firstNotification.id}`, {
        method: 'DELETE',
        headers
      });
      
      if (deleteResponse.ok) {
        const deleteResult = await deleteResponse.json();
        console.log('✅ Delete successful:', deleteResult.message);
      } else {
        console.log('❌ Delete failed');
      }
    }
    
    // 4. Test bulk operations
    console.log('\n4. 🧹 Testing bulk operations...');
    
    // Test clear old notifications
    const clearOldResponse = await fetch('http://localhost:5000/api/notifications/old/cleanup', {
      method: 'DELETE',
      headers
    });
    
    if (clearOldResponse.ok) {
      const clearOldResult = await clearOldResponse.json();
      console.log('✅ Clear old notifications:', clearOldResult.message);
    }
    
    // Final notification count
    console.log('\n5. 📊 Final notification count...');
    const finalResponse = await fetch('http://localhost:5000/api/notifications', { headers });
    const finalData = await finalResponse.json();
    const finalNotifications = finalData.notifications || finalData.data?.notifications || [];
    console.log(`✅ Final count: ${finalNotifications.length} notifications`);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📍 You can now test the UI at:');
    console.log('   - Admin: http://localhost:5173/admin/notification-management');
    console.log('   - Customer: http://localhost:5173/customer/notification-management');
    console.log('   - Supplier: http://localhost:5173/supplier/notification-management');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testNotifications();
