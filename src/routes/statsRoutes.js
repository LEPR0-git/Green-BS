const express = require('express');
const router = express.Router();
const {
  getHeatmap,
  getByZone,
  getTimeline
} = require('../controllers/statsController');

// GET /api/stats/heatmap (public)
router.get('/heatmap', getHeatmap);

// POST /api/stats/by-zone (public)
router.post('/by-zone', getByZone);

// GET /api/stats/timeline (public)
router.get('/timeline', getTimeline);

module.exports = router;