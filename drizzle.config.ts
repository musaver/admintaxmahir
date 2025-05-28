import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/schema.ts',
  out: './drizzle',
  dialect: 'mysql', // ✅ FIXED: use driver not dialect
  dbCredentials: {
    host: '109.106.254.201',
    port: 3306,
    user: 'u970484384_yl',
    password: 'oUoa1OaN]1',
    database: 'u970484384_yl',
  },
} satisfies Config;
