import pool from '../config/db.js'

export const addTransaction = async (req, res) => {
    const { title, amount, type, category, date, note } = req.body
    const userId = req.user.id

    if (!title || amount == null || !type || !category || !date) {
        return res.status(400).json({ message: 'Veillez remplir tous les champs' })
    }

    try {
        const newTransaction = await pool.query(
            'INSERT INTO transactions (user_id, title, amount, type, category, date, note) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [userId, title, amount, type, category, date, note || '']
        )

        return res.status(201).json({
            message: 'Transaction ajoutée avec succès',
            transaction: newTransaction.rows[0]
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erreur serveur lors de l\'ajout' })
    }
}

export const getTransaction = async (req, res) => {
    const userId = req.user.id

    try {
        const result = await pool.query(
            'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC NULLS LAST, id DESC',
            [userId]
        )
        return res.json({ transactions: result.rows }) 
    } catch (error) {
        console.error('Une erreur est survenue lors de la récupération', error)
        return res.status(500).json({ message: 'Erreur serveur lors de la récupération' })
    }
}

export const updateTransaction = async (req, res) => {
    const { id } = req.params
    const { title, amount, type, category, date, note } = req.body
    const userId = req.user.id

    try {
        const result = await pool.query(
            `UPDATE transactions SET title = $1, amount = $2, type = $3, category = $4, date = $5, note = $6
             WHERE id = $7 AND user_id = $8 RETURNING *`,
            [title, amount, type, category, date, note || '', id, userId]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Transaction introuvable' })
        }
        return res.json({ transaction: result.rows[0] })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erreur serveur' })
    }
}

export const getSummary = async (req, res) => {
    const userId = req.user.id

    try {
        const result = await pool.query(`
            SELECT
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
            FROM transactions
            WHERE user_id = $1 AND is_sample = false
        `, [userId])

        const income = parseFloat(result.rows[0].total_income)
        const expense = parseFloat(result.rows[0].total_expense)

        return res.json({ income, expense, balance: income - expense })
    } catch (error) {
        console.error('Une erreur est survenue', error)
        return res.status(500).json({ message: 'Erreur serveur' })
    }
}

export const deleteTransaction = async (req, res) => {
    const { id } = req.params
    const userId = req.user.id

    try {
        const result = await pool.query(
            'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, userId]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'La transaction est introuvable ou non autorisée' })
        }

        return res.json({ message: 'Transaction supprimée avec succès' })
    } catch (error) {
        console.error('Une erreur est survenue', error)
        return res.status(500).json({ message: 'Erreur serveur' })
    }
}

export const getExpenseByCategorie = async (req, res) => {
    const userId = req.user.id

    try {
        const result = await pool.query(`
            SELECT category AS name, COALESCE(SUM(amount), 0)::float AS value
            FROM transactions
            WHERE user_id = $1 AND type = 'expense'
            GROUP BY category
            ORDER BY value DESC
        `, [userId])
        return res.json({ categories: result.rows })
    } catch (error) {
        console.error('Une erreur est survenue', error)
        return res.status(500).json({ message: 'Erreur serveur' })
    }
}
