# Glossy-Gly-Kitchen API Reference

Base URL: `http://localhost:3000`  
Content type: `application/json`

## Conventions
- Auth header: `Authorization: Bearer <accessToken>`
- UUID identifiers are used across users/orders/payments/admin entities.
- Most list endpoints support pagination with query params:
  - `page` (default `1`)
  - `limit` (default `20`, max `100`)
- Standard error payload:
```json
{
  "error": "Human readable message"
}
```

## Authentication Summary
- Access tokens are short-lived JWTs.
- Refresh tokens are rotated server-side via `/auth/refresh` and `/admin/auth/refresh`.
- Logout endpoints revoke refresh tokens.

---

## Auth (User)

### POST `/auth/signup`
Body:
- `email` (required)
- `password` (required)
- `phone` (optional)
- `referralCode` (optional)

Response (201):
```json
{
  "message": "User registered successfully. Please verify your account.",
  "userId": "uuid"
}
```

### POST `/auth/verify`
Body: `userId`, `otp`

### POST `/auth/resend-otp`
Body: `email`

### POST `/auth/google`
Body: `idToken`, optional `deviceId`, `referralCode`

### POST `/auth/apple`
Body: `identityToken`, optional `deviceId`, `referralCode`

### POST `/auth/login`
Body: `email`, `password`, optional `deviceId`

### POST `/auth/request-login-otp`
Body: `email`

### POST `/auth/login-otp`
Body: `email`, `otp`, optional `deviceId`

### POST `/auth/forgot-password/request`
Body: `email`

### POST `/auth/forgot-password/verify`
Body: `email`, `otp`  
Response includes temporary `resetToken`.

### POST `/auth/forgot-password/reset`
Body: `resetToken`, `newPassword`

### POST `/auth/refresh`
Body: `refreshToken`

### POST `/auth/logout`
Headers: user bearer token  
Body: `refreshToken`

### POST `/auth/logout-all`
Headers: user bearer token

### GET `/auth/me`
Headers: user bearer token

### PATCH `/auth/me`
Headers: user bearer token  
Body supports:
- `phone`
- `currentPassword` + `newPassword` (password change)

### POST `/auth/referral-code/generate`
Headers: user bearer token

### POST `/auth/delete-account/request-otp`
Headers: user bearer token

### DELETE `/auth/delete-account`
Headers: user bearer token  
Body: `otp` (6 digits)

---

## Foods

### GET `/foods`
Public menu listing (available items).

### GET `/foods/categories`
Public food categories.

### GET `/foods/:id`
Get a single food item.

### GET `/foods/admin/all`
Headers: admin bearer token  
Admin-only full item listing.

### POST `/foods`
Headers: admin bearer token  
Body:
- `name` (required)
- `price` (required, positive number)
- `categoryId` or `category` (one required)
- `description` (optional)
- `currency` (optional, only `NGN` accepted)
- `imageDataUrl` (optional, base64 data URL)
- `imageFileName` (optional, used for file naming)

Image upload validation:
- Supported MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Max payload size: `5MB`
- Images are persisted and returned as `/uploads/<file>`

### PUT `/foods/:id`
Headers: admin bearer token
Body (partial update supported):
- `name`
- `price`
- `description`
- `categoryId` or `category`
- `currency` (only `NGN` accepted)
- `available` (boolean)
- `imageDataUrl` + optional `imageFileName` to replace image
- `removeImage: true` to clear existing image

Notes:
- If `imageDataUrl` is provided, current image is replaced.
- If `removeImage` is `true` and no new image is provided, image is removed.

### DELETE `/foods/:id`
Headers: admin bearer token

### POST `/foods/categories`
Headers: admin bearer token  
Body: `name`

### PUT `/foods/categories/:id`
Headers: admin bearer token  
Body: `name`

### DELETE `/foods/categories/:id`
Headers: admin bearer token

---

## Cart
All cart routes require user bearer token.

### POST `/cart`
Body: `foodId`, `quantity`

### GET `/cart`

### PUT `/cart`
Body: `foodId`, `quantity`

### DELETE `/cart`

---

## Orders
User routes require user bearer token.

### POST `/orders`
Create order from current cart.
Body supports either:
- `addressId` (saved address id), or
- `deliveryAddress` object:
  - `recipientName`, `phone`, `addressLine1`, `city`, `state` (required)
  - `label`, `addressLine2`, `country`, `postalCode`, `notes` (optional)
- `saveAddress` (optional boolean, when using `deliveryAddress`)
- `saveAsDefault` (optional boolean)

### GET `/orders`
Query params:
- `status` (optional)
- `page`, `limit` (optional)

### GET `/orders/:id`

### GET `/orders/addresses`
List authenticated user's saved addresses.

### POST `/orders/addresses`
Create a saved address.

### PUT `/orders/addresses/:addressId`
Update a saved address.  
Supports partial updates and `isDefault`.

### DELETE `/orders/addresses/:addressId`
Delete a saved address.

### POST `/orders/:id/coupon/validate`
Body: `couponCode`

### POST `/orders/:id/coupon/apply`
Body: `couponCode`

### DELETE `/orders/:id/coupon`

### POST `/orders/:id/cancel`
Customer cancellation (pending orders only).

### PATCH `/orders/:id/status`
Headers: admin bearer token  
Body: `status`

---

## Payments
User payment routes require user bearer token.

### POST `/payments/initialize`
Body:
- `orderId` (required)
- `callbackUrl` (optional, `https` only if supplied)
- `saveCard` (optional)

Response fields include:
- `reference`
- `authorizationUrl`
- `accessCode`

### GET `/payments/verify/:reference`
Verifies payment and updates order/payment state.

### POST `/payments/cards`
Body: `reference`  
Attach reusable card from successful payment reference.

### GET `/payments/cards`
List user saved cards.

### PATCH `/payments/cards/:cardId/default`
Set default saved card.

### DELETE `/payments/cards/:cardId`
Delete saved card.

### POST `/payments/pay-with-saved-card`
Body: `orderId`, `cardId`

### POST `/payments/webhook/paystack`
Public webhook endpoint.  
Requires valid `x-paystack-signature`.

---

## Admin

### POST `/admin/auth/bootstrap`
Headers: `x-admin-bootstrap-key`  
Body: `email`, `password`, `fullName`, optional `role`

### POST `/admin/auth/login`
Body: `email`, `password`, optional `otp`, `deviceId`, `deviceLabel`

### POST `/admin/auth/refresh`
Body: `refreshToken`

### POST `/admin/auth/logout`
Headers: admin bearer token  
Body: `refreshToken`

### POST `/admin/auth/logout-all`
Headers: admin bearer token

### GET `/admin/me`
Headers: admin bearer token

### GET `/admin/dashboard`
Headers: admin bearer token

### POST `/admin/admins`
Headers: admin bearer token (super admin only)

### GET `/admin/users`
Headers: admin bearer token  
Query params (optional): `search`, `verified`, `suspended`, `page`, `limit`

### GET `/admin/users/:id`
Headers: admin bearer token

### PATCH `/admin/users/:id/status`
Headers: admin bearer token  
Body supports `verified`, `isSuspended`

### GET `/admin/orders`
Headers: admin bearer token  
Query params (optional): `status`, `userId`, `page`, `limit`

### GET `/admin/orders/:id`
Headers: admin bearer token

### PATCH `/admin/orders/:id/status`
Headers: admin bearer token  
Body: `status`

### POST `/admin/coupons`
Headers: admin bearer token  
Body:
- `code` (optional, autogenerated when omitted)
- `description` (optional)
- `discountType` (`percentage` or `fixed`)
- `discountValue`
- `maxRedemptions` (optional)
- `startsAt` (optional ISO datetime)
- `expiresAt` (optional ISO datetime)
- `isActive` (optional boolean)

### GET `/admin/coupons`
Headers: admin bearer token  
Query params (optional): `active`, `page`, `limit`

### POST `/admin/referral-codes`
Headers: admin bearer token  
Body: `userId`, optional `code`

### GET `/admin/referral-codes`
Headers: admin bearer token  
Query params (optional): `userId`, `code`, `page`, `limit`

### POST `/admin/disputes`
Headers: admin bearer token  
Body: `title`, `description`, optional `orderId`, `userId`, `priority`, `category`, `assignedAdminId`

### GET `/admin/disputes`
Headers: admin bearer token  
Query params (optional): `status`, `priority`, `assignedAdminId`, `page`, `limit`

### GET `/admin/disputes/:id`
Headers: admin bearer token

### PATCH `/admin/disputes/:id`
Headers: admin bearer token  
Body supports: `status`, `priority`, `category`, `assignedAdminId`, `resolutionNotes`

### POST `/admin/disputes/:id/resolve`
Headers: admin bearer token  
Body: `resolutionNotes`

### POST `/admin/disputes/:id/comments`
Headers: admin bearer token  
Body: `comment`, optional `isInternal`

### GET `/admin/audit-logs`
Headers: admin bearer token  
Query params (optional): `action`, `method`, `statusCode`, `requestId`, `from`, `to`, `page`, `limit`

---

## System

### GET `/health`
Health-check endpoint.

### GET `/ready`
Readiness-check endpoint.
