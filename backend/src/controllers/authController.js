const User = require("../models/User");
const ApiResponse = require("../utils/apiResponse");
const { sanitizeUser } = require("../utils/helpers");
const {
  generateToken,
  generateRefreshToken,
  verifyToken,
} = require("../config/jwt");

exports.register = async (req, res, next) => {
  try {
    const { email, password, role, profile } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return ApiResponse.error(res, "Email already registered", 400);
    }

    await User.create({ email, password, role, profile });

    return ApiResponse.success(
      res,
      null,
      "User created successfully. Please login.",
      201,
    );
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select(
      "+password +refreshToken",
    );
    if (!user) {
      return ApiResponse.error(res, "Invalid email or password", 401);
    }

    if (!user.active) {
      return ApiResponse.error(res, "Account deactivated", 401);
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
    const allowedFields = ["profile", "assignedLine", "managerId"];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    return ApiResponse.success(res, sanitizeUser(user), "Profile updated");
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
