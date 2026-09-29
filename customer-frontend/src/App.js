import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import ProductDetail from './pages/ProductDetail';
import Search from './pages/Search';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import GlitterBackground from './components/GlitterCursor';
import ScrollToTop from './components/ScrollToTop';
import Offers from './pages/Offers';

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
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/category/:categoryName" element={<CategoryPage />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/offers" element={<Offers />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                </Routes>
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
