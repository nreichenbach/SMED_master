
import React from 'react';
import { UserAnswer } from '../types';

interface Props {
  answers: UserAnswer[];
  totalQuestions: number;
  onRestart: () => void;
  onReview: () => void;
  sessionXp: number;
  currentRank: string;
}

const ResultSummary: React.FC<Props> = ({ answers = [], totalQuestions, onRestart, onReview, sessionXp, currentRank }) => {
  const correct = answers.filter(a => a?.isCorrect).length;
  const safeTotal = totalQuestions > 0 ? totalQuestions : 1;
  const percent = Math.round((correct / safeTotal) * 100);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 flex flex-col items-center text-center animate-in fade-in zoom-in duration-700 border border-slate-100 max-w-lg mx-auto">
      <div className="mb-10 relative w-44 h-44">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="88" cy="88" r="78" stroke="#f1f5f9" strokeWidth="14" fill="transparent" />
          <circle 
            cx="88" cy="88" r="78" 
            stroke={percent >= 50 ? "#10b981" : "#ef4444"} 
            strokeWidth="14" 
            fill="transparent" 
            strokeDasharray="490" 
            strokeDashoffset={490 - (490 * percent) / 100} 
            strokeLinecap="round" 
            className="transition-all duration-1000 ease-out" 
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black text-slate-800 tracking-tighter">{percent}%</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Réussite</span>
        </div>
      </div>
      
      <div className="mb-10">
        <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Fin de la Partie</h2>
        <p className="text-slate-500 font-medium leading-relaxed px-4">
          Vous avez triomphé de <span className="text-blue-600 font-extrabold">{correct}</span> épreuves sur un total de <span className="font-extrabold text-slate-700">{totalQuestions}</span>.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4 w-full">
          <div className="bg-amber-50 border border-amber-200 px-6 py-3 rounded-2xl flex flex-col items-center w-full sm:w-auto">
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">PV Gagnés</span>
            <span className="text-2xl font-black text-amber-600">+{sessionXp}</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 px-6 py-3 rounded-2xl flex flex-col items-center w-full sm:w-auto">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Grade Actuel</span>
            <span className="text-xl font-black text-blue-700 mt-1">{currentRank}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
        <button 
          onClick={onReview} 
          className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 border border-slate-200"
        >
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          Revoir les détails
        </button>
        <button 
          onClick={onRestart} 
          className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Nouvelle Partie
        </button>
      </div>
    </div>
  );
};

export default ResultSummary;
