import { useState, useMemo, useEffect } from 'react';
import api from './api.js';
import {
  PlusCircle, Trash2, X, LayoutDashboard, ReceiptEuro, 
  LogOut, CircleDollarSign, Bell, Menu, CreditCard, PiggyBank,
  Target, Trophy, Edit3, AlertTriangle, CheckCircle2, Clock,
  Repeat, Calendar, ChevronLeft, ChevronRight, Filter, Landmark,
  Zap, Wifi, Home, Car, Heart, Tv, ShoppingBag, GraduationCap,
  Phone, Droplets, Flame, MoreHorizontal, BellRing, ArrowLeftRight, CalendarClock,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext.jsx';
import CapBudgetLogo from './CapBudgetLogo.jsx';
import { useCurrentUser } from './useCurrentUser.js';
import NotificationPanel from './NotificationPanel.jsx';

// ── Utilitaires ──────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Bonjour';
  if (h >= 12 && h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

const formatNum = (n) => Number(n).toLocaleString('fr-FR');

const getDaysUntil = (dateStr) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

// ── Catégories & icônes ──────────────────────────────────────────
const CATEGORIES = [
  { label: 'Électricité',  icon: <Zap className="w-4 h-4" />,         emoji: '⚡', color: 'bg-yellow-500' },
  { label: 'Internet',     icon: <Wifi className="w-4 h-4" />,         emoji: '📶', color: 'bg-blue-500' },
  { label: 'Loyer',        icon: <Home className="w-4 h-4" />,         emoji: '🏠', color: 'bg-amber-500' },
  { label: 'Voiture',      icon: <Car className="w-4 h-4" />,          emoji: '🚗', color: 'bg-orange-500' },
  { label: 'Santé',        icon: <Heart className="w-4 h-4" />,        emoji: '❤️', color: 'bg-rose-500' },
  { label: 'Streaming',    icon: <Tv className="w-4 h-4" />,           emoji: '📺', color: 'bg-violet-500' },
  { label: 'Abonnement',   icon: <ShoppingBag className="w-4 h-4" />,  emoji: '🛍️', color: 'bg-pink-500' },
  { label: 'Éducation',    icon: <GraduationCap className="w-4 h-4" />,emoji: '📚', color: 'bg-indigo-500' },
  { label: 'Téléphone',    icon: <Phone className="w-4 h-4" />,        emoji: '📱', color: 'bg-sky-500' },
  { label: 'Eau',          icon: <Droplets className="w-4 h-4" />,     emoji: '💧', color: 'bg-cyan-500' },
  { label: 'Gaz',          icon: <Flame className="w-4 h-4" />,        emoji: '🔥', color: 'bg-red-500' },
  { label: 'Autre',        icon: <MoreHorizontal className="w-4 h-4" />,emoji: '📦', color: 'bg-slate-500' },
];

const FREQUENCIES = [
  { label: 'Une fois',     value: 'once' },
  { label: 'Hebdomadaire', value: 'weekly' },
  { label: 'Mensuel',      value: 'monthly' },
  { label: 'Trimestriel',  value: 'quarterly' },
  { label: 'Annuel',       value: 'yearly' },
];

const getCatMeta = (label) => CATEGORIES.find(c => c.label === label) || CATEGORIES[11];

// ── Statut d'une échéance ────────────────────────────────────────
const getStatus = (daysUntil, paid) => {
  if (paid)          return { label: 'Payé',     color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' };
  if (daysUntil < 0) return { label: 'En retard', color: 'bg-red-100 text-red-700',       dot: 'bg-red-500',     border: 'border-red-300' };
  if (daysUntil <= 3)return { label: 'Urgent',    color: 'bg-red-100 text-red-700',        dot: 'bg-red-500',     border: 'border-red-200' };
  if (daysUntil <= 7)return { label: 'Bientôt',   color: 'bg-orange-100 text-orange-700',  dot: 'bg-orange-500',  border: 'border-orange-200' };
  if (daysUntil <=14)return { label: 'À venir',   color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-400',   border: 'border-amber-200' };
  return               { label: 'Planifié',  color: 'bg-slate-100 text-slate-600',    dot: 'bg-slate-400',   border: 'border-slate-200' };
};

// ── Modal déconnexion ────────────────────────────────────────────
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

// ── Carte Échéance ───────────────────────────────────────────────
function EcheanceCard({ bill, onDelete, onEdit, onTogglePaid }) {
  const daysUntil = getDaysUntil(bill.dueDate);
  const status = getStatus(daysUntil, bill.paid);
  const catMeta = getCatMeta(bill.category);
  const freqLabel = FREQUENCIES.find(f => f.value === bill.frequency)?.label || '';

  return (
    <div className={`bg-white rounded-2xl border ${status.border} shadow-sm flex flex-col gap-0 overflow-hidden transition-all hover:shadow-md ${bill.paid ? 'opacity-70' : ''}`}>

      {/* Bande colorée haut */}
      <div className={`h-1.5 w-full ${bill.paid ? 'bg-emerald-400' : daysUntil <= 3 ? 'bg-red-500' : daysUntil <= 7 ? 'bg-orange-400' : daysUntil <= 14 ? 'bg-amber-400' : 'bg-indigo-400'}`} />

      <div className="p-5 flex flex-col gap-4">
        {/* En-tête */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl ${catMeta.color} flex items-center justify-center text-white text-xl shadow-sm`}>
              {catMeta.emoji}
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm leading-tight">{bill.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-slate-400 font-semibold">{bill.category}</span>
                {bill.frequency !== 'once' && (
                  <>
                    <span className="text-slate-300">·</span>
                    <div className="flex items-center gap-0.5 text-[10px] text-indigo-500 font-bold">
                      <Repeat className="w-2.5 h-2.5" />{freqLabel}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onEdit(bill)} className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(bill.id)} className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Montant + date */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Montant</p>
            <p className="text-2xl font-black text-slate-900">{formatNum(bill.amount)} <span className="text-xs text-slate-400">FCFA</span></p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Échéance</p>
            <p className="text-xs font-bold text-slate-700">{formatDate(bill.dueDate)}</p>
          </div>
        </div>

        {/* Compte à rebours */}
        {!bill.paid && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
            daysUntil < 0 ? 'bg-red-50 border border-red-100' :
            daysUntil <= 3 ? 'bg-red-50 border border-red-100' :
            daysUntil <= 7 ? 'bg-orange-50 border border-orange-100' :
            daysUntil <= 14 ? 'bg-amber-50 border border-amber-100' :
            'bg-slate-50 border border-slate-100'
          }`}>
            <Clock className={`w-3.5 h-3.5 shrink-0 ${
              daysUntil < 0 ? 'text-red-500' :
              daysUntil <= 3 ? 'text-red-500' :
              daysUntil <= 7 ? 'text-orange-500' :
              daysUntil <= 14 ? 'text-amber-500' :
              'text-slate-400'
            }`} />
            <p className={`text-[11px] font-black ${
              daysUntil < 0 ? 'text-red-700' :
              daysUntil <= 3 ? 'text-red-700' :
              daysUntil <= 7 ? 'text-orange-700' :
              daysUntil <= 14 ? 'text-amber-700' :
              'text-slate-600'
            }`}>
              {daysUntil < 0
                ? `⚠️ En retard de ${Math.abs(daysUntil)} jour(s) !`
                : daysUntil === 0 ? "⚡ À payer aujourd'hui !"
                : daysUntil === 1 ? '⏰ Demain !'
                : `Dans ${daysUntil} jours`
              }
            </p>
          </div>
        )}

        {/* Note */}
        {bill.note && (
          <p className="text-[11px] text-slate-400 italic font-medium leading-relaxed">{bill.note}</p>
        )}

        {/* Bouton marquer payé */}
        <button
          onClick={() => onTogglePaid(bill.id)}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
            bill.paid
              ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20'
          }`}>
          {bill.paid
            ? <><CheckCircle2 className="w-4 h-4" /> Marquer non payé</>
            : <><CheckCircle2 className="w-4 h-4" /> Marquer comme payé</>
          }
        </button>
      </div>
    </div>
  );
}

// ── Composant principal ──────────────────────────────────────────
function Echeances() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);

  // Formulaire
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Autre');
  const [formAmount, setFormAmount] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formFrequency, setFormFrequency] = useState('monthly');
  const [formNote, setFormNote] = useState('');
  const [formReminder, setFormReminder] = useState(true);

  const userName = useCurrentUser();

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEcheances = async () => {
    try {
      setLoading(true);
      const res = await api.get('/echeances');
      setBills(res.data.echeances || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEcheances(); }, []);

  // ── Stats ──────────────────────────────────────────────────
  const unpaidBills = bills.filter(b => !b.paid);
  const paidBills = bills.filter(b => b.paid);
  const urgentBills = bills.filter(b => !b.paid && getDaysUntil(b.dueDate) <= 7);
  const totalUnpaid = unpaidBills.reduce((s, b) => s + b.amount, 0);
  const totalPaid = paidBills.reduce((s, b) => s + b.amount, 0);
  const totalMonth = bills.reduce((s, b) => s + b.amount, 0);

  // ── Filtrage ───────────────────────────────────────────────
  const filteredBills = useMemo(() => {
    return bills
      .filter(b => {
        if (filterStatus === 'paid') return b.paid;
        if (filterStatus === 'unpaid') return !b.paid;
        if (filterStatus === 'urgent') return !b.paid && getDaysUntil(b.dueDate) <= 7;
        return true;
      })
      .filter(b => filterCategory === 'all' || b.category === filterCategory)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [bills, filterStatus, filterCategory]);

  // ── Calendrier mini ────────────────────────────────────────
  const monthNames = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Lundi = 0

  const billDays = bills.reduce((acc, b) => {
    const d = new Date(b.dueDate);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      const day = d.getDate();
      if (!acc[day]) acc[day] = [];
      acc[day].push(b);
    }
    return acc;
  }, {});

  // ── Modals ─────────────────────────────────────────────────
  const openAdd = () => {
    setEditingBill(null);
    setFormName(''); setFormCategory('Autre'); setFormAmount('');
    setFormDueDate(''); setFormFrequency('monthly');
    setFormNote(''); setFormReminder(true);
    setIsModalOpen(true);
  };

  const openEdit = (bill) => {
    setEditingBill(bill);
    setFormName(bill.name); setFormCategory(bill.category);
    setFormAmount(String(bill.amount)); setFormDueDate(bill.dueDate);
    setFormFrequency(bill.frequency); setFormNote(bill.note || '');
    setFormReminder(bill.reminder ?? true);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const data = {
      name: formName,
      category: formCategory,
      amount: parseFloat(formAmount),
      dueDate: formDueDate,
      frequency: formFrequency,
      note: formNote,
      reminder: formReminder,
      paid: editingBill ? editingBill.paid : false,
    };
    try {
      if (editingBill) {
        await api.put(`/echeances/${editingBill.id}`, data);
      } else {
        await api.post('/echeances', data);
      }
      setIsModalOpen(false);
      fetchEcheances();
      showToast(editingBill ? 'Échéance modifiée' : 'Échéance ajoutée', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de l\'enregistrement', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette échéance ?')) return;
    try {
      await api.delete(`/echeances/${id}`);
      fetchEcheances();
      showToast('Échéance supprimée', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleTogglePaid = async (id) => {
    try {
      await api.patch(`/echeances/${id}/toggle-paid`, {});
      fetchEcheances();
      showToast('Statut de paiement mis à jour', 'info');
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});
      localStorage.removeItem('userName');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (err) { console.error(err); }
  };

  const categoryOptions = [...new Set(bills.map(b => b.category))];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">

      {/* ════════════════════════════════════════════════════ */}
      {/* SIDEBAR                                             */}
      {/* ════════════════════════════════════════════════════ */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[260px] h-full bg-white border-r border-slate-200/80 flex flex-col justify-between p-5 shrink-0 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between px-1">
            <CapBudgetLogo size="md" showText />
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-500 cursor-pointer"><X className="w-5 h-5" /></button>
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

      {/* ════════════════════════════════════════════════════ */}
      {/* CONTENU PRINCIPAL                                   */}
      {/* ════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* NAVBAR */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-600 cursor-pointer">
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
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Échéances</h1>
              <p className="text-slate-500 text-xs mt-0.5">Anticipez vos factures et ne manquez aucun paiement</p>
            </div>
            <button onClick={openAdd}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2.5 shadow-md flex items-center gap-2 cursor-pointer font-bold text-sm transition-all">
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle échéance</span>
            </button>
          </div>

          {/* ── ALERTE URGENTE ────────────────────────────── */}
          {urgentBills.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-xl shrink-0">
                <BellRing className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-black text-red-800">
                  {urgentBills.length} paiement(s) urgent(s) dans les 7 prochains jours !
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {urgentBills.map(b => (
                    <span key={b.id} className="flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-black px-2.5 py-1 rounded-full">
                      {getCatMeta(b.category).emoji} {b.name} — {formatNum(b.amount)} FCFA
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── 4 STATS ───────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total du mois</p>
              <p className="text-xl font-black text-slate-900 mt-1">{formatNum(totalMonth)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">FCFA de factures</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Non payé</p>
              <p className="text-xl font-black text-rose-600 mt-1">{formatNum(totalUnpaid)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{unpaidBills.length} facture(s)</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Déjà payé</p>
              <p className="text-xl font-black text-emerald-600 mt-1">{formatNum(totalPaid)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{paidBills.length} facture(s)</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Urgents</p>
              <p className="text-xl font-black text-red-500 mt-1">{urgentBills.length}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">dans les 7 jours</p>
            </div>
          </div>

          {/* ── CALENDRIER + LISTE ────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            {/* Mini calendrier */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm flex flex-col gap-4">
              {/* Navigation mois */}
              <div className="flex items-center justify-between">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-500 cursor-pointer transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="font-black text-slate-900 text-sm">
                  {monthNames[currentMonth]} {currentYear}
                </h3>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-500 cursor-pointer transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Jours de la semaine */}
              <div className="grid grid-cols-7 gap-1">
                {['L','M','M','J','V','S','D'].map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-black text-slate-400 py-1">{d}</div>
                ))}

                {/* Cases vides début */}
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {/* Jours */}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const dayBills = billDays[day] || [];
                  const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                  const hasUrgent = dayBills.some(b => !b.paid);
                  const allPaid = dayBills.length > 0 && dayBills.every(b => b.paid);

                  return (
                    <div key={day} className={`relative aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                      isToday ? 'bg-indigo-600 text-white shadow-sm' :
                      dayBills.length > 0 ? 'bg-slate-50 text-slate-800 hover:bg-slate-100 cursor-pointer' :
                      'text-slate-400'
                    }`}>
                      {day}
                      {dayBills.length > 0 && (
                        <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                          allPaid ? 'bg-emerald-500' : hasUrgent ? 'bg-red-500' : 'bg-indigo-400'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Légende calendrier */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
                {[
                  { color: 'bg-red-500', label: 'Non payé' },
                  { color: 'bg-emerald-500', label: 'Payé' },
                  { color: 'bg-indigo-600', label: "Aujourd'hui" },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${l.color}`} />
                    <span className="text-[10px] font-semibold text-slate-500">{l.label}</span>
                  </div>
                ))}
              </div>

              {/* Prochaines échéances sidebar */}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Prochaines</p>
                {bills
                  .filter(b => !b.paid)
                  .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                  .slice(0, 4)
                  .map(b => {
                    const days = getDaysUntil(b.dueDate);
                    return (
                      <div key={b.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{getCatMeta(b.category).emoji}</span>
                          <span className="text-[11px] font-bold text-slate-700 truncate max-w-[100px]">{b.name}</span>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          days <= 3 ? 'bg-red-100 text-red-700' :
                          days <= 7 ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {days <= 0 ? 'Aujourd\'hui' : `J-${days}`}
                        </span>
                      </div>
                    );
                  })
                }
              </div>
            </div>

            {/* Liste des échéances */}
            <div className="lg:col-span-2 flex flex-col gap-4">

              {/* Filtres */}
              <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm flex flex-wrap items-center gap-3">
                <Filter className="w-4 h-4 text-slate-400" />

                {/* Filtre statut */}
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200/40 gap-1">
                  {[
                    { val: 'all', label: 'Tous' },
                    { val: 'unpaid', label: 'Non payés' },
                    { val: 'paid', label: 'Payés' },
                    { val: 'urgent', label: '🔴 Urgents' },
                  ].map(f => (
                    <button key={f.val} onClick={() => setFilterStatus(f.val)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                        filterStatus === f.val ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'
                      }`}>
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Filtre catégorie */}
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer">
                  <option value="all">📁 Toutes catégories</option>
                  {categoryOptions.map(c => <option key={c} value={c}>{getCatMeta(c).emoji} {c}</option>)}
                </select>

                <span className="ml-auto text-[11px] font-bold text-slate-400">{filteredBills.length} résultat(s)</span>
              </div>

              {/* Cartes */}
              {filteredBills.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 gap-3">
                  <Calendar className="w-10 h-10 text-slate-300" />
                  <p className="font-black text-slate-600">Aucune échéance trouvée</p>
                  <p className="text-xs text-slate-400">Modifiez vos filtres ou ajoutez une nouvelle échéance</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredBills.map(b => (
                    <EcheanceCard key={b.id} bill={b}
                      onDelete={handleDelete}
                      onEdit={openEdit}
                      onTogglePaid={handleTogglePaid}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ════════════════════════════════════════════════════ */}
      {/* MODALE CRÉATION / ÉDITION                          */}
      {/* ════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3 sm:p-0">
          <div className="mobile-modal-card bg-white rounded-2xl shadow-2xl p-5 sm:p-8 w-full max-w-md flex flex-col gap-4 sm:gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">{editingBill ? 'Modifier l\'échéance' : 'Nouvelle échéance'}</h2>
                <p className="text-slate-400 text-xs mt-0.5">Planifiez votre paiement à venir</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">

              {/* Catégorie visuelle */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700">Catégorie</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat.label} type="button" onClick={() => setFormCategory(cat.label)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all cursor-pointer ${
                        formCategory === cat.label ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                      }`}>
                      <span className="text-base">{cat.emoji}</span>
                      <span className="text-[9px] font-bold text-slate-600 text-center leading-tight">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nom */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Nom de la facture</label>
                <input type="text" placeholder="Ex: Loyer, Netflix, Assurance..." value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/10 transition-all"
                  required />
              </div>

              {/* Montant */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Montant (FCFA)</label>
                <input type="number" placeholder="Ex: 25000" value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/10 transition-all"
                  required />
              </div>

              {/* Date d'échéance */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Date d'échéance</label>
                <input type="date" value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:bg-white transition-all"
                  required />
              </div>

              {/* Fréquence */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700">Fréquence</label>
                <div className="grid grid-cols-3 gap-2">
                  {FREQUENCIES.map(f => (
                    <button key={f.value} type="button" onClick={() => setFormFrequency(f.value)}
                      className={`py-2 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                        formFrequency === f.value ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-indigo-300'
                      }`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Note <span className="text-slate-400 font-normal">optionnel</span></label>
                <input type="text" placeholder="Ex: Virement bancaire, carte bleue..." value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-600 focus:bg-white transition-all" />
              </div>

              {/* Rappel */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-indigo-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-700">Rappel actif</p>
                    <p className="text-[10px] text-slate-400">Recevoir une notification avant l'échéance</p>
                  </div>
                </div>
                <button type="button" onClick={() => setFormReminder(!formReminder)}
                  className={`relative w-10 h-5.5 rounded-full transition-all cursor-pointer ${formReminder ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  style={{ height: '22px', width: '40px' }}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${formReminder ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold cursor-pointer shadow-md transition-all">
                  {editingBill ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Echeances;
