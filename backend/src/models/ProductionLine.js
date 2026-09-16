const mongoose = require('mongoose');

const productionLineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Line name is required'],
    unique: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: { type: String },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active',
  },
  capacity: {
    daily: { type: Number, default: 0 },
    hourly: { type: Number, default: 0 },
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  location: {
    floor: String,
    section: String,
  },
  assignedOrders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  }],
  metrics: {
    totalProduced: { type: Number, default: 0 },
    totalDefects: { type: Number, default: 0 },
    efficiency: { type: Number, default: 0 },
    utilization: { type: Number, default: 0 },
    oee: { type: Number, default: 0 },
  },
  active: { type: Boolean, default: true },
}, { timestamps: true });

productionLineSchema.index({ code: 1 });
productionLineSchema.index({ status: 1 });
productionLineSchema.index({ supervisor: 1 });

module.exports = mongoose.model('ProductionLine', productionLineSchema);
