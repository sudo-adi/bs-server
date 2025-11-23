import { createClient } from '@supabase/supabase-js';
import type { IStorageProvider } from '../storage.types';

export class SupabaseStorageProvider implements IStorageProvider {
  private client;
  private bucket: string;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    this.bucket = process.env.SUPABASE_BUCKET || 'documents';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    this.client = createClient(supabaseUrl, supabaseKey);
  }

  async upload(file: Buffer, path: string, contentType?: string): Promise<string> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (error) throw new Error(`Supabase upload failed: ${error.message}`);

    return await this.getUrl(path);
  }

  async delete(path: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([path]);

    if (error) throw new Error(`Supabase delete failed: ${error.message}`);
  }

  async getUrl(path: string): Promise<string> {
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}
