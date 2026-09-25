const Report = require('../models/Report');
const User = require('../models/User');
const TokenLedger = require('../models/TokenLedger');
const { uploadImage } = require('../services/cloudinaryService');
const { analyzeImage } = require('../services/geminiService');

// ============================================
// POST /api/reports
// Créer un nouveau signalement (protégé)
// ============================================
const createReport = async (req, res, next) => {
  try {
    const { latitude, longitude, type } = req.body;

    // 1. Vérifier que tous les champs sont présents
    if (!req.file) {
      return res.status(400).json({ error: 'Photo is required' });
    }
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    if (!type) {
      return res.status(400).json({ error: 'Report type is required' });
    }

    // 2. Convertir les coordonnées en nombres
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Latitude and longitude must be numbers' });
    }

    // 3. ANALYSE IA AVANT l'upload Cloudinary
    // (car uploadImage supprime le fichier local après l'upload)
    let aiAnalysis = {
      isWaste: false,
      confidence: 0,
      type: 'autre',
      description: 'AI analysis failed'
    };

    try {
      aiAnalysis = await analyzeImage(req.file.path);
    } catch (aiError) {
      console.error('⚠️ AI analysis failed:', aiError.message);
      // On continue quand même : le signalement sera en "rejected"
    }

    // 4. Upload de l'image vers Cloudinary
    const uploadResult = await uploadImage(req.file.path);

    // 5. Déterminer le statut et les tokens
    const CONFIDENCE_THRESHOLD = 0.7;
    const TOKENS_PER_REPORT = 10;

    const isValid =
      aiAnalysis.isWaste && aiAnalysis.confidence > CONFIDENCE_THRESHOLD;

    const status = isValid ? 'validated' : 'rejected';
    const tokensAwarded = isValid ? TOKENS_PER_REPORT : 0;

    // 6. Créer le signalement dans MongoDB
    const report = await Report.create({
      userId: req.user.userId,
      photoUrl: uploadResult.url,
      location: {
        type: 'Point',
        coordinates: [lng, lat] // ⚠️ [longitude, latitude]
      },
      type,
      status,
      aiConfidence: aiAnalysis.confidence,
      aiLabel: aiAnalysis.type,
      aiDescription: aiAnalysis.description,
      tokensAwarded,
      validatedAt: isValid ? new Date() : null
    });

    // 7. Si validé, attribuer les tokens + enregistrer dans le ledger
    if (isValid) {
      await User.updateOne(
        { _id: req.user.userId },
        { $inc: { greenTokens: tokensAwarded } }
      );

      await TokenLedger.create({
        userId: req.user.userId,
        reportId: report._id,
        amount: tokensAwarded,
        reason: 'report_validated'
      });

      console.log(
        `✅ ${tokensAwarded} Green Tokens attribués à l'utilisateur ${req.user.userId}`
      );
    }

    // 8. Peupler les infos utilisateur (pour la réponse)
    await report.populate('userId', 'username email');

    // 9. Renvoyer la réponse
    res.status(201).json({
      message: isValid
        ? 'Report validated by AI. Tokens awarded!'
        : 'Report rejected by AI. No tokens awarded.',
      aiAnalysis: {
        isWaste: aiAnalysis.isWaste,
        confidence: aiAnalysis.confidence,
        type: aiAnalysis.type,
        description: aiAnalysis.description
      },
      report: {
        id: report._id,
        photoUrl: report.photoUrl,
        location: report.location,
        type: report.type,
        status: report.status,
        aiConfidence: report.aiConfidence,
        aiLabel: report.aiLabel,
        aiDescription: report.aiDescription,
        tokensAwarded: report.tokensAwarded,
        user: {
          id: report.userId._id,
          username: report.userId.username,
          email: report.userId.email
        },
        createdAt: report.createdAt,
        validatedAt: report.validatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET /api/reports
// Lister tous les signalements validés (public)
// ============================================
const getAllReports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { status: 'validated' };

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('userId', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Report.countDocuments(filter)
    ]);

    res.json({
      message: 'Reports retrieved successfully',
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      reports
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET /api/reports/:id
// Voir un signalement précis (public)
// ============================================
const getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id).populate(
      'userId',
      'username email'
    );

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ report });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid report ID' });
    }
    next(error);
  }
};

// ============================================
// GET /api/reports/nearby
// Signalements proches (géospatial)
// ============================================
const getNearbyReports = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ error: 'Latitude and longitude are required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const maxDistance = parseInt(radius);

    if (isNaN(lat) || isNaN(lng)) {
      return res
        .status(400)
        .json({ error: 'Latitude and longitude must be numbers' });
    }

    const reports = await Report.find({
      status: 'validated',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: maxDistance
        }
      }
    })
      .populate('userId', 'username')
      .limit(50);

    res.json({
      message: 'Nearby reports retrieved successfully',
      center: { latitude: lat, longitude: lng },
      radius: maxDistance,
      count: reports.length,
      reports
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET /api/reports/me
// Mes signalements (protégé)
// ============================================
const getMyReports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { userId: req.user.userId };

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Report.countDocuments(filter)
    ]);

    res.json({
      message: 'My reports retrieved successfully',
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      reports
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  getAllReports,
  getReportById,
  getNearbyReports,
  getMyReports
};