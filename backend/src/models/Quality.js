const mongoose = require('mongoose');

const qualitySchema = new mongoose.Schema({
  inspectionNumber: {
    type: String,
    unique: true,
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  },
  inspector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  inspectionType: {
    type: String,
    enum: ['incoming', 'in-process', 'final'],
    required: true,
  },
  results: {
    passed: { type: Number, default: 0 },
    failedItems: { type: Number, default: 0 },
    totalInspected: { type: Number, required: true },
    defectRate: { type: Number, default: 0 },
  },
  defects: [{
    type: { type: String },
    quantity: { type: Number },
    severity: { type: String, enum: ['minor', 'major', 'critical'] },
    notes: { type: String },
  }],
  grade: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
  },
  notes: { type: String },
  attachments: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

qualitySchema.index({ inspectionNumber: 1 });
qualitySchema.index({ orderId: 1 });
qualitySchema.index({ inspector: 1 });
qualitySchema.index({ inspectionType: 1 });

module.exports = mongoose.model('Quality', qualitySchema);
