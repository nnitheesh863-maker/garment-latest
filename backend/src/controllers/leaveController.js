/**
 * JSDoc: LeaveController - Employee leave requests, approval hierarchies, and quota tracking
 * @module controllers/leaveController
 */
const Leave = require('../models/Leave');
const ApiResponse = require('../utils/apiResponse');

exports.createLeaveRequest = async (req, res, next) => {
  try {
    const { startDate, endDate, reason, type } = req.body;

    if (!startDate || !endDate || !reason) {
      return ApiResponse.error(res, 'Please provide startDate, endDate and reason', 400);
    }

    if (new Date(startDate) > new Date(endDate)) {
      return ApiResponse.error(res, 'Start date cannot be after end date', 400);
    }

    const leave = await Leave.create({
      employee: req.user._id,
      startDate,
      endDate,
      reason,
      type: type || 'other',
    });

    return ApiResponse.success(res, leave, 'Leave request created', 201);
  } catch (err) {
    next(err);
  }
};

exports.getMyLeaves = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { employee: req.user._id };

    if (status) filter.status = status;

    const total = await Leave.countDocuments(filter);
    const leaves = await Leave.find(filter)
      .populate('employee', 'email profile')
      .populate('approvedBy', 'email profile')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return ApiResponse.paginated(res, leaves, page, limit, total);
  } catch (err) {
    next(err);
  }
};

exports.getLeaveRequests = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      employeeId,
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (employeeId) filter.employee = employeeId;

    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    const total = await Leave.countDocuments(filter);
    const leaves = await Leave.find(filter)
      .populate('employee', 'email profile')
      .populate('approvedBy', 'email profile')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return ApiResponse.paginated(res, leaves, page, limit, total);
  } catch (err) {
    next(err);
  }
};

exports.updateLeaveStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return ApiResponse.error(res, 'Status must be either approved or rejected', 400);
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return ApiResponse.error(res, 'Leave request not found', 404);
    }

    if (leave.status === 'cancelled') {
      return ApiResponse.error(res, 'Cannot update a cancelled leave request', 400);
    }

    if (leave.status !== 'pending') {
      return ApiResponse.error(res, `Leave request is already ${leave.status}`, 400);
    }

    leave.status = status;
    leave.approvedBy = req.user._id;

    if (status === 'approved') {
      leave.approvedAt = new Date();
    }

    if (status === 'rejected' && rejectionReason) {
      leave.rejectionReason = rejectionReason;
    }

    await leave.save();

    const populated = await Leave.findById(leave._id)
      .populate('employee', 'email profile')
      .populate('approvedBy', 'email profile');

    return ApiResponse.success(res, populated, `Leave request ${status}`);
  } catch (err) {
    next(err);
  }
};

exports.getLeaveBalance = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const approvedLeaves = await Leave.find({
      employee: req.user._id,
      status: 'approved',
      startDate: { $gte: startOfYear, $lte: endOfYear },
    });

    let usedDays = 0;
    approvedLeaves.forEach((leave) => {
      const diffMs = new Date(leave.endDate) - new Date(leave.startDate);
      const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1);
      usedDays += days;
    });

    const totalAllowance = 18;
    const remainingDays = Math.max(0, totalAllowance - usedDays);

    return ApiResponse.success(res, {
      year: currentYear,
      totalAllowance,
      usedDays,
      remainingDays,
      approvedRequests: approvedLeaves.length,
    });
  } catch (err) {
    next(err);
  }
};

