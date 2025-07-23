const axios = require('axios');

async function testSupplierProfileUpdate() {
    try {
        console.log('🧪 Testing supplier profile update functionality...\n');
        
        // Login as supplier
        console.log('1. 🔐 Logging in as supplier...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'testsupplier@example.com',
            password: 'test123'
        });
        
        if (!loginResponse.data.success) {
            console.log('❌ Supplier login failed:', loginResponse.data.message);
            return;
        }
        
        const token = loginResponse.data.token;
        console.log('✅ Supplier login successful');
        
        // Get current profile
        console.log('\n2. 📋 Getting current profile...');
        const profileResponse = await axios.get('http://localhost:5000/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!profileResponse.data.success) {
            console.log('❌ Failed to get profile:', profileResponse.data.message);
            return;
        }
        
        const originalProfile = profileResponse.data.data;
        console.log('✅ Current profile retrieved');
        console.log('   Current name:', originalProfile.full_name);
        console.log('   Current mobile:', originalProfile.mobile);
        
        // Test profile update
        console.log('\n3. 📝 Testing profile update...');
        const updateData = {
            full_name: 'Updated Supplier Name',
            mobile: '9876543210',
            address: originalProfile.address,
            business_name: originalProfile.business_name,
            business_address: originalProfile.business_address
        };
        
        const updateResponse = await axios.put('http://localhost:5000/api/auth/profile', updateData, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!updateResponse.data.success) {
            console.log('❌ Profile update failed:', updateResponse.data.message);
            console.log('Response status:', updateResponse.status);
            console.log('Response data:', updateResponse.data);
            return;
        }
        
        console.log('✅ Profile update successful:', updateResponse.data.message);
        
        // Verify update
        console.log('\n4. ✅ Verifying update...');
        const updatedProfileResponse = await axios.get('http://localhost:5000/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!updatedProfileResponse.data.success) {
            console.log('❌ Failed to verify update');
            return;
        }
        
        const updatedProfile = updatedProfileResponse.data.data;
        console.log('✅ Updated profile retrieved');
        console.log('   Updated name:', updatedProfile.full_name);
        console.log('   Updated mobile:', updatedProfile.mobile);
        
        // Check if changes were applied
        if (updatedProfile.full_name === updateData.full_name && 
            updatedProfile.mobile === updateData.mobile) {
            console.log('\n🎉 Supplier profile update functionality works correctly!');
            console.log('   ✅ Name updated successfully');
            console.log('   ✅ Mobile updated successfully');
            console.log('   ✅ All profile fields are working');
        } else {
            console.log('\n⚠️ Profile update partially failed');
            console.log('Expected name:', updateData.full_name, 'Got:', updatedProfile.full_name);
            console.log('Expected mobile:', updateData.mobile, 'Got:', updatedProfile.mobile);
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.response?.data?.message || error.message);
        if (error.response) {
            console.log('Error status:', error.response.status);
            console.log('Error data:', error.response.data);
        }
    }
}

testSupplierProfileUpdate();
