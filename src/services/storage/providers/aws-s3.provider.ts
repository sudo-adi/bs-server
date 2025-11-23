import type { IStorageProvider } from '../storage.types';

// Placeholder for AWS S3 implementation
export class AWSS3StorageProvider implements IStorageProvider {
  constructor() {
    // TODO: Initialize AWS S3 client when needed
    console.log('AWS S3 provider not yet implemented');
  }

  async upload(file: Buffer, path: string, contentType?: string): Promise<string> {
    throw new Error('AWS S3 upload not implemented yet');
  }

  async delete(path: string): Promise<void> {
    throw new Error('AWS S3 delete not implemented yet');
  }

  async getUrl(path: string): Promise<string> {
    throw new Error('AWS S3 getUrl not implemented yet');
  }
}
