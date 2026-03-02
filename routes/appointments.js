const router      = require('express').Router();
const Appointment = require('../models/Appointment');
const auth        = require('../middleware/auth');
const roles       = require('../middleware/roles');

// GET /api/appointments
// ADMIN y AGENT ven todas; USER solo las suyas
router.get('/', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'USER' ? { userId: req.user.id } : {};
    const appointments = await Appointment.find(filter)
      .populate('userId',     'name email')
      .populate('campaignId', 'title bloodType')
      .sort({ scheduledDate: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/appointments/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id)
      .populate('userId',     'name email')
      .populate('campaignId', 'title');
    if (!appt) return res.status(404).json({ message: 'Cita no encontrada' });

    if (req.user.role === 'USER' && appt.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    res.json(appt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/appointments  — cualquier usuario autenticado
router.post('/', auth, async (req, res) => {
  try {
    const { campaignId, scheduledDate, bloodType, notes } = req.body;
    if (!scheduledDate) {
      return res.status(400).json({ message: 'La fecha de la cita es requerida' });
    }
    const appt = await Appointment.create({
      userId: req.user.id,
      campaignId: campaignId || null,
      scheduledDate,
      bloodType,
      notes
    });
    res.status(201).json(appt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/appointments/:id
// USER solo puede eliminar las suyas; ADMIN y AGENT pueden eliminar cualquiera
router.delete('/:id', auth, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ message: 'Cita no encontrada' });

    if (req.user.role === 'USER' && appt.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    await appt.deleteOne();
    res.json({ message: 'Cita eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/appointments/:id/status  — ADMIN o AGENT
router.patch('/:id/status', auth, roles('ADMIN', 'AGENT'), async (req, res) => {
  try {
    const { status } = req.body;
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!appt) return res.status(404).json({ message: 'Cita no encontrada' });
    res.json(appt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
