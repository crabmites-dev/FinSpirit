import { useState, useEffect } from 'react';
import api from './api.js';
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Search, PlusCircle, Trash2, ChevronLeft, ChevronRight, AlertCircle,
  ArrowDownRight, X, LayoutDashboard, LogOut,
  CircleDollarSign, Bell, Menu, CreditCard, Landmark, CalendarClock,
  Trophy, FileText
} from 'lucide-react';
import PastMonthsSection from './PastMonthsSection.jsx';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext.jsx';
import FinSpiritLogo from './FinSpiritLogo.jsx';
import AppFooter from './AppFooter.jsx';
import { useCurrentUser } from './useCurrentUser.js';
import NotificationPanel from './NotificationPanel.jsx';
import { CHART_MARGIN, CHART_Y_AXIS_PROPS } from './formatUtils.js';
const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#fb7185', '#8b5cf6', '#14b8a6'];

const fakeExpenseGraph = [
  { name: 'Logement',      value: 250000 },
  { name: 'Alimentation',  value: 85000  },
  { name: 'Transport',     value: 45000  },
  { name: 'Factures',      value: 30000  },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Bonjour';
  if (h >= 12 && h < 18) return 'Bon après-midi';
  return 'Bonsoir';
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
          <p className="text-slate-500 text-sm">
            Êtes-vous sûr de vouloir vous déconnecter ?
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer">
            Annuler
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-all cursor-pointer">
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────
function Depenses() {  // ✅ Fix 1 — renommé Depenses (pas Revenus)
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [hasSample, setHasSample] = useState(false);

  // Modal ajout
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Logement'); // ✅ Fix 2 — valeur initiale cohérente avec les options
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6;

  const userName = useCurrentUser();

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchDepenses = async () => { // ✅ Fix 3 — renommé fetchDepenses
    try {
      setLoading(true);
      const res = await api.get('/transactions');
      // ✅ Fix 4 — filtre 'expense' et non 'income'
      const expenseOnly = (res.data.transactions || []).filter(t => t.type === 'expense');
      setTransactions(expenseOnly);
    } catch (err) {
      console.error('Erreur lors du chargement des dépenses :', err);
    } finally {
      setLoading(false);
    }
  };

  const checkSampleData = async () => {
    try {
      const res = await api.get('/auth/sample-data');
      setHasSample(res.data.hasSample);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { 
    fetchDepenses();
    checkSampleData();
  }, []);

  // ── Total dépenses ─────────────────────────────────────────────
  const totalExpense = transactions.reduce((acc, t) => acc + parseFloat(t.amount), 0);

  // ── Déconnexion ────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});
      localStorage.removeItem('userName');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (err) {
      console.error('Erreur déconnexion:', err);
    }
  };

  // ── Ajout dépense ──────────────────────────────────────────────
  const handleAddExpense = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      await api.post('/transactions', {
        title,
        amount: parseFloat(amount),
        type: 'expense',
        category,
        date
      });
      setIsModalOpen(false);
      setTitle('');
      setAmount('');
      setCategory('Logement');
      fetchDepenses();
      showToast('Dépense ajoutée avec succès', 'success');
    } catch (err) {
      console.error("Erreur lors de l'ajout de la dépense :", err);
      setModalError(err.response?.data?.message || "Impossible d'ajouter la dépense. Vérifiez votre connexion.");
      showToast(err.response?.data?.message || "Impossible d'ajouter la dépense", 'error');
    } finally {
      setModalLoading(false);
    }
  };

  // ── Suppression ────────────────────────────────────────────────
  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Voulez-vous supprimer cette dépense ?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchDepenses();
      showToast('Dépense supprimée', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  // ── Filtrage & Pagination ──────────────────────────────────────
  const filteredExpenses = transactions.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const indexOfLastRow  = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows     = filteredExpenses.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages      = Math.ceil(filteredExpenses.length / rowsPerPage);
  const categoriesList  = [...new Set(transactions.map(t => t.category))];

  // ── Données graphique ──────────────────────────────────────────
  const realGraphData = categoriesList.map(cat => ({
    name: cat,
    value: transactions.filter(t => t.category === cat).reduce((s, t) => s + parseFloat(t.amount), 0)
  }));
  const graphDataToUse = realGraphData.length > 0 ? realGraphData : (hasSample ? fakeExpenseGraph : []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">

      {/* SIDEBAR */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[260px] h-full bg-white border-r border-slate-200/80 flex flex-col justify-between p-5 shrink-0 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between px-1">
            <FinSpiritLogo size="md" showText />
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-500 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Separator */}
          <div className="h-px bg-gradient-to-r from-slate-200 via-slate-200 to-transparent" />

          <nav className="space-y-1">
            {[
              { label: "Vue d'ensemble", icon: <LayoutDashboard className="w-4 h-4" />, path: '/dashboard' },
              { label: 'Revenus',        icon: <CircleDollarSign className="w-4 h-4" />, path: '/revenu' },
              { label: 'Dépenses',       icon: <CreditCard className="w-4 h-4" />,       path: '/depense' },
              { label: 'Budget',         icon: <Landmark className="w-4 h-4" />,          path: '/budget' },
              { label: 'Objectifs',      icon: <Trophy className="w-4 h-4" />,            path: '/objectifs' },
              { label: 'Échéances',      icon: <CalendarClock className="w-4 h-4" />,     path: '/echeances' },
              { label: 'Rapports & Bilan', icon: <FileText className="w-4 h-4" />,        path: '/rapports' },
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

      {isMobileMenuOpen && (
        <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/20 z-40 md:hidden" />
      )}

      {showLogoutModal && (
        <LogoutModal onConfirm={handleLogout} onCancel={() => setShowLogoutModal(false)} />
      )}

      {/* CONTENU PRINCIPAL */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* NAVBAR */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer">
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
              {/* ✅ Fix 7 — titre corrigé "Dépenses" au lieu de "Revenus" */}
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Dépenses</h1>
              <p className="text-slate-500 text-xs mt-0.5">Suivez et maîtrisez vos sorties d'argent</p>
            </div>
            <button onClick={() => { setModalError(''); setIsModalOpen(true); }}
              className="bg-rose-500 hover:bg-rose-400 text-white rounded-xl px-4 py-2.5 shadow-md flex items-center gap-2 cursor-pointer font-bold text-sm transition-all">
              <PlusCircle className="w-4 h-4" />
              {/* ✅ Fix 8 — libellé bouton corrigé */}
              <span className="hidden sm:inline">Ajouter une dépense</span>
            </button>
          </div>

          {/* STATS + GRAPHIQUE */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

            {/* Carte total */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between h-[280px]">
              <div>
                {/* ✅ Fix 9 — libellé et couleur cohérents dépenses */}
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Dépenses totales</span>
                <h2 className="text-3xl font-black text-rose-500 mt-2">
                  -{totalExpense.toLocaleString('fr-FR')} FCFA
                </h2>
                <p className="text-slate-400 text-xs mt-1">Calculé sur la base de vos dépenses</p>
              </div>
              <div className="flex items-center gap-3 bg-rose-50/60 border border-rose-100 p-4 rounded-xl">
                <div className="p-2 bg-rose-500 rounded-xl text-white">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
                <p className="text-xs text-rose-800 font-semibold leading-relaxed">
                  Maîtriser vos dépenses est essentiel pour atteindre vos objectifs financiers.
                </p>
              </div>
            </div>

            {/* Graphique barres */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/60 shadow-sm lg:col-span-2 h-[280px] flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Évolution par catégories</h4>
                <p className="text-slate-400 text-[11px] mt-0.5">Suivi global de vos dépenses</p>
              </div>
              <div className="w-full h-[180px] overflow-visible">
                {graphDataToUse.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-slate-400 font-semibold">Aucune donnée à afficher</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={graphDataToUse} margin={CHART_MARGIN}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#94a3b8" style={{ fontSize: '11px', fontWeight: 600 }} />
                      <YAxis {...CHART_Y_AXIS_PROPS} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        formatter={(value) => [`${value.toLocaleString('fr-FR')} FCFA`, 'Total']}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
                        {graphDataToUse.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </section>

          {/* HISTORIQUE DES MOIS PASSÉS */}
          <PastMonthsSection
            type="expense"
            title="Historique des dépenses des mois passés"
            subtitle="Comparez vos sorties d'argent avec les mois précédents et suivez vos tendances"
          />

          {/* TABLEAU */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-4">

            {/* Filtres */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex-1 max-w-md focus-within:border-rose-500 focus-within:bg-white transition-all">
                <Search className="text-slate-400 w-4 h-4" />
                <input type="text" placeholder="Rechercher une dépense..." value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent text-slate-900 outline-none w-full text-xs placeholder:text-slate-400" />
              </div>
              <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:border-rose-500 cursor-pointer h-[34px]">
                <option value="all">📁 Filtrer par catégorie</option>
                {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* Contenu tableau */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : currentRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <AlertCircle className="w-7 h-7 text-slate-300" />
                <p className="text-xs text-slate-400 font-semibold">Aucune dépense trouvée.</p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs font-semibold border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-3 pl-2">Catégorie</th>
                      <th className="py-3 pr-4">Description</th>
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3 pr-4 text-right">Montant</th>
                      <th className="py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {currentRows.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-3.5 pl-2 pr-4">
                          {/* ✅ Fix 10 — badge rouge pour les dépenses */}
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-[10px] font-black">
                            {t.category}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 text-slate-600 font-medium">{t.title}</td>
                        <td className="py-3.5 pr-4 text-slate-400">
                          {new Date(t.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3.5 pr-4 text-right font-black text-rose-600 text-sm">
                          {/* ✅ Fix 11 — signe - pour les dépenses */}
                          -{parseFloat(t.amount).toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="py-3.5 text-center">
                          <button onClick={() => handleDeleteExpense(t.id)}
                            className=" p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-400 font-semibold">
                  <span className="text-slate-700 font-black">{indexOfFirstRow + 1}</span>{' '}–{' '}
                  <span className="text-slate-700 font-black">{Math.min(indexOfLastRow, filteredExpenses.length)}</span>{' '}sur{' '}
                  <span className="text-slate-700 font-black">{filteredExpenses.length}</span> dépenses
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        currentPage === p ? 'bg-rose-500 text-white shadow-sm' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}>{p}</button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
          <AppFooter />
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODALE AJOUT DÉPENSE                                       */}
      {/* ══════════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3 sm:p-0">
          <div className="mobile-modal-card bg-white rounded-2xl shadow-2xl p-5 sm:p-8 w-full max-w-md flex flex-col gap-4 sm:gap-5">
            <div className="flex items-center justify-between">
              <div>
                {/* ✅ Fix 12 — titre modal correct */}
                <h2 className="text-base font-black text-slate-900">Nouvelle dépense</h2>
                <p className="text-slate-400 text-xs mt-0.5">Renseignez les informations de votre dépense</p>
              </div>
              <button onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ✅ Fix 13 — onSubmit pointe sur handleAddExpense */}
            <form onSubmit={handleAddExpense} className="flex flex-col gap-4">

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Titre</label>
                <input type="text" placeholder="Ex: Loyer, Courses, Facture..." value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/10 transition-all"
                  required />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Montant (FCFA)</label>
                <input type="number" placeholder="Ex: 45000" value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/10 transition-all"
                  required />
              </div>

              <div className="flex flex-col gap-1.5">
                {/* ✅ Fix 14 — libellé "Catégorie" au lieu de "Source du gain" */}
                <label className="text-xs font-bold text-slate-700">Catégorie</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 cursor-pointer transition-all">
                  <option value="Logement">🏠 Logement & Charges</option>
                  <option value="Alimentation">🛒 Alimentation & Courses</option>
                  <option value="Courses">🛒 Courses alimentaires</option>
                  <option value="Transport">🚗 Transports & Véhicule</option>
                  <option value="Factures">⚡ Factures & Abonnements</option>
                  <option value="Loisirs">🎉 Loisirs & Sorties</option>
                  <option value="Restaurants">🍽️ Restaurants</option>
                  <option value="Santé">🩺 Santé & Bien-être</option>
                  <option value="Shopping">🛍️ Shopping & Équipement</option>
                  <option value="Vêtements">👗 Vêtements & Mode</option>
                  <option value="Autre">💸 Autre dépense</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:bg-white transition-all"
                  required />
              </div>

              <div className="flex flex-col gap-3 pt-1">
                {modalError && (
                  <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                    {modalError}
                  </p>
                )}
                <div className="flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer">
                  Annuler
                </button>
                <button type="submit" disabled={modalLoading}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-sm font-bold transition-all cursor-pointer shadow-md shadow-rose-500/20 disabled:opacity-60 disabled:cursor-not-allowed">
                  {modalLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Envoi...</span>
                    </div>
                  ) : "Valider l'opération"}
                </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Depenses;
