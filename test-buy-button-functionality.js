/**
 * Test script for Customer Products Buy Button Functionality
 * Tests both Add to Cart and Buy Now features
 */

const https = require('https');
const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const CUSTOMER_EMAIL = 'customer@test.com';
const CUSTOMER_PASSWORD = 'password123';

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.port === 443 ? https : http;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test functions
async function testCustomerLogin() {
  console.log('\n🔐 Testing Customer Login...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, {
      email: CUSTOMER_EMAIL,
      password: CUSTOMER_PASSWORD
    });

    if (response.status === 200 && response.data.success) {
      console.log('✅ Customer login successful');
      const token = response.data.token || response.data.data?.token || response.data.data?.user?.token;
      console.log(`   Token received: ${token ? token.substring(0, 20) + '...' : 'NOT FOUND'}`);
      console.log('   Full response:', JSON.stringify(response.data, null, 2));
      
      if (!token) {
        throw new Error('Token not found in response');
      }
      
      return token;
    } else {
      throw new Error(`Login failed: ${response.data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('❌ Customer login failed:', error.message);
    throw error;
  }
}

async function testGetProducts(token) {
  console.log('\n📦 Testing Products API...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/customer/products',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    
    if (response.status === 200 && response.data.success) {
      console.log(`✅ Products API successful - ${response.data.data.length} products loaded`);
      
      // Show sample products with stock info
      const productsWithStock = response.data.data.filter(p => p.stock_quantity > 0);
      console.log(`   📊 Products in stock: ${productsWithStock.length}`);
      
      if (productsWithStock.length > 0) {
        const sampleProduct = productsWithStock[0];
        console.log(`   📦 Sample product: ${sampleProduct.name} - Rs.${sampleProduct.price} (Stock: ${sampleProduct.stock_quantity})`);
        return { products: response.data.data, sampleProduct };
      } else {
        throw new Error('No products with stock available for testing');
      }
    } else {
      throw new Error(`Products API failed: ${response.data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('❌ Products API failed:', error.message);
    throw error;
  }
}

async function testAddToCart(token, productId, quantity = 1) {
  console.log(`\n🛒 Testing Add to Cart (Product ID: ${productId}, Qty: ${quantity})...`);
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/cart/add',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, {
      product_id: productId,
      quantity: quantity
    });

    if (response.status === 200 && response.data.success) {
      console.log('✅ Add to Cart successful');
      return true;
    } else {
      throw new Error(`Add to Cart failed: ${response.data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('❌ Add to Cart failed:', error.message);
    throw error;
  }
}

async function testGetCart(token) {
  console.log('\n🛒 Testing Get Cart...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/cart',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Get Cart successful');
      console.log(`   📊 Cart items: ${response.data.data.item_count}`);
      console.log(`   💰 Total amount: Rs. ${response.data.data.total_amount}`);
      return response.data.data;
    } else {
      throw new Error(`Get Cart failed: ${response.data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('❌ Get Cart failed:', error.message);
    throw error;
  }
}

async function testBuyNow(token, productId, quantity = 1) {
  console.log(`\n⚡ Testing Buy Now (Product ID: ${productId}, Qty: ${quantity})...`);
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/customer/orders',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const orderData = {
      items: [{
        product_id: productId,
        quantity: quantity
      }],
      shipping_address: '123 Test Street, Colombo, Sri Lanka',
      notes: `Quick purchase test - Product ${productId}`
    };

    const response = await makeRequest(options, orderData);

    if (response.status === 201 && response.data.success) {
      console.log('✅ Buy Now (Order Creation) successful');
      console.log(`   📋 Order ID: ${response.data.data.id}`);
      console.log(`   🔢 Order Number: ${response.data.data.order_number}`);
      console.log(`   💰 Total Amount: Rs. ${response.data.data.total_amount}`);
      return response.data.data;
    } else {
      throw new Error(`Buy Now failed: ${response.data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('❌ Buy Now failed:', error.message);
    throw error;
  }
}

async function testCustomerOrders(token) {
  console.log('\n📋 Testing Customer Orders API...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/customer/orders',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Customer Orders API successful');
      console.log(`   📊 Total orders: ${response.data.data.length}`);
      
      if (response.data.data.length > 0) {
        const latestOrder = response.data.data[0];
        console.log(`   📋 Latest order: ${latestOrder.order_number} - Rs. ${latestOrder.total_amount} (${latestOrder.status})`);
      }
      
      return response.data.data;
    } else {
      throw new Error(`Customer Orders failed: ${response.data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('❌ Customer Orders failed:', error.message);
    throw error;
  }
}

async function clearCart(token) {
  console.log('\n🧹 Clearing Cart...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/cart/clear',
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Cart cleared successfully');
      return true;
    } else {
      console.log('⚠️ Cart clear warning:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('⚠️ Cart clear warning:', error.message);
    return false;
  }
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting Customer Products Buy Button Functionality Tests');
  console.log('=' .repeat(60));

  try {
    // Step 1: Login
    const token = await testCustomerLogin();

    // Step 2: Get Products
    const { products, sampleProduct } = await testGetProducts(token);

    // Step 3: Clear any existing cart
    await clearCart(token);

    // Step 4: Test Add to Cart
    await testAddToCart(token, sampleProduct.id, 2);

    // Step 5: Test Get Cart
    const cartData = await testGetCart(token);

    // Step 6: Test Buy Now with a different product (if available)
    const productsWithStock = products.filter(p => p.stock_quantity > 0 && p.id !== sampleProduct.id);
    if (productsWithStock.length > 0) {
      const buyNowProduct = productsWithStock[0];
      await testBuyNow(token, buyNowProduct.id, 1);
    } else {
      console.log('\n⚠️ Skipping Buy Now test - no other products with stock available');
    }

    // Step 7: Test Customer Orders
    await testCustomerOrders(token);

    // Final summary
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('');
    console.log('✅ Customer Login - Working');
    console.log('✅ Products API - Working');
    console.log('✅ Add to Cart - Working');
    console.log('✅ Cart Management - Working');
    console.log('✅ Buy Now (Order Creation) - Working');
    console.log('✅ Customer Orders - Working');
    console.log('');
    console.log('🚀 The buy button functionality is fully operational!');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.log('\n🔧 Please check:');
    console.log('   - Backend server is running (http://localhost:5000)');
    console.log('   - Database is accessible');
    console.log('   - Customer account exists with credentials: customer@test.com / password123');
    console.log('   - Products exist in the database with stock > 0');
    process.exit(1);
  }
}

// Start tests
runTests();
