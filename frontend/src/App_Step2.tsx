import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';

// Import components step by step
import { HomePage } from './pages/public/HomePage';
import { PublicLayout } from './components/layouts/PublicLayout';

const theme = {
  token: {
    colorPrimary: '#8B4513',
    colorSuccess: '#6B8E23',
    colorWarning: '#D2691E',
    colorError: '#CD5C5C',
    borderRadius: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
  },
  components: {
    Button: {
      borderRadius: 8
    },
    Card: {
      borderRadius: 12
    },
    Input: {
      borderRadius: 8
    }
  }
};

export function App() {
  return (
    <ConfigProvider theme={theme}>
      <Router>
        <div className="min-h-screen bg-amber-50">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<HomePage />} />
            </Route>
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}
