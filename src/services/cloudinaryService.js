const fs = require('fs');
const cloudinary = require('../config/cloudinary');

/**
 * Envoie une image à Cloudinary et supprime le fichier local
 * @param {string} localFilePath - Chemin local du fichier (ex: uploads/photo.jpg)
 * @param {string} folder - Dossier Cloudinary (ex: 'greenapp/reports')
 * @returns {Promise<object>} - { url, publicId, width, height, format }
 */
const uploadImage = async (localFilePath, folder = 'greenapp/reports') => {
  try {
    if (!localFilePath) {
      throw new Error('No file path provided');
    }

    // 1. Upload vers Cloudinary
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 1200, crop: 'limit' },  // max 1200px de large
        { quality: 'auto' },              // compression auto
        { fetch_format: 'auto' }          // format optimal (webp si possible)
      ]
    });

    // 2. Supprimer le fichier local (on n'en a plus besoin)
    fs.unlinkSync(localFilePath);

    // 3. Renvoyer les infos utiles
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    // En cas d'erreur, supprimer aussi le fichier local
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Supprime une image de Cloudinary
 * @param {string} publicId - L'ID public de l'image (ex: 'greenapp/reports/abc123')
 * @returns {Promise<object>} - Le résultat de la suppression
 */
const deleteImage = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error('No public ID provided');
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};

module.exports = { uploadImage, deleteImage };