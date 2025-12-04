import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import * as schema from "@shared/schema";

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Validate the URL format
try {
  new URL(databaseUrl);
} catch (error) {
  console.error('Invalid DATABASE_URL format:', databaseUrl);
  throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
}

// Configure for serverless environment
// In Vercel serverless, we use fetch-based connections instead of WebSocket
neonConfig.poolQueryViaFetch = true;

// Create pool with serverless-optimized settings
export const pool = new Pool({ 
  connectionString: databaseUrl,
  max: 1, // Limit connections in serverless
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, // Increased from 10s to 30s
});

export const db = drizzle(pool, { schema });
