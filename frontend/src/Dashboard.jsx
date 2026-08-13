import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Search, Trash2, ChevronLeft, ChevronRight, AlertCircle, Wallet, X,
  LayoutDashboard, ReceiptEuro, LogOut, CircleDollarSign, Bell, ArrowLeftRight,
   TrendingDown, TrendingUp, ArrowDownRight, Menu, CreditCard, CalendarClock, HandCoins,
   Landmark,
   Trophy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext.jsx';
import CapBudgetLogo from './CapBudgetLogo.jsx'; 

const trendDataFake = [
  { date: 'Jan', income: 4400, expense: 2400 },
  { date: 'Fév', income: 4800, expense: 2800 },
  { date: 'Mar', income: 4100, expense: 2300 },
  { date: 'Avr', income: 4900, expense: 2900 },
  { date: 'Mai', income: 4600, expense: 2600 },
  { date: 'Jun', income: 5200, expense: 2700 },
  { date: 'Jul', income: 5000, expense: 2800 },
  { date: 'Aoû', income: 4700, expense: 2500 },
  { date: 'Sep', income: 5100, expense: 2900 },
  { date: 'Oct', income: 4800, expense: 2600 },
  { date: 'Nov', income: 5300, expense: 2800 },
  { date: 'Déc', income: 5500, expense: 2700 }
];

const pieDataFake = [
  { name: 'Nourriture', value: 320 },
  { name: 'Loisirs', value: 180 },
  { name: 'Transport', value: 140 },
  { name: 'Santé', value: 95 },
  { name: 'Autres', value: 65 },
];

const PIE_COLORS = ['#6366f1', '#f97316', '#10b981', '#f59e0b', '#8b5cf6']; 

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
            Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre compte.
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

function SampleDataBanner({ onDismiss }) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleDelete = async () => {
    if (!window.confirm(
      'Supprimer les données d\'exemple ?\n\nCette action est irréversible. Vos vraies données ne seront pas affectées.'
    )) return;

    setLoading(true);
    try {
      await axios.delete('http://localhost:5000/api/auth/sample-data', { withCredentials: true });
      onDismiss();
      showToast('Données d\'exemple supprimées', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la suppression', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="text-xl">💡</span>
        <div>
          <p className="text-sm font-black text-amber-900">Vous consultez des données d'exemple</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Ces données fictives vous permettent de découvrir l'application. Supprimez-les quand vous êtes prêt à saisir les vôtres.
          </p>
        </div>
      </div>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black cursor-pointer transition-all shadow-sm disabled:opacity-60"
      >
        {loading
          ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : '🗑️'
        }
        {loading ? 'Suppression...' : 'Supprimer les exemples'}
      </button>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [period, setPeriod] = useState('Mensuel');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;
  const [hasSample, setHasSample] = useState(false);
  const [userName, setUserName] = useState('Utilisateur');

  const fetchTransaction = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/transactions', { withCredentials: true });
      setTransactions(res.data.transactions || []);
    } catch (error) {
      console.error('Erreur récupération:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSampleData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/sample-data', { withCredentials: true });
      setHasSample(res.data.hasSample);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/getMe', { withCredentials: true });
      if (res.data.user?.username) setUserName(res.data.user.username);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTransaction();
    checkSampleData();
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout', {}, { withCredentials: true });
      navigate('/login');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/transactions/${id}`, { withCredentials: true });
      fetchTransaction();
      showToast('Opération supprimée', 'success');
    } catch (error) {
      console.error('Erreur suppression:', error);
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredTransactions.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);
  const categoriesList = [...new Set(transactions.map(t => t.category))];

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalCount = transactions.length;

  const handleSampleDismiss = () => {
    setHasSample(false);
    fetchTransaction();
  };

  const pieDataReal = categoriesList.map(cat => ({
    name: cat,
    value: transactions.filter(t => t.type === 'expense' && t.category === cat)
      .reduce((s, t) => s + parseFloat(t.amount), 0)
  })).filter(d => d.value > 0);
  const pieDataToUse = pieDataReal.length > 0 ? pieDataReal : pieDataFake;

  const monthNames = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const trendDataReal = monthNames.map((name, i) => {
    const monthTx = transactions.filter(t => new Date(t.date).getMonth() === i);
    return {
      date: name,
      income: monthTx.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0),
      expense: monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0),
    };
  });
  const trendDataToUse = transactions.length > 0 ? trendDataReal : trendDataFake;

  return (
    
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">

      {/* SIDEBAR */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[260px] h-full bg-white border-r border-slate-200/80 flex flex-col justify-between p-5 shrink-0 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between px-1">
            <CapBudgetLogo size="sm" showText />
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-500 hover:text-indigo-600 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {[
              { label: "Vue d'ensemble", icon: <LayoutDashboard className="w-4 h-4" />, path: '/dashboard' },
              { label: 'Revenus', icon: <CircleDollarSign className="w-4 h-4" />, path: '/revenu' },
              { label: 'Depenses', icon: <CreditCard className="w-4 h-4" />, path: '/depense' },
              { label: 'Budget', icon: <Landmark className="w-4 h-4" />, path: '/budget' },
              { label: 'Objectifs', icon: <Trophy className="w-4 h-4" />, path: '/objectifs' },
              { label: 'Echéances', icon: <CalendarClock className="w-4 h-4" />, path: '/echeances' },
            ].map(({ label, icon, path }) => (
              <button
                key={label}
                onClick={() => { navigate(path); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  window.location.pathname === path
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                }`}
              >
                {icon}<span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 transition-all duration-150 cursor-pointer"
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

        {/* NAVBAR HORIZONTALE */}
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
            <button className="relative p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
            </button>
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

          {hasSample && <SampleDataBanner onDismiss={handleSampleDismiss} />}

          {/* 3 MINI STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Opérations</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><Wallet className="w-5 h-5" /></div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Revenus totaux</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">+{totalIncome.toLocaleString('fr-FR')} FCFA</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><TrendingUp className="w-5 h-5" /></div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Dépenses totales</p>
                <p className="text-2xl font-black text-rose-500 mt-1">-{totalExpense.toLocaleString('fr-FR')} FCFA</p>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl text-rose-500"><TrendingDown className="w-5 h-5" /></div>
            </div>
          </div>

          {/* GRAPHIQUES */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Area Chart */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Évolution financière</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Revenus vs dépenses sur l'année</p>
                </div>
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200/40">
                  {['3M', 'Mensuel', 'Annuel'].map((p) => (
                    <button key={p} onClick={() => setPeriod(p)}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        period === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'
                      }`}>{p}</button>
                  ))}
                </div>
              </div>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendDataToUse} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} stroke="#94a3b8" style={{ fontSize: '11px', fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" style={{ fontSize: '11px', fontWeight: 600 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 600 }}
                      formatter={(val, name) => [`${Number(val).toLocaleString('fr-FR')} FCFA`, name === 'income' ? 'Revenus' : 'Dépenses']} />
                    <Area type="monotone" dataKey="income" stroke="#6366f1" strokeWidth={2.5} fill="url(#gInc)" />
                    <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2.5} fill="url(#gExp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-5 pt-1">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-indigo-500" /><span className="text-xs font-semibold text-slate-500">Revenus</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-500" /><span className="text-xs font-semibold text-slate-500">Dépenses</span></div>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm flex flex-col gap-4">
              <div>
                <h3 className="font-black text-slate-900 text-sm">Répartition</h3>
                <p className="text-slate-400 text-xs mt-0.5">Dépenses par catégorie</p>
              </div>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieDataToUse} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieDataToUse.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(val) => [`${Number(val).toLocaleString('fr-FR')} FCFA`]} contentStyle={{ borderRadius: '10px', fontSize: '12px', border: '1px solid #e2e8f0' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2">
                {pieDataToUse.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                      <span className="text-xs font-semibold text-slate-600">{item.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900">{Number(item.value).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TABLEAU */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-4 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-slate-900 text-sm">Historique complet</h3>
                <p className="text-slate-400 text-xs mt-0.5">{filteredTransactions.length} opération(s) trouvée(s)</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input type="text" placeholder="Rechercher..." value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="bg-transparent text-slate-900 outline-none text-xs w-36 placeholder:text-slate-400" />
                </div>
                <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer">
                  <option value="all">Tous les types</option>
                  <option value="income">💹 Revenus</option>
                  <option value="expense">💸 Dépenses</option>
                </select>
                <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer">
                  <option value="all">📁 Toutes catégories</option>
                  {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-xs font-medium">Chargement...</p>
              </div>
            ) : currentRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 gap-3">
                <AlertCircle className="w-8 h-8 text-slate-300" />
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">Aucune opération trouvée</p>
                  <p className="text-xs text-slate-400 mt-1">Modifiez vos filtres ou ajoutez une opération</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Catégorie', 'Description', 'Date', 'Type', 'Montant', ''].map(h => (
                        <th key={h} className="py-3 pr-4 text-[11px] font-black text-slate-400 uppercase tracking-wider first:pl-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((t) => (
                      <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors group">
                        <td className="py-3.5 pl-2 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                            <span className="font-bold text-slate-800 text-xs">{t.category}</span>
                          </div>
                        </td>
                        <td className="py-3.5 pr-4 text-slate-500 text-xs font-medium max-w-[180px] truncate">{t.title}</td>
                        <td className="py-3.5 pr-4 text-slate-400 text-xs whitespace-nowrap">
                          {new Date(t.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3.5 pr-4">
                          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                            t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {t.type === 'income' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {t.type === 'income' ? 'Revenu' : 'Dépense'}
                          </div>
                        </td>
                        <td className={`py-3.5 pr-4 font-black text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {t.type === 'income' ? '+' : '-'}{parseFloat(t.amount).toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          <button onClick={() => handleDelete(t.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

        

            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-400 font-semibold">
                  <span className="text-slate-700 font-black">{indexOfFirstRow + 1}</span>{' '}–{' '}
                  <span className="text-slate-700 font-black">{Math.min(indexOfLastRow, filteredTransactions.length)}</span>{' '}sur{' '}
                  <span className="text-slate-700 font-black">{filteredTransactions.length}</span> opérations
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        currentPage === p ? 'bg-indigo-600 text-white shadow-sm' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
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

                

        </main>

        
      </div>
    </div>
  );
}

export default Dashboard;
