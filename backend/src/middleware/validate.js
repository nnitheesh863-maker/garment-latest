const { body, param, validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const extracted = errors.array().map(e => ({ field: e.path, message: e.msg }));
    return ApiResponse.error(res, 'Validation failed', 400, extracted);
  }
  next();
};

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const registerRules = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'manager', 'employee']).withMessage('Invalid role'),
  body('profile.firstName').notEmpty().withMessage('First name is required'),
  body('profile.lastName').notEmpty().withMessage('Last name is required'),
];

const createOrderRules = [
  body('customer.name').notEmpty().withMessage('Customer name is required'),
  body('customer.email').isEmail().withMessage('Valid customer email is required'),
  body('orderDetails.garmentType').notEmpty().withMessage('Garment type is required'),
  body('orderDetails.quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('requiredDate').isISO8601().withMessage('Valid required date is required'),
];

const updateOrderRules = [
  body('orderDetails.garmentType').optional().notEmpty(),
  body('orderDetails.quantity').optional().isInt({ min: 1 }),
  body('requiredDate').optional().isISO8601(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('status').optional().isIn(['pending', 'approved', 'in_production', 'quality_check', 'completed', 'delivered']),
];

const createTaskRules = [
  body('title').notEmpty().withMessage('Task title is required'),
  body('orderId').isMongoId().withMessage('Valid order ID is required'),
  body('quantity.target').isInt({ min: 1 }).withMessage('Target quantity must be a positive integer'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
];

const updateTaskRules = [
  body('title').optional().notEmpty(),
  body('description').optional(),
  body('status').optional().isIn(['pending', 'accepted', 'in_progress', 'paused', 'completed', 'delayed']),
  body('qualityGrade').optional().isIn(['A', 'B', 'C', 'D']),
];

const createMachineRules = [
  body('name').notEmpty().withMessage('Machine name is required'),
  body('type').notEmpty().withMessage('Machine type is required'),
];

const createInventoryRules = [
  body('name').notEmpty().withMessage('Item name is required'),
  body('category').isIn(['fabric', 'thread', 'zipper', 'button', 'label', 'packaging']).withMessage('Invalid category'),
  body('stockLevels.current').isInt({ min: 0 }).withMessage('Current stock must be non-negative'),
  body('unitOfMeasure').notEmpty().withMessage('Unit of measure is required'),
];

const updateStockRules = [
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be non-negative'),
  body('operation').isIn(['add', 'subtract']).withMessage('Operation must be add or subtract'),
  body('reason').notEmpty().withMessage('Reason is required'),
];

const createInspectionRules = [
  body('orderId').isMongoId().withMessage('Valid order ID is required'),
  body('inspectionType').isIn(['incoming', 'in-process', 'final']).withMessage('Invalid inspection type'),
  body('results.totalInspected').isInt({ min: 1 }).withMessage('Total inspected must be at least 1'),
];

const mongoIdRule = [
  param('id').isMongoId().withMessage('Invalid ID format'),
];

module.exports = {
  validate,
  loginRules,
  registerRules,
  createOrderRules,
  updateOrderRules,
  createTaskRules,
  updateTaskRules,
  createMachineRules,
  createInventoryRules,
  updateStockRules,
  createInspectionRules,
  mongoIdRule,
};
