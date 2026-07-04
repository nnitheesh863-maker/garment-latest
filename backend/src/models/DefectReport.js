const mongoose = require('mongoose');

const defectReportSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  garmentType: { type: String, required: true, enum: ['shirt', 't-shirt', 'pant', 'other'] },
  description: { type: String, required: true },
  photo: { type: String, default: '' },
  status: { type: String, enum: ['open', 'reviewed', 'resolved'], default: 'open' },
}, { timestamps: true });

module.exports = mongoose.model('DefectReport', defectReportSchema);
