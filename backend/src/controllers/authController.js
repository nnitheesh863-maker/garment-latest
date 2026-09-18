const User = require("../models/User");
const ApiResponse = require("../utils/apiResponse");
const { sanitizeUser } = require("../utils/helpers");
const {
  generateToken,
  generateRefreshToken,
  verifyToken,
} = require("../config/jwt");
const { logAudit } = require("../services/auditLogService");

const ADMIN_SECRET_CODE = process.env.ADMIN_SECRET_CODE || "ADMIN2026";

exports.register = async (req, res, next) => {
  try {
    const { email, password, role = "employee", adminSecurityCode } = req.body;
    const firstName = req.body.profile?.firstName || req.body.firstName || "Staff";
    const lastName = req.body.profile?.lastName || req.body.lastName || "Member";
    const department = req.body.profile?.department || req.body.department || "";
    const position = req.body.profile?.position || req.body.position || "";
    const employeeId = req.body.profile?.employeeId || req.body.employeeId || `EMP-${Date.now().toString().slice(-6)}`;
    const phone = req.body.profile?.phone || req.body.contactNumber || "";
    const joiningDate = req.body.profile?.joiningDate || req.body.joiningDate || new Date();

    const profile = {
      firstName,
      lastName,
      department,
      position,
      employeeId,
      phone,
      joiningDate,
      ...(req.body.profile || {}),
    };

    const exists = await User.findOne({ email });
    if (exists) {
      return ApiResponse.error(res, "Email already registered", 400);
    }

    if (role === "admin") {
      if (!adminSecurityCode || adminSecurityCode.trim() !== ADMIN_SECRET_CODE) {
        return ApiResponse.error(
          res,
          "Invalid Admin Security Code. You need the authorized Admin Passcode (ADMIN2026) to register as an Administrator.",
          403,
        );
      }
    }

    const isManagerRole = role === "manager";
    const newUser = await User.create({
      email,
      password,
      role,
      profile,
      isApproved: !isManagerRole,
      approvalStatus: isManagerRole ? "pending" : "approved",
      active: !isManagerRole,
    });

    if (isManagerRole) {
      return ApiResponse.success(
        res,
        sanitizeUser(newUser),
        "Manager registration submitted successfully! Your account is pending Administrator approval before you can sign in.",
        201,
      );
    }

    return ApiResponse.success(
      res,
      sanitizeUser(newUser),
      "Account created successfully. Please sign in.",
      201,
    );
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    const user = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } }).select(
      "+password +refreshToken",
    );
    if (!user) {
      return ApiResponse.error(res, "Invalid email or password", 401);
    }

    if (user.role === "manager" && (!user.isApproved || user.approvalStatus === "pending")) {
      return ApiResponse.error(
        res,
        "Your Manager account is pending administrator approval. Please wait for an Administrator to approve your account before signing in.",
        403,
      );
    }

    if (user.role === "manager" && user.approvalStatus === "rejected") {
      return ApiResponse.error(
        res,
        "Your Manager registration request was declined by the administrator. Please contact your organization administrator.",
        403,
      );
    }

    if (!user.active) {
      return ApiResponse.error(res, "Account deactivated. Please contact administrator.", 401);
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return ApiResponse.error(res, "Invalid email or password", 401);
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    await logAudit({
      req,
      user,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user._id,
      description: `User ${user.email} (${user.role}) logged in successfully.`,
      severity: 'info',
    });

    return ApiResponse.success(
      res,
      {
        user: sanitizeUser(user),
        token,
        refreshToken,
      },
      "Login successful",
    );
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return ApiResponse.error(res, "Refresh token required", 400);
    }

    const decoded = verifyToken(refreshToken, true);

    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || user.refreshToken !== refreshToken) {
      return ApiResponse.error(res, "Invalid refresh token", 401);
    }

    const token = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    return ApiResponse.success(
      res,
      {
        token,
        refreshToken: newRefreshToken,
      },
      "Token refreshed",
    );
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return ApiResponse.error(res, "Invalid or expired refresh token", 401);
    }
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("+refreshToken");
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    return ApiResponse.success(res, null, "Logged out successfully");
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("assignedLine")
      .populate("managerId", "email profile");
    return ApiResponse.success(res, sanitizeUser(user));
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      active,
      search,
      sortBy = "createdAt",
      sortOrder = -1,
    } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (active !== undefined) filter.active = active === "true";
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { "profile.firstName": { $regex: search, $options: "i" } },
        { "profile.lastName": { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .populate("assignedLine", "name")
      .populate("managerId", "email profile.firstName profile.lastName")
      .sort({ [sortBy]: Number(sortOrder) })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return ApiResponse.paginated(
      res,
      users.map(sanitizeUser),
      page,
      limit,
      total,
    );
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return ApiResponse.error(res, "User not found", 404);
    }

    if (!user.profile) {
      user.profile = {};
    }

    if (req.body.profile) {
      Object.assign(user.profile, req.body.profile);
    }

    const directProfileFields = [
      "firstName",
      "lastName",
      "contactNumber",
      "phoneNumber",
      "phone",
      "department",
      "position",
      "profileImage",
      "employeeId",
    ];

    for (const f of directProfileFields) {
      if (req.body[f] !== undefined) {
        if (f === "phone" || f === "phoneNumber") {
          user.profile.contactNumber = req.body[f];
        } else {
          user.profile[f] = req.body[f];
        }
      }
    }

    if (req.body.assignedLine !== undefined) user.assignedLine = req.body.assignedLine;
    if (req.body.managerId !== undefined) user.managerId = req.body.managerId;

    user.markModified("profile");
    await user.save();

    const updated = await User.findById(user._id)
      .populate("assignedLine", "name")
      .populate("managerId", "email profile");

    return ApiResponse.success(res, sanitizeUser(updated), "Profile updated successfully");
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return ApiResponse.error(res, "Current and new password required", 400);
    }
    if (newPassword.length < 6) {
      return ApiResponse.error(
        res,
        "New password must be at least 6 characters",
        400,
      );
    }

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return ApiResponse.error(res, "Current password is incorrect", 401);
    }

    user.password = newPassword;
    await user.save();

    return ApiResponse.success(res, null, "Password changed successfully");
  } catch (err) {
    next(err);
  }
};

exports.getPendingApprovals = async (req, res, next) => {
  try {
    const pending = await User.find({
      $or: [
        { approvalStatus: "pending" },
        { role: "manager", isApproved: false, approvalStatus: { $ne: "rejected" } },
      ],
    }).sort({ createdAt: -1 });

    return ApiResponse.success(res, pending.map(sanitizeUser), "Pending manager approvals retrieved");
  } catch (err) {
    next(err);
  }
};

exports.approveManager = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return ApiResponse.error(res, "User not found", 404);
    }

    user.isApproved = true;
    user.approvalStatus = "approved";
    user.active = true;
    user.approvedBy = req.user._id;
    user.approvalDate = new Date();
    await user.save();

    const name = `${user.profile?.firstName || user.firstName || ""} ${user.profile?.lastName || user.lastName || ""}`.trim() || user.email;
    return ApiResponse.success(res, sanitizeUser(user), `Manager ${name} approved successfully`);
  } catch (err) {
    next(err);
  }
};

exports.rejectManager = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return ApiResponse.error(res, "User not found", 404);
    }

    user.isApproved = false;
    user.approvalStatus = "rejected";
    user.active = false;
    user.approvedBy = req.user._id;
    user.approvalDate = new Date();
    await user.save();

    const name = `${user.profile?.firstName || user.firstName || ""} ${user.profile?.lastName || user.lastName || ""}`.trim() || user.email;
    return ApiResponse.success(res, sanitizeUser(user), `Manager ${name} registration application rejected`);
  } catch (err) {
    next(err);
  }
};
