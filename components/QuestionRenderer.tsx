
import React, { useState, useEffect } from 'react';
import { Question, QuestionType } from '../types';

interface Props {
  question: Question;
  currentAnswer: any;
  onAnswerChange: (answer: any) => void;
  disabled: boolean;
}

const AssociationRenderer: React.FC<Props> = ({ question, currentAnswer, onAnswerChange, disabled }) => {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [shuffledRights, setShuffledRights] = useState<string[]>([]);
  const matches = Array.isArray(currentAnswer) ? currentAnswer : [];
  const pairs = question.matchingPairs || [];

  useEffect(() => {
    if (pairs.length > 0 && shuffledRights.length === 0) {
      setShuffledRights([...pairs.map(p => p.right)].sort(() => Math.random() - 0.5));
    }
  }, [pairs, shuffledRights.length]);

  const handleMatch = (right: string) => {
    if (!selectedLeft) return;
    const newMatches = [...matches.filter(m => m.id !== selectedLeft), { id: selectedLeft, right }];
    onAnswerChange(newMatches);
    setSelectedLeft(null);
  };

  const removeMatch = (id: string) => {
    if (disabled) return;
    onAnswerChange(matches.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 leading-snug">{question.text}</h2>
          <p className="text-xs text-slate-400 mt-1">Cliquez sur un terme à gauche, puis sur sa définition à droite.</p>
        </div>
        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold whitespace-nowrap uppercase tracking-tighter">Association</span>
      </div>

      {/* Zone de récapitulatif des liens en cours */}
      {matches.length > 0 && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 10-5.656-5.656l-1.102 1.101" /></svg>
            Vos associations ({matches.length}/{pairs.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {matches.map(m => {
              const leftTerm = pairs.find(p => p.id === m.id)?.left || "Terme";
              return (
                <div key={m.id} className="flex items-center bg-white border border-blue-200 rounded-lg pl-3 pr-1 py-1 shadow-sm group">
                  <span className="text-[10px] font-bold text-blue-700 mr-2">{leftTerm}</span>
                  <div className="w-2 h-px bg-blue-200 mr-2"></div>
                  <span className="text-[9px] text-slate-500 italic truncate max-w-[100px] mr-2">{m.right}</span>
                  <button 
                    onClick={() => removeMatch(m.id)} 
                    disabled={disabled}
                    className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/30 p-2 rounded-2xl border border-slate-100">
        <div className="space-y-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-1">Termes</h3>
          <div className="grid gap-2">
            {pairs.map(p => {
              const m = matches.find(match => match.id === p.id);
              const isActive = selectedLeft === p.id;
              return (
                <button 
                  key={p.id} 
                  disabled={disabled} 
                  type="button" 
                  onClick={() => setSelectedLeft(isActive ? null : p.id)}
                  className={`w-full p-4 rounded-xl border-2 text-sm text-left transition-all relative flex flex-col gap-1 ${
                    isActive 
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-100 z-10' 
                      : m 
                        ? 'border-emerald-100 bg-emerald-50/30 text-emerald-800' 
                        : 'border-white bg-white hover:border-slate-200 text-slate-600 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold">{p.left}</span>
                    {m && (
                      <div className="bg-emerald-500 text-white p-1 rounded-full animate-pop">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </div>
                  {m && (
                    <div className="text-[9px] text-emerald-600 italic font-medium truncate w-full opacity-80 border-t border-emerald-100 pt-1 mt-1">
                      {m.right}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-1">Définitions</h3>
          <div className="grid gap-2">
            {shuffledRights.map(r => {
              const usedMatch = matches.find(m => m.right === r);
              const linkedTerm = usedMatch ? pairs.find(p => p.id === usedMatch.id)?.left : null;
              const canSelect = selectedLeft && !usedMatch;
              
              return (
                <button 
                  key={r} 
                  disabled={disabled || (usedMatch ? false : !selectedLeft)} 
                  type="button" 
                  onClick={() => usedMatch ? removeMatch(usedMatch.id) : handleMatch(r)}
                  className={`w-full p-4 rounded-xl border-2 text-[11px] leading-snug transition-all text-left min-h-[70px] flex flex-col justify-center relative ${
                    usedMatch 
                      ? 'border-emerald-100 bg-white text-slate-400 opacity-60 hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50 group' 
                      : selectedLeft 
                        ? 'border-blue-200 hover:border-blue-400 bg-white shadow-sm cursor-pointer' 
                        : 'border-white bg-white opacity-40 cursor-not-allowed'
                  }`}
                >
                  <span className="font-medium text-slate-700">{r}</span>
                  {usedMatch && (
                    <div className="mt-2 flex items-center gap-1.5 pt-2 border-t border-slate-50 w-full">
                      <span className="text-[8px] font-black uppercase tracking-tighter text-emerald-500 group-hover:hidden">Lié à : {linkedTerm}</span>
                      <span className="text-[8px] font-black uppercase tracking-tighter text-rose-500 hidden group-hover:inline">Cliquer pour délier</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const QuestionRenderer: React.FC<Props> = ({ question, currentAnswer, onAnswerChange, disabled }) => {
  useEffect(() => {
    if (question.type === QuestionType.ORDERING && !currentAnswer && question.options && question.options.length > 0) {
      onAnswerChange([...question.options]);
    }
  }, [question, currentAnswer, onAnswerChange]);

  const handleMultipleChoice = (opt: string) => {
    const current = Array.isArray(currentAnswer) ? currentAnswer : [];
    if (current.includes(opt)) {
      onAnswerChange(current.filter(i => i !== opt));
    } else {
      onAnswerChange([...current, opt]);
    }
  };

  const moveOrder = (index: number, direction: 'up' | 'down') => {
    if (disabled || !Array.isArray(currentAnswer)) return;
    const newOrder = [...currentAnswer];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    onAnswerChange(newOrder);
  };

  if (question.type === QuestionType.ASSOCIATION) {
    return <AssociationRenderer question={question} currentAnswer={currentAnswer} onAnswerChange={onAnswerChange} disabled={disabled} />;
  }

  if (question.type === QuestionType.SINGLE_CHOICE || question.type === QuestionType.TRUE_FALSE) {
    const isTF = question.type === QuestionType.TRUE_FALSE;
    const opts = isTF ? ["Vrai", "Faux"] : (question.options || []);
    
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 leading-snug">{question.text}</h2>
        <div className={`grid ${isTF ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
          {opts.map((opt) => (
            <button key={opt} disabled={disabled} onClick={() => onAnswerChange(opt)}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${currentAnswer === opt 
                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100 text-blue-700 font-bold shadow-md' 
                : 'border-slate-100 hover:border-slate-300 text-slate-600 bg-white'}`}
            >
              <div className="flex items-center justify-between">
                <span>{opt}</span>
                {currentAnswer === opt && (
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white animate-pop">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (question.type === QuestionType.MULTIPLE_CHOICE) {
    const selected = Array.isArray(currentAnswer) ? currentAnswer : [];
    const opts = question.options || [];
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <h2 className="text-xl font-bold text-slate-800 leading-snug">{question.text}</h2>
          <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold whitespace-nowrap uppercase tracking-tighter">Plusieurs réponses</span>
        </div>
        <div className="grid gap-3">
          {opts.map((opt) => (
            <button key={opt} disabled={disabled} onClick={() => handleMultipleChoice(opt)}
              className={`p-5 rounded-2xl border-2 text-left transition-all flex justify-between items-center ${selected.includes(opt) ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-md' : 'border-slate-100 hover:border-slate-300 text-slate-600 bg-white'}`}
            >
              <span>{opt}</span>
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selected.includes(opt) ? 'bg-indigo-600 border-indigo-600 animate-pop' : 'border-slate-200'}`}>
                {selected.includes(opt) && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (question.type === QuestionType.FILL_IN_THE_BLANKS) {
    const parts = (question.text || "").split('___');
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 leading-snug">Terminez la phrase :</h2>
        <div className="bg-slate-50 p-8 rounded-3xl text-lg leading-relaxed text-slate-700 border border-slate-100 shadow-inner">
          {parts[0]}
          <input 
            type="text" 
            disabled={disabled} 
            value={currentAnswer || ''} 
            onChange={(e) => onAnswerChange(e.target.value)} 
            placeholder="Réponse..."
            className="mx-2 px-4 py-2 border-b-4 border-blue-200 bg-white focus:border-blue-600 outline-none text-blue-700 font-black w-64 text-center rounded-xl shadow-sm transition-all" 
          />
          {parts[1] || ''}
        </div>
      </div>
    );
  }

  if (question.type === QuestionType.ORDERING) {
    const order = Array.isArray(currentAnswer) ? currentAnswer : (question.options || []);
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <h2 className="text-xl font-bold text-slate-800 leading-snug">{question.text}</h2>
          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold whitespace-nowrap uppercase tracking-tighter">Mise en ordre</span>
        </div>
        <div className="space-y-3">
          {order.map((opt, idx) => (
            <div key={`${opt}-${idx}`} className="flex items-center gap-4 bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm transition-all hover:border-blue-200">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-xs font-black text-white shrink-0 shadow-lg">
                {idx + 1}
              </div>
              <span className="flex-1 text-sm font-bold text-slate-700">{opt}</span>
              {!disabled && (
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveOrder(idx, 'up')} disabled={idx === 0} className="p-2 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-400 disabled:opacity-10 transition-all rounded-lg shadow-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button onClick={() => moveOrder(idx, 'down')} disabled={idx === order.length - 1} className="p-2 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-400 disabled:opacity-10 transition-all rounded-lg shadow-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        {!disabled && <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest text-center mt-4">Organisez la séquence logique ci-dessus</p>}
      </div>
    );
  }

  return <div className="p-8 text-center text-slate-400 italic font-bold">Format non pris en charge.</div>;
};

export default QuestionRenderer;
