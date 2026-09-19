/**
 * JSDoc: OrderController - Production order lifecycle management, scheduling, and status tracking
 * @module controllers/orderController
 */
const Order = require('../models/Order');
const Task = require('../models/Task');
const ApiResponse = require('../utils/apiResponse');
const { generateOrderNumber } = require('../utils/helpers');
const { getDelayPrediction } = require('../services/aiService');
const { emitToRoom, emitToUser } = require('../services/socketService');
const { logAudit } = require('../services/auditLogService');

exports.createOrder = async (req, res, next) => {
  try {
    const orderData = { ...req.body };
    orderData.orderNumber = generateOrderNumber();
    orderData.assignedManager = req.user?._id;

    // 1. Normalize priority enum
    if (orderData.priority === 'normal' || !['low', 'medium', 'high', 'urgent'].includes(orderData.priority)) {
      orderData.priority = 'medium';
    }

    // 2. Normalize requiredDate and plannedDate
    if (!orderData.requiredDate) {
      orderData.requiredDate = orderData.timeline?.deliveryDate || orderData.deliveryDate || orderData.dueDate || new Date(Date.now() + 14 * 86400000);
    }
    if (!orderData.plannedDate) {
      orderData.plannedDate = orderData.timeline?.startDate || orderData.startDate || new Date();
    }

    // 3. Normalize customer details
    orderData.customer = {
      name: orderData.customer?.name?.trim() || 'Direct Client',
      email: orderData.customer?.email?.trim() || `client-${Date.now()}@garment.com`,
      phone: orderData.customer?.phone?.trim() || '+1 555-0199',
      address: orderData.customer?.address || {},
    };

    // 4. Normalize order details
    if (!orderData.orderDetails) {
      orderData.orderDetails = {};
    }
    orderData.orderDetails.garmentType = orderData.orderDetails.garmentType || orderData.garmentType || 'Linen Garment';
    orderData.orderDetails.quantity = Number(orderData.orderDetails.quantity || orderData.quantity || 100);

    // Normalize sizes to string array
    if (Array.isArray(orderData.orderDetails.sizes)) {
      orderData.orderDetails.sizes = orderData.orderDetails.sizes.map((s) => (typeof s === 'object' && s !== null ? s.size || 'M' : String(s)));
    } else if (orderData.orderDetails.sizes) {
      orderData.orderDetails.sizes = [String(orderData.orderDetails.sizes)];
    } else {
      orderData.orderDetails.sizes = ['M'];
    }

    // Normalize colors to string array
    if (Array.isArray(orderData.orderDetails.colors)) {
      orderData.orderDetails.colors = orderData.orderDetails.colors.map(String);
    } else if (orderData.orderDetails.color) {
      orderData.orderDetails.colors = [String(orderData.orderDetails.color)];
    } else {
      orderData.orderDetails.colors = ['Classic'];
    }

    const order = await Order.create(orderData);
    const populated = await Order.findById(order._id)
      .populate('assignedManager', 'email profile')
      .populate('assignedLine');

    emitToRoom('management', 'orderUpdated', { action: 'created', order: populated });

    await logAudit({
      req,
      action: 'ORDER_CREATED',
      entityType: 'Order',
      entityId: order._id,
      description: `Order ${order.orderNumber} created for ${order.customer?.name || 'Customer'} (${order.orderDetails?.quantity || 0} units).`,
      severity: 'success',
      metadata: { orderNumber: order.orderNumber, garmentType: order.orderDetails?.garmentType },
    });

    return ApiResponse.success(res, populated, 'Order created', 201);
  } catch (err) {
    next(err);
  }
};


exports.getOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      startDate,
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = -1,
    } = req.query;

    const filter = { isDeleted: false };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('assignedManager', 'email profile.firstName profile.lastName')
      .populate('assignedLine', 'name')
      .sort({ [sortBy]: Number(sortOrder) })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return ApiResponse.paginated(res, orders, page, limit, total);
  } catch (err) {
    next(err);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, isDeleted: false })
      .populate('assignedManager', 'email profile')
      .populate('assignedLine')
      .populate('qualityChecks');

    if (!order) {
      return ApiResponse.error(res, 'Order not found', 404);
    }

    const tasks = await Task.find({ orderId: order._id, isDeleted: false })
      .populate('assignedTo', 'email profile')
      .sort({ createdAt: 1 });

    return ApiResponse.success(res, { order, tasks });
  } catch (err) {
    next(err);
  }
};

exports.updateOrder = async (req, res, next) => {
  try {
    const allowedFields = [
      'customer',
      'orderDetails',
      'requiredDate',
      'plannedDate',
      'priority',
      'status',
      'assignedLine',
      'productionPlan',
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      updates,
      { new: true, runValidators: true }
    ).populate('assignedManager', 'email profile')
     .populate('assignedLine');

    if (!order) {
      return ApiResponse.error(res, 'Order not found', 404);
    }

    emitToRoom('management', 'orderUpdated', { action: 'updated', order });

    return ApiResponse.success(res, order, 'Order updated');
  } catch (err) {
    next(err);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return ApiResponse.error(res, 'Order not found', 404);
    }

    // Cascade delete associated tasks and release machines
    const orderTasks = await Task.find({ orderId: req.params.id, isDeleted: false });
    if (orderTasks && orderTasks.length > 0) {
      const Machine = require('../models/Machine');
      for (const task of orderTasks) {
        task.isDeleted = true;
        await task.save();

        if (task.assignedTo) {
          emitToUser(task.assignedTo.toString(), 'taskUpdated', { action: 'deleted', task });
        }

        // Release machine if not in use by other active tasks
        if (task.machineId) {
          const otherActiveTask = await Task.findOne({
            machineId: task.machineId,
            _id: { $ne: task._id },
            orderId: { $ne: req.params.id },
            isDeleted: false,
            status: { $in: ['in_progress', 'accepted', 'paused', 'rework'] }
          });
          if (!otherActiveTask) {
            const machineObj = await Machine.findById(task.machineId);
            if (machineObj) {
              machineObj.status = 'available';
              await machineObj.save();
              emitToRoom('management', 'machineStatusChanged', { action: 'updated', machine: machineObj });
            }
          }
        }
      }
    }

    emitToRoom('management', 'orderUpdated', { action: 'deleted', orderId: req.params.id });

    await logAudit({
      req,
      action: 'ORDER_DELETED',
      entityType: 'Order',
      entityId: req.params.id,
      description: `Order ${order.orderNumber} deleted. Associated tasks and machines were released.`,
      severity: 'warning',
    });

    return ApiResponse.success(res, null, 'Order deleted');
  } catch (err) {
    next(err);
  }
};

exports.assignOrder = async (req, res, next) => {
  try {
    const { productionLineId, plannedDate } = req.body;
    if (!productionLineId) {
      return ApiResponse.error(res, 'Production line ID is required', 400);
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      {
        assignedLine: productionLineId,
        plannedDate: plannedDate || new Date(),
        status: 'approved',
      },
      { new: true }
    ).populate('assignedLine');

    if (!order) {
      return ApiResponse.error(res, 'Order not found', 404);
    }

    emitToRoom(`line:${productionLineId}`, 'orderUpdated', { action: 'assigned', order });

    return ApiResponse.success(res, order, 'Order assigned to line');
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validTransitions = {
      pending: ['approved'],
      approved: ['in_production'],
      in_production: ['quality_check'],
      quality_check: ['completed'],
      completed: ['delivered'],
    };

    const order = await Order.findOne({ _id: req.params.id, isDeleted: false });
    if (!order) {
      return ApiResponse.error(res, 'Order not found', 404);
    }

    const allowed = validTransitions[order.status];
    if (!allowed || !allowed.includes(status)) {
      return ApiResponse.error(res, `Cannot transition from ${order.status} to ${status}`, 400);
    }

    order.status = status;
    await order.save();

    emitToRoom('management', 'orderUpdated', { action: 'statusChanged', order });
    emitToRoom(`line:${order.assignedLine}`, 'orderUpdated', { action: 'statusChanged', order });

    return ApiResponse.success(res, order, `Order status changed to ${status}`);
  } catch (err) {
    next(err);
  }
};

exports.getOrderAnalytics = async (req, res, next) => {
  try {
    const statusCounts = await Order.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const monthlyTrends = await Order.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
          totalQuantity: { $sum: '$orderDetails.quantity' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const priorityCounts = await Order.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    return ApiResponse.success(res, {
      statusCounts,
      monthlyTrends,
      priorityCounts,
    });
  } catch (err) {
    next(err);
  }
};

exports.predictOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, isDeleted: false });
    if (!order) {
      return ApiResponse.error(res, 'Order not found', 404);
    }

    let prediction = null;
    try {
      prediction = await getDelayPrediction(order);
    } catch {
      return ApiResponse.success(res, { message: 'AI service unavailable' });
    }

    if (prediction) {
      order.aiInsights = {
        riskLevel: prediction.riskLevel || order.aiInsights?.riskLevel || 'low',
        predictedDelay: prediction.predictedDelay || order.aiInsights?.predictedDelay || 0,
        recommendations: prediction.recommendations || order.aiInsights?.recommendations || [],
      };
      await order.save();
    }

    return ApiResponse.success(res, { prediction, order });
  } catch (err) {
    next(err);
  }
};

exports.batchUpdateStatus = async (req, res, next) => {
  try {
    const { orderIds, status } = req.body;
    if (!orderIds || !Array.isArray(orderIds) || !orderIds.length || !status) {
      return ApiResponse.badRequest(res, 'orderIds array and status are required');
    }

    const result = await Order.updateMany(
      { _id: { $in: orderIds }, isDeleted: false },
      { $set: { status, updatedAt: new Date() } }
    );

    emitToRoom('management', 'ordersBatchUpdated', { orderIds, status, count: result.modifiedCount });

    return ApiResponse.success(res, {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      status,
    }, 'Orders updated in batch');
  } catch (err) {
    next(err);
  }
};

