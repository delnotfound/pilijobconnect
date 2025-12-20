// Simple script to start locally with SQLite
import fs from 'fs';

// Create a simple .env for local development
const envContent = `DATABASE_URL=sqlite:./pili_jobs.db
NODE_ENV=development
PORT=5000`;

if (!fs.existsSync('.env')) {
  fs.writeFileSync('.env', envContent);
  console.log('Created .env file for local development');
}

// Switch to local database configuration
if (fs.existsSync('server/db.local.ts')) {
  fs.copyFileSync('server/db.ts', 'server/db.backup.ts');
  fs.copyFileSync('server/db.local.ts', 'server/db.ts');
  console.log('Switched to SQLite database for local development');
}

console.log('Local development setup complete!');
console.log('Run: npm run dev');