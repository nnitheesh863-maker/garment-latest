db = db.getSiblingDB('garment_production');

db.createCollection('users');
db.createCollection('orders');
db.createCollection('tasks');
db.createCollection('machines');
db.createCollection('inventories');
db.createCollection('qualities');
db.createCollection('notifications');
db.createCollection('attendances');

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ 'profile.employeeId': 1 }, { unique: true, sparse: true });

db.orders.createIndex({ orderNumber: 1 }, { unique: true });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ assignedLine: 1 });
db.orders.createIndex({ 'customer.name': 1 });

db.tasks.createIndex({ taskNumber: 1 }, { unique: true });
db.tasks.createIndex({ orderId: 1 });
db.tasks.createIndex({ assignedTo: 1 });
db.tasks.createIndex({ status: 1 });
db.tasks.createIndex({ productionLineId: 1 });

db.machines.createIndex({ machineNumber: 1 }, { unique: true });
db.machines.createIndex({ productionLineId: 1 });
db.machines.createIndex({ status: 1 });

db.inventories.createIndex({ rawMaterialId: 1 }, { unique: true });
db.inventories.createIndex({ category: 1 });
db.inventories.createIndex({ 'stockLevels.current': 1 });

db.notifications.createIndex({ recipient: 1 });
db.notifications.createIndex({ read: 1 });
db.notifications.createIndex({ createdAt: -1 });

db.attendances.createIndex({ employee: 1, date: 1 }, { unique: true });
