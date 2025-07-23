const axios = require('axios');

async function testProfileImageDelete() {
    try {
        console.log('Testing profile image delete functionality...');
        
        // First login to get token
        console.log('1. Logging in as admin...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@terraflow.com',
            password: 'admin123'
        });
        
        if (!loginResponse.data.success) {
            console.log('❌ Login failed:', loginResponse.data.message);
            return;
        }
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        
        // Get current profile
        console.log('2. Getting current profile...');
        const profileResponse = await axios.get('http://localhost:5000/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!profileResponse.data.success) {
            console.log('❌ Failed to get profile:', profileResponse.data.message);
            return;
        }
        
        console.log('✅ Profile retrieved');
        console.log('   Current profile image:', profileResponse.data.data.profile_image || 'None');
        
        // Test delete profile image endpoint
        console.log('3. Testing delete profile image endpoint...');
        const deleteResponse = await axios.delete('http://localhost:5000/api/auth/delete-profile-image', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!deleteResponse.data.success) {
            console.log('❌ Delete failed:', deleteResponse.data.message);
            return;
        }
        
        console.log('✅ Delete endpoint successful:', deleteResponse.data.message);
        
        // Verify profile image was removed
        console.log('4. Verifying profile image was removed...');
        const updatedProfileResponse = await axios.get('http://localhost:5000/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!updatedProfileResponse.data.success) {
            console.log('❌ Failed to get updated profile:', updatedProfileResponse.data.message);
            return;
        }
        
        console.log('✅ Updated profile retrieved');
        console.log('   Profile image after delete:', updatedProfileResponse.data.data.profile_image || 'None (successfully removed)');
        
        if (!updatedProfileResponse.data.data.profile_image) {
            console.log('🎉 Profile image delete functionality works correctly!');
        } else {
            console.log('❌ Profile image was not removed properly');
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.response?.data?.message || error.message);
    }
}

testProfileImageDelete();
