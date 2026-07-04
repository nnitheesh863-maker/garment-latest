const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
  },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
  },
  orderDetails: {
    garmentType: { type: String, required: true },
    description: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    sizes: [{ type: String }],
    colors: [{ type: String }],
    specifications: {
      material: String,
      weight: String,
      qualityGrade: { type: String, enum: ['A', 'B', 'C', 'D'] },
    },
  },
  requiredDate: { type: Date, required: true },
  plannedDate: { type: Date },
  status: {
    type: String,
    enum: ['pending', 'approved', 'in_production', 'quality_check', 'completed', 'delivered'],
    default: 'pending',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  assignedLine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionLine',
  },
  assignedManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  productionPlan: {
    startDate: Date,
    endDate: Date,
    dailyTarget: Number,
    totalDays: Number,
  },
  documents: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  qualityChecks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quality',
  }],
  aiInsights: {
    riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
    predictedDelay: { type: Number },
    recommendations: [{ type: String }],
  },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
}, { timestamps: true });

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ priority: 1 });
orderSchema.index({ 'customer.name': 'text' });
orderSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Order', orderSchema);
