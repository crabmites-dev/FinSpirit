import pool from '../config/db.js';

const mapObjectif = (row) => ({
  id: row.id,
  name: row.name,
  category: row.category,
  description: row.description || row.text || '',
  target: parseFloat(row.target),
  saved: parseFloat(row.saved ?? 0),
  deadline: (row.deadline || row.date)
    ? String(row.deadline || row.date).slice(0, 10)
    : null,
  is_sample: row.is_sample ?? row.is_seed ?? false,
});

export const getObjectifs = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM objectifs WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    return res.json({ objectifs: result.rows.map(mapObjectif) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const addObjectif = async (req, res) => {
  const { name, category, description, target, saved, deadline } = req.body;
  if (!name || !category || target == null) {
    return res.status(400).json({ message: 'Veillez remplir tous les champs obligatoires' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO objectifs (user_id, name, category, description, text, target, saved, deadline, date)
       VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $7) RETURNING *`,
      [req.user.id, name, category, description || '', target, saved || 0, deadline || null]
    );
    return res.status(201).json({ objectif: mapObjectif(result.rows[0]) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const updateObjectif = async (req, res) => {
  const { name, category, description, target, saved, deadline } = req.body;
  try {
    const result = await pool.query(
      `UPDATE objectifs SET name = $1, category = $2, description = $3, text = $3,
       target = $4, saved = $5, deadline = $6, date = $6
       WHERE id = $7 AND user_id = $8 RETURNING *`,
      [name, category, description || '', target, saved ?? 0, deadline || null, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Objectif introuvable' });
    }
    return res.json({ objectif: mapObjectif(result.rows[0]) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const addFunds = async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Montant invalide' });
  }
  try {
    const result = await pool.query(
      `UPDATE objectifs SET saved = saved + $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
      [amount, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Objectif introuvable' });
    }
    return res.json({ objectif: mapObjectif(result.rows[0]) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const deleteObjectif = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM objectifs WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Objectif introuvable' });
    }
    return res.json({ message: 'Objectif supprimé' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};
