// Template HTML pour le rapport financier mensuel envoyé par e-mail
const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function buildMonthlyReportEmail({
  username,
  month,
  year,
  totalIncome = 0,
  totalExpense = 0,
  balance = 0,
  savingsRate = 0,
  comparison = null,
  categories = [],
  budgets = [],
  topExpenses = [],
  transactionCount = 0,
  frontendUrl = 'http://localhost:5173'
}) {
  const monthName = MONTH_NAMES_FR[month - 1] || `Mois ${month}`;
  const isPositiveSavings = balance >= 0;

  // Comparatif dépenses vs mois précédent
  let comparisonHtml = '';
  if (comparison && comparison.prevExpense > 0) {
    const diff = comparison.expenseDiffPercent;
    const isDown = diff <= 0;
    const sign = diff > 0 ? '+' : '';
    const badgeBg = isDown ? '#ecfdf5' : '#fff1f2';
    const badgeColor = isDown ? '#059669' : '#e11d48';
    const icon = isDown ? '📉' : '📈';
    const text = isDown
      ? `Vos dépenses ont <strong>diminué de ${Math.abs(diff)}%</strong> par rapport au mois précédent. Bravo pour cette gestion !`
      : `Vos dépenses ont <strong>augmenté de ${sign}${diff}%</strong> par rapport au mois précédent. Gardez un œil sur votre budget.`;

    comparisonHtml = `
      <div style="background-color: ${badgeBg}; border: 1px solid ${badgeColor}33; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
        <span style="font-size: 16px; margin-right: 8px;">${icon}</span>
        <span style="font-size: 13px; color: ${badgeColor}; font-weight: 500;">${text}</span>
      </div>
    `;
  }

  // Barres de catégories
  let categoriesHtml = '';
  if (categories.length > 0) {
    const categoryRows = categories.slice(0, 6).map(cat => {
      const pct = Math.min(Math.round(cat.percent || 0), 100);
      return `
        <div style="margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
            <span style="font-weight: 600; color: #1e293b;">${cat.name}</span>
            <span style="color: #64748b; font-weight: 600;">${Number(cat.total).toLocaleString('fr-FR')} FCFA <span style="color: #94a3b8; font-size: 11px;">(${pct}%)</span></span>
          </div>
          <div style="background-color: #f1f5f9; border-radius: 8px; height: 8px; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #6366f1, #8b5cf6); width: ${pct}%; height: 100%; border-radius: 8px;"></div>
          </div>
        </div>
      `;
    }).join('');

    categoriesHtml = `
      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 16px 0; font-size: 15px; font-weight: 700; color: #0f172a;">📊 Répartition des dépenses par catégorie</h3>
        ${categoryRows}
      </div>
    `;
  }

  // Synthèse des budgets
  let budgetsHtml = '';
  if (budgets.length > 0) {
    const budgetRows = budgets.slice(0, 5).map(b => {
      const pct = Math.round(b.percent || 0);
      let statusColor = '#10b981';
      let statusText = 'Sous contrôle';
      if (pct >= 100) {
        statusColor = '#ef4444';
        statusText = 'Dépassé';
      } else if (pct >= 80) {
        statusColor = '#f59e0b';
        statusText = 'Attention';
      }

      return `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 8px; font-size: 13px; font-weight: 600; color: #1e293b;">${b.name}</td>
          <td style="padding: 10px 8px; font-size: 12px; color: #64748b;">${Number(b.spent).toLocaleString('fr-FR')} / ${Number(b.limit).toLocaleString('fr-FR')} FCFA</td>
          <td style="padding: 10px 8px; text-align: right;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; color: ${statusColor}; background-color: ${statusColor}18;">
              ${pct}% • ${statusText}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    budgetsHtml = `
      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 14px 0; font-size: 15px; font-weight: 700; color: #0f172a;">🎯 Bilan du respect des budgets</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-transform: uppercase;">
              <th style="padding: 8px; text-align: left;">Budget</th>
              <th style="padding: 8px; text-align: left;">Consommation</th>
              <th style="padding: 8px; text-align: right;">Statut</th>
            </tr>
          </thead>
          <tbody>
            ${budgetRows}
          </tbody>
        </table>
      </div>
    `;
  }

  // Top dépenses du mois
  let topExpensesHtml = '';
  if (topExpenses.length > 0) {
    const expenseRows = topExpenses.slice(0, 4).map(exp => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px; font-size: 13px; color: #1e293b; font-weight: 600;">${exp.title}</td>
        <td style="padding: 8px; font-size: 12px; color: #64748b;">${exp.category}</td>
        <td style="padding: 8px; text-align: right; font-size: 13px; font-weight: 700; color: #f43f5e;">
          -${Number(exp.amount).toLocaleString('fr-FR')} FCFA
        </td>
      </tr>
    `).join('');

    topExpensesHtml = `
      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 14px 0; font-size: 15px; font-weight: 700; color: #0f172a;">💳 Principales dépenses du mois</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            ${expenseRows}
          </tbody>
        </table>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bilan Financier — ${monthName} ${year}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);">
          
          <!-- BANNIÈRE EN-TÊTE -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #4338ca 100%); padding: 36px 32px; text-align: center; color: #ffffff;">
              <div style="display: inline-block; background: rgba(255,255,255,0.15); border-radius: 12px; padding: 8px 16px; margin-bottom: 12px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">
                CAPBUDGET • RAPPORT MENSUEL
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Bilan de ${monthName} ${year}</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Votre récapitulatif financier complet et détaillé</p>
            </td>
          </tr>

          <!-- CORPS PRINCIPAL -->
          <tr>
            <td style="padding: 32px 28px; background-color: #ffffff;">
              
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.6;">
                Bonjour <strong style="color: #0f172a;">${username || 'Utilisateur'}</strong> 👋,<br>
                Voici l'analyse complète de vos <strong>${transactionCount} opération(s)</strong> effectuées au cours du mois de ${monthName} ${year}.
              </p>

              ${comparisonHtml}

              <!-- CARTES METRIQUES PRINCIPALES -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="50%" style="padding-right: 8px; vertical-align: top;">
                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 18px; text-align: center;">
                      <span style="font-size: 11px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px;">Revenus Totaux</span>
                      <div style="font-size: 20px; font-weight: 900; color: #16a34a; margin-top: 4px;">
                        +${Number(totalIncome).toLocaleString('fr-FR')} <span style="font-size: 12px;">FCFA</span>
                      </div>
                    </div>
                  </td>
                  <td width="50%" style="padding-left: 8px; vertical-align: top;">
                    <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 14px; padding: 18px; text-align: center;">
                      <span style="font-size: 11px; font-weight: 700; color: #be123c; text-transform: uppercase; letter-spacing: 0.5px;">Dépenses Totales</span>
                      <div style="font-size: 20px; font-weight: 900; color: #e11d48; margin-top: 4px;">
                        -${Number(totalExpense).toLocaleString('fr-FR')} <span style="font-size: 12px;">FCFA</span>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 12px;">
                    <div style="background-color: ${isPositiveSavings ? '#eef2ff' : '#fef2f2'}; border: 1px solid ${isPositiveSavings ? '#c7d2fe' : '#fecaca'}; border-radius: 14px; padding: 18px; text-align: center;">
                      <span style="font-size: 11px; font-weight: 700; color: ${isPositiveSavings ? '#4338ca' : '#b91c1c'}; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${isPositiveSavings ? 'Épargne Réalisée (Solde)' : 'Déficit Financier'}
                      </span>
                      <div style="font-size: 24px; font-weight: 900; color: ${isPositiveSavings ? '#4f46e5' : '#dc2626'}; margin-top: 4px;">
                        ${isPositiveSavings ? '+' : ''}${Number(balance).toLocaleString('fr-FR')} FCFA
                      </div>
                      <span style="display: inline-block; margin-top: 6px; font-size: 12px; font-weight: 600; color: ${isPositiveSavings ? '#6366f1' : '#ef4444'};">
                        Taux d'épargne : <strong>${savingsRate}%</strong> des revenus
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- SECTIONS GRAPHIQUES ET DETAILS -->
              ${categoriesHtml}
              ${budgetsHtml}
              ${topExpensesHtml}

              <!-- BOUTON D'ACTION -->
              <div style="text-align: center; margin: 32px 0 16px 0;">
                <a href="${frontendUrl}/rapports" style="display: inline-block; background: linear-gradient(135deg, #4f46e5, #6366f1); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
                  Consulter mon rapport interactif complet →
                </a>
              </div>

            </td>
          </tr>

          <!-- PIED DE PAGE -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5;">
              <p style="margin: 0 0 6px 0;">
                Cet e-mail automatique a été généré par <strong>CapBudget</strong> à la clôture mensuelle.
              </p>
              <p style="margin: 0;">
                Prenez le contrôle de votre avenir financier, une opération à la fois.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
