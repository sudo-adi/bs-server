export interface IStorageProvider {
  upload(file: Buffer, path: string, contentType?: string): Promise<string>;
  delete(path: string): Promise<void>;
  getUrl(path: string): Promise<string>;
}

export interface UploadOptions {
  contentType?: string;
  makePublic?: boolean;
}
