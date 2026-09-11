import { useState } from 'react';
import api from './api.js';
import { Mail, Send, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext.jsx';
import { FormBrandHeader } from './FinSpiritLogo.jsx';
import AppFooter from './AppFooter.jsx';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/forgotPassword', { email });
      showToast('Un code a été envoyé à votre adresse e-mail', 'success');
      navigate('/resetPassword', { state: { email } });
    } catch (error) {
      showToast(error.response?.data?.message || 'Une erreur est survenue', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-gradient-to-b from-slate-50 to-slate-100 font-sans antialiased">
      <div className="flex justify-center px-4 py-8 sm:py-10">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.02)] w-full max-w-[420px] text-center border border-slate-200/60 animate-fade-in-up">
        <FormBrandHeader
          title="Mot de passe oublié"
          subtitle="Entrez votre e-mail. Nous vous enverrons un code à 6 chiffres pour réinitialiser votre mot de passe."
        />

        <form onSubmit={handleSubmit} className="text-left space-y-5">
          <div className="form-control space-y-2">
            <label className="text-slate-700 text-xs font-bold uppercase tracking-wider pl-0.5">Adresse e-mail</label>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-600/10 transition-all duration-200">
              <Mail className="text-slate-400 w-4 h-4" />
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

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-3 rounded-xl shadow-md shadow-indigo-600/10 active:scale-[0.99] transition-all duration-150 cursor-pointer mt-4 disabled:opacity-60"
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                <span>Recevoir le code</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <Link to="/login" className="inline-flex items-center text-slate-500 hover:text-slate-800 text-sm font-medium no-underline transition-colors gap-2 group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Retour à la connexion
          </Link>
        </div>
        </div>
      </div>
      <AppFooter className="pb-6" />
    </div>
  );
}

export default ForgotPassword;
