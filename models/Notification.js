const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message:   { type: String, required: true },
  type:      { type: String, enum: ['info','warning','success','error'], default: 'info' },
  read:      { type: Boolean, default: false },
  relatedTo: {
    model: { type: String, default: null },
    id:    { type: mongoose.Schema.Types.ObjectId, default: null }
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
