const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['sick', 'casual', 'vacation', 'personal', 'other'],
    default: 'other',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  rejectionReason: {
    type: String,
  },
}, { timestamps: true });

leaveSchema.index({ employee: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ startDate: 1 });

module.exports = mongoose.model('Leave', leaveSchema);
