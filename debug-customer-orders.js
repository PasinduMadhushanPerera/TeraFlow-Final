// Test script for Customer Orders API
// This script can be run in the browser console to test the orders API

async function testCustomerOrdersAPI() {
  console.log('🧪 Testing Customer Orders API...');
  
  try {
    const token = localStorage.getItem('terraflow_token');
    
    if (!token) {
      console.error('❌ No authentication token found. Please login first.');
      return;
    }
    
    console.log('✅ Token found, testing API...');
    
    const response = await fetch('http://localhost:5000/api/customer/orders', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 API Response Status:', response.status);
    
    const result = await response.json();
    console.log('📦 API Response Data:', result);
    
    if (result.success) {
      console.log('✅ API Working! Found', result.data.length, 'orders');
      
      if (result.data.length > 0) {
        console.log('📋 Sample Order Structure:', result.data[0]);
        
        // Check if required fields exist
        const order = result.data[0];
        const requiredFields = [
          'id', 'order_number', 'status', 'total_amount', 
          'created_at', 'items'
        ];
        
        const missingFields = requiredFields.filter(field => !(field in order));
        
        if (missingFields.length === 0) {
          console.log('✅ All required fields present in order data');
        } else {
          console.warn('⚠️ Missing fields:', missingFields);
        }
        
        // Check items structure
        if (order.items && order.items.length > 0) {
          console.log('📦 Sample Item Structure:', order.items[0]);
          
          const requiredItemFields = ['product_name', 'quantity', 'unit_price'];
          const missingItemFields = requiredItemFields.filter(field => !(field in order.items[0]));
          
          if (missingItemFields.length === 0) {
            console.log('✅ All required item fields present');
          } else {
            console.warn('⚠️ Missing item fields:', missingItemFields);
          }
        }
      } else {
        console.log('ℹ️ No orders found - this is normal for new customers');
      }
    } else {
      console.error('❌ API Error:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Network/Server Error:', error);
  }
}

// Test backend structure compatibility
function testOrdersPageCompatibility() {
  console.log('🔍 Testing Orders Page Component Compatibility...');
  
  // Check if required React components are available
  const requiredComponents = [
    'React', 'useState', 'useEffect'
  ];
  
  requiredComponents.forEach(component => {
    try {
      if (typeof window[component] !== 'undefined' || typeof React !== 'undefined') {
        console.log(`✅ ${component} available`);
      }
    } catch (e) {
      console.log(`ℹ️ ${component} check skipped (normal in production)`);
    }
  });
  
  // Check localStorage access
  try {
    const testKey = 'terraflow_test';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    console.log('✅ localStorage access working');
  } catch (e) {
    console.error('❌ localStorage access failed:', e);
  }
  
  console.log('🎯 Run testCustomerOrdersAPI() to test the orders endpoint');
}

// Auto-run compatibility test
testOrdersPageCompatibility();

console.log(`
🚀 Customer Orders Debugging Guide:

1. Run testCustomerOrdersAPI() to test the backend API
2. Check browser console for any React component errors
3. Verify you're logged in as a customer
4. Navigate to /customer/orders to test the page

If issues persist:
- Check browser Network tab for API failures
- Verify backend server is running on port 5000
- Ensure customer authentication is working
`);
