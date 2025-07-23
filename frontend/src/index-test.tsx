import './index.css';
import { createRoot } from "react-dom/client";
import React from 'react';

// Simple test component
const TestApp: React.FC = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🚀 TerraFlow Test Page</h1>
      <p>If you can see this, React is working!</p>
      <p>Date: {new Date().toLocaleString()}</p>
    </div>
  );
};

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<TestApp />);
