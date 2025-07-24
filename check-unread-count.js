// Direct database check for unread notifications
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function checkUnreadCount() {
  try {
    console.log('🔍 Checking unread count directly...\n');
    
    // Login
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
    
    // Get all notifications with detailed info
    const response = await fetch('http://localhost:5000/api/notifications?limit=10', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('📊 Full response:', JSON.stringify(data, null, 2));
    
    // Check unread status
    const notifications = data.data.notifications;
    let manualUnreadCount = 0;
    
    console.log('\n📋 Notification details:');
    notifications.forEach((notif, index) => {
      const isRead = notif.is_read;
      const status = isRead ? '✅ Read' : '🔴 UNREAD';
      console.log(`  ${index + 1}. ID:${notif.id} - ${status} - ${notif.title}`);
      
      if (!isRead) {
        manualUnreadCount++;
      }
    });
    
    console.log(`\n🎯 API unread count: ${data.data.unreadCount}`);
    console.log(`🔢 Manual count of unread: ${manualUnreadCount}`);
    
    if (data.data.unreadCount !== manualUnreadCount) {
      console.log('❌ MISMATCH! API count differs from manual count');
    } else {
      console.log('✅ Counts match!');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkUnreadCount();
