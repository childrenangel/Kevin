const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  ref:       { type: String, default: '' },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message:   { type: String, required: true },
  type:      { type: String, enum: ['info','warning','success','error'], default: 'info' },
  read:      { type: Boolean, default: false },
  channel:   { type: String, enum: ['EMAIL','SMS','PUSH'], default: 'EMAIL' },
  notifStatus: { type: String, enum: ['SENT','PENDING','FAILED'], default: 'PENDING' },
  sentAt:    { type: Date, default: null },
  relatedTo: {
    model: { type: String, default: null },
    id:    { type: mongoose.Schema.Types.ObjectId, default: null }
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
