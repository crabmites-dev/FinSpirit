# Système de Notifications - GestionDepense

## Vue d'ensemble

Le système de notifications permet aux utilisateurs de recevoir des mises à jour en temps réel sur :
- Les transactions créées
- Les dépassements de budget
- Les rappels d'échéances
- La progression des objectifs

## Architecture

### Frontend

**NotificationContext.jsx**
- Gère l'état global des notifications
- Fournit un hook `useNotifications()` pour accéder aux notifications
- Récupère les notifications toutes les 30 secondes via une requête GET
- Exporte les fonctions : `addNotification`, `markAsRead`, `markAllAsRead`, `deleteNotification`, `clearAllNotifications`

**NotificationPanel.jsx**
- Composant UI qui affiche les notifications
- Intégré dans le header de toutes les pages
- Affiche un badge avec le nombre de notifications non lues
- Permet de marquer comme lu, supprimer, ou tout effacer
- Dispose d'un format élégant avec icônes et timestamps relatifs

**Intégration dans les pages**
- App.jsx : Enveloppe l'application avec NotificationProvider
- Toutes les pages principales (Dashboard, Revenus, Depenses, Budget, Objectifs, Echeance, Transaction) utilisent NotificationPanel

### Backend

**Endpoints disponibles**

```
GET /api/notifications
- Récupère toutes les notifications de l'utilisateur
- Réponse : { notifications: [...] }

PUT /api/notifications/{id}/read
- Marque une notification comme lue
- Réponse : { notification: {...} }

PUT /api/notifications/read-all
- Marque toutes les notifications comme lues
- Réponse : { message: "Toutes les notifications ont été marquées comme lues" }

DELETE /api/notifications/{id}
- Supprime une notification
- Réponse : { message: "Notification supprimée" }

DELETE /api/notifications
- Supprime toutes les notifications
- Réponse : { message: "Toutes les notifications ont été supprimées" }
```

**Database Schema**

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('success', 'error', 'warning', 'info')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
```

## Utilisation dans les contrôleurs

Pour créer une notification dans un contrôleur (par exemple, lors de l'ajout d'une transaction) :

```javascript
const { createNotification } = require('../controllers/notificationController.js');

// Après avoir créé une transaction
await createNotification(
  userId,
  'Nouvelle transaction',
  `Transaction "${title}" de ${amount} FCFA ajoutée`,
  'success'
);
```

## Points d'intégration pour ajouter des notifications

### 1. Transactions (transactionController.js)
- À l'ajout d'une transaction : "Nouvelle transaction ajoutée: [title] [amount] FCFA"
- À la suppression : "Transaction supprimée"
- À la modification : "Transaction modifiée"

### 2. Budgets (budgetController.js)
- À la création : "Budget créé pour [category]"
- Si dépassement : "Attention: Budget dépassé pour [category]!"
- À la suppression : "Budget supprimé"

### 3. Objectifs (objectifController.js)
- À la création : "Objectif créé: [name]"
- À la mise à jour : "Objectif: [percentage]% atteint"
- Si complété : "Objectif complété: [name]"

### 4. Échéances (echeanceController.js)
- À la création : "Échéance créée: [name] due [date]"
- Rappel : "Rappel: Échéance due - [name]"
- À la suppression : "Échéance supprimée"

## Types de notifications

- `success` : Icône verte ✓ - Opérations réussies
- `error` : Icône rouge ⚠ - Erreurs ou problèmes critiques
- `warning` : Icône orange ⚠ - Avertissements et dépassements
- `info` : Icône bleue ℹ - Informations générales

## Exemple d'intégration complet

```javascript
// Dans transactionController.js
import { createNotification } from './notificationController.js';

export const addTransaction = async (req, res) => {
    const { title, amount, type, category, date, note } = req.body;
    const userId = req.user.id;

    try {
        const newTransaction = await pool.query(
            'INSERT INTO transactions (user_id, title, amount, type, category, date, note) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [userId, title, amount, type, category, date, note || '']
        );

        // Créer une notification
        const typeText = type === 'income' ? '+' : '-';
        await createNotification(
            userId,
            'Nouvelle transaction',
            `${typeText} ${amount} FCFA - ${title}`,
            type === 'income' ? 'success' : 'info'
        );

        return res.status(201).json({
            message: 'Transaction ajoutée avec succès',
            transaction: newTransaction.rows[0]
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};
```

## Flux de données

1. **Frontend** : NotificationPanel s'ouvre
2. **API Call** : GET /api/notifications toutes les 30s
3. **Database** : Récupère les notifications de l'utilisateur
4. **Frontend** : NotificationPanel met à jour l'affichage
5. **Utilisateur** : Clique sur une notification ou marque comme lue
6. **Frontend** : Envoie PUT /api/notifications/{id}/read
7. **Database** : Met à jour is_read = true
8. **Frontend** : Met à jour l'UI et le badge du compteur

## Configuration requise

1. ✅ Database schema avec table notifications
2. ✅ Backend controllers et routes
3. ✅ Frontend Context et components
4. ⏳ Intégration des notifications dans les contrôleurs (à faire)
5. ⏳ WebSocket pour updates en temps réel (optionnel)

## Prochaines étapes

1. Intégrer `createNotification()` dans tous les contrôleurs
2. Tester les notifications avec une requête POST manuelle
3. Ajouter WebSocket pour les updates en temps réel (si nécessaire)
4. Ajouter les paramètres utilisateur pour les préférences de notifications
