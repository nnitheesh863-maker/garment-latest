const mongoose = require('mongoose');
const Quality = require('../models/Quality');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Task = require('../models/Task');
const Inventory = require('../models/Inventory');
const Machine = require('../models/Machine');
const ApiResponse = require('../utils/apiResponse');
const { emitToUser, emitToRoom, emitToAll } = require('../services/socketService');


let inspectionCounter = 0;

function generateInspectionNumber() {
  inspectionCounter += 1;
  const year = new Date().getFullYear();
  return `INS-${year}-${String(inspectionCounter).padStart(5, '0')}`;
}

exports.createInspection = async (req, res, next) => {
  try {
    const inspectionData = { ...req.body };
    inspectionData.inspectionNumber = generateInspectionNumber();
    inspectionData.inspector = req.user._id;

    if (inspectionData.results) {
      const { totalInspected, failedItems } = inspectionData.results;
      const passed = totalInspected - (failedItems || 0);
      inspectionData.results.passed = passed;
      inspectionData.results.failedItems = failedItems || 0;
      inspectionData.results.defectRate = totalInspected > 0
        ? Math.round(((failedItems || 0) / totalInspected) * 10000) / 100
        : 0;
    }

    const inspection = await Quality.create(inspectionData);
    const populated = await Quality.findById(inspection._id)
      .populate('inspector', 'email profile')
      .populate('orderId', 'orderNumber');

    await Order.findByIdAndUpdate(inspectionData.orderId, {
      $push: { qualityChecks: inspection._id },
    });

    const defectRate = inspection.results?.defectRate || 0;
    if (defectRate > 10) {
      const managers = await User.find({
        role: { $in: ['admin', 'manager'] },
        active: true,
      });

      const alerts = managers.map(mgr => ({
        recipient: mgr._id,
        sender: req.user._id,
        type: 'quality_alert',
        title: 'Quality Alert',
        message: `High defect rate (${defectRate}%) in inspection ${inspection.inspectionNumber} for order ${populated.orderId?.orderNumber || inspectionData.orderId}`,
        link: `/quality/${inspection._id}`,
        priority: 'high',
      }));

      if (alerts.length > 0) {
        await Notification.insertMany(alerts);
      }

      for (const mgr of managers) {
        emitToUser(mgr._id, 'newNotification', {
          type: 'quality_alert',
          inspection: populated,
        });
      }

      emitToRoom('management', 'qualityAlert', { inspection: populated, defectRate });
    }

    return ApiResponse.success(res, populated, 'Inspection recorded', 201);
  } catch (err) {
    next(err);
  }
};

exports.getInspections = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      orderId,
      inspector,
      inspectionType,
      grade,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = -1,
    } = req.query;

    const filter = {};
    if (orderId) filter.orderId = orderId;
    if (inspector) filter.inspector = inspector;
    if (inspectionType) filter.inspectionType = inspectionType;
    if (grade) filter.grade = grade;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const total = await Quality.countDocuments(filter);
    const inspections = await Quality.find(filter)
      .populate('inspector', 'email profile')
      .populate('orderId', 'orderNumber customer')
      .sort({ [sortBy]: Number(sortOrder) })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return ApiResponse.paginated(res, inspections, page, limit, total);
  } catch (err) {
    next(err);
  }
};

exports.getInspection = async (req, res, next) => {
  try {
    const inspection = await Quality.findById(req.params.id)
      .populate('inspector', 'email profile')
      .populate('orderId', 'orderNumber customer orderDetails')
      .populate('taskId', 'taskNumber title');

    if (!inspection) {
      return ApiResponse.error(res, 'Inspection not found', 404);
    }

    return ApiResponse.success(res, inspection);
  } catch (err) {
    next(err);
  }
};

exports.updateInspection = async (req, res, next) => {
  try {
    const allowedFields = ['results', 'defects', 'grade', 'notes', 'attachments'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.results) {
      const { totalInspected, failedItems } = updates.results;
      const passed = totalInspected - (failedItems || 0);
      updates.results.passed = passed;
      updates.results.defectRate = totalInspected > 0
        ? Math.round(((failedItems || 0) / totalInspected) * 10000) / 100
        : 0;
    }

    const inspection = await Quality.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('inspector', 'email profile')
      .populate('orderId', 'orderNumber');

    if (!inspection) {
      return ApiResponse.error(res, 'Inspection not found', 404);
    }

    return ApiResponse.success(res, inspection, 'Inspection updated');
  } catch (err) {
    next(err);
  }
};

exports.getQualityAnalytics = async (req, res, next) => {
  try {
    const { orderId, startDate, endDate } = req.query;

    const match = {};
      if (orderId) match.orderId = new mongoose.Types.ObjectId(orderId);
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const overallStats = await Quality.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalInspections: { $sum: 1 },
          totalPassed: { $sum: '$results.passed' },
          totalFailed: { $sum: '$results.failedItems' },
          totalInspected: { $sum: '$results.totalInspected' },
          avgDefectRate: { $avg: '$results.defectRate' },
        },
      },
    ]);

    const gradeDistribution = await Quality.aggregate([
      { $match: { ...match, grade: { $ne: null } } },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
    ]);

    const typeBreakdown = await Quality.aggregate([
      { $match: match },
      { $group: { _id: '$inspectionType', count: { $sum: 1 }, avgDefect: { $avg: '$results.defectRate' } } },
    ]);

    const passFailRate = await Quality.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalInspected: { $sum: '$results.totalInspected' },
          totalPassed: { $sum: '$results.passed' },
          totalFailed: { $sum: '$results.failedItems' },
        },
      },
    ]);

    return ApiResponse.success(res, {
      overall: overallStats[0] || { totalInspections: 0, totalPassed: 0, totalFailed: 0, totalInspected: 0, avgDefectRate: 0 },
      gradeDistribution,
      typeBreakdown,
      passFailRate: passFailRate[0] || { totalInspected: 0, totalPassed: 0, totalFailed: 0 },
    });
  } catch (err) {
    next(err);
  }
};

exports.generateReport = async (req, res, next) => {
  try {
    const { orderId, startDate, endDate } = req.body;

    if (!orderId && !startDate && !endDate) {
      return ApiResponse.error(res, 'Provide orderId or date range', 400);
    }

    const filter = {};
    if (orderId) filter.orderId = orderId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const inspections = await Quality.find(filter)
      .populate('inspector', 'email profile')
      .populate('orderId', 'orderNumber customer')
      .sort({ createdAt: -1 });

    const summary = {
      totalInspections: inspections.length,
      totalInspected: inspections.reduce((s, i) => s + (i.results?.totalInspected || 0), 0),
      totalPassed: inspections.reduce((s, i) => s + (i.results?.passed || 0), 0),
      totalFailed: inspections.reduce((s, i) => s + (i.results?.failedItems || 0), 0),
      averageDefectRate: inspections.length > 0
        ? inspections.reduce((s, i) => s + (i.results?.defectRate || 0), 0) / inspections.length
        : 0,
    };

    return ApiResponse.success(res, { summary, inspections }, 'Quality report generated');
  } catch (err) {
    next(err);
  }
};

exports.approveQuality = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId).populate('orderId').populate('assignedTo');
    if (!task) {
      return ApiResponse.error(res, 'Task not found', 404);
    }

    task.status = 'completed';
    task.timeline.completedAt = new Date();
    await task.save();

    // Create inspection record
    const inspectionNumber = generateInspectionNumber();
    const inspection = await Quality.create({
      inspectionNumber,
      orderId: task.orderId?._id,
      taskId: task._id,
      inspector: req.user._id,
      inspectionType: 'final',
      results: {
        totalInspected: task.quantity.produced,
        passed: task.quantity.produced,
        failedItems: 0,
        defectRate: 0,
      },
      grade: 'A',
      notes: 'Passed quality check checklist: stitching, measurement, fabric, color, logo, buttons approved.',
    });

    if (task.orderId) {
      await Order.findByIdAndUpdate(task.orderId._id, {
        $push: { qualityChecks: inspection._id },
      });
    }

    // Substract material stock from Inventory as simulated production cost
    // Find fabric and thread and decrement their stocks
    await Inventory.updateMany(
      { category: { $in: ['fabric', 'material', 'thread'] } },
      { $inc: { 'stockLevels.current': -Math.ceil(task.quantity.produced * 0.5) } }
    );

    // Free the machine (make it available)
    if (task.machineId) {
      const machineObj = await Machine.findById(task.machineId);
      if (machineObj) {
        machineObj.status = 'available';
        await machineObj.save();
        emitToRoom('management', 'machineStatusChanged', { action: 'updated', machine: machineObj });
      }
    }

    // Check if entire order is completed
    if (task.orderId) {
      const orderTasks = await Task.find({ orderId: task.orderId._id, isDeleted: false });
      const allDone = orderTasks.every(t => t.status === 'completed');
      
      const totalProduced = orderTasks.reduce((s, t) => s + (t.quantity.produced || 0), 0);
      const remainingQuantity = Math.max(0, task.orderId.orderDetails.quantity - totalProduced);

      // Emit orderProgressUpdated
      emitToRoom('management', 'orderProgressUpdated', {
        orderId: task.orderId._id,
        completedQuantity: totalProduced,
        remainingQuantity,
        progress: Math.round((totalProduced / task.orderId.orderDetails.quantity) * 100),
      });

      if (allDone && totalProduced >= task.orderId.orderDetails.quantity) {
        await Order.findByIdAndUpdate(task.orderId._id, { status: 'completed' });
        emitToRoom('management', 'orderCompleted', { orderId: task.orderId._id });
        emitToAll('orderCompleted', { orderId: task.orderId._id, orderNumber: task.orderId.orderNumber });
      }
    }

    // Notify employee
    if (task.assignedTo) {
      emitToUser(task.assignedTo._id, 'qualityApproved', {
        task: task.title,
        message: 'Your production task has been approved by Quality Control.',
      });
    }

    emitToRoom('management', 'taskCompleted', { taskId: task._id, status: 'completed' });

    return ApiResponse.success(res, { task, inspection }, 'Quality approved successfully');
  } catch (err) {
    next(err);
  }
};

exports.requestRework = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const { reason = 'Loose thread detected.' } = req.body;
    const task = await Task.findById(taskId).populate('assignedTo');
    if (!task) {
      return ApiResponse.error(res, 'Task not found', 404);
    }

    task.status = 'rework';
    task.description = `${task.description || ''} | REWORK REQUESTED: ${reason}`;
    await task.save();

    if (task.assignedTo) {
      emitToUser(task.assignedTo._id, 'reworkRequested', {
        taskId: task._id,
        task: task.title,
        reason,
        message: `Quality rework requested: "${reason}"`,
      });

      await Notification.create({
        recipient: task.assignedTo._id,
        sender: req.user._id,
        type: 'task_alert',
        title: 'Rework Required',
        message: `Quality rework requested: ${reason}`,
        link: `/tasks/${task._id}`,
      });

      emitToUser(task.assignedTo._id, 'newNotification', {
        type: 'rework_requested',
        message: `Quality rework requested: ${reason}`,
      });
    }

    emitToRoom('management', 'taskUpdated', { action: 'rework', task });

    return ApiResponse.success(res, task, 'Rework request registered successfully');
  } catch (err) {
    next(err);
  }
};

exports.rejectQuality = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    if (!task) {
      return ApiResponse.error(res, 'Task not found', 404);
    }

    task.status = 'pending';
    await task.save();

    emitToRoom('management', 'taskUpdated', { action: 'rejected', task });

    return ApiResponse.success(res, task, 'Task inspection rejected and returned to queue');
  } catch (err) {
    next(err);
  }
};

