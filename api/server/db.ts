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
neonConfig.poolQueryViaFetch = true;

// Don't create the pool immediately - create it lazily
let pool: Pool | null = null;
let db: any = null;

function initializePool() {
  if (!pool) {
    console.log('[db] Initializing connection pool...');
    pool = new Pool({ 
      connectionString: databaseUrl,
      max: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000,
    });
  }
  return pool;
}

function initializeDb() {
  if (!db) {
    const p = initializePool();
    db = drizzle(p, { schema });
  }
  return db;
}

// Export getters that initialize on first use
export const getPool = () => initializePool();
export const getDb = () => initializeDb();

// For backward compatibility - these will trigger lazy initialization
Object.defineProperty(globalThis, '__db__', {
  value: null,
  writable: true,
  configurable: true
});

// Create a proxy object that initializes db on access
export const db = new Proxy({}, {
  get: (target, prop) => {
    const actualDb = initializeDb();
    return (actualDb as any)[prop];
  }
});

export const pool = new Proxy({}, {
  get: (target, prop) => {
    const actualPool = initializePool();
    return (actualPool as any)[prop];
  }
});
