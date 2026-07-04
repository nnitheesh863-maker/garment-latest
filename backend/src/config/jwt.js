const jwt = require('jsonwebtoken');

const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'garment_jwt_secret_key_2024',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'garment_refresh_secret_2024',
  expiresIn: process.env.JWT_EXPIRE || '7d',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    JWT_CONFIG.secret,
    { expiresIn: JWT_CONFIG.expiresIn }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    JWT_CONFIG.refreshSecret,
    { expiresIn: JWT_CONFIG.refreshExpiresIn }
  );
};

const verifyToken = (token, isRefresh = false) => {
  return jwt.verify(token, isRefresh ? JWT_CONFIG.refreshSecret : JWT_CONFIG.secret);
};

module.exports = {
  JWT_CONFIG,
  generateToken,
  generateRefreshToken,
  verifyToken,
};