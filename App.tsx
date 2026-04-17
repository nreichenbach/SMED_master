
import React, { useState, useEffect } from 'react';
import { QuizDomain, QuizSettings, Question, UserAnswer } from './types';
import SetupScreen from './components/SetupScreen';
import QuizContainer from './components/QuizContainer';
import ResultSummary from './components/ResultSummary';
import RevisionView from './components/RevisionView';
import { generateQuizQuestions } from './services/geminiService';

export const RANKS = [
  { name: 'Débutant(e)', minXp: 0 },
  { name: 'Initié(e)', minXp: 500 },
  { name: 'Intermédiaire', minXp: 1500 },
  { name: 'Confirmé(e)', minXp: 3000 },
  { name: 'Avancé(e)', minXp: 5000 },
  { name: 'Expert(e)', minXp: 10000 },
];

export const getRank = (xp: number) => {
  return [...RANKS].reverse().find(r => xp >= r.minXp) || RANKS[0];
};

export const getNextRank = (xp: number) => {
  return RANKS.find(r => xp < r.minXp);
};

const App: React.FC = () => {
  const [step, setStep] = useState<'setup' | 'loading' | 'quiz' | 'results' | 'revision'>('setup');
  const [settings, setSettings] = useState<QuizSettings | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Game State
  const [xp, setXp] = useState<number>(() => {
    const saved = localStorage.getItem('smed_xp');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [combo, setCombo] = useState<number>(0);
  const [sessionXp, setSessionXp] = useState<number>(0);
  const [hasSavedGame, setHasSavedGame] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('medical_quiz_app_state');
    if (saved) {
      setHasSavedGame(true);
    }
  }, []);

  useEffect(() => {
    if (step !== 'setup' && step !== 'loading') {
      localStorage.setItem('medical_quiz_app_state', JSON.stringify({
        step, questions, settings, sessionXp, combo, answers
      }));
      setHasSavedGame(true);
    }
  }, [step, questions, settings, sessionXp, combo, answers]);

  const handleResume = () => {
    const saved = localStorage.getItem('medical_quiz_app_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setQuestions(parsed.questions || []);
        setSettings(parsed.settings || null);
        setSessionXp(parsed.sessionXp || 0);
        setCombo(parsed.combo || 0);
        setAnswers(parsed.answers || []);
        setStep(parsed.step || 'setup');
      } catch (e) {
        console.error("Failed to resume game", e);
      }
    }
  };

  useEffect(() => {
    localStorage.setItem('smed_xp', xp.toString());
  }, [xp]);

  const handleStartQuiz = async (newSettings: QuizSettings) => {
    setSettings(newSettings);
    setStep('loading');
    setError(null);
    setSessionXp(0);
    setCombo(0);
    setAnswers([]);
    localStorage.removeItem('medical_quiz_active_board');
    try {
      const generated = await generateQuizQuestions(newSettings.domains, newSettings.questionCount);
      setQuestions(generated);
      setStep('quiz');
    } catch (err: any) {
      console.error(err);
      if (err.message === "QUOTA_GLOBAL_EXCEEDED" || err.message?.includes('429')) {
        setError("Limite d'utilisation atteinte. Veuillez patienter 1 minute avant de prendre votre garde (limite de l'API gratuite).");
      } else {
        setError("Une erreur technique est survenue. L'hôpital est en maintenance.");
      }
      setStep('setup');
    }
  };

  const handleAnswer = (isCorrect: boolean, multiplier: number = 1) => {
    if (isCorrect) {
      const earnedXp = (100 + (combo * 10)) * multiplier;
      setXp(prev => prev + earnedXp);
      setSessionXp(prev => prev + earnedXp);
      setCombo(prev => prev + 1);
    } else {
      if (multiplier > 1) {
        const malus = 50;
        setXp(prev => Math.max(0, prev - malus));
        setSessionXp(prev => prev - malus);
      }
      setCombo(0);
    }
  };

  const handleApplyEvent = (pvChange: number) => {
    setXp(prev => Math.max(0, prev + pvChange));
    setSessionXp(prev => prev + pvChange);
  };

  const handleQuizComplete = (finalAnswers: UserAnswer[]) => {
    setAnswers(finalAnswers);
    setStep('results');
  };

  const handleRestart = () => {
    setStep('setup');
    setQuestions([]);
    setAnswers([]);
    setSettings(null);
    setSessionXp(0);
    setCombo(0);
    localStorage.removeItem('medical_quiz_app_state');
    localStorage.removeItem('medical_quiz_active_board');
    setHasSavedGame(false);
  };

  const handleGoToRevision = () => {
    setStep('revision');
  };

  const displayDomain = settings?.domains.includes('Tous les domaines (Mélange)') 
    ? 'Mélange complet' 
    : settings?.domains.join(', ');

  const currentRank = getRank(xp);
  const nextRank = getNextRank(xp);
  const rankProgress = nextRank 
    ? ((xp - currentRank.minXp) / (nextRank.minXp - currentRank.minXp)) * 100 
    : 100;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl mb-8 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            SMED <span className="text-blue-600">Master</span>
          </h1>
        </div>
        
        {/* Game Stats Header */}
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-amber-600 font-black text-xl shadow-inner shrink-0">
              {currentRank.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-bold text-slate-700">{currentRank.name}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{xp} PV</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 transition-all duration-500 ease-out" style={{ width: `${rankProgress}%` }}></div>
              </div>
              {nextRank && <p className="text-[9px] text-slate-400 mt-1 text-right">Prochain grade: {nextRank.name}</p>}
            </div>
          </div>
          
          <div className="flex gap-3 shrink-0">
            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex flex-col items-center justify-center min-w-[80px]">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Combo</span>
              <span className={`text-xl font-black ${combo > 2 ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`}>x{combo}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-2xl">
        {step === 'setup' && (
          <SetupScreen 
            onStart={handleStartQuiz} 
            error={error} 
            hasSavedGame={hasSavedGame}
            onResume={handleResume}
          />
        )}

        {step === 'loading' && (
          <div className="bg-white rounded-3xl shadow-xl p-12 flex flex-col items-center justify-center border border-slate-100 w-full max-w-md mx-auto animate-scale-up">
            <div className="relative flex items-center justify-center mb-8 h-24 w-24">
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center animate-heartbeat shadow-lg shadow-blue-200">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-800 text-center mb-2">Génération du dossier...</h2>
            <div className="flex gap-1.5 mt-2 mb-4">
              <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-slate-500 text-center text-sm font-medium">Préparation des épreuves médicales</p>
          </div>
        )}

        {step === 'quiz' && (
          <QuizContainer 
            questions={questions} 
            domain={displayDomain!} 
            onComplete={handleQuizComplete} 
            onAnswer={handleAnswer}
            onApplyEvent={handleApplyEvent}
            combo={combo}
          />
        )}

        {step === 'results' && (
          <ResultSummary 
            answers={answers} 
            totalQuestions={questions.length} 
            onRestart={handleRestart} 
            onReview={handleGoToRevision}
            sessionXp={sessionXp}
            currentRank={currentRank.name}
          />
        )}

        {step === 'revision' && (
          <RevisionView questions={questions} answers={answers} onBack={handleRestart} />
        )}
      </main>

      <footer className="mt-auto pt-8 text-slate-400 text-sm italic text-center">
        Propulsé par Gemini AI
      </footer>
    </div>
  );
};

export default App;
