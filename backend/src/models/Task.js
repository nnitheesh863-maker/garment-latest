const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskNumber: {
    type: String,
    unique: true,
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  productionLineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionLine',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
  },
  quantity: {
    target: { type: Number, required: true, min: 1 },
    produced: { type: Number, default: 0, min: 0 },
    rejected: { type: Number, default: 0, min: 0 },
    scrap: { type: Number, default: 0, min: 0 },
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'paused', 'completed', 'delayed', 'quality_check', 'rework'],
    default: 'pending',
  },
  qualityGrade: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
  },
  timeline: {
    assignedAt: Date,
    acceptedAt: Date,
    startedAt: Date,
    pausedAt: Date,
    completedAt: Date,
    dueDate: Date,
  },
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  }],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

taskSchema.index({ taskNumber: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ orderId: 1 });
taskSchema.index({ productionLineId: 1 });

module.exports = mongoose.model('Task', taskSchema);
