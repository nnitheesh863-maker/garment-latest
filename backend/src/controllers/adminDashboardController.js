const Order = require('../models/Order');
const Task = require('../models/Task');
const Machine = require('../models/Machine');
const Inventory = require('../models/Inventory');
const Quality = require('../models/Quality');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Issue = require('../models/Issue');
const DefectReport = require('../models/DefectReport');
const ProductionLine = require('../models/ProductionLine');
const Notification = require('../models/Notification');
const ApiResponse = require('../utils/apiResponse');
const { computeFactoryHealth } = require('../services/factoryHealthService');
const { emitToRoom } = require('../services/socketService');

const toMap = (rows) => {
  const map = {};
  rows.forEach((r) => {
    map[r._id] = r.count;
  });
  return map;
};

const STATUS_LIST = ['pending', 'approved', 'in_production', 'quality_check', 'completed', 'delivered'];
const TASK_STATUS_LIST = ['pending', 'accepted', 'in_progress', 'paused', 'completed', 'delayed'];
const MACHINE_STATUS_LIST = ['available', 'in_use', 'maintenance', 'repair', 'retired'];

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

function buildTrendDays(days) {
  const labels = [];
  const ordersCreated = [];
  const unitsProduced = [];
  const completedTasks = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    ordersCreated.push(0);
    unitsProduced.push(0);
    completedTasks.push(0);
  }

  const indexFor = (dateStr) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / 86400000);
    return diff <= 0 && diff >= -(days - 1) ? days - 1 + diff : -1;
  };

  return { labels, ordersCreated, unitsProduced, completedTasks, indexFor };
}

async function getKpis() {
  const [orderRows, priorityRows, urgentOrders, taskRows, taskTotals, delayedTasks] = await Promise.all([
    Order.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    Order.find({
      isDeleted: false,
      priority: 'urgent',
      status: { $nin: ['completed', 'delivered'] },
    })
      .select('orderNumber customer orderDetails requiredDate status priority')
      .sort({ requiredDate: 1 })
      .limit(6),
    Task.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Task.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          produced: { $sum: '$quantity.produced' },
          rejected: { $sum: '$quantity.rejected' },
          scrap: { $sum: '$quantity.scrap' },
          target: { $sum: '$quantity.target' },
        },
      },
    ]),
    Task.countDocuments({ isDeleted: false, status: 'delayed' }),
  ]);

  const orderMap = toMap(orderRows);
  const taskMap = toMap(taskRows);
  const totalTasks = taskRows.reduce((s, r) => s + r.count, 0);
  const activeStatuses = ['pending', 'approved', 'in_production', 'quality_check'];
  const activeOrders = activeStatuses.reduce((s, st) => s + (orderMap[st] || 0), 0);
  const unitsInProduction = await Order.aggregate([
    { $match: { isDeleted: false, status: { $in: ['approved', 'in_production', 'quality_check'] } } },
    { $group: { _id: null, total: { $sum: '$orderDetails.quantity' } } },
  ]);

  return {
    ordersTotal: orderRows.reduce((s, r) => s + r.count, 0),
    ordersByStatus: STATUS_LIST.map((s) => ({ status: s, count: orderMap[s] || 0 })),
    ordersByPriority: priorityRows.map((r) => ({ priority: r._id, count: r.count })),
    activeOrders,
    completedOrders: orderMap.completed || 0,
    deliveredOrders: orderMap.delivered || 0,
    unitsInProduction: unitsInProduction[0]?.total || 0,
    urgentOrders: urgentOrders.map((o) => ({
      _id: o._id,
      orderNumber: o.orderNumber,
      customerName: o.customer?.name,
      garmentType: o.orderDetails?.garmentType,
      quantity: o.orderDetails?.quantity,
      status: o.status,
      priority: o.priority,
      requiredDate: o.requiredDate,
    })),
    tasksTotal: totalTasks,
    tasksByStatus: TASK_STATUS_LIST.map((s) => ({ status: s, count: taskMap[s] || 0 })),
    tasksInProgress: (taskMap.in_progress || 0) + (taskMap.paused || 0),
    tasksCompleted: taskMap.completed || 0,
    tasksDelayed: delayedTasks,
    unitsProducedTotal: taskTotals[0]?.produced || 0,
    unitsRejectedTotal: (taskTotals[0]?.rejected || 0) + (taskTotals[0]?.scrap || 0),
    unitsTargetTotal: taskTotals[0]?.target || 0,
  };
}

async function getProductionTrend(days) {
  const trend = buildTrendDays(days);

  const [orderDays, taskDays] = await Promise.all([
    Order.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]),
    Task.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: { $ifNull: ['$timeline.completedAt', '$updatedAt'] } } },
          produced: { $sum: '$quantity.produced' },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  orderDays.forEach((r) => {
    const idx = trend.indexFor(r._id);
    if (idx >= 0) trend.ordersCreated[idx] = r.count;
  });
  taskDays.forEach((r) => {
    const idx = trend.indexFor(r._id);
    if (idx >= 0) {
      trend.unitsProduced[idx] = r.produced;
      trend.completedTasks[idx] = r.completed;
    }
  });

  return {
    labels: trend.labels,
    ordersCreated: trend.ordersCreated,
    unitsProduced: trend.unitsProduced,
    completedTasks: trend.completedTasks,
  };
}

async function getMachineData() {
  const [statusRows, lineRows, maintenanceQueue, avg] = await Promise.all([
    Machine.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Machine.aggregate([
      { $match: { isDeleted: false, productionLineId: { $ne: null } } },
      {
        $group: {
          _id: '$productionLineId',
          totalMachines: { $sum: 1 },
          avgEfficiency: { $avg: '$operationalMetrics.efficiency' },
        },
      },
    ]),
    Machine.find({
      isDeleted: false,
      'maintenanceSchedule.nextServiceDate': { $lte: new Date(Date.now() + 7 * 86400000) },
    })
      .select('name machineNumber type maintenanceSchedule status')
      .sort({ 'maintenanceSchedule.nextServiceDate': 1 }),
    Machine.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, avgEfficiency: { $avg: '$operationalMetrics.efficiency' } } },
    ]),
  ]);

  const byStatus = {};
  MACHINE_STATUS_LIST.forEach((s) => {
    byStatus[s] = 0;
  });
  statusRows.forEach((r) => {
    byStatus[r._id] = r.count;
  });

  return {
    total: statusRows.reduce((s, r) => s + r.count, 0),
    byStatus,
    repair: byStatus.repair || 0,
    avgEfficiency: Math.round(avg[0]?.avgEfficiency || 0),
    maintenanceDue: maintenanceQueue.length,
    maintenanceQueue: maintenanceQueue.map((m) => ({
      _id: m._id,
      name: m.name,
      machineNumber: m.machineNumber,
      type: m.type,
      status: m.status,
      nextServiceDate: m.maintenanceSchedule?.nextServiceDate,
    })),
    lineMetrics: lineRows,
  };
}

async function getInventoryData() {
  const [totalValue, lowStockItems, categoryRows] = await Promise.all([
    Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$stockLevels.current', '$costPerUnit'] } },
          totalItems: { $sum: 1 },
        },
      },
    ]),
    Inventory.find({
      $expr: { $lte: ['$stockLevels.current', '$stockLevels.reorderPoint'] },
    }).sort({ 'stockLevels.current': 1 }),
    Inventory.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalStock: { $sum: '$stockLevels.current' },
          totalValue: { $sum: { $multiply: ['$stockLevels.current', '$costPerUnit'] } },
        },
      },
    ]),
  ]);

  return {
    totalItems: totalValue[0]?.totalItems || 0,
    totalValue: Math.round((totalValue[0]?.totalValue || 0) * 100) / 100,
    lowStockCount: lowStockItems.length,
    lowStockItems: lowStockItems.map((i) => ({
      _id: i._id,
      name: i.name,
      rawMaterialId: i.rawMaterialId,
      category: i.category,
      unitOfMeasure: i.unitOfMeasure,
      current: i.stockLevels?.current || 0,
      reorderPoint: i.stockLevels?.reorderPoint || 0,
      supplier: i.supplier,
    })),
    byCategory: categoryRows.map((r) => ({
      category: r._id,
      count: r.count,
      totalStock: r.totalStock,
      totalValue: Math.round(r.totalValue * 100) / 100,
    })),
  };
}

async function getQualityData() {
  const [overall, gradeDistribution] = await Promise.all([
    Quality.aggregate([
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
    ]),
    Quality.aggregate([
      { $match: { grade: { $ne: null } } },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
    ]),
  ]);

  const o = overall[0] || { totalInspections: 0, totalPassed: 0, totalFailed: 0, totalInspected: 0, avgDefectRate: 0 };
  const passFail = {
    totalInspected: o.totalInspected,
    totalPassed: o.totalPassed,
    totalFailed: o.totalFailed,
  };

  return {
    overall: {
      ...o,
      avgDefectRate: Math.round(o.avgDefectRate * 100) / 100,
      passRate:
        o.totalInspected > 0 ? Math.round(((o.totalInspected - o.totalFailed) / o.totalInspected) * 100) : 100,
    },
    passFail,
    gradeDistribution: gradeDistribution.map((r) => ({ grade: r._id, count: r.count })),
  };
}

async function getLineData() {
  const [lines, orderCounts] = await Promise.all([
    ProductionLine.find({ active: true }).select('name code status capacity location metrics supervisor'),
    Order.aggregate([
      {
        $match: { isDeleted: false, status: { $in: ['approved', 'in_production', 'quality_check'] }, assignedLine: { $ne: null } },
      },
      { $group: { _id: '$assignedLine', count: { $sum: 1 }, quantity: { $sum: '$orderDetails.quantity' } } },
    ]),
  ]);

  const countMap = {};
  orderCounts.forEach((r) => {
    countMap[r._id.toString()] = r;
  });

  return lines.map((l) => ({
    _id: l._id,
    name: l.name,
    code: l.code,
    status: l.status,
    capacity: l.capacity,
    location: l.location,
    efficiency: l.metrics?.efficiency || 0,
    utilization: l.metrics?.utilization || 0,
    totalProduced: l.metrics?.totalProduced || 0,
    totalDefects: l.metrics?.totalDefects || 0,
    activeOrders: countMap[l._id.toString()]?.count || 0,
    orderUnits: countMap[l._id.toString()]?.quantity || 0,
  }));
}

async function getWorkforceData() {
  const [employees, managers, deptRows, attendanceRows, pendingLeaves, openIssues, openDefects] = await Promise.all([
    User.countDocuments({ role: 'employee', active: true }),
    User.countDocuments({ role: 'manager', active: true }),
    User.aggregate([
      { $match: { role: 'employee', active: true, 'profile.department': { $ne: null } } },
      { $group: { _id: '$profile.department', count: { $sum: 1 } } },
    ]),
    Attendance.aggregate([
      { $match: { date: { $gte: startOfToday(), $lte: endOfToday() } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Leave.countDocuments({ status: 'pending' }),
    Issue.countDocuments({ status: { $ne: 'resolved' } }),
    DefectReport.countDocuments({ status: { $ne: 'resolved' } }),
  ]);

  const attMap = toMap(attendanceRows);
  const present =
    (attMap.present || 0) + (attMap.working || 0) + (attMap.late || 0) + (attMap['half-day'] || 0);

  return {
    totalEmployees: employees,
    totalManagers: managers,
    byDepartment: deptRows.map((r) => ({ department: r._id, count: r.count })),
    attendanceToday: {
      present,
      absent: attMap.absent || 0,
      late: attMap.late || 0,
      working: attMap.working || 0,
      total: attendanceRows.reduce((s, r) => s + r.count, 0),
    },
    pendingLeaves,
    openIssues,
    openDefects,
  };
}

async function getNotifications() {
  return Notification.find()
    .sort({ createdAt: -1 })
    .limit(6)
    .select('title message type read priority createdAt')
    .lean();
}

exports.getSummary = async (req, res, next) => {
  try {
    const days = Math.min(30, Math.max(7, parseInt(req.query.days) || 14));

    const [kpis, productionTrend, machines, inventory, quality, lines, workforce, notifications] =
      await Promise.all([
        getKpis(),
        getProductionTrend(days),
        getMachineData(),
        getInventoryData(),
        getQualityData(),
        getLineData(),
        getWorkforceData(),
        getNotifications(),
      ]);

    const health = computeFactoryHealth({
      kpis,
      machines,
      inventory,
      quality,
      workforce,
      lines,
    });

    const payload = {
      kpis,
      productionTrend,
      machines,
      inventory,
      quality,
      lines,
      workforce,
      notifications,
      health,
      generatedAt: new Date().toISOString(),
    };

    if (req.query.stream === '1') {
      emitToRoom('admin', 'factoryHealthUpdated', {
        health: {
          score: health.score,
          grade: health.grade,
          label: health.label,
          tone: health.tone,
          summary: health.summary,
          componentScores: health.componentScores,
          recommendations: health.recommendations,
          generatedAt: health.generatedAt,
        },
        kpis: {
          activeOrders: kpis.activeOrders,
          ordersTotal: kpis.ordersTotal,
          unitsInProduction: kpis.unitsInProduction,
        },
      });
    }

    return ApiResponse.success(res, payload);
  } catch (err) {
    next(err);
  }
};

exports.getHealth = async (req, res, next) => {
  try {
    const [kpis, machines, inventory, quality, workforce, lines] = await Promise.all([
      getKpis(),
      getMachineData(),
      getInventoryData(),
      getQualityData(),
      getWorkforceData(),
      getLineData(),
    ]);

    const health = computeFactoryHealth({ kpis, machines, inventory, quality, workforce, lines });

    if (req.query.stream === '1') {
      emitToRoom('admin', 'factoryHealthUpdated', {
        health: {
          score: health.score,
          grade: health.grade,
          label: health.label,
          tone: health.tone,
          summary: health.summary,
          componentScores: health.componentScores,
          recommendations: health.recommendations,
          generatedAt: health.generatedAt,
        },
      });
    }

    return ApiResponse.success(res, health);
  } catch (err) {
    next(err);
  }
};

exports.getOeeTelemetry = async (req, res, next) => {
  try {
    const lines = await ProductionLine.find().populate('supervisor', 'name email');
    const [qualityStats, machineStats] = await Promise.all([
      Quality.aggregate([
        {
          $group: {
            _id: null,
            totalInspected: { $sum: '$sampleSize' },
            totalPassed: { $sum: '$passedUnits' },
            totalDefective: { $sum: '$defectiveUnits' },
          },
        },
      ]),
      Machine.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalMachines = machineStats.reduce((sum, m) => sum + m.count, 0) || 1;
    const runningMachines = machineStats.find((m) => m._id === 'in_use')?.count || 0;
    const availability = Math.min(100, Math.round((runningMachines / totalMachines) * 100));

    const totalInspected = qualityStats[0]?.totalInspected || 0;
    const totalPassed = qualityStats[0]?.totalPassed || 0;
    const qualityRate = totalInspected > 0 ? Math.round((totalPassed / totalInspected) * 100) : 98;

    const lineMetrics = lines.map((line) => {
      const target = line.capacity?.dailyTarget || 1000;
      const actual = line.capacity?.currentOutput || 0;
      const perf = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 85;
      const lineOee = Math.round((availability * (perf / 100) * (qualityRate / 100)));
      return {
        id: line._id,
        name: line.name,
        code: line.code,
        status: line.status,
        supervisor: line.supervisor?.name || 'Unassigned',
        dailyTarget: target,
        currentOutput: actual,
        performance: perf,
        oee: lineOee,
      };
    });

    const avgPerformance =
      lineMetrics.length > 0
        ? Math.round(lineMetrics.reduce((sum, l) => sum + l.performance, 0) / lineMetrics.length)
        : 85;

    const overallOee = Math.round((availability * (avgPerformance / 100) * (qualityRate / 100)));

    return ApiResponse.success(res, {
      overallOee,
      availability,
      performance: avgPerformance,
      quality: qualityRate,
      lines: lineMetrics,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};
