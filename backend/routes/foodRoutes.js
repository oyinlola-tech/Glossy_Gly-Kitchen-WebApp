const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const { requireAdminAuth } = require('../utils/adminJwtAuth');
const { auditAdminAction } = require('../utils/audit');
const { rateLimit } = require('../utils/security');

const foodPublicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.FOOD_PUBLIC_RATE_LIMIT_MAX) > 0
    ? Number(process.env.FOOD_PUBLIC_RATE_LIMIT_MAX)
    : 180,
  keyGenerator: (req) => `foods-public:${req.ip}`,
});

const foodAdminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.FOOD_ADMIN_RATE_LIMIT_MAX) > 0
    ? Number(process.env.FOOD_ADMIN_RATE_LIMIT_MAX)
    : 90,
  keyGenerator: (req) => `foods-admin:${req.ip}`,
});

router.get('/', foodPublicLimiter, foodController.getAllFoods);
router.get('/categories', foodPublicLimiter, foodController.listCategories);
router.get('/admin/all', foodAdminLimiter, requireAdminAuth, auditAdminAction('food.list_admin'), foodController.getAllFoodsForAdmin);
router.post('/categories', foodAdminLimiter, requireAdminAuth, auditAdminAction('food.category.create'), foodController.createCategory);
router.put('/categories/:id', foodAdminLimiter, requireAdminAuth, auditAdminAction('food.category.update'), foodController.updateCategory);
router.delete('/categories/:id', foodAdminLimiter, requireAdminAuth, auditAdminAction('food.category.delete'), foodController.deleteCategory);
router.get('/:id', foodPublicLimiter, foodController.getFoodById);
router.post('/', foodAdminLimiter, requireAdminAuth, auditAdminAction('food.create'), foodController.addFood);
router.put('/:id', foodAdminLimiter, requireAdminAuth, auditAdminAction('food.update'), foodController.updateFood);
router.delete('/:id', foodAdminLimiter, requireAdminAuth, auditAdminAction('food.delete'), foodController.deleteFood);

module.exports = router;
