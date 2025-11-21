import { websiteConfig } from '@/config/website';
import { storageConfig } from './config/storage-config';
import { S3Provider } from './provider/s3';
import { R2Provider } from './provider/r2';
import type { StorageConfig, StorageProvider, UploadFileResult } from './types';

/**
 * Default storage configuration
 */
export const defaultStorageConfig: StorageConfig = storageConfig;

/**
 * Global storage provider instance
 */
let storageProvider: StorageProvider | null = null;

/**
 * Get the storage provider
 * @returns current storage provider instance
 * @throws Error if provider is not initialized
 */
export const getStorageProvider = (): StorageProvider => {
  if (!storageProvider) {
    return initializeStorageProvider();
  }
  return storageProvider;
};

/**
 * Initialize the storage provider
 * @returns initialized storage provider
 */
export const initializeStorageProvider = (): StorageProvider => {
  if (!storageProvider) {
    // Check if we are running in Cloudflare Workers (R2)
    // For now, we can use a simple check or rely on configuration
    // If websiteConfig.storage.provider is 'r2', use R2Provider
    // Or if we detect we are in a worker environment and want to prefer R2
    
    if (websiteConfig.storage.provider === 's3') {
       // If configured as S3 but we want to use native R2 in Cloudflare
       // We can check if we have the binding, or just stick to S3 provider (which uses s3mini)
       // But the user requested native R2.
       // Let's assume we update the config or just default to R2 if binding exists?
       // Safer to stick to config.
       storageProvider = new S3Provider();
    } else if (websiteConfig.storage.provider === 'r2') {
       storageProvider = new R2Provider();
    } else {
       // Default to S3 for now if not specified, or throw
       // But let's try to use R2 if we are in Cloudflare
       storageProvider = new R2Provider();
    }
  }
  return storageProvider;
};

/**
 * Uploads a file to the configured storage provider
 *
 * @param file - The file to upload (Buffer or Blob)
 * @param filename - Original filename with extension
 * @param contentType - MIME type of the file
 * @param folder - Optional folder path to store the file in
 * @returns Promise with the URL of the uploaded file and its storage key
 */
export const uploadFile = async (
  file: Buffer | Blob,
  filename: string,
  contentType: string,
  folder?: string
): Promise<UploadFileResult> => {
  const provider = getStorageProvider();
  return provider.uploadFile({ file, filename, contentType, folder });
};

/**
 * Deletes a file from the storage provider
 *
 * @param key - The storage key of the file to delete
 * @returns Promise that resolves when the file is deleted
 */
export const deleteFile = async (key: string): Promise<void> => {
  const provider = getStorageProvider();
  return provider.deleteFile(key);
};
