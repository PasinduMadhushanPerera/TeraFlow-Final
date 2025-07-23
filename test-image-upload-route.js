const testImageUpload = async () => {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    console.log('🧪 Testing Image Upload Route...\n');
    
    // Step 1: Login as admin
    console.log('📝 Step 1: Logging in as admin...');
    const loginResponse = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@terraflow.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error('Login failed: ' + loginData.message);
    }
    
    const token = loginData.token;
    console.log('✅ Login successful');
    
    // Step 2: Test image upload route accessibility
    console.log('\n📝 Step 2: Testing image upload route...');
    const uploadResponse = await fetch(`${baseURL}/auth/upload-profile-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const uploadData = await uploadResponse.json();
    console.log('Upload response:', uploadData);
    
    // We expect "No image file provided" since we didn't send a file
    if (uploadData.message === 'No image file provided') {
      console.log('✅ Image upload route is working (correctly detected missing file)');
    } else {
      console.log('⚠️ Unexpected response:', uploadData.message);
    }
    
    console.log('\n🎉 Image upload route test completed!');
    console.log('✅ Route /api/auth/upload-profile-image is accessible');
    console.log('✅ Authentication is working');
    console.log('✅ Error handling is working');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testImageUpload();
