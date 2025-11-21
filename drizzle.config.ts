import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * https://orm.drizzle.team/docs/get-started/neon-new#step-5---setup-drizzle-config-file
 */
export default defineConfig({
  out: './src/db/migrations',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  // dbCredentials is not needed for D1 local dev with wrangler
});
