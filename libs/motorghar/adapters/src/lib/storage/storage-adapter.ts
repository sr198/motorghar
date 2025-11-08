/**
 * Storage Adapter Interface
 * Abstract interface for object storage (MinIO, S3, etc.)
 */

export interface UploadOptions {
  bucket: string;
  key: string;
  data: Buffer | ReadableStream;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface DownloadOptions {
  bucket: string;
  key: string;
}

export interface DeleteOptions {
  bucket: string;
  key: string;
}

export interface StorageAdapter {
  /**
   * Upload file to storage
   */
  upload(options: UploadOptions): Promise<{ url: string }>;

  /**
   * Download file from storage
   */
  download(options: DownloadOptions): Promise<Buffer>;

  /**
   * Delete file from storage
   */
  delete(options: DeleteOptions): Promise<void>;

  /**
   * Get presigned URL for temporary access
   */
  getPresignedUrl(
    options: DownloadOptions,
    expirySeconds?: number
  ): Promise<string>;

  /**
   * Check if file exists
   */
  exists(options: DownloadOptions): Promise<boolean>;
}

/**
 * Mock storage adapter for testing
 */
export class MockStorageAdapter implements StorageAdapter {
  private storage = new Map<string, Buffer>();

  async upload(options: UploadOptions): Promise<{ url: string }> {
    const key = `${options.bucket}/${options.key}`;
    const buffer =
      options.data instanceof Buffer
        ? options.data
        : Buffer.from('mock-data');
    this.storage.set(key, buffer);
    return { url: `mock://${key}` };
  }

  async download(options: DownloadOptions): Promise<Buffer> {
    const key = `${options.bucket}/${options.key}`;
    const data = this.storage.get(key);
    if (!data) {
      throw new Error('File not found');
    }
    return data;
  }

  async delete(options: DeleteOptions): Promise<void> {
    const key = `${options.bucket}/${options.key}`;
    this.storage.delete(key);
  }

  async getPresignedUrl(
    options: DownloadOptions,
    expirySeconds = 3600
  ): Promise<string> {
    return `mock://${options.bucket}/${options.key}?expiry=${expirySeconds}`;
  }

  async exists(options: DownloadOptions): Promise<boolean> {
    const key = `${options.bucket}/${options.key}`;
    return this.storage.has(key);
  }

  clear(): void {
    this.storage.clear();
  }
}