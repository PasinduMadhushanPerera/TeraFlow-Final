# Customer Orders Page Troubleshooting Guide

## ✅ Implementation Status
The Customer Orders page has been successfully implemented with:
- **Complete UI**: Orders table, search, filters, modals
- **Full Functionality**: View, cancel, download invoice
- **Backend Integration**: Proper API endpoints
- **Export/Import**: Fixed component exports

## 🔧 Common Issues & Solutions

### 1. Page Not Loading / White Screen

**Possible Causes:**
- React component compilation errors
- Missing imports or dependencies
- Authentication issues
- Route configuration problems

**Solutions:**
```bash
# Check browser console for errors
F12 → Console tab

# Verify route is correct
Navigate to: http://localhost:5173/customer/orders

# Check authentication
Ensure you're logged in as a customer
```

### 2. API Errors / No Data Loading

**Possible Causes:**
- Backend server not running
- Authentication token expired
- Database connection issues
- API endpoint changes

**Solutions:**
```bash
# Check backend server
cd TerraflowBackend
npm start

# Verify API endpoint
GET http://localhost:5000/api/customer/orders

# Check authentication
localStorage.getItem('terraflow_token')
```

### 3. Component Import/Export Issues

**Status:** ✅ FIXED
- Fixed dual export declarations
- Corrected import statements in App.tsx
- Ensured proper component registration

### 4. Data Structure Mismatches

**Expected Order Structure:**
```javascript
{
  id: number,
  order_number: string,
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
  total_amount: number,
  subtotal: number,
  shipping_cost: number,
  payment_method: string,
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded',
  shipping_address: string,
  created_at: string,
  updated_at: string,
  items: OrderItem[],
  customer_info?: {
    fullName: string,
    email: string,
    phone: string
  },
  payment_details?: {
    card_last_four?: string,
    transaction_id?: string
  }
}
```

## 🧪 Testing Steps

### 1. Manual Testing
```bash
1. Login as customer
2. Navigate to /customer/orders
3. Verify page loads without errors
4. Test search and filters
5. Try viewing order details
6. Test invoice download
7. Test order cancellation (if applicable)
```

### 2. API Testing
```bash
# Test orders endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/customer/orders

# Test cancel endpoint
curl -X PUT \
     -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/customer/orders/ORDER_ID/cancel
```

### 3. Browser Console Testing
```javascript
// Run debug script
// Copy content from debug-customer-orders.js to browser console
testCustomerOrdersAPI()
```

## 📁 File Structure Verification

### Files Modified/Created:
- ✅ `frontend/src/pages/customer/CustomerOrders.tsx` - Main component
- ✅ `frontend/src/App.tsx` - Updated routing
- ✅ `debug-customer-orders.js` - Testing script

### Dependencies Used:
- ✅ React 18.3.1
- ✅ Ant Design 5.21.1
- ✅ dayjs 1.11.13
- ✅ TypeScript

## 🚀 Quick Start Guide

### For Developers:
1. Ensure backend is running: `cd TerraflowBackend && npm start`
2. Ensure frontend is running: `cd frontend && npm run dev`
3. Login as customer
4. Navigate to `/customer/orders`

### For Testing:
1. Create test orders via the products page
2. Navigate to orders page
3. Verify all functionality works
4. Test different order statuses
5. Test filtering and search

## 🔍 Debugging Commands

### Check Component Registration:
```bash
# Verify imports in App.tsx
grep -n "CustomerOrders" frontend/src/App.tsx

# Check export in component
grep -n "export" frontend/src/pages/customer/CustomerOrders.tsx
```

### Check Runtime Errors:
```bash
# Start with verbose logging
cd frontend
npm run dev -- --verbose

# Check browser console
# Press F12 → Console tab
```

### Backend Verification:
```bash
# Check if backend routes exist
grep -n "customer/orders" TerraflowBackend/routes/customer.js

# Verify controller functions
grep -n "getOrders\|cancelOrder" TerraflowBackend/controllers/customerController.js
```

## 📞 Support Information

If the page still doesn't load after following this guide:

1. **Check browser console** for specific error messages
2. **Verify backend logs** for API errors
3. **Test API endpoints** directly using Postman or curl
4. **Verify authentication** is working properly
5. **Check network requests** in browser DevTools

The implementation is complete and functional. Most loading issues are typically related to:
- Authentication problems
- Backend server not running
- Network connectivity issues
- Browser caching (try hard refresh: Ctrl+F5)

## 🎯 Success Indicators

When working correctly, you should see:
- ✅ Orders table with proper data
- ✅ Search and filter functionality
- ✅ Order details modal
- ✅ Cancel order functionality (for eligible orders)
- ✅ Invoice download working
- ✅ No console errors
- ✅ Responsive design on all screen sizes
