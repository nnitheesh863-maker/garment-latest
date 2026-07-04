const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return ApiResponse.error(res, 'Not authorized, no token provided', 401);
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'garment_jwt_secret_key_2024');
    req.user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!req.user) {
      return ApiResponse.error(res, 'User not found', 401);
    }
    if (!req.user.active) {
      return ApiResponse.error(res, 'Account deactivated', 401);
    }
    next();
  } catch (err) {
    return ApiResponse.error(res, 'Not authorized, token invalid', 401);
  }
};

module.exports = { protect };
