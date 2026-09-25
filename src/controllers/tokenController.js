const User = require('../models/User');
const TokenLedger = require('../models/TokenLedger');
const mongoose = require('mongoose');
// ============================================
// GET /api/tokens/balance
// Solde actuel de l'utilisateur (protégé)
// ============================================
const getBalance = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('username greenTokens');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Balance retrieved successfully',
      balance: {
        username: user.username,
        greenTokens: user.greenTokens
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET /api/tokens/history
// Historique des gains (protégé)
// ============================================
const getHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { userId: req.user.userId };

    const [transactions, total] = await Promise.all([
      TokenLedger.find(filter)
        .populate('reportId', 'type photoUrl status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      TokenLedger.countDocuments(filter)
    ]);

    // Calculer le total de tokens gagnés (toutes transactions confondues)
    const totalEarned = await TokenLedger.aggregate([
  { $match: { userId: new mongoose.Types.ObjectId(req.user.userId) } },  // ← CORRIGÉ
  { $group: { _id: null, total: { $sum: '$amount' } } }
]);

    res.json({
      message: 'History retrieved successfully',
      summary: {
        totalEarned: totalEarned[0]?.total || 0,
        transactionsCount: total
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      transactions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBalance, getHistory };