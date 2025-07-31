import React from 'react';

export const TestApp: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'green' }}>✅ TeraFlow React App is Working!</h1>
      <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '5px', margin: '10px 0' }}>
        <h3>Debug Information:</h3>
        <p><strong>React Version:</strong> {React.version}</p>
        <p><strong>Current Time:</strong> {new Date().toLocaleString()}</p>
        <p><strong>Environment:</strong> Development</p>
      </div>
      
      <div style={{ background: '#e6f3ff', padding: '15px', borderRadius: '5px', margin: '10px 0' }}>
        <h3>Server Status:</h3>
        <p>Frontend: ✅ Running on port 5173</p>
        <p>Backend: ✅ Should be running on port 5000</p>
      </div>

      <div style={{ background: '#ffe6e6', padding: '15px', borderRadius: '5px', margin: '10px 0' }}>
        <h3>Known Issues:</h3>
        <p>If you see this message, React is working correctly!</p>
        <p>If the main app doesn't load, there might be a routing or component error.</p>
      </div>

      <button 
        onClick={() => window.location.reload()} 
        style={{ 
          padding: '10px 20px', 
          background: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer',
          marginRight: '10px'
        }}
      >
        Reload Page
      </button>

      <button 
        onClick={() => window.open('http://localhost:5000/health', '_blank')} 
        style={{ 
          padding: '10px 20px', 
          background: '#28a745', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Test Backend
      </button>
    </div>
  );
};
