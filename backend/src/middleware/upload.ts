import multer from 'multer';
import fs from 'fs';
import path from 'path';

import { Request } from 'express';

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

const ensureDir = (dir: string, cb: (error: Error | null, destination: string) => void) => {
  fs.mkdir(dir, { recursive: true }, (error) => cb(error, dir));
};

const storage = multer.diskStorage({
  destination: (req: Request, file: any, cb: any) => {
    ensureDir(uploadsDir, cb);
  },
  filename: (req: Request, file: any, cb: any) => {
    const originalName = path.basename(file.originalname, path.extname(file.originalname));
    const safeName = originalName.replace(/[^a-z0-9-_]/gi, '-').slice(0, 40) || 'resume';
    const uniqueSuffix = `${Date.now()}-${process.hrtime.bigint().toString()}`;
    cb(null, `${safeName}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = async (req: Request, file: any, cb: any) => {
  const allowedMimeTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  // Check MIME type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only PDF and DOCX are allowed.'));
  }

  // For content validation, we'll need to read the file buffer
  // This will be done in a custom middleware after multer
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const videoFileFilter = (req: Request, file: any, cb: any) => {
  const rawMime = String(file.mimetype || '');
  const mimeType = rawMime.split(';')[0].trim().toLowerCase();

  console.log(`[videoUpload] file: ${file.originalname}, raw mime: "${rawMime}", parsed: "${mimeType}"`);

  // Accept any video/* type, plus application/octet-stream (browser blob uploads)
  if (mimeType.startsWith('video/') || mimeType === 'application/octet-stream') {
    cb(null, true);
  } else {
    cb(new Error(`Invalid video file type "${mimeType}". Only video files are allowed.`));
  }
};

export const videoUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
});
