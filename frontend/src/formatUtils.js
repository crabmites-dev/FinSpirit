/**
 * Formate un nombre de manière compacte pour les axes de graphiques (ex: 50k, 1,5M).
 */
export const formatCompact = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '0';
  const num = Number(val);
  if (num === 0) return '0';
  const abs = Math.abs(num);
  if (abs >= 1_000_000_000) {
    const formatted = (num / 1_000_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
    return `${formatted} Md`;
  }
  if (abs >= 1_000_000) {
    const formatted = (num / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
    return `${formatted} M`;
  }
  if (abs >= 1_000) {
    const formatted = (num / 1_000).toLocaleString('fr-FR', { maximumFractionDigits: 0 });
    return `${formatted} k`;
  }
  return num.toLocaleString('fr-FR');
};

/** Marge gauche suffisante pour afficher les labels Y sans coupure */
export const CHART_MARGIN = { top: 10, right: 12, left: 14, bottom: 0 };

export const CHART_Y_AXIS_PROPS = {
  axisLine: false,
  tickLine: false,
  width: 62,
  tick: { fill: '#94a3b8', fontSize: 11, fontWeight: 600 },
  tickFormatter: formatCompact,
};
