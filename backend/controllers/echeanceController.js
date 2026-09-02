import pool from '../config/db.js';
import * as notificationController from './notificationController.js';

const mapEcheance = (row) => ({
  id: row.id,
  name: row.name,
  category: row.category,
  amount: parseFloat(row.amount),
  dueDate: row.due_date instanceof Date
    ? row.due_date.toISOString().slice(0, 10)
    : String(row.due_date).slice(0, 10),
  frequency: row.frequency,
  paid: row.paid,
  note: row.note || '',
  reminder: row.reminder,
  is_sample: row.is_sample,
});

export const getEcheances = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM echeances WHERE user_id = $1 ORDER BY due_date ASC',
      [req.user.id]
    );
    return res.json({ echeances: result.rows.map(mapEcheance) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const addEcheance = async (req, res) => {
  const { name, category, amount, dueDate, frequency, paid, note, reminder } = req.body;
  if (!name || !category || amount == null || !dueDate) {
    return res.status(400).json({ message: 'Veillez remplir tous les champs obligatoires' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO echeances (user_id, name, category, amount, due_date, frequency, paid, note, reminder)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user.id, name, category, amount, dueDate, frequency || 'monthly', paid ?? false, note || '', reminder ?? true]
    );

    await notificationController.createNotification(
      req.user.id,
      'Échéance ajoutée',
      `${name} est prévue pour le ${dueDate}`,
      'info'
    );

    return res.status(201).json({ echeance: mapEcheance(result.rows[0]) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const updateEcheance = async (req, res) => {
  const { name, category, amount, dueDate, frequency, paid, note, reminder } = req.body;
  try {
    const result = await pool.query(
      `UPDATE echeances SET name = $1, category = $2, amount = $3, due_date = $4,
       frequency = $5, paid = $6, note = $7, reminder = $8
       WHERE id = $9 AND user_id = $10 RETURNING *`,
      [name, category, amount, dueDate, frequency, paid ?? false, note || '', reminder ?? true, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Échéance introuvable' });
    }
    return res.json({ echeance: mapEcheance(result.rows[0]) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const togglePaid = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE echeances SET paid = NOT paid WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Échéance introuvable' });
    }

    const echeance = result.rows[0];
    const status = echeance.paid ? 'payée' : 'non payée';
    await notificationController.createNotification(
      req.user.id,
      'Échéance mise à jour',
      `${echeance.name} est maintenant ${status}`,
      'success'
    );

    return res.json({ echeance: mapEcheance(result.rows[0]) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const deleteEcheance = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM echeances WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Échéance introuvable' });
    }
    return res.json({ message: 'Échéance supprimée' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};
