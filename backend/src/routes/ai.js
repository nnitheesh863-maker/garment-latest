const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.post('/predict', protect, aiController.getPrediction);
router.post('/analyze', protect, aiController.getAnalysis);
router.get('/recommendations', protect, aiController.getRecommendations);
router.post('/train', protect, authorize('admin'), aiController.triggerTraining);
router.get('/model-status', protect, aiController.getModelStatus);
router.get('/dashboard', protect, aiController.getDashboardData);

module.exports = router;
