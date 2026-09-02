import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();

async function columnExists(table, column) {
  const res = await pool.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_name = $1 AND column_name = $2`,
    [table, column]
  );
  return res.rows.length > 0;
}

async function renameColumnIfExists(table, from, to) {
  if (await columnExists(table, from) && !(await columnExists(table, to))) {
    await pool.query(`ALTER TABLE ${table} RENAME COLUMN ${from} TO ${to}`);
    console.log(`  ✓ ${table}.${from} → ${to}`);
  }
}

async function addColumnIfMissing(table, column, definition) {
  if (!(await columnExists(table, column))) {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`  ✓ ${table}.${column} ajouté`);
  }
}

async function migrate() {
  if (!process.env.DATABASE_URL && !process.env.DB_NAME) {
    console.error('❌ Config DB manquante (DATABASE_URL ou DB_NAME)');
    process.exit(1);
  }

  console.log('🔄 Migration de la base Neon...\n');

  // ── Tables de base (si absentes) ──
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      type VARCHAR(20) NOT NULL,
      category VARCHAR(100) NOT NULL,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      note TEXT DEFAULT '',
      is_sample BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS budgets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      budget_limit DECIMAL(12, 2) NOT NULL DEFAULT 0,
      spent DECIMAL(12, 2) DEFAULT 0,
      is_sample BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS objectifs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description TEXT DEFAULT '',
      target DECIMAL(12, 2) NOT NULL,
      saved DECIMAL(12, 2) DEFAULT 0,
      deadline DATE,
      is_sample BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS echeances (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      due_date DATE NOT NULL,
      frequency VARCHAR(20) DEFAULT 'monthly',
      paid BOOLEAN DEFAULT false,
      note TEXT DEFAULT '',
      reminder BOOLEAN DEFAULT true,
      is_sample BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // ── Corriger anciennes colonnes ──
  console.log('Correction des colonnes existantes...');

  for (const table of ['users', 'transactions', 'budgets', 'objectifs', 'echeances']) {
    await renameColumnIfExists(table, 'create_at', 'created_at');
  }

  // Ancien schéma : userId au lieu de user_id
  for (const table of ['transactions', 'budgets', 'objectifs', 'echeances']) {
    await renameColumnIfExists(table, 'userid', 'user_id');
    await renameColumnIfExists(table, 'userId', 'user_id');
  }

  // budgets : synchroniser spend → spent
  if (await columnExists('budgets', 'spend')) {
    await pool.query('UPDATE budgets SET spent = COALESCE(spent, spend, 0)');
    await pool.query('ALTER TABLE budgets ALTER COLUMN spend DROP NOT NULL');
    console.log('  ✓ budgets.spent synchronisé depuis spend');
  }

  // is_seed → is_sample
  for (const table of ['budgets', 'objectifs']) {
    if (await columnExists(table, 'is_seed')) {
      await pool.query(`UPDATE ${table} SET is_sample = COALESCE(is_sample, is_seed, false)`);
      console.log(`  ✓ ${table}.is_seed → is_sample`);
    }
  }

  // objectifs : text → description, date reste la deadline
  if (await columnExists('objectifs', 'text')) {
    await pool.query(`UPDATE objectifs SET description = COALESCE(NULLIF(description, ''), text, '')`);
    console.log('  ✓ objectifs.text → description');
  }

  await addColumnIfMissing('objectifs', 'deadline', 'DATE');
  if (await columnExists('objectifs', 'date')) {
    await pool.query('UPDATE objectifs SET deadline = COALESCE(deadline, date)');
    console.log('  ✓ objectifs.date → deadline');
  }

  // Colonnes manquantes sur transactions
  await addColumnIfMissing('transactions', 'note', "TEXT DEFAULT ''");
  await addColumnIfMissing('transactions', 'is_sample', 'BOOLEAN DEFAULT false');
  await addColumnIfMissing('transactions', 'created_at', 'TIMESTAMP DEFAULT NOW()');

  // Colonnes manquantes sur budgets
  await addColumnIfMissing('budgets', 'budget_limit', 'DECIMAL(12,2) DEFAULT 0');
  await addColumnIfMissing('budgets', 'spent', 'DECIMAL(12,2) DEFAULT 0');
  await addColumnIfMissing('budgets', 'is_sample', 'BOOLEAN DEFAULT false');
  await addColumnIfMissing('budgets', 'created_at', 'TIMESTAMP DEFAULT NOW()');

  // Colonnes manquantes sur objectifs
  await addColumnIfMissing('objectifs', 'description', "TEXT DEFAULT ''");
  await addColumnIfMissing('objectifs', 'is_sample', 'BOOLEAN DEFAULT false');
  await addColumnIfMissing('objectifs', 'created_at', 'TIMESTAMP DEFAULT NOW()');

  // Colonnes manquantes sur echeances
  await addColumnIfMissing('echeances', 'paid', 'BOOLEAN DEFAULT false');
  await addColumnIfMissing('echeances', 'note', "TEXT DEFAULT ''");
  await addColumnIfMissing('echeances', 'reminder', 'BOOLEAN DEFAULT true');
  await addColumnIfMissing('echeances', 'is_sample', 'BOOLEAN DEFAULT false');
  await addColumnIfMissing('echeances', 'created_at', 'TIMESTAMP DEFAULT NOW()');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_codes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      code_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_reset_codes_email ON password_reset_codes(email)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('success', 'error', 'warning', 'info')),
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)
  `);

  // ── Seed pour utilisateurs sans données ──
  const { seedData } = await import('./seed.js');
  const users = await pool.query('SELECT id FROM users');
  for (const user of users.rows) {
    const sampleCheck = await pool.query(
      'SELECT id FROM transactions WHERE user_id = $1 AND is_sample = true LIMIT 1',
      [user.id]
    );
    if (sampleCheck.rows.length === 0) {
      await seedData(user.id);
      console.log(`  ✓ Données d'exemple créées pour user ${user.id}`);
    }
  }

  console.log('\n✅ Migration terminée avec succès !');
  await pool.end();
}

migrate().catch((err) => {
  console.error('❌ Erreur migration :', err.message);
  process.exit(1);
});
