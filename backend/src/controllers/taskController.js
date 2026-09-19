/**
 * JSDoc: TaskController - Floor task assignment, progress tracking, and supervisor verification
 * @module controllers/taskController
 */
const Task = require('../models/Task');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const ApiResponse = require('../utils/apiResponse');
const { generateTaskNumber, calculateProgress } = require('../utils/helpers');
const { emitToUser, emitToRoom } = require('../services/socketService');
const { sendTaskAssignment } = require('../services/emailService');

exports.createTask = async (req, res, next) => {
  try {
    const taskData = { ...req.body };
    taskData.taskNumber = generateTaskNumber();
    taskData.assignedBy = req.user._id;

    const task = await Task.create(taskData);
    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'email profile')
      .populate('assignedBy', 'email profile')
      .populate('orderId', 'orderNumber')
      .populate('machineId', 'name machineNumber');

    if (task.assignedTo) {
      try {
        await sendTaskAssignment(task.assignedTo, populated);
      } catch {
      }

      await Notification.create({
        recipient: task.assignedTo,
        sender: req.user._id,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `Task ${task.taskNumber}: ${task.title}`,
        link: `/tasks/${task._id}`,
      });

      emitToUser(task.assignedTo, 'newNotification', {
        type: 'task_assigned',
        task: populated,
      });
    }

    emitToRoom('management', 'taskUpdated', { action: 'created', task: populated });

    return ApiResponse.success(res, populated, 'Task created', 201);
  } catch (err) {
    next(err);
  }
};

exports.getTasks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      orderId,
      assignedTo,
      difficulty,
      sortBy = 'createdAt',
      sortOrder = -1,
    } = req.query;

    const filter = { isDeleted: false };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (orderId) filter.orderId = orderId;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (difficulty) filter.difficulty = difficulty;

    if (req.user.role === 'employee') {
      filter.assignedTo = req.user._id;
    }

    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'email profile')
      .populate('assignedBy', 'email profile')
      .populate('orderId', 'orderNumber customer')
      .populate('machineId', 'name machineNumber')
      .populate('productionLineId', 'name')
      .sort({ [sortBy]: Number(sortOrder) })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return ApiResponse.paginated(res, tasks, page, limit, total);
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeTasks = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { assignedTo: req.params.id, isDeleted: false };
    if (status) filter.status = status;

    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .populate('orderId', 'orderNumber customer')
      .populate('machineId', 'name machineNumber')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return ApiResponse.paginated(res, tasks, page, limit, total);
  } catch (err) {
    next(err);
  }
};

exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false })
      .populate('assignedTo', 'email profile')
      .populate('assignedBy', 'email profile')
      .populate('orderId', 'orderNumber customer orderDetails priority')
      .populate('machineId', 'name machineNumber')
      .populate('productionLineId', 'name')
      .populate('dependencies', 'taskNumber title status');

    if (!task) {
      return ApiResponse.error(res, 'Task not found', 404);
    }

    return ApiResponse.success(res, task);
  } catch (err) {
    next(err);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const allowedFields = ['title', 'description', 'qualityGrade', 'difficulty', 'priority', 'machineId', 'productionLineId', 'quantity'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      updates,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'email profile');

    if (!task) {
      return ApiResponse.error(res, 'Task not found', 404);
    }

    if (task.assignedTo) {
      emitToUser(task.assignedTo._id, 'taskUpdated', { action: 'updated', task });
    }

    return ApiResponse.success(res, task, 'Task updated');
  } catch (err) {
    next(err);
  }
};

exports.assignTask = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;
    if (!assignedTo) {
      return ApiResponse.error(res, 'Employee ID is required', 400);
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      {
        assignedTo,
        assignedBy: req.user._id,
        status: 'pending',
        'timeline.assignedAt': new Date(),
      },
      { new: true }
    ).populate('assignedTo', 'email profile');

    if (!task) {
      return ApiResponse.error(res, 'Task not found', 404);
    }

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'email profile')
      .populate('orderId', 'orderNumber');

    await Notification.create({
      recipient: assignedTo,
      sender: req.user._id,
      type: 'task_assigned',
      title: 'Task Assigned',
      message: `You have been assigned task ${task.taskNumber}: ${task.title}`,
      link: `/tasks/${task._id}`,
    });

    emitToUser(assignedTo, 'newNotification', {
      type: 'task_assigned',
      task: populatedTask,
    });

    try {
      const user = await require('../models/User').findById(assignedTo);
      if (user) await sendTaskAssignment(user, populatedTask);
    } catch {
    }

    return ApiResponse.success(res, populatedTask, 'Task assigned');
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validTransitions = {
      pending: ['accepted'],
      accepted: ['in_progress'],
      in_progress: ['paused', 'completed', 'delayed', 'quality_check'],
      paused: ['in_progress'],
      delayed: ['in_progress'],
      quality_check: ['completed', 'rework'],
      rework: ['in_progress', 'quality_check'],
      completed: ['quality_check'],
    };

    const task = await Task.findOne({ _id: req.params.id, isDeleted: false });
    if (!task) {
      return ApiResponse.error(res, 'Task not found', 404);
    }

    const allowed = validTransitions[task.status];
    if (!allowed || !allowed.includes(status)) {
      return ApiResponse.error(res, `Cannot transition from ${task.status} to ${status}`, 400);
    }

    const now = new Date();
    const timelineUpdates = {};
    if (status === 'accepted') timelineUpdates['timeline.acceptedAt'] = now;
    if (status === 'in_progress') timelineUpdates['timeline.startedAt'] = now;
    if (status === 'paused') timelineUpdates['timeline.pausedAt'] = now;
    if (status === 'completed') timelineUpdates['timeline.completedAt'] = now;

    Object.assign(task, { status, ...timelineUpdates });
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'email profile');

    if (task.assignedTo) {
      emitToUser(task.assignedTo, 'taskUpdated', { action: 'statusChanged', task: populated });
    }

    return ApiResponse.success(res, populated, `Task status changed to ${status}`);
  } catch (err) {
    next(err);
  }
};

exports.updateProgress = async (req, res, next) => {
  try {
    const { produced, rejected = 0, scrap = 0 } = req.body;
    if (produced === undefined && rejected === undefined && scrap === undefined) {
      return ApiResponse.error(res, 'At least one quantity field required', 400);
    }

    const task = await Task.findOne({ _id: req.params.id, isDeleted: false });
    if (!task) {
      return ApiResponse.error(res, 'Task not found', 404);
    }

    if (task.status === 'completed') {
      return ApiResponse.error(res, 'Task is already completed', 400);
    }

    if (produced !== undefined) task.quantity.produced = Math.max(0, produced);
    if (rejected !== undefined) task.quantity.rejected = (task.quantity.rejected || 0) + Math.max(0, rejected);
    if (scrap !== undefined) task.quantity.scrap = (task.quantity.scrap || 0) + Math.max(0, scrap);

    const progress = calculateProgress(task.quantity.target, task.quantity.produced);

    if (progress >= 100 && task.status !== 'completed' && task.status !== 'quality_check') {
      task.status = 'quality_check';
      task.timeline.completedAt = new Date();
    } else if (task.status === 'pending' && task.quantity.produced > 0) {
      task.status = 'in_progress';
      task.timeline.startedAt = new Date();
    }

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'email profile');

    if (task.assignedTo) {
      emitToUser(task.assignedTo, 'taskUpdated', { action: 'progress', task: populated });
    }

    return ApiResponse.success(res, { task: populated, progress }, 'Progress updated');
  } catch (err) {
    next(err);
  }
};

exports.completeTask = async (req, res, next) => {
  try {
    const { qualityGrade, notes } = req.body;

    const task = await Task.findOne({ _id: req.params.id, isDeleted: false });
    if (!task) {
      return ApiResponse.error(res, 'Task not found', 404);
    }

    if (task.quantity.produced < task.quantity.target) {
      return ApiResponse.error(res, `Task not complete: ${task.quantity.produced}/${task.quantity.target} produced`, 400);
    }

    task.status = 'completed';
    task.timeline.completedAt = new Date();
    if (qualityGrade) task.qualityGrade = qualityGrade;
    await task.save();

    const pendingTasks = await Task.countDocuments({
      orderId: task.orderId,
      isDeleted: false,
      status: { $ne: 'completed' },
    });

    if (pendingTasks === 0) {
      await Order.findByIdAndUpdate(task.orderId, { status: 'quality_check' });
    }

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'email profile')
      .populate('assignedBy', 'email profile');

    if (task.assignedTo) {
      emitToUser(task.assignedTo, 'taskUpdated', { action: 'completed', task: populated });
    }

    emitToRoom('management', 'taskUpdated', { action: 'completed', task: populated });

    return ApiResponse.success(res, populated, 'Task completed');
  } catch (err) {
    next(err);
  }
};

exports.getTaskAnalytics = async (req, res, next) => {
  try {
    const statusCounts = await Task.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const employeePerformance = await Task.aggregate([
      { $match: { isDeleted: false, assignedTo: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTo',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          totalProduced: { $sum: '$quantity.produced' },
          totalRejected: { $sum: '$quantity.rejected' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'employee',
        },
      },
      { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          'employee.password': 0,
          'employee.__v': 0,
        },
      },
      { $sort: { completedTasks: -1 } },
    ]);

    const priorityCounts = await Task.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    return ApiResponse.success(res, { statusCounts, employeePerformance, priorityCounts });
  } catch (err) {
    next(err);
  }
};

exports.getTaskSummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayCounts, totalProgress] = await Promise.all([
      Task.aggregate([
        { $match: { isDeleted: false, createdAt: { $gte: today } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { isDeleted: false, status: { $in: ['in_progress', 'completed'] } } },
        {
          $group: {
            _id: null,
            totalTarget: { $sum: '$quantity.target' },
            totalProduced: { $sum: '$quantity.produced' },
            totalRejected: { $sum: '$quantity.rejected' },
          },
        },
      ]),
    ]);

    const countsMap = {};
    todayCounts.forEach((c) => {
      countsMap[c._id] = c.count;
    });

    const progress = totalProgress[0] || { totalTarget: 0, totalProduced: 0, totalRejected: 0 };
    const completionRate =
      progress.totalTarget > 0 ? Math.round((progress.totalProduced / progress.totalTarget) * 100) : 0;

    return ApiResponse.success(res, {
      todayCreated: Object.values(countsMap).reduce((a, b) => a + b, 0),
      todayByStatus: countsMap,
      productionProgress: {
        ...progress,
        completionRate,
      },
    });
  } catch (err) {
    next(err);
  }
};

