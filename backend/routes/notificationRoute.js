const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController.js');
const authMiddleware = require('../middleware/authMiddleware.js');

// ── Appliquer middleware authentification ───────────────────────────────
router.use(authMiddleware);

// ── Routes notifications ────────────────────────────────────────────────

// Récupérer toutes les notifications
router.get('/', notificationController.getNotifications);

// Marquer une notification comme lue
router.put('/:id/read', notificationController.markAsRead);

// Marquer toutes les notifications comme lues
router.put('/read-all', notificationController.markAllAsRead);

// Supprimer une notification
router.delete('/:id', notificationController.deleteNotification);

// Supprimer toutes les notifications
router.delete('/', notificationController.clearAllNotifications);

module.exports = router;
