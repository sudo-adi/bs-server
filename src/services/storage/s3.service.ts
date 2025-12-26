import { env } from '@/config/env';
import logger from '@/config/logger';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import path from 'path';

export enum S3BucketType {
  DOCUMENTS = 'documents',
  PROFILES = 'profiles',
  CERTIFICATES = 'certificates',
}

export enum S3FolderType {
  // Profile-related folders
  PROFILE_PHOTOS = 'profile-photos',
  PROFILE_DOCUMENTS = 'profile-documents',
  KYC_DOCUMENTS = 'kyc-documents',
  // Project-related folders
  PROJECT_DOCUMENTS = 'project-documents',
  PROJECT_CONTRACTS = 'project-contracts',
  // Certificate-related folders
  TRAINING_CERTIFICATES = 'training-certificates',
  SKILL_CERTIFICATES = 'skill-certificates',
  // General folders
  TEMP = 'temp',
}

interface UploadResult {
  url: string;
  key: string;
  bucket: string;
  contentType: string;
  size: number;
}

interface PresignedUrlResult {
  uploadUrl: string;
  downloadUrl: string;
  key: string;
  expiresIn: number;
}

class S3StorageService {
  private client: S3Client | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
      logger.warn('AWS S3 credentials not configured. S3 storage will be unavailable.');
      this.isConfigured = false;
      return;
    }

    const config: {
      region: string;
      credentials: { accessKeyId: string; secretAccessKey: string };
      endpoint?: string;
      forcePathStyle?: boolean;
    } = {
      region: env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    };

    // Support for custom S3-compatible endpoints (e.g., MinIO, LocalStack)
    if (env.AWS_S3_ENDPOINT) {
      config.endpoint = env.AWS_S3_ENDPOINT;
      config.forcePathStyle = true;
    }

    this.client = new S3Client(config);
    this.isConfigured = true;
    logger.info('AWS S3 client initialized successfully');
  }

  private getBucketName(bucketType: S3BucketType): string {
    switch (bucketType) {
      case S3BucketType.DOCUMENTS:
        return env.AWS_S3_BUCKET_DOCUMENTS || 'buildsewa-documents';
      case S3BucketType.PROFILES:
        return env.AWS_S3_BUCKET_PROFILES || 'buildsewa-profiles';
      case S3BucketType.CERTIFICATES:
        return env.AWS_S3_BUCKET_CERTIFICATES || 'buildsewa-certificates';
      default:
        throw new Error(`Unknown bucket type: ${bucketType}`);
    }
  }

  private generateKey(folder: S3FolderType, filename: string, profileId?: string): string {
    const ext = path.extname(filename);
    const uniqueFilename = `${randomUUID()}${ext}`;
    const datePath = new Date().toISOString().slice(0, 10).replace(/-/g, '/'); // YYYY/MM/DD

    if (profileId) {
      return `${folder}/${profileId}/${datePath}/${uniqueFilename}`;
    }
    return `${folder}/${datePath}/${uniqueFilename}`;
  }

  private getContentType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.csv': 'text/csv',
      '.txt': 'text/plain',
      '.zip': 'application/zip',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  public isAvailable(): boolean {
    return this.isConfigured && this.client !== null;
  }

  public async uploadFile(
    file: Buffer,
    filename: string,
    bucketType: S3BucketType,
    folder: S3FolderType,
    profileId?: string
  ): Promise<UploadResult> {
    if (!this.isAvailable()) {
      throw new Error('S3 storage is not configured. Please set AWS credentials.');
    }

    const bucket = this.getBucketName(bucketType);
    const key = this.generateKey(folder, filename, profileId);
    const contentType = this.getContentType(filename);

    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
        Metadata: {
          originalFilename: filename,
          uploadedAt: new Date().toISOString(),
          ...(profileId && { profileId }),
        },
      });

      await this.client!.send(command);

      // Construct the public URL
      const url = env.AWS_S3_ENDPOINT
        ? `${env.AWS_S3_ENDPOINT}/${bucket}/${key}`
        : `https://${bucket}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

      logger.info(`File uploaded successfully to S3: ${key}`);

      return {
        url,
        key,
        bucket,
        contentType,
        size: file.length,
      };
    } catch (error) {
      logger.error('S3 upload error:', error);
      throw new Error(
        `Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public async deleteFile(key: string, bucketType: S3BucketType): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('S3 storage is not configured. Please set AWS credentials.');
    }

    const bucket = this.getBucketName(bucketType);

    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await this.client!.send(command);
      logger.info(`File deleted successfully from S3: ${key}`);
    } catch (error) {
      logger.error('S3 delete error:', error);
      throw new Error(
        `Failed to delete file from S3: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public async deleteFileByUrl(url: string): Promise<void> {
    const { key, bucketType } = this.parseS3Url(url);
    await this.deleteFile(key, bucketType);
  }

  public parseS3Url(url: string): { key: string; bucket: string; bucketType: S3BucketType } {
    try {
      const urlObj = new URL(url);
      let bucket: string;
      let key: string;

      if (urlObj.hostname.includes('.s3.')) {
        // Standard AWS S3 URL: https://bucket-name.s3.region.amazonaws.com/key
        bucket = urlObj.hostname.split('.s3.')[0];
        key = urlObj.pathname.slice(1); // Remove leading slash
      } else if (env.AWS_S3_ENDPOINT) {
        // Custom endpoint URL: https://endpoint/bucket/key
        const pathParts = urlObj.pathname.slice(1).split('/');
        bucket = pathParts[0];
        key = pathParts.slice(1).join('/');
      } else {
        throw new Error('Invalid S3 URL format');
      }

      // Determine bucket type
      let bucketType: S3BucketType;
      if (bucket === env.AWS_S3_BUCKET_PROFILES) {
        bucketType = S3BucketType.PROFILES;
      } else if (bucket === env.AWS_S3_BUCKET_DOCUMENTS) {
        bucketType = S3BucketType.DOCUMENTS;
      } else if (bucket === env.AWS_S3_BUCKET_CERTIFICATES) {
        bucketType = S3BucketType.CERTIFICATES;
      } else {
        bucketType = S3BucketType.DOCUMENTS; // Default
      }

      return { key, bucket, bucketType };
    } catch (error) {
      throw new Error(`Failed to parse S3 URL: ${url}`);
    }
  }

  public async getPresignedUploadUrl(
    filename: string,
    bucketType: S3BucketType,
    folder: S3FolderType,
    profileId?: string,
    expiresIn: number = 3600
  ): Promise<PresignedUrlResult> {
    if (!this.isAvailable()) {
      throw new Error('S3 storage is not configured. Please set AWS credentials.');
    }

    const bucket = this.getBucketName(bucketType);
    const key = this.generateKey(folder, filename, profileId);
    const contentType = this.getContentType(filename);

    try {
      const uploadCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        Metadata: {
          originalFilename: filename,
          uploadedAt: new Date().toISOString(),
          ...(profileId && { profileId }),
        },
      });

      const downloadCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const uploadUrl = await getSignedUrl(this.client!, uploadCommand, { expiresIn });
      const downloadUrl = await getSignedUrl(this.client!, downloadCommand, { expiresIn });

      return {
        uploadUrl,
        downloadUrl,
        key,
        expiresIn,
      };
    } catch (error) {
      logger.error('Error generating presigned URL:', error);
      throw new Error(
        `Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public async getPresignedDownloadUrl(
    key: string,
    bucketType: S3BucketType,
    expiresIn: number = 3600
  ): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('S3 storage is not configured. Please set AWS credentials.');
    }

    const bucket = this.getBucketName(bucketType);

    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      return await getSignedUrl(this.client!, command, { expiresIn });
    } catch (error) {
      logger.error('Error generating presigned download URL:', error);
      throw new Error(
        `Failed to generate presigned download URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public async fileExists(key: string, bucketType: S3BucketType): Promise<boolean> {
    if (!this.isAvailable()) {
      throw new Error('S3 storage is not configured. Please set AWS credentials.');
    }

    const bucket = this.getBucketName(bucketType);

    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await this.client!.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  public async listFiles(
    prefix: string,
    bucketType: S3BucketType,
    maxKeys: number = 100
  ): Promise<{ key: string; size: number; lastModified: Date }[]> {
    if (!this.isAvailable()) {
      throw new Error('S3 storage is not configured. Please set AWS credentials.');
    }

    const bucket = this.getBucketName(bucketType);

    try {
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const response = await this.client!.send(command);

      return (
        response.Contents?.map((item) => ({
          key: item.Key || '',
          size: item.Size || 0,
          lastModified: item.LastModified || new Date(),
        })) || []
      );
    } catch (error) {
      logger.error('Error listing files:', error);
      throw new Error(
        `Failed to list files from S3: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Convenience methods for specific use cases
  public async uploadProfilePhoto(
    file: Buffer,
    filename: string,
    profileId: string
  ): Promise<UploadResult> {
    return this.uploadFile(
      file,
      filename,
      S3BucketType.PROFILES,
      S3FolderType.PROFILE_PHOTOS,
      profileId
    );
  }

  public async uploadProfileDocument(
    file: Buffer,
    filename: string,
    profileId: string
  ): Promise<UploadResult> {
    return this.uploadFile(
      file,
      filename,
      S3BucketType.DOCUMENTS,
      S3FolderType.PROFILE_DOCUMENTS,
      profileId
    );
  }

  public async uploadKycDocument(
    file: Buffer,
    filename: string,
    profileId: string
  ): Promise<UploadResult> {
    return this.uploadFile(
      file,
      filename,
      S3BucketType.DOCUMENTS,
      S3FolderType.KYC_DOCUMENTS,
      profileId
    );
  }

  public async uploadProjectDocument(
    file: Buffer,
    filename: string,
    projectId: string
  ): Promise<UploadResult> {
    return this.uploadFile(
      file,
      filename,
      S3BucketType.DOCUMENTS,
      S3FolderType.PROJECT_DOCUMENTS,
      projectId
    );
  }

  public async uploadTrainingCertificate(
    file: Buffer,
    filename: string,
    profileId: string
  ): Promise<UploadResult> {
    return this.uploadFile(
      file,
      filename,
      S3BucketType.CERTIFICATES,
      S3FolderType.TRAINING_CERTIFICATES,
      profileId
    );
  }

  public async uploadSkillCertificate(
    file: Buffer,
    filename: string,
    profileId: string
  ): Promise<UploadResult> {
    return this.uploadFile(
      file,
      filename,
      S3BucketType.CERTIFICATES,
      S3FolderType.SKILL_CERTIFICATES,
      profileId
    );
  }
}

// Export singleton instance
export const s3StorageService = new S3StorageService();
