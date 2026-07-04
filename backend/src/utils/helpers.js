let orderCounter = 0;
let taskCounter = 0;
let machineCounter = 0;

function generateOrderNumber() {
  orderCounter += 1;
  const year = new Date().getFullYear();
  return `ORD-${year}-${String(orderCounter).padStart(5, '0')}`;
}

function generateTaskNumber() {
  taskCounter += 1;
  const year = new Date().getFullYear();
  return `TSK-${year}-${String(taskCounter).padStart(5, '0')}`;
}

function generateMachineNumber() {
  machineCounter += 1;
  return `MCH-${String(machineCounter).padStart(4, '0')}`;
}

function calculateProgress(target, produced) {
  if (!target || target === 0) return 0;
  return Math.min(100, Math.round((produced / target) * 100));
}

function sanitizeUser(user) {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.refreshToken;
  return obj;
}

module.exports = {
  generateOrderNumber,
  generateTaskNumber,
  generateMachineNumber,
  calculateProgress,
  sanitizeUser,
};
