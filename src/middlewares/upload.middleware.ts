import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';

// File type configurations
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'application/zip',
];

const ALL_ALLOWED_MIME_TYPES = [...IMAGE_MIME_TYPES, ...DOCUMENT_MIME_TYPES];

// File size limits
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Memory storage (files stored in buffer, then uploaded to S3)
const memoryStorage = multer.memoryStorage();

// File filter for images only
const imageFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  if (IMAGE_MIME_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
  }
};

// File filter for documents only
const documentFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  if (DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new Error('Only document files (PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, ZIP) are allowed')
    );
  }
};

// File filter for both images and documents
const allFilesFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  if (ALL_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error('File type not allowed'));
  }
};

// Multer configurations

// Profile photo upload (single image)
export const uploadProfilePhoto = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: imageFilter,
}).single('photo');

// Employer logo upload (single image)
export const uploadEmployerLogo = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: imageFilter,
}).single('logo');

// Profile document upload (single document)
export const uploadProfileDocument = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_DOCUMENT_SIZE },
  fileFilter: allFilesFilter,
}).single('document');

// KYC document upload (single document or image)
export const uploadKycDocument = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_DOCUMENT_SIZE },
  fileFilter: allFilesFilter,
}).single('document');

// Project document upload (single document)
export const uploadProjectDocument = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_DOCUMENT_SIZE },
  fileFilter: documentFilter,
}).single('document');

// Multiple files upload
export const uploadMultipleFiles = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: allFilesFilter,
}).array('files', 10); // Max 10 files

// Generic single file upload
export const uploadSingleFile = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: allFilesFilter,
}).single('file');

// Helper function to get file extension
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

// Helper function to validate file size
export function validateFileSize(size: number, maxSize: number): boolean {
  return size <= maxSize;
}

// Helper function to sanitize filename
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}
