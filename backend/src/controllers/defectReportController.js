/**
 * JSDoc: DefectReportController - Defect reporting, root cause tracking, and corrective action workflows
 * @module controllers/defectReportController
 */
const DefectReport = require('../models/DefectReport');
const ApiResponse = require('../utils/apiResponse');

exports.createReport = async (req, res, next) => {
  try {
    const { garmentType, description, severity } = req.body;

    if (!garmentType || !description) {
      return ApiResponse.error(res, 'Please provide garmentType and description', 400);
    }

    const validTypes = ['shirt', 't-shirt', 'pant', 'other'];
    if (!validTypes.includes(garmentType)) {
      return ApiResponse.error(res, 'Invalid garment type. Must be one of: ' + validTypes.join(', '), 400);
    }

    const report = await DefectReport.create({
      employee: req.user._id,
      garmentType,
      description,
      severity: ['minor', 'major', 'critical'].includes(severity) ? severity : 'minor',
      photo: req.file ? req.file.path.replace(/\\/g, '/').replace(/^.*uploads[\\/]/, 'uploads/') : '',
    });

    const populated = await DefectReport.findById(report._id)
      .populate('employee', 'email profile');

    return ApiResponse.success(res, populated, 'Defect report created', 201);
  } catch (err) {
    next(err);
  }
};

exports.deleteReport = async (req, res, next) => {
  try {
    const report = await DefectReport.findByIdAndDelete(req.params.id);
    if (!report) {
      return ApiResponse.error(res, 'Defect report not found', 404);
    }
    return ApiResponse.success(res, null, 'Defect report deleted');
  } catch (err) {
    next(err);
  }
};

exports.getMyReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { employee: req.user._id };

    if (status) filter.status = status;

    const total = await DefectReport.countDocuments(filter);
    const reports = await DefectReport.find(filter)
      .populate('employee', 'email profile')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return ApiResponse.paginated(res, reports, page, limit, total);
  } catch (err) {
    next(err);
  }
};

exports.getAllReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, garmentType, employeeId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (garmentType) filter.garmentType = garmentType;
    if (employeeId) filter.employee = employeeId;

    const total = await DefectReport.countDocuments(filter);
    const reports = await DefectReport.find(filter)
      .populate('employee', 'email profile')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return ApiResponse.paginated(res, reports, page, limit, total);
  } catch (err) {
    next(err);
  }
};

exports.updateReportStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status || !['reviewed', 'resolved'].includes(status)) {
      return ApiResponse.error(res, 'Status must be either reviewed or resolved', 400);
    }

    const report = await DefectReport.findById(req.params.id);

    if (!report) {
      return ApiResponse.error(res, 'Defect report not found', 404);
    }

    if (report.status === 'resolved') {
      return ApiResponse.error(res, 'Cannot update a resolved report', 400);
    }

    report.status = status;
    await report.save();

    const populated = await DefectReport.findById(report._id)
      .populate('employee', 'email profile');

    return ApiResponse.success(res, populated, `Defect report marked as ${status}`);
  } catch (err) {
    next(err);
  }
};
