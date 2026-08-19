require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');

const app = express();
const PORT = parseInt(process.env.APP_PORT, 10) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 },
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', authRoutes);
app.use('/api/patients', patientRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Patient Records Viewer running at http://0.0.0.0:${PORT}`);
});
