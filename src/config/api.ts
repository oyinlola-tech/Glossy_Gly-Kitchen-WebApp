// API Configuration
const configuredApiUrl = import.meta.env.VITE_API_URL;
const API_BASE_URL = configuredApiUrl || (import.meta.env.PROD ? '' : 'http://localhost:3000');

if (import.meta.env.PROD && !API_BASE_URL) {
  throw new Error('Missing VITE_API_URL for production build/runtime');
}

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    // Auth
    AUTH: {
      SIGNUP: '/auth/signup',
      VERIFY: '/auth/verify',
      RESEND_OTP: '/auth/resend-otp',
      GOOGLE: '/auth/google',
      APPLE: '/auth/apple',
      LOGIN: '/auth/login',
      REQUEST_LOGIN_OTP: '/auth/request-login-otp',
      LOGIN_OTP: '/auth/login-otp',
      FORGOT_PASSWORD_REQUEST: '/auth/forgot-password/request',
      FORGOT_PASSWORD_VERIFY: '/auth/forgot-password/verify',
      FORGOT_PASSWORD_RESET: '/auth/forgot-password/reset',
      DELETE_ACCOUNT_REQUEST_OTP: '/auth/delete-account/request-otp',
      DELETE_ACCOUNT: '/auth/delete-account',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
      LOGOUT_ALL: '/auth/logout-all',
      ME: '/auth/me',
      REFERRAL_CODE_GENERATE: '/auth/referral-code/generate',
    },
    // Foods
    FOODS: '/foods',
    FOOD_CATEGORIES: '/foods/categories',
    // Cart
    CART: '/cart',
    // Orders
    ORDERS: '/orders',
    ORDER_ADDRESSES: '/orders/addresses',
    // Payments
    PAYMENTS: {
      INITIALIZE: '/payments/initialize',
      VERIFY: '/payments/verify',
      CARDS: '/payments/cards',
      CARD_SET_DEFAULT: '/payments/cards',
      PAY_WITH_SAVED_CARD: '/payments/pay-with-saved-card',
    },
    // Admin
    ADMIN: {
      AUTH: {
        LOGIN: '/admin/auth/login',
        REFRESH: '/admin/auth/refresh',
        LOGOUT: '/admin/auth/logout',
        LOGOUT_ALL: '/admin/auth/logout-all',
      },
      ME: '/admin/me',
      DASHBOARD: '/admin/dashboard',
      FOODS_ALL: '/foods/admin/all',
      ADMINS: '/admin/admins',
      USERS: '/admin/users',
      ORDERS: '/admin/orders',
      COUPONS: '/admin/coupons',
      REFERRAL_CODES: '/admin/referral-codes',
      DISPUTES: '/admin/disputes',
      AUDIT_LOGS: '/admin/audit-logs',
    },
    // System
    HEALTH: '/health',
    READY: '/ready',
  },
};

export default API_CONFIG;
