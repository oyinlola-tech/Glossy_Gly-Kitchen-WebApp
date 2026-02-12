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
  if (!trimmed.startsWith('data:')) return null;

  const marker = ';base64,';
  const markerIndex = trimmed.indexOf(marker);
  if (markerIndex <= 5) return null;

  const mimeTypeRaw = trimmed.slice(5, markerIndex).toLowerCase();
  if (!mimeTypeRaw.startsWith('image/')) return null;

  for (let i = 0; i < mimeTypeRaw.length; i += 1) {
    const ch = mimeTypeRaw[i];
    const isLower = ch >= 'a' && ch <= 'z';
    const isDigit = ch >= '0' && ch <= '9';
    if (!(isLower || isDigit || ch === '/' || ch === '+' || ch === '.' || ch === '-')) {
      return null;
    }
  }

  const base64Raw = trimmed.slice(markerIndex + marker.length);
  if (!base64Raw) return null;

  let base64Data = '';
  for (let i = 0; i < base64Raw.length; i += 1) {
    const ch = base64Raw[i];
    const isUpper = ch >= 'A' && ch <= 'Z';
    const isLower = ch >= 'a' && ch <= 'z';
    const isDigit = ch >= '0' && ch <= '9';
    const isWhitespace = ch === '\r' || ch === '\n' || ch === ' ' || ch === '\t';
    const isBase64Symbol = ch === '+' || ch === '/' || ch === '=';
    if (isWhitespace) continue;
    if (!(isUpper || isLower || isDigit || isBase64Symbol)) return null;
    base64Data += ch;
  }

  if (!base64Data) return null;
  const mimeType = mimeTypeRaw;
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
