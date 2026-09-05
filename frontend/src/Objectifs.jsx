import { useState, useEffect } from 'react';
import api from './api.js';
import {
  PlusCircle, Trash2, X, LayoutDashboard, ReceiptEuro,
  LogOut, CircleDollarSign, Bell, Menu, CreditCard, PiggyBank,
  Target, Edit3, Trophy, Plane, Monitor, Car, Home, Heart,
  GraduationCap, ShoppingBag, Sparkles, CheckCircle2, Clock,
  TrendingUp, Plus, Minus,
  ArrowLeftRight, CalendarClock,
  Landmark, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext.jsx';
import { useCurrentUser } from './useCurrentUser.js';
import CapBudgetLogo from './CapBudgetLogo.jsx';
import NotificationPanel from './NotificationPanel.jsx';

// ── Utilitaires ──────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Bonjour';
  if (h >= 12 && h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

const getProgressColor = (percent) => {
  if (percent >= 100) return { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-300', glow: 'shadow-emerald-200' };
  if (percent >= 75)  return { bar: 'bg-indigo-500',  text: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-200',  glow: 'shadow-indigo-100' };
  if (percent >= 40)  return { bar: 'bg-amber-400',   text: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   glow: 'shadow-amber-100' };
  return               { bar: 'bg-slate-400',   text: 'text-slate-500',   bg: 'bg-slate-50',   border: 'border-slate-200',   glow: 'shadow-slate-100' };
};

const getDaysLeft = (deadline) => {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
};

// ── Icônes & catégories ──────────────────────────────────────────
const GOAL_CATEGORIES = [
  { label: 'Voyage',       icon: <Plane className="w-5 h-5" />,       color: 'bg-sky-500',     emoji: '✈️' },
  { label: 'Technologie',  icon: <Monitor className="w-5 h-5" />,      color: 'bg-violet-500',  emoji: '💻' },
  { label: 'Véhicule',     icon: <Car className="w-5 h-5" />,          color: 'bg-orange-500',  emoji: '🚗' },
  { label: 'Logement',     icon: <Home className="w-5 h-5" />,         color: 'bg-amber-500',   emoji: '🏠' },
  { label: 'Santé',        icon: <Heart className="w-5 h-5" />,        color: 'bg-rose-500',    emoji: '❤️' },
  { label: 'Éducation',    icon: <GraduationCap className="w-5 h-5" />,color: 'bg-indigo-500',  emoji: '📚' },
  { label: 'Shopping',     icon: <ShoppingBag className="w-5 h-5" />,  color: 'bg-pink-500',    emoji: '🛍️' },
  { label: 'Urgence',      icon: <Sparkles className="w-5 h-5" />,     color: 'bg-emerald-500', emoji: '🛡️' },
  { label: 'Autre',        icon: <Trophy className="w-5 h-5" />,       color: 'bg-slate-500',   emoji: '🏆' },
];

const getCategoryMeta = (label) => GOAL_CATEGORIES.find(c => c.label === label) || GOAL_CATEGORIES[8];

// ── Modal déconnexion ─────────────────────────────────────────────
function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-4 bg-rose-50 rounded-2xl"><LogOut className="w-7 h-7 text-rose-500" /></div>
          <h2 className="text-lg font-black text-slate-900">Déconnexion</h2>
          <p className="text-slate-500 text-sm">Êtes-vous sûr de vouloir vous déconnecter ?</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer">Annuler</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-all cursor-pointer">Se déconnecter</button>
        </div>
      </div>
    </div>
  );
}

// ── Carte Objectif ────────────────────────────────────────────────
function GoalCard({ goal, onDelete, onEdit, onAddFunds }) {
  const percent = Math.min((goal.saved / goal.target) * 100, 100);
  const remaining = goal.target - goal.saved;
  const colors = getProgressColor(percent);
  const daysLeft = getDaysLeft(goal.deadline);
  const catMeta = getCategoryMeta(goal.category);
  const isCompleted = percent >= 100;

  return (
    <div className={`relative bg-white rounded-2xl border ${isCompleted ? 'border-emerald-300' : 'border-slate-200/60'} p-5 shadow-sm flex flex-col gap-4 transition-all hover:shadow-lg ${isCompleted ? 'shadow-emerald-100' : ''}`}>

      {/* Badge complété */}
      {isCompleted && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md">
          <CheckCircle2 className="w-3 h-3" /> Objectif atteint !
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-start justify-between mt-1">
        <div className="flex items-center gap-3">
          {/* Icône catégorie */}
          <div className={`w-12 h-12 rounded-2xl ${catMeta.color} flex items-center justify-center text-white shadow-md`}>
            {catMeta.icon}
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm leading-tight">{goal.name}</h3>
            <span className="text-[10px] text-slate-400 font-semibold">{goal.category}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onEdit(goal)} className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(goal.id)} className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Description */}
      {goal.description && (
        <p className="text-xs text-slate-400 font-medium leading-relaxed -mt-1">{goal.description}</p>
      )}

      {/* Montants */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Épargné</p>
          <p className={`text-2xl font-black ${colors.text}`}>
            {goal.saved.toLocaleString('fr-FR')}
            <span className="text-xs ml-1">FCFA</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Objectif</p>
          <p className="text-2xl font-black text-slate-800">
            {goal.target.toLocaleString('fr-FR')}
            <span className="text-xs ml-1">FCFA</span>
          </p>
        </div>
      </div>

      {/* Jauge circulaire + linéaire */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className={colors.text}>{percent.toFixed(0)}% accompli</span>
          {!isCompleted && <span className="text-slate-400">Reste : {remaining.toLocaleString('fr-FR')} FCFA</span>}
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Deadline + bouton ajouter */}
      <div className="flex items-center justify-between pt-1">
        {/* Deadline */}
        {daysLeft !== null ? (
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-black ${
            daysLeft < 0 ? 'bg-red-50 text-red-600' :
            daysLeft <= 30 ? 'bg-orange-50 text-orange-600' :
            'bg-slate-50 text-slate-500'
          }`}>
            <Clock className="w-3 h-3" />
            {daysLeft < 0
              ? `Échéance dépassée de ${Math.abs(daysLeft)}j`
              : daysLeft === 0 ? "Aujourd'hui !"
              : `${daysLeft} jours restants`
            }
          </div>
        ) : (
          <span className="text-[10px] text-slate-300 font-semibold">Pas d'échéance</span>
        )}

        {/* Bouton ajouter des fonds */}
        {!isCompleted && (
          <button
            onClick={() => onAddFunds(goal)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black cursor-pointer transition-all shadow-sm shadow-indigo-600/20"
          >
            <Plus className="w-3 h-3" /> Ajouter
          </button>
        )}
        {isCompleted && (
          <div className="flex items-center gap-1 text-emerald-600 text-[11px] font-black">
            <Trophy className="w-3.5 h-3.5" /> Félicitations !
          </div>
        )}
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────
function Objectifs() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Modal création/édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Voyage');
  const [formDescription, setFormDescription] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formSaved, setFormSaved] = useState('');
  const [formDeadline, setFormDeadline] = useState('');

  // Modal ajout de fonds
  const [isFundsModalOpen, setIsFundsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [fundsAmount, setFundsAmount] = useState('');

  const userName = useCurrentUser();

  const fetchObjectifs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/objectifs');
      setGoals(res.data.objectifs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchObjectifs(); }, []);

  // ── Stats globales ─────────────────────────────────────────────
  const totalTarget  = goals.reduce((s, g) => s + g.target, 0);
  const totalSaved   = goals.reduce((s, g) => s + g.saved, 0);
  const completedCount = goals.filter(g => g.saved >= g.target).length;
  const inProgressCount = goals.filter(g => g.saved < g.target).length;
  const globalPercent = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

  // ── Ouvrir modal création ──────────────────────────────────────
  const openAddModal = () => {
    setEditingGoal(null);
    setFormName(''); setFormCategory('Voyage'); setFormDescription('');
    setFormTarget(''); setFormSaved('0'); setFormDeadline('');
    setIsModalOpen(true);
  };

  // ── Ouvrir modal édition ───────────────────────────────────────
  const openEditModal = (goal) => {
    setEditingGoal(goal);
    setFormName(goal.name); setFormCategory(goal.category);
    setFormDescription(goal.description || '');
    setFormTarget(String(goal.target)); setFormSaved(String(goal.saved));
    setFormDeadline(goal.deadline || '');
    setIsModalOpen(true);
  };

  // ── Sauvegarder objectif ───────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      name: formName,
      category: formCategory,
      description: formDescription,
      target: parseFloat(formTarget),
      saved: parseFloat(formSaved) || 0,
      deadline: formDeadline || null,
    };
    try {
      if (editingGoal) {
        await api.put(`/objectifs/${editingGoal.id}`, payload);
      } else {
        await api.post('/objectifs', payload);
      }
      setIsModalOpen(false);
      fetchObjectifs();
      showToast(editingGoal ? 'Objectif modifié' : 'Objectif créé', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de l\'enregistrement', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet objectif ?')) return;
    try {
      await api.delete(`/objectifs/${id}`);
      fetchObjectifs();
      showToast('Objectif supprimé', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  // ── Ajouter des fonds ──────────────────────────────────────────
  const openFundsModal = (goal) => {
    setSelectedGoal(goal);
    setFundsAmount('');
    setIsFundsModalOpen(true);
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    const amount = parseFloat(fundsAmount);
    if (!amount || amount <= 0) return;
    try {
      await api.patch(`/objectifs/${selectedGoal.id}/funds`, { amount });
      setIsFundsModalOpen(false);
      fetchObjectifs();
      showToast('Fonds ajoutés à l\'objectif', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de l\'ajout de fonds', 'error');
    }
  };

  // ── Déconnexion ────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});
      localStorage.removeItem('userName');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (err) { console.error(err); }
  };

  const globalColors = getProgressColor(globalPercent);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">

      {/* ════════════════════════════════════════════════════════ */}
      {/* SIDEBAR                                                  */}
      {/* ════════════════════════════════════════════════════════ */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[260px] h-full bg-white border-r border-slate-200/80 flex flex-col justify-between p-5 shrink-0 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between px-1">
          <CapBudgetLogo size="md" showText />
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-500 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="h-px  bg-gradient-to-r from-slate-200 via-slate-200 to-transparent" />

          <nav className="space-y-1">
            {[
              { label: "Vue d'ensemble", icon: <LayoutDashboard className="w-4 h-4" />, path: '/dashboard' },
              { label: 'Revenus', icon: <CircleDollarSign className="w-4 h-4" />, path: '/revenu' },
              { label: 'Depenses', icon: <CreditCard className="w-4 h-4" />, path: '/depense' },
              { label: 'Budget', icon: <Landmark className="w-4 h-4" />, path: '/budget' },
              { label: 'Objectifs', icon: <Trophy className="w-4 h-4" />, path: '/objectifs' },
              { label: 'Échéances', icon: <CalendarClock className="w-4 h-4" />, path: '/echeances' },
              { label: 'Rapports & Bilan', icon: <FileText className="w-4 h-4" />, path: '/rapports' },
            ].map(({ label, icon, path }) => (
              <button key={label} onClick={() => { navigate(path); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  window.location.pathname === path
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                }`}>
                {icon}<span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <button onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 transition-all cursor-pointer">
          <LogOut className="w-4 h-4" /><span>Déconnexion</span>
        </button>
      </aside>

      {isMobileMenuOpen && <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/20 z-40 md:hidden" />}
      {showLogoutModal && <LogoutModal onConfirm={handleLogout} onCancel={() => setShowLogoutModal(false)} />}

      {/* ════════════════════════════════════════════════════════ */}
      {/* CONTENU PRINCIPAL                                        */}
      {/* ════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* NAVBAR */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer">
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <p className="text-xs text-slate-400 font-medium">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <h1 className="text-sm font-black text-slate-900">
                {getGreeting()}, <span className="text-indigo-600">{userName}</span> 👋
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationPanel />
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
                {userName.charAt(0)}
              </div>
              <span className="text-sm font-bold text-slate-800 hidden sm:block">{userName}</span>
            </div>
          </div>
        </header>

        {/* ZONE SCROLLABLE */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">

          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Objectifs financiers</h1>
              <p className="text-slate-500 text-xs mt-0.5">Visualisez et financez vos projets concrets</p>
            </div>
            <button onClick={openAddModal}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2.5 shadow-md flex items-center gap-2 cursor-pointer font-bold text-sm transition-all">
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvel objectif</span>
            </button>
          </div>

          {/* ── 4 STATS ───────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total à atteindre</p>
              <p className="text-xl font-black text-slate-900 mt-1">{totalTarget.toLocaleString('fr-FR')}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">FCFA visés</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total épargné</p>
              <p className="text-xl font-black text-indigo-600 mt-1">{totalSaved.toLocaleString('fr-FR')}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">FCFA accumulés</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Objectifs atteints</p>
              <p className="text-xl font-black text-emerald-600 mt-1">{completedCount}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">sur {goals.length} objectifs</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">En cours</p>
              <p className="text-xl font-black text-amber-500 mt-1">{inProgressCount}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">projet(s) actif(s)</p>
            </div>
          </div>

          {/* ── PROGRESSION GLOBALE ───────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-sm">Progression globale</h3>
                <p className="text-slate-400 text-xs mt-0.5">Avancement sur l'ensemble de vos projets</p>
              </div>
              <span className={`text-3xl font-black ${globalColors.text}`}>{globalPercent.toFixed(0)}%</span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${globalColors.bar}`}
                  style={{ width: `${globalPercent}%` }} />
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                <span>{totalSaved.toLocaleString('fr-FR')} FCFA épargnés</span>
                <span>Objectif : {totalTarget.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>

            {/* Mini progression par objectif */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              {goals.map(g => {
                const pct = Math.min((g.saved / g.target) * 100, 100);
                const c = getProgressColor(pct);
                const cat = getCategoryMeta(g.category);
                return (
                  <div key={g.id} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        {cat.emoji} {g.name}
                      </span>
                      <span className={`text-[10px] font-black ${c.text}`}>{pct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── GRILLE OBJECTIFS ─────────────────────────────── */}
          {goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 gap-4">
              <div className="p-5 bg-slate-50 rounded-2xl"><Trophy className="w-10 h-10 text-slate-300" /></div>
              <div className="text-center">
                <p className="font-black text-slate-700">Aucun objectif défini</p>
                <p className="text-xs text-slate-400 mt-1">Créez votre premier objectif et commencez à épargner</p>
              </div>
              <button onClick={openAddModal}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-2.5 text-sm font-bold cursor-pointer transition-all">
                Créer un objectif
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {goals.map(g => (
                <GoalCard key={g.id} goal={g} onDelete={handleDelete} onEdit={openEditModal} onAddFunds={openFundsModal} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* MODALE CRÉATION / ÉDITION                               */}
      {/* ════════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3 sm:p-0">
          <div className="mobile-modal-card bg-white rounded-2xl shadow-2xl p-5 sm:p-8 w-full max-w-md flex flex-col gap-4 sm:gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">{editingGoal ? 'Modifier l\'objectif' : 'Nouvel objectif'}</h2>
                <p className="text-slate-400 text-xs mt-0.5">Définissez votre projet financier</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">

              {/* Catégorie — sélection visuelle */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700">Catégorie</label>
                <div className="grid grid-cols-3 gap-2">
                  {GOAL_CATEGORIES.map(cat => (
                    <button key={cat.label} type="button" onClick={() => setFormCategory(cat.label)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all cursor-pointer text-center ${
                        formCategory === cat.label
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-slate-100 hover:border-slate-200 bg-slate-50'
                      }`}>
                      <span className="text-lg">{cat.emoji}</span>
                      <span className="text-[10px] font-bold text-slate-600">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nom */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Nom de l'objectif</label>
                <input type="text" placeholder="Ex: MacBook Pro, Voyage à Paris..." value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/10 transition-all"
                  required />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Description <span className="text-slate-400 font-normal">(optionnel)</span></label>
                <input type="text" placeholder="Pourquoi cet objectif ?" value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:bg-white transition-all" />
              </div>

              {/* Montant cible */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Montant cible (FCFA)</label>
                <input type="number" placeholder="Ex: 500000" value={formTarget}
                  onChange={(e) => setFormTarget(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/10 transition-all"
                  required />
              </div>

              {/* Montant déjà épargné */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Déjà épargné (FCFA)</label>
                <input type="number" placeholder="0" value={formSaved}
                  onChange={(e) => setFormSaved(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:bg-white transition-all" />
              </div>

              {/* Échéance */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Date limite <span className="text-slate-400 font-normal">(optionnel)</span></label>
                <input type="date" value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:bg-white transition-all" />
              </div>

              {/* Aperçu en temps réel */}
              {formTarget && (
                <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-2 border border-slate-100">
                  <p className="text-[11px] font-bold text-slate-500">Aperçu</p>
                  {(() => {
                    const pct = Math.min(((parseFloat(formSaved) || 0) / parseFloat(formTarget)) * 100, 100);
                    const c = getProgressColor(pct);
                    return (
                      <>
                        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${c.bar} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className={c.text}>{pct.toFixed(0)}% accompli</span>
                          <span className="text-slate-500">
                            Reste : {(parseFloat(formTarget) - (parseFloat(formSaved) || 0)).toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/20">
                  {editingGoal ? 'Enregistrer' : 'Créer l\'objectif'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* MODALE AJOUT DE FONDS                                   */}
      {/* ════════════════════════════════════════════════════════ */}
      {isFundsModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">Ajouter des fonds</h2>
                <p className="text-slate-400 text-xs mt-0.5">{selectedGoal.name}</p>
              </div>
              <button onClick={() => setIsFundsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl bg-slate-50 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progression actuelle */}
            <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>{selectedGoal.saved.toLocaleString('fr-FR')} FCFA</span>
                <span>{selectedGoal.target.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${getProgressColor((selectedGoal.saved / selectedGoal.target) * 100).bar}`}
                  style={{ width: `${Math.min((selectedGoal.saved / selectedGoal.target) * 100, 100)}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 font-semibold">
                Reste {(selectedGoal.target - selectedGoal.saved).toLocaleString('fr-FR')} FCFA à atteindre
              </p>
            </div>

            {/* Montants rapides */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-slate-700">Montant rapide</p>
              <div className="grid grid-cols-3 gap-2">
                {[5000, 10000, 25000, 50000, 100000, 200000].map(amt => (
                  <button key={amt} type="button" onClick={() => setFundsAmount(String(amt))}
                    className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      fundsAmount === String(amt)
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-indigo-300'
                    }`}>
                    {amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddFunds} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Montant personnalisé (FCFA)</label>
                <input type="number" placeholder="Ex: 15000" value={fundsAmount}
                  onChange={(e) => setFundsAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/10 transition-all"
                  required />
              </div>

              {/* Aperçu après ajout */}
              {fundsAmount && parseFloat(fundsAmount) > 0 && (
                <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                  {(() => {
                    const newSaved = selectedGoal.saved + parseFloat(fundsAmount);
                    const newPct = Math.min((newSaved / selectedGoal.target) * 100, 100);
                    const c = getProgressColor(newPct);
                    return (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-indigo-600">Après versement</span>
                          <span className={c.text}>{newPct.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${newPct}%` }} />
                        </div>
                        <p className="text-[10px] text-indigo-500 font-semibold">
                          Nouveau solde : {Math.min(newSaved, selectedGoal.target).toLocaleString('fr-FR')} FCFA
                          {newSaved >= selectedGoal.target && ' 🎉 Objectif atteint !'}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setIsFundsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold cursor-pointer shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Verser
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Objectifs;
