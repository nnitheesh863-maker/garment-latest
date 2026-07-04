const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  rawMaterialId: {
    type: String,
    unique: true,
    required: true,
  },
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['fabric', 'thread', 'zipper', 'button', 'label', 'packaging'],
    required: true,
  },
  supplier: {
    name: { type: String },
    contact: { type: String },
    leadTime: { type: Number },
  },
  stockLevels: {
    current: { type: Number, required: true, default: 0, min: 0 },
    minimum: { type: Number, default: 0, min: 0 },
    maximum: { type: Number, default: 0, min: 0 },
    reorderPoint: { type: Number, default: 0, min: 0 },
  },
  unitOfMeasure: { type: String, required: true },
  costPerUnit: { type: Number, default: 0, min: 0 },
  location: {
    warehouse: { type: String },
    rack: { type: String },
    shelf: { type: String },
  },
  quality: {
    grade: { type: String, enum: ['A', 'B', 'C', 'D'] },
    inspectionDate: { type: Date },
    inspectionResults: { type: String },
  },
  consumptionHistory: [{
    quantity: { type: Number },
    date: { type: Date, default: Date.now },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    purpose: { type: String },
  }],
}, { timestamps: true });

inventorySchema.index({ category: 1 });
inventorySchema.index({ 'stockLevels.current': 1 });
inventorySchema.index({ 'stockLevels.reorderPoint': 1 });
inventorySchema.index({ rawMaterialId: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
