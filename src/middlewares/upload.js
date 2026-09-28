const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================
// CRÉER LE DOSSIER UPLOADS S'IL N'EXISTE PAS
// ============================================
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`📁 Dossier créé : ${uploadDir}`);
}

// ============================================
// CONFIGURATION DU STOCKAGE
// ============================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);  // ← utilise le chemin absolu
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// ... reste du fichier inchangé

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