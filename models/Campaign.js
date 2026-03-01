const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title:         { type: String, required: true, trim: true },
  description:   { type: String, default: '' },
  bloodType:     { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-','ALL'], default: 'ALL' },
  location:      { type: String, default: '' },
  startDate:     { type: Date, required: true },
  endDate:       { type: Date, required: true },
  status:        { type: String, enum: ['active','inactive','completed'], default: 'active' },
  targetDonors:  { type: Number, default: 0 },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
