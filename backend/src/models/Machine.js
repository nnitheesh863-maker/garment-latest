const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  machineNumber: {
    type: String,
    unique: true,
    required: true,
  },
  name: { type: String, required: true },
  type: { type: String, required: true },
  model: { type: String },
  manufacturer: { type: String },
  productionLineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionLine',
  },
  specifications: {
    capacity: { type: Number },
    speed: { type: String },
    powerConsumption: { type: String },
    dimensions: { type: String },
  },
  status: {
    type: String,
    enum: ['available', 'in_use', 'maintenance', 'repair', 'retired'],
    default: 'available',
  },
  maintenanceSchedule: {
    lastServiceDate: { type: Date },
    nextServiceDate: { type: Date },
    serviceInterval: { type: Number },
    serviceHistory: [{
      serviceDate: { type: Date },
      serviceType: { type: String },
      description: { type: String },
      cost: { type: Number },
      technician: { type: String },
      nextServiceDate: { type: Date },
    }],
  },
  operationalMetrics: {
    totalHours: { type: Number, default: 0 },
    currentHour: { type: Number, default: 0 },
    efficiency: { type: Number, default: 0 },
    defectsProduced: { type: Number, default: 0 },
  },
  sensors: {
    temperature: { type: Number },
    vibration: { type: Number },
    speed: { type: Number },
    powerUsage: { type: Number },
  },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

machineSchema.index({ machineNumber: 1 });
machineSchema.index({ status: 1 });
machineSchema.index({ productionLineId: 1 });

module.exports = mongoose.model('Machine', machineSchema);
