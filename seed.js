require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User        = require('./models/User');
const Campaign    = require('./models/Campaign');
const Appointment = require('./models/Appointment');
const Ticket      = require('./models/Ticket');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conectado a MongoDB — limpiando colecciones...');

  await Promise.all([
    User.deleteMany({}),
    Campaign.deleteMany({}),
    Appointment.deleteMany({}),
    Ticket.deleteMany({})
  ]);

  // ── Usuarios ──────────────────────────────────────────────────────────────
  const [admin, agent, user1] = await User.create([
    { name: 'Administrador',  email: 'admin@demo.com',  password: 'admin123',  role: 'ADMIN' },
    { name: 'Agente Soporte', email: 'agent@demo.com',  password: 'agent123',  role: 'AGENT' },
    { name: 'Juan Donante',   email: 'user@demo.com',   password: 'user123',   role: 'USER'  }
  ]);
  console.log('Usuarios creados');

  // ── Campañas ──────────────────────────────────────────────────────────────
  const [camp1, camp2] = await Campaign.create([
    {
      title:        'Campaña Primavera 2025',
      description:  'Campaña especial para donantes tipo O+',
      bloodType:    'O+',
      location:     'Hospital Central, Sala 3',
      startDate:    new Date('2025-03-01'),
      endDate:      new Date('2025-03-31'),
      status:       'active',
      targetDonors: 100,
      createdBy:    admin._id
    },
    {
      title:        'Campaña Universal',
      description:  'Aceptamos todos los tipos de sangre',
      bloodType:    'ALL',
      location:     'Clínica Norte, Pabellón B',
      startDate:    new Date('2025-04-01'),
      endDate:      new Date('2025-04-30'),
      status:       'active',
      targetDonors: 200,
      createdBy:    admin._id
    }
  ]);
  console.log('Campañas creadas');

  // ── Citas ─────────────────────────────────────────────────────────────────
  const [appt1, appt2] = await Appointment.create([
    {
      userId:        user1._id,
      campaignId:    camp1._id,
      scheduledDate: new Date('2025-03-15T10:00:00'),
      status:        'confirmed',
      bloodType:     'O+',
      notes:         'Primera donación'
    },
    {
      userId:        user1._id,
      campaignId:    camp2._id,
      scheduledDate: new Date('2025-04-10T14:30:00'),
      status:        'pending',
      bloodType:     'O+',
      notes:         'Segunda donación programada'
    }
  ]);
  console.log('Citas creadas');

  // ── Tickets ───────────────────────────────────────────────────────────────
  await Ticket.create([
    {
      title:                'No puedo confirmar mi cita',
      description:          'Intenté confirmar mi cita del 15 de marzo pero el sistema me da error.',
      status:               'open',
      category:             'appointment',
      priority:             'high',
      createdBy:            user1._id,
      relatedAppointmentId: appt1._id,
      messages: [
        { sender: user1._id,  content: 'El botón de confirmar no responde.' },
        { sender: agent._id,  content: 'Revisaremos el problema a la brevedad.' }
      ],
      history: [
        { changedBy: user1._id,  field: 'status', oldValue: null,   newValue: 'open' },
        { changedBy: agent._id,  field: 'status', oldValue: 'open', newValue: 'open' }
      ]
    },
    {
      title:       'Error en la aplicación',
      description: 'La página de campañas no carga correctamente en móvil.',
      status:      'in_progress',
      category:    'technical',
      priority:    'medium',
      createdBy:   user1._id,
      assignedTo:  agent._id,
      messages: [
        { sender: user1._id,  content: 'Solo me pasa en Chrome móvil.' }
      ],
      history: [
        { changedBy: user1._id,  field: 'status', oldValue: null,         newValue: 'open' },
        { changedBy: agent._id,  field: 'status', oldValue: 'open',       newValue: 'in_progress' }
      ]
    }
  ]);
  console.log('Tickets creados');

  console.log('\n✅  Seed completado. Credenciales de prueba:');
  console.log('   ADMIN → admin@demo.com  / admin123');
  console.log('   AGENT → agent@demo.com  / agent123');
  console.log('   USER  → user@demo.com   / user123\n');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
