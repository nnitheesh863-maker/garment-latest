const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { createInventoryRules, updateStockRules, validate } = require('../middleware/validate');

router.get('/', protect, inventoryController.getInventory);
router.post('/bulk-stock', protect, authorize('admin', 'manager'), inventoryController.bulkStockAdjust);
router.post('/', protect, authorize('admin'), createInventoryRules, validate, inventoryController.createItem);
router.get('/reorder', protect, inventoryController.getReorderItems);
router.get('/analytics', protect, inventoryController.getInventoryAnalytics);
router.get('/:id', protect, inventoryController.getItem);
router.put('/:id', protect, authorize('admin'), inventoryController.updateItem);
router.delete('/:id', protect, authorize('admin'), inventoryController.deleteItem);
router.put('/:id/stock', protect, updateStockRules, validate, inventoryController.updateStock);
router.post('/:id/reorder', protect, inventoryController.createReorder);

module.exports = router;
