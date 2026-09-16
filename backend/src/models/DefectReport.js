const mongoose = require('mongoose');

const defectReportSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  garmentType: { type: String, required: true, enum: ['shirt', 't-shirt', 'pant', 'other'] },
  description: { type: String, required: true },
  severity: { type: String, enum: ['minor', 'major', 'critical'], default: 'minor' },
  photo: { type: String, default: '' },
  status: { type: String, enum: ['open', 'reviewed', 'resolved'], default: 'open' },
}, { timestamps: true });

defectReportSchema.index({ employee: 1, createdAt: -1 });
defectReportSchema.index({ status: 1 });
defectReportSchema.index({ garmentType: 1 });

module.exports = mongoose.model('DefectReport', defectReportSchema);
