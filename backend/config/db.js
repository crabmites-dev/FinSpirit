import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

pool.on('connect', () => {
  console.log('Connecte a la base de donnee');
});

pool.on('error', (err) => {
  console.error('Erreur de base de donnee', err);
});

export default pool;
