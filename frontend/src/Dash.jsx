import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ReceiptEuro, 
  LogOut, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PlusCircle, 
  Trash2,
  Menu,
  X,
  CircleDollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';


function Dash() {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('revenu');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [summary, setSummary] = useState({ balance: 0, income: 0, expense: 0 });
  const [transactions, setTransactions] = useState([]);
  const [graphData, setGraphData] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false)

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('expense')
  const [category, setCategory] = useState('Nourriture')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [modalLoading, setModalLoading] = useState(false) 

  const COLORS = ['#4f46e5', '#7c3aed', '#ec4899', '#38bdf8'];

  useEffect(() => {
    const dashboardData = async () => {
      try {
        const [summaryRes, transactionsRes, categoryRes] = await Promise.all ([
          axios.get('http://localhost:5000/api/transactions/summary', {withCredentials: true}),
          axios.get('http://localhost:5000/api/transactions', {withCredentials: true}),
          axios.get('http://localhost:5000/api/transactions/category', {withCredentials: true})
        ])

        setSummary(summaryRes.data);
        setTransactions(transactionsRes.data.transactions);
        setGraphData(categoryRes.data.category)

      } catch (error) {
        console.log('Erreur lors du chargement des données', error);
      }
    }
    dashboardData();
  },[]) 

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout', {}, { withCredentials: true });
      navigate('/login');
    } catch (err) {
      console.error("Erreur lors de la déconnexion", err);
    }
  };

  const handleSubmitTransaction = async () => {
    e.preventDefault()
    setModalLoading(true)

    try {
      await axios.post('http://localhost:5000/api/transactions', {
        type, 
        amount: parseFloat(amount),
        category,
        date
      }, {withCredentials: true})

      setModalLoading(false)
      setTitle('')
      setAmount('')
      dashboardData()
      
    } catch (error) {
      console.error(`Une erreur est survenue lors de l'envoie de donnée`)
      setModalLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 font-sans m-0 overflow-hidden antialiased">
      
      {/* ========================================================= */}
      {/* 1. LA SIDEBAR                                              */}
      {/* ========================================================= */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[260px] h-full bg-white border-r border-slate-200/80 flex flex-col justify-between p-5 shrink-0 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-600 rounded-lg text-white shadow-sm shadow-indigo-600/20">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight text-sm">Depensio</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-500 hover:text-slate-900 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1">
            <button 
              onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
              }`} 
            > 
              <LayoutDashboard className="w-4 h-4" />  
              <span>Vue d'ensemble</span>
            </button>

            <button 
              onClick={() => { navigate('/transaction'); setActiveTab('transactions'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === 'transactions' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              <ReceiptEuro className="w-4 h-4" />
              <span>Transactions</span>
            </button>

            <button
              onClick={() => {setActiveTab('revenu'); setIsMobileMenuOpen(false)}}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-150 cursor-pointer ${
                activeTab === 'revenu' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
               <CircleDollarSign className='w-4 h-4' /> 
               <span>Revenus</span>
            </button>
          </nav>
        </div>

        <div>
          <button 
            onClick={() => handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50/50 transition-all duration-150 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {isMobileMenuOpen && (
        <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/20 z-40 md:hidden" />
      )}

      {/* ========================================================= */}
      {/* 2. ZONE DE CONTENU PRINCIPAL                               */}
      {/* ========================================================= */}
      <main className="flex-1 h-full p-4 sm:p-8 overflow-y-auto flex flex-col gap-8">
        
        {/* En-tête */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 bg-white border border-slate-200 rounded-xl text-slate-700 cursor-pointer shadow-sm">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Tableau de bord</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Suivez vos indicateurs financiers en temps réel</p>
            </div>
          </div>
          
          <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-sm sm:btn-md bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md border-none flex items-center gap-2 cursor-pointer font-bold transition-all">
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Ajouter une opération</span>
          </button>
        </header>

        {/* ========================================================= */}
        {/* 3. LES 3 CARTES DE STATISTIQUES                           */}
        {/* ========================================================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Solde Global */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Solde Total</span>
              <h3 className="text-2xl font-black text-slate-900">{summary.balance.toFixed(2)} FCFA</h3>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <Wallet className="w-6 h-6" />
            </div>
          </div>

          {/* Revenus */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Revenus</span>
              <h3 className="text-2xl font-black text-emerald-600">+{summary.income.toFixed(2)} FCFA</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Dépenses */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex items-center justify-between sm:col-span-2 lg:col-span-1">
            <div className="space-y-1">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Dépenses</span>
              <h3 className="text-2xl font-black text-rose-600">-{summary.expense.toFixed(2)} FCFA</h3>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
              <TrendingDown className="w-6 h-6" />
            </div>


          </div>

        </section>

        {/* ========================================================= */}
        {/* 4. GRAPHIQUE + HISTORIQUE                                  */}
        {/* ========================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Graphique */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.01)] lg:col-span-1 h-[360px] flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-900 tracking-tight">Répartition</h4>
              <p className="text-slate-400 text-xs mt-0.5">Vos dépenses par catégories</p>
            </div>
            <div className="flex-1 w-full h-full min-h-[240px] mt-2 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={graphData}
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                    >
                        {graphData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: '600' }}
                        formatter={(value) => [`${value.toFixed(2)} €`, 'Montant']}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: '600', paddingTop: '5px' }} />
                        </PieChart>
                        </ResponsiveContainer>
            </div>

          </div>

          {/* Historique des transactions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.01)] lg:col-span-2 min-h-[360px] flex flex-col gap-4">
            <div>
              <h4 className="font-bold text-slate-900 tracking-tight">Dernières opérations</h4>
              <p className="text-slate-400 text-xs mt-0.5">Vos transactions récentes</p>
            </div>

            {/* Liste des transactions */}
            <div className="flex flex-col gap-3">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {t.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                      <p className="text-xs text-slate-400">{t.category} · {t.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'income' ? '+' : '-'}{t.amount.toFixed(2)} €
                    </span>
                    <button className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>

        {isModalOpen && (
          <div className= 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in'>
            <div className='bg-white w-full max-w-[440px] p-6 sm:p-8 mx-4 rounded-2xl shadow-2xl border border-slate-200/60 animate-fade-in-up'>
            <div className='flex items-center justify-between mb-6'>
              <div>
                <h3 className='text-lg font-black text-slate-900 tracking-tight'>Nouvelle opération</h3>
                <p className='text-xs mt-0.5 text-slate-400'></p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className='p-1.5 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-color cursor-pointer'
              >
                <X className='w-4 h-4' />
              </button>
            </div>

            <form onSubmit={handleSubmitTransaction} className='space-y-4 text-left'>
              <div className='grid grid-cols-2 bg-slate-50 p-1 border border-slate-200/40 rounded-xl'>
                <button
                  type='button'
                  onClick={() => {setType('expense'); setCategory('Nourriture')}}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover: text-slate-800'
                  }`}
                >
                  Dépense
                </button>

                <button
                  type='button'
                  onClick={() => {setType('income'); ('Salaire')}}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Revenu
                </button>
              </div>

                  <div className='form-control space-y-1.5'>
                    <label className='text-slate-700 text-sm font-bold uppercase tracking-wider'>Titre de l'opération</label>
                    <input
                      type='text'
                      placeholder='Ex: Courses Auchant, Yango, Salaire...'
                      value={title}
                      onChange={(e)=> setTitle(e.target.value)}
                      className='w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 transition-all'
                      required
                    />  
                  </div>

                  <div className='form-control space-y-1.5'>
                    <label className='text-slate-700 text-sm uppercase font-bold tracking-wider'>Montant</label>
                    <input 
                    type="number"
                    step='1'
                    placeholder='Ex: 15.000'
                    value={amount}
                    onChange={(e)=> setAmount(e.target.value)}
                    className='w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder: text-slate-400 outline-none focus:border-indigo-600 focus: bg-white focus:ring-4 focus: ring-indigo-600/10 transition-all'
                    required
                    />
                  </div>

                  <div className='form-control space-y-1.5'>
                    <label className="text-slate-700 text-sm font-bold uppercase tracking-wider pl-0.5">Catégorie</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className='w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 transition-all cursor-pointer'
                    > 

                    {type === 'expense' ? (
                      <>
                      <option value='Nourriture'>🍔 Nourriture</option>
                      <option value='Shopping'>🛍️ Shopping</option>
                      <option value='Loisirs'>🎮 Loisirs</option>
                      <option value='Loyer & Factures'>🏠 Loyer & Factures</option>
                      <option value='Transport'>🚗 Transport</option>
                      <option value='Santé'>🩺 Santé</option>
                      <option value='Investissement'>📈 Investissements</option>
                      <option value='Cadeaux / Dons'>🎁 Cadeaux / Dons</option>
                      <option value="Abonnements">📱 Abonnements</option>
                      <option value="Imprévus">⚠️ Imprévus & Urgences</option>
                      <option value="Voyage & Vacances">✈️ Voyage & Vacances</option>
                      </>
                    ) : (
                      <>
                      <option value='Salaire'>💰 Salaire</option>
                      <option value="Prime / Bonus">🎯 Prime / Bonus d'entreprise</option>
                      <option value='Remboursement'>🔄 Remboursement</option>
                      <option value="Freelance / SaaS">💻 Freelance / SaaS</option>
                      <option value='Revenu'>🪙 Autre Revenu</option>
                      </>
                    )}

                    </select>
                  </div>

                  <div className='form-control space-y-1.5'>
                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider pl-0.5">Date</label>
                    <input type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className='w-full bg-slate-50 border border-slate-200 rounded-xl px-1 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 transition-all cursor-pointer'
                    required
                    />
                  </div>

                  <button
                    type='submit'
                    disabled={modalLoading}
                    className='w-full flex justify-center items-center bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-indigo-600/10 active:scale-[0.99] transition-all duration-150 cursor-pointer mt-6'
                  >
                    {modalLoading ? (
                      <span className='loading loading-spinner loading-sm'></span>
                    ) : (
                      <span>Confirmer l'opération</span> 
                    )}
                  </button>

            </form>
            </div>

          </div>
        )}


      </main>
    </div>
  );
}

export default Dash;
