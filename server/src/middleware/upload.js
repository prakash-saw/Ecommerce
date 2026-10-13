const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { PRINT_SPECIFICATIONS } = require('../config/constants');

const artworkUploadDir = path.join(__dirname, '../../uploads/artwork');
if (!fs.existsSync(artworkUploadDir)) {
  fs.mkdirSync(artworkUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, artworkUploadDir);
  },
  filename: (req, file, cb) => {
    const randomHex = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
    cb(null, `art_${Date.now()}_${safeBase}_${randomHex}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.png', '.jpg', '.jpeg', '.webp'];

  if (PRINT_SPECIFICATIONS.ALLOWED_MIME_TYPES.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype} (${ext}). Allowed: PNG, JPEG, WebP`), false);
  }
};

const uploadArtwork = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: PRINT_SPECIFICATIONS.MAX_FILE_SIZE_BYTES // 15MB
  }
});

module.exports = {
  uploadArtwork
};
