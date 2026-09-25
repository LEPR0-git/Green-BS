const express = require('express');
const router = express.Router();
const {
  createReport,
  getAllReports,
  getReportById,
  getNearbyReports,
  getMyReports
} = require('../controllers/reportController');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// ============================================
// ROUTES SPÉCIFIQUES (avant /:id)
// ============================================

// POST /api/reports (protégé + upload)
router.post('/', protect, upload.single('photo'), createReport);

// GET /api/reports/nearby (public)
router.get('/nearby', getNearbyReports);

// GET /api/reports/me (protégé)
router.get('/me', protect, getMyReports);

// ============================================
// ROUTES GÉNÉRIQUES (après les spécifiques)
// ============================================

// GET /api/reports (public)
router.get('/', getAllReports);

// GET /api/reports/:id (public)
router.get('/:id', getReportById);

module.exports = router;