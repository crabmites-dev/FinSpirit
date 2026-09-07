import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from './api.js';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, CartesianGrid, XAxis, YAxis
} from 'recharts';
import {
  FileText, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Wallet,
  Landmark, Target, CreditCard, CircleDollarSign, LayoutDashboard,
  CalendarClock, Trophy, LogOut, Menu, X, Search, Send
} from 'lucide-react';
import { useToast } from './ToastContext.jsx';
import FinSpiritLogo from './FinSpiritLogo.jsx';
import { useCurrentUser } from './useCurrentUser.js';
import NotificationPanel from './NotificationPanel.jsx';
import { CHART_MARGIN, CHART_Y_AXIS_PROPS } from './formatUtils.js';

const PIE_COLORS = [
  '#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#ec4899', '#3b82f6', '#14b8a6', '#f97316'
];

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Bonjour';
  if (h >= 12 && h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

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
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-all cursor-pointer shadow-md shadow-rose-500/20"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Rapports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const userName = useCurrentUser();

  const now = new Date();
  const initialYear = parseInt(searchParams.get('year'), 10) || now.getFullYear();
  const initialMonth = parseInt(searchParams.get('month'), 10) || (now.getMonth() + 1);

  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

  const [historyList, setHistoryList] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6;

  // Charger la liste des mois disponibles
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/reports/history');
        setHistoryList(res.data.history || []);
      } catch (err) {
        console.error('Erreur chargement historique:', err);
      }
    };
    fetchHistory();
  }, []);

  // Charger les données détaillées du mois sélectionné
  useEffect(() => {
    const fetchMonthlyReport = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/reports/monthly?year=${selectedYear}&month=${selectedMonth}`);
        setReport(res.data.report);
      } catch (err) {
        console.error('Erreur chargement bilan mensuel:', err);
        showToast('Impossible de charger le rapport du mois sélectionné', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchMonthlyReport();
  }, [selectedYear, selectedMonth, showToast]);

  // Synchroniser l'URL avec les paramètres sélectionnés
  const handleSelectMonth = (year, month) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setSearchParams({ year: String(year), month: String(month) });
    setCurrentPage(1);
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      handleSelectMonth(selectedYear - 1, 12);
    } else {
      handleSelectMonth(selectedYear, selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      handleSelectMonth(selectedYear + 1, 1);
    } else {
      handleSelectMonth(selectedYear, selectedMonth + 1);
    }
  };

  // Envoi de l'email
  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      const res = await api.post('/reports/send-email', {
        year: selectedYear,
        month: selectedMonth
      });
      showToast(res.data.message || 'Rapport envoyé avec succès à votre adresse email !', 'success');
    } catch (err) {
      console.error('Erreur envoi email:', err);
      showToast(err.response?.data?.message || 'Erreur lors de l\'envoi de l\'e-mail.', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});
      localStorage.removeItem('userName');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  // Filtrer les transactions du mois pour la table
  const filteredTransactions = useMemo(() => {
    if (!report?.transactions) return [];
    if (!searchTerm.trim()) return report.transactions;
    const q = searchTerm.toLowerCase();
    return report.transactions.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.note && t.note.toLowerCase().includes(q))
    );
  }, [report, searchTerm]);

  const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const monthLabel = `${MONTH_NAMES_FR[selectedMonth - 1]} ${selectedYear}`;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">

      {/* SIDEBAR */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[260px] h-full bg-white border-r border-slate-200/80 flex flex-col justify-between p-5 shrink-0 transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between px-1">
            <FinSpiritLogo size="md" showText />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-slate-500 hover:text-indigo-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="h-px bg-gradient-to-r from-slate-200 via-slate-200 to-transparent" />

          <nav className="space-y-1">
            {[
              { label: "Vue d'ensemble", icon: <LayoutDashboard className="w-4 h-4" />, path: '/dashboard' },
              { label: 'Revenus', icon: <CircleDollarSign className="w-4 h-4" />, path: '/revenu' },
              { label: 'Dépenses', icon: <CreditCard className="w-4 h-4" />, path: '/depense' },
              { label: 'Budget', icon: <Landmark className="w-4 h-4" />, path: '/budget' },
              { label: 'Objectifs', icon: <Trophy className="w-4 h-4" />, path: '/objectifs' },
              { label: 'Échéances', icon: <CalendarClock className="w-4 h-4" />, path: '/echeances' },
              { label: 'Rapports & Bilan', icon: <FileText className="w-4 h-4" />, path: '/rapports' },
            ].map(({ label, icon, path }) => {
              const isActive = window.location.pathname === path;
              return (
                <button
                  key={label}
                  onClick={() => { navigate(path); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 font-bold'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                  }`}
                >
                  {icon}<span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
        >
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

        {/* HEADER NAVBAR */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
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

          {/* BANNIÈRE ET CONTRÔLES DU MOIS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    Rapports & Bilan Financier
                  </h1>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Consultez vos dépenses passées et recevez votre bilan mensuel détaillé
                  </p>
                </div>
              </div>
            </div>

            {/* ACTION ENVOI EMAIL */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {sendingEmail ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{sendingEmail ? 'Envoi en cours...' : 'M\'envoyer ce bilan par e-mail'}</span>
              </button>
            </div>
          </div>

          {/* SÉLECTEUR DE MOIS (BARRE HORIZONTALE DE NAVIGATION) */}
          <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-2xl border border-slate-200/60 shadow-sm overflow-x-auto">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-all cursor-pointer shrink-0"
              title="Mois précédent"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {historyList.map(h => {
                const isSelected = h.year === selectedYear && h.month === selectedMonth;
                return (
                  <button
                    key={`${h.year}-${h.month}`}
                    onClick={() => handleSelectMonth(h.year, h.month)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {h.monthLabel}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-all cursor-pointer shrink-0"
              title="Mois suivant"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-semibold">Génération du bilan de {monthLabel}...</p>
            </div>
          ) : !report ? (
            <div className="py-20 text-center text-sm text-slate-400 font-semibold">
              Aucune information disponible pour ce mois.
            </div>
          ) : (
            <>
              {/* 4 CARTES STATISTIQUES CLES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Revenus */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Revenus</span>
                    <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-black text-emerald-600">
                      +{report.totalIncome.toLocaleString('fr-FR')} FCFA
                    </p>
                    {report.comparison?.prevIncome > 0 && (
                      <p className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1">
                        <span className={`font-bold ${report.comparison.incomeDiffPercent >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {report.comparison.incomeDiffPercent >= 0 ? '+' : ''}{report.comparison.incomeDiffPercent}%
                        </span>
                        <span>vs mois précédent</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Dépenses */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Dépenses</span>
                    <div className="p-2.5 bg-rose-50 rounded-xl text-rose-500">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-black text-rose-500">
                      -{report.totalExpense.toLocaleString('fr-FR')} FCFA
                    </p>
                    {report.comparison?.prevExpense > 0 && (
                      <p className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1">
                        <span className={`font-bold ${report.comparison.expenseDiffPercent <= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {report.comparison.expenseDiffPercent > 0 ? '+' : ''}{report.comparison.expenseDiffPercent}%
                        </span>
                        <span>vs mois précédent</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Épargne / Solde */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Solde Net</span>
                    <div className={`p-2.5 rounded-xl ${report.balance >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-500'}`}>
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className={`text-2xl font-black ${report.balance >= 0 ? 'text-indigo-600' : 'text-rose-500'}`}>
                      {report.balance >= 0 ? '+' : ''}{report.balance.toLocaleString('fr-FR')} FCFA
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">
                      {report.balance >= 0 ? 'Épargne positive dégagée' : 'Dépenses supérieures aux revenus'}
                    </p>
                  </div>
                </div>

                {/* Taux d'épargne */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Taux d'Épargne</span>
                    <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                      <Target className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-black text-slate-900">
                      {report.savingsRate}%
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">
                      {report.transactionCount} transaction(s) au total
                    </p>
                  </div>
                </div>

              </div>

              {/* GRAPHIQUES : REPARTITION & EVOLUTION JOURNALIERE */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Donut Chart - Répartition des Dépenses */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm flex flex-col gap-4">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Dépenses par catégorie</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Ventilation des sorties pour {monthLabel}</p>
                  </div>

                  {report.categories.length === 0 ? (
                    <div className="h-[240px] flex items-center justify-center text-xs text-slate-400 font-semibold">
                      Aucune dépense enregistrée ce mois-ci
                    </div>
                  ) : (
                    <>
                      <div className="h-[180px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={report.categories}
                              dataKey="total"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={75}
                              paddingAngle={3}
                            >
                              {report.categories.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                              formatter={(value) => [`${Number(value).toLocaleString('fr-FR')} FCFA`, 'Total']}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Liste des catégories avec pourcentages */}
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {report.categories.map((cat, idx) => (
                          <div key={cat.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                              />
                              <span className="font-semibold text-slate-700 truncate max-w-[120px]">{cat.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{cat.total.toLocaleString('fr-FR')} FCFA</span>
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                {cat.percent}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Area Chart - Évolution journalière */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-6 shadow-sm lg:col-span-2 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">Évolution journalière du mois</h3>
                      <p className="text-slate-400 text-xs mt-0.5">Flux des entrées et sorties jour après jour</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-slate-500 font-semibold">Revenus</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span className="text-slate-500 font-semibold">Dépenses</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-[280px] w-full overflow-visible">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={report.dailyTrend} margin={CHART_MARGIN}>
                        <defs>
                          <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          stroke="#94a3b8"
                          style={{ fontSize: '11px', fontWeight: 600 }}
                          tickFormatter={(d) => `J${d}`}
                        />
                        <YAxis {...CHART_Y_AXIS_PROPS} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                          formatter={(value, name) => [
                            `${Number(value).toLocaleString('fr-FR')} FCFA`,
                            name === 'income' ? 'Revenu' : 'Dépense'
                          ]}
                          labelFormatter={(l) => `Jour ${l}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="income"
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorInc)"
                        />
                        <Area
                          type="monotone"
                          dataKey="expense"
                          stroke="#f43f5e"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorExp)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* BUDGETS DU MOIS */}
              {report.budgets && report.budgets.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">Respect des budgets en {monthLabel}</h3>
                      <p className="text-slate-400 text-xs mt-0.5">Dépenses réelles constatées par rapport à vos plafonds</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {report.budgets.map(b => {
                      const isOver = b.percent >= 100;
                      const isWarn = b.percent >= 80 && !isOver;
                      const badgeColor = isOver
                        ? 'bg-rose-100 text-rose-700'
                        : isWarn
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700';

                      const barColor = isOver
                        ? 'bg-rose-500'
                        : isWarn
                        ? 'bg-amber-500'
                        : 'bg-emerald-500';

                      return (
                        <div key={b.id} className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/40 flex flex-col justify-between gap-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm">{b.name}</h4>
                              <span className="text-[11px] text-slate-400 font-semibold">{b.category}</span>
                            </div>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${badgeColor}`}>
                              {b.percent}% • {isOver ? 'Dépassé' : isWarn ? 'Attention' : 'Sous contrôle'}
                            </span>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1 font-semibold">
                              <span className="text-slate-500">Dépensé : {b.spent.toLocaleString('fr-FR')} FCFA</span>
                              <span className="text-slate-700">Plafond : {b.limit.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${barColor}`}
                                style={{ width: `${Math.min(b.percent, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TABLE DES OPERATIONS DU MOIS */}
              <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Opérations du mois ({filteredTransactions.length})</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Toutes les transactions passées enregistrées pour {monthLabel}</p>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Rechercher une opération..."
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>

                {filteredTransactions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-semibold">
                    Aucune transaction trouvée pour cette recherche.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="pb-3 pl-2">Titre</th>
                          <th className="pb-3">Catégorie</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3 text-right pr-2">Montant</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {paginatedTransactions.map(tx => {
                          const isIncome = tx.type === 'income';
                          return (
                            <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 pl-2">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                  <span className="font-bold text-slate-800">{tx.title}</span>
                                </div>
                              </td>
                              <td className="py-3 text-slate-600 font-semibold">{tx.category}</td>
                              <td className="py-3 text-slate-400 font-medium">
                                {new Date(tx.date).toLocaleDateString('fr-FR')}
                              </td>
                              <td className={`py-3 pr-2 text-right font-black ${isIncome ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {isIncome ? '+' : '-'}{Number(tx.amount).toLocaleString('fr-FR')} FCFA
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <span>Page {currentPage} sur {totalPages}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}
