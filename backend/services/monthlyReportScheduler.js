import pool from '../config/db.js';
import { sendMonthlyEmailToUser } from '../controllers/reportController.js';

/**
 * Vérifie et envoie automatiquement le rapport de fin de mois aux utilisateurs
 * n'ayant pas encore reçu leur bilan pour le mois écoulé.
 */
export async function checkAndSendPendingMonthlyReports() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Le mois écoulé à clôturer
  const targetMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const targetYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  try {
    // 1. Sélectionner les utilisateurs qui ont des transactions pour le mois cible
    // et qui N'ONT PAS ENCORE reçu leur bilan (pas d'entrée dans monthly_reports_sent)
    const pendingUsers = await pool.query(`
      SELECT DISTINCT u.id, u.username, u.email
      FROM users u
      JOIN transactions t ON t.user_id = u.id
      WHERE EXTRACT(YEAR FROM t.date) = $1
        AND EXTRACT(MONTH FROM t.date) = $2
        AND NOT EXISTS (
          SELECT 1 FROM monthly_reports_sent mrs
          WHERE mrs.user_id = u.id
            AND mrs.year = $1
            AND mrs.month = $2
        )
    `, [targetYear, targetMonth]);

    if (pendingUsers.rows.length === 0) {
      return;
    }

    console.log(`📨 [Scheduler Mensuel] ${pendingUsers.rows.length} rapport(s) à envoyer pour ${targetMonth}/${targetYear}...`);

    for (const user of pendingUsers.rows) {
      try {
        await sendMonthlyEmailToUser(user.id, targetYear, targetMonth);
        console.log(`  ✓ Rapport de ${targetMonth}/${targetYear} envoyé automatiquement à ${user.email}`);
      } catch (err) {
        console.error(`  ⚠️ Échec de l'envoi du rapport mensuel pour ${user.email}:`, err.message);
      }
    }
  } catch (error) {
    console.error('⚠️ [Scheduler Mensuel] Erreur lors de la vérification des rapports :', error.message);
  }
}

/**
 * Démarre le scheduler récurrent.
 * Exécute une vérification 10 secondes après le boot, puis toutes les heures.
 */
export function initMonthlyReportScheduler() {
  console.log('⏰ [Scheduler Mensuel] Service de rapports automatiques initialisé (vérification horaire).');

  // Premier test 10s après le boot du serveur
  setTimeout(() => {
    checkAndSendPendingMonthlyReports();
  }, 10000);

  // Vérification horaire
  const ONE_HOUR = 60 * 60 * 1000;
  setInterval(() => {
    checkAndSendPendingMonthlyReports();
  }, ONE_HOUR);
}
