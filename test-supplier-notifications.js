const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'terraflow_scm'
};

async function testSupplierNotifications() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔍 Testing supplier notifications...\n');
    
    // 1. Check if we have any suppliers
    const [suppliers] = await connection.execute(
      'SELECT id, username, email FROM users WHERE role = "supplier"'
    );
    
    console.log(`Found ${suppliers.length} suppliers:`);
    suppliers.forEach(supplier => {
      console.log(`  - ID: ${supplier.id}, Username: ${supplier.username}, Email: ${supplier.email}`);
    });
    
    if (suppliers.length === 0) {
      console.log('\n❌ No suppliers found. Creating a test supplier...');
      
      // Create a test supplier
      const [result] = await connection.execute(
        'INSERT INTO users (username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, NOW())',
        ['test_supplier', 'supplier@test.com', '$2b$10$example_hash', 'supplier']
      );
      
      const newSupplierId = result.insertId;
      console.log(`✅ Created test supplier with ID: ${newSupplierId}`);
      suppliers.push({ id: newSupplierId, username: 'test_supplier', email: 'supplier@test.com' });
    }
    
    // 2. Create test notifications for suppliers
    const testSupplier = suppliers[0];
    console.log(`\n📧 Creating test notifications for supplier ID: ${testSupplier.id}`);
    
    const testNotifications = [
      {
        type: 'material_request',
        title: '📋 New Material Request',
        message: 'You have received a new material delivery request. Please review and update delivery status.',
        priority: 'high',
        action_url: '/supplier/requests/123'
      },
      {
        type: 'delivery_reminder',
        title: '⏰ Delivery Reminder',
        message: 'Reminder: Material delivery for order #456 is due tomorrow.',
        priority: 'normal',
        action_url: '/supplier/requests/456'
      },
      {
        type: 'payment_update',
        title: '💰 Payment Processed',
        message: 'Payment for your recent delivery has been processed and will be reflected in your account within 2-3 business days.',
        priority: 'normal',
        action_url: '/supplier/payments'
      }
    ];
    
    // Insert test notifications
    for (const notification of testNotifications) {
      await connection.execute(
        `INSERT INTO notifications 
         (user_id, type, title, message, priority, action_url, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          testSupplier.id,
          notification.type,
          notification.title,
          notification.message,
          notification.priority,
          notification.action_url
        ]
      );
      console.log(`  ✅ Created: ${notification.title}`);
    }
    
    // 3. Verify notifications were created
    const [notifications] = await connection.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [testSupplier.id]
    );
    
    console.log(`\n📊 Total notifications for supplier: ${notifications.length}`);
    console.log('\nNotification details:');
    notifications.forEach(notif => {
      console.log(`  - ${notif.title} (${notif.priority}) - Read: ${notif.is_read ? 'Yes' : 'No'}`);
    });
    
    // 4. Test notification stats
    const [stats] = await connection.execute(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread,
         SUM(CASE WHEN priority = 'urgent' AND is_read = FALSE THEN 1 ELSE 0 END) as urgent_unread,
         SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as last_24h
       FROM notifications 
       WHERE user_id = ?`,
      [testSupplier.id]
    );
    
    console.log(`\n📈 Notification Statistics:`);
    console.log(`  - Total: ${stats[0].total}`);
    console.log(`  - Unread: ${stats[0].unread}`);
    console.log(`  - Urgent Unread: ${stats[0].urgent_unread}`);
    console.log(`  - Last 24h: ${stats[0].last_24h}`);
    
    console.log('\n✅ Supplier notification test completed successfully!');
    console.log('\n💡 To test in the frontend:');
    console.log(`   1. Login as supplier: ${testSupplier.username}`);
    console.log(`   2. Check the notification bell in the top navigation`);
    console.log(`   3. Click to see the notifications panel`);
    
  } catch (error) {
    console.error('❌ Error testing supplier notifications:', error);
  } finally {
    await connection.end();
  }
}

testSupplierNotifications();
