import { drizzle } from 'drizzle-orm/d1';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// We need to dynamically import getCloudflareContext to avoid issues in Node.js environment
// where @opennextjs/cloudflare might not be fully compatible or needed
async function getCloudflareEnv() {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const context = await getCloudflareContext();
    return context.env;
  } catch (error) {
    return null;
  }
}

export async function getDb() {
  const env = await getCloudflareEnv();
  
  if (env && env.DB) {
    return drizzle(env.DB, { schema });
  }

  // Fallback for local development (Node.js scripts, etc.)
  // This creates/uses a local.db file in the project root
  const sqlite = new Database('local.db');
  return drizzleSqlite(sqlite, { schema });
}
