
export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  FILL_IN_THE_BLANKS = 'FILL_IN_THE_BLANKS',
  ASSOCIATION = 'ASSOCIATION',
  TRUE_FALSE = 'TRUE_FALSE',
  ORDERING = 'ORDERING'
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer?: string | string[];
  matchingPairs?: MatchingPair[];
  explanation: string;
}

export type QuizDomain = 
  | 'Tous les domaines (Mélange)'
  | 'Cardiologie' 
  | 'Dermatologie'
  | 'Endocrinologie'
  | 'Gastro-entérologie'
  | 'Gynécologie-Obstétrique'
  | 'Hématologie'
  | 'Infectiologie'
  | 'Néphrologie'
  | 'Neurologie'
  | 'Oncologie'
  | 'Ophtalmologie'
  | 'ORL (Oto-Rhino-Laryngologie)'
  | 'Orthopédie-Traumatologie'
  | 'Pédiatrie'
  | 'Pneumologie'
  | 'Psychiatrie'
  | 'Radiologie'
  | 'Rhumatologie'
  | 'Urologie';

export interface QuizSettings {
  domains: QuizDomain[];
  questionCount: number;
}

export interface UserAnswer {
  questionId: string;
  answer: any;
  isCorrect: boolean;
}
