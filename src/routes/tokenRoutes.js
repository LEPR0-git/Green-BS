const express = require('express');
const router = express.Router();
const { getBalance, getHistory } = require('../controllers/tokenController');
const { protect } = require('../middlewares/auth');

// GET /api/tokens/balance (protégé)
router.get('/balance', protect, getBalance);

// GET /api/tokens/history (protégé)
router.get('/history', protect, getHistory);

module.exports = router;