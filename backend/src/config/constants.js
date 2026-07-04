const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
};

const ORDER_STATUS = ['pending', 'approved', 'in_production', 'quality_check', 'completed', 'delivered'];

const TASK_STATUS = ['pending', 'accepted', 'in_progress', 'paused', 'completed', 'delayed'];

const MACHINE_STATUS = ['available', 'in_use', 'maintenance', 'repair', 'retired'];

const PRIORITY = ['low', 'medium', 'high', 'urgent'];

const QUALITY_GRADE = ['A', 'B', 'C', 'D'];

const INVENTORY_CATEGORIES = ['fabric', 'thread', 'zipper', 'button', 'label', 'packaging'];

module.exports = {
  ROLES,
  ORDER_STATUS,
  TASK_STATUS,
  MACHINE_STATUS,
  PRIORITY,
  QUALITY_GRADE,
  INVENTORY_CATEGORIES,
};
