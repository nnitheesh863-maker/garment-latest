const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { createOrderRules, updateOrderRules, validate } = require('../middleware/validate');

router.post('/', protect, authorize('admin', 'manager'), createOrderRules, validate, orderController.createOrder);
router.put('/batch/status', protect, authorize('admin', 'manager'), orderController.batchUpdateStatus);
router.get('/', protect, orderController.getOrders);
router.get('/analytics', protect, orderController.getOrderAnalytics);
router.get('/:id', protect, orderController.getOrder);
router.put('/:id', protect, authorize('admin', 'manager'), updateOrderRules, validate, orderController.updateOrder);
router.delete('/:id', protect, authorize('admin'), orderController.deleteOrder);
router.route('/:id/assign')
  .post(protect, authorize('admin', 'manager'), orderController.assignOrder)
  .put(protect, authorize('admin', 'manager'), orderController.assignOrder);

router.route('/:id/status')
  .put(protect, authorize('admin', 'manager'), orderController.updateStatus)
  .post(protect, authorize('admin', 'manager'), orderController.updateStatus);

router.route('/:id/predict')
  .get(protect, orderController.predictOrder)
  .post(protect, orderController.predictOrder);


module.exports = router;
