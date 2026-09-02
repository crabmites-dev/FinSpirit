const db = require('../config/db.js');

// ── Récupérer toutes les notifications de l'utilisateur ──────────────────
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ── Marquer une notification comme lue ──────────────────────────────────
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const result = await db.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }
    
    res.json({ notification: result.rows[0] });
  } catch (error) {
    console.error('Erreur marquage notification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ── Marquer toutes les notifications comme lues ──────────────────────────
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await db.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    
    res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    console.error('Erreur marquage notifications:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ── Supprimer une notification ─────────────────────────────────────────
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }
    
    res.json({ message: 'Notification supprimée' });
  } catch (error) {
    console.error('Erreur suppression notification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ── Supprimer toutes les notifications ─────────────────────────────────
exports.clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await db.query(
      'DELETE FROM notifications WHERE user_id = $1',
      [userId]
    );
    
    res.json({ message: 'Toutes les notifications ont été supprimées' });
  } catch (error) {
    console.error('Erreur suppression notifications:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ── Créer une notification (interne) ───────────────────────────────────
exports.createNotification = async (userId, title, message, type = 'info') => {
  try {
    const result = await db.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, title, message, type]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Erreur création notification:', error);
    return null;
  }
};
