import { env } from '@/config/env';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// Storage directory - can be configured via env
const STORAGE_DIR = env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const BASE_URL = env.BASE_URL || 'http://localhost:3000';

/**
 * Initialize storage directory
 */
async function ensureStorageDir(): Promise<void> {
  try {
    await fs.access(STORAGE_DIR);
  } catch {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  }
}

export async function uploadFile(file: Buffer, filename: string): Promise<string> {
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
    return publicUrl;
  } catch (error) {
    throw new Error(
      `File upload error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    // Extract filename from URL
    const url = new URL(fileUrl);
    const filename = path.basename(url.pathname);
    const filePath = path.join(STORAGE_DIR, filename);

    // Delete file
    await fs.unlink(filePath);
  } catch (error) {
    throw new Error(
      `File delete error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export function getFilePathFromUrl(fileUrl: string): string {
  const url = new URL(fileUrl);
  const filename = path.basename(url.pathname);
  return path.join(STORAGE_DIR, filename);
}
