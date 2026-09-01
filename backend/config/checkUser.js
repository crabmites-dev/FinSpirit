import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import pool from './db.js';

dotenv.config();

const email = process.argv[2] || 'mmbow6355@gmail.com';
const password = process.argv[3] || 'Barclays02@';

const result = await pool.query(
  'SELECT id, email, username, password FROM users WHERE LOWER(email) = $1',
  [email.toLowerCase()]
);

if (result.rows.length === 0) {
  console.log('Utilisateur introuvable:', email);
  await pool.end();
  process.exit(0);
}

const user = result.rows[0];
const match = await bcrypt.compare(password, user.password);

console.log({ id: user.id, email: user.email, username: user.username, passwordMatch: match });

await pool.end();
