const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.post('/', protect, leaveController.createLeaveRequest);
router.get('/', protect, authorize('admin', 'manager'), leaveController.getLeaveRequests);
router.get('/my', protect, leaveController.getMyLeaves);
router.put('/:id/status', protect, authorize('admin', 'manager'), leaveController.updateLeaveStatus);

module.exports = router;
