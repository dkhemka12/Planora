import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from './postgres.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initializes the PostgreSQL database schema (Users & Subjects tables).
 * Reads schema.sql and runs statements idempotently.
 */
export const initPostgres = async () => {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  try {
    console.log('🐘 Initializing PostgreSQL schema...');
    await query(schemaSql);
    console.log('✅ PostgreSQL tables (users, subjects) and indexes created/verified successfully.');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL Schema Initialization Error:', error.message);
    throw error;
  }
};

// If run directly from command line: node server/config/initPostgres.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initPostgres()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await pool.end();
      process.exit(1);
    });
}
