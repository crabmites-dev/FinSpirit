import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL manquant dans backend/.env');
    process.exit(1);
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  try {
    await pool.query(schema);
    console.log('✅ Schéma créé avec succès sur Neon PostgreSQL');
  } catch (err) {
    console.error('❌ Erreur lors de la création du schéma :', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDb();
