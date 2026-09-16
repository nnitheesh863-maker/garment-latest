const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return ApiResponse.unauthorized(res, 'Not authorized, no token provided');
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'garment_jwt_secret_key_2024');
    req.user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'User not found');
    }
    if (!req.user.active) {
      return ApiResponse.unauthorized(res, 'Account deactivated');
    }
    req.authTime = new Date();
    next();
  } catch (err) {
    return ApiResponse.unauthorized(res, 'Not authorized, token invalid');
  }
};

const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'garment_jwt_secret_key_2024');
    req.user = await User.findById(decoded.id).select('-password -refreshToken');
    next();
  } catch {
    next();
  }
};

module.exports = { protect, optionalAuth };
