const FOOTER_LINKS = [
  { label: 'Charte', href: '#' },
  { label: 'Règlement intérieur', href: '#' },
  { label: 'FAQ', href: '#' },
];

export default function AppFooter({ className = '' }) {
  const year = new Date().getFullYear();

  return (
    <footer className={`mt-auto pt-8 pb-4 text-center ${className}`}>
      <p className="text-xs text-slate-400 font-medium leading-relaxed">
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
