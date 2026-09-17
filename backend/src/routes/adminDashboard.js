const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.get('/summary', protect, authorize('admin', 'manager'), adminDashboardController.getSummary);
router.get('/health', protect, authorize('admin', 'manager'), adminDashboardController.getHealth);
router.get('/oee', protect, authorize('admin', 'manager'), adminDashboardController.getOeeTelemetry);
router.get('/audit-logs', protect, authorize('admin'), adminDashboardController.getAuditLogs);

module.exports = router;

