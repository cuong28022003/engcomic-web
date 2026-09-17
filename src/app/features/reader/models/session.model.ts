export type TimeMode = 'full_test' | 'per_part' | 'untimed';
export type PacingStatus = 'ahead' | 'on_track' | 'behind';

export interface TimeTargetConfig {
  mode: TimeMode;
  section?: 'reading' | 'listening';
  selectedParts?: number[];
  part1_minutes?: number;
  part2_minutes?: number;
  part3_minutes?: number;
  part4_minutes?: number;
  part5_minutes?: number;
  part6_minutes?: number;
  part7_minutes?: number;
}

export interface UserTimeSettings {
  mode: TimeMode;
  selectedParts?: number[];
  part1_target_minutes?: number;
  part2_target_minutes?: number;
  part3_target_minutes?: number;
  part4_target_minutes?: number;
  part5_target_minutes: number;
  part6_target_minutes: number;
  part7_target_minutes: number;
  updated_at?: string;
}

export interface PartTiming {
  part: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  target_seconds: number;
  elapsed_seconds: number;
  start_question: number;
  end_question: number;
}

export interface UserAnswerItem {
  questionNumber: number;
  answer?: string; // "A" | "B" | "C" | "D"
  flagged?: boolean;
  timeSpentSeconds?: number;
}

export interface SubmitSessionPayload {
  duration: number; // in seconds
  timeMode?: TimeMode;
  selectedParts?: number[];
  part1TargetSeconds?: number;
  part2TargetSeconds?: number;
  part3TargetSeconds?: number;
  part4TargetSeconds?: number;
  part5TargetSeconds?: number;
  part6TargetSeconds?: number;
  part7TargetSeconds?: number;
  part1ElapsedSeconds?: number;
  part2ElapsedSeconds?: number;
  part3ElapsedSeconds?: number;
  part4ElapsedSeconds?: number;
  part5ElapsedSeconds?: number;
  part6ElapsedSeconds?: number;
  part7ElapsedSeconds?: number;
  answers: UserAnswerItem[];
}

export interface GradedQuestion {
  questionNumber: number;
  part: number;
  userAnswer?: string;
  correctAnswer: string;
  isCorrect: boolean;
  flagged?: boolean;
  timeSpentSeconds?: number;
}

export interface PartBreakdown {
  part: number;
  correctCount: number;
  totalCount: number;
  accuracyPercentage: number;
  targetSeconds?: number;
  elapsedSeconds?: number;
  avgSecondsPerQuestion?: number;
}

export interface SubmitSessionResponse {
  testId: string;
  testName: string;
  attemptId?: string;
  attemptNumber?: number;
  rawScore: number;
  scaledScore?: number;
  totalQuestions: number;
  accuracyPercentage: number;
  duration: number;
  partBreakdown: PartBreakdown[];
  results: GradedQuestion[];
}

export type AttemptStatus = 'in_progress' | 'completed' | 'abandoned';

export interface ToeicAttemptAnswer {
  questionNumber: number;
  part: number;
  userAnswer?: string;
  correctAnswer?: string;
  isCorrect?: boolean;
  flagged?: boolean;
  timeSpentSeconds?: number;
}

export interface ToeicAttempt {
  id: string;
  testId: string;
  testName: string;
  attemptNumber: number;
  status: AttemptStatus;
  timeMode: TimeMode;
  selectedParts: number[];
  part1TargetSeconds?: number;
  part2TargetSeconds?: number;
  part3TargetSeconds?: number;
  part4TargetSeconds?: number;
  part5TargetSeconds: number;
  part6TargetSeconds: number;
  part7TargetSeconds: number;
  totalElapsedSeconds: number;
  part1ElapsedSeconds?: number;
  part2ElapsedSeconds?: number;
  part3ElapsedSeconds?: number;
  part4ElapsedSeconds?: number;
  part5ElapsedSeconds: number;
  part6ElapsedSeconds: number;
  part7ElapsedSeconds: number;
  rawScore: number;
  scaledScore?: number;
  totalQuestions: number;
  accuracyPercentage: number;
  answers: ToeicAttemptAnswer[];
  startedAt: string;
  lastSavedAt?: string;
  completedAt?: string;
}

export interface SaveProgressPayload {
  totalElapsedSeconds: number;
  part1ElapsedSeconds?: number;
  part2ElapsedSeconds?: number;
  part3ElapsedSeconds?: number;
  part4ElapsedSeconds?: number;
  part5ElapsedSeconds: number;
  part6ElapsedSeconds: number;
  part7ElapsedSeconds: number;
  answers: {
    questionNumber: number;
    part: number;
    answer?: string;
    flagged?: boolean;
    timeSpentSeconds?: number;
  }[];
}