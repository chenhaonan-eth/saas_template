import type { KVNamespace } from '@cloudflare/workers-types';

async function getKVCache() {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const context = await getCloudflareContext();
    return context.env.CACHE as KVNamespace;
  } catch (error) {
    return null;
  }
}

export async function getCache(key: string): Promise<string | null> {
  const kv = await getKVCache();
  if (!kv) return null;
  return kv.get(key);
}

export async function setCache(key: string, value: string, ttlSeconds?: number): Promise<void> {
  const kv = await getKVCache();
  if (!kv) return;
  await kv.put(key, value, ttlSeconds ? { expirationTtl: ttlSeconds } : undefined);
}

export async function deleteCache(key: string): Promise<void> {
  const kv = await getKVCache();
  if (!kv) return;
  await kv.delete(key);
}
