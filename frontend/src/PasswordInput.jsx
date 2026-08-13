import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function PasswordInput({
  value,
  onChange,
  placeholder = '••••••••',
  icon: Icon = Lock,
  required = true,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-600/10 transition-all duration-200">
      <Icon className="text-slate-400 w-4 h-4 shrink-0" />
      <input
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="bg-transparent text-slate-900 outline-none w-full text-sm placeholder:text-slate-400"
        required={required}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0 p-0.5"
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
