import { useState } from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import api from './api.js';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext.jsx';
import { FormBrandHeader } from './FinSpiritLogo.jsx';
import PasswordInput from './PasswordInput.jsx';

function Signin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email: email.trim().toLowerCase(), password });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      if (res.data.user?.username) {
        localStorage.setItem('userName', res.data.user.username);
      }
      showToast('Connexion réussie ! Bienvenue', 'success');
      setEmail('');
      setPassword('');
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (error) {
      showToast(error.response?.data?.message || 'Une erreur est survenue', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-screen bg-gradient-to-b from-slate-50 to-slate-100 font-sans m-0 overflow-y-auto antialiased">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.02)] w-full max-w-[420px] text-center border border-slate-200/60 my-auto mx-4 animate-fade-in-up">
        <FormBrandHeader
          title="Connexion"
          subtitle="Ravi de vous revoir ! Connectez-vous à votre espace."
        />

        <form onSubmit={handleSubmit} className="text-left space-y-4">
          <div className="form-control space-y-2">
            <label className="text-slate-700 text-xs font-bold uppercase tracking-wider pl-0.5 mb-2">Adresse e-mail</label>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-slate-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-600/10 transition-all duration-200">
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

          <div className="form-control space-y-2">
            <label className="text-slate-700 text-xs font-bold uppercase tracking-wider pl-0.5">Mot de passe</label>
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div className="text-right pt-0.5">
            <Link to="/forgotPassword" className="text-indigo-600 text-xs font-semibold hover:text-indigo-500 transition-colors hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-3 rounded-2xl shadow-md shadow-indigo-600/10 active:scale-[0.99] transition-all duration-150 cursor-pointer mt-4 disabled:opacity-60"
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                <span>Se connecter</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-grey-100 mt-8 text-sm font-medium">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-indigo-600 font-bold hover:underline transition-colors">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signin;
