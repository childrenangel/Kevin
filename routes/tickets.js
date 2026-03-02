const router      = require('express').Router();
const Ticket      = require('../models/Ticket');
const Appointment = require('../models/Appointment');
const auth        = require('../middleware/auth');
const roles       = require('../middleware/roles');

// GET /api/tickets
// ADMIN/AGENT ven todos; USER solo los suyos
router.get('/', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'USER' ? { createdBy: req.user.id } : {};
    const tickets = await Ticket.find(filter)
      .populate('createdBy',  'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tickets/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy',         'name email role')
      .populate('assignedTo',        'name email')
      .populate('messages.sender',   'name email');

    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    if (req.user.role === 'USER' && ticket.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tickets  — cualquier usuario autenticado
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, priority, relatedAppointmentId } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Título y descripción son requeridos' });
    }

    const ticket = await Ticket.create({
      title,
      description,
      category:             category || 'general',
      priority:             priority || 'medium',
      relatedAppointmentId: relatedAppointmentId || null,
      createdBy:            req.user.id,
      history: [{
        changedBy: req.user.id,
        field:     'status',
        oldValue:  null,
        newValue:  'open'
      }]
    });

    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/tickets/:id/status  — solo ADMIN o AGENT
router.patch('/:id/status', auth, roles('ADMIN', 'AGENT'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    const oldStatus = ticket.status;
    ticket.history.push({
      changedBy: req.user.id,
      field:     'status',
      oldValue:  oldStatus,
      newValue:  status
    });
    ticket.status = status;
    await ticket.save();

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tickets/:id/messages  — agrega mensaje al ticket
router.post('/:id/messages', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'El mensaje no puede estar vacío' });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    // USER solo puede comentar en sus propios tickets
    if (req.user.role === 'USER' && ticket.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    ticket.messages.push({ sender: req.user.id, content });
    await ticket.save();

    await ticket.populate('messages.sender', 'name email');
    res.status(201).json(ticket.messages[ticket.messages.length - 1]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tickets/:id
// USER solo puede eliminar los suyos; ADMIN y AGENT pueden eliminar cualquiera
router.delete('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    if (req.user.role === 'USER' && ticket.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    await ticket.deleteOne();
    res.json({ message: 'Ticket eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tickets/:id/related  — endpoint híbrido
// Consulta ticket en MongoDB y su cita relacionada (también MongoDB).
// Devuelve información combinada con metadatos de la fuente.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/related', auth, async (req, res) => {
  try {
    // Consulta 1: ticket en MongoDB
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy',  'name email role')
      .populate('assignedTo', 'name email');

    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    if (req.user.role === 'USER' && ticket.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    // Consulta 2: cita relacionada en MongoDB (simula JOIN con SQL)
    let relatedAppointment = null;
    if (ticket.relatedAppointmentId) {
      relatedAppointment = await Appointment.findById(ticket.relatedAppointmentId)
        .populate('userId',     'name email')
        .populate('campaignId', 'title location bloodType');
    }

    res.json({
      ticket,
      relatedAppointment,
      meta: {
        ticketSource:      'MongoDB – colección tickets',
        appointmentSource: relatedAppointment
          ? 'MongoDB – colección appointments'
          : 'No hay cita relacionada',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
