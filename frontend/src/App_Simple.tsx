import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';

// Create a simple HomePage component
const HomePage = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h1 style={{ color: '#8B4513' }}>TerraFlow SCM</h1>
    <p>Welcome to our Supply Chain Management System</p>
    <p>✅ HomePage is working!</p>
  </div>
);

// Create a simple layout
const SimpleLayout = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: '100vh', backgroundColor: '#fef3c7' }}>
    <div style={{ padding: '20px', backgroundColor: '#8B4513', color: 'white', textAlign: 'center' }}>
      <h2>TerraFlow Navigation</h2>
    </div>
    <div style={{ padding: '20px' }}>
      {children}
    </div>
  </div>
);

const theme = {
  token: {
    colorPrimary: '#8B4513',
    colorSuccess: '#6B8E23',
    colorWarning: '#D2691E',
    colorError: '#CD5C5C',
    borderRadius: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
  }
};

export function App() {
  return (
    <ConfigProvider theme={theme}>
      <Router>
        <div className="min-h-screen bg-amber-50">
          <Routes>
            <Route path="/" element={
              <SimpleLayout>
                <HomePage />
              </SimpleLayout>
            } />
            <Route path="*" element={
              <SimpleLayout>
                <div style={{ textAlign: 'center' }}>
                  <h2>Page Not Found</h2>
                  <p>Go back to <a href="/">Home</a></p>
                </div>
              </SimpleLayout>
            } />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}
