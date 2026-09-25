const Report = require('../models/Report');

// ============================================
// GET /api/stats/heatmap
// Zones chaudes : regroupe les signalements par cellule
// ============================================
const getHeatmap = async (req, res, next) => {
  try {
    // Précision de la grille : 3 décimales ≈ 100m
    const precision = parseInt(req.query.precision) || 3;

    const cells = await Report.aggregate([
      { $match: { status: 'validated' } },
      {
        $group: {
          _id: {
            lat: {
              $round: [
                { $arrayElemAt: ['$location.coordinates', 1] },
                precision
              ]
            },
            lng: {
              $round: [
                { $arrayElemAt: ['$location.coordinates', 0] },
                precision
              ]
            }
          },
          count: { $sum: 1 },
          avgConfidence: { $avg: '$aiConfidence' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 500 }
    ]);

    // Reformater pour le frontend
    const formattedCells = cells.map((cell) => ({
      latitude: cell._id.lat,
      longitude: cell._id.lng,
      count: cell.count,
      avgConfidence: Math.round(cell.avgConfidence * 100) / 100
    }));

    res.json({
      message: 'Heatmap retrieved successfully',
      precision,
      totalCells: formattedCells.length,
      cells: formattedCells
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET /api/stats/by-zone
// Compte les signalements dans un polygone
// ============================================
const getByZone = async (req, res, next) => {
  try {
    const { polygon } = req.body;

    // Le polygone doit être un tableau de [lng, lat]
    // Exemple : [[11.50, 3.84], [11.52, 3.84], [11.52, 3.86], [11.50, 3.86], [11.50, 3.84]]
    if (!polygon || !Array.isArray(polygon) || polygon.length < 4) {
      return res.status(400).json({
        error: 'Polygon must be an array of at least 4 coordinate pairs'
      });
    }

    // Vérifier que le polygone est fermé (premier point = dernier point)
    const first = polygon[0];
    const last = polygon[polygon.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      polygon.push([...first]); // fermer le polygone
    }

    const [reports, count] = await Promise.all([
      Report.find({
        status: 'validated',
        location: {
          $geoWithin: {
            $geometry: {
              type: 'Polygon',
              coordinates: [polygon]
            }
          }
        }
      })
        .select('photoUrl location type aiConfidence createdAt')
        .limit(100),
      Report.countDocuments({
        status: 'validated',
        location: {
          $geoWithin: {
            $geometry: {
              type: 'Polygon',
              coordinates: [polygon]
            }
          }
        }
      })
    ]);

    res.json({
      message: 'Zone stats retrieved successfully',
      polygon,
      count,
      reports
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET /api/stats/timeline
// Évolution temporelle par mois
// ============================================
const getTimeline = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months) || 12;

    // Date de début : il y a X mois
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const timeline = await Report.aggregate([
      {
        $match: {
          status: 'validated',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          avgConfidence: { $avg: '$aiConfidence' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Reformater pour le frontend
    const formattedTimeline = timeline.map((entry) => ({
      year: entry._id.year,
      month: entry._id.month,
      label: `${entry._id.year}-${String(entry._id.month).padStart(2, '0')}`,
      count: entry.count,
      avgConfidence: Math.round(entry.avgConfidence * 100) / 100
    }));

    res.json({
      message: 'Timeline retrieved successfully',
      months,
      totalEntries: formattedTimeline.length,
      timeline: formattedTimeline
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getHeatmap, getByZone, getTimeline };