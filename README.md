# Glossy-Gly-Kitchen Web App

A full-stack food ordering platform with customer and admin portals.

## Author
- **Oluwayemi Oyinlola**
- Portfolio: **https://oyinlola.site**

## Project Structure
- `src/` - Frontend (React + Vite)
- `backend/` - Backend API (Node.js + Express + MySQL)
- `scripts/` - Utility/dev orchestration scripts

## Feature Overview
- Customer authentication: signup, OTP verification, login, forgot password, profile updates.
- Customer ordering: menu browsing, cart management, order creation/tracking/cancellation.
- Payments: Paystack initialization, verification callback, saved card support.
- Promotions: coupon application/removal and referral code generation.
- Admin portal: dashboard, food management, orders, users, coupons, referrals, disputes, audit logs.

## Quick Start

### 1. Install dependencies
```bash
npm install
cd backend && npm install
```

### 2. Configure environment
- Frontend: create `.env` at project root
```env
VITE_API_URL=http://localhost:3000
```
- Backend: create `backend/.env` with DB, JWT, SMTP, and payment keys.

Minimal backend variables (example names used in codebase):
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_ISSUER`
- `ADMIN_JWT_EXPIRES_IN`, `ADMIN_BOOTSTRAP_KEY`
- `AUTH_RATE_LIMIT_MAX`, `ADMIN_AUTH_RATE_LIMIT_MAX`, `OTP_IDENTITY_RATE_LIMIT_MAX`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- `PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET`

### 3. Run both frontend + backend together
From project root:
```bash
npm run dev
```

This starts:
- Frontend (Vite) at your configured dev port
- Backend (nodemon) from `backend/`

## Production Readiness Baseline

1. Environment and secrets
- Use `.env.example` and `backend/.env.example` as templates only.
- Set strong values for `JWT_SECRET`, `ADMIN_BOOTSTRAP_KEY`, and admin credentials.
- Set `NODE_ENV=production` and explicit `CORS_ORIGIN`.

2. Build and run
```bash
npm run build
npm run start:backend
npm start
```

3. Operational checks
- Verify `GET /health` and `GET /ready` return success.
- Ensure HTTPS is terminated at your reverse proxy/load balancer.
- Confirm log write path from `LOG_FILE` is mounted and rotated.

4. Git hygiene
- `.env` files and runtime uploads are ignored by git.
- Rotate any previously committed secrets before deployment.

## Useful Commands
- `npm run dev` - Run frontend + backend together
- `npm run dev:frontend` - Run only frontend
- `npm run dev:backend` - Run only backend
- `npm start` - Run frontend via Vite
- `npm run build` - Build frontend production bundle

## API and Contract Docs
- Primary API reference: `backend/API.md`
- Auth and admin context consumers: `src/contexts/AuthContext.tsx`, `src/contexts/AdminAuthContext.tsx`
- API client: `src/services/api.ts`

## Recent Documentation Updates
- Meal image management now supports:
- `imageDataUrl` + `imageFileName` when creating/updating meals
- `removeImage: true` when removing an existing meal image on update
- Local development CSP allows backend-hosted meal images from `http://localhost:3000`.
- Frontend auth forms include browser-friendly `autocomplete` attributes for email/password fields.
- App favicon is served from `public/favicon.svg`.

## Route Inventory
- Public auth routes: `/login`, `/signup`, `/verify-otp`, `/forgot-password`
- User routes (protected): `/menu`, `/cart`, `/orders`, `/checkout/:orderId`, `/payment/callback`, `/profile`
- Admin routes (protected): `/admin/dashboard`, `/admin/foods`, `/admin/orders`, `/admin/users`, `/admin/coupons`, `/admin/referrals`, `/admin/disputes`, `/admin/audit-logs`

## QA Artifacts
- Manual route-by-route QA checklist and findings: `QA_MANUAL_CHECKLIST.md`

## Security Notes
- API routes are protected with JWT auth, role checks, and rate limiting in backend middleware.
- Refresh-token rotation is implemented server-side; frontend has automatic refresh retry logic.
- Current token persistence uses browser storage. For higher-security deployments, migrate to secure HttpOnly cookies with CSRF controls.

## Troubleshooting
- If frontend shows network errors, confirm `VITE_API_URL` and backend port alignment.
- If auth loops to login, verify JWT secret config and refresh token DB tables/migrations.
- If payment callback fails in local HTTP, note backend accepts only `https` callback URLs when `callbackUrl` is explicitly sent.
- If admin login asks for OTP repeatedly, verify trusted-device persistence tables/migrations.
- If meal images fail to render in admin, verify backend is running on `http://localhost:3000` and image paths are returned as `/uploads/...`.
- If browser warns about missing favicon, verify `public/favicon.svg` exists and clear cache.

## Documentation
- Frontend details: `src/README.md`
- Backend details: `backend/README.md`
- Backend API reference: `backend/API.md`
- Security policy and disclosure process: `security.md`

## License
This project is licensed under the terms in the root `LICENSE` file.
