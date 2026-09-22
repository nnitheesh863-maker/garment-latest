const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { createTaskRules, updateTaskRules, validate } = require('../middleware/validate');

router.post('/', protect, authorize('admin', 'manager'), createTaskRules, validate, taskController.createTask);
router.get('/', protect, taskController.getTasks);
router.get('/analytics', protect, taskController.getTaskAnalytics);
router.get('/summary/today', protect, taskController.getTaskSummary);
router.get('/employee/:id', protect, taskController.getEmployeeTasks);
router.get('/:id', protect, taskController.getTask);
router.put('/:id', protect, updateTaskRules, validate, taskController.updateTask);
router.route('/:id/assign')
  .put(protect, authorize('admin', 'manager'), taskController.assignTask)
  .post(protect, authorize('admin', 'manager'), taskController.assignTask);

router.route('/:id/status')
  .put(protect, taskController.updateStatus)
  .post(protect, taskController.updateStatus);

router.route('/:id/progress')
  .post(protect, taskController.updateProgress)
  .put(protect, taskController.updateProgress);

router.route('/:id/complete')
  .post(protect, taskController.completeTask)
  .put(protect, taskController.completeTask);


module.exports = router;
