const express = require('express');
const router = express.Router();
const learningVideoController = require('../controllers/learningVideoController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.post('/', protect, authorize('admin', 'manager'), learningVideoController.createVideo);
router.get('/metrics/summary', protect, learningVideoController.getVideoMetrics);
router.get('/', protect, learningVideoController.getVideos);
router.get('/:id', protect, learningVideoController.getVideo);
router.put('/:id', protect, authorize('admin', 'manager'), learningVideoController.updateVideo);
router.delete('/:id', protect, authorize('admin', 'manager'), learningVideoController.deleteVideo);

module.exports = router;
