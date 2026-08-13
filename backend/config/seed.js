import pool from './db.js'

export const seedData = async (userId) => {
    const today = new Date().toISOString().slice(0, 10)
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const txCheck = await pool.query(
        'SELECT id FROM transactions WHERE user_id = $1 AND is_sample = true LIMIT 1',
        [userId]
    )
    if (txCheck.rows.length === 0) {
        await pool.query(`
            INSERT INTO transactions (user_id, title, amount, type, category, date, note, is_sample) VALUES
            ($1, 'Salaire mensuel',        450000, 'income',  'Salaire',     $2, 'Virement entreprise', true),
            ($1, 'Freelance web',          120000, 'income',  'Freelance',   $3, 'Projet client',        true),
            ($1, 'Courses alimentaires',    35000, 'expense', 'Nourriture',  $2, 'Supermarché',          true),
            ($1, 'Transport taxi',           8500, 'expense', 'Transport',   $2, '',                     true),
            ($1, 'Abonnement Netflix',       7000, 'expense', 'Loisirs',     $3, '',                     true),
            ($1, 'Pharmacie',               12000, 'expense', 'Santé',       $2, '',                     true),
            ($1, 'Restaurant avec amis',    18000, 'expense', 'Loisirs',     $2, '',                     true)
        `, [userId, today, lastMonth])
    }

    const budgetCheck = await pool.query(
        'SELECT id FROM budgets WHERE user_id = $1 AND is_sample = true LIMIT 1',
        [userId]
    )
    if (budgetCheck.rows.length === 0) {
        await pool.query(`
            INSERT INTO budgets (user_id, name, category, budget_limit, spend, spent, is_sample) VALUES
            ($1, 'Courses mensuelles', 'Courses',   50000, 35000, 35000, true),
            ($1, 'Transport',          'Transport', 20000,  8500,  8500,  true),
            ($1, 'Loisirs',            'Loisirs',   30000, 25000, 25000, true)
        `, [userId])
    }

    const objCheck = await pool.query(
        'SELECT id FROM objectifs WHERE user_id = $1 AND is_sample = true LIMIT 1',
        [userId]
    )
    if (objCheck.rows.length === 0) {
        await pool.query(`
            INSERT INTO objectifs (user_id, name, category, description, text, target, saved, deadline, date, is_sample) VALUES
            ($1, 'Voyage à Paris',  'Voyage',  'Vacances été 2027', 'Vacances été 2027', 500000, 120000, '2027-06-01', '2027-06-01', true),
            ($1, 'Fonds d''urgence', 'Urgence', '3 mois de charges', '3 mois de charges', 300000, 180000, null, null, true)
        `, [userId])
    }

    const echCheck = await pool.query(
        'SELECT id FROM echeances WHERE user_id = $1 AND is_sample = true LIMIT 1',
        [userId]
    )
    if (echCheck.rows.length === 0) {
        await pool.query(`
            INSERT INTO echeances (user_id, name, category, amount, due_date, frequency, paid, note, reminder, is_sample) VALUES
            ($1, 'Loyer',           'Loyer',       250000, $2, 'monthly', false, 'Virement bancaire', true, true),
            ($1, 'Internet Orange', 'Internet',     25000, $2, 'monthly', false, 'Orange Fibre',      true, true),
            ($1, 'Électricité',     'Électricité',  18000, $2, 'monthly', false, 'SENELEC',           true, true)
        `, [userId, today])
    }

    console.log(`✅ Données d'exemple vérifiées pour user ${userId}`)
}

export const deleteSampleData = async (userId) => {
    await pool.query('DELETE FROM transactions WHERE user_id = $1 AND is_sample = true', [userId])
    await pool.query('DELETE FROM budgets WHERE user_id = $1 AND (is_sample = true OR is_seed = true)', [userId])
    await pool.query('DELETE FROM objectifs WHERE user_id = $1 AND (is_sample = true OR is_seed = true)', [userId])
    await pool.query('DELETE FROM echeances WHERE user_id = $1 AND is_sample = true', [userId])
}

export const hasSampleData = async (userId) => {
    const result = await pool.query(`
        SELECT EXISTS (
            SELECT 1 FROM transactions WHERE user_id = $1 AND is_sample = true
            UNION ALL
            SELECT 1 FROM budgets WHERE user_id = $1 AND (is_sample = true OR is_seed = true)
            UNION ALL
            SELECT 1 FROM objectifs WHERE user_id = $1 AND (is_sample = true OR is_seed = true)
            UNION ALL
            SELECT 1 FROM echeances WHERE user_id = $1 AND is_sample = true
        ) AS has_sample
    `, [userId])
    return result.rows[0].has_sample
}
