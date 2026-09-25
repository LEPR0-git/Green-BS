const multer = require('multer');
const path = require('path');

// ============================================
// CONFIGURATION DU STOCKAGE
// ============================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // dossier temporaire
  },
  filename: (req, file, cb) => {
    // Nom unique : timestamp + extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// ============================================
// FILTRE : n'accepter que les images
// ============================================
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed'));
};

// ============================================
// INSTANCE MULTER
// ============================================
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024  // 5 MB max
  },
  fileFilter
});

module.exports = upload;