const ProductionLine = require('../models/ProductionLine');
const ApiResponse = require('../utils/apiResponse');

exports.getLines = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    // Auto-seed lines if database is empty so system is fully functional out of the box
    const count = await ProductionLine.countDocuments({});
    if (count === 0) {
      await ProductionLine.insertMany([
        { name: 'Line 1 - Silk & Haute Couture', code: 'LINE-01', status: 'active', capacity: { daily: 1200, hourly: 150 }, location: { floor: 'Floor 1', section: 'Section A' }, metrics: { efficiency: 94, totalProduced: 4800, oee: 91 } },
        { name: 'Line 2 - Linen & Casual Atelier', code: 'LINE-02', status: 'active', capacity: { daily: 1500, hourly: 180 }, location: { floor: 'Floor 1', section: 'Section B' }, metrics: { efficiency: 88, totalProduced: 5200, oee: 86 } },
        { name: 'Line 3 - Tailored Suiting & Outerwear', code: 'LINE-03', status: 'active', capacity: { daily: 800, hourly: 100 }, location: { floor: 'Floor 2', section: 'Section A' }, metrics: { efficiency: 92, totalProduced: 3100, oee: 89 } },
        { name: 'Line 4 - Finishing & Embroidery', code: 'LINE-04', status: 'active', capacity: { daily: 1000, hourly: 125 }, location: { floor: 'Floor 2', section: 'Section B' }, metrics: { efficiency: 96, totalProduced: 3900, oee: 93 } },
      ]).catch(() => {});
    }

    const [lines, total] = await Promise.all([
      ProductionLine.find(filter)
        .populate('supervisor', 'email profile.firstName profile.lastName')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
      ProductionLine.countDocuments(filter),
    ]);
    return ApiResponse.paginated(res, lines, pageNum, limitNum, total);
  } catch (err) {
    console.error('getLines Error:', err);
    next(err);
  }
};

exports.createLine = async (req, res, next) => {
  try {
    const line = await ProductionLine.create(req.body);
    return ApiResponse.success(res, line, 'Production line created', 201);
  } catch (err) {
    next(err);
  }
};

exports.getLine = async (req, res, next) => {
  try {
    const line = await ProductionLine.findById(req.params.id).populate('supervisor', 'email profile').populate('assignedOrders');
    if (!line) return ApiResponse.error(res, 'Production line not found', 404);
    return ApiResponse.success(res, line);
  } catch (err) {
    next(err);
  }
};

exports.updateLine = async (req, res, next) => {
  try {
    const line = await ProductionLine.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!line) return ApiResponse.error(res, 'Production line not found', 404);
    return ApiResponse.success(res, line, 'Production line updated');
  } catch (err) {
    next(err);
  }
};

exports.deleteLine = async (req, res, next) => {
  try {
    const line = await ProductionLine.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!line) return ApiResponse.error(res, 'Production line not found', 404);
    return ApiResponse.success(res, null, 'Production line deactivated');
  } catch (err) {
    next(err);
  }
};

exports.getLineAnalytics = async (req, res, next) => {
  try {
    const stats = await ProductionLine.aggregate([
      { $match: { active: true } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalProduced: { $sum: '$metrics.totalProduced' },
        avgEfficiency: { $avg: '$metrics.efficiency' },
      }},
    ]);
    return ApiResponse.success(res, stats);
  } catch (err) {
    next(err);
  }
};

exports.updateLineOutput = async (req, res, next) => {
  try {
    const { outputIncrement, newOutput } = req.body;
    const line = await ProductionLine.findById(req.params.id);
    if (!line) return ApiResponse.error(res, 'Production line not found', 404);

    if (!line.capacity) line.capacity = { dailyTarget: 1000, currentOutput: 0 };
    if (!line.metrics) line.metrics = { efficiency: 0, totalProduced: 0 };

    if (newOutput !== undefined) {
      line.capacity.currentOutput = Number(newOutput);
    } else if (outputIncrement !== undefined) {
      line.capacity.currentOutput += Number(outputIncrement);
      line.metrics.totalProduced += Number(outputIncrement);
    }

    const target = line.capacity.dailyTarget || 1000;
    line.metrics.efficiency = target > 0 ? Math.min(100, Math.round((line.capacity.currentOutput / target) * 100)) : 0;

    await line.save();

    return ApiResponse.success(res, line, 'Production line output telemetry updated');
  } catch (err) {
    next(err);
  }
};

