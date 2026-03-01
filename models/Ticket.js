const mongoose = require('mongoose');

/*
  Justificación del modelo:
  - messages e history se EMBEBEN (embedding) porque son datos propios del ticket
    que no existen fuera de él, crecen de forma limitada y se consultan siempre juntos.
  - createdBy, assignedTo y relatedAppointmentId se REFERENCIAN porque son entidades
    independientes con ciclo de vida propio.
*/

const messageSchema = new mongoose.Schema({
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const historySchema = new mongoose.Schema({
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  field:     { type: String, required: true },
  oldValue:  { type: String, default: null },
  newValue:  { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ticketSchema = new mongoose.Schema({
  ticketId:             { type: String, unique: true, sparse: true },
  title:                { type: String, required: true, trim: true },
  description:          { type: String, required: true },
  status:               { type: String, enum: ['open','in_progress','resolved','closed'], default: 'open' },
  category:             { type: String, enum: ['technical','billing','general','appointment','account','appointments','campaigns'], default: 'general' },
  priority:             { type: String, enum: ['low','medium','high','urgent'], default: 'medium' },
  tags:                 [{ type: String }],
  createdBy:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  relatedAppointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
  messages:             [messageSchema],
  history:              [historySchema]
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
