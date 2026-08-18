let orderCounter = 0;
let taskCounter = 0;
let machineCounter = 0;

function generateOrderNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `ORD-${year}-${rand}`;
}

function generateTaskNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `TSK-${year}-${rand}`;
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
