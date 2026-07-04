const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { createTaskRules, updateTaskRules, validate } = require('../middleware/validate');

router.post('/', protect, authorize('admin', 'manager'), createTaskRules, validate, taskController.createTask);
router.get('/', protect, taskController.getTasks);
router.get('/analytics', protect, taskController.getTaskAnalytics);
router.get('/employee/:id', protect, taskController.getEmployeeTasks);
router.get('/:id', protect, taskController.getTask);
router.put('/:id', protect, updateTaskRules, validate, taskController.updateTask);
router.put('/:id/assign', protect, authorize('admin', 'manager'), taskController.assignTask);
router.put('/:id/status', protect, taskController.updateStatus);
router.post('/:id/progress', protect, taskController.updateProgress);
router.post('/:id/complete', protect, taskController.completeTask);

module.exports = router;
