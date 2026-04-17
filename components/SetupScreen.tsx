
import React, { useState } from 'react';
import { QuizDomain, QuizSettings } from '../types';

interface Props {
  onStart: (settings: QuizSettings) => void;
  error: string | null;
  hasSavedGame?: boolean;
  onResume?: () => void;
}

const DOMAINS: QuizDomain[] = [
  'Tous les domaines (Mélange)',
  'Cardiologie', 
  'Dermatologie',
  'Endocrinologie',
  'Gastro-entérologie',
  'Gynécologie-Obstétrique',
  'Hématologie',
  'Infectiologie',
  'Néphrologie',
  'Neurologie',
  'Oncologie',
  'Ophtalmologie',
  'ORL (Oto-Rhino-Laryngologie)',
  'Orthopédie-Traumatologie',
  'Pédiatrie',
  'Pneumologie',
  'Psychiatrie',
  'Radiologie',
  'Rhumatologie',
  'Urologie'
];

const SetupScreen: React.FC<Props> = ({ onStart, error, hasSavedGame, onResume }) => {
  const [selectedDomains, setSelectedDomains] = useState<QuizDomain[]>(['Tous les domaines (Mélange)']);
  const [count, setCount] = useState<number>(5);

  const toggleDomain = (domain: QuizDomain) => {
    const isMélange = domain === 'Tous les domaines (Mélange)';
    
    if (isMélange) {
      setSelectedDomains(['Tous les domaines (Mélange)']);
    } else {
      let next = [...selectedDomains].filter(d => d !== 'Tous les domaines (Mélange)');
      if (next.includes(domain)) {
        next = next.filter(d => d !== domain);
      } else {
        next.push(domain);
      }
      if (next.length === 0) {
        setSelectedDomains(['Tous les domaines (Mélange)']);
      } else {
        setSelectedDomains(next);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-300 border border-slate-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-slate-800 mb-1">Préparation du Plateau</h2>
        <p className="text-slate-500 text-sm font-medium">Configurez votre partie et vos pioches.</p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-xs font-bold animate-shake">
          {error}
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-8 space-y-8">
        <section className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Longueur du Parcours (Cases)</label>
            <span className="bg-slate-800 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-sm">{count}</span>
          </div>
          <input 
            type="range" min="3" max="15" step="1" 
            value={count} 
            onChange={(e) => setCount(parseInt(e.target.value))} 
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
          />
          <div className="flex justify-between mt-2 px-1 text-[10px] font-bold text-slate-400">
            <span>3</span>
            <span>15 (Partie Longue)</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-3 italic text-center">Note : Les parcours courts sont idéaux pour des parties rapides.</p>
        </section>

        <section>
          <div className="flex justify-between items-end mb-4 sticky top-0 bg-white py-1 z-10">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pioches de Spécialités</label>
            <span className="text-[10px] font-bold text-blue-600">{selectedDomains.length} sélectionnée(s)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DOMAINS.map(d => {
              const isSelected = selectedDomains.includes(d);
              const isAll = d === 'Tous les domaines (Mélange)';
              
              return (
                <button 
                  key={d} 
                  onClick={() => toggleDomain(d)} 
                  className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between group h-full ${
                    isAll ? 'sm:col-span-2' : ''
                  } ${
                    isSelected 
                      ? isAll ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-sm' 
                      : 'border-slate-50 hover:border-slate-200 bg-slate-50/50 hover:bg-white text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-5 h-5 shrink-0 rounded border flex items-center justify-center transition-colors ${
                      isSelected 
                        ? (isAll ? 'bg-indigo-600 border-indigo-600' : 'bg-blue-600 border-blue-600') 
                        : 'border-slate-200 bg-white'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="truncate text-sm font-medium tracking-tight">{d}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-4 shrink-0">
        {hasSavedGame && onResume && (
          <button
            type="button"
            onClick={onResume}
            className="w-full sm:w-1/2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-black py-4 rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            <span>Reprendre</span>
          </button>
        )}
        <button 
          onClick={() => onStart({ domains: selectedDomains, questionCount: count })} 
          className={`w-full ${hasSavedGame && onResume ? 'sm:w-1/2' : ''} bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3`}
        >
          <span className="tracking-wide text-lg">Lancer la Partie</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
      </div>
    </div>
  );
};

export default SetupScreen;
