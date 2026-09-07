const SIZES = {
  sm: { px: 28, pad: 'p-0.5', word: 'text-sm' },
  md: { px: 36, pad: 'p-1', word: 'text-base' },
  lg: { px: 52, pad: 'p-1.5', word: 'text-xl' },
};

/** Graphique croissance + badge FCFA — couleurs FinSpirit (indigo / emerald) */
function LogoMark({ px = 36 }) {
  const uid = `fs-${px}`;
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <linearGradient id={`${uid}-bars`} x1="24" y1="40" x2="24" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" />
          <stop stopColor="#4f46e5" />
        </linearGradient>
      </defs>

      {/* Axes */}
      <path d="M6 40 H42" stroke="#e2e8f0" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M6 40 V8" stroke="#e2e8f0" strokeWidth="1.75" strokeLinecap="round" />

      {/* Barres — hauteur croissante, coins arrondis */}
      <rect x="8.5" y="32" width="5.5" height="8" rx="1.25" fill="#e0e7ff" />
      <rect x="14.5" y="28" width="5.5" height="12" rx="1.25" fill="#c7d2fe" />
      <rect x="20.5" y="24" width="5.5" height="16" rx="1.25" fill="#a5b4fc" />
      <rect x="26.5" y="20" width="5.5" height="20" rx="1.25" fill="#818cf8" />
      <rect x="32.5" y="15" width="5.5" height="25" rx="1.25" fill={`url(#${uid}-bars)`} />

      {/* Courbe de tendance emerald */}
      <path
        d="M11.25 30.5 L17.25 26.5 L23.25 22.5 L29.25 18.5 L35.25 14"
        stroke="#10b981"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Points de données */}
      {[
        [11.25, 30.5],
        [17.25, 26.5],
        [23.25, 22.5],
        [29.25, 18.5],
        [35.25, 14],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.25" fill="#fff" stroke="#10b981" strokeWidth="1.75" />
      ))}

      {/* Badge monnaie — FCFA */}
      <circle cx="39" cy="36" r="7.5" fill="#4f46e5" />
      <circle cx="39" cy="36" r="7.5" stroke="#6366f1" strokeWidth="0.75" opacity="0.5" />
      <text
        x="39"
        y="38.5"
        textAnchor="middle"
        fill="#fff"
        fontSize="7.5"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
        letterSpacing="-0.3"
      >
        F
      </text>
    </svg>
  );
}

export default function FinSpiritLogo({ size = 'md', showText = false, className = '' }) {
  const s = SIZES[size] || SIZES.md;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`${s.pad} rounded-xl bg-white border border-indigo-100 shadow-sm shadow-indigo-600/5 shrink-0`}
      >
        <LogoMark px={s.px} />
      </div>
      {showText && (
        <span className={`font-bold text-slate-800 tracking-tight ${s.word}`}>
          Fin<span className="text-indigo-600">Spirit</span>
        </span>
      )}
    </div>
  );
}

export function FormBrandHeader({ title, subtitle }) {
  return (
    <div className="flex flex-col items-center gap-4 mb-6">
      <FinSpiritLogo size="lg" showText />
      <div className="text-center">
        <h2 className="text-slate-900 text-2xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

// Alias pour rétrocompatibilité
export { FinSpiritLogo as CapBudgetLogo };
