
import React from 'react';
import { Question, UserAnswer, QuestionType } from '../types';

interface Props {
  questions: Question[];
  answers: UserAnswer[];
  onBack: () => void;
}

const RevisionView: React.FC<Props> = ({ questions, answers, onBack }) => {
  const renderFormattedAnswer = (ans: any, type: QuestionType, question: Question, isExpected: boolean = false) => {
    if (type === QuestionType.ASSOCIATION) {
      const pairsToRender = isExpected 
        ? (question.matchingPairs || [])
        : (Array.isArray(ans) ? ans.map(a => ({ 
            left: question.matchingPairs?.find(p => p.id === a.id)?.left || "Terme", 
            right: a.right 
          })) : []);

      if (pairsToRender.length === 0) return <span className="italic text-slate-300">Aucune donnée</span>;

      return (
        <div className="flex flex-col gap-2 mt-2 w-full">
          {pairsToRender.map((pair, idx) => (
            <div key={idx} className={`flex flex-col p-3 rounded-xl border text-[10px] shadow-sm leading-tight ${
              isExpected ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-slate-100 text-slate-600'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold uppercase shrink-0">{pair.left}</span>
                <span className={isExpected ? "text-blue-200" : "text-blue-400"}>→</span>
              </div>
              <div className={`italic break-words ${isExpected ? "text-blue-50" : "text-slate-400"}`}>
                {pair.right}
              </div>
            </div>
          ))}
        </div>
      );
    }

    let finalAns = isExpected ? question.correctAnswer : ans;
    if (!finalAns) return <span className="italic opacity-50">Non spécifié</span>;

    if (type === QuestionType.TRUE_FALSE) {
      const isTrue = String(finalAns).toLowerCase() === 'true' || String(finalAns).toLowerCase() === 'vrai';
      finalAns = isTrue ? 'Vrai' : 'Faux';
    }

    if (type === QuestionType.MULTIPLE_CHOICE || type === QuestionType.ORDERING) {
      try {
        let items: string[] = [];
        if (typeof finalAns === 'string' && finalAns.startsWith('[')) {
          items = JSON.parse(finalAns);
        } else if (Array.isArray(finalAns)) {
          items = finalAns;
        } else {
          items = [String(finalAns)];
        }

        const isOrdering = type === QuestionType.ORDERING;

        return (
          <div className="flex flex-col gap-2 mt-2 w-full">
            {items.map((item: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border shadow-sm shrink-0 mt-0.5 ${isExpected ? 'bg-white border-blue-400 text-blue-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                  {idx + 1}
                </div>
                <div className={`flex-1 text-[11px] font-bold px-3 py-2 rounded-xl border shadow-sm break-words ${isExpected ? 'bg-white/10 text-white border-white/20' : 'bg-white text-slate-600 border-slate-100'}`}>
                  {item}
                </div>
              </div>
            ))}
          </div>
        );
      } catch { return <span>{String(finalAns)}</span>; }
    }

    return (
      <span className={`inline-block px-4 py-2 rounded-2xl border font-black shadow-sm mt-1 text-sm break-words max-w-full ${
        isExpected ? 'bg-white/20 border-white/30 text-white' : 'bg-white border-slate-100 text-slate-700'
      }`}>
        {String(finalAns)}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-4 z-20 border border-slate-100 mb-4 transition-all">
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Historique de la Partie</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revue des épreuves</p>
        </div>
        <button onClick={onBack} className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white text-[10px] font-black py-3 px-8 rounded-2xl shadow-xl transition-all active:scale-95">Nouveau Plateau</button>
      </div>

      <div className="space-y-10 pb-20">
        {questions.map((q, i) => {
          const ans = answers.find(a => a.questionId === q.id);
          const isCorrect = ans?.isCorrect ?? false;

          return (
            <div key={q.id} className={`bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-2 transition-all ${isCorrect ? 'border-emerald-100' : 'border-rose-100'}`}>
              <div className="p-8 md:p-10">
                <div className="flex gap-2 mb-6">
                  <span className="text-[10px] font-black bg-slate-100 text-slate-800 px-3 py-1.5 rounded-full uppercase">Case {i + 1}</span>
                  <span className={`text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm uppercase ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                    {isCorrect ? 'Épreuve Réussie' : 'Épreuve Échouée'}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-slate-800 mb-6 leading-tight">{q.text}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                  <div className={`p-6 rounded-3xl border shadow-sm overflow-hidden flex flex-col ${isCorrect ? 'bg-emerald-50/40 border-emerald-100' : 'bg-rose-50/40 border-rose-100'}`}>
                    <p className="text-[9px] font-black uppercase tracking-widest mb-3 opacity-60">Votre Proposition</p>
                    <div className="flex-1">{renderFormattedAnswer(ans?.answer, q.type, q)}</div>
                  </div>
                  {!isCorrect && (
                    <div className="p-6 rounded-3xl bg-blue-600 text-white shadow-xl border border-blue-500/50 overflow-hidden flex flex-col">
                      <p className="text-[9px] font-black uppercase tracking-widest mb-3 text-blue-200">Solution Attendue</p>
                      <div className="flex-1">{renderFormattedAnswer(null, q.type, q, true)}</div>
                    </div>
                  )}
                </div>
                <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                  <div className="flex items-center gap-2 mb-4 text-slate-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-[9px] font-black uppercase tracking-widest">Explication Analytique</span>
                  </div>
                  <p className="text-slate-700 text-base leading-relaxed font-semibold italic">{q.explanation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RevisionView;
