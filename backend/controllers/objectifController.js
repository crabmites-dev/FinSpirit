import pool from '../config/db.js';
import * as notificationController from './notificationController.js';

const mapObjectif = (row) => ({
  id: row.id,
  name: row.name,
  category: row.category,
  description: row.description || '',
  target: parseFloat(row.target),
  saved: parseFloat(row.saved ?? 0),
  deadline: row.deadline ? String(row.deadline).slice(0, 10) : null,
  is_sample: row.is_sample ?? false,
});

export const getObjectifs = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM objectifs WHERE user_id = $1 ORDER BY created_at DESC NULLS LAST, id DESC',
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
      `INSERT INTO objectifs (user_id, name, category, description, target, saved, deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, name, category, description || '', target, saved || 0, deadline || null]
    );

    await notificationController.createNotification(
      req.user.id,
      'Objectif ajouté',
      `Objectif "${name}" créé`,
      'success'
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
      `UPDATE objectifs SET name = $1, category = $2, description = $3,
       target = $4, saved = $5, deadline = $6
       WHERE id = $7 AND user_id = $8 RETURNING *`,
      [name, category, description || '', target, saved ?? 0, deadline || null, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Objectif introuvable' });
    }

    const percent = target > 0 ? (saved / target) * 100 : 0;
    if (percent >= 80 && percent < 100) {
      await notificationController.createNotification(
        req.user.id,
        'Objectif en cours',
        `${name} est à ${Math.round(percent)}% de son objectif`,
        'info'
      );
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
    const objectif = result.rows[0];
    const percent = Number(objectif.target) > 0 ? (Number(objectif.saved) / Number(objectif.target)) * 100 : 0;
    if (percent >= 100) {
      await notificationController.createNotification(
        req.user.id,
        'Objectif atteint',
        `Félicitations ! ${objectif.name} est complété`,
        'success'
      );
    }
    return res.json({ objectif: mapObjectif(objectif) });
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
