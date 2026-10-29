import React, { Suspense, lazy, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { CartProvider, CartContext } from './context/CartContext';
import { WishlistProvider, WishlistContext } from './context/WishlistContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import ScrollToTop from './components/ScrollToTop';

// Lazy loaded pages for performance optimization
const Home        = lazy(() => import('./pages/Home'));
const CategoryPage= lazy(() => import('./pages/CategoryPage'));
const Categories  = lazy(() => import('./pages/Categories'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Search      = lazy(() => import('./pages/Search'));
const Cart        = lazy(() => import('./pages/Cart'));
const Checkout    = lazy(() => import('./pages/Checkout'));
const Offers      = lazy(() => import('./pages/Offers'));
const AllProducts = lazy(() => import('./pages/AllProducts'));
const Wishlist    = lazy(() => import('./pages/Wishlist'));
const Login       = lazy(() => import('./pages/Login'));
const Register    = lazy(() => import('./pages/Register'));
const Account     = lazy(() => import('./pages/Account'));

// Premium fallback loader
const PageLoader = () => (
  <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="skeleton" style={{ width: 60, height: 60, borderRadius: '50%' }} />
  </div>
);

/**
 * AuthSyncBridge — Runs inside all three providers so it can call
 * syncWithServer on both CartContext and WishlistContext when the user
 * becomes authenticated (e.g. page reload with existing token or fresh login).
 */
const AuthSyncBridge = () => {
  const { user, getToken } = useContext(AuthContext);
  const { syncWithServer: syncCart, loadServerCart } = useContext(CartContext);
  const { syncWithServer: syncWishlist, loadServerWishlist } = useContext(WishlistContext);

  useEffect(() => {
    if (!user) return;
    const token = getToken();
    if (!token) return;

    // Check if there are guest items pending merge.
    const hasGuestCart     = Boolean(localStorage.getItem('prettyglitz_cart'));
    const hasGuestWishlist = Boolean(localStorage.getItem('prettyglitz_wishlist'));

    if (hasGuestCart) {
      syncCart(token);
    } else {
      loadServerCart();
    }

    if (hasGuestWishlist) {
      syncWishlist(token);
    } else {
      loadServerWishlist();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return null;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Router>
              <AuthSyncBridge />
              <ScrollToTop />
              <div className="flex flex-col min-h-screen" style={{ position: 'relative', zIndex: 1 }}>
                <Navbar />
                <main className="flex-grow">
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* ── Existing routes (UNCHANGED) ── */}
                      <Route path="/"                          element={<Home />} />
                      <Route path="/products"                 element={<AllProducts />} />
                      <Route path="/categories"              element={<Categories />} />
                      <Route path="/category/:categoryName"  element={<CategoryPage />} />
                      <Route path="/product/:id"             element={<ProductDetail />} />
                      <Route path="/search"                  element={<Search />} />
                      <Route path="/offers"                  element={<Offers />} />
                      <Route path="/cart"                    element={<Cart />} />
                      <Route path="/checkout"                element={<Checkout />} />

                      {/* ── New customer routes ── */}
                      <Route path="/wishlist"                element={<Wishlist />} />
                      <Route path="/login"                   element={<Login />} />
                      <Route path="/register"               element={<Register />} />
                      <Route path="/account"                element={<Account />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
                <BottomNav />
              </div>
            </Router>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
