import React from 'react';

export const TestApp: React.FC = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1 style={{ color: '#8B4513' }}>TerraFlow SCM System</h1>
      <p>Frontend is working correctly!</p>
      <div style={{ 
        background: '#f0f0f0', 
        padding: '20px', 
        margin: '20px 0',
        borderRadius: '8px'
      }}>
        <h2>System Status: ✅ ONLINE</h2>
        <p>Backend API: http://localhost:5000</p>
        <p>Frontend: http://localhost:5173</p>
      </div>
    </div>
  );
};
