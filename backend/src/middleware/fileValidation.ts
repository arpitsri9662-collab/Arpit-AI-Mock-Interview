import { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileTypeFromBuffer } from 'file-type';

const validateDocumentContent = async (buffer: Buffer): Promise<boolean> => {
  const fileType = await fileTypeFromBuffer(buffer);

  const allowedDocTypes = [
    { mime: 'application/pdf', ext: 'pdf' },
    { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' }
  ];

  const isValidDocType = allowedDocTypes.some(type =>
    fileType?.mime === type.mime && fileType?.ext === type.ext
  );

  if (!isValidDocType) {
    return false;
  }

  // Additional validation for DOCX (check if it's a valid zip)
  if (fileType?.ext === 'docx') {
    if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4B || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
      return false;
    }
  }

  // Additional validation for PDF (check %PDF- header)
  if (fileType?.ext === 'pdf') {
    const header = buffer.subarray(0, 5).toString();
    if (!header.startsWith('%PDF-')) {
      return false;
    }
  }

  return true;
};

const validateVideoContent = async (buffer: Buffer): Promise<boolean> => {
  const fileType = await fileTypeFromBuffer(buffer);

  const allowedVideoTypes = [
    { mime: 'video/webm', ext: 'webm' },
    { mime: 'video/mp4', ext: 'mp4' },
    { mime: 'video/avi', ext: 'avi' },
    { mime: 'video/quicktime', ext: 'mov' }
  ];

  const isValidVideoType = allowedVideoTypes.some(type =>
    fileType?.mime === type.mime && fileType?.ext === type.ext
  );

  return isValidVideoType;
};

export const validateFileContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      return next();
    }

    const filePath = req.file.path;
    const buffer = req.file.buffer || await fs.readFile(filePath);

    // Determine if it's a document or video based on destination
    const normalizedPathParts = filePath ? path.normalize(filePath).split(path.sep) : [];
    const isVideo = req.file.mimetype.startsWith('video/')
      || req.file.fieldname === 'chunk'
      || normalizedPathParts.includes('videos');
    let isValid = false;

    if (isVideo) {
      isValid = await validateVideoContent(buffer);
      if (!isValid) {
        if (filePath) await fs.unlink(filePath);
        res.status(400).json({ message: 'Invalid video file content. Only WebM, MP4, AVI, and MOV are allowed.' });
        return;
      }
    } else {
      isValid = await validateDocumentContent(buffer);
      if (!isValid) {
        if (filePath) await fs.unlink(filePath);
        res.status(400).json({ message: 'Invalid document file content. Only PDF and DOCX are allowed.' });
        return;
      }
    }

    next();
  } catch (error) {
    console.error('File validation error:', error);
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting invalid file:', unlinkError);
      }
    }
    res.status(500).json({ message: 'File validation failed' });
  }
};
