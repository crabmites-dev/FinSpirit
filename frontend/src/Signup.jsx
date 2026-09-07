import { useState } from 'react';
import api from './api.js';
import { User, Mail, Check, X, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext.jsx';
import { FormBrandHeader } from './FinSpiritLogo.jsx';
import PasswordInput from './PasswordInput.jsx';

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const hasMinLength = password.length >= 6;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\\/]/.test(password);
  const strengthScore = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (strengthScore < 5) {
      showToast('Veuillez respecter tous les critères de sécurité.', 'warning');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/auth/register', { username, email: email.trim().toLowerCase(), password });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      if (res.data.user?.username || username) {
        localStorage.setItem('userName', res.data.user?.username || username);
      }
      showToast('Compte créé avec succès !', 'success');
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur lors de l'inscription", 'error');
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-screen bg-gradient-to-b from-slate-50 to-slate-100 font-sans m-0 overflow-y-auto antialiased">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.02)] w-full max-w-[420px] text-center border border-slate-200/60 my-auto mx-4 animate-fade-in-up">
        <FormBrandHeader
          title="Créer un compte"
          subtitle="Dites adieu aux fins de mois stressantes. Gérez vos finances en toute sérénité."
        />

        <form onSubmit={handleSubmit} className="text-left space-y-3.5">
          <div className="form-control space-y-2">
            <label className="text-slate-700 text-xs font-bold uppercase tracking-wider pl-0.5">Nom d'utilisateur</label>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-slate-900 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-600/10 transition-all duration-200">
              <User className="text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Ex: AlphaDev"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-transparent text-slate-900 outline-none w-full text-bold text-sm placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <div className="form-control space-y-2">
            <label className="text-slate-700 text-xs font-bold uppercase tracking-wider pl-0.5">Adresse e-mail</label>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-slate-900 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-600/10 transition-all duration-200">
              <Mail className="text-slate-400 w-5 h-5" />
              <input
                type="email"
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-slate-900 outline-none w-full text-sm placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <div className="form-control space-y-2">
            <label className="text-slate-700 text-xs font-bold uppercase tracking-wider pl-0.5">Mot de passe</label>
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {password.length > 0 && (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 transition-all duration-300">
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 1, 2, 3, 4].map((index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      index < strengthScore
                        ? strengthScore <= 2 ? 'bg-rose-500' : strengthScore <= 4 ? 'bg-amber-500' : 'bg-emerald-500'
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-500 pl-0.5">
                <div className="flex items-center gap-2">
                  {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                  <span className={hasMinLength ? 'text-slate-800 font-medium' : 'text-slate-400'}>6 caractères minimum</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                  <span className={hasUppercase ? 'text-slate-800 font-medium' : 'text-slate-400'}>Une majuscule</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                  <span className={hasNumber ? 'text-slate-800 font-medium' : 'text-slate-400'}>Un chiffre</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                  <span className={hasSpecial ? 'text-slate-800 font-medium' : 'text-slate-400'}>Un caractère spécial</span>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-slate-900 hover:bg-slate-700 disabled:bg-slate-500 text-white font-semibold py-3 px-3 rounded-xl shadow-md shadow-indigo-600/10 active:scale-[0.99] transition-all duration-150 cursor-pointer mt-4"
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                <span>S'inscrire</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-grey-100 mt-8 text-sm font-medium">
          Déjà membre ?{' '}
          <Link to="/login" className="text-slate-700 font-bold hover:underline transition-colors ml-2">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
