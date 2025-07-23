import './index.css';
import { createRoot } from "react-dom/client";
import { App } from "./App";

console.log('Starting TerraFlow React application...');

try {
  const container = document.getElementById("root");
  if (!container) {
    console.error('Root container not found!');
    throw new Error('Root container not found');
  }
  
  console.log('Root container found, creating React root...');
  const root = createRoot(container);
  
  console.log('Rendering App component...');
  root.render(<App />);
  
  console.log('TerraFlow React application started successfully!');
} catch (error) {
  console.error('Failed to start TerraFlow React application:', error);
  
  // Show error message in the DOM
  const container = document.getElementById("root");
  if (container) {
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; color: red;">
        <h1>Application Error</h1>
        <p>Failed to start TerraFlow: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        <p>Check the browser console for more details.</p>
      </div>
    `;
  }
}