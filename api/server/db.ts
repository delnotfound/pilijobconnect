import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import * as schema from "../../shared/schema.js";

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
neonConfig.poolQueryViaFetch = true;

// Don't create the pool immediately - create it lazily
let poolInstance: Pool | null = null;
let dbInstance: any = null;

function initializePool() {
  if (!poolInstance) {
    console.log('[db] Initializing connection pool...');
    poolInstance = new Pool({ 
      connectionString: databaseUrl,
      max: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000,
    });
  }
  return poolInstance;
}

function initializeDb() {
  if (!dbInstance) {
    const p = initializePool();
    dbInstance = drizzle(p, { schema });
  }
  return dbInstance;
}

// Create a proxy that initializes db on first access
export const db = new Proxy({} as any, {
  get: (target, prop) => {
    const actualDb = initializeDb();
    return (actualDb as any)[prop];
  }
});

export const pool = new Proxy({} as any, {
  get: (target, prop) => {
    const actualPool = initializePool();
    return (actualPool as any)[prop];
  }
});
