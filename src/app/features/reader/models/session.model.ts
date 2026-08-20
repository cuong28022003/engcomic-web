export interface UserAnswerItem {
  questionNumber: number;
  answer?: string; // "A" | "B" | "C" | "D"
  flagged?: boolean;
}

export interface SubmitSessionPayload {
  duration: number; // in seconds
  answers: UserAnswerItem[];
}

export interface GradedQuestion {
  questionNumber: number;
  part: number;
  userAnswer?: string;
  correctAnswer: string;
  isCorrect: boolean;
  flagged?: boolean;
}

export interface PartBreakdown {
  part: number;
  correctCount: number;
  totalCount: number;
  accuracyPercentage: number;
}

export interface SubmitSessionResponse {
  testId: string;
  testName: string;
  rawScore: number;
  scaledScore?: number;
  totalQuestions: number;
  accuracyPercentage: number;
  duration: number;
  partBreakdown: PartBreakdown[];
  results: GradedQuestion[];
  newMistakes: import('./mistake.model').MistakeItem[];
}