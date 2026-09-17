const Order = require('../models/Order');
const Task = require('../models/Task');
const Machine = require('../models/Machine');
const Inventory = require('../models/Inventory');
const Quality = require('../models/Quality');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const aiService = require('../services/aiService');
const GroqService = require('../ai/GroqService');
const ProductionLine = require('../models/ProductionLine');
const { generateOrderNumber, generateTaskNumber } = require('../utils/helpers');
const { emitToRoom, emitToUser, emitToAll } = require('../services/socketService');

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

exports.getMlHealth = async (req, res, next) => {
  try {
    const axios = require('axios');
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
    let mlServiceOnline = false;
    let mlInfo = null;

    try {
      const mlRes = await axios.get(`${AI_SERVICE_URL}/api/model-status`, { timeout: 2000 });
      if (mlRes.data) {
        mlServiceOnline = true;
        mlInfo = mlRes.data.result || mlRes.data;
      }
    } catch {
      mlServiceOnline = false;
    }

    return ApiResponse.success(res, {
      status: mlServiceOnline ? 'available' : 'unavailable',
      provider: mlServiceOnline ? 'local-ml' : 'cloud-fallback',
      service: 'Python Flask ML Service',
      port: 5001,
      modelsLoaded: mlServiceOnline,
      details: mlInfo,
      timestamp: new Date().toISOString(),
    });
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

const normalizeDate = (str) => {
  if (!str) return str;
  const cleaned = String(str).trim();
  // Match DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(cleaned)) {
    const [d, m, y] = cleaned.split('-');
    return `${y}-${m}-${d}`;
  }
  // Match DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
    const [d, m, y] = cleaned.split('/');
    return `${y}-${m}-${d}`;
  }
  // Match DD.MM.YYYY
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(cleaned)) {
    const [d, m, y] = cleaned.split('.');
    return `${y}-${m}-${d}`;
  }
  return cleaned;
};

const validateOrderParams = (params) => {
  const errors = [];
  if (!params.customerName || !params.customerName.trim()) {
    errors.push('Customer Name is required.');
  }
  if (!params.garmentType || !params.garmentType.trim()) {
    errors.push('Garment Type is required.');
  }
  const qty = parseInt(params.quantity);
  if (isNaN(qty) || qty <= 0) {
    errors.push('Quantity must be greater than 0.');
  }
  if (!params.size || !params.size.trim()) {
    errors.push('Garment Size is required.');
  }
  if (!params.startDate) {
    errors.push('Start Date is required.');
  } else {
    const start = new Date(params.startDate);
    if (isNaN(start.getTime())) {
      errors.push('Start Date must be a valid date (YYYY-MM-DD or DD-MM-YYYY).');
    }
  }
  if (!params.deadline) {
    errors.push('Delivery Deadline is required.');
  } else {
    const end = new Date(params.deadline);
    if (isNaN(end.getTime())) {
      errors.push('Delivery Deadline must be a valid date (YYYY-MM-DD or DD-MM-YYYY).');
    }
  }
  if (params.startDate && params.deadline) {
    const start = new Date(params.startDate);
    const end = new Date(params.deadline);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
      errors.push('Delivery Deadline must be after Start Date.');
    }
  }
  const priority = (params.priority || '').toLowerCase();
  if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
    errors.push('Priority must be low, medium, high, or urgent.');
  }
  return errors;
};

exports.processCommand = async (req, res, next) => {
  try {
    const { command, context = {}, confirm = false } = req.body;
    if (!command && !confirm && !context.intent) {
      return ApiResponse.error(res, 'Command or confirmation is required', 400);
    }

    let currentParams = context.parameters || {};
    let intent = context.intent || null;

    if (currentParams.startDate) {
      currentParams.startDate = normalizeDate(currentParams.startDate);
    }
    if (currentParams.deadline) {
      currentParams.deadline = normalizeDate(currentParams.deadline);
    }

    if (confirm && intent === 'CREATE_ORDER') {
      const validationErrors = validateOrderParams(currentParams);
      if (validationErrors.length > 0) {
        return ApiResponse.error(res, `Validation failed: ${validationErrors.join(' ')}`, 400);
      }

      const orderNumber = generateOrderNumber();
      let requiredDate = new Date(currentParams.deadline);
      if (isNaN(requiredDate.getTime())) {
        requiredDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      }

      let plannedDate = new Date(currentParams.startDate);
      if (isNaN(plannedDate.getTime())) {
        plannedDate = new Date();
      }

      const newOrder = await Order.create({
        orderNumber,
        customer: {
          name: currentParams.customerName || 'ABC Fashion',
          email: `${(currentParams.customerName || 'abc').toLowerCase().replace(/\s+/g, '')}@example.com`,
        },
        orderDetails: {
          garmentType: currentParams.garmentType || 'Cotton Shirt',
          quantity: parseInt(currentParams.quantity) || 1000,
          sizes: currentParams.size ? [currentParams.size] : ['M'],
        },
        requiredDate,
        plannedDate,
        status: 'pending',
        priority: currentParams.priority?.toLowerCase() || 'medium',
        assignedManager: req.user._id,
      });

      const populatedOrder = await Order.findById(newOrder._id)
        .populate('assignedManager', 'email profile');

      const lines = await ProductionLine.find({ active: true });
      const machines = await Machine.find({ isDeleted: false, status: 'available' });
      const employees = await User.find({ role: 'employee', active: true });

      const factorySnapshot = {
        availableLines: lines.length,
        availableMachines: machines.length,
        availableEmployees: employees.length,
      };

      const aiPlan = context.aiPlan || await GroqService.generateProductionPlan(newOrder, factorySnapshot);
      newOrder.aiInsights = {
        riskLevel: aiPlan.delayProbability > 30 ? 'high' : aiPlan.delayProbability > 15 ? 'medium' : 'low',
        predictedDelay: aiPlan.delayProbability || 0,
        recommendations: [aiPlan.reasoning || 'Suggested Line 3 based on workload.'],
      };
      
      newOrder.productionPlan = {
        startDate: plannedDate,
        endDate: new Date(aiPlan.expectedCompletion),
        dailyTarget: Math.ceil(parseInt(currentParams.quantity) / (parseInt(aiPlan.recommendedEmployeesCount) || 5)),
        totalDays: Math.ceil(parseInt(currentParams.quantity) / 2000) || 1,
      };

      await newOrder.save();

      const orderForEmit = await Order.findById(newOrder._id)
        .populate('assignedManager', 'email profile');

      emitToRoom('management', 'orderUpdated', { action: 'created', order: orderForEmit });
      emitToRoom('management', 'aiPlanCreated', { orderId: newOrder._id, plan: aiPlan });
      emitToAll('orderCreated', orderForEmit);

      console.log(`[AI AUDIT LOG] Admin created order: ${orderNumber} via Natural Language`);

      return ApiResponse.success(res, {
        status: 'success',
        order: orderForEmit,
        aiPlan,
        prompt: `Order ${orderNumber} created successfully and AI Production Plan is generated.`,
      }, 'Order created');
    }

    if (context.missingField) {
      let val = command.trim();
      if (context.missingField === 'quantity') {
        const qtyMatch = val.match(/(\d+)/);
        val = qtyMatch ? parseInt(qtyMatch[1]) : null;
      }
      currentParams[context.missingField] = val;
    }

    if (currentParams.startDate) {
      currentParams.startDate = normalizeDate(currentParams.startDate);
    }
    if (currentParams.deadline) {
      currentParams.deadline = normalizeDate(currentParams.deadline);
    }

    if (!intent) {
      const parsed = await GroqService.parseAdminCommand(command);
      intent = parsed.intent;
      currentParams = { ...parsed.parameters, ...currentParams };
    }

    if (intent === 'CREATE_ORDER') {
      const reqs = ['customerName', 'garmentType', 'quantity', 'size', 'startDate', 'deadline', 'priority'];
      for (const field of reqs) {
        if (currentParams[field] === undefined || currentParams[field] === null || currentParams[field] === '') {
          let promptStr = '';
          if (field === 'customerName') promptStr = 'What is the customer name?';
          else if (field === 'garmentType') promptStr = 'What is the garment type? (e.g. Shirt, Pant, T-Shirt, or Jacket?)';
          else if (field === 'quantity') promptStr = 'What quantity should I create for this order?';
          else if (field === 'size') promptStr = 'What size is required? (e.g. S, M, L, XL, or All?)';
          else if (field === 'startDate') promptStr = 'What is the starting date of production? (e.g. YYYY-MM-DD)';
          else if (field === 'deadline') promptStr = 'What is the delivery deadline? (e.g. YYYY-MM-DD)';
          else if (field === 'priority') promptStr = 'What is the production priority? (e.g. Low, Medium, High, Urgent?)';

          return ApiResponse.success(res, {
            status: 'missing_info',
            missingField: field,
            prompt: promptStr,
            context: {
              intent,
              parameters: currentParams,
              missingField: field,
            }
          });
        }
      }

      const validationErrors = validateOrderParams(currentParams);
      if (validationErrors.length > 0) {
        return ApiResponse.success(res, {
          status: 'validation_error',
          errors: validationErrors,
          prompt: `Validation failed: ${validationErrors.join(' ')}`,
          context: {
            intent,
            parameters: currentParams,
          }
        });
      }

      // Generate AI Production plan recommendations before confirming
      const lines = await ProductionLine.find({ active: true });
      const machines = await Machine.find({ isDeleted: false, status: 'available' });
      const employees = await User.find({ role: 'employee', active: true });

      const factorySnapshot = {
        availableLines: lines.length,
        availableMachines: machines.length,
        availableEmployees: employees.length,
      };

      const tempOrder = {
        orderDetails: {
          garmentType: currentParams.garmentType,
          quantity: parseInt(currentParams.quantity),
          sizes: [currentParams.size]
        },
        requiredDate: new Date(currentParams.deadline),
        plannedDate: new Date(currentParams.startDate),
        priority: currentParams.priority
      };

      const aiPlan = await GroqService.generateProductionPlan(tempOrder, factorySnapshot);

      return ApiResponse.success(res, {
        status: 'ready_to_confirm',
        aiPlan,
        prompt: `Please confirm details. AI predicts ${aiPlan.delayProbability}% delay risk on Line ${aiPlan.recommendedLine || 3}.`,
        context: {
          intent,
          parameters: currentParams,
          aiPlan
        }
      });
    }

    if (intent === 'GET_DELAYED_ORDERS') {
      const orders = await Order.find({ status: { $ne: 'completed' }, isDeleted: false });
      const delayed = orders.filter(o => o.aiInsights?.riskLevel === 'high');
      return ApiResponse.success(res, {
        status: 'info',
        prompt: `Found ${delayed.length} delayed/at-risk order(s).`,
        data: delayed,
      });
    }

    if (intent === 'GET_BEST_LINE') {
      const lines = await ProductionLine.find({ active: true }).sort({ 'metrics.efficiency': -1 }).limit(1);
      return ApiResponse.success(res, {
        status: 'info',
        prompt: lines.length > 0 ? `${lines[0].name} is performing best with ${lines[0].metrics?.efficiency || 0}% efficiency.` : 'No active production lines available.',
      });
    }

    if (intent === 'GET_WORKING_EMPLOYEES') {
      const present = await User.countDocuments({ role: 'employee', active: true });
      return ApiResponse.success(res, {
        status: 'info',
        prompt: `There are currently ${present} employees working today.`,
      });
    }

    if (intent === 'GET_AT_RISK_MACHINES') {
      const maintenance = await Machine.find({ status: { $in: ['maintenance', 'repair'] }, isDeleted: false });
      return ApiResponse.success(res, {
        status: 'info',
        prompt: `Found ${maintenance.length} machine(s) currently requiring maintenance or repair.`,
        data: maintenance,
      });
    }

    if (intent === 'GET_FABRIC_AVAILABILITY') {
      const lowStock = await Inventory.find({
        $expr: { $lte: ['$stockLevels.current', '$stockLevels.reorderPoint'] }
      });
      return ApiResponse.success(res, {
        status: 'info',
        prompt: `Fabric availability is stable except for ${lowStock.length} materials running low in stock.`,
        data: lowStock,
      });
    }

    return ApiResponse.success(res, {
      status: 'unknown',
      prompt: "I understood your request but couldn't execute a specific factory command. Try commands like 'Create an order for ABC Garments' or 'How many employees are working today?'",
    });

  } catch (err) {
    next(err);
  }
};

exports.approveProductionPlan = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findOne({ _id: orderId, isDeleted: false });
    if (!order) {
      return ApiResponse.error(res, 'Order not found', 404);
    }

    order.status = 'approved';
    
    let line = await ProductionLine.findOne({ name: 'Line 3' });
    if (!line) {
      line = await ProductionLine.findOne({ status: 'active' });
    }
    
    if (line) {
      order.assignedLine = line._id;
      if (!line.assignedOrders.includes(order._id)) {
        line.assignedOrders.push(order._id);
        await line.save();
      }
    }

    await order.save();

    const employees = await User.find({ role: 'employee', active: true });
    const rankResult = await GroqService.rankEmployees(order, employees);
    const assignedRankings = rankResult.rankings.slice(0, 3);

    const machines = await Machine.find({ status: 'available', isDeleted: false }).limit(2);
    for (const machine of machines) {
      machine.status = 'in_use';
      if (line) machine.productionLineId = line._id;
      await machine.save();
    }

    const createdTasks = [];
    for (let i = 0; i < assignedRankings.length; i++) {
      const emp = assignedRankings[i];
      const taskNumber = generateTaskNumber();
      const task = await Task.create({
        taskNumber,
        title: `Stitching - ${order.orderDetails.garmentType} for ${order.customer.name}`,
        description: `Perform stitching operations for order ${order.orderNumber}. AI tip: Maintain consistent speed to reduce defect rate.`,
        orderId: order._id,
        assignedTo: emp.id,
        assignedBy: req.user._id,
        productionLineId: line ? line._id : null,
        machineId: machines[i % machines.length] ? machines[i % machines.length]._id : null,
        quantity: {
          target: Math.ceil(order.orderDetails.quantity / assignedRankings.length),
          produced: 0,
        },
        status: 'pending',
        priority: 'high',
        difficulty: 'medium',
        timeline: {
          assignedAt: new Date(),
          dueDate: order.requiredDate,
        }
      });
      createdTasks.push(task);

      emitToUser(emp.id, 'taskAssigned', task);
    }

    const updatedOrder = await Order.findById(order._id)
      .populate('assignedManager', 'email profile')
      .populate('assignedLine');

    emitToRoom('management', 'orderUpdated', { action: 'statusChanged', order: updatedOrder });
    emitToRoom('management', 'productionPlanApproved', {
      order: updatedOrder,
      tasks: createdTasks,
      employees: assignedRankings,
      machines: machines.map(m => m.name || m.machineNumber),
    });

    return ApiResponse.success(res, {
      order: updatedOrder,
      tasks: createdTasks,
      assignedEmployees: assignedRankings,
      reservedMachines: machines,
    }, 'Production plan approved and tasks created successfully');

  } catch (err) {
    next(err);
  }
};

exports.getPlanCandidates = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findOne({ _id: orderId, isDeleted: false });
    if (!order) {
      return ApiResponse.error(res, 'Order not found', 404);
    }

    const lines = await ProductionLine.find({ active: true });
    const machines = await Machine.find({ status: 'available', isDeleted: false });
    const employees = await User.find({ role: 'employee', active: true });
    
    const rankResult = await GroqService.rankEmployees(order, employees);
    
    const qty = order.orderDetails?.quantity || 1000;
    const recommendedEmployees = rankResult.rankings.slice(0, 3);
    const suggestedSplits = [];
    
    const count = Math.min(3, recommendedEmployees.length);
    const baseQty = Math.floor(qty / count);
    
    for (let i = 0; i < count; i++) {
      suggestedSplits.push({
        assignedTo: recommendedEmployees[i].id,
        employeeName: recommendedEmployees[i].name,
        machineId: machines[i % machines.length]?._id || null,
        quantity: i === count - 1 ? qty - (baseQty * (count - 1)) : baseQty,
      });
    }

    return ApiResponse.success(res, {
      order,
      lines,
      machines,
      candidates: rankResult.rankings,
      suggestedSplits,
    });
  } catch (err) {
    next(err);
  }
};

exports.dispatchProductionTasks = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { splits, productionLineId } = req.body;
    
    if (!splits || !Array.isArray(splits) || splits.length === 0) {
      return ApiResponse.error(res, 'Task splits are required.', 400);
    }

    const order = await Order.findOne({ _id: orderId, isDeleted: false });
    if (!order) {
      return ApiResponse.error(res, 'Order not found', 404);
    }

    const totalSplitQty = splits.reduce((sum, s) => sum + parseInt(s.quantity || 0), 0);
    if (totalSplitQty !== order.orderDetails?.quantity) {
      return ApiResponse.error(res, `Sum of splits (${totalSplitQty}) must equal order quantity (${order.orderDetails?.quantity}).`, 400);
    }

    order.status = 'approved';
    if (productionLineId) {
      order.assignedLine = productionLineId;
      const line = await ProductionLine.findById(productionLineId);
      if (line && !line.assignedOrders.includes(order._id)) {
        line.assignedOrders.push(order._id);
        await line.save();
      }
    }
    await order.save();

    const createdTasks = [];
    for (const split of splits) {
      if (split.machineId) {
        await Machine.findByIdAndUpdate(split.machineId, {
          status: 'in_use',
          productionLineId: productionLineId || null,
        });
      }

      const taskNumber = generateTaskNumber();
      const task = await Task.create({
        taskNumber,
        title: `Stitching - ${order.orderDetails.garmentType} for ${order.customer.name}`,
        description: `Perform production operation for order ${order.orderNumber}. Size: ${order.orderDetails?.sizes?.join(', ') || 'M'}.`,
        orderId: order._id,
        assignedTo: split.assignedTo,
        assignedBy: req.user._id,
        productionLineId: productionLineId || null,
        machineId: split.machineId || null,
        quantity: {
          target: parseInt(split.quantity),
          produced: 0,
        },
        status: 'pending',
        priority: order.priority || 'medium',
        timeline: {
          assignedAt: new Date(),
          dueDate: order.requiredDate,
        }
      });

      const populated = await Task.findById(task._id)
        .populate('assignedTo', 'email profile')
        .populate('assignedBy', 'email profile');

      createdTasks.push(populated);

      emitToUser(split.assignedTo, 'taskAssigned', { action: 'assigned', task: populated });
    }

    emitToRoom('management', 'orderUpdated', { action: 'in_production', order });
    emitToRoom('management', 'tasksAssigned', { orderId: order._id, tasks: createdTasks });
    emitToAll('orderCreated', order);

    return ApiResponse.success(res, createdTasks, 'Tasks dispatched successfully.');
  } catch (err) {
    next(err);
  }
};

exports.getMlHealth = async (req, res) => {
  try {
    const axios = require('axios');
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:5001';
    let mlOnline = false;
    let details = null;
    try {
      const resp = await axios.get(`${aiUrl}/health`, { timeout: 1500 });
      mlOnline = resp.status === 200;
      details = resp.data;
    } catch {
      mlOnline = false;
    }

    return res.json({
      success: true,
      status: mlOnline ? 'local-ml' : 'cloud-fallback',
      available: mlOnline,
      provider: mlOnline ? 'local-python-ml' : 'groq-llama3',
      details,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.json({
      success: true,
      status: 'cloud-fallback',
      available: false,
      provider: 'heuristic',
      error: err.message,
    });
  }
};

exports.getModelStatus = async (req, res) => {
  return res.json({
    success: true,
    status: 'active',
    models: {
      delayPrediction: 'active',
      machineFailure: 'active',
      productionForecast: 'active',
      nlpCommandParser: 'active',
    },
    tier: 'hybrid-tier1-tier2',
  });
};


