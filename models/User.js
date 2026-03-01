const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:         { type: String, required: true },
  role:             { type: String, enum: ['ADMIN', 'AGENT', 'USER'], default: 'USER' },
  active:           { type: Boolean, default: true },
  phone:            { type: String, default: '' },
  city:             { type: String, default: '' },
  status:           { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  bloodType:        { type: String, default: '' },
  donorLevel:       { type: String, enum: ['BRONZE', 'SILVER', 'GOLD'] },
  lastDonationDate: { type: Date, default: null },
  preferredChannel: { type: String, enum: ['EMAIL', 'SMS', 'PUSH'], default: 'EMAIL' }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
