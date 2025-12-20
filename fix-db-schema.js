/**
 * Script to apply database schema fixes for document submission
 * Run with: node fix-db-schema.js
 */

const { Pool } = require('@neondatabase/serverless');
require('dotenv').config();

const fs = require('fs');
const path = require('path');

async function applyMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();

    try {
      console.log('Reading migration file...');
      const migrationSQL = fs.readFileSync(
        path.join(__dirname, 'migrations', '0001_fix_applications_schema.sql'),
        'utf8'
      );

      console.log('Applying migration...');
      await client.query(migrationSQL);

      console.log('✅ Migration applied successfully!');
      console.log('The applications table has been fixed with the correct column types.');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration();
