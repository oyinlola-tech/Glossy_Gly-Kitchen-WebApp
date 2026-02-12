const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const MIME_EXTENSION_MAP = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const ensureUploadsDir = async () => {
  await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
};

const parseImageDataUrl = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(trimmed);
  if (!match) return null;
  const mimeType = match[1].toLowerCase();
  const base64Data = match[2].replace(/\s+/g, '');
  return { mimeType, base64Data };
};

const saveImageFromDataUrl = async (dataUrl, originalName) => {
  const parsed = parseImageDataUrl(dataUrl);
  if (!parsed) {
    throw new Error('Invalid image format. Expected base64 data URL.');
  }

  const extension = MIME_EXTENSION_MAP[parsed.mimeType];
  if (!extension) {
    throw new Error('Unsupported image type. Use jpeg, png, webp, or gif.');
  }

  const buffer = Buffer.from(parsed.base64Data, 'base64');
  if (buffer.length === 0) {
    throw new Error('Image payload is empty.');
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error('Image payload exceeds 5MB.');
  }

  await ensureUploadsDir();

  const safeStem = String(originalName || 'meal-image')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 50) || 'meal-image';
  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${safeStem}.${extension}`;
  const filePath = path.join(UPLOADS_DIR, fileName);

  await fs.promises.writeFile(filePath, buffer);

  return {
    fileName,
    filePath,
    publicPath: `/uploads/${fileName}`,
  };
};

const deleteImageByPublicPath = async (publicPath) => {
  if (typeof publicPath !== 'string' || !publicPath.startsWith('/uploads/')) return;
  const fileName = publicPath.slice('/uploads/'.length);
  if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) return;
  const filePath = path.join(UPLOADS_DIR, fileName);
  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      throw err;
    }
  }
};

module.exports = {
  ensureUploadsDir,
  saveImageFromDataUrl,
  deleteImageByPublicPath,
};
