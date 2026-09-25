const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be at most 30 characters']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false  // ← ne sera pas renvoyé par défaut dans les requêtes
    },
    greenTokens: {
      type: Number,
      default: 0,
      min: [0, 'Green tokens cannot be negative']
    },
    role: {
      type: String,
      enum: ['citizen', 'admin'],
      default: 'citizen'
    }
  },
  {
    timestamps: true  // ajoute automatiquement createdAt et updatedAt
  }
);

// ============================================
// MIDDLEWARE : Hasher le mot de passe avant sauvegarde
// ============================================
userSchema.pre('save', async function () {
  // Si le mot de passe n'a pas été modifié, on passe
  if (!this.isModified('password')) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// ============================================
// MÉTHODE : Comparer un mot de passe
// ============================================
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);