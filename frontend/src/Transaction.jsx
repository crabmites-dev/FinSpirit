import { useState, useEffect, useMemo } from 'react';
import api from './api.js';
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import {
  X, Wallet, LayoutDashboard, ReceiptEuro, LogOut, CircleDollarSign,
  Bell, Menu, CreditCard, PiggyBank, Target, Trophy, Calendar,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  PlusCircle, Search, Filter, Download, Trash2, Edit3,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle2,
  Layers, Clock, Zap, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from './useCurrentUser.js';
import NotificationPanel from './NotificationPanel.jsx';

// ── Utilitaires ──────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Bonjour';
  if (h >= 12 && h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};
const fmt = (n) => Number(n).toLocaleString('fr-FR');

const CATEGORIES_INCOME  = ['Salaire','Freelance','Investissement','Remboursement','Autre'];
const CATEGORIES_EXPENSE = ['Nourriture','Transport','Loisirs','Santé','Logement','Éducation','Shopping','Autre'];
const CAT_COLORS = ['#6366f1','#f97316','#10b981','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#64748b'];

// ── Données fictives graphique ────────────────────────────────────
const TREND = [
  { month:'Jan', income:4400, expense:2400 },{ month:'Fév', income:4800, expense:2800 },
  { month:'Mar', income:4100, expense:2300 },{ month:'Avr', income:4900, expense:2900 },
  { month:'Mai', income:4600, expense:2600 },{ month:'Jun', income:5200, expense:2700 },
  { month:'Jul', income:5000, expense:2800 },{ month:'Aoû', income:4700, expense:2500 },
  { month:'Sep', income:5100, expense:2900 },{ month:'Oct', income:4800, expense:2600 },
  { month:'Nov', income:5300, expense:2800 },{ month:'Déc', income:5500, expense:2700 },
];

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

// ── Modal ajout / édition ─────────────────────────────────────────
function TxModal({ editingTx, onSave, onClose }) {
  const [type, setType]         = useState(editingTx?.type || 'expense');
  const [title, setTitle]       = useState(editingTx?.title || '');
  const [amount, setAmount]     = useState(editingTx ? String(editingTx.amount) : '');
  const [category, setCategory] = useState(editingTx?.category || '');
  const [date, setDate]         = useState(editingTx?.date?.slice(0,10) || new Date().toISOString().slice(0,10));
  const [note, setNote]         = useState(editingTx?.note || '');
  const [loading, setLoading]   = useState(false);
  const cats = type === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await onSave({ type, title, amount: parseFloat(amount), category, date, note }); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3 sm:p-0">
      <div className="mobile-modal-card bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden max-h-[92vh]">

        {/* Bande colorée */}
        <div className={`h-2 w-full ${type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />

        <div className="p-7 flex flex-col gap-5 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">{editingTx ? 'Modifier' : 'Nouvelle transaction'}</h2>
              <p className="text-slate-400 text-xs mt-0.5">Enregistrez votre opération</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
          </div>

          {/* Toggle type */}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { setType('income'); setCategory(''); }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all cursor-pointer border-2 ${
                type === 'income' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300'
              }`}>
              <ArrowUpRight className="w-4 h-4" /> Revenu
            </button>
            <button type="button" onClick={() => { setType('expense'); setCategory(''); }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all cursor-pointer border-2 ${
                type === 'expense' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300'
              }`}>
              <ArrowDownRight className="w-4 h-4" /> Dépense
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Catégories */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700">Catégorie</label>
              <div className="flex flex-wrap gap-2">
                {cats.map(cat => (
                  <button key={cat} type="button" onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-black transition-all cursor-pointer border ${
                      category === cat
                        ? type === 'income' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-rose-500 text-white border-rose-500'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}>{cat}</button>
                ))}
              </div>
            </div>

            {/* Libellé */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Libellé</label>
              <input type="text" placeholder="Ex: Salaire août, Courses..." value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all" required />
            </div>

            {/* Montant */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Montant (FCFA)</label>
              <input type="number" placeholder="0" value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all" required />
              {amount && parseFloat(amount) > 0 && (
                <p className={`text-xs font-black ${type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {type === 'income' ? '+' : '-'}{fmt(parseFloat(amount))} FCFA
                </p>
              )}
            </div>

            {/* Date + Note côte à côte */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Note <span className="text-slate-400 font-normal">optionnel</span></label>
                <input type="text" placeholder="Remarque..." value={note} onChange={e => setNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-indigo-500 transition-all" />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">Annuler</button>
              <button type="submit" disabled={loading}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-black cursor-pointer shadow-md transition-all disabled:opacity-60 ${
                  type === 'income' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-500 hover:bg-rose-600'
                }`}>
                {loading
                  ? <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>...</span></div>
                  : editingTx ? 'Enregistrer' : 'Ajouter'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────
function Transactions() {
  const navigate = useNavigate();

  const [transactions, setTx]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [isMobile, setIsMobile]     = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [editingTx, setEditingTx]   = useState(null);
  const [activeView, setActiveView] = useState('list'); // 'list' | 'timeline'
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [catFilter, setCatFilter]   = useState('all');
  const [sortBy, setSortBy]         = useState('date_desc');
  const [page, setPage]             = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const PER_PAGE = 8;
  const userName = useCurrentUser();

  // ── Fetch ──────────────────────────────────────────────────
  const fetchTx = async () => {
    try {
      setLoading(true);
      const res = await api.get('/transactions');
      setTx(res.data.transactions || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchTx(); }, []);

  // ── Stats ──────────────────────────────────────────────────
  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s,t) => s + parseFloat(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s,t) => s + parseFloat(t.amount), 0);
  const balance      = totalIncome - totalExpense;
  const savingsRate  = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(0) : 0;

  // ── Données bar chart par catégorie ───────────────────────
  const catData = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + parseFloat(t.amount);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions]);

  // ── Filtrage ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        const s = search.toLowerCase();
        return (
          (t.title?.toLowerCase().includes(s) || t.category?.toLowerCase().includes(s)) &&
          (typeFilter === 'all' || t.type === typeFilter) &&
          (catFilter === 'all' || t.category === catFilter)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc')   return new Date(b.date) - new Date(a.date);
        if (sortBy === 'date_asc')    return new Date(a.date) - new Date(b.date);
        if (sortBy === 'amount_desc') return parseFloat(b.amount) - parseFloat(a.amount);
        if (sortBy === 'amount_asc')  return parseFloat(a.amount) - parseFloat(b.amount);
        return 0;
      });
  }, [transactions, search, typeFilter, catFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentRows = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const cats = [...new Set(transactions.map(t => t.category))];

  // ── Timeline groupée par date ──────────────────────────────
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(t => {
      const d = t.date?.slice(0,10);
      if (!map[d]) map[d] = [];
      map[d].push(t);
    });
    return Object.entries(map).sort(([a],[b]) => new Date(b) - new Date(a));
  }, [filtered]);

  // ── CRUD ───────────────────────────────────────────────────
  const handleSave = async (data) => {
    try {
      if (editingTx) {
        await api.put(`/transactions/${editingTx.id}`, data);
      } else {
        await api.post('/transactions', data);
      }
      setShowModal(false); setEditingTx(null); fetchTx();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette transaction ?')) return;
    try { await api.delete(`/transactions/${id}`); fetchTx(); }
    catch (e) { console.error(e); }
  };

  const handleExport = () => {
    const rows = filtered.map(t => `${t.date?.slice(0,10)},${t.title},${t.category},${t.type},${t.amount}`).join('\n');
    const blob = new Blob(['Date,Libellé,Catégorie,Type,Montant\n' + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'transactions.csv'; a.click();
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});
      localStorage.removeItem('userName');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (e) { console.error(e); }
  };

  const activeFilters = [search, typeFilter !== 'all' ? '1' : '', catFilter !== 'all' ? '1' : ''].filter(Boolean).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">

      {/* SIDEBAR */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[260px] h-full bg-white border-r border-slate-200/80 flex flex-col justify-between p-5 shrink-0 transition-transform duration-300 ease-in-out
        ${isMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-sm shadow-indigo-600/20"><Wallet className="w-4 h-4" /></div>
              <span className="font-bold text-slate-900 tracking-tight text-base">Depensio</span>
            </div>
            <button onClick={() => setIsMobile(false)} className="md:hidden text-slate-500 cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
          <nav className="space-y-1">
            {[
              { label:"Vue d'ensemble", icon:<LayoutDashboard className="w-4 h-4" />, path:'/dashboard' },
              { label:'Transactions',   icon:<ReceiptEuro className="w-4 h-4" />,     path:'/transaction' },
              { label:'Revenus',        icon:<CircleDollarSign className="w-4 h-4" />,path:'/revenu' },
              { label:'Dépenses',       icon:<CreditCard className="w-4 h-4" />,      path:'/depense' },
              { label:'Budget',         icon:<Target className="w-4 h-4" />,           path:'/budget' },
              { label:'Objectifs',      icon:<Trophy className="w-4 h-4" />,           path:'/objectifs' },
              { label:'Échéances',      icon:<Calendar className="w-4 h-4" />,         path:'/echeances' },
              { label:'Rapports & Bilan', icon:<FileText className="w-4 h-4" />,       path:'/rapports' },
            ].map(({ label, icon, path }) => (
              <button key={label} onClick={() => { navigate(path); setIsMobile(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  window.location.pathname === path ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}>{icon}<span>{label}</span></button>
            ))}
          </nav>
        </div>
        <button onClick={() => setShowLogout(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 transition-all cursor-pointer">
          <LogOut className="w-4 h-4" /><span>Déconnexion</span>
        </button>
      </aside>

      {isMobile && <div onClick={() => setIsMobile(false)} className="fixed inset-0 bg-slate-900/20 z-40 md:hidden" />}
      {showLogout && <LogoutModal onConfirm={handleLogout} onCancel={() => setShowLogout(false)} />}
      {showModal && <TxModal editingTx={editingTx} onSave={handleSave} onClose={() => { setShowModal(false); setEditingTx(null); }} />}

      {/* CONTENU */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* NAVBAR */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobile(true)} className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-600 cursor-pointer"><Menu className="w-4 h-4" /></button>
            <div>
              <p className="text-xs text-slate-400 font-medium">{new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</p>
              <h1 className="text-sm font-black text-slate-900">{getGreeting()}, <span className="text-indigo-600">{userName}</span> 👋</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationPanel />
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-black">{userName.charAt(0)}</div>
              <span className="text-sm font-bold text-slate-800 hidden sm:block">{userName}</span>
            </div>
          </div>
        </header>

        {/* ZONE SCROLLABLE */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">

          {/* ── HERO BANNER ───────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

            {/* Carte solde principale — large */}
            <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-600/25 flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Solde net</p>
                <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full">
                  <Zap className="w-3 h-3 text-yellow-300" />
                  <span className="text-[10px] font-black text-white">Taux épargne : {savingsRate}%</span>
                </div>
              </div>
              <div>
                <p className={`text-4xl font-black tracking-tight ${balance >= 0 ? 'text-white' : 'text-rose-300'}`}>
                  {balance >= 0 ? '+' : ''}{fmt(balance.toFixed(0))} <span className="text-lg font-bold text-white/60">FCFA</span>
                </p>
                <p className="text-white/50 text-xs mt-1">{transactions.length} opération(s) au total</p>
              </div>
            </div>

            {/* Revenus */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Revenus</p>
                <div className="p-2 bg-emerald-50 rounded-xl"><ArrowUpRight className="w-4 h-4 text-emerald-600" /></div>
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-600 mt-3">+{fmt(totalIncome.toFixed(0))}</p>
                <p className="text-[10px] text-slate-400 mt-1">FCFA encaissés</p>
              </div>
              <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((totalIncome / (totalIncome + totalExpense)) * 100, 100)}%` }} />
              </div>
            </div>

            {/* Dépenses */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dépenses</p>
                <div className="p-2 bg-rose-50 rounded-xl"><ArrowDownRight className="w-4 h-4 text-rose-500" /></div>
              </div>
              <div>
                <p className="text-2xl font-black text-rose-500 mt-3">-{fmt(totalExpense.toFixed(0))}</p>
                <p className="text-[10px] text-slate-400 mt-1">FCFA dépensés</p>
              </div>
              <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min((totalExpense / (totalIncome + totalExpense)) * 100, 100)}%` }} />
              </div>
            </div>
          </div>

          {/* ── GRAPHIQUES ────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Area Chart */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm lg:col-span-3 flex flex-col gap-4">
              <div>
                <h3 className="font-black text-slate-900 text-sm">Flux financiers</h3>
                <p className="text-slate-400 text-xs mt-0.5">Revenus vs dépenses sur 12 mois</p>
              </div>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={TREND} margin={{ top:10, right:10, left:-20, bottom:0 }}>
                    <defs>
                      <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} stroke="#94a3b8" style={{fontSize:'11px',fontWeight:600}} />
                    <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" style={{fontSize:'11px',fontWeight:600}} />
                    <Tooltip contentStyle={{backgroundColor:'#fff',borderRadius:'12px',border:'1px solid #e2e8f0',fontSize:'12px',fontWeight:600}}
                      formatter={(v,n) => [`${fmt(v)} FCFA`, n==='income'?'Revenus':'Dépenses']} />
                    <Area type="monotone" dataKey="income" stroke="#6366f1" strokeWidth={2.5} fill="url(#gi)" />
                    <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2.5} fill="url(#ge)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-indigo-500"/><span className="text-xs font-semibold text-slate-500">Revenus</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-500"/><span className="text-xs font-semibold text-slate-500">Dépenses</span></div>
              </div>
            </div>

            {/* Bar chart par catégorie */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm lg:col-span-2 flex flex-col gap-4">
              <div>
                <h3 className="font-black text-slate-900 text-sm">Top dépenses</h3>
                <p className="text-slate-400 text-xs mt-0.5">Par catégorie</p>
              </div>
              {catData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-300 text-xs font-semibold">Pas encore de données</div>
              ) : (
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={catData} margin={{top:5,right:5,left:-25,bottom:0}} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" axisLine={false} tickLine={false} stroke="#94a3b8" style={{fontSize:'10px',fontWeight:600}} tickFormatter={v=>`${v/1000}k`} />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} stroke="#94a3b8" style={{fontSize:'10px',fontWeight:700}} width={70} />
                      <Tooltip contentStyle={{borderRadius:'10px',fontSize:'12px',border:'1px solid #e2e8f0'}} formatter={v=>[`${fmt(v)} FCFA`]} />
                      <Bar dataKey="value" radius={[0,6,6,0]} barSize={14}>
                        {catData.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* ── SECTION TRANSACTIONS ──────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">

            {/* Barre d'actions */}
            <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
              <div className="flex items-center gap-3 flex-wrap">

                {/* Recherche */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-[160px] max-w-xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input type="text" placeholder="Rechercher..." value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="bg-transparent text-slate-900 outline-none text-xs w-full placeholder:text-slate-400" />
                  {search && <button onClick={() => setSearch('')} className="text-slate-300 hover:text-slate-500 cursor-pointer"><X className="w-3 h-3" /></button>}
                </div>

                {/* Toggle type */}
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200/40">
                  {[{v:'all',l:'Tous'},{v:'income',l:'💹 Revenus'},{v:'expense',l:'💸 Dépenses'}].map(f => (
                    <button key={f.v} onClick={() => { setTypeFilter(f.v); setPage(1); }}
                      className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${typeFilter===f.v?'bg-white text-indigo-600 shadow-sm':'text-slate-400 hover:text-slate-700'}`}>
                      {f.l}
                    </button>
                  ))}
                </div>

                {/* Vue */}
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200/40">
                  <button onClick={() => setActiveView('list')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${activeView==='list'?'bg-white text-indigo-600 shadow-sm':'text-slate-400'}`}>
                    <Layers className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setActiveView('timeline')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${activeView==='timeline'?'bg-white text-indigo-600 shadow-sm':'text-slate-400'}`}>
                    <Clock className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Filtres avancés */}
                <button onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                    showFilters || activeFilters > 0 ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}>
                  <Filter className="w-3.5 h-3.5" />
                  {activeFilters > 0 && <span className="w-4 h-4 bg-indigo-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">{activeFilters}</span>}
                </button>

                {/* Tri */}
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer">
                  <option value="date_desc">Plus récent</option>
                  <option value="date_asc">Plus ancien</option>
                  <option value="amount_desc">Montant ↓</option>
                  <option value="amount_asc">Montant ↑</option>
                </select>

                {/* Actions droite */}
                <div className="flex items-center gap-2 ml-auto">
                  <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-bold cursor-pointer transition-all">
                    <Download className="w-3.5 h-3.5" /><span className="hidden sm:inline">CSV</span>
                  </button>
                  <button onClick={() => { setEditingTx(null); setShowModal(true); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black cursor-pointer shadow-sm shadow-indigo-600/20 transition-all">
                    <PlusCircle className="w-3.5 h-3.5" /> Ajouter
                  </button>
                </div>
              </div>

              {/* Filtres avancés panel */}
              {showFilters && (
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                  <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer">
                    <option value="all">📁 Toutes catégories</option>
                    {cats.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {(search || typeFilter !== 'all' || catFilter !== 'all') && (
                    <button onClick={() => { setSearch(''); setTypeFilter('all'); setCatFilter('all'); setPage(1); }}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer">
                      Réinitialiser tout
                    </button>
                  )}
                  <span className="ml-auto text-[11px] font-bold text-slate-400">{filtered.length} résultat(s)</span>
                </div>
              )}
            </div>

            {/* ── VUE LISTE ─────────────────────────────────── */}
            {activeView === 'list' && (
              <>
                {loading ? (
                  <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
                ) : currentRows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 m-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <AlertCircle className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-bold text-slate-600">Aucune transaction trouvée</p>
                    <p className="text-xs text-slate-400">Modifiez vos filtres ou ajoutez une opération</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {['','Description','Catégorie','Date','Type','Montant',''].map((h,i) => (
                            <th key={i} className="py-3 pr-4 text-[10px] font-black text-slate-400 uppercase tracking-wider first:pl-5">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {currentRows.map((t) => (
                          <tr key={t.id} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors group">

                            {/* Icône type */}
                            <td className="py-3.5 pl-5 pr-2 w-10">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.type==='income'?'bg-emerald-50':'bg-rose-50'}`}>
                                {t.type==='income'
                                  ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600"/>
                                  : <TrendingDown className="w-3.5 h-3.5 text-rose-500"/>
                                }
                              </div>
                            </td>

                            {/* Description + note */}
                            <td className="py-3.5 pr-4 max-w-[180px]">
                              <p className="text-xs font-bold text-slate-900 truncate">{t.title}</p>
                              {t.note && <p className="text-[10px] text-slate-400 italic mt-0.5 truncate">{t.note}</p>}
                            </td>

                            {/* Catégorie */}
                            <td className="py-3.5 pr-4">
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">{t.category}</span>
                            </td>

                            {/* Date */}
                            <td className="py-3.5 pr-4 text-xs text-slate-400 whitespace-nowrap">
                              {new Date(t.date).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}
                            </td>

                            {/* Badge type */}
                            <td className="py-3.5 pr-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black ${
                                t.type==='income'?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-600'
                              }`}>
                                {t.type==='income'?<ArrowUpRight className="w-3 h-3"/>:<ArrowDownRight className="w-3 h-3"/>}
                                {t.type==='income'?'Revenu':'Dépense'}
                              </span>
                            </td>

                            {/* Montant */}
                            <td className={`py-3.5 pr-4 text-sm font-black whitespace-nowrap ${t.type==='income'?'text-emerald-600':'text-slate-900'}`}>
                              {t.type==='income'?'+':'-'}{fmt(parseFloat(t.amount).toFixed(0))} FCFA
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 pr-4">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => { setEditingTx(t); setShowModal(true); }}
                                  className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 cursor-pointer transition-all">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDelete(t.id)}
                                  className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 cursor-pointer transition-all">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 font-semibold">
                      <span className="text-slate-700 font-black">{(page-1)*PER_PAGE+1}</span> – <span className="text-slate-700 font-black">{Math.min(page*PER_PAGE, filtered.length)}</span> sur <span className="text-slate-700 font-black">{filtered.length}</span>
                    </p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage(p => Math.max(p-1,1))} disabled={page===1}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition-all">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({length:Math.min(totalPages,5)},(_,i) => {
                        const p = page<=3 ? i+1 : page-2+i;
                        if (p<1||p>totalPages) return null;
                        return (
                          <button key={p} onClick={() => setPage(p)}
                            className={`w-8 h-8 rounded-lg text-xs font-black cursor-pointer transition-all ${
                              page===p?'bg-indigo-600 text-white shadow-sm':'border border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}>{p}</button>
                        );
                      })}
                      <button onClick={() => setPage(p => Math.min(p+1,totalPages))} disabled={page===totalPages}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── VUE TIMELINE ──────────────────────────────── */}
            {activeView === 'timeline' && (
              <div className="p-5 flex flex-col gap-6">
                {loading ? (
                  <div className="flex justify-center py-12"><div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
                ) : grouped.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <AlertCircle className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-bold text-slate-600">Aucune transaction</p>
                  </div>
                ) : grouped.map(([date, txs]) => {
                  const dayTotal = txs.reduce((s,t) => t.type==='income' ? s+parseFloat(t.amount) : s-parseFloat(t.amount), 0);
                  return (
                    <div key={date} className="flex flex-col gap-3">
                      {/* En-tête du jour */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-indigo-500" />
                          <p className="text-xs font-black text-slate-700">
                            {new Date(date).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}
                          </p>
                        </div>
                        <span className={`text-xs font-black ${dayTotal>=0?'text-emerald-600':'text-rose-500'}`}>
                          {dayTotal>=0?'+':''}{fmt(dayTotal.toFixed(0))} FCFA
                        </span>
                      </div>

                      {/* Transactions du jour */}
                      <div className="ml-5 border-l-2 border-slate-100 pl-4 flex flex-col gap-2">
                        {txs.map(t => (
                          <div key={t.id} className="group flex items-center justify-between bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm rounded-xl px-4 py-3 transition-all">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.type==='income'?'bg-emerald-100':'bg-rose-100'}`}>
                                {t.type==='income'
                                  ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600"/>
                                  : <TrendingDown className="w-3.5 h-3.5 text-rose-500"/>
                                }
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900">{t.title}</p>
                                <p className="text-[10px] text-slate-400 font-semibold">{t.category}{t.note ? ` · ${t.note}` : ''}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-black ${t.type==='income'?'text-emerald-600':'text-slate-900'}`}>
                                {t.type==='income'?'+':'-'}{fmt(parseFloat(t.amount).toFixed(0))} FCFA
                              </span>
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                                <button onClick={() => { setEditingTx(t); setShowModal(true); }}
                                  className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 cursor-pointer transition-all">
                                  <Edit3 className="w-3 h-3"/>
                                </button>
                                <button onClick={() => handleDelete(t.id)}
                                  className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 cursor-pointer transition-all">
                                  <Trash2 className="w-3 h-3"/>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Transactions;
