const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { createOrderRules, updateOrderRules, validate } = require('../middleware/validate');

router.post('/', protect, authorize('admin', 'manager'), createOrderRules, validate, orderController.createOrder);
router.get('/', protect, orderController.getOrders);
router.get('/analytics', protect, orderController.getOrderAnalytics);
router.get('/:id', protect, orderController.getOrder);
router.put('/:id', protect, authorize('admin', 'manager'), updateOrderRules, validate, orderController.updateOrder);
router.delete('/:id', protect, authorize('admin'), orderController.deleteOrder);
router.post('/:id/assign', protect, authorize('admin', 'manager'), orderController.assignOrder);
router.put('/:id/status', protect, authorize('admin', 'manager'), orderController.updateStatus);
router.post('/:id/predict', protect, orderController.predictOrder);

module.exports = router;
