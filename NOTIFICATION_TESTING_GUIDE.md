🔍 NOTIFICATION SYSTEM TESTING GUIDE
=====================================

This guide will help you verify that the interactive notification system is working properly.

📋 QUICK TEST CHECKLIST:
========================
1. ✅ Backend server running on port 5000
2. ✅ Frontend running on port 5173
3. ✅ Admin and supplier accounts working
4. ✅ Material request creation triggers notifications
5. ✅ Supplier responses trigger admin notifications
6. ✅ Real-time polling updates notifications

🧪 AUTOMATED TESTS (Run these commands):
========================================

1. CHECK BACKEND SERVER STATUS:
   ```
   netstat -ano | findstr :5000
   ```
   Should show: TCP 0.0.0.0:5000 ... LISTENING

2. RESET TEST DATA:
   ```
   node check-database-status.js
   ```
   This resets a material request to "pending" status for testing.

3. TEST NOTIFICATION FLOW:
   ```
   node test-supplier-response.js
   ```
   Expected output: "🎉 SUCCESS! Admin notification found"

4. VERIFY COMPLETE SYSTEM:
   ```
   node test-confirmation.js
   ```
   Shows all notifications in the database.

📱 MANUAL FRONTEND TESTING:
===========================

STEP 1: Login as Admin
----------------------
1. Open http://localhost:5173
2. Login with:
   - Email: admin@terraflow.com
   - Password: admin123
3. Check the notification bell icon (top right)
4. Should show unread notification count

STEP 2: Create Material Request
-------------------------------
1. Go to Admin Dashboard → Material Requests
2. Click "Create New Request"
3. Fill in:
   - Supplier: Select any supplier
   - Material: "Test Material for Notifications"
   - Quantity: 100
   - Unit: kg
   - Required Date: Any future date
4. Click "Create Request"
5. This should trigger a notification to the supplier

STEP 3: Login as Supplier
-------------------------
1. Open new browser tab: http://localhost:5173
2. Login with:
   - Email: kanushka@gmail.com
   - Password: kanushka123
3. Check notification bell - should show new material request notification
4. Go to Supplier Dashboard → Material Requests
5. Find the request you just created
6. Update status to "Approved" with a response message
7. Click "Update Status"

STEP 4: Check Admin Notifications
---------------------------------
1. Switch back to admin tab
2. Wait 15-20 seconds (for polling to update)
3. Check notification bell - should show new count
4. Click notification bell to see dropdown
5. Should see "Supplier has approved the [material] request"
6. Go to Admin → Notifications page to see full list

🔧 DEBUG COMMANDS:
==================

CHECK NOTIFICATION DATABASE:
```
node debug-notifications.js
```
This shows the raw API response and notification structure.

CHECK SERVER LOGS:
The backend server console shows debug output when notifications are created.
Look for: "✅ Creating notification for admin..." and "✅ Notification created successfully!"

CHECK SPECIFIC USER NOTIFICATIONS:
```
# Admin notifications
curl -H "Authorization: Bearer [ADMIN_TOKEN]" http://localhost:5000/api/notifications

# Supplier notifications  
curl -H "Authorization: Bearer [SUPPLIER_TOKEN]" http://localhost:5000/api/notifications
```

🚨 TROUBLESHOOTING:
===================

IF BACKEND NOT RUNNING:
```
node "c:\Users\ASUS\Desktop\TeraFlow-FInal-Final\TeraFlow-Final\TerraflowBackend\server.js"
```

IF NO PENDING REQUESTS:
```
node check-database-status.js
```
This resets a request to pending status.

IF NOTIFICATIONS NOT SHOWING:
1. Check browser console for JavaScript errors
2. Verify NotificationBell component is polling (every 15 seconds)
3. Check that the notification type is correctly mapped in the frontend
4. Verify admin user ID matches the notification user_id

IF DATABASE ISSUES:
```
node setup-db.js
```
This reinitializes the database with test data.

📊 EXPECTED BEHAVIOR:
====================

WORKING NOTIFICATION FLOW:
1. Admin creates material request → Supplier gets "New Material Request" notification
2. Supplier updates request status → Admin gets "Material Request Update" notification
3. Notifications appear in real-time (within 15 seconds)
4. Unread count updates automatically
5. Clicking notifications marks them as read
6. Navigation to full notifications page works

NOTIFICATION TYPES:
- material_request: Sent to suppliers when admin creates requests
- material_update: Sent to admin when supplier updates request status
- order_update: Order status changes
- stock_alert: Low inventory alerts
- system_alert: System maintenance, etc.

🎯 SUCCESS INDICATORS:
======================
✅ Backend console shows "✅ Notification created successfully!"
✅ Test script shows "🎉 SUCCESS! Admin notification found"
✅ Frontend notification bell shows unread count
✅ Dropdown displays recent notifications
✅ Notifications page lists all notifications
✅ Real-time updates work (15-second polling)
✅ No console errors in browser

📝 TEST RESULTS LOG:
====================
Run each test and mark results:

[ ] Backend server running on port 5000
[ ] test-supplier-response.js shows SUCCESS
[ ] Admin login successful
[ ] Supplier login successful  
[ ] Material request creation works
[ ] Supplier can see new request notification
[ ] Supplier can update request status
[ ] Admin receives status update notification
[ ] Real-time polling updates notifications
[ ] No JavaScript console errors

🔗 USEFUL URLS:
===============
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Admin Login: admin@terraflow.com / admin123
- Supplier Login: kanushka@gmail.com / kanushka123
- API Health: http://localhost:5000/health
