import pool from '../config/db.js';

const mapBudget = (row) => ({
  id: row.id,
  name: row.name,
  category: row.category,
  limit: parseFloat(row.budget_limit),
  spent: parseFloat(row.spent ?? row.spend ?? 0),
  is_sample: row.is_sample ?? row.is_seed ?? false,
});

export const getBudgets = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM budgets WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    return res.json({ budgets: result.rows.map(mapBudget) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const addBudget = async (req, res) => {
  const { name, category, limit, spent } = req.body;
  if (!name || !category || limit == null) {
    return res.status(400).json({ message: 'Veillez remplir tous les champs obligatoires' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO budgets (user_id, name, category, budget_limit, spend, spent) VALUES ($1, $2, $3, $4, $5, $5) RETURNING *',
      [req.user.id, name, category, limit, spent || 0]
    );
    return res.status(201).json({ budget: mapBudget(result.rows[0]) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const updateBudget = async (req, res) => {
  const { name, category, limit, spent } = req.body;
  try {
    const result = await pool.query(
      `UPDATE budgets SET name = $1, category = $2, budget_limit = $3, spend = $4, spent = $4
       WHERE id = $5 AND user_id = $6 RETURNING *`,
      [name, category, limit, spent ?? 0, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Budget introuvable' });
    }
    return res.json({ budget: mapBudget(result.rows[0]) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Budget introuvable' });
    }
    return res.json({ message: 'Budget supprimé' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};
