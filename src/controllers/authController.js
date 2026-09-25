const User = require('../models/User');
const { generateToken } = require('../utils/token');

/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur
 */
const register = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    // 1. Vérifier que tous les champs sont fournis
    if (!email || !username || !password) {
      return res.status(400).json({
        error: 'Email, username and password are required'
      });
    }

    // 2. Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        error: 'Email already in use'
      });
    }

    // 3. Créer l'utilisateur (le mot de passe sera hashé automatiquement)
    const user = await User.create({ email, username, password });

    // 4. Générer un JWT
    const token = generateToken(user._id);

    // 5. Renvoyer la réponse (SANS le mot de passe)
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        greenTokens: user.greenTokens,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);  // passe au middleware d'erreur global
  }
};

/**
 * POST /api/auth/login
 * Connexion d'un utilisateur existant
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Vérifier que les champs sont fournis
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // 2. Chercher l'utilisateur (avec le password cette fois)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // 3. Comparer les mots de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // 4. Générer un JWT
    const token = generateToken(user._id);

    // 5. Renvoyer la réponse
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        greenTokens: user.greenTokens,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Récupérer le profil de l'utilisateur connecté
 */
const getMe = async (req, res, next) => {
  try {
    // req.user est ajouté par le middleware d'authentification
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        greenTokens: user.greenTokens,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };