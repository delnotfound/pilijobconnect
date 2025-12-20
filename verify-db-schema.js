/**
 * Script to verify the database schema is correct
 * Run with: node verify-db-schema.js
 */

const { Pool } = require('@neondatabase/serverless');
require('dotenv').config();

async function verifySchema() {
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
      console.log('\nChecking applications table schema...\n');

      // Check for the columns we care about
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'applications'
        ORDER BY ordinal_position
      `);

      if (result.rows.length === 0) {
        console.error('ERROR: applications table not found!');
        process.exit(1);
      }

      console.log('Applications table columns:');
      console.log('─'.repeat(80));

      const criticalColumns = [
        'submitted_documents',
        'required_documents',
        'sms_notification_sent',
        'middle_name',
        'interview_date',
        'interview_type',
      ];

      result.rows.forEach(row => {
        const isCritical = criticalColumns.includes(row.column_name);
        const marker = isCritical ? '⚠️ ' : '  ';
        const nullable = row.is_nullable === 'YES' ? 'NULLABLE' : 'NOT NULL';
        console.log(`${marker}${row.column_name.padEnd(25)} ${row.data_type.padEnd(20)} ${nullable}`);
      });

      console.log('\n─'.repeat(80));
      console.log('\nIssue check:');
      console.log('─'.repeat(80));

      let hasIssues = false;

      // Check submitted_documents
      const submittedDocs = result.rows.find(r => r.column_name === 'submitted_documents');
      if (!submittedDocs) {
        console.log('❌ submitted_documents column is MISSING');
        hasIssues = true;
      } else if (submittedDocs.data_type === 'boolean') {
        console.log('❌ submitted_documents is BOOLEAN (should be text)');
        hasIssues = true;
      } else if (submittedDocs.data_type === 'text') {
        console.log('✅ submitted_documents is TEXT (correct)');
      } else {
        console.log(`⚠️  submitted_documents is ${submittedDocs.data_type} (should be text)`);
        hasIssues = true;
      }

      // Check required_documents
      const requiredDocs = result.rows.find(r => r.column_name === 'required_documents');
      if (!requiredDocs) {
        console.log('❌ required_documents column is MISSING');
        hasIssues = true;
      } else if (requiredDocs.data_type === 'text') {
        console.log('✅ required_documents is TEXT (correct)');
      }

      // Check sms_notification_sent
      const smsNotif = result.rows.find(r => r.column_name === 'sms_notification_sent');
      if (smsNotif && smsNotif.data_type === 'boolean') {
        console.log('✅ sms_notification_sent is BOOLEAN (correct)');
      }

      console.log('\n' + '─'.repeat(80));
      if (hasIssues) {
        console.log('\n⚠️  Issues found! Please run: node fix-db-schema.js\n');
        process.exit(1);
      } else {
        console.log('\n✅ All critical columns are correctly configured!\n');
        process.exit(0);
      }

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifySchema();
