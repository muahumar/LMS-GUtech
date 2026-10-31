import multer from 'multer';
import { Request } from 'express';
import { AppError } from '../utils/appError.js';
import path from 'path';

const memoryStorage = multer.memoryStorage();

const ALLOWED_RESOURCE_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/zip',
  'application/x-zip-compressed',
];

const ALLOWED_EXTENSIONS = [
  '.pdf', '.docx', '.doc', '.pptx', '.ppt', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.zip'
];

export const resourceUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max per spec
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.exe' || ext === '.sh' || ext === '.bat' || ext === '.cmd') {
      return cb(new AppError(422, 'UNPROCESSABLE_ENTITY', 'Executable files (.exe, .bat, .sh) are strictly prohibited'));
    }

    if (!ALLOWED_RESOURCE_MIMES.includes(file.mimetype) && !ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new AppError(422, 'UNPROCESSABLE_ENTITY', `Unsupported file type: ${file.mimetype}. Allowed types: PDF, DOCX, PPTX, images, and ZIP.`));
    }

    cb(null, true);
  },
});

export const generalUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit for submissions & complaints
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.exe' || ext === '.sh' || ext === '.bat' || ext === '.cmd') {
      return cb(new AppError(422, 'UNPROCESSABLE_ENTITY', 'Executable files are strictly prohibited'));
    }
    cb(null, true);
  },
});
