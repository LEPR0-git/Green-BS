const { verifyToken } = require('../utils/token');

/**
 * Middleware de protection des routes
 * Vérifie que la requête contient un JWT valide
 */
const protect = (req, res, next) => {
  try {
    // 1. Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided. Authorization denied.'
      });
    }

    // 2. Extraire le token (retirer "Bearer ")
    const token = authHeader.split(' ')[1];

    // 3. Vérifier le token
    const decoded = verifyToken(token);

    // 4. Ajouter les infos de l'utilisateur à req
    req.user = { userId: decoded.userId };

    // 5. Passer au middleware/route suivant
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    next(error);
  }
};

module.exports = { protect };