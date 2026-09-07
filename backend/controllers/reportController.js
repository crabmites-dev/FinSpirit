import pool from '../config/db.js';
import transporter from '../config/mail.js';
import { buildMonthlyReportEmail } from '../templates/monthlyReportEmail.js';

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

/**
 * Calcule les données complètes du rapport pour un utilisateur, un mois et une année donnés.
 */
export async function computeMonthlyReportData(userId, targetYear, targetMonth) {
  const y = parseInt(targetYear, 10);
  const m = parseInt(targetMonth, 10);

  // 1. Totaux du mois sélectionné
  const totalsRes = await pool.query(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::float AS total_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float AS total_expense,
      COUNT(id)::int AS transaction_count
    FROM transactions
    WHERE user_id = $1
      AND EXTRACT(YEAR FROM date) = $2
      AND EXTRACT(MONTH FROM date) = $3
  `, [userId, y, m]);

  const totalIncome = totalsRes.rows[0]?.total_income || 0;
  const totalExpense = totalsRes.rows[0]?.total_expense || 0;
  const transactionCount = totalsRes.rows[0]?.transaction_count || 0;
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((balance / totalIncome) * 100)) : 0;

  // 2. Mois précédent pour comparatif
  const prevMonth = m === 1 ? 12 : m - 1;
  const prevYear = m === 1 ? y - 1 : y;

  const prevRes = await pool.query(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::float AS total_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float AS total_expense
    FROM transactions
    WHERE user_id = $1
      AND EXTRACT(YEAR FROM date) = $2
      AND EXTRACT(MONTH FROM date) = $3
  `, [userId, prevYear, prevMonth]);

  const prevIncome = prevRes.rows[0]?.total_income || 0;
  const prevExpense = prevRes.rows[0]?.total_expense || 0;

  const expenseDiffPercent = prevExpense > 0
    ? Math.round(((totalExpense - prevExpense) / prevExpense) * 100)
    : 0;
  const incomeDiffPercent = prevIncome > 0
    ? Math.round(((totalIncome - prevIncome) / prevIncome) * 100)
    : 0;

  // 3. Ventilation par catégorie (Dépenses)
  const catExpenseRes = await pool.query(`
    SELECT
      category AS name,
      COALESCE(SUM(amount), 0)::float AS total,
      COUNT(id)::int AS count
    FROM transactions
    WHERE user_id = $1
      AND type = 'expense'
      AND EXTRACT(YEAR FROM date) = $2
      AND EXTRACT(MONTH FROM date) = $3
    GROUP BY category
    ORDER BY total DESC
  `, [userId, y, m]);

  const categoriesExpense = catExpenseRes.rows.map(c => ({
    ...c,
    percent: totalExpense > 0 ? Math.round((c.total / totalExpense) * 100) : 0
  }));

  // 4. Ventilation par catégorie (Revenus)
  const catIncomeRes = await pool.query(`
    SELECT
      category AS name,
      COALESCE(SUM(amount), 0)::float AS total,
      COUNT(id)::int AS count
    FROM transactions
    WHERE user_id = $1
      AND type = 'income'
      AND EXTRACT(YEAR FROM date) = $2
      AND EXTRACT(MONTH FROM date) = $3
    GROUP BY category
    ORDER BY total DESC
  `, [userId, y, m]);

  const categoriesIncome = catIncomeRes.rows.map(c => ({
    ...c,
    percent: totalIncome > 0 ? Math.round((c.total / totalIncome) * 100) : 0
  }));

  // 5. Évolution journalière du mois
  const dailyRes = await pool.query(`
    SELECT
      EXTRACT(DAY FROM date)::int AS day,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::float AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float AS expense
    FROM transactions
    WHERE user_id = $1
      AND EXTRACT(YEAR FROM date) = $2
      AND EXTRACT(MONTH FROM date) = $3
    GROUP BY EXTRACT(DAY FROM date)
    ORDER BY day ASC
  `, [userId, y, m]);

  // Jours du mois (ex: 1 à 28/30/31)
  const daysInMonth = new Date(y, m, 0).getDate();
  const dailyTrend = [];
  const dayMap = new Map(dailyRes.rows.map(r => [r.day, r]));

  for (let d = 1; d <= daysInMonth; d++) {
    const found = dayMap.get(d);
    dailyTrend.push({
      day: String(d),
      income: found ? found.income : 0,
      expense: found ? found.expense : 0
    });
  }

  // 6. Respect des budgets pour ce mois
  // Plafonds des budgets enregistrés + dépenses réelles (transactions du mois avec alias de catégories ou montant enregistré directement)
  const budgetsRes = await pool.query(`
    SELECT
      b.id,
      b.name,
      b.category,
      b.budget_limit::float AS limit,
      COALESCE(b.spent, 0)::float AS budget_spent,
      COALESCE((
        SELECT SUM(t.amount)
        FROM transactions t
        WHERE t.user_id = b.user_id
          AND t.type = 'expense'
          AND EXTRACT(YEAR FROM t.date) = $2
          AND EXTRACT(MONTH FROM t.date) = $3
          AND (
            LOWER(t.category) = LOWER(b.category)
            OR LOWER(t.category) = LOWER(b.name)
            OR (LOWER(b.category) IN ('courses', 'alimentation', 'nourriture') AND LOWER(t.category) IN ('courses', 'alimentation', 'nourriture'))
            OR (LOWER(b.category) IN ('vêtements', 'vetements', 'shopping', 'mode') AND LOWER(t.category) IN ('vêtements', 'vetements', 'shopping', 'mode'))
            OR (LOWER(b.category) IN ('restaurants', 'restaurant', 'loisirs', 'sorties') AND LOWER(t.category) IN ('restaurants', 'restaurant', 'loisirs', 'sorties'))
            OR (LOWER(b.category) IN ('factures', 'logement', 'loyer') AND LOWER(t.category) IN ('factures', 'logement', 'loyer'))
            OR (LOWER(b.category) IN ('santé', 'sante', 'médical', 'medical') AND LOWER(t.category) IN ('santé', 'sante', 'médical', 'medical'))
            OR (LOWER(b.category) IN ('transport', 'déplacement', 'deplacement', 'carburant') AND LOWER(t.category) IN ('transport', 'déplacement', 'deplacement', 'carburant'))
          )
      ), 0)::float AS tx_spent
    FROM budgets b
    WHERE b.user_id = $1
    ORDER BY b.created_at DESC NULLS LAST, b.id DESC
  `, [userId, y, m]);

  const budgets = budgetsRes.rows.map(b => {
    // Si des transactions spécifiques existent pour ce mois, on prend le montant réel constaté,
    // avec repli sur le montant enregistré sur le budget si aucune transaction directe n'est catégorisée ce mois-là.
    const spent = b.tx_spent > 0
      ? Math.max(b.tx_spent, b.budget_spent)
      : (b.budget_spent > 0 ? b.budget_spent : 0);
    const limit = Number(b.limit) || 0;
    const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    return {
      id: b.id,
      name: b.name,
      category: b.category,
      limit,
      spent,
      percent,
      remaining: Math.max(0, limit - spent),
      isOver: spent > limit
    };
  });

  // 7. Top 5 plus grosses dépenses
  const topExpRes = await pool.query(`
    SELECT id, title, amount::float, category, date
    FROM transactions
    WHERE user_id = $1
      AND type = 'expense'
      AND EXTRACT(YEAR FROM date) = $2
      AND EXTRACT(MONTH FROM date) = $3
    ORDER BY amount DESC
    LIMIT 5
  `, [userId, y, m]);

  // 8. Transactions du mois
  const txRes = await pool.query(`
    SELECT id, title, amount::float, type, category, date, note
    FROM transactions
    WHERE user_id = $1
      AND EXTRACT(YEAR FROM date) = $2
      AND EXTRACT(MONTH FROM date) = $3
    ORDER BY date DESC, id DESC
  `, [userId, y, m]);

  return {
    year: y,
    month: m,
    monthName: MONTH_NAMES_FR[m - 1] || `Mois ${m}`,
    totalIncome,
    totalExpense,
    balance,
    savingsRate,
    transactionCount,
    comparison: {
      prevYear,
      prevMonth,
      prevMonthName: MONTH_NAMES_FR[prevMonth - 1] || `Mois ${prevMonth}`,
      prevIncome,
      prevExpense,
      expenseDiffPercent,
      incomeDiffPercent
    },
    categories: categoriesExpense,
    categoriesIncome,
    dailyTrend,
    budgets,
    topExpenses: topExpRes.rows,
    transactions: txRes.rows
  };
}

/**
 * GET /api/reports/history
 * Résumé des mois récents avec totaux (12 derniers mois).
 */
export const getHistorySummary = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(`
      SELECT
        EXTRACT(YEAR FROM date)::int AS year,
        EXTRACT(MONTH FROM date)::int AS month,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::float AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float AS total_expense,
        COUNT(id)::int AS transaction_count
      FROM transactions
      WHERE user_id = $1
      GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
      ORDER BY year DESC, month DESC
      LIMIT 12
    `, [userId]);

    let months = result.rows.map(r => {
      const balance = r.total_income - r.total_expense;
      const savingsRate = r.total_income > 0 ? Math.max(0, Math.round((balance / r.total_income) * 100)) : 0;
      return {
        year: r.year,
        month: r.month,
        monthLabel: `${MONTH_NAMES_FR[r.month - 1]} ${r.year}`,
        totalIncome: r.total_income,
        totalExpense: r.total_expense,
        balance,
        savingsRate,
        transactionCount: r.transaction_count
      };
    });

    // Si l'utilisateur n'a aucune donnée, renvoyer les mois actuels/récents par défaut
    if (months.length === 0) {
      const now = new Date();
      months = [0, 1, 2].map(offset => {
        const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        return {
          year: y,
          month: m,
          monthLabel: `${MONTH_NAMES_FR[m - 1]} ${y}`,
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          savingsRate: 0,
          transactionCount: 0
        };
      });
    }

    return res.json({ history: months });
  } catch (error) {
    console.error('Erreur getHistorySummary:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique' });
  }
};

/**
 * GET /api/reports/monthly?year=YYYY&month=M
 * Détail approfondi d'un mois spécifique.
 */
export const getMonthlyDetail = async (req, res) => {
  const userId = req.user.id;
  const now = new Date();

  // Par défaut : mois actuel ou précisé dans query
  const year = parseInt(req.query.year, 10) || now.getFullYear();
  const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);

  try {
    const reportData = await computeMonthlyReportData(userId, year, month);
    return res.json({ report: reportData });
  } catch (error) {
    console.error('Erreur getMonthlyDetail:', error);
    return res.status(500).json({ message: 'Erreur lors du calcul du bilan mensuel' });
  }
};

/**
 * Fonction autonome d'envoi d'e-mail (utilisée par l'API et par le cron).
 */
export async function sendMonthlyEmailToUser(userId, year, month) {
  // 1. Récupérer l'utilisateur
  const userRes = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [userId]);
  if (userRes.rows.length === 0) {
    throw new Error(`Utilisateur ${userId} introuvable`);
  }
  const user = userRes.rows[0];

  if (!user.email) {
    throw new Error('Adresse e-mail manquante');
  }

  // 2. Calculer le bilan du mois
  const reportData = await computeMonthlyReportData(userId, year, month);

  // 3. Générer le HTML
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const htmlContent = buildMonthlyReportEmail({
    username: user.username,
    month: reportData.month,
    year: reportData.year,
    totalIncome: reportData.totalIncome,
    totalExpense: reportData.totalExpense,
    balance: reportData.balance,
    savingsRate: reportData.savingsRate,
    comparison: reportData.comparison,
    categories: reportData.categories,
    budgets: reportData.budgets,
    topExpenses: reportData.topExpenses,
    transactionCount: reportData.transactionCount,
    frontendUrl
  });

  // 4. Vérifier les identifiants et envoyer via nodemailer
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Configuration e-mail manquante : EMAIL_USER ou EMAIL_PASS n\'est pas défini sur le serveur.');
  }

  const mailSubject = `FinSpirit — Relevé financier de ${reportData.monthName} ${reportData.year}`;
  await transporter.sendMail({
    from: `"FinSpirit" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: mailSubject,
    html: htmlContent
  });

  // 5. Enregistrer dans la table d'historique des envois (idempotent)
  await pool.query(`
    INSERT INTO monthly_reports_sent (user_id, year, month, sent_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (user_id, year, month) DO UPDATE SET sent_at = NOW()
  `, [userId, year, month]);

  return {
    email: user.email,
    monthName: reportData.monthName,
    year: reportData.year
  };
}

/**
 * POST /api/reports/send-email
 * Envoi déclenché à la demande depuis l'application.
 */
export const sendMonthlyEmail = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Utilisateur non authentifié' });
  }

  const now = new Date();

  // Accepte le mois et l'année depuis le body (POST) ou les query params (GET/fallback)
  const targetYear = req.body?.year ?? req.query?.year;
  const targetMonth = req.body?.month ?? req.query?.month;
  let year = parseInt(targetYear, 10);
  let month = parseInt(targetMonth, 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    // Par défaut mois actuel s'il est spécifié, ou mois précédent
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }

  try {
    const result = await sendMonthlyEmailToUser(userId, year, month);
    return res.json({
      success: true,
      message: `Bilan de ${result.monthName} ${result.year} envoyé avec succès à ${result.email} !`
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du rapport mensuel :', error);
    return res.status(500).json({
      message: error.message || 'Erreur lors de l\'envoi du rapport par email'
    });
  }
};
