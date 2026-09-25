const jwt = require('jsonwebtoken');

/**
 * Génère un JWT pour un utilisateur
 * @param {string} userId - L'ID de l'utilisateur
 * @returns {string} Le token JWT
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },  // payload : ce qu'on met DANS le token
    process.env.JWT_SECRET,  // clé secrète
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }  // durée de validité
  );
};

/**
 * Vérifie et décode un JWT
 * @param {string} token - Le token à vérifier
 * @returns {object} Le payload décodé
 * @throws {Error} Si le token est invalide ou expiré
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };