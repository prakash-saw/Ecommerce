import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider } from './context/ThemeContext';

// Components
import AnnouncementBar from './components/AnnouncementBar';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import FloatingWhatsAppButton from './components/FloatingWhatsAppButton';

// Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CustomizeStudioPage from './pages/CustomizeStudioPage';
import WishlistPage from './pages/WishlistPage';
import DropsPage from './pages/DropsPage';
import RewardsPage from './pages/RewardsPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import TrackOrderPage from './pages/TrackOrderPage';
import AccountPage from './pages/AccountPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AboutPage from './pages/AboutPage';
import PoliciesPage from './pages/PoliciesPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Router>
              <div className="min-h-screen flex flex-col bg-[#FAFAF8] dark:bg-noir-bg text-[#111111] dark:text-[#F4F4F5] transition-colors duration-200">
                <AnnouncementBar />
                <Header />
                <CartDrawer />

                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/shop" element={<ShopPage />} />
                    <Route path="/drops" element={<DropsPage />} />
                    <Route path="/rewards" element={<RewardsPage />} />
                    <Route path="/product/:slug" element={<ProductDetailPage />} />
                    <Route path="/customize" element={<CustomizeStudioPage />} />
                    <Route path="/customize/:productId" element={<CustomizeStudioPage />} />
                    <Route path="/wishlist" element={<WishlistPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
                    <Route path="/track-order" element={<TrackOrderPage />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/settings" element={<Navigate to="/account?tab=profile" replace />} />
                    <Route path="/admin" element={<AdminDashboardPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/policies" element={<PoliciesPage />} />
                  </Routes>
                </main>

                <FloatingWhatsAppButton />
                <Footer />
              </div>
            </Router>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
