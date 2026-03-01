# Sistema de Gestión de Donaciones de Sangre

Sistema full-stack construido con **Node.js + Express + MongoDB (Mongoose)** y frontend en HTML/CSS/Vanilla JS.

---

## Cómo correr el proyecto

### Requisitos previos
- Node.js >= 18
- MongoDB corriendo localmente (o URI de MongoDB Atlas)

### Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu MONGO_URI y JWT_SECRET

# 3. (Opcional) Poblar la base de datos con datos de prueba
npm run seed

# 4. Iniciar el servidor
npm start
# o en modo desarrollo con recarga automática:
npm run dev
```

Abrir en el navegador: http://localhost:3000

### Credenciales de prueba (después del seed)

| Rol   | Email             | Contraseña |
|-------|-------------------|------------|
| ADMIN | admin@demo.com    | admin123   |
| AGENT | agent@demo.com    | agent123   |
| USER  | user@demo.com     | user123    |

---

## Estructura del proyecto

```
├── server.js               # Entrada principal
├── config/db.js            # Conexión a MongoDB
├── models/
│   ├── User.js             # Usuarios con roles
│   ├── Campaign.js         # Campañas de donación
│   ├── Appointment.js      # Citas de donación
│   ├── Ticket.js           # Tickets de soporte (NoSQL embebido)
│   └── Notification.js     # Notificaciones
├── middleware/
│   ├── auth.js             # Verificación JWT
│   └── roles.js            # Control de acceso por rol
├── routes/
│   ├── auth.js             # POST /login, POST /register
│   ├── users.js            # GET /users, GET /users/me
│   ├── campaigns.js        # GET/POST /campaigns
│   ├── appointments.js     # GET/POST /appointments
│   └── tickets.js          # GET/POST/PATCH /tickets + /related
├── public/                 # Frontend estático
│   ├── index.html          # Login
│   ├── dashboard.html      # Dashboard (vistas por rol)
│   ├── ticket-detail.html  # Detalle de ticket
│   ├── css/style.css
│   └── js/
│       ├── api.js          # Fetch wrapper + utilidades
│       ├── auth.js         # Lógica de login
│       ├── dashboard.js    # Dashboard
│       └── ticket-detail.js
└── seed.js                 # Datos de prueba
```

---

## Decisiones técnicas

### ¿Por qué solo MongoDB?

El enunciado original contempla SQL para entidades como users/campaigns/appointments y MongoDB para tickets. En esta implementación se decidió usar **exclusivamente MongoDB** porque:

1. El sistema es un prototipo con relaciones poco complejas (1:N simples).
2. La flexibilidad de documentos permite modelar tickets con historial embebido sin joins.
3. Se simplifica el stack de infraestructura (un solo motor de BD).

Las relaciones entre colecciones se resuelven con **referencias (referencing)** via `ObjectId` y `populate()`.

---

## Separación de responsabilidades

| Colección      | Estrategia      | Justificación                                                        |
|----------------|-----------------|----------------------------------------------------------------------|
| `users`        | Referencing     | Entidad independiente, referenciada desde múltiples colecciones.     |
| `campaigns`    | Referencing     | Ciclo de vida propio, relacionada opcionalmente con citas.           |
| `appointments` | Referencing     | Entidad central; referenciada por tickets para el endpoint híbrido.  |
| `tickets`      | **Embedding**   | `messages` e `history` solo existen dentro del ticket → embedding.  |
| `notifications`| Referencing     | Pertenecen a un usuario, pero se crean independientemente.           |

---

## Roles y restricciones

| Acción                        | ADMIN | AGENT | USER  |
|-------------------------------|:-----:|:-----:|:-----:|
| Ver todos los usuarios        | ✅    | ❌    | ❌    |
| Crear campañas                | ✅    | ❌    | ❌    |
| Ver todas las citas           | ✅    | ✅    | ❌*   |
| Crear cita propia             | ✅    | ✅    | ✅    |
| Ver todos los tickets         | ✅    | ✅    | ❌*   |
| Crear ticket                  | ✅    | ✅    | ✅    |
| Cambiar estado de ticket      | ✅    | ✅    | ❌    |
| Acceder a endpoint `/related` | ✅    | ✅    | ✅*   |

\* USER solo accede a sus propios recursos.

La protección se implementa en middleware:
- `middleware/auth.js` → verifica el JWT en cada request.
- `middleware/roles.js` → restringe rutas a roles específicos.

---

## Endpoints principales

```
POST   /api/auth/login
POST   /api/auth/register

GET    /api/users                       (ADMIN)
GET    /api/users/me

GET    /api/campaigns
POST   /api/campaigns                   (ADMIN)

GET    /api/appointments
POST   /api/appointments
PATCH  /api/appointments/:id/status     (ADMIN, AGENT)

GET    /api/tickets
GET    /api/tickets/:id
POST   /api/tickets
PATCH  /api/tickets/:id/status          (ADMIN, AGENT)
POST   /api/tickets/:id/messages
GET    /api/tickets/:id/related         ← endpoint híbrido
```

### Endpoint híbrido `GET /tickets/:id/related`

Realiza **dos consultas independientes a MongoDB** (simula la separación SQL + NoSQL del enunciado):

1. Consulta el documento `ticket` con su creador y agente asignado.
2. Consulta la `appointment` referenciada (con datos del usuario y la campaña).

Devuelve un objeto combinado con metadatos de fuente:

```json
{
  "ticket": { ... },
  "relatedAppointment": { ... },
  "meta": {
    "ticketSource": "MongoDB – colección tickets",
    "appointmentSource": "MongoDB – colección appointments",
    "generatedAt": "2025-03-01T12:00:00.000Z"
  }
}
```

---

## Diagrama de colecciones (MongoDB)

```
users
  _id, name, email, password, role, active, timestamps

campaigns
  _id, title, description, bloodType, location
  startDate, endDate, status, targetDonors
  createdBy → ObjectId(users)
  timestamps

appointments
  _id, scheduledDate, status, bloodType, notes
  userId     → ObjectId(users)
  campaignId → ObjectId(campaigns)
  timestamps

tickets  ← modelo principal NoSQL
  _id, title, description, status, category, priority
  createdBy  → ObjectId(users)
  assignedTo → ObjectId(users)
  relatedAppointmentId → ObjectId(appointments)
  messages[] {               ← EMBEBIDO
    sender → ObjectId(users)
    content, timestamp
  }
  history[]  {               ← EMBEBIDO
    changedBy → ObjectId(users)
    field, oldValue, newValue, timestamp
  }
  timestamps

notifications
  _id, message, type, read
  userId    → ObjectId(users)
  relatedTo { model, id }
  timestamps
```
