'use client';

import { useStore } from '@/lib/store';
import Header from './Header/Header';
import Toast from './Toast/Toast';
import AuthModal from './AuthModal/AuthModal';
import HomePage from './HomePage/HomePage';
import SearchPage from './SearchPage/SearchPage';
import ProductDetail from './ProductDetail/ProductDetail';
import Cart from './Cart/Cart';
import Checkout from './Checkout/Checkout';
import Profile from './Profile/Profile';
import SuccessPage from './SuccessPage/SuccessPage';
import Footer from './Footer/Footer';

export default function ShopWaveApp() {
  const { state } = useStore();

  const renderPage = () => {
    switch (state.currentPage) {
      case 'home': return <HomePage />;
      case 'search': return <SearchPage />;
      case 'product-detail': return <ProductDetail />;
      case 'cart': return <Cart />;
      case 'checkout': return <Checkout />;
      case 'profile': return <Profile />;
      case 'success': return <SuccessPage />;
      default: return <HomePage />;
    }
  };

  return (
    <>
      <Toast />
      <AuthModal />
      <Header />
      <main role="main">{renderPage()}</main>
      <Footer />
    </>
  );
}
