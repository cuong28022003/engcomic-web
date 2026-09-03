export interface TestQuestion {
  number: number;
  part: number;
  correctAnswer?: string;
}

export interface TestSummary {
  id: string;
  testName: string;
  pdfUrl?: string;
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
  pdfUrl?: string;
  status: string;
  rawScore?: number;
  scaledScore?: number;
  questions: Array<{ number: number; part: number; correctAnswer?: string }>;
  createdAt: string;
}

export interface CreateTestPayload {
  testName: string;
  pdfUrl?: string;
  questions: Array<{
    number: number;
    part: number;
    correctAnswer: string;
  }>;
}

export interface AnswerKeyImportJson {
  test_name?: string;
  questions: Array<{
    number: number;
    part: number;
    correct_answer: string;
  }>;
}

export interface AnswerKeyParseResult {
  valid: boolean;
  testName?: string;
  questions: Array<{
    number: number;
    part: number;
    correctAnswer: string;
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