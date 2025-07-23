import React from 'react';
import { createRoot } from 'react-dom/client';

// Very simple test component
const TestApp: React.FC = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🚀 TerraFlow is Working!</h1>
      <p>React app is successfully running</p>
      <p>Current time: {new Date().toLocaleString()}</p>
      <p>✅ Frontend server is operational</p>
    </div>
  );
};

console.log('Loading React app...');

const container = document.getElementById('root');
if (container) {
  console.log('Root container found, mounting React app...');
  const root = createRoot(container);
  root.render(<TestApp />);
} else {
  console.error('Root container not found!');
}
