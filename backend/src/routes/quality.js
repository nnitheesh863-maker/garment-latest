const express = require('express');
const router = express.Router();
const qualityController = require('../controllers/qualityController');
const { protect } = require('../middleware/auth');
const { createInspectionRules, validate } = require('../middleware/validate');

router.post('/', protect, createInspectionRules, validate, qualityController.createInspection);
router.get('/', protect, qualityController.getInspections);
router.get('/analytics', protect, qualityController.getQualityAnalytics);
router.post('/:id/approve', protect, qualityController.approveQuality);
router.post('/:id/rework', protect, qualityController.requestRework);
router.post('/:id/reject', protect, qualityController.rejectQuality);
router.get('/:id', protect, qualityController.getInspection);
router.put('/:id', protect, qualityController.updateInspection);
router.post('/report', protect, qualityController.generateReport);

module.exports = router;
