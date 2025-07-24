// Test real-time notifications - create unread notification and check polling
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testRealTimeNotifications() {
  try {
    console.log('🔄 Testing Real-Time Notification Polling...\n');
    
    // Login as admin
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@terraflow.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Admin logged in');
    
    // Create a fresh unread notification
    console.log('📬 Creating new unread notification...');
    const createResponse = await fetch('http://localhost:5000/api/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: 1,
        type: 'real_time_test',
        title: '🚨 URGENT: Real-Time Test',
        message: `NEW notification created at ${new Date().toLocaleTimeString()} - Should appear immediately!`,
        related_type: 'test',
        related_id: Date.now()
      })
    });
    
    const createData = await createResponse.json();
    if (createData.success) {
      console.log(`✅ Created notification ID: ${createData.data.id}`);
      
      // Check if it appears in the list immediately
      console.log('\n🔍 Checking if notification appears in list...');
      const checkResponse = await fetch('http://localhost:5000/api/notifications?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const checkData = await checkResponse.json();
      console.log('📊 Current notifications (top 5):');
      checkData.data.notifications.forEach((notif, index) => {
        const readStatus = notif.is_read ? '✅ Read' : '🔴 UNREAD';
        console.log(`  ${index + 1}. ${notif.title} - ${readStatus} (ID: ${notif.id})`);
      });
      
      console.log(`\n🎯 Unread count: ${checkData.data?.unreadCount || 0}`);
      
      // Check if our new notification is in the list
      const ourNotification = checkData.data.notifications.find(n => n.id === createData.data.id);
      if (ourNotification) {
        console.log('🎉 SUCCESS: New notification appears in the list!');
        console.log(`📝 Title: ${ourNotification.title}`);
        console.log(`📖 Read status: ${ourNotification.is_read ? 'Read' : 'UNREAD'}`);
      } else {
        console.log('❌ ISSUE: New notification not in the top 5 list');
        
        // Check all notifications
        const allResponse = await fetch('http://localhost:5000/api/notifications?limit=20', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const allData = await allResponse.json();
        const found = allData.data.notifications.find(n => n.id === createData.data.id);
        if (found) {
          console.log('ℹ️ Found in extended list - pagination issue');
        } else {
          console.log('❌ Not found even in extended list - database issue');
        }
      }
      
    } else {
      console.error('❌ Failed to create notification:', createData);
    }
    
    console.log('\n📋 Frontend Testing Instructions:');
    console.log('1. Open http://localhost:5174 in your browser');
    console.log('2. Login as admin (admin@terraflow.com / admin123)');
    console.log('3. Look at the notification bell (top-right corner)');
    console.log('4. Run this script again to create more test notifications');
    console.log('5. Wait up to 15 seconds for real-time updates');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRealTimeNotifications();
