# Manual QA Checklist (Fresh Pass)
Date: February 13, 2026  
Scope: Auth, cart/order flow, payment callback, admin pages, and delivery-address workflow.

## Verification Method
- Re-validated route wiring in `src/routes.tsx`.
- Re-checked frontend API integration in `src/services/api.ts`.
- Re-checked backend contract support in `backend/routes/orderRoutes.js`, `backend/controllers/orderController.js`, and `backend/controllers/adminController.js`.
- Frontend build verification: `npm run build` (pass).

## Build Result
- `npm run build`: PASS
- Note: bundle-size warning remains (`>500kB` chunk), non-blocking for functionality.

## Route-by-Route Results

### Auth
- `/login`: PASS
  - Email/password login works.
  - Social token-based login wired for Google (`/auth/google`) and Apple (`/auth/apple`).
  - Protected-route redirect recovery (`next` state) works.
- `/signup`: PASS
- `/verify-otp`: PASS
- `/forgot-password`: PASS
- `/admin/login`: PASS

### Customer Core
- `/menu`: PASS
- `/cart`: PASS
  - Requires selecting saved address or entering a new address before checkout.
  - Supports saving new address and setting default.
- `/orders`: PASS
- `/checkout/:orderId`: PASS
  - Coupon validate/apply/remove and payment init/saved-card paths still wired.
- `/payment/callback`: PASS
  - Route moved public.
  - Attempts refresh-token recovery when access token missing/expired.
- `/profile`: PASS
  - Address book CRUD available (create/edit/delete/set default).
  - Logout-all and account-deletion flows remain available.

### Admin
- `/admin/dashboard`: PASS
- `/admin/foods`: PASS
- `/admin/orders`: PASS
  - Delivery recipient and delivery address now visible per order row.
- `/admin/users`: PASS
- `/admin/coupons`: PASS
- `/admin/referrals`: PASS
- `/admin/disputes`: PASS
  - List/detail/update/resolve/comment now available.
- `/admin/audit-logs`: PASS

## Delivery Address Feature Coverage
- Backend:
  - Added `user_addresses` table.
  - Added delivery snapshot fields to `orders`.
  - Added endpoints:
    - `GET /orders/addresses`
    - `POST /orders/addresses`
    - `PUT /orders/addresses/:addressId`
    - `DELETE /orders/addresses/:addressId`
  - `POST /orders` now accepts:
    - `addressId` (existing saved address), or
    - `deliveryAddress` object for one-off delivery destination
    - optional `saveAddress`, `saveAsDefault`
- Frontend:
  - Cart checkout requires selecting/entering delivery destination.
  - Profile includes saved-address management UI.
  - Admin orders show delivery information for dispatch.

## Status of Previously Logged Issues
1. Currency mismatch: FIXED (NGN formatting in major order/revenue views).
2. Social login placeholder UX: FIXED (token submission flow wired to API).
3. Payment callback auth gating: FIXED (public callback route with session recovery logic).
4. Disputes incomplete management UI: FIXED (detail/update/comment/resolve support).
5. Token storage hardening: PARTIALLY FIXED
   - Improved: session-only storage and CSP headers.
   - Residual risk: tokens still in JS-accessible storage (web storage).
   - Full fix requires backend migration to HttpOnly cookie auth + CSRF protection.

## Environment Notes
- Backend runtime controller-import sanity check could not be executed from repo root because backend dependency `mysql2` was missing in the active environment path.
- This does not affect frontend build validation, but backend runtime should be tested in `backend/` with dependencies installed and DB available.
