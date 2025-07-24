const { pool } = require('./config/database');

/**
 * Script to create sample notifications for testing
 */

const createSampleNotifications = async () => {
  try {
    console.log('🔔 Creating sample notifications...');

    // Get users for each role
    const [users] = await pool.execute(`
      SELECT id, role, email FROM users 
      WHERE role IN ('admin', 'customer', 'supplier')
      ORDER BY role
    `);

    console.log(`Found ${users.length} users:`, users.map(u => `${u.role}: ${u.email}`));

    // Sample notifications for each role
    const sampleNotifications = {
      admin: [
        {
          type: 'stock_alert',
          title: '⚠️ Low Stock Alert',
          message: 'Clay Premium Grade A is running low. Current stock: 5, Minimum required: 10',
          related_type: 'product',
          related_id: 1
        },
        {
          type: 'order_update',
          title: '📦 New Order Received',
          message: 'New order #ORD-1234 received from customer John Doe. Total amount: $156.99',
          related_type: 'order',
          related_id: 1
        },
        {
          type: 'system_alert',
          title: '🔧 System Maintenance',
          message: 'Scheduled maintenance will begin at 2 AM tonight. Expected duration: 2 hours',
          related_type: null,
          related_id: null
        }
      ],
      customer: [
        {
          type: 'order_update',
          title: '📦 Order Status Update',
          message: 'Your order #ORD-1234 status has been updated to: SHIPPED',
          related_type: 'order',
          related_id: 1
        },
        {
          type: 'payment_reminder',
          title: '✅ Payment Confirmed',
          message: 'Payment of $156.99 for order #ORD-1234 has been successfully processed.',
          related_type: 'payment',
          related_id: 1
        },
        {
          type: 'system_alert',
          title: '🎉 New Products Available',
          message: 'Check out our latest collection of premium clay products with special discounts!',
          related_type: null,
          related_id: null
        }
      ],
      supplier: [
        {
          type: 'supplier_update',
          title: '📋 New Material Request',
          message: 'You have received a new material delivery request. Please review and update delivery status.',
          related_type: 'material_request',
          related_id: 1
        },
        {
          type: 'order_update',
          title: '🚚 Delivery Update Required',
          message: 'Please update the delivery status for request #REQ-001. Current status: In Transit',
          related_type: 'material_request',
          related_id: 2
        },
        {
          type: 'system_alert',
          title: '📊 Monthly Report Available',
          message: 'Your monthly delivery performance report is now available for download.',
          related_type: null,
          related_id: null
        }
      ]
    };

    // Create notifications for each user
    let totalCreated = 0;
    
    for (const user of users) {
      const notifications = sampleNotifications[user.role] || [];
      
      for (const notification of notifications) {
        await pool.execute(`
          INSERT INTO notifications 
          (user_id, type, title, message, related_type, related_id, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [
          user.id,
          notification.type,
          notification.title,
          notification.message,
          notification.related_type,
          notification.related_id
        ]);
        
        totalCreated++;
      }
      
      console.log(`✅ Created ${notifications.length} notifications for ${user.role}: ${user.email}`);
    }

    console.log(`\n🎉 Successfully created ${totalCreated} sample notifications!`);
    
    // Show notification summary
    const [summary] = await pool.execute(`
      SELECT 
        type,
        COUNT(*) as count,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count
      FROM notifications 
      GROUP BY type
      ORDER BY count DESC
    `);

    console.log('\n📊 Notification Summary:');
    summary.forEach(row => {
      console.log(`  ${row.type}: ${row.count} total (${row.unread_count} unread)`);
    });

  } catch (error) {
    console.error('❌ Error creating sample notifications:', error);
  } finally {
    process.exit(0);
  }
};

// Run the script
createSampleNotifications();
