const express = require('express');
const router = express.Router();
const defectReportController = require('../controllers/defectReportController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const upload = require('../config/multer');

router.post('/', protect, upload.single('photo'), defectReportController.createReport);
router.get('/my', protect, defectReportController.getMyReports);
router.get('/', protect, authorize('admin', 'manager'), defectReportController.getAllReports);
router.put('/:id/status', protect, authorize('admin', 'manager'), defectReportController.updateReportStatus);
router.delete('/:id', protect, authorize('admin', 'manager'), defectReportController.deleteReport);

module.exports = router;
