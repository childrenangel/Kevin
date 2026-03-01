require('dotenv').config();
const mongoose = require('mongoose');

const User         = require('./models/User');
const Campaign     = require('./models/Campaign');
const Appointment  = require('./models/Appointment');
const Ticket       = require('./models/Ticket');
const Notification = require('./models/Notification');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conectado a MongoDB — limpiando colecciones...');

  await Promise.all([
    User.deleteMany({}),
    Campaign.deleteMany({}),
    Appointment.deleteMany({}),
    Ticket.deleteMany({}),
    Notification.deleteMany({})
  ]);

  // ── Usuarios de sistema (admin / agente) ──────────────────────────────────
  const [admin, agent] = await User.create([
    { name: 'Administrador', email: 'admin@demo.com', password: 'admin123', role: 'ADMIN' },
    { name: 'Support Lina',  email: 'agent@demo.com', password: 'agent123', role: 'AGENT' }
  ]);

  // ── Usuarios donantes (filas 1–3) ─────────────────────────────────────────
  const [user1, user2, user3] = await User.create([
    {
      name:             'Maria Bernal',
      email:            'user174@mail.com',
      password:         'password123',
      role:             'USER',
      active:           false,
      phone:            '3859696915',
      city:             'Envigado',
      status:           'INACTIVE',
      bloodType:        'A+',
      donorLevel:       'GOLD',
      lastDonationDate: new Date('2026-02-28'),
      preferredChannel: 'EMAIL'
    },
    {
      name:             'Sofia Bernal',
      email:            'user048@mail.com',
      password:         'password123',
      role:             'USER',
      active:           true,
      phone:            '3109477752',
      city:             'Medellin',
      status:           'ACTIVE',
      bloodType:        'AB-',
      donorLevel:       'BRONZE',
      lastDonationDate: new Date('2025-09-17'),
      preferredChannel: 'EMAIL'
    },
    {
      name:             'Maria Ramirez',
      email:            'user134@mail.com',
      password:         'password123',
      role:             'USER',
      active:           true,
      phone:            '3152742054',
      city:             'Itagui',
      status:           'ACTIVE',
      bloodType:        'A+',
      donorLevel:       'GOLD',
      lastDonationDate: new Date('2026-02-11'),
      preferredChannel: 'EMAIL'
    }
  ]);
  console.log('Usuarios creados');

  // ── Campañas ──────────────────────────────────────────────────────────────
  const [camp1, camp2, camp3] = await Campaign.create([
    {
      title:        'Jornada Salvadores de Vida',
      description:  'Jornada de donación de sangre en Bogota',
      bloodType:    'ALL',
      location:     'Bogota',
      startDate:    new Date('2026-02-01'),
      endDate:      new Date('2026-03-15'),
      status:       'active',
      targetDonors: 100,
      createdBy:    admin._id
    },
    {
      title:        'Jornada Salvadores de Vida',
      description:  'Jornada de donación de sangre en Sabaneta',
      bloodType:    'ALL',
      location:     'Sabaneta',
      startDate:    new Date('2026-02-01'),
      endDate:      new Date('2026-03-15'),
      status:       'active',
      targetDonors: 100,
      createdBy:    admin._id
    },
    {
      title:        'Donacion Consciente - Valle de Aburra',
      description:  'Campaña de donación consciente en el Valle de Aburrá',
      bloodType:    'ALL',
      location:     'Sabaneta',
      startDate:    new Date('2026-02-01'),
      endDate:      new Date('2026-03-15'),
      status:       'active',
      targetDonors: 150,
      createdBy:    admin._id
    }
  ]);
  console.log('Campañas creadas');

  // ── Tickets ───────────────────────────────────────────────────────────────
  // Fila 1 — TCK-000011: evento TICKET_STATUS_CHANGED (IN_PROGRESS → CLOSED) por SYSTEM
  // Fila 2 — TCK-000053: evento TICKET_MESSAGE por AGENT "Support Lina"
  // Fila 3 — TCK-000059: evento TICKET_STATUS_CHANGED (OPEN → IN_PROGRESS) por SYSTEM
  const [tck1, tck2, tck3] = await Ticket.create([
    {
      ticketId:    'TCK-000011',
      title:       'No me llegó el recordatorio',
      description: 'No me llegó el recordatorio',
      status:      'closed',
      category:    'account',
      priority:    'high',
      tags:        ['sms'],
      createdBy:   user1._id,
      assignedTo:  agent._id,
      messages:    [],
      history: [
        {
          changedBy: admin._id,
          field:     'status',
          oldValue:  'in_progress',
          newValue:  'closed',
          timestamp: new Date('2026-02-15T20:13:00')
        }
      ]
    },
    {
      ticketId:    'TCK-000053',
      title:       'Problema con verificación de correo',
      description: 'Problema con verificación de correo',
      status:      'open',
      category:    'appointments',
      priority:    'medium',
      tags:        ['email'],
      createdBy:   user2._id,
      assignedTo:  agent._id,
      messages: [
        {
          sender:    agent._id,
          content:   '¿Puedes confirmar tu número/correo?',
          timestamp: new Date('2026-02-12T15:01:00')
        }
      ],
      history: []
    },
    {
      ticketId:    'TCK-000059',
      title:       'Me aparece mi cuenta duplicada',
      description: 'Me aparece mi cuenta duplicada',
      status:      'in_progress',
      category:    'campaigns',
      priority:    'low',
      tags:        ['email'],
      createdBy:   user3._id,
      assignedTo:  agent._id,
      messages:    [],
      history: [
        {
          changedBy: admin._id,
          field:     'status',
          oldValue:  'open',
          newValue:  'in_progress',
          timestamp: new Date('2026-02-17T15:13:00')
        }
      ]
    }
  ]);
  console.log('Tickets creados');

  // ── Notificaciones ────────────────────────────────────────────────────────
  await Notification.create([
    {
      ref:         'NOTIF-000438',
      userId:      user1._id,
      message:     'Tu ticket #TCK-000011 ha sido cerrado.',
      type:        'success',
      read:        false,
      channel:     'EMAIL',
      notifStatus: 'SENT',
      sentAt:      new Date('2026-02-15T20:13:00'),
      relatedTo:   { model: 'Ticket', id: tck1._id }
    },
    {
      ref:         'NOTIF-000188',
      userId:      user2._id,
      message:     'Nuevo mensaje en tu ticket #TCK-000053.',
      type:        'info',
      read:        false,
      channel:     'EMAIL',
      notifStatus: 'SENT',
      sentAt:      new Date('2026-02-12T15:01:00'),
      relatedTo:   { model: 'Ticket', id: tck2._id }
    },
    {
      ref:         'NOTIF-000082',
      userId:      user3._id,
      message:     'Tu ticket #TCK-000059 está en progreso.',
      type:        'info',
      read:        false,
      channel:     'EMAIL',
      notifStatus: 'SENT',
      sentAt:      new Date('2026-02-17T15:13:00'),
      relatedTo:   { model: 'Ticket', id: tck3._id }
    }
  ]);
  console.log('Notificaciones creadas');

  console.log('\n✅  Seed completado. Credenciales de prueba:');
  console.log('   ADMIN → admin@demo.com   / admin123');
  console.log('   AGENT → agent@demo.com   / agent123');
  console.log('   USER1 → user174@mail.com / password123  (Maria Bernal — INACTIVE)');
  console.log('   USER2 → user048@mail.com / password123  (Sofia Bernal)');
  console.log('   USER3 → user134@mail.com / password123  (Maria Ramirez)\n');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
