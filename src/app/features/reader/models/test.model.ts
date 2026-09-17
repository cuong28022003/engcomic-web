export type ToeicSection = 'reading' | 'listening';

export interface TestQuestion {
  number: number;
  part: number;
  correctAnswer?: string;
  audioStartMs?: number;
  transcript?: string;
}

export interface TestSummary {
  id: string;
  testName: string;
  section?: ToeicSection;
  pdfUrl?: string;
  audioUrl?: string;
  questionCount: number;
  rawScore?: number;
  scaledScore?: number;
  status: 'not_started' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt?: string;
}

export interface TestDetail {
  id: string;
  testName: string;
  section?: ToeicSection;
  pdfUrl?: string;
  audioUrl?: string;
  status: string;
  rawScore?: number;
  scaledScore?: number;
  questions: Array<{ number: number; part: number; correctAnswer?: string; audioStartMs?: number; transcript?: string }>;
  createdAt: string;
}

export interface CreateTestPayload {
  testName: string;
  section?: ToeicSection;
  pdfUrl?: string;
  questions: Array<{
    number: number;
    part: number;
    correctAnswer: string;
    audioStartMs?: number;
    transcript?: string;
  }>;
}

export interface AnswerKeyImportJson {
  test_name?: string;
  questions: Array<{
    number: number;
    part: number;
    correct_answer: string;
    audio_start_ms?: number;
    transcript?: string;
  }>;
}

export interface AnswerKeyParseResult {
  valid: boolean;
  testName?: string;
  questions: Array<{
    number: number;
    part: number;
    correctAnswer: string;
    audioStartMs?: number;
    transcript?: string;
  }>;
  errors: string[];
}

export interface ToeicDashboardData {
  totalTests: number;
  completedTests: number;
  totalAttempts: number;
  averageAccuracy?: number;
  recentTests: TestSummary[];
}