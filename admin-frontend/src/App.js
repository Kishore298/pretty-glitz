import React, { useContext, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';

// Route-level code splitting for faster admin initial load
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Categories = lazy(() => import('./pages/Categories'));
const Subcategories = lazy(() => import('./pages/Subcategories'));
const Offers = lazy(() => import('./pages/Offers'));
const Testimonials = lazy(() => import('./pages/Testimonials'));
const Banners = lazy(() => import('./pages/Banners'));
const ProductAnalytics = lazy(() => import('./pages/ProductAnalytics'));
const Orders = lazy(() => import('./pages/Orders'));
const Customers = lazy(() => import('./pages/Customers'));
const TrafficAnalytics = lazy(() => import('./pages/TrafficAnalytics'));
const PushNotifications = lazy(() => import('./pages/PushNotifications'));
const Campaigns = lazy(() => import('./pages/Campaigns'));

const AdminLoadingSplash = () => (
  <div
    style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'var(--panel-bg, #09080E)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {/* Soft ambient background glow */}
    <div
      style={{
        position: 'absolute',
        width: 320,
        height: 320,
        background: 'radial-gradient(circle, rgba(236, 22, 140, 0.15) 0%, rgba(155, 61, 255, 0.08) 50%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }}
    />

    {/* Brand Logo */}
    <div style={{ marginBottom: 14 }}>
      <img
        src="/pretty-glitz-logo.png"
        alt="PrettyGlitz Logo"
        style={{
          height: 54,
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>

    <div
      style={{
        fontFamily: 'Outfit, sans-serif',
        fontSize: '1.6rem',
        fontWeight: 800,
        letterSpacing: '0.04em',
        background: 'linear-gradient(90deg, #C4386C, #8A2BE2, #C9A84C)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        marginBottom: 6,
        display: 'inline-block',
      }}
    >
      PrettyGlitz
    </div>

    <div
      style={{
        fontSize: '0.85rem',
        color: 'var(--text-secondary, #ACA6B8)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--accent-pink, #EC168C)',
          animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        }}
      />
      Loading Console...
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useContext(AuthContext);

  if (loading) return <AdminLoadingSplash />;
  if (!admin) return <Navigate to="/login" replace />;

  return <AdminLayout>{children}</AdminLayout>;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#181722',
                color: '#FAF9FC',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '12px 18px',
                fontSize: '0.88rem',
                fontWeight: 500,
                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5), 0 0 20px rgba(236, 22, 140, 0.15)',
                fontFamily: 'Inter, sans-serif',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />
          <Suspense fallback={<AdminLoadingSplash />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
              <Route path="/traffic" element={<ProtectedRoute><TrafficAnalytics /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><ProductAnalytics /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
              <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
              <Route path="/subcategories" element={<ProtectedRoute><Subcategories /></ProtectedRoute>} />
              <Route path="/banners" element={<ProtectedRoute><Banners /></ProtectedRoute>} />
              <Route path="/offers" element={<ProtectedRoute><Offers /></ProtectedRoute>} />
              <Route path="/push-notifications" element={<ProtectedRoute><PushNotifications /></ProtectedRoute>} />
              <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
              <Route path="/testimonials" element={<ProtectedRoute><Testimonials /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
