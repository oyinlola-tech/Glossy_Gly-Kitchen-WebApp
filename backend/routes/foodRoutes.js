const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const { requireAdminAuth } = require('../utils/adminJwtAuth');
const { auditAdminAction } = require('../utils/audit');

router.get('/', foodController.getAllFoods);
router.get('/categories', foodController.listCategories);
router.get('/admin/all', requireAdminAuth, auditAdminAction('food.list_admin'), foodController.getAllFoodsForAdmin);
router.post('/categories', requireAdminAuth, auditAdminAction('food.category.create'), foodController.createCategory);
router.put('/categories/:id', requireAdminAuth, auditAdminAction('food.category.update'), foodController.updateCategory);
router.delete('/categories/:id', requireAdminAuth, auditAdminAction('food.category.delete'), foodController.deleteCategory);
router.get('/:id', foodController.getFoodById);
router.post('/', requireAdminAuth, auditAdminAction('food.create'), foodController.addFood);
router.put('/:id', requireAdminAuth, auditAdminAction('food.update'), foodController.updateFood);
router.delete('/:id', requireAdminAuth, auditAdminAction('food.delete'), foodController.deleteFood);

module.exports = router;
