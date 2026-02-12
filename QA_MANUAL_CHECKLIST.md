# Manual QA Checklist (Route-by-Route)
Date: February 13, 2026  
Scope: Frontend route flows + API contract checks from source review and production build validation (`npm run build`).

## Test Method
- Verified route wiring in `src/routes.tsx`.
- Verified each route component against `src/services/api.ts` method contracts.
- Cross-checked endpoint usage against backend handlers in `backend/routes/*.js` and `backend/controllers/*.js`.
- Built frontend for runtime/type break detection.

## Build Gate
- `npm run build`: PASS

## Checklist Results

### Auth Routes
- `/login`: PASS (email/password auth wired to `/auth/login`; profile hydration via `/auth/me`).
- `/signup`: PASS (`/auth/signup` wired; verification handoff to `/verify-otp`).
- `/verify-otp`: PASS (`/auth/verify` and `/auth/resend-otp` wired).
- `/forgot-password`: PASS (`/auth/forgot-password/request`, `/verify`, `/reset` wired).
- Admin `/admin/login`: PASS (`/admin/auth/login` with OTP-required branch support).

### Customer Routes
- `/menu`: PASS (`/foods` read, add-to-cart via `/cart`).
- `/cart`: PASS (`GET/PUT/DELETE /cart`, `POST /orders` checkout handoff).
- `/orders`: PASS (`GET /orders`, cancel via `POST /orders/:id/cancel`).
- `/checkout/:orderId`: PASS (`GET /orders/:id`, coupon validate/apply/remove, payment initialize, saved-card pay).
- `/payment/callback`: PASS (`GET /payments/verify/:reference`).
- `/profile`: PASS (`PATCH /auth/me`, referral generation, logout-all, account deletion OTP/delete).

### Admin Routes
- `/admin/dashboard`: PASS (`GET /admin/dashboard` wired).
- `/admin/foods`: PASS (`GET /foods`, create/update/delete food).
- `/admin/orders`: PASS (`GET /admin/orders`, `PATCH /admin/orders/:id/status`).
- `/admin/users`: PASS (`GET /admin/users`, `PATCH /admin/users/:id/status`).
- `/admin/coupons`: PASS (`GET/POST /admin/coupons`).
- `/admin/referrals`: PASS (`GET /admin/referral-codes`).
- `/admin/disputes`: PASS (`GET/POST /admin/disputes`, `POST /admin/disputes/:id/resolve`).
- `/admin/audit-logs`: PASS (`GET /admin/audit-logs`).

## Runtime/API Contract Issues Logged
Severity: Medium
1. Currency mismatch across UI and backend.
- Frontend displays `$` in customer/admin totals while backend payment/order currency is `NGN` by default.
- Impact: misleading amounts and settlement expectations.
- References: `src/components/pages/Cart.tsx`, `src/components/pages/Checkout.tsx`, `src/components/pages/Orders.tsx`, `src/components/admin/AdminOrders.tsx`, `src/components/admin/Dashboard.tsx`.

Severity: Medium
2. Social login UX is not a complete OAuth flow.
- Google/Apple buttons do not collect provider tokens; they only show informational toasts.
- Backend endpoints exist (`/auth/google`, `/auth/apple`), but UI path is incomplete.
- References: `src/components/auth/Login.tsx`.

Severity: Medium
3. Payment callback is auth-gated.
- `/payment/callback` is inside `ProtectedRoute`; if session is missing/expired after gateway redirect, automatic verification is blocked.
- Backend `GET /payments/verify/:reference` requires auth, so this is expected technically, but fragile UX.
- References: `src/routes.tsx`, `src/components/pages/PaymentCallback.tsx`.

Severity: Low
4. Disputes UI does not expose full dispute management API surface.
- Missing UI for details view, update (`PATCH /admin/disputes/:id`), and comments (`POST /admin/disputes/:id/comments`).
- References: `src/components/admin/Disputes.tsx`, `src/services/api.ts`.

Severity: Low
5. Token storage remains web-storage based.
- Access/refresh tokens in `sessionStorage`/`localStorage` remain vulnerable to XSS exfiltration.
- Better model: secure HttpOnly cookies with CSRF protection.
- References: `src/contexts/AuthContext.tsx`, `src/contexts/AdminAuthContext.tsx`, `src/services/api.ts`.

## Issues Fixed During This QA Pass
- Fixed forgot-password OTP input sanitization (digits only).
- Replaced resend-OTP synthetic event hack with explicit resend function.
- Reference: `src/components/auth/ForgotPassword.tsx`.

## Recommended Next QA Step
- Execute environment-backed manual API tests against running backend + DB using seeded users/admins and real Paystack test keys to validate response payloads and status transitions end-to-end.
