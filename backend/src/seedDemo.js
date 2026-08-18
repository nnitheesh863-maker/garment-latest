require('dotenv').config();
const mongoose = require('mongoose');

async function seedDemo() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/garment_production');
    console.log('Connected to MongoDB');

    const User = require('./models/User');
    const ProductionLine = require('./models/ProductionLine');
    const Machine = require('./models/Machine');
    const Inventory = require('./models/Inventory');
    const Order = require('./models/Order');
    const Task = require('./models/Task');
    const Quality = require('./models/Quality');
    const Attendance = require('./models/Attendance');

    const existingOrders = await Order.countDocuments();
    if (existingOrders > 0) {
      console.log(`Demo data already present (${existingOrders} orders). Wipe the database and re-run to regenerate.`);
      await mongoose.disconnect();
      return;
    }

    const admin = await User.findOne({ email: 'admin@garment.com' });
    const manager = await User.findOne({ email: 'manager@garment.com' });
    const employee = await User.findOne({ email: 'employee@garment.com' });
    const lines = await ProductionLine.find({ active: true });
    const machines = await Machine.find({ isDeleted: false });
    const [lineA, lineB] = lines;

    if (!admin || !manager || !employee || !lineA || !lineB) {
      console.error('Seed base data first (npm run seed) before running the demo seed.');
      process.exit(1);
    }

    const now = new Date();
    const day = (offset) => {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      return d;
    };
    const isoDay = (offset) => day(offset).toISOString().split('T')[0];

    const orderDefs = [
      { num: 'ORD-2026-001', cust: 'Nova Apparel', garment: 'shirt', qty: 1200, status: 'delivered', priority: 'high', req: day(-20), line: lineA, manager, created: day(-32) },
      { num: 'ORD-2026-002', cust: 'Urban Threads', garment: 't-shirt', qty: 2500, status: 'completed', priority: 'medium', req: day(-12), line: lineB, manager, created: day(-26) },
      { num: 'ORD-2026-003', cust: 'Bella Couture', garment: 'pant', qty: 800, status: 'quality_check', priority: 'high', req: day(3), line: lineA, manager, created: day(-15) },
      { num: 'ORD-2026-004', cust: 'Metro Styles', garment: 'shirt', qty: 1800, status: 'in_production', priority: 'medium', req: day(9), line: lineB, manager, created: day(-9) },
      { num: 'ORD-2026-005', cust: 'Zenith Wear', garment: 't-shirt', qty: 5000, status: 'in_production', priority: 'urgent', req: day(6), line: lineA, manager, created: day(-4) },
      { num: 'ORD-2026-006', cust: 'Luna Fashions', garment: 'pant', qty: 640, status: 'approved', priority: 'low', req: day(20), manager, created: day(-2) },
      { num: 'ORD-2026-007', cust: 'Cobalt Collective', garment: 'shirt', qty: 950, status: 'pending', priority: 'medium', req: day(24), created: day(-1) },
      { num: 'ORD-2026-008', cust: 'Everest Outfitters', garment: 't-shirt', qty: 1500, status: 'pending', priority: 'high', req: day(16), created: day(0) },
    ];

    const orders = [];
    for (const o of orderDefs) {
      const order = await Order.create({
        orderNumber: o.num,
        customer: { name: o.cust, email: `${o.cust.replace(/\s+/g, '').toLowerCase()}@example.com`, phone: '+1-555-0199', address: { city: 'New York', country: 'US' } },
        orderDetails: { garmentType: o.garment, description: `Bulk order of ${o.garment}s`, quantity: o.qty, sizes: ['S', 'M', 'L', 'XL'], colors: ['Navy', 'White', 'Black'], specifications: { material: 'Cotton', qualityGrade: 'A' } },
        requiredDate: o.req,
        status: o.status,
        priority: o.priority,
        assignedLine: o.line ? o.line._id : undefined,
        assignedManager: o.manager ? o.manager._id : undefined,
        createdAt: o.created,
        updatedAt: o.created,
        productionPlan: o.line ? { startDate: day(-8), endDate: o.req, dailyTarget: Math.ceil(o.qty / 12), totalDays: 12 } : undefined,
      });
      orders.push({ order, def: o });
      if (o.line) {
        await ProductionLine.updateOne({ _id: o.line._id }, { $addToSet: { assignedOrders: order._id } });
      }
    }

    const taskDefs = [
      { title: 'Cut & stitch batch 1', order: orders[0], status: 'completed', target: 1200, produced: 1185, rejected: 9, scrap: 6, grade: 'A', started: -24, done: -21 },
      { title: 'Cut & stitch batch 2', order: orders[1], status: 'completed', target: 2500, produced: 2470, rejected: 18, scrap: 12, grade: 'B', started: -18, done: -13 },
      { title: 'Finishing — Bella Couture pants', order: orders[2], status: 'in_progress', target: 800, produced: 540, rejected: 5, scrap: 3, grade: 'A', started: -4 },
      { title: 'Sew shirts — Metro Styles', order: orders[3], status: 'in_progress', target: 1800, produced: 1020, rejected: 12, scrap: 4, grade: 'A', started: -6 },
      { title: 'High-volume tee run — Zenith', order: orders[4], status: 'in_progress', target: 5000, produced: 2100, rejected: 31, scrap: 9, grade: 'B', started: -3 },
      { title: 'Quality check — Bella Couture', order: orders[2], status: 'accepted', target: 800, produced: 0, grade: null, started: 0 },
      { title: 'Packing — Nova Apparel', order: orders[0], status: 'delayed', target: 1200, produced: 600, rejected: 0, scrap: 0, grade: null, started: -2 },
    ];

    for (const t of taskDefs) {
      const completedAt = t.done !== undefined ? day(t.done) : undefined;
      await Task.create({
        taskNumber: `TSK-2026-${String(Math.floor(100 + Math.random() * 800))}`,
        title: t.title,
        orderId: t.order.order._id,
        productionLineId: t.order.def.line ? t.order.def.line._id : lineA._id,
        assignedTo: employee._id,
        assignedBy: manager._id,
        machineId: machines[Math.floor(Math.random() * machines.length)]._id,
        quantity: { target: t.target, produced: t.produced, rejected: t.rejected, scrap: t.scrap },
        status: t.status,
        qualityGrade: t.grade || undefined,
        priority: t.order.def.priority,
        timeline: {
          assignedAt: day(t.started - 1),
          acceptedAt: day(t.started),
          startedAt: day(t.started),
          completedAt,
          dueDate: t.order.def.req,
        },
        createdAt: day(t.started),
        updatedAt: completedAt || day(0),
      });
    }

    for (let i = 13; i >= 0; i--) {
      const present = i % 4 !== 2;
      const status = present ? (i % 5 === 3 ? 'late' : 'present') : 'absent';
      await Attendance.create({
        employee: employee._id,
        date: new Date(isoDay(-i)),
        status,
        shift: 'general',
        timezone: 'IST',
        clockIn: day(-i).setHours(9, 5, 0, 0),
        clockOut: day(-i).setHours(18, 0, 0, 0),
        clockInTime: '09:05 AM',
        clockOutTime: '06:00 PM',
        workingHours: present ? 8.1 : 0,
        breakTime: 0.8,
        overtime: present ? 0.1 : 0,
        lateArrival: status === 'late' ? 5 : 0,
      });
    }
    await Attendance.create({
      employee: manager._id,
      date: new Date(isoDay(0)),
      status: 'present',
      clockIn: day(0).setHours(8, 45, 0, 0),
      clockOut: day(0).setHours(18, 30, 0, 0),
      clockInTime: '08:45 AM',
      clockOutTime: '06:30 PM',
      workingHours: 9,
      breakTime: 0.8,
      overtime: 0.5,
    });
    console.log('Attendance seeded for the last 14 days');

    const qualityDefs = [
      { order: orders[2], type: 'final', inspected: 540, passed: 532, failed: 8, grade: 'A', defects: [{ type: 'stitch', quantity: 5, severity: 'minor' }, { type: 'finish', quantity: 3, severity: 'major' }] },
      { order: orders[3], type: 'in-process', inspected: 1020, passed: 1008, failed: 12, grade: 'A', defects: [{ type: 'alignment', quantity: 8, severity: 'minor' }, { type: 'fabric', quantity: 4, severity: 'major' }] },
      { order: orders[4], type: 'in-process', inspected: 2100, passed: 2069, failed: 31, grade: 'B', defects: [{ type: 'stitch', quantity: 18, severity: 'minor' }, { type: 'size', quantity: 13, severity: 'major' }] },
      { order: orders[0], type: 'final', inspected: 1185, passed: 1176, failed: 9, grade: 'A', defects: [{ type: 'packaging', quantity: 9, severity: 'minor' }] },
      { order: orders[1], type: 'final', inspected: 2470, passed: 2452, failed: 18, grade: 'B', defects: [{ type: 'stitch', quantity: 12, severity: 'minor' }, { type: 'trimming', quantity: 6, severity: 'minor' }] },
    ];

    for (const q of qualityDefs) {
      const rate = q.inspected > 0 ? (q.failed / q.inspected) * 100 : 0;
      await Quality.create({
        inspectionNumber: `QC-2026-${String(Math.floor(100 + Math.random() * 800))}`,
        orderId: q.order.order._id,
        taskId: null,
        inspector: manager._id,
        inspectionType: q.type,
        results: { passed: q.passed, failedItems: q.failed, totalInspected: q.inspected, defectRate: Math.round(rate * 100) / 100 },
        defects: q.defects,
        grade: q.grade,
        notes: 'Standard inspection performed',
        createdAt: day(-1),
      });
    }
    console.log('Quality inspections seeded');

    const producedByLine = { [String(lineA._id)]: 0, [String(lineB._id)]: 0 };
    taskDefs.forEach((t) => {
      const key = String(t.order.def.line ? t.order.def.line._id : lineA._id);
      producedByLine[key] = (producedByLine[key] || 0) + t.produced;
    });
    for (const line of lines) {
      const produced = producedByLine[String(line._id)] || 0;
      const defects = 12;
      await ProductionLine.updateOne(
        { _id: line._id },
        {
          $inc: { 'metrics.totalProduced': produced, 'metrics.totalDefects': defects },
        },
      );
    }
    console.log('Production line metrics updated');

    const lowStockCandidates = await Inventory.find({}).sort({ createdAt: 1 }).limit(2);
    for (const item of lowStockCandidates) {
      await Inventory.updateOne({ _id: item._id }, { $set: { 'stockLevels.current': Math.max(5, Math.round(item.stockLevels.reorderPoint * 0.6)) } });
    }
    console.log('Inventory lowered for 2 items to demonstrate low-stock alerts');

    console.log('\nDemo seed completed! Refresh the Admin Dashboard to see live production data.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Demo seed failed:', err);
    process.exit(1);
  }
}

seedDemo();
