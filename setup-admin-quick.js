// Quick test to setup admin session and test profile
async function setupAdminSession() {
    console.log('Setting up admin session...');
    
    try {
        // Login
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@terraflow.com',
                password: 'admin123'
            })
        });
        
        const data = await response.json();
        console.log('Login response:', data);
        
        if (data.success) {
            // Create user object for AuthContext
            const user = {
                id: data.user.id.toString(),
                username: data.user.full_name,
                email: data.user.email,
                role: data.user.role,
                fullName: data.user.full_name,
                isApproved: true,
                token: data.token
            };
            
            // Store in localStorage
            localStorage.setItem('terraflow_user', JSON.stringify(user));
            localStorage.setItem('terraflow_token', data.token);
            
            console.log('✅ Admin session setup complete!');
            console.log('Stored user:', user);
            
            // Test profile API
            const profileResponse = await fetch('http://localhost:5000/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${data.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const profileData = await profileResponse.json();
            console.log('Profile API test:', profileData);
            
            return true;
        } else {
            console.error('❌ Login failed:', data.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Setup failed:', error);
        return false;
    }
}

setupAdminSession();
