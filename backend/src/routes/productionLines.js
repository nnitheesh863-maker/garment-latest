const express = require('express');
const router = express.Router();
const lineController = require('../controllers/productionLineController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.get('/', protect, lineController.getLines);
router.post('/', protect, authorize('admin'), lineController.createLine);
router.get('/analytics', protect, lineController.getLineAnalytics);
router.get('/:id', protect, lineController.getLine);
router.put('/:id', protect, authorize('admin'), lineController.updateLine);
router.delete('/:id', protect, authorize('admin'), lineController.deleteLine);

module.exports = router;
