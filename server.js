require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const authRoutes        = require('./routes/auth');
const userRoutes        = require('./routes/users');
const campaignRoutes    = require('./routes/campaigns');
const appointmentRoutes = require('./routes/appointments');
const ticketRoutes      = require('./routes/tickets');

const app = express();

connectDB();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth',         authRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/campaigns',    campaignRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/tickets',      ticketRoutes);

// Serve login page for unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
