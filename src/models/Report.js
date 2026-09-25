const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    // ============================================
    // RÉFÉRENCE À L'UTILISATEUR
    // ============================================
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',  // ← référence à la collection "users"
      required: [true, 'User ID is required'],
      index: true
    },

    // ============================================
    // PHOTO
    // ============================================
    photoUrl: {
      type: String,
      required: [true, 'Photo URL is required']
    },

    // ============================================
    // LOCALISATION GPS (format GeoJSON)
    // ============================================
    location: {
      type: {
        type: String,
        enum: ['Point'],  // ← seul type autorisé
        default: 'Point',
        required: true
      },
      coordinates: {
        type: [Number],  // ← [longitude, latitude]
        required: [true, 'Coordinates are required'],
        validate: {
          validator: function (coords) {
            return (
              Array.isArray(coords) &&
              coords.length === 2 &&
              coords[0] >= -180 && coords[0] <= 180 &&  // longitude
              coords[1] >= -90 && coords[1] <= 90       // latitude
            );
          },
          message: 'Coordinates must be [longitude, latitude] with valid ranges'
        }
      }
    },

    // ============================================
    // TYPE DE SIGNALEMENT
    // ============================================
    type: {
      type: String,
      enum: {
        values: ['bac_plein', 'depot_sauvage', 'dechets_au_sol'],
        message: '{VALUE} is not a valid report type'
      },
      required: [true, 'Report type is required']
    },

    // ============================================
    // STATUT
    // ============================================
    status: {
      type: String,
      enum: ['pending', 'validated', 'rejected'],
      default: 'pending'
    },

    // ============================================
    // RÉSULTATS DE L'IA
    // ============================================
    aiConfidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    aiLabel: {
      type: String,
      default: null
    },
    aiDescription: {
      type: String,
      default: null
    },

    // ============================================
    // TOKENS
    // ============================================
    tokensAwarded: {
      type: Number,
      default: 0,
      min: 0
    },

    // ============================================
    // DATES
    // ============================================
    validatedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true  // createdAt + updatedAt automatiques
  }
);

// ============================================
// INDEX GÉOSPATIAL (ESSENTIEL !)
// ============================================
// Sans cet index, les requêtes $near et $geoWithin NE FONCTIONNENT PAS.
reportSchema.index({ location: '2dsphere' });

// ============================================
// INDEX COMPOSÉ (pour les requêtes fréquentes)
// ============================================
// Pour "mes signalements" triés par date
reportSchema.index({ userId: 1, createdAt: -1 });

// Pour "signalements validés triés par date"
reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);