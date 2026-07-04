const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');

const registerUser = async (userData) => {
  const { email } = userData;
  const exists = await User.findOne({ email });
  if (exists) {
    throw Object.assign(new Error('Email already registered'), { statusCode: 400 });
  }
  const user = await User.create(userData);
  return user;
};

const authenticateUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }
  if (!user.active) {
    throw Object.assign(new Error('Account deactivated'), { statusCode: 401 });
  }
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }
  return user;
};

const refreshUserToken = async (refreshToken, verifyToken) => {
  if (!refreshToken) {
    throw Object.assign(new Error('Refresh token required'), { statusCode: 400 });
  }
  const decoded = verifyToken(refreshToken, true);
  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
  }
  return user;
};

const logoutUser = async (userId) => {
  const user = await User.findById(userId).select('+refreshToken');
  if (user) {
    user.refreshToken = null;
    await user.save();
  }
};

const getUserProfile = async (userId) => {
  const user = await User.findById(userId)
    .populate('assignedLine')
    .populate('managerId', 'email profile');
  return user;
};

const updateUserProfile = async (userId, updates) => {
  const allowedFields = ['profile', 'assignedLine', 'managerId'];
  const filteredUpdates = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }
  const user = await User.findByIdAndUpdate(userId, filteredUpdates, {
    new: true,
    runValidators: true,
  });
  return user;
};

const changeUserPassword = async (userId, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    throw Object.assign(new Error('Current and new password required'), { statusCode: 400 });
  }
  if (newPassword.length < 6) {
    throw Object.assign(new Error('New password must be at least 6 characters'), { statusCode: 400 });
  }
  const user = await User.findById(userId).select('+password');
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    throw Object.assign(new Error('Current password is incorrect'), { statusCode: 401 });
  }
  user.password = newPassword;
  await user.save();
};

module.exports = {
  registerUser,
  authenticateUser,
  refreshUserToken,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
};