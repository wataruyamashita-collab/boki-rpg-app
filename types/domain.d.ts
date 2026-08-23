export type QuestionType = 'journal' | 'ledger' | 'trial_balance' | 'correction' | 'worksheet' | 'financial_statement' | 'comprehensive';
export type Confidence = 'careful' | 'bold';

export interface JournalItem { account: string; amount: number; }
export interface JournalAnswer { debit: JournalItem[]; credit: JournalItem[]; }
export type TableInputType = 'amount' | 'text' | 'account';
export interface TableAnswer { cells: Record<string, number | string>; }
export interface QuestionTable { columns: string[]; rows: Array<Record<string, string | number | null>>; inputCells: string[]; inputTypes?: Record<string, TableInputType>; }
export interface Question {
  id: string;
  type: QuestionType;
  category: string;
  difficulty: number;
  chapter: number;
  scene?: string;
  story?: string;
  question: string;
  answer: JournalAnswer | TableAnswer;
  table?: QuestionTable;
  explanation: string;
}
export type QuestionMap = Record<string, Question>;
export interface ProgressState {
  mode: 'story' | 'training' | 'review' | 'exam';
  currentQuestionId: string | null;
  answeredIds: string[];
  incorrectIds: string[];
  mistakeCounts: Record<string, number>;
  drafts: Record<string, JournalAnswer | TableAnswer>;
  completed: boolean;
  examAttempt?: number;
}
