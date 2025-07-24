// Debug notification system - check all parts
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugNotificationSystem() {
  try {
    console.log('🔍 Debugging Notification System...\n');
    
    // Step 1: Test admin login
    console.log('1️⃣ Testing admin login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@terraflow.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData);
      return;
    }
    
    const token = loginData.token;
    console.log('✅ Login successful');
    
    // Step 2: Test notifications endpoint
    console.log('\n2️⃣ Testing notifications endpoint...');
    const notifResponse = await fetch('http://localhost:5000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', notifResponse.status);
    const notifData = await notifResponse.json();
    console.log('Notifications data:', JSON.stringify(notifData, null, 2));
    
    // Step 3: Test notification creation
    console.log('\n3️⃣ Testing notification creation...');
    const createResponse = await fetch('http://localhost:5000/api/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: 1, // Admin user ID
        type: 'test_notification',
        title: '🧪 Real-Time Test',
        message: 'This is a NEW test notification created at ' + new Date().toLocaleTimeString(),
        related_type: 'test',
        related_id: 999
      })
    });
    
    const createData = await createResponse.json();
    console.log('Create response:', JSON.stringify(createData, null, 2));
    
    // Step 4: Test notification reading
    if (createData.success && createData.data.id) {
      console.log('\n4️⃣ Testing mark as read...');
      const readResponse = await fetch(`http://localhost:5000/api/notifications/${createData.data.id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const readData = await readResponse.json();
      console.log('Mark as read response:', JSON.stringify(readData, null, 2));
    }
    
    // Step 5: Check final state
    console.log('\n5️⃣ Checking final notifications state...');
    const finalResponse = await fetch('http://localhost:5000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const finalData = await finalResponse.json();
    console.log('Final notifications count:', finalData.data?.notifications?.length || 0);
    console.log('Unread count:', finalData.data?.unreadCount || 0);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugNotificationSystem();
