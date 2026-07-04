const mongoose = require('mongoose');
const Machine = require('../models/Machine');
const ApiResponse = require('../utils/apiResponse');
const { generateMachineNumber } = require('../utils/helpers');
const { getFailurePrediction } = require('../services/aiService');
const { emitToRoom } = require('../services/socketService');

exports.getMachines = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      productionLineId,
      type,
      search,
      sortBy = 'createdAt',
      sortOrder = -1,
    } = req.query;

    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (productionLineId) filter.productionLineId = productionLineId;
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { machineNumber: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Machine.countDocuments(filter);
    const machines = await Machine.find(filter)
      .populate('productionLineId', 'name')
      .sort({ [sortBy]: Number(sortOrder) })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return ApiResponse.paginated(res, machines, page, limit, total);
  } catch (err) {
    next(err);
  }
};

exports.createMachine = async (req, res, next) => {
  try {
    const machineData = { ...req.body };
    machineData.machineNumber = generateMachineNumber();

    const machine = await Machine.create(machineData);
    const populated = await Machine.findById(machine._id).populate('productionLineId', 'name');

    emitToRoom('management', 'machineStatusChanged', { action: 'created', machine: populated });

    return ApiResponse.success(res, populated, 'Machine created', 201);
  } catch (err) {
    next(err);
  }
};

exports.getMachine = async (req, res, next) => {
  try {
    const machine = await Machine.findOne({ _id: req.params.id, isDeleted: false })
      .populate('productionLineId', 'name');

    if (!machine) {
      return ApiResponse.error(res, 'Machine not found', 404);
    }

    return ApiResponse.success(res, machine);
  } catch (err) {
    next(err);
  }
};

exports.updateMachine = async (req, res, next) => {
  try {
    const allowedFields = [
      'name', 'type', 'model', 'manufacturer',
      'productionLineId', 'specifications', 'operationalMetrics', 'sensors',
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const machine = await Machine.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      updates,
      { new: true, runValidators: true }
    ).populate('productionLineId', 'name');

    if (!machine) {
      return ApiResponse.error(res, 'Machine not found', 404);
    }

    return ApiResponse.success(res, machine, 'Machine updated');
  } catch (err) {
    next(err);
  }
};

exports.deleteMachine = async (req, res, next) => {
  try {
    const machine = await Machine.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, status: 'retired' },
      { new: true }
    );

    if (!machine) {
      return ApiResponse.error(res, 'Machine not found', 404);
    }

    emitToRoom('management', 'machineStatusChanged', { action: 'deleted', machineId: req.params.id });

    return ApiResponse.success(res, null, 'Machine retired');
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return ApiResponse.error(res, 'Status is required', 400);
    }

    const validStatuses = ['available', 'in_use', 'maintenance', 'repair', 'retired'];
    if (!validStatuses.includes(status)) {
      return ApiResponse.error(res, 'Invalid status', 400);
    }

    const machine = await Machine.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { status },
      { new: true }
    ).populate('productionLineId', 'name');

    if (!machine) {
      return ApiResponse.error(res, 'Machine not found', 404);
    }

    emitToRoom('management', 'machineStatusChanged', {
      action: 'statusChanged',
      machine,
      previousStatus: machine.status,
      newStatus: status,
    });

    return ApiResponse.success(res, machine, `Machine status changed to ${status}`);
  } catch (err) {
    next(err);
  }
};

exports.scheduleMaintenance = async (req, res, next) => {
  try {
    const { serviceDate, serviceType, description, cost, technician, nextServiceDate } = req.body;
    if (!serviceType || !description) {
      return ApiResponse.error(res, 'Service type and description are required', 400);
    }

    const machine = await Machine.findOne({ _id: req.params.id, isDeleted: false });
    if (!machine) {
      return ApiResponse.error(res, 'Machine not found', 404);
    }

    const maintenanceEntry = {
      serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
      serviceType,
      description,
      cost: cost || 0,
      technician: technician || 'Unknown',
      nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null,
    };

    machine.maintenanceSchedule.serviceHistory.push(maintenanceEntry);
    machine.maintenanceSchedule.lastServiceDate = maintenanceEntry.serviceDate;
    if (nextServiceDate) {
      machine.maintenanceSchedule.nextServiceDate = new Date(nextServiceDate);
    }
    machine.status = 'maintenance';
    await machine.save();

    const populated = await Machine.findById(machine._id).populate('productionLineId', 'name');

    emitToRoom('management', 'machineStatusChanged', {
      action: 'maintenance',
      machine: populated,
    });

    return ApiResponse.success(res, populated, 'Maintenance scheduled');
  } catch (err) {
    next(err);
  }
};

exports.getMachineAnalytics = async (req, res, next) => {
  try {
    const statusCounts = await Machine.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const lineMetrics = await Machine.aggregate([
      { $match: { isDeleted: false, productionLineId: { $ne: null } } },
      {
        $group: {
          _id: '$productionLineId',
          totalMachines: { $sum: 1 },
          avgEfficiency: { $avg: '$operationalMetrics.efficiency' },
          totalHours: { $sum: '$operationalMetrics.totalHours' },
          totalDefects: { $sum: '$operationalMetrics.defectsProduced' },
        },
      },
      {
        $lookup: {
          from: 'productionlines',
          localField: '_id',
          foreignField: '_id',
          as: 'line',
        },
      },
      { $unwind: { path: '$line', preserveNullAndEmptyArrays: true } },
      { $project: { line: { name: 1 }, totalMachines: 1, avgEfficiency: 1, totalHours: 1, totalDefects: 1 } },
    ]);

    const typeCounts = await Machine.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    return ApiResponse.success(res, { statusCounts, lineMetrics, typeCounts });
  } catch (err) {
    next(err);
  }
};

exports.predictFailure = async (req, res, next) => {
  try {
    const machine = await Machine.findOne({ _id: req.params.id, isDeleted: false });
    if (!machine) {
      return ApiResponse.error(res, 'Machine not found', 404);
    }

    let prediction = null;
    try {
      prediction = await getFailurePrediction({
        machineNumber: machine.machineNumber,
        type: machine.type,
        totalHours: machine.operationalMetrics.totalHours,
        currentHour: machine.operationalMetrics.currentHour,
        efficiency: machine.operationalMetrics.efficiency,
        temperature: machine.sensors.temperature,
        vibration: machine.sensors.vibration,
      });
    } catch {
      return ApiResponse.success(res, { message: 'AI service unavailable' });
    }

    return ApiResponse.success(res, { prediction, machine });
  } catch (err) {
    next(err);
  }
};
