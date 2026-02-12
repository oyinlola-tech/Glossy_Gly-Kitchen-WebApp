# Glossy-Gly-Kitchen Frontend

React + Vite frontend for customer and admin portals.

## Stack
- React 18
- TypeScript
- Vite 6
- React Router
- Tailwind CSS utilities
- Sonner toasts

## Prerequisites
- Node.js 18+
- Backend API running (default `http://localhost:3000`)

## Setup
1. Install dependencies:
```bash
npm install
```
2. Create `.env` in project root:
```env
VITE_API_URL=http://localhost:3000
```
3. Start dev server:
```bash
npm run dev
```
4. Build production bundle:
```bash
npm run build
```

## App Routes

### Public
- `/`
- `/login`
- `/signup`
- `/verify-otp`
- `/forgot-password`
- `/admin/login`

### Authenticated User
- `/menu`
- `/cart`
- `/orders`
- `/profile`
- `/checkout/:orderId`

### Authenticated Admin
- `/admin/dashboard`
- `/admin/foods`
- `/admin/orders`
- `/admin/users`
- `/admin/coupons`
- `/admin/referrals` (placeholder)
- `/admin/disputes` (placeholder)
- `/admin/audit-logs` (placeholder)

## API Integration Notes
- Frontend API layer is in `src/services/api.ts`.
- It normalizes backend payloads (snake_case to camel-ish UI fields where needed).
- User/admin auth both map backend `accessToken` into frontend `token`.
- Admin login supports OTP challenge (`otpRequired` flow).
- User cart, orders, coupons, and admin list endpoints are normalized so UI can consume consistent shapes.

## Key Folders
- `src/components/auth`: user auth screens
- `src/components/pages`: customer pages
- `src/components/admin`: admin pages
- `src/contexts`: auth state providers
- `src/config/api.ts`: endpoint constants
- `src/services/api.ts`: API client and response mapping

## Troubleshooting
- `Request failed` / CORS errors:
  - Verify backend is running on `VITE_API_URL`.
  - Confirm backend `CORS_ORIGIN` allows frontend origin.
- Payment init fails with callback URL:
  - Backend requires `https` callback URLs; frontend now omits callback in non-https environments.
- Admin login asks for OTP:
  - First submit sends email/password.
  - If backend returns `otpRequired`, submit again with the 6-digit OTP.
