const express = require('express');
const router = express.Router({ mergeParams: true });
const cartController = require('../controllers/cartController');
const { requireVerifiedUser } = require('../utils/userGuard');
const { requireAuth } = require('../utils/jwtAuth');
const { rateLimit } = require('../utils/security');

const cartLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.CART_RATE_LIMIT_MAX) > 0
    ? Number(process.env.CART_RATE_LIMIT_MAX)
    : 120,
  keyGenerator: (req) => `cart:${req.ip}`,
});

router.post('/', cartLimiter, requireAuth, requireVerifiedUser, cartController.addToCart);
router.get('/', cartLimiter, requireAuth, requireVerifiedUser, cartController.viewCart);
router.put('/', cartLimiter, requireAuth, requireVerifiedUser, cartController.updateCartItem);
router.delete('/', cartLimiter, requireAuth, requireVerifiedUser, cartController.clearCart);

module.exports = router;
