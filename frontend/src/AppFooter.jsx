const FOOTER_LINKS = [
  { label: 'Charte', href: '#' },
  { label: 'Règlement intérieur', href: '#' },
  { label: 'FAQ', href: '#' },
];

export default function AppFooter({ className = '' }) {
  const year = new Date().getFullYear();

  return (
    <footer className={`mt-auto pt-6 pb-4 text-center border-t border-slate-200/70 ${className}`}>
      <p className="text-xs text-slate-400 font-small leading-relaxed">
        <span>© {year} FinSpirit. Tous droits réservés.</span>
        {' '}
        {FOOTER_LINKS.map((link, index) => (
          <span key={link.label}>
            {index > 0 && ' - '}
            <a
              href={link.href}
              className="hover:text-indigo-600 transition-colors"
            >
              {link.label}
            </a>
          </span>
        ))}
      </p>
    </footer>
  );
}
