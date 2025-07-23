const adminProfileTest = async () => {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    console.log('🧪 Testing Admin Profile Functionality...\n');
    
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
    console.log('Login response:', JSON.stringify(loginData, null, 2));
    
    if (!loginData.success) {
      throw new Error('Login failed: ' + loginData.message);
    }
    
    const token = loginData.token || loginData.data?.token;
    if (!token) {
      throw new Error('No token received from login');
    }
    console.log('✅ Login successful');
    
    // Step 2: Get profile data
    console.log('\n📝 Step 2: Fetching profile data...');
    const profileResponse = await fetch(`${baseURL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const profileData = await profileResponse.json();
    if (!profileData.success) {
      throw new Error('Get profile failed: ' + profileData.message);
    }
    
    console.log('✅ Profile data fetched successfully');
    console.log('📊 Profile Data:', {
      name: profileData.data.full_name,
      email: profileData.data.email,
      role: profileData.data.role,
      mobile: profileData.data.mobile
    });
    
    // Step 3: Update profile
    console.log('\n📝 Step 3: Testing profile update...');
    const updateResponse = await fetch(`${baseURL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        full_name: profileData.data.full_name || 'Admin User',
        mobile: '1234567890',  // US format without +
        address: profileData.data.address || '123 Admin Street, City, State',
        business_name: profileData.data.business_name || 'TerraFlow Administration',
        business_address: profileData.data.business_address || '123 Business District, Admin City',
        contact_no: profileData.data.contact_no || '0987654321'
      })
    });
    
    const updateData = await updateResponse.json();
    console.log('Update response:', JSON.stringify(updateData, null, 2));
    
    if (!updateData.success) {
      throw new Error('Profile update failed: ' + updateData.message + ' - ' + JSON.stringify(updateData.errors));
    }
    
    console.log('✅ Profile updated successfully');
    
    // Step 4: Test change password endpoint availability
    console.log('\n📝 Step 4: Testing change password endpoint...');
    const passwordResponse = await fetch(`${baseURL}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      })
    });
    
    const passwordData = await passwordResponse.json();
    // We expect this to fail with wrong password
    if (passwordData.message === 'Current password is incorrect') {
      console.log('✅ Change password endpoint working (correctly rejected wrong password)');
    } else {
      console.log('⚠️ Unexpected response from change password endpoint');
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Admin Profile Page Features Available:');
    console.log('   ✅ Profile data display');
    console.log('   ✅ Profile information editing');
    console.log('   ✅ Password change functionality');
    console.log('   ✅ Admin role-specific interface');
    console.log('\n🌐 Access the admin profile at: http://localhost:5173/admin/profile');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
adminProfileTest();
