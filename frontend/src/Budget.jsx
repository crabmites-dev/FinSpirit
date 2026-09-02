import { useState, useEffect } from 'react';
import api from './api.js';
import {
  PlusCircle, Trash2, X, LayoutDashboard, ReceiptEuro, HandCoins,
  LogOut, CircleDollarSign, Bell, Menu, CreditCard, Landmark, Trophy, Target,
  CalendarClock, AlertTriangle, CheckCircle2, TrendingDown, Edit3, ArrowLeftRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext.jsx';
import CapBudgetLogo from './CapBudgetLogo.jsx';
import { useCurrentUser } from './useCurrentUser.js';
import NotificationPanel from './NotificationPanel.jsx';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Bonjour';
  if (h >= 12 && h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

// ── Couleur de la jauge selon le % utilisé ──────────────────────
const getGaugeColor = (percent) => {
  if (percent >= 100) return { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' };
  if (percent >= 80)  return { bar: 'bg-orange-400', text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' };
  if (percent >= 50)  return { bar: 'bg-yellow-400', text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700' };
  return { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' };
};

const getStatusLabel = (percent) => {
  if (percent >= 100) return { label: 'Dépassé', icon: <AlertTriangle className="w-3 h-3" /> };
  if (percent >= 80)  return { label: 'Attention', icon: <AlertTriangle className="w-3 h-3" /> };
  if (percent >= 50)  return { label: 'En cours', icon: <TrendingDown className="w-3 h-3" /> };
  return { label: 'Sous contrôle', icon: <CheckCircle2 className="w-3 h-3" /> };
};

// ── Icônes catégories ────────────────────────────────────────────
const CATEGORY_ICONS = {
  'Courses': '🛒',
  'Transport': '🚗',
  'Loisirs': '🎮',
  'Santé': '💊',
  'Restaurants': '🍽️',
  'Vêtements': '👗',
  'Logement': '🏠',
  'Éducation': '📚',
  'Épargne': '🐷',
  'Autre': '📦',
};

// ── Modal déconnexion ─────────────────────────────────────────────
function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-4 bg-rose-50 rounded-2xl">
            <LogOut className="w-7 h-7 text-rose-500" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Déconnexion</h2>
          <p className="text-slate-500 text-sm">Êtes-vous sûr de vouloir vous déconnecter ?</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer">Annuler</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-all cursor-pointer shadow-md shadow-rose-500/20">Se déconnecter</button>
        </div>
      </div>
    </div>
  );
}

// ── Carte Budget ──────────────────────────────────────────────────
function BudgetCard({ budget, onDelete, onEdit }) {
  const percent = Math.min((budget.spent / budget.limit) * 100, 100);
  const remaining = budget.limit - budget.spent;
  const colors = getGaugeColor(percent);
  const status = getStatusLabel(percent);

  return (
    <div className={`bg-white rounded-2xl border ${percent >= 80 ? colors.border : 'border-slate-200/60'} p-5 shadow-sm flex flex-col gap-4 transition-all hover:shadow-md`}>

      {/* En-tête carte */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center text-xl`}>
            {CATEGORY_ICONS[budget.category] || '📦'}
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm">{budget.name}</h3>
            <span className="text-[10px] text-slate-400 font-semibold">{budget.category}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Badge statut */}
          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black ${colors.badge}`}>
            {status.icon}{status.label}
          </span>
          {/* Actions */}
          <button onClick={() => onEdit(budget)} className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(budget.id)} className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Montants */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Dépensé</p>
          <p className={`text-xl font-black ${colors.text}`}>{budget.spent.toLocaleString('fr-FR')} <span className="text-xs">FCFA</span></p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Limite</p>
          <p className="text-xl font-black text-slate-800">{budget.limit.toLocaleString('fr-FR')} <span className="text-xs">FCFA</span></p>
        </div>
      </div>

      {/* Jauge */}
      <div className="flex flex-col gap-2">
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400">{percent.toFixed(0)}% utilisé</span>
          <span className={`text-[10px] font-black ${remaining < 0 ? 'text-red-600' : 'text-slate-600'}`}>
            {remaining < 0
              ? `⚠️ Dépassement de ${Math.abs(remaining).toLocaleString('fr-FR')} FCFA`
              : `Reste : ${remaining.toLocaleString('fr-FR')} FCFA`
            }
          </span>
        </div>
      </div>

      {/* Alerte dépassement */}
      {percent >= 100 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <p className="text-[10px] font-bold text-red-700">Budget dépassé ! Révisez vos dépenses.</p>
        </div>
      )}
      {percent >= 80 && percent < 100 && (
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <p className="text-[10px] font-bold text-orange-700">Attention ! Vous approchez de votre limite.</p>
        </div>
      )}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────
function Budget() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  // Formulaire
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Courses');
  const [formLimit, setFormLimit] = useState('');
  const [formSpent, setFormSpent] = useState('');

  const userName = useCurrentUser();

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/budgets');
      setBudgets(res.data.budgets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBudgets(); }, []);

  // ── Stats globales ─────────────────────────────────────────────
  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalLimit - totalSpent;
  const globalPercent = totalLimit > 0 ? Math.min((totalSpent / totalLimit) * 100, 100) : 0;
  const overBudgetCount = budgets.filter(b => b.spent >= b.limit).length;
  const warningCount = budgets.filter(b => (b.spent / b.limit) >= 0.8 && b.spent < b.limit).length;

  // ── Ouvrir modal ajout ─────────────────────────────────────────
  const openAddModal = () => {
    setEditingBudget(null);
    setFormName('');
    setFormCategory('Courses');
    setFormLimit('');
    setFormSpent('0');
    setIsModalOpen(true);
  };

  // ── Ouvrir modal édition ───────────────────────────────────────
  const openEditModal = (budget) => {
    setEditingBudget(budget);
    setFormName(budget.name);
    setFormCategory(budget.category);
    setFormLimit(String(budget.limit));
    setFormSpent(String(budget.spent));
    setIsModalOpen(true);
  };

  // ── Sauvegarder ───────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      name: formName,
      category: formCategory,
      limit: parseFloat(formLimit),
      spent: parseFloat(formSpent) || 0,
    };
    try {
      if (editingBudget) {
        await api.put(`/budgets/${editingBudget.id}`, payload);
      } else {
        await api.post('/budgets', payload);
      }
      setIsModalOpen(false);
      fetchBudgets();
      showToast(editingBudget ? 'Budget modifié' : 'Budget créé', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de l\'enregistrement', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce budget ?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      fetchBudgets();
      showToast('Budget supprimé', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  // ── Déconnexion ────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});      localStorage.removeItem('userName');      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  const globalColors = getGaugeColor(globalPercent);

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
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-500 hover:text-slate-900 cursor-pointer">
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
              { label: 'Echéances', icon: <CalendarClock className="w-4 h-4" />, path: '/echeances' },
            ].map(({ label, icon, path }) => (
              <button key={label} onClick={() => { navigate(path); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
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
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-bold text-slate-800 hidden sm:block">{userName}</span>
            </div>
          </div>
        </header>

        {/* ZONE SCROLLABLE */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">

          {/* En-tête page */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Budgets</h1>
              <p className="text-slate-500 text-xs mt-0.5">Fixez vos limites et suivez vos dépenses en temps réel</p>
            </div>
            <button onClick={openAddModal}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2.5 shadow-md flex items-center gap-2 cursor-pointer font-bold text-sm transition-all">
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Nouveau budget</span>
            </button>
          </div>

          {/* ── 4 STATS GLOBALES ─────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex flex-col gap-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Budget total</p>
              <p className="text-xl font-black text-slate-900">{totalLimit.toLocaleString('fr-FR')}</p>
              <p className="text-[10px] text-slate-400">FCFA alloués</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex flex-col gap-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total dépensé</p>
              <p className={`text-xl font-black ${globalColors.text}`}>{totalSpent.toLocaleString('fr-FR')}</p>
              <p className="text-[10px] text-slate-400">FCFA utilisés</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex flex-col gap-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reste disponible</p>
              <p className={`text-xl font-black ${totalRemaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {totalRemaining.toLocaleString('fr-FR')}
              </p>
              <p className="text-[10px] text-slate-400">FCFA restants</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex flex-col gap-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Alertes actives</p>
              <p className="text-xl font-black text-red-500">{overBudgetCount + warningCount}</p>
              <p className="text-[10px] text-slate-400">{overBudgetCount} dépassé(s) · {warningCount} en alerte</p>
            </div>
          </div>

          {/* ── JAUGE GLOBALE ─────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-sm">Vue d'ensemble budgétaire</h3>
                <p className="text-slate-400 text-xs mt-0.5">Consommation globale de tous vos budgets</p>
              </div>
              <span className={`text-2xl font-black ${globalColors.text}`}>{globalPercent.toFixed(0)}%</span>
            </div>

            {/* Grande jauge globale */}
            <div className="flex flex-col gap-2">
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${globalColors.bar}`}
                  style={{ width: `${globalPercent}%` }} />
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                <span>0 FCFA</span>
                <span>{totalLimit.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>

            {/* Mini jauges par budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              {budgets.map(b => {
                const pct = Math.min((b.spent / b.limit) * 100, 100);
                const c = getGaugeColor(pct);
                return (
                  <div key={b.id} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-600">{CATEGORY_ICONS[b.category]} {b.name}</span>
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

          {/* ── GRILLE DES BUDGETS ────────────────────────────── */}
          {budgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 gap-4">
              <div className="p-5 bg-slate-50 rounded-2xl">
                <Target className="w-10 h-10 text-slate-300" />
              </div>
              <div className="text-center">
                <p className="font-black text-slate-700">Aucun budget créé</p>
                <p className="text-xs text-slate-400 mt-1">Créez votre premier budget pour commencer le suivi</p>
              </div>
              <button onClick={openAddModal}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-2.5 text-sm font-bold cursor-pointer transition-all">
                Créer un budget
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {budgets.map(b => (
                <BudgetCard key={b.id} budget={b} onDelete={handleDelete} onEdit={openEditModal} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* MODALE AJOUT / ÉDITION BUDGET                           */}
      {/* ════════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col gap-5">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  {editingBudget ? 'Modifier le budget' : 'Nouveau budget'}
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  {editingBudget ? 'Mettez à jour vos informations' : 'Définissez votre enveloppe budgétaire'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">

              {/* Nom */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Nom du budget</label>
                <input type="text" placeholder="Ex: Courses mensuelles, Loisirs..." value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/10 transition-all"
                  required />
              </div>

              {/* Catégorie */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Catégorie</label>
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 cursor-pointer transition-all">
                  {Object.entries(CATEGORY_ICONS).map(([cat, icon]) => (
                    <option key={cat} value={cat}>{icon} {cat}</option>
                  ))}
                </select>
              </div>

              {/* Limite */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Limite budgétaire (FCFA)</label>
                <input type="number" placeholder="Ex: 50000" value={formLimit}
                  onChange={(e) => setFormLimit(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/10 transition-all"
                  required />
              </div>

              {/* Montant déjà dépensé */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Montant déjà dépensé (FCFA)</label>
                <input type="number" placeholder="0" value={formSpent}
                  onChange={(e) => setFormSpent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/10 transition-all" />
                <p className="text-[10px] text-slate-400">Laissez à 0 si le budget vient d'être créé</p>
              </div>

              {/* Aperçu jauge en temps réel */}
              {formLimit && (
                <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-2 border border-slate-100">
                  <p className="text-[11px] font-bold text-slate-500">Aperçu de la jauge</p>
                  {(() => {
                    const pct = Math.min(((parseFloat(formSpent) || 0) / parseFloat(formLimit)) * 100, 100);
                    const c = getGaugeColor(pct);
                    return (
                      <>
                        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${c.bar} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className={c.text}>{pct.toFixed(0)}% utilisé</span>
                          <span className="text-slate-500">
                            Reste : {(parseFloat(formLimit) - (parseFloat(formSpent) || 0)).toLocaleString('fr-FR')} FCFA
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
                  {editingBudget ? 'Enregistrer' : 'Créer le budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Budget;
