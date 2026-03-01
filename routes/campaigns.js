const router   = require('express').Router();
const Campaign = require('../models/Campaign');
const auth     = require('../middleware/auth');
const roles    = require('../middleware/roles');

// GET /api/campaigns  — todos los usuarios autenticados
router.get('/', auth, async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/campaigns/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('createdBy', 'name email');
    if (!campaign) return res.status(404).json({ message: 'Campaña no encontrada' });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/campaigns  — solo ADMIN
router.post('/', auth, roles('ADMIN'), async (req, res) => {
  try {
    const { title, description, bloodType, location, startDate, endDate, targetDonors } = req.body;
    if (!title || !startDate || !endDate) {
      return res.status(400).json({ message: 'Título, fechas de inicio y fin son requeridos' });
    }
    const campaign = await Campaign.create({
      title, description, bloodType, location, startDate, endDate, targetDonors,
      createdBy: req.user.id
    });
    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/campaigns/:id  — solo ADMIN
router.patch('/:id', auth, roles('ADMIN'), async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!campaign) return res.status(404).json({ message: 'Campaña no encontrada' });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
