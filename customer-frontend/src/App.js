import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import GlitterBackground from './components/GlitterCursor';
import ScrollToTop from './components/ScrollToTop';

// Lazy loaded pages for performance optimization
const Home = lazy(() => import('./pages/Home'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Search = lazy(() => import('./pages/Search'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Offers = lazy(() => import('./pages/Offers'));
const AllProducts = lazy(() => import('./pages/AllProducts'));

// Premium fallback loader
const PageLoader = () => (
  <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="skeleton" style={{ width: 60, height: 60, borderRadius: '50%' }} />
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <ScrollToTop />
            {/* Ambient background glitter – sits behind all content */}
            <GlitterBackground />
            <div className="flex flex-col min-h-screen" style={{ position: 'relative', zIndex: 1 }}>
              <Navbar />
              <main className="flex-grow">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<AllProducts />} />
                    <Route path="/category/:categoryName" element={<CategoryPage />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/offers" element={<Offers />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
