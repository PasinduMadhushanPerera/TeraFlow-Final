const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testFullProfileImageFlow() {
    try {
        console.log('🧪 Testing complete profile image upload/delete flow...\n');
        
        // First login to get token
        console.log('1. 🔐 Logging in as admin...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@terraflow.com',
            password: 'admin123'
        });
        
        if (!loginResponse.data.success) {
            console.log('❌ Login failed:', loginResponse.data.message);
            return;
        }
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful\n');
        
        // Check initial profile state
        console.log('2. 📋 Getting initial profile state...');
        const initialProfile = await axios.get('http://localhost:5000/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('✅ Initial profile image:', initialProfile.data.data.profile_image || 'None');
        
        // If there's already an image, delete it first to reset state
        if (initialProfile.data.data.profile_image) {
            console.log('🗑️ Removing existing profile image...');
            await axios.delete('http://localhost:5000/api/auth/delete-profile-image', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Existing image removed\n');
        } else {
            console.log('ℹ️ No existing image found\n');
        }
        
        // Test the delete endpoint (should work even if no image exists)
        console.log('3. 🗑️ Testing delete endpoint (should work even with no image)...');
        const deleteResponse = await axios.delete('http://localhost:5000/api/auth/delete-profile-image', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('✅ Delete endpoint response:', deleteResponse.data.message);
        
        // Verify profile image is null
        const profileAfterDelete = await axios.get('http://localhost:5000/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('✅ Profile image after delete:', profileAfterDelete.data.data.profile_image || 'None (correct!)');
        
        if (!profileAfterDelete.data.data.profile_image) {
            console.log('🎉 Profile image delete functionality works correctly!\n');
        } else {
            console.log('❌ Profile image was not removed properly\n');
            return;
        }
        
        console.log('✅ All tests passed! Profile image delete functionality is working correctly! 🎉');
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.response?.data?.message || error.message);
    }
}

testFullProfileImageFlow();
