const Order = require('../models/Order');
const Task = require('../models/Task');
const Machine = require('../models/Machine');
const Inventory = require('../models/Inventory');
const Quality = require('../models/Quality');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const aiService = require('../services/aiService');

exports.getPrediction = async (req, res, next) => {
  try {
    const { type, data } = req.body;
    if (!type || !data) {
      return ApiResponse.error(res, 'Prediction type and data are required', 400);
    }

    const validTypes = ['production', 'delay', 'performance', 'failure'];
    if (!validTypes.includes(type)) {
      return ApiResponse.error(res, `Invalid prediction type. Must be one of: ${validTypes.join(', ')}`, 400);
    }

    const result = await aiService.getPrediction(type, data);
    if (!result) {
      return ApiResponse.success(res, { message: 'AI service temporarily unavailable' });
    }

    return ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
};

exports.getAnalysis = async (req, res, next) => {
  try {
    const { type, data } = req.body;
    if (!type) {
      return ApiResponse.error(res, 'Analysis type is required', 400);
    }

    let result;
    if (type === 'performance') {
      result = await aiService.getPerformanceAnalysis(data);
    } else if (type === 'delay') {
      result = await aiService.getDelayPrediction(data);
    } else if (type === 'failure') {
      result = await aiService.getFailurePrediction(data);
    } else {
      result = await aiService.getPrediction(`/analyze/${type}`, data);
    }

    if (!result) {
      return ApiResponse.success(res, { message: 'AI service temporarily unavailable' });
    }

    return ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
};

exports.getRecommendations = async (req, res, next) => {
  try {
    const resourceData = {
      orders: await Order.countDocuments({ status: { $in: ['pending', 'approved', 'in_production'] } }),
      tasks: await Task.countDocuments({ status: { $ne: 'completed' }, isDeleted: false }),
      machines: await Machine.countDocuments({ status: 'available', isDeleted: false }),
      machineUtilization: await Machine.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      employees: await User.countDocuments({ role: 'employee', active: true }),
      lowStock: await Inventory.countDocuments({
        $expr: { $lte: ['$stockLevels.current', '$stockLevels.reorderPoint'] },
      }),
    };

    let aiRecommendations = null;
    try {
      aiRecommendations = await aiService.getRecommendations(resourceData);
    } catch {
    }

    return ApiResponse.success(res, {
      resourceData,
      aiRecommendations,
    });
  } catch (err) {
    next(err);
  }
};

exports.triggerTraining = async (req, res, next) => {
  try {
    const { modelType } = req.body;

    const axios = require('axios');
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
    const result = await axios.post(`${AI_SERVICE_URL}/api/train`, {
      type: modelType || 'all',
    }).then(r => r.data).catch(() => null);

    if (!result) {
      return ApiResponse.success(res, { message: 'Training initiated locally', status: 'processing' });
    }

    return ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
};

exports.getModelStatus = async (req, res, next) => {
  try {
    const result = await aiService.getModelStatus();
    if (!result) {
      return ApiResponse.success(res, {
        status: 'unknown',
        message: 'AI service not reachable',
        lastUpdated: null,
      });
    }
    return ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
};

exports.getDashboardData = async (req, res, next) => {
  try {
    const [
      orderStats,
      taskStats,
      machineStats,
      qualityStats,
      inventoryStats,
      employeeCount,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Machine.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Quality.aggregate([
        {
          $group: {
            _id: null,
            avgDefectRate: { $avg: '$results.defectRate' },
            totalInspected: { $sum: '$results.totalInspected' },
          },
        },
      ]),
      Inventory.aggregate([
        {
          $group: {
            _id: null,
            totalItems: { $sum: 1 },
            totalValue: { $sum: { $multiply: ['$stockLevels.current', '$costPerUnit'] } },
            lowStock: {
              $sum: { $cond: [{ $lte: ['$stockLevels.current', '$stockLevels.reorderPoint'] }, 1, 0] },
            },
          },
        },
      ]),
      User.countDocuments({ role: 'employee', active: true }),
    ]);

    let aiDashboardData = null;
    try {
      aiDashboardData = await aiService.getDashboardData();
    } catch {
    }

    return ApiResponse.success(res, {
      orders: orderStats,
      tasks: taskStats,
      machines: machineStats,
      quality: qualityStats[0] || { avgDefectRate: 0, totalInspected: 0 },
      inventory: inventoryStats[0] || { totalItems: 0, totalValue: 0, lowStock: 0 },
      totalEmployees: employeeCount,
      aiDashboard: aiDashboardData,
    });
  } catch (err) {
    next(err);
  }
};
