import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router';
import Layout from './components/Layout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import HomePage from './pages/HomePage.jsx';
import ShopPage from './pages/ShopPage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import { RegisterPage, SignInPage } from './pages/AuthPages.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import { Loading } from './components/common.jsx';

// Account, checkout and admin screens load on demand to keep the storefront bundle small.
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'));
const OrderPage = lazy(() => import('./pages/OrderPage.jsx'));
const AccountPage = lazy(() => import('./pages/AccountPage.jsx'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage.jsx'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage.jsx'));

/**
 * Route guard: sends signed-out users to sign-in (returning here afterwards)
 * and non-admins away from admin pages.
 * @param {{admin?: boolean}} props - Set `admin` to require an admin account.
 */
function RequireAuth({ admin = false }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to={`/signin?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (admin && !user.isAdmin) return <Navigate to="/" replace />;
  return (
    <Suspense fallback={<Loading />}>
      <Outlet />
    </Suspense>
  );
}

/**
 * Scrolls to the top of the page whenever the route changes.
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  // Braces matter: newer browsers return a Promise from scrollTo, which React rejects as a cleanup.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/**
 * Defines all pages and their URLs.
 */
export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="shop/:department" element={<ShopPage />} />
          <Route path="product/:id" element={<ProductPage />} />
          <Route path="signin" element={<SignInPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route element={<RequireAuth />}>
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="orders/:id" element={<OrderPage />} />
            <Route path="account" element={<AccountPage />} />
          </Route>
          <Route path="admin" element={<RequireAuth admin />}>
            <Route index element={<Navigate to="products" replace />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}
