// Test Customer Products API with Real Database Images
console.log('Testing Customer Products API...');

// First login as customer to get token
const loginResponse = fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'customer@example.com',
    password: 'password123'
  })
})
.then(response => response.json())
.then(result => {
  console.log('Login result:', result);
  
  if (result.success && result.token) {
    // Now test products API
    return fetch('http://localhost:5000/api/customer/products', {
      headers: {
        'Authorization': `Bearer ${result.token}`,
        'Content-Type': 'application/json'
      }
    });
  } else {
    throw new Error('Login failed');
  }
})
.then(response => response.json())
.then(result => {
  console.log('Products API result:', result);
  
  if (result.success && result.data) {
    console.log(`Found ${result.data.length} products`);
    
    // Show first 3 products with their image URLs
    result.data.slice(0, 3).forEach((product, index) => {
      console.log(`Product ${index + 1}:`, {
        id: product.id,
        name: product.name,
        category: product.category,
        image_url: product.image_url,
        price: product.price
      });
    });
  }
})
.catch(error => {
  console.error('Test failed:', error);
});
