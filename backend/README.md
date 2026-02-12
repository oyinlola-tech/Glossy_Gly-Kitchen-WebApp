# Glossy-Gly-Kitchen Backend

Express + MySQL API for authentication, menu, cart, orders, payments, and admin operations.

## Stack
- Node.js + Express
- MySQL (`mysql2/promise`)
- JWT auth (user + admin token domains)
- OTP flows via email
- Paystack integration
- Swagger docs

## Prerequisites
- Node.js 18+
- MySQL server
- SMTP credentials for email delivery

## Setup
1. Install dependencies:
```bash
npm install
```
2. Configure environment variables in `.env` (see `.env.example` if available).
3. Run in development:
```bash
npm run dev
```
4. Run in production:
```bash
npm start
```

## Runtime Endpoints
- Health: `GET /health`
- Readiness: `GET /ready`
- Swagger UI: `GET /api-docs`
- OpenAPI JSON: `GET /api-docs.json`
- Extended API reference: `backend/API.md`

## Route Groups
- `/auth`: signup/login/otp/profile/password/reset/delete account/social auth
- `/foods`: public menu + admin food management
- `/cart`: authenticated user cart actions
- `/orders`: authenticated user orders + admin status updates
- `/payments`: initialize/verify/cards/saved-card payments + webhook
- `/admin`: admin auth, dashboard, users, orders, coupons, referrals, disputes, audit logs

## Auth Model
- User endpoints: `Authorization: Bearer <user access token>`
- Admin endpoints: `Authorization: Bearer <admin access token>`
- Admin bootstrap: `x-admin-bootstrap-key: <ADMIN_BOOTSTRAP_KEY>`

## Database and Migrations
- Startup bootstraps required tables/columns without dropping data.
- For existing DBs, apply SQL files in `backend/migrations` in date order.
- Keep schema/migrations aligned with controller expectations.

## Security Features
- Request rate limiting
- OTP lockout protection
- Password hashing
- Refresh token storage and revocation
- Admin action audit logging
- Webhook signature verification + replay protection

## Common Troubleshooting
- Server exits at startup:
  - Check DB credentials and required env variables (JWT secrets, SMTP config, port).
- 401/403 responses on protected routes:
  - Ensure correct token type (user vs admin) and unexpired access token.
- Email-dependent flows failing:
  - Validate SMTP host/user/password and sender config.
- Payment callback/webhook issues:
  - Confirm Paystack secret keys and webhook signature handling settings.
