const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middlewares/errorHandler');
const reportRoutes = require('./routes/reportRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();

// ============================================
// MIDDLEWARES GLOBAUX
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// ROUTES
// ============================================

// Route de test
app.get('/', (req, res) => {
  res.json({
    message: 'GreenApp API is running 🌱',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  });
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/stats', statsRoutes);

// ============================================
// GESTION DES ERREURS (TOUJOURS EN DERNIER)
// ============================================

// 404
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Gestion d'erreurs globale
app.use(errorHandler);

module.exports = app;