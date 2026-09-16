const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  machine: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved'],
    default: 'open',
  },
  resolvedAt: {
    type: Date,
  },
  resolutionNotes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

issueSchema.index({ employee: 1, createdAt: -1 });
issueSchema.index({ status: 1 });
issueSchema.index({ priority: 1 });

module.exports = mongoose.model('Issue', issueSchema);
