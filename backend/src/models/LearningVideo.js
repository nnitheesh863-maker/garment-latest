const mongoose = require('mongoose');

const learningVideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  description: { type: String, default: '' },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignToAll: { type: Boolean, default: false },
}, { timestamps: true });

learningVideoSchema.index({ assignedTo: 1 });
learningVideoSchema.index({ assignToAll: 1 });
learningVideoSchema.index({ createdAt: -1 });

module.exports = mongoose.model('LearningVideo', learningVideoSchema);
