import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from './api.js';
import { Mail, KeyRound, Check, X, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import { useToast } from './ToastContext.jsx';
import { FormBrandHeader } from './FinSpiritLogo.jsx';
import PasswordInput from './PasswordInput.jsx';

function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const hasMinLength = newPassword.length >= 6;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\\/]/.test(newPassword);
  const strengthScore = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

  const getStrengthText = () => {
    if (newPassword.length === 0) return '';
    if (strengthScore <= 2) return 'Très faible';
    if (strengthScore <= 4) return 'Moyen';
    return 'Fort';
  };

  const handleResendCode = async () => {
    if (!email) {
      showToast('Entrez d\'abord votre adresse e-mail', 'warning');
      return;
    }
    setResending(true);
    try {
      await api.post('/auth/forgotPassword', { email });
      showToast('Un nouveau code a été envoyé', 'success');
      setCode('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Impossible d\'envoyer le code', 'error');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!email) {
      showToast('Veuillez saisir votre adresse e-mail', 'warning');
      setLoading(false);
      return;
    }

    if (!code || code.trim().length !== 6) {
      showToast('Entrez le code à 6 chiffres reçu par e-mail', 'warning');
      setLoading(false);
      return;
    }

    if (strengthScore < 5) {
      showToast('Veuillez respecter tous les critères de sécurité.', 'warning');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/resetPassword', {
        email,
        code: code.trim(),
        newPassword,
      });
      showToast('Mot de passe réinitialisé avec succès !', 'success');
      setNewPassword('');
      setCode('');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      showToast(err.response?.data?.message || 'Une erreur est survenue lors de la réinitialisation.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-gradient-to-b from-slate-50 to-slate-100 font-sans antialiased">
      <div className="flex justify-center px-4 py-8 sm:py-10">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.02)] w-full max-w-[420px] text-center border border-slate-200/60 animate-fade-in-up">
        <FormBrandHeader
          title="Réinitialiser le mot de passe"
          subtitle="Saisissez le code reçu par e-mail, puis choisissez un nouveau mot de passe."
        />

        <form onSubmit={handleSubmit} className="text-left space-y-4">
          <div className="form-control space-y-2">
            <label className="text-slate-700 text-xs font-bold uppercase tracking-wider pl-0.5">Adresse e-mail</label>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-600/10 transition-all">
              <Mail className="text-slate-400 w-4 h-4 shrink-0" />
              <input
                type="email"
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-slate-900 outline-none w-full text-sm"
                required
              />
            </div>
          </div>

          <div className="form-control space-y-2">
            <label className="text-slate-700 text-xs font-bold uppercase tracking-wider pl-0.5">Code de vérification</label>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-600/10 transition-all">
              <KeyRound className="text-slate-400 w-4 h-4 shrink-0" />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="bg-transparent text-slate-900 outline-none w-full text-lg font-black tracking-[0.35em] text-center placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-300"
                required
              />
            </div>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resending || !email}
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer mt-1 ml-0.5 transition-colors"
            >
              {resending ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Renvoyer un nouveau code
            </button>
          </div>

          <div className="form-control space-y-2">
            <label className="text-slate-700 text-xs font-bold uppercase tracking-wider pl-0.5">Nouveau mot de passe</label>
            <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>

          {newPassword.length > 0 && (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">Force :</span>
                <span className={`text-xs font-black ${strengthScore <= 2 ? 'text-rose-500' : strengthScore <= 4 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {getStrengthText()}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 1, 2, 3, 4].map((index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all ${
                      index < strengthScore
                        ? strengthScore <= 2 ? 'bg-rose-500' : strengthScore <= 4 ? 'bg-amber-500' : 'bg-emerald-500'
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-500">
                {[
                  [hasMinLength, '6 caractères minimum'],
                  [hasUppercase, 'Une majuscule'],
                  [hasNumber, 'Un chiffre'],
                  [hasSpecial, 'Un caractère spécial'],
                ].map(([ok, label]) => (
                  <div key={label} className="flex items-center gap-2">
                    {ok ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                    <span className={ok ? 'text-slate-800 font-medium' : 'text-slate-400'}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white font-semibold py-3 px-3 rounded-xl shadow-md shadow-indigo-600/10 active:scale-[0.99] transition-all cursor-pointer mt-2 disabled:opacity-60"
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                <span>Réinitialiser le mot de passe</span>
                <ShieldCheck className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-100 pt-6 flex flex-col gap-3">
          <Link to="/forgotPassword" className="text-xs font-semibold text-indigo-600 hover:underline">
            Je n'ai pas reçu de code
          </Link>
          <Link to="/login" className="inline-flex items-center justify-center text-slate-500 hover:text-slate-800 text-sm font-medium gap-2 group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Retour à la connexion
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
