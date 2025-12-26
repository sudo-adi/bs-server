import { env } from '@/config/env';
import logger from '@/config/logger';
import { S3BucketType, S3FolderType, s3StorageService } from '@/services/storage';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// Storage directory for local fallback
const STORAGE_DIR = env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const BASE_URL = env.BASE_URL || 'http://localhost:8080';

// Check if S3 is available
const useS3 = (): boolean => s3StorageService.isAvailable();

/**
 * Initialize storage directory for local storage fallback
 */
async function ensureStorageDir(): Promise<void> {
  try {
    await fs.access(STORAGE_DIR);
  } catch {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  }
}

export interface FileUploadOptions {
  bucketType?: S3BucketType;
  folder?: S3FolderType;
  profileId?: string;
  projectId?: string;
}

export interface UploadedFile {
  url: string;
  key?: string;
  bucket?: string;
  contentType?: string;
  size?: number;
  storageType: 'local' | 's3';
}

/**
 * Upload file to storage (S3 if available, otherwise local)
 */
export async function uploadFile(
  file: Buffer,
  filename: string,
  options: FileUploadOptions = {}
): Promise<string> {
  // Use S3 if available and configured
  if (useS3()) {
    const bucketType = options.bucketType || S3BucketType.DOCUMENTS;
    const folder = options.folder || S3FolderType.TEMP;
    const entityId = options.profileId || options.projectId;

    const result = await s3StorageService.uploadFile(file, filename, bucketType, folder, entityId);
    return result.url;
  }

  // Fallback to local storage
  return uploadFileLocal(file, filename);
}

/**
 * Upload file with detailed result
 */
export async function uploadFileWithDetails(
  file: Buffer,
  filename: string,
  options: FileUploadOptions = {}
): Promise<UploadedFile> {
  if (useS3()) {
    const bucketType = options.bucketType || S3BucketType.DOCUMENTS;
    const folder = options.folder || S3FolderType.TEMP;
    const entityId = options.profileId || options.projectId;

    const result = await s3StorageService.uploadFile(file, filename, bucketType, folder, entityId);
    return {
      url: result.url,
      key: result.key,
      bucket: result.bucket,
      contentType: result.contentType,
      size: result.size,
      storageType: 's3',
    };
  }

  // Fallback to local storage
  const url = await uploadFileLocal(file, filename);
  return {
    url,
    size: file.length,
    storageType: 'local',
  };
}

/**
 * Upload file to local storage
 */
async function uploadFileLocal(file: Buffer, filename: string): Promise<string> {
  try {
    await ensureStorageDir();

    // Generate unique filename
    const ext = path.extname(filename);
    const uniqueFilename = `${randomUUID()}${ext}`;
    const filePath = path.join(STORAGE_DIR, uniqueFilename);

    // Write file to disk
    await fs.writeFile(filePath, file);

    // Return public URL
    const publicUrl = `${BASE_URL}/uploads/${uniqueFilename}`;
    logger.info(`File uploaded locally: ${uniqueFilename}`);
    return publicUrl;
  } catch (error) {
    throw new Error(
      `File upload error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete file from storage
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  // Check if it's an S3 URL
  if (isS3Url(fileUrl)) {
    if (!useS3()) {
      logger.warn('Cannot delete S3 file: S3 is not configured');
      return;
    }
    await s3StorageService.deleteFileByUrl(fileUrl);
    return;
  }

  // Otherwise, delete from local storage
  await deleteFileLocal(fileUrl);
}

/**
 * Delete file from local storage
 */
async function deleteFileLocal(fileUrl: string): Promise<void> {
  try {
    // Extract filename from URL
    const url = new URL(fileUrl);
    const filename = path.basename(url.pathname);
    const filePath = path.join(STORAGE_DIR, filename);

    // Delete file
    await fs.unlink(filePath);
    logger.info(`File deleted locally: ${filename}`);
  } catch (error) {
    throw new Error(
      `File delete error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if URL is an S3 URL
 */
export function isS3Url(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname.includes('.s3.') ||
      urlObj.hostname.includes('s3.amazonaws.com') ||
      (!!env.AWS_S3_ENDPOINT && url.startsWith(env.AWS_S3_ENDPOINT))
    );
  } catch {
    return false;
  }
}

/**
 * Get file path from URL (for local storage)
 */
export function getFilePathFromUrl(fileUrl: string): string {
  const url = new URL(fileUrl);
  const filename = path.basename(url.pathname);
  return path.join(STORAGE_DIR, filename);
}

// Profile-specific upload functions
export async function uploadProfilePhoto(
  file: Buffer,
  filename: string,
  profileId: string
): Promise<UploadedFile> {
  if (useS3()) {
    const result = await s3StorageService.uploadProfilePhoto(file, filename, profileId);
    return {
      url: result.url,
      key: result.key,
      bucket: result.bucket,
      contentType: result.contentType,
      size: result.size,
      storageType: 's3',
    };
  }

  // Fallback to local with organized folder structure
  const url = await uploadFileLocal(file, `profile_${profileId}_${filename}`);
  return {
    url,
    size: file.length,
    storageType: 'local',
  };
}

// Employer logo upload function
export async function uploadEmployerLogo(
  file: Buffer,
  filename: string,
  employerId: string
): Promise<UploadedFile> {
  if (useS3()) {
    // Use profiles bucket with a custom folder for employer logos
    const result = await s3StorageService.uploadFile(
      file,
      filename,
      S3BucketType.PROFILES,
      S3FolderType.PROFILE_PHOTOS, // Reuse profile photos folder or create employer-logos
      employerId
    );
    return {
      url: result.url,
      key: result.key,
      bucket: result.bucket,
      contentType: result.contentType,
      size: result.size,
      storageType: 's3',
    };
  }

  // Fallback to local storage
  const url = await uploadFileLocal(file, `employer_logo_${employerId}_${filename}`);
  return {
    url,
    size: file.length,
    storageType: 'local',
  };
}

export async function uploadProfileDocument(
  file: Buffer,
  filename: string,
  profileId: string
): Promise<UploadedFile> {
  if (useS3()) {
    const result = await s3StorageService.uploadProfileDocument(file, filename, profileId);
    return {
      url: result.url,
      key: result.key,
      bucket: result.bucket,
      contentType: result.contentType,
      size: result.size,
      storageType: 's3',
    };
  }

  const url = await uploadFileLocal(file, `doc_${profileId}_${filename}`);
  return {
    url,
    size: file.length,
    storageType: 'local',
  };
}

export async function uploadKycDocument(
  file: Buffer,
  filename: string,
  profileId: string
): Promise<UploadedFile> {
  if (useS3()) {
    const result = await s3StorageService.uploadKycDocument(file, filename, profileId);
    return {
      url: result.url,
      key: result.key,
      bucket: result.bucket,
      contentType: result.contentType,
      size: result.size,
      storageType: 's3',
    };
  }

  const url = await uploadFileLocal(file, `kyc_${profileId}_${filename}`);
  return {
    url,
    size: file.length,
    storageType: 'local',
  };
}

export async function uploadProjectDocument(
  file: Buffer,
  filename: string,
  projectId: string
): Promise<UploadedFile> {
  if (useS3()) {
    const result = await s3StorageService.uploadProjectDocument(file, filename, projectId);
    return {
      url: result.url,
      key: result.key,
      bucket: result.bucket,
      contentType: result.contentType,
      size: result.size,
      storageType: 's3',
    };
  }

  const url = await uploadFileLocal(file, `project_${projectId}_${filename}`);
  return {
    url,
    size: file.length,
    storageType: 'local',
  };
}

export async function uploadTrainingCertificate(
  file: Buffer,
  filename: string,
  profileId: string
): Promise<UploadedFile> {
  if (useS3()) {
    const result = await s3StorageService.uploadTrainingCertificate(file, filename, profileId);
    return {
      url: result.url,
      key: result.key,
      bucket: result.bucket,
      contentType: result.contentType,
      size: result.size,
      storageType: 's3',
    };
  }

  const url = await uploadFileLocal(file, `cert_training_${profileId}_${filename}`);
  return {
    url,
    size: file.length,
    storageType: 'local',
  };
}

export async function uploadSkillCertificate(
  file: Buffer,
  filename: string,
  profileId: string
): Promise<UploadedFile> {
  if (useS3()) {
    const result = await s3StorageService.uploadSkillCertificate(file, filename, profileId);
    return {
      url: result.url,
      key: result.key,
      bucket: result.bucket,
      contentType: result.contentType,
      size: result.size,
      storageType: 's3',
    };
  }

  const url = await uploadFileLocal(file, `cert_skill_${profileId}_${filename}`);
  return {
    url,
    size: file.length,
    storageType: 'local',
  };
}

/**
 * Get storage status
 */
export function getStorageStatus(): { type: 'local' | 's3'; configured: boolean } {
  return {
    type: useS3() ? 's3' : 'local',
    configured: useS3(),
  };
}

/**
 * Get a signed URL for viewing a file
 * For S3 files, generates a pre-signed URL that expires in 1 hour
 * For local files, returns the original URL
 */
export async function getSignedUrl(
  fileUrl: string,
  expiresIn: number = 3600
): Promise<{ signedUrl: string; contentType: string | null }> {
  // If it's not an S3 URL, return the original URL
  if (!isS3Url(fileUrl)) {
    // Determine content type from extension
    const ext = path.extname(fileUrl).toLowerCase();
    const contentType = getContentTypeFromExtension(ext);
    return { signedUrl: fileUrl, contentType };
  }

  // If S3 is not available, return original URL (will fail with access denied)
  if (!useS3()) {
    logger.warn('S3 is not configured, returning original URL');
    return { signedUrl: fileUrl, contentType: null };
  }

  try {
    // Parse the S3 URL to get key and bucket type
    const { key, bucketType } = s3StorageService.parseS3Url(fileUrl);

    // Generate signed URL
    const signedUrl = await s3StorageService.getPresignedDownloadUrl(key, bucketType, expiresIn);

    // Determine content type from the key (filename is in the path)
    const ext = path.extname(key).toLowerCase();
    const contentType = getContentTypeFromExtension(ext);

    return { signedUrl, contentType };
  } catch (error) {
    logger.error('Error generating signed URL:', error);
    throw new Error(
      `Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Helper to get content type from file extension
 */
function getContentTypeFromExtension(ext: string): string | null {
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.csv': 'text/csv',
    '.txt': 'text/plain',
    '.zip': 'application/zip',
  };
  return mimeTypes[ext] || null;
}
