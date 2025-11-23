import type { IStorageProvider } from './storage.types';
import { SupabaseStorageProvider } from './providers/supabase.provider';
import { AWSS3StorageProvider } from './providers/aws-s3.provider';

export class StorageService {
  private provider: IStorageProvider;

  constructor() {
    const providerType = process.env.STORAGE_PROVIDER || 'supabase';
    this.provider = this.getProvider(providerType);
  }

  private getProvider(type: string): IStorageProvider {
    switch (type.toLowerCase()) {
      case 'aws':
      case 's3':
        return new AWSS3StorageProvider();
      case 'supabase':
      default:
        return new SupabaseStorageProvider();
    }
  }

  async upload(file: Buffer, path: string, contentType?: string): Promise<string> {
    return this.provider.upload(file, path, contentType);
  }

  async delete(path: string): Promise<void> {
    return this.provider.delete(path);
  }

  async getUrl(path: string): Promise<string> {
    return this.provider.getUrl(path);
  }
}

export default new StorageService();
