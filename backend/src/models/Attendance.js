const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    clockIn: { type: Date },
    clockOut: { type: Date },
    clockInTime: { type: String },
    clockOutTime: { type: String },
    shift: { type: String, default: 'general' },
    timezone: { type: String, default: 'IST' },
    deviceTime: { type: String },
    breakTime: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },
    lateArrival: { type: Number, default: 0 },
    earlyLeaving: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half-day', 'working'],
      default: 'present',
    },
    notes: { type: String },
    workingHours: { type: Number, default: 0 },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ clockIn: 1 });
attendanceSchema.index({ status: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
