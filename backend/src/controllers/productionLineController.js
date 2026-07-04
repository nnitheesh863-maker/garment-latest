const ProductionLine = require('../models/ProductionLine');
const ApiResponse = require('../utils/apiResponse');

exports.getLines = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [lines, total] = await Promise.all([
      ProductionLine.find(filter).populate('supervisor', 'email profile').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      ProductionLine.countDocuments(filter),
    ]);
    return ApiResponse.paginated(res, lines, parseInt(page), parseInt(limit), total);
  } catch (err) {
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
