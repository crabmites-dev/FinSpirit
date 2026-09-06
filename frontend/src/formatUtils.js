/**
 * Formate un nombre de manière compacte pour les axes de graphiques (ex: 50k, 150k, 1.2M).
 * Évite les débordements et coupures de texte sur mobile.
 */
export const formatCompact = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '0';
  const num = Number(val);
  if (num === 0) return '0';
  const abs = Math.abs(num);
  if (abs >= 1_000_000_000) {
    const formatted = (num / 1_000_000_000).toFixed(abs % 1_000_000_000 === 0 ? 0 : 1);
    return `${formatted}Md`;
  }
  if (abs >= 1_000_000) {
    const formatted = (num / 1_000_000).toFixed(abs % 1_000_000 === 0 ? 0 : 1);
    return `${formatted}M`;
  }
  if (abs >= 1_000) {
    const formatted = (num / 1_000).toFixed(abs % 1_000 === 0 ? 0 : 1);
    return `${formatted}k`;
  }
  return num.toString();
};
