import { createBrowserRouter } from 'react-router';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';
import { VerifyOtp } from './components/auth/VerifyOtp';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { Welcome } from './components/pages/Welcome';
import { UserLayout } from './components/layout/UserLayout';
import { Menu } from './components/pages/Menu';
import { Cart } from './components/pages/Cart';
import { Orders } from './components/pages/Orders';
import { Profile } from './components/pages/Profile';
import { Checkout } from './components/pages/Checkout';
import { PaymentCallback } from './components/pages/PaymentCallback';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';
import { Dashboard } from './components/admin/Dashboard';
import { Foods } from './components/admin/Foods';
import { AdminOrders } from './components/admin/AdminOrders';
import { Users } from './components/admin/Users';
import { Coupons } from './components/admin/Coupons';
import { Referrals } from './components/admin/Referrals';
import { Disputes } from './components/admin/Disputes';
import { AuditLogs } from './components/admin/AuditLogs';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { Navigate } from 'react-router';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Welcome />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '/verify-otp',
    element: <VerifyOtp />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <UserLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'menu',
        element: <Menu />,
      },
      {
        path: 'cart',
        element: <Cart />,
      },
      {
        path: 'orders',
        element: <Orders />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'checkout/:orderId',
        element: <Checkout />,
      },
      {
        path: 'payment/callback',
        element: <PaymentCallback />,
      },
    ],
  },
  // Admin Routes
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },
  {
    path: '/admin',
    element: (
      <AdminProtectedRoute>
        <AdminLayout />
      </AdminProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'foods',
        element: <Foods />,
      },
      {
        path: 'orders',
        element: <AdminOrders />,
      },
      {
        path: 'users',
        element: <Users />,
      },
      {
        path: 'coupons',
        element: <Coupons />,
      },
      {
        path: 'referrals',
        element: <Referrals />,
      },
      {
        path: 'disputes',
        element: <Disputes />,
      },
      {
        path: 'audit-logs',
        element: <AuditLogs />,
      },
    ],
  },
]);
