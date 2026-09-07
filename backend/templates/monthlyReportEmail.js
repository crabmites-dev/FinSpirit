// Template de relevé financier mensuel professionnel et épuré
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
  const daysInMonth = new Date(year, month, 0).getDate();
  const formattedIncome = Number(totalIncome).toLocaleString('fr-FR');
  const formattedExpense = Number(totalExpense).toLocaleString('fr-FR');
  const formattedBalance = Number(Math.abs(balance)).toLocaleString('fr-FR');
  const isPositive = balance >= 0;

  // Comparatif analytique sobre (style note financière de gestion)
  let variationNotice = '';
  if (comparison && comparison.prevExpense > 0) {
    const diff = comparison.expenseDiffPercent;
    const diffText = diff > 0 ? `+${diff}%` : `${diff}%`;
    const trendWord = diff <= 0 ? 'diminution' : 'hausse';
    const trendColor = diff <= 0 ? '#15803d' : '#991b1b';

    variationNotice = `
      <div style="border-left: 3px solid ${trendColor}; padding: 10px 14px; background-color: #f8fafc; margin-bottom: 24px;">
        <span style="font-size: 13px; color: #334155; line-height: 1.5;">
          <strong>Analyse comparative :</strong> Vos dépenses mensuelles enregistrent une <strong>${trendWord} de ${Math.abs(diff)}%</strong> (${diffText}) par rapport au mois de ${comparison.prevMonthName} ${comparison.prevYear}.
        </span>
      </div>
    `;
  }

  // Tableau sobre de répartition des dépenses par catégorie
  let categoriesTableHtml = '';
  if (categories.length > 0) {
    const rows = categories.slice(0, 7).map((cat, idx) => {
      const pct = Math.min(Math.round(cat.percent || 0), 100);
      const isEven = idx % 2 === 1;
      return `
        <tr style="background-color: ${isEven ? '#f9fafb' : '#ffffff'}; border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #111827;">${cat.name}</td>
          <td style="padding: 10px 12px; font-size: 12px; color: #4b5563; text-align: center;">${cat.count} op.</td>
          <td style="padding: 10px 12px; width: 140px;">
            <div style="background-color: #e5e7eb; border-radius: 2px; height: 6px; width: 100%; overflow: hidden;">
              <div style="background-color: #334155; width: ${pct}%; height: 100%;"></div>
            </div>
          </td>
          <td style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #4b5563; text-align: right; width: 45px;">${pct}%</td>
          <td style="padding: 10px 12px; font-size: 13px; font-weight: 700; color: #111827; text-align: right; font-variant-numeric: tabular-nums;">
            ${Number(cat.total).toLocaleString('fr-FR')} FCFA
          </td>
        </tr>
      `;
    }).join('');

    categoriesTableHtml = `
      <div style="margin-bottom: 28px;">
        <div style="border-bottom: 2px solid #1e293b; padding-bottom: 6px; margin-bottom: 12px;">
          <h2 style="margin: 0; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a;">
            1. Ventilation des Dépenses par Catégorie
          </h2>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">
              <th style="padding: 9px 12px; text-align: left;">Catégorie</th>
              <th style="padding: 9px 12px; text-align: center;">Volume</th>
              <th style="padding: 9px 12px; text-align: left;" colspan="2">Part Relative</th>
              <th style="padding: 9px 12px; text-align: right;">Montant Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  // Tableau du contrôle budgétaire
  let budgetsTableHtml = '';
  if (budgets.length > 0) {
    const bRows = budgets.slice(0, 6).map((b, idx) => {
      const pct = Math.round(b.percent || 0);
      const isOver = pct > 100;
      const isWarn = pct >= 80 && !isOver;
      const isEven = idx % 2 === 1;

      const statusTag = isOver
        ? `<span style="font-size: 11px; font-weight: 700; color: #991b1b; padding: 2px 6px; border: 1px solid #f87171; background-color: #fef2f2;">DÉPASSÉ (+${pct - 100}%)</span>`
        : isWarn
        ? `<span style="font-size: 11px; font-weight: 700; color: #854d0e; padding: 2px 6px; border: 1px solid #fde047; background-color: #fefce8;">VIGILANCE (${pct}%)</span>`
        : `<span style="font-size: 11px; font-weight: 700; color: #166534; padding: 2px 6px; border: 1px solid #86efac; background-color: #f0fdf4;">CONFORME (${pct}%)</span>`;

      return `
        <tr style="background-color: ${isEven ? '#f9fafb' : '#ffffff'}; border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #111827;">${b.name}</td>
          <td style="padding: 10px 12px; font-size: 12px; color: #4b5563;">${b.category}</td>
          <td style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #4b5563; text-align: right; font-variant-numeric: tabular-nums;">
            ${Number(b.limit).toLocaleString('fr-FR')} FCFA
          </td>
          <td style="padding: 10px 12px; font-size: 13px; font-weight: 700; color: #111827; text-align: right; font-variant-numeric: tabular-nums;">
            ${Number(b.spent).toLocaleString('fr-FR')} FCFA
          </td>
          <td style="padding: 10px 12px; text-align: right;">
            ${statusTag}
          </td>
        </tr>
      `;
    }).join('');

    budgetsTableHtml = `
      <div style="margin-bottom: 28px;">
        <div style="border-bottom: 2px solid #1e293b; padding-bottom: 6px; margin-bottom: 12px;">
          <h2 style="margin: 0; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a;">
            2. Respect des Enveloppes Budgétaires
          </h2>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">
              <th style="padding: 9px 12px; text-align: left;">Budget</th>
              <th style="padding: 9px 12px; text-align: left;">Catégorie</th>
              <th style="padding: 9px 12px; text-align: right;">Plafond Alloué</th>
              <th style="padding: 9px 12px; text-align: right;">Dépensé Réel</th>
              <th style="padding: 9px 12px; text-align: right;">Statut</th>
            </tr>
          </thead>
          <tbody>
            ${bRows}
          </tbody>
        </table>
      </div>
    `;
  }

  // Tableau des principales opérations débitrices
  let topExpensesTableHtml = '';
  if (topExpenses.length > 0) {
    const expRows = topExpenses.slice(0, 5).map((exp, idx) => {
      const isEven = idx % 2 === 1;
      const formattedDate = exp.date ? new Date(exp.date).toLocaleDateString('fr-FR') : '-';
      return `
        <tr style="background-color: ${isEven ? '#f9fafb' : '#ffffff'}; border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 9px 12px; font-size: 12px; color: #64748b; font-variant-numeric: tabular-nums;">${formattedDate}</td>
          <td style="padding: 9px 12px; font-size: 13px; font-weight: 600; color: #111827;">${exp.title}</td>
          <td style="padding: 9px 12px; font-size: 12px; color: #4b5563;">${exp.category}</td>
          <td style="padding: 9px 12px; font-size: 13px; font-weight: 700; color: #991b1b; text-align: right; font-variant-numeric: tabular-nums;">
            -${Number(exp.amount).toLocaleString('fr-FR')} FCFA
          </td>
        </tr>
      `;
    }).join('');

    topExpensesTableHtml = `
      <div style="margin-bottom: 28px;">
        <div style="border-bottom: 2px solid #1e293b; padding-bottom: 6px; margin-bottom: 12px;">
          <h2 style="margin: 0; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a;">
            3. Principaux Débits Enregistrés
          </h2>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">
              <th style="padding: 9px 12px; text-align: left; width: 90px;">Date</th>
              <th style="padding: 9px 12px; text-align: left;">Libellé de l'Opération</th>
              <th style="padding: 9px 12px; text-align: left;">Catégorie</th>
              <th style="padding: 9px 12px; text-align: right;">Montant</th>
            </tr>
          </thead>
          <tbody>
            ${expRows}
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
  <title>Relevé Financier — ${monthName} ${year}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #111827;">
  
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 32px 12px;">
    <tr>
      <td align="center">
        
        <!-- CONTENEUR PRINCIPAL -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 660px; background-color: #ffffff; border: 1px solid #d1d5db; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.08);">
          
          <!-- BANDEAU INSTITUTIONNEL HAUT -->
          <tr>
            <td style="background-color: #0f172a; padding: 22px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <div style="font-size: 18px; font-weight: 800; letter-spacing: 1px; color: #ffffff; text-transform: uppercase;">
                      FINSPIRIT
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 2px;">
                      Gestion Financière & Analytique
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
                      Relevé de Clôture
                    </div>
                    <div style="font-size: 14px; font-weight: 700; color: #ffffff; margin-top: 2px;">
                      ${monthName} ${year}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- EN-TÊTE RÉCAPITULATIF RELEVÉ -->
          <tr>
            <td style="padding: 24px 28px 18px 28px; border-bottom: 1px solid #e5e7eb; background-color: #fafafa;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align: top;" width="60%">
                    <div style="font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Titulaire du compte</div>
                    <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 3px;">${username || 'Utilisateur'}</div>
                    <div style="font-size: 12px; color: #4b5563; margin-top: 2px;">Synthèse certifiée des écritures</div>
                  </td>
                  <td style="vertical-align: top; text-align: right;" width="40%">
                    <div style="font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Période couverte</div>
                    <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 3px;">01 au ${daysInMonth} ${monthName} ${year}</div>
                    <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${transactionCount} opérations traitées</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CORPS DU RAPPORT -->
          <tr>
            <td style="padding: 28px;">

              ${variationNotice}

              <!-- TABLEAU BILAN PRINCIPAL (STYLE ÉTAT FINANCIER) -->
              <div style="margin-bottom: 28px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #cbd5e1; border-collapse: collapse;">
                  <thead>
                    <tr style="background-color: #f8fafc; border-bottom: 1px solid #cbd5e1; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">
                      <th style="padding: 12px 16px; text-align: left; width: 33.33%;">Total des Recettes</th>
                      <th style="padding: 12px 16px; text-align: left; width: 33.33%;">Total des Dépenses</th>
                      <th style="padding: 12px 16px; text-align: left; width: 33.33%; background-color: #f1f5f9;">Solde Net Période</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="padding: 16px; border-right: 1px solid #e2e8f0; vertical-align: top;">
                        <div style="font-size: 20px; font-weight: 800; color: #15803d; font-variant-numeric: tabular-nums;">
                          +${formattedIncome} <span style="font-size: 11px; font-weight: 600;">FCFA</span>
                        </div>
                        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Crédits comptabilisés</div>
                      </td>
                      <td style="padding: 16px; border-right: 1px solid #e2e8f0; vertical-align: top;">
                        <div style="font-size: 20px; font-weight: 800; color: #991b1b; font-variant-numeric: tabular-nums;">
                          -${formattedExpense} <span style="font-size: 11px; font-weight: 600;">FCFA</span>
                        </div>
                        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Débits comptabilisés</div>
                      </td>
                      <td style="padding: 16px; vertical-align: top; background-color: #fafafa;">
                        <div style="font-size: 20px; font-weight: 800; color: ${isPositive ? '#0f172a' : '#991b1b'}; font-variant-numeric: tabular-nums;">
                          ${isPositive ? '+' : '-'}${formattedBalance} <span style="font-size: 11px; font-weight: 600;">FCFA</span>
                        </div>
                        <div style="font-size: 11px; font-weight: 600; color: ${isPositive ? '#166534' : '#991b1b'}; margin-top: 4px;">
                          Taux d'épargne : <strong>${savingsRate}%</strong>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- SECTIONS ANALYTIQUES DÉTAILLÉES -->
              ${categoriesTableHtml}
              ${budgetsTableHtml}
              ${topExpensesTableHtml}

              <!-- LIEN PORTAIL CLIENT -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; text-align: center; margin-top: 32px;">
                <div style="font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 12px;">
                  Vous pouvez accéder à l'ensemble de vos historiques et graphiques sur la plateforme.
                </div>
                <a href="${frontendUrl}/rapports?year=${year}&month=${month}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 22px; border-radius: 4px; letter-spacing: 0.3px;">
                  Consulter le rapport interactif en ligne &rarr;
                </a>
              </div>

            </td>
          </tr>

          <!-- PIED DE PAGE FORMEL -->
          <tr>
            <td style="background-color: #ffffff; border-top: 1px solid #e5e7eb; padding: 20px 28px; font-size: 11px; color: #6b7280; line-height: 1.5;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <strong>FinSpirit Financial Services</strong> • Document récapitulatif mensuel généré automatiquement.<br>
                    Ce relevé est destiné exclusivement à ${username || 'son titulaire'}.
                  </td>
                  <td align="right" style="vertical-align: top; color: #9ca3af; font-size: 10px;">
                    Émis le ${new Date().toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              </table>
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
