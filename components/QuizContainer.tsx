
import React, { useState, useMemo, useEffect } from 'react';
import { Question, QuestionType, UserAnswer } from '../types';
import QuestionRenderer from './QuestionRenderer';

interface Props {
  questions: Question[];
  domain: string;
  onComplete: (answers: UserAnswer[]) => void;
  onAnswer: (isCorrect: boolean, multiplier?: number) => void;
  onApplyEvent: (pvChange: number) => void;
  combo: number;
}

type GameEventType = 'CHANCE_BONUS' | 'CHANCE_MALUS' | 'SPECIAL_TRIAL';

const CORRECT_MESSAGES = ["Excellent !", "Parfait !", "Bien vu !", "Bravo !", "Exactement !"];
const INCORRECT_MESSAGES = ["Pas tout à fait...", "Oups !", "Presque...", "À revoir...", "Attention !"];

const QuizContainer: React.FC<Props> = ({ questions, domain, onComplete, onAnswer, onApplyEvent, combo }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  const [events, setEvents] = useState<Record<number, GameEventType>>({});
  const [showEventModal, setShowEventModal] = useState(false);
  const [isSpecialTrial, setIsSpecialTrial] = useState(false);

  // Restauration de l'état ou initialisation
  useEffect(() => {
    const saved = localStorage.getItem('medical_quiz_active_board');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.questionsId === questions[0]?.id) {
          setCurrentIndex(parsed.currentIndex);
          setAnswers(parsed.answers);
          setEvents(parsed.events || {});
          setShowFeedback(parsed.showFeedback);
          setIsCorrect(parsed.isCorrect);
          setIsSpecialTrial(parsed.isSpecialTrial);
          setShowEventModal(parsed.showEventModal);
          setCurrentAnswer(parsed.currentAnswer);
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved board state", e);
      }
    }
    
    setCurrentIndex(0);
    setAnswers([]);
    setShowFeedback(false);
    setIsSpecialTrial(false);
    setShowEventModal(false);
    setCurrentAnswer(null);
    
    const newEvents: Record<number, GameEventType> = {};
    let hasEvent = false;
    questions.forEach((_, i) => {
      if (i > 0 && i < questions.length - 1) {
        if (Math.random() < 0.4) {
          const rand = Math.random();
          if (rand < 0.33) newEvents[i] = 'CHANCE_BONUS';
          else if (rand < 0.66) newEvents[i] = 'CHANCE_MALUS';
          else newEvents[i] = 'SPECIAL_TRIAL';
          hasEvent = true;
        }
      }
    });

    if (!hasEvent && questions.length >= 3) {
      const randomIdx = Math.floor(Math.random() * (questions.length - 2)) + 1;
      const rand = Math.random();
      if (rand < 0.33) newEvents[randomIdx] = 'CHANCE_BONUS';
      else if (rand < 0.66) newEvents[randomIdx] = 'CHANCE_MALUS';
      else newEvents[randomIdx] = 'SPECIAL_TRIAL';
    }

    setEvents(newEvents);
  }, [questions]);

  // Sauvegarde automatique de l'état du plateau
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem('medical_quiz_active_board', JSON.stringify({
        questionsId: questions[0].id,
        currentIndex,
        answers,
        events,
        showFeedback,
        isCorrect,
        isSpecialTrial,
        showEventModal,
        currentAnswer
      }));
    }
  }, [questions, currentIndex, answers, events, showFeedback, isCorrect, isSpecialTrial, showEventModal, currentAnswer]);

  const currentQuestion = questions[currentIndex];

  const feedbackMessage = useMemo(() => {
    const list = isCorrect ? CORRECT_MESSAGES : INCORRECT_MESSAGES;
    return list[Math.floor(Math.random() * list.length)];
  }, [showFeedback, isCorrect]);

  const checkAnswer = () => {
    if (!currentQuestion) return;
    
    let correct = false;
    const ansStr = String(currentAnswer || '').trim().toLowerCase();
    const correctStr = String(currentQuestion.correctAnswer || '').trim().toLowerCase();

    switch (currentQuestion.type) {
      case QuestionType.TRUE_FALSE:
        const normalizedCorrect = correctStr === 'true' || correctStr === 'vrai' ? 'vrai' : 'faux';
        const normalizedAns = ansStr === 'true' || ansStr === 'vrai' ? 'vrai' : 'faux';
        correct = normalizedAns === normalizedCorrect;
        break;
      case QuestionType.SINGLE_CHOICE:
      case QuestionType.FILL_IN_THE_BLANKS:
        correct = ansStr === correctStr;
        break;
      case QuestionType.MULTIPLE_CHOICE:
        if (Array.isArray(currentAnswer)) {
          try {
            const rawCorrect = currentQuestion.correctAnswer;
            const correctOnes = typeof rawCorrect === 'string' && rawCorrect.startsWith('[')
              ? JSON.parse(rawCorrect) 
              : (Array.isArray(rawCorrect) ? rawCorrect : [rawCorrect]);
            
            correct = Array.isArray(correctOnes) && 
                      currentAnswer.length === correctOnes.length && 
                      currentAnswer.every(val => correctOnes.includes(val));
          } catch {
            correct = ansStr === correctStr;
          }
        }
        break;
      case QuestionType.ORDERING:
        if (Array.isArray(currentAnswer)) {
          try {
            const rawCorrect = currentQuestion.correctAnswer;
            const correctSequence = typeof rawCorrect === 'string' && rawCorrect.startsWith('[')
              ? JSON.parse(rawCorrect)
              : (Array.isArray(rawCorrect) ? rawCorrect : [rawCorrect]);
              
            correct = Array.isArray(correctSequence) &&
                      currentAnswer.length === correctSequence.length &&
                      currentAnswer.every((val, idx) => String(val) === String(correctSequence[idx]));
          } catch {
            correct = false;
          }
        }
        break;
      case QuestionType.ASSOCIATION:
        if (Array.isArray(currentAnswer)) {
           const pairs = currentQuestion.matchingPairs || [];
           correct = currentAnswer.length === pairs.length && 
                     currentAnswer.every((pair: any) => {
                       const original = pairs.find(p => p.id === pair.id);
                       return original?.right === pair.right;
                     });
        }
        break;
    }

    const newAnswer: UserAnswer = { questionId: currentQuestion.id, answer: currentAnswer, isCorrect: correct };
    setIsCorrect(correct);
    setShowFeedback(true);
    setAnswers(prev => [...prev, newAnswer]);
    onAnswer(correct, isSpecialTrial ? 2 : 1);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setShowFeedback(false);
      setCurrentAnswer(null);
      setIsSpecialTrial(false);
      
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      if (events[nextIndex]) {
        setShowEventModal(true);
      }
    } else {
      onComplete(answers);
    }
  };

  const renderFormattedAnswer = (ans: any, type: QuestionType, isExpected: boolean = false) => {
    if (type === QuestionType.ASSOCIATION) {
      const pairsToRender = isExpected 
        ? (currentQuestion?.matchingPairs || [])
        : (Array.isArray(ans) ? ans.map(a => ({ 
            left: currentQuestion?.matchingPairs?.find(p => p.id === a.id)?.left || "Terme", 
            right: a.right 
          })) : []);

      if (pairsToRender.length === 0) return <span className="italic text-slate-400">Aucune donnée</span>;

      return (
        <div className="flex flex-col gap-3 mt-2 w-full">
          {pairsToRender.map((pair, idx) => (
            <div key={idx} className={`flex flex-col p-4 rounded-2xl border shadow-sm ${
              isExpected ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[11px] font-black uppercase tracking-tight ${isExpected ? 'text-blue-700' : 'text-slate-800'}`}>
                  {pair.left}
                </span>
                <span className="text-blue-400">➔</span>
              </div>
              <div className={`text-sm leading-relaxed break-words ${isExpected ? 'text-blue-900 font-medium' : 'text-slate-600'}`}>
                {pair.right}
              </div>
            </div>
          ))}
        </div>
      );
    }

    let finalAns = isExpected ? currentQuestion?.correctAnswer : ans;
    if (!finalAns) return <span className="italic text-slate-400">Non spécifié</span>;

    if (type === QuestionType.TRUE_FALSE) {
      const isTrue = String(finalAns).toLowerCase() === 'true' || String(finalAns).toLowerCase() === 'vrai';
      finalAns = isTrue ? 'Vrai' : 'Faux';
    }

    if (type === QuestionType.MULTIPLE_CHOICE || type === QuestionType.ORDERING) {
      let items: string[] = [];
      try {
        if (typeof finalAns === 'string' && finalAns.startsWith('[')) {
          items = JSON.parse(finalAns);
        } else if (Array.isArray(finalAns)) {
          items = finalAns;
        } else {
          items = [String(finalAns)];
        }
      } catch {
        items = [String(finalAns)];
      }

      const isOrdering = type === QuestionType.ORDERING;

      return (
        <div className="flex flex-col gap-2 mt-2 w-full">
          {items.map((item: string, idx: number) => (
            <div key={idx} className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 shadow-sm shrink-0 mt-0.5 ${
                isExpected ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-200 border-slate-300 text-slate-500'
              }`}>
                {idx + 1}
              </div>
              <div className={`flex-1 text-sm font-bold px-4 py-3 rounded-2xl border shadow-sm break-words ${
                isExpected ? 'bg-blue-50 text-blue-900 border-blue-200' : 'bg-white text-slate-800 border-slate-200'
              }`}>
                {item}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <span className={`inline-block px-5 py-3 rounded-2xl border font-black shadow-sm mt-1 text-sm break-words max-w-full ${
        isExpected ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {String(finalAns)}
      </span>
    );
  };

  if (!currentQuestion) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold italic">Finalisation du diagnostic...</p>
      </div>
    );
  }

  const progress = ((currentIndex + (showFeedback ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col gap-4 border border-slate-100">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>Plateau : Case {currentIndex + 1} / {questions.length}</span>
          <span className="truncate max-w-[200px] text-right text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full font-bold">{domain}</span>
        </div>
        
        {/* Progress Gauge */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Board Game Path */}
        <div className="flex items-center justify-start w-full overflow-x-auto py-4 custom-scrollbar -mx-2 px-2">
          <div className="flex items-center min-w-max">
            {questions.map((_, i) => {
              const hasEvent = events[i];
              return (
              <React.Fragment key={i}>
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-xs md:text-sm shrink-0 border-2 transition-all duration-500 ${
                  i < currentIndex ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm' :
                  i === currentIndex ? (isSpecialTrial ? 'bg-amber-500 border-amber-600 text-white ring-4 ring-amber-100 animate-pulse shadow-md scale-110' : 'bg-indigo-500 border-indigo-600 text-white ring-4 ring-indigo-100 animate-pulse shadow-md scale-110') :
                  hasEvent ? 'bg-purple-100 border-purple-300 text-purple-600' :
                  'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  {i < currentIndex ? '✓' : 
                   i === currentIndex ? (isSpecialTrial ? '🔥' : i + 1) : 
                   hasEvent ? '❓' : i + 1}
                </div>
                {i < questions.length - 1 && (
                  <div className={`h-1.5 w-4 md:w-6 shrink-0 transition-all duration-500 ${i < currentIndex ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                )}
              </React.Fragment>
            )})}
            {/* Finish Line */}
            <div className={`h-1.5 w-4 md:w-6 shrink-0 transition-all duration-500 ${currentIndex === questions.length - 1 && showFeedback ? 'bg-emerald-500' : 'bg-slate-100'}`} />
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center font-black text-xl md:text-2xl shrink-0 border-2 transition-all duration-500 ${
              currentIndex === questions.length - 1 && showFeedback && isCorrect ? 'bg-amber-400 border-amber-500 text-white shadow-lg scale-110' : 'bg-slate-100 border-slate-200 text-slate-300'
            }`}>
              🏆
            </div>
          </div>
        </div>
      </div>

      {showEventModal ? (
        <div className={`bg-white rounded-3xl shadow-xl border-4 p-8 md:p-12 text-center flex flex-col items-center animate-scale-up ${
          events[currentIndex] === 'CHANCE_BONUS' ? 'border-emerald-400' : 
          events[currentIndex] === 'CHANCE_MALUS' ? 'border-rose-400' : 'border-amber-400'
        }`}>
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner ${
            events[currentIndex] === 'CHANCE_BONUS' ? 'bg-emerald-100' : 
            events[currentIndex] === 'CHANCE_MALUS' ? 'bg-rose-100' : 'bg-amber-100'
          }`}>
            {events[currentIndex] === 'CHANCE_BONUS' ? '🍀' : events[currentIndex] === 'CHANCE_MALUS' ? '⚠️' : '🔥'}
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-4">
            {events[currentIndex] === 'SPECIAL_TRIAL' ? 'Épreuve Spéciale !' : 'Carte Chance !'}
          </h2>
          <p className="text-lg text-slate-600 font-medium mb-8">
            {events[currentIndex] === 'CHANCE_BONUS' ? 'Coup de chance ! Vous trouvez un raccourci dans le dossier. (+50 PV)' :
             events[currentIndex] === 'CHANCE_MALUS' ? 'Imprévu ! Le bipeur sonne, vous perdez du temps. (-30 PV)' :
             'Cas complexe ! Les PV sont doublés en cas de réussite, mais vous perdez 50 PV en cas d\'échec.'}
          </p>
          <button 
            onClick={() => {
              if (events[currentIndex] === 'CHANCE_BONUS') onApplyEvent(50);
              if (events[currentIndex] === 'CHANCE_MALUS') onApplyEvent(-30);
              if (events[currentIndex] === 'SPECIAL_TRIAL') setIsSpecialTrial(true);
              setShowEventModal(false);
            }}
            className="w-full max-w-xs bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95"
          >
            {events[currentIndex] === 'SPECIAL_TRIAL' ? 'Relever le défi' : 'Continuer'}
          </button>
        </div>
      ) : (
        <div key={currentIndex} className={`bg-white rounded-3xl shadow-xl border overflow-hidden flex flex-col transition-all duration-300 animate-slide-in-right ${
          showFeedback 
            ? isCorrect 
              ? 'border-emerald-200 ring-2 ring-emerald-100 animate-glow-correct' 
              : 'border-rose-200 ring-2 ring-rose-100 animate-glow-incorrect animate-shake'
            : 'border-slate-100'
        }`}>
          <div className="p-6 md:p-10 flex-1">
            <QuestionRenderer 
            question={currentQuestion} 
            currentAnswer={currentAnswer} 
            onAnswerChange={setCurrentAnswer} 
            disabled={showFeedback}
          />
        </div>

        {showFeedback ? (
          <div className={`p-8 md:p-10 border-t-4 animate-in slide-in-from-bottom-2 duration-300 ${isCorrect ? 'bg-emerald-50 border-emerald-500' : 'bg-rose-50 border-rose-500'}`}>
            <div className="flex flex-col gap-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                <div className={`p-4 rounded-3xl shadow-lg shrink-0 ${isCorrect ? 'bg-emerald-500 text-white animate-pop' : 'bg-rose-500 text-white animate-shake'}`}>
                  {isCorrect ? (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  )}
                </div>
                <div className="flex flex-col items-center sm:items-start">
                  <h3 className={`text-2xl font-black ${isCorrect ? 'text-emerald-900' : 'text-rose-900'}`}>{feedbackMessage}</h3>
                  <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-2">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{isCorrect ? "Épreuve Réussie" : "Épreuve Échouée"}</p>
                    {isCorrect && (
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black animate-pop">
                        +{ (100 + (combo > 0 ? (combo - 1) * 10 : 0)) * (isSpecialTrial ? 2 : 1) } PV
                      </span>
                    )}
                    {!isCorrect && isSpecialTrial && (
                      <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-black animate-pop">
                        -50 PV
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-slate-200/50 shadow-sm flex flex-col">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Votre Proposition</h4>
                  <div className="flex-1">{renderFormattedAnswer(currentAnswer, currentQuestion.type)}</div>
                </div>
                {!isCorrect && (
                  <div className="bg-white rounded-3xl p-6 border-2 border-blue-100 shadow-md flex flex-col">
                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">Solution Attendue</h4>
                    <div className="flex-1">{renderFormattedAnswer(null, currentQuestion.type, true)}</div>
                  </div>
                )}
              </div>
              
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest">Note Pédagogique</span>
                </div>
                <p className="text-slate-700 font-semibold text-lg italic leading-relaxed">{currentQuestion.explanation}</p>
              </div>

              <button 
                onClick={handleNext} 
                className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <span>{currentIndex < questions.length - 1 ? "Avancer le pion" : "Atteindre l'Arrivée"}</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 bg-slate-50 border-t border-slate-100">
            <button 
              onClick={checkAnswer} 
              disabled={!currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0)}
              className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <span className="text-lg">Jouer cette réponse</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default QuizContainer;
