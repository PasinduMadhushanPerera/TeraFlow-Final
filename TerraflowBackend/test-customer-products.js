const testProductsAPI = async () => {
  try {
    console.log('🧪 Testing Customer Products API...');
    
    // Use PowerShell to make the request
    const { exec } = require('child_process');
    
    // First, let's test without authentication to see the error
    exec('curl -X GET "http://localhost:5000/api/customer/products"', (error, stdout, stderr) => {
      console.log('Without auth:', stdout);
      
      // Now let's login first and get a token
      const loginData = JSON.stringify({
        email: 'customer@example.com',
        password: 'customer123'
      });
      
      exec(`curl -X POST "http://localhost:5000/api/auth/login" -H "Content-Type: application/json" -d '${loginData}'`, (loginError, loginStdout, loginStderr) => {
        console.log('Login response:', loginStdout);
        
        try {
          const loginResult = JSON.parse(loginStdout);
          if (loginResult.success) {
            const token = loginResult.token;
            console.log('✅ Got token:', token.substring(0, 20) + '...');
            
            // Now test products API with token
            exec(`curl -X GET "http://localhost:5000/api/customer/products" -H "Authorization: Bearer ${token}"`, (prodError, prodStdout, prodStderr) => {
              console.log('Products response:', prodStdout);
              
              try {
                const prodResult = JSON.parse(prodStdout);
                console.log('Products success:', prodResult.success);
                console.log('Products count:', prodResult.data ? prodResult.data.length : 0);
                if (prodResult.data && prodResult.data.length > 0) {
                  console.log('First product:', prodResult.data[0]);
                  console.log('Product fields:', Object.keys(prodResult.data[0]));
                }
              } catch (e) {
                console.error('Error parsing products response:', e.message);
              }
            });
          }
        } catch (e) {
          console.error('Error parsing login response:', e.message);
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testProductsAPI();
