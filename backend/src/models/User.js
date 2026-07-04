const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'employee'],
    default: 'employee',
  },
  profile: {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    employeeId: { type: String, trim: true },
    department: { type: String, trim: true },
    position: { type: String, trim: true },
    joiningDate: { type: Date },
    contactNumber: { type: String, trim: true },
    profileImage: { type: String },
  },
  assignedLine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionLine',
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  refreshToken: { type: String, select: false },
  lastLogin: { type: Date },
  active: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.__v;
  return obj;
};

userSchema.index({ 'profile.employeeId': 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
