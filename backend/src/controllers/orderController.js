const Order = require('../models/Order');
const Task = require('../models/Task');
const ApiResponse = require('../utils/apiResponse');
const { generateOrderNumber } = require('../utils/helpers');
const { getDelayPrediction } = require('../services/aiService');
const { emitToRoom, emitToUser } = require('../services/socketService');

exports.createOrder = async (req, res, next) => {
  try {
    const orderData = { ...req.body };
    orderData.orderNumber = generateOrderNumber();
    orderData.assignedManager = req.user._id;

    let aiInsights = null;
    try {
      aiInsights = await getDelayPrediction(orderData);
    } catch {
    }

    if (aiInsights) {
      orderData.aiInsights = {
        riskLevel: aiInsights.riskLevel || 'low',
        predictedDelay: aiInsights.predictedDelay || 0,
        recommendations: aiInsights.recommendations || [],
      };
    }

    const order = await Order.create(orderData);
    const populated = await Order.findById(order._id)
      .populate('assignedManager', 'email profile')
      .populate('assignedLine');

    emitToRoom('management', 'orderUpdated', { action: 'created', order: populated });

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

    emitToRoom('management', 'orderUpdated', { action: 'deleted', orderId: req.params.id });

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
