const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  campaignId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
  scheduledDate: { type: Date, required: true },
  status:        { type: String, enum: ['pending','confirmed','completed','cancelled'], default: 'pending' },
  bloodType:     { type: String, default: '' },
  notes:         { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
