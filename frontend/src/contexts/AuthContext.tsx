import React, { useEffect, useState, createContext, useContext } from 'react';
interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'supplier' | 'customer';
  fullName: string;
  isApproved?: boolean;
}
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: any) => Promise<boolean>;
  isLoading: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('terraflow_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    console.log('=== AUTH CONTEXT LOGIN DEBUG ===');
    console.log('Email:', email);
    console.log('Password length:', password?.length);
    console.log('Making API call to:', 'http://localhost:5000/api/auth/login');
    
    try {
      // Make API call to backend for authentication
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok && result.success) {
        console.log('Login successful, processing user data...');
        
        const user: User = {
          id: result.user.id.toString(),
          username: result.user.full_name,
          email: result.user.email,
          role: result.user.role,
          fullName: result.user.full_name,
          isApproved: true
        };
        
        console.log('Created user object:', user);
        
        // Store both user data and token
        const userWithToken = {
          ...user,
          token: result.token
        };
        
        console.log('Storing user with token in localStorage...');
        setUser(user);
        localStorage.setItem('terraflow_user', JSON.stringify(userWithToken));
        localStorage.setItem('terraflow_token', result.token); // Store token separately for easy access
        
        console.log('User stored successfully');
        setIsLoading(false);
        return true;
      } else {
        console.error('Login failed:', result.message);
        console.error('Response status:', response.status);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      setIsLoading(false);
      return false;
    }
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem('terraflow_user');
    localStorage.removeItem('terraflow_token'); // Remove token as well
  };  const register = async (userData: any): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('=== AUTHCONTEXT REGISTER DEBUG ===');
      console.log('Sending registration request:', userData);
      console.log('API URL:', 'http://localhost:5000/api/register');
      
      const requestBody = { 
        ...userData, 
        termsAccepted: true 
      };
      console.log('Final request body:', requestBody);
      
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      setIsLoading(false);
      
      if (!response.ok) {
        console.error('Registration failed - Response not ok');
        console.error('Error message:', data.message);
        console.error('Validation errors:', data.errors);
        throw new Error(data.message || 'Registration failed');
      }
      
      console.log('Registration successful:', data);
      return data.success;
    } catch (error: any) {
      console.error('Registration error in catch block:', error);
      setIsLoading(false);
      
      // Check if it's a network error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please ensure the backend server is running on port 5000.');
      }
      
      throw error;
    }
  };
  return <AuthContext.Provider value={{
    user,
    login,
    logout,
    register,
    isLoading
  }}>
      {children}
    </AuthContext.Provider>;
};
