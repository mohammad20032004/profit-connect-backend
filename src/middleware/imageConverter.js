const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

function isImage(file) {
  return IMAGE_MIME_TYPES.includes(file.mimetype);
}

async function convertSingleFile(file) {
  if (!isImage(file)) return;
  if (file.mimetype === 'image/webp') return;

  const webpPath = file.path.replace(/\.[^.]+$/, '.webp');
  try {
    await sharp(file.path).webp({ quality: 82 }).toFile(webpPath);
    await fs.unlink(file.path);
    file.filename = path.basename(webpPath);
    file.path = webpPath;
    file.mimetype = 'image/webp';
    file.size = (await fs.stat(webpPath)).size;
  } catch (err) {
    console.error('WebP conversion failed:', file.filename, err.message);
  }
}

async function convertToWebP(req, res, next) {
  try {
    if (req.file) {
      await convertSingleFile(req.file);
    }

    if (req.files) {
      if (Array.isArray(req.files)) {
        for (const file of req.files) {
          await convertSingleFile(file);
        }
      } else {
        for (const files of Object.values(req.files)) {
          for (const file of files) {
            await convertSingleFile(file);
          }
        }
      }
    }
  } catch (err) {
    console.error('Image conversion error:', err.message);
  }
  next();
}

module.exports = convertToWebP;
