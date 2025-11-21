import { randomUUID } from 'crypto';
import { storageConfig } from '../config/storage-config';
import {
  type StorageProvider,
  type UploadFileParams,
  type UploadFileResult,
  StorageError,
  UploadError,
} from '../types';

// Helper to get Cloudflare context
async function getR2Bucket() {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const context = await getCloudflareContext();
    return context.env.STORAGE;
  } catch (error) {
    return null;
  }
}

export class R2Provider implements StorageProvider {
  public getProviderName(): string {
    return 'R2';
  }

  public async uploadFile(params: UploadFileParams): Promise<UploadFileResult> {
    try {
      const bucket = await getR2Bucket();
      if (!bucket) {
        throw new StorageError('R2 bucket binding (STORAGE) not found');
      }

      const { file, filename, contentType, folder } = params;
      const uniqueFilename = this.generateUniqueFilename(filename);
      const key = folder ? `${folder}/${uniqueFilename}` : uniqueFilename;

      let fileContent: ArrayBuffer | SharedArrayBuffer | ReadableStream;
      if (file instanceof Blob) {
        fileContent = await file.arrayBuffer();
      } else if (Buffer.isBuffer(file)) {
        // Convert Buffer to ArrayBuffer
        fileContent = file.buffer.slice(
          file.byteOffset,
          file.byteOffset + file.byteLength
        );
      } else {
        throw new UploadError('Invalid file format');
      }

      // @ts-ignore - R2 bucket put expects specific types but types might be mismatched in dev
      await bucket.put(key, fileContent, {
        httpMetadata: { contentType },
      });

      const publicUrl = storageConfig.publicUrl;
      const url = publicUrl 
        ? `${publicUrl.replace(/\/$/, '')}/${key}`
        : `/${key}`; // Fallback relative URL if no public URL configured

      return { url, key };
    } catch (error) {
       const message = error instanceof Error ? error.message : 'Unknown error';
       console.error('R2 upload error:', error);
       throw new UploadError(message);
    }
  }

  public async deleteFile(key: string): Promise<void> {
    try {
      const bucket = await getR2Bucket();
      if (!bucket) {
        throw new StorageError('R2 bucket binding (STORAGE) not found');
      }
      await bucket.delete(key);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new StorageError(message);
    }
  }

  private generateUniqueFilename(originalFilename: string): string {
    const extension = originalFilename.split('.').pop() || '';
    const uuid = randomUUID();
    return `${uuid}${extension ? `.${extension}` : ''}`;
  }
}
