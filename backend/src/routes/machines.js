const express = require('express');
const router = express.Router();
const machineController = require('../controllers/machineController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { createMachineRules, validate } = require('../middleware/validate');

router.get('/', protect, machineController.getMachines);
router.post('/', protect, authorize('admin'), createMachineRules, validate, machineController.createMachine);
router.get('/analytics', protect, machineController.getMachineAnalytics);
router.get('/:id', protect, machineController.getMachine);
router.put('/:id', protect, authorize('admin'), machineController.updateMachine);
router.delete('/:id', protect, authorize('admin'), machineController.deleteMachine);
router.route('/:id/status')
  .put(protect, authorize('admin', 'manager'), machineController.updateStatus)
  .post(protect, authorize('admin', 'manager'), machineController.updateStatus);

router.route('/:id/maintenance')
  .post(protect, machineController.scheduleMaintenance)
  .put(protect, machineController.scheduleMaintenance);

router.post('/:id/maintenance-log', protect, authorize('admin', 'manager'), machineController.recordMaintenanceLog);

router.route('/:id/predict')
  .get(protect, machineController.predictFailure)
  .post(protect, machineController.predictFailure);


module.exports = router;
