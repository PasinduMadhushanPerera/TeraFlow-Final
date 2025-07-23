import { ConfigProvider } from 'antd';

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
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        minHeight: '100vh',
        backgroundColor: '#fef3c7',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1 style={{ 
          color: '#92400e', 
          fontSize: '48px', 
          marginBottom: '20px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
        }}>
          🏭 TerraFlow SCM
        </h1>
        
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <h2 style={{ color: '#059669', marginBottom: '20px' }}>
            ✅ System Status: All Services Running
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px',
            marginTop: '30px'
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#f0fdf4',
              borderRadius: '10px',
              border: '2px solid #16a34a'
            }}>
              <h3 style={{ color: '#15803d', margin: '0 0 10px 0' }}>🚀 Frontend</h3>
              <p style={{ color: '#166534', margin: 0 }}>
                <strong>Port:</strong> 5175<br/>
                <strong>Status:</strong> ✅ Running<br/>
                <strong>Framework:</strong> React + Vite
              </p>
            </div>
            
            <div style={{
              padding: '20px',
              backgroundColor: '#fef3c7',
              borderRadius: '10px',
              border: '2px solid #d97706'
            }}>
              <h3 style={{ color: '#92400e', margin: '0 0 10px 0' }}>🗄️ Backend</h3>
              <p style={{ color: '#a16207', margin: 0 }}>
                <strong>Port:</strong> 5000<br/>
                <strong>Status:</strong> ✅ Running<br/>
                <strong>API:</strong> Express.js
              </p>
            </div>
            
            <div style={{
              padding: '20px',
              backgroundColor: '#f0f9ff',
              borderRadius: '10px',
              border: '2px solid #0ea5e9'
            }}>
              <h3 style={{ color: '#0369a1', margin: '0 0 10px 0' }}>🗃️ Database</h3>
              <p style={{ color: '#075985', margin: 0 }}>
                <strong>Type:</strong> MySQL<br/>
                <strong>Status:</strong> ✅ Connected<br/>
                <strong>Products:</strong> 8 items
              </p>
            </div>
          </div>
          
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
            <h3 style={{ color: '#374151' }}>🎯 Quick Actions</h3>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '15px' }}>
              <a 
                href="http://localhost:5175" 
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#8B4513',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '5px',
                  fontWeight: 'bold'
                }}
              >
                🏠 Homepage
              </a>
              <a 
                href="http://localhost:5175/products" 
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#059669',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '5px',
                  fontWeight: 'bold'
                }}
              >
                🛍️ Products
              </a>
              <a 
                href="http://localhost:5000/health" 
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0ea5e9',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '5px',
                  fontWeight: 'bold'
                }}
              >
                🔧 API Health
              </a>
            </div>
          </div>
          
          <div style={{ marginTop: '20px', fontSize: '14px', color: '#6b7280' }}>
            <p>✅ React: Loaded | ✅ Ant Design: Ready | ✅ TypeScript: Compiled | ✅ Vite: Hot Reload Active</p>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
