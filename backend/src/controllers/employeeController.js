const mongoose = require("mongoose");
const User = require("../models/User");
const Task = require("../models/Task");
const Attendance = require("../models/Attendance");
const Notification = require("../models/Notification");
const Issue = require("../models/Issue");
const ApiResponse = require("../utils/apiResponse");
const { sanitizeUser } = require("../utils/helpers");
const { emitToUser } = require("../services/socketService");

exports.getEmployees = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      department,
      role,
      active,
      search,
      sortBy = "createdAt",
      sortOrder = -1,
    } = req.query;

    const filter = {};
    if (department) filter["profile.department"] = department;
    if (role) filter.role = role;
    if (active !== undefined) filter.active = active === "true";
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { "profile.firstName": { $regex: search, $options: "i" } },
        { "profile.lastName": { $regex: search, $options: "i" } },
        { "profile.employeeId": { $regex: search, $options: "i" } },
      ];
    }

    // Managers can view all employees (no managerId restriction)
    if (req.user.role === "employee") {
      filter._id = req.user._id;
    }

    const total = await User.countDocuments(filter);
    const employees = await User.find(filter)
      .populate("assignedLine", "name")
      .populate("managerId", "email profile.firstName profile.lastName")
      .sort({ [sortBy]: Number(sortOrder) })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return ApiResponse.paginated(
      res,
      employees.map(sanitizeUser),
      page,
      limit,
      total,
    );
  } catch (err) {
    next(err);
  }
};

exports.getEmployee = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id)
      .populate("assignedLine", "name")
      .populate("managerId", "email profile");

    if (!employee) {
      return ApiResponse.error(res, "Employee not found", 404);
    }

    return ApiResponse.success(res, sanitizeUser(employee));
  } catch (err) {
    next(err);
  }
};

exports.updateEmployee = async (req, res, next) => {
  try {
    const allowedFields = [
      "profile",
      "role",
      "managerId",
      "assignedLine",
      "active",
      "status",
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (req.body.status !== undefined) {
      updates.active = req.body.status === "active";
    }
    if (req.body.active !== undefined) {
      updates.active = Boolean(req.body.active);
    }

    const employee = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("assignedLine", "name")
      .populate("managerId", "email profile");

    if (!employee) {
      return ApiResponse.error(res, "Employee not found", 404);
    }

    return ApiResponse.success(res, sanitizeUser(employee), "Employee updated");
  } catch (err) {
    next(err);
  }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user && req.user._id.toString() === id.toString()) {
      return ApiResponse.error(res, "You cannot delete your own account", 400);
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return ApiResponse.error(res, "User not found", 404);
    }

    await Promise.allSettled([
      Attendance.deleteMany({ employee: id }),
      Task.deleteMany({ assignedTo: id }),
      Issue.deleteMany({ reportedBy: id }),
      Notification.deleteMany({ recipient: id }),
    ]);

    return ApiResponse.success(res, null, "User entirely deleted successfully");
  } catch (err) {
    next(err);
  }
};

exports.getEmployeePerformance = async (req, res, next) => {
  try {
    const employeeId = req.params.id;

    const empId = new mongoose.Types.ObjectId(employeeId);
    const taskStats = await Task.aggregate([
      { $match: { assignedTo: empId, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          totalTarget: { $sum: "$quantity.target" },
          totalProduced: { $sum: "$quantity.produced" },
          totalRejected: { $sum: "$quantity.rejected" },
        },
      },
    ]);

    const tasksByGrade = await Task.aggregate([
      {
        $match: {
          assignedTo: empId,
          isDeleted: false,
          qualityGrade: { $ne: null },
        },
      },
      { $group: { _id: "$qualityGrade", count: { $sum: 1 } } },
    ]);

    const monthlyTasks = await Task.aggregate([
      { $match: { assignedTo: empId, isDeleted: false } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const attendanceStats = await Attendance.aggregate([
      { $match: { employee: empId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = taskStats[0] || {
      totalTasks: 0,
      completedTasks: 0,
      totalTarget: 0,
      totalProduced: 0,
      totalRejected: 0,
    };
    const completionRate =
      stats.totalTasks > 0
        ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
        : 0;
    const qualityRate =
      stats.totalProduced > 0
        ? Math.round(
            ((stats.totalProduced - stats.totalRejected) /
              stats.totalProduced) *
              100,
          )
        : 100;

    return ApiResponse.success(res, {
      taskStats: stats,
      completionRate,
      qualityRate,
      tasksByGrade,
      monthlyTasks,
      attendanceStats,
    });
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeTasks = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { assignedTo: req.params.id, isDeleted: false };
    if (status) filter.status = status;

    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .populate("orderId", "orderNumber customer")
      .populate("machineId", "name machineNumber")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return ApiResponse.paginated(res, tasks, page, limit, total);
  } catch (err) {
    next(err);
  }
};

exports.markAttendance = async (req, res, next) => {
  try {
    const { date, clockIn, clockOut, status, shift, timezone, deviceTime, notes } = req.body;
    const employeeId = req.params.id;

    if (!date) {
      return ApiResponse.error(res, "Date is required", 400);
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const now = new Date();
    const clockInTime = clockIn ? new Date(clockIn) : now;
    const clockOutTime = clockOut ? new Date(clockOut) : null;

    const existing = await Attendance.findOne({
      employee: employeeId,
      date: attendanceDate,
    });

    let clockInTimeStr, clockOutTimeStr;
    if (clockInTime) {
      clockInTimeStr = clockInTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }

    const updates = {
      date: attendanceDate,
      status: status || "present",
      shift: shift || "general",
      timezone: timezone || "IST",
      deviceTime: deviceTime || now.toISOString(),
      clockIn: clockInTime,
      clockInTime: clockInTimeStr,
      notes,
    };

    let attendance;
    if (clockOutTime) {
      updates.clockOut = clockOutTime;
      updates.clockOutTime = clockOutTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const workingHours = clockOutTime - clockInTime;
      const hours = workingHours / (1000 * 60 * 60);
      const breakTime = Math.min(hours * 0.1, 1);
      const actualWorkingHours = Math.max(0, hours - breakTime);

      const lateArrival = Math.max(0, hours - 9);
      const earlyLeaving = 0;
      const overtime = Math.max(0, actualWorkingHours - 8);

      updates.workingHours = Math.round(actualWorkingHours * 100) / 100;
      updates.breakTime = Math.round(breakTime * 100) / 100;
      updates.overtime = Math.round(overtime * 100) / 100;
      updates.lateArrival = Math.round(lateArrival * 100) / 100;
      updates.earlyLeaving = Math.round(earlyLeaving * 100) / 100;

      updates.status = "working";
    } else {
      updates.status = "working";
    }

    if (existing) {
      attendance = await Attendance.findOneAndUpdate(
        { employee: employeeId, date: attendanceDate },
        updates,
        { new: true },
      );
    } else {
      attendance = await Attendance.create({
        employee: employeeId,
        ...updates,
      });
    }

    return ApiResponse.success(res, attendance, "Attendance recorded");
  } catch (err) {
    next(err);
  }
};

exports.getAttendance = async (req, res, next) => {
  try {
    const { startDate, endDate, page = 1, limit = 30 } = req.query;
    const filter = { employee: req.params.id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const total = await Attendance.countDocuments(filter);
    const records = await Attendance.find(filter)
      .sort({ date: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return ApiResponse.paginated(res, records, page, limit, total);
  } catch (err) {
    next(err);
  }
};

exports.reportIssue = async (req, res, next) => {
  try {
    const { title, message, type, priority, machine, description } = req.body;
    const desc = description || message;
    const titleText = title || (desc ? desc.substring(0, 50) : "Issue Report");

    if (!desc) {
      return ApiResponse.error(res, "Description is required", 400);
    }

    const employee = req.user;

    const issue = await Issue.create({
      employee: employee._id,
      type: type || "general",
      description: desc,
      priority: priority || "medium",
      machine: machine || "",
    });

    const managers = await User.find({
      $or: [
        { role: "admin" },
        { role: "manager", assignedLine: employee.assignedLine },
      ],
      active: true,
    });

    const notifications = managers.map((mgr) => ({
      recipient: mgr._id,
      sender: employee._id,
      type: "issue_report",
      title: `Issue Report: ${titleText}`,
      message: `${employee.profile?.firstName || "Employee"} reports: ${desc}`,
      link: `/issues/${issue._id}`,
      priority: "medium",
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    for (const mgr of managers) {
      emitToUser(mgr._id, "newNotification", {
        type: "issue_report",
        title: titleText,
        message: desc,
        from: employee._id,
      });
    }

    return ApiResponse.success(res, issue, "Issue reported to management");
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeIssues = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { employee: req.params.id };
    if (status) filter.status = status;

    const total = await Issue.countDocuments(filter);
    const issues = await Issue.find(filter)
      .populate("employee", "email profile.firstName profile.lastName")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return ApiResponse.paginated(res, issues, page, limit, total);
  } catch (err) {
    next(err);
  }
};

exports.getAllIssues = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, priority, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) {
      filter.description = { $regex: search, $options: "i" };
    }

    const total = await Issue.countDocuments(filter);
    const issues = await Issue.find(filter)
      .populate(
        "employee",
        "email profile.firstName profile.lastName assignedLine",
      )
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return ApiResponse.paginated(res, issues, page, limit, total);
  } catch (err) {
    next(err);
  }
};
