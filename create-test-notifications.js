// Create test notifications to verify frontend interaction
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function createTestNotifications() {
  try {
    console.log('🧪 Creating test notifications...\n');
    
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
    const adminUserId = loginData.user.id;
    
    console.log('✅ Admin logged in');
    console.log('Admin ID:', adminUserId);
    
    // Create a few test notifications
    const notifications = [
      {
        user_id: adminUserId,
        type: 'material_update',
        title: '🔥 URGENT: New Material Request',
        message: 'Supplier needs immediate approval for cement delivery. Expected delivery: Tomorrow',
        related_type: 'material_request',
        related_id: 99
      },
      {
        user_id: adminUserId,
        type: 'order_update',
        title: '📦 Order Status Update',
        message: 'Order #ORD-2024-001 has been shipped and is on the way to customer',
        related_type: 'order',
        related_id: 100
      },
      {
        user_id: adminUserId,
        type: 'stock_alert',
        title: '⚠️ Critical Stock Alert',
        message: 'Sand Premium Grade is critically low (2 units remaining). Minimum required: 50 units',
        related_type: 'product',
        related_id: 101
      }
    ];
    
    for (let i = 0; i < notifications.length; i++) {
      const notif = notifications[i];
      console.log(`Creating notification ${i + 1}: ${notif.title}`);
      
      const response = await fetch('http://localhost:5000/api/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notif)
      });
      
      const result = await response.json();
      if (result.success) {
        console.log(`✅ Created notification ID: ${result.data.id}`);
      } else {
        console.log(`❌ Failed to create notification: ${result.message}`);
      }
      
      // Wait a bit between notifications
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Check final state
    console.log('\n📊 Final check...');
    const finalResponse = await fetch('http://localhost:5000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const finalData = await finalResponse.json();
    console.log(`Total notifications: ${finalData.data.notifications.length}`);
    
    const unread = finalData.data.notifications.filter(n => !n.is_read);
    console.log(`Unread notifications: ${unread.length}`);
    
    if (unread.length > 0) {
      console.log('\n🔔 Unread notifications:');
      unread.forEach(n => {
        console.log(`  - ${n.title} (ID: ${n.id})`);
      });
    }
    
    console.log('\n🎯 Now check the frontend at http://localhost:5174');
    console.log('   1. Login as admin (admin@terraflow.com / admin123)');
    console.log('   2. Look for the notification bell in the top-right');
    console.log('   3. It should show a red badge with the unread count');
    console.log('   4. Click the bell to see the notifications dropdown');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestNotifications();
