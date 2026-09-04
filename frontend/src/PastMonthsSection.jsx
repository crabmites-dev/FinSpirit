import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api.js';
import {
  Calendar, TrendingUp, TrendingDown, ArrowRight, FileText,
  CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, Sparkles
} from 'lucide-react';

export default function PastMonthsSection({
  type = 'expense', // 'expense' | 'income' | 'budget'
  title,
  subtitle
}) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await api.get('/reports/history');
        setHistory(res.data.history || []);
      } catch (err) {
        console.error('Erreur chargement historique mois passés:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Déterminer les intitulés par défaut selon le type
  const defaultTitle = type === 'expense'
    ? 'Historique des dépenses des mois passés'
    : type === 'income'
    ? 'Historique des revenus des mois passés'
    : 'Bilan et respect des budgets passés';

  const defaultSubtitle = type === 'expense'
    ? 'Comparez vos dépenses d\'un mois à l\'autre et suivez vos tendances'
    : type === 'income'
    ? 'Visualisez l\'évolution de vos rentrées d\'argent sur les mois antérieurs'
    : 'Analysez la maîtrise de vos plafonds budgétaires au fil des mois';

  // Prendre les 4 mois les plus récents (mois en cours + 3 mois passés)
  const displayMonths = history.slice(0, 4);

  // Calcul du max pour les barres de proportion visuelles
  const maxValue = Math.max(
    ...displayMonths.map(m => type === 'expense' ? m.totalExpense : m.totalIncome),
    1
  );

  return (
    <section className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm flex flex-col gap-5">
      {/* En-tête de section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${
            type === 'expense'
              ? 'bg-rose-50 text-rose-500'
              : type === 'income'
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-indigo-50 text-indigo-600'
          }`}>
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-base">{title || defaultTitle}</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                <Sparkles className="w-2.5 h-2.5 text-indigo-500" /> Bilan
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">{subtitle || defaultSubtitle}</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/rapports')}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Voir tous les bilans détaillés</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="py-10 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayMonths.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 font-semibold">
          Aucune donnée disponible pour les mois passés.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayMonths.map((m, idx) => {
            const isCurrent = idx === 0;
            const prev = displayMonths[idx + 1];

            // Montant principal selon type
            let val = 0;
            if (type === 'expense') val = m.totalExpense;
            else if (type === 'income') val = m.totalIncome;
            else val = m.balance;

            // Comparaison avec le mois d'après dans la liste (qui est chronologiquement le mois précédent)
            let diffPercent = 0;
            if (prev) {
              const prevVal = type === 'expense' ? prev.totalExpense : type === 'income' ? prev.totalIncome : prev.balance;
              if (prevVal > 0) {
                diffPercent = Math.round(((val - prevVal) / prevVal) * 100);
              }
            }

            const barPercent = Math.min(Math.round((val / maxValue) * 100), 100);

            return (
              <div
                key={`${m.year}-${m.month}`}
                onClick={() => navigate(`/rapports?year=${m.year}&month=${m.month}`)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group ${
                  isCurrent
                    ? 'border-indigo-200 bg-indigo-50/30 hover:border-indigo-400 hover:shadow-md'
                    : 'border-slate-200/70 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">
                      {m.monthLabel}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-600 text-white">
                        En cours
                      </span>
                    )}
                  </div>

                  {/* Montant */}
                  <div className="mt-2">
                    <span className="text-[11px] text-slate-400 font-semibold block">
                      {type === 'expense' ? 'Total dépensé' : type === 'income' ? 'Total encaissé' : 'Solde d\'épargne'}
                    </span>
                    <span className={`text-lg font-black tracking-tight ${
                      type === 'expense'
                        ? 'text-rose-500'
                        : type === 'income'
                        ? 'text-emerald-600'
                        : val >= 0 ? 'text-indigo-600' : 'text-rose-500'
                    }`}>
                      {type === 'expense' ? '-' : type === 'income' ? '+' : (val >= 0 ? '+' : '')}
                      {val.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>

                {/* Barre de proportion visuelle */}
                <div>
                  <div className="h-1.5 w-full bg-slate-200/70 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        type === 'expense'
                          ? 'bg-rose-500'
                          : type === 'income'
                          ? 'bg-emerald-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${barPercent}%` }}
                    />
                  </div>

                  {/* Badge de variation par rapport au mois précédent */}
                  <div className="flex items-center justify-between text-[11px]">
                    {prev ? (
                      <span className={`inline-flex items-center gap-0.5 font-bold ${
                        type === 'expense'
                          ? (diffPercent <= 0 ? 'text-emerald-600' : 'text-rose-500')
                          : (diffPercent >= 0 ? 'text-emerald-600' : 'text-rose-500')
                      }`}>
                        {diffPercent > 0 ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : diffPercent < 0 ? (
                          <ArrowDownRight className="w-3 h-3" />
                        ) : null}
                        {diffPercent > 0 ? `+${diffPercent}%` : `${diffPercent}%`}
                        <span className="text-slate-400 font-normal ml-0.5">vs M-1</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-semibold">
                        {m.transactionCount} opération(s)
                      </span>
                    )}

                    <span className="text-indigo-600 group-hover:translate-x-0.5 transition-transform font-bold text-xs">
                      →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
