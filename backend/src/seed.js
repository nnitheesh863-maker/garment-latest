require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/garment_production');
    console.log('Connected to MongoDB');

    const User = require('./models/User');
    const ProductionLine = require('./models/ProductionLine');
    const Machine = require('./models/Machine');
    const Inventory = require('./models/Inventory');

    const existingAdmin = await User.findOne({ email: 'admin@garment.com' });
    if (existingAdmin) {
      console.log('Seed data already exists, skipping...');
      await mongoose.disconnect();
      return;
    }

    const admin = await User.create({
      email: 'admin@garment.com',
      password: 'admin123',
      role: 'admin',
      profile: {
        firstName: 'System',
        lastName: 'Admin',
        employeeId: 'ADM-001',
        department: 'Management',
        position: 'System Administrator',
        joiningDate: new Date('2024-01-01'),
        contactNumber: '+1-555-0100',
      },
      active: true,
    });
    console.log('Admin user created: admin@garment.com / admin123');

    const manager = await User.create({
      email: 'manager@garment.com',
      password: 'manager123',
      role: 'manager',
      profile: {
        firstName: 'Jane',
        lastName: 'Smith',
        employeeId: 'MGR-001',
        department: 'Production',
        position: 'Production Manager',
        joiningDate: new Date('2024-01-15'),
        contactNumber: '+1-555-0101',
      },
      active: true,
    });
    console.log('Manager user created: manager@garment.com / manager123');

    const employee = await User.create({
      email: 'employee@garment.com',
      password: 'employee123',
      role: 'employee',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        employeeId: 'EMP-001',
        department: 'Production',
        position: 'Tailor',
        joiningDate: new Date('2024-02-01'),
        contactNumber: '+1-555-0102',
      },
      active: true,
      managerId: manager._id,
    });
    console.log('Employee user created: employee@garment.com / employee123');

    const line1 = await ProductionLine.create({
      name: 'Production Line A',
      code: 'LN-A',
      description: 'Main garment production line for bulk orders',
      status: 'active',
      capacity: { daily: 500, hourly: 62 },
      supervisor: manager._id,
      location: { floor: '1', section: 'A' },
      metrics: { totalProduced: 12500, totalDefects: 187, efficiency: 92, utilization: 87 },
    });

    const line2 = await ProductionLine.create({
      name: 'Production Line B',
      code: 'LN-B',
      description: 'Specialized line for premium garments',
      status: 'active',
      capacity: { daily: 300, hourly: 37 },
      supervisor: manager._id,
      location: { floor: '1', section: 'B' },
      metrics: { totalProduced: 8400, totalDefects: 92, efficiency: 95, utilization: 82 },
    });
    console.log('Production lines created');

    await Machine.create([
      {
        machineNumber: 'MCH-0001', name: 'Industrial Sewing Machine A1', type: 'sewing', model: 'IS-5000',
        manufacturer: 'Brother', productionLineId: line1._id,
        specifications: { capacity: '500 units/day', speed: '5000 stitches/min', powerConsumption: '0.5 kW', dimensions: '120x60x150 cm' },
        status: 'in_use', operationalMetrics: { totalHours: 2400, currentHour: 8, efficiency: 94, defectsProduced: 45 },
        sensors: { temperature: 42, vibration: 0.3, speed: 4800, powerUsage: 0.48 },
      },
      {
        machineNumber: 'MCH-0002', name: 'Cutting Machine C1', type: 'cutting', model: 'CT-2000',
        manufacturer: 'Lectra', productionLineId: line1._id,
        specifications: { capacity: '200 layers', speed: '60 m/min', powerConsumption: '2.5 kW', dimensions: '200x150x180 cm' },
        status: 'available', operationalMetrics: { totalHours: 1800, currentHour: 0, efficiency: 91, defectsProduced: 12 },
        sensors: { temperature: 38, vibration: 0.5, speed: 58, powerUsage: 2.3 },
      },
      {
        machineNumber: 'MCH-0003', name: 'Finishing Station F1', type: 'finishing', model: 'FS-100',
        manufacturer: 'Veit', productionLineId: line2._id,
        specifications: { capacity: '300 units/day', speed: '40 units/hr', powerConsumption: '1.2 kW', dimensions: '150x80x140 cm' },
        status: 'in_use', operationalMetrics: { totalHours: 960, currentHour: 6, efficiency: 96, defectsProduced: 8 },
        sensors: { temperature: 45, vibration: 0.2, speed: 38, powerUsage: 1.1 },
      },
    ]);
    console.log('Machines created');

    await Inventory.create([
      {
        rawMaterialId: 'FAB-001', name: 'Cotton Fabric - Premium White', category: 'fabric',
        supplier: { name: 'Textile Supply Co.', contact: 'supplier@textile.com', leadTime: 7 },
        stockLevels: { current: 2500, minimum: 200, maximum: 5000, reorderPoint: 500 },
        unitOfMeasure: 'meters', costPerUnit: 5.50,
        location: { warehouse: 'Main', rack: 'A-01', shelf: '1' },
        quality: { grade: 'A', inspectionDate: new Date(), inspectionResults: 'Passed' },
      },
      {
        rawMaterialId: 'THR-001', name: 'Polyester Thread - Black', category: 'thread',
        supplier: { name: 'Thread Masters Inc.', contact: 'orders@threadmasters.com', leadTime: 3 },
        stockLevels: { current: 500, minimum: 50, maximum: 1000, reorderPoint: 100 },
        unitOfMeasure: 'spools', costPerUnit: 2.25,
        location: { warehouse: 'Main', rack: 'B-03', shelf: '2' },
        quality: { grade: 'A', inspectionDate: new Date(), inspectionResults: 'Passed' },
      },
      {
        rawMaterialId: 'ZIP-001', name: 'Nylon Zipper - 20cm Black', category: 'zipper',
        supplier: { name: 'Zipper World', contact: 'info@zipperworld.com', leadTime: 5 },
        stockLevels: { current: 150, minimum: 30, maximum: 500, reorderPoint: 60 },
        unitOfMeasure: 'pieces', costPerUnit: 0.85,
        location: { warehouse: 'Main', rack: 'C-01', shelf: '1' },
        quality: { grade: 'B', inspectionDate: new Date(), inspectionResults: 'Passed' },
      },
      {
        rawMaterialId: 'BTN-001', name: 'Plastic Button - White 18mm', category: 'button',
        supplier: { name: 'Button Depot', contact: 'sales@buttondepot.com', leadTime: 4 },
        stockLevels: { current: 3000, minimum: 500, maximum: 10000, reorderPoint: 1000 },
        unitOfMeasure: 'pieces', costPerUnit: 0.12,
        location: { warehouse: 'Main', rack: 'D-02', shelf: '3' },
        quality: { grade: 'A', inspectionDate: new Date(), inspectionResults: 'Passed' },
      },
      {
        rawMaterialId: 'LBL-001', name: 'Woven Care Label - Standard', category: 'label',
        supplier: { name: 'Label Pros', contact: 'info@labelpros.com', leadTime: 10 },
        stockLevels: { current: 75, minimum: 20, maximum: 200, reorderPoint: 40 },
        unitOfMeasure: 'rolls', costPerUnit: 8.00,
        location: { warehouse: 'Main', rack: 'E-01', shelf: '1' },
        quality: { grade: 'A', inspectionDate: new Date(), inspectionResults: 'Passed' },
      },
    ]);
    console.log('Inventory items created');

    console.log('\nSeed completed successfully!');
    console.log('--- Login Credentials ---');
    console.log('Admin:    admin@garment.com / admin123');
    console.log('Manager:  manager@garment.com / manager123');
    console.log('Employee: employee@garment.com / employee123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
