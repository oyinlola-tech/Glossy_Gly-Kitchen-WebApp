const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { requireVerifiedUser } = require('../utils/userGuard');
const { requireAuth } = require('../utils/jwtAuth');
const { requireAdminAuth } = require('../utils/adminJwtAuth');
const { auditAdminAction } = require('../utils/audit');
const { rateLimit } = require('../utils/security');

const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.ORDER_RATE_LIMIT_MAX) > 0
    ? Number(process.env.ORDER_RATE_LIMIT_MAX)
    : 120,
  keyGenerator: (req) => `orders:${req.ip}`,
});

router.post('/', orderLimiter, requireAuth, requireVerifiedUser, orderController.createOrder);
router.get('/', orderLimiter, requireAuth, requireVerifiedUser, orderController.listMyOrders);
router.get('/addresses', orderLimiter, requireAuth, requireVerifiedUser, orderController.listMyAddresses);
router.post('/addresses', orderLimiter, requireAuth, requireVerifiedUser, orderController.createAddress);
router.put('/addresses/:addressId', orderLimiter, requireAuth, requireVerifiedUser, orderController.updateAddress);
router.delete('/addresses/:addressId', orderLimiter, requireAuth, requireVerifiedUser, orderController.deleteAddress);
router.get('/:id', orderLimiter, requireAuth, requireVerifiedUser, orderController.getOrderById);
router.post('/:id/coupon/validate', orderLimiter, requireAuth, requireVerifiedUser, orderController.validateCouponForOrder);
router.post('/:id/coupon/apply', orderLimiter, requireAuth, requireVerifiedUser, orderController.applyCouponToOrder);
router.delete('/:id/coupon', orderLimiter, requireAuth, requireVerifiedUser, orderController.removeCouponFromOrder);
router.patch(
  '/:id/status',
  orderLimiter,
  requireAdminAuth,
  auditAdminAction('order.status.update'),
  orderController.updateOrderStatus
);
router.post('/:id/cancel', orderLimiter, requireAuth, requireVerifiedUser, orderController.cancelOrder);

module.exports = router;
