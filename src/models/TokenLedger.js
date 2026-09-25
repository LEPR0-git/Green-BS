const mongoose = require('mongoose');

const tokenLedgerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      default: null
    },
    amount: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      enum: ['report_validated', 'bonus', 'admin_adjustment'],
      required: true
    }
  },
  {
    timestamps: true
  }
);

tokenLedgerSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('TokenLedger', tokenLedgerSchema);