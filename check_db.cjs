const fs = require('fs');
const Database = require('better-sqlite3');
const dbPath = './pili_jobs.db';

if (!fs.existsSync(dbPath)) {
  console.log('DB_FILE_NOT_FOUND');
  process.exit(0);
}

try {
  const db = new Database(dbPath, { readonly: true });
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';").all();
  if (!tables || tables.length === 0) {
    console.log('NO_TABLES_FOUND');
  } else {
    console.log('TABLE_COUNTS');
    for (const t of tables) {
      try {
        const r = db.prepare(`SELECT COUNT(*) AS c FROM "${t.name}"`).get();
        console.log(`${t.name}: ${r.c}`);
      } catch (err) {
        console.log(`${t.name}: ERROR (${err.message})`);
      }
    }
  }
  db.close();
} catch (err) {
  console.error('ERROR_OPENING_DB', err.message);
}
