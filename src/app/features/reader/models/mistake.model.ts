export interface MistakeItem {
  id: string;
  testId: string;
  testName: string;
  questionNumber: number;
  part: number;
  userAnswer?: string;
  correctAnswer: string;
  explanation?: string;
  status: 'pending' | 'explained' | 'resolved';
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateMistakePayload {
  explanation?: string;
  status?: 'pending' | 'explained' | 'resolved';
}

export interface CreateMistakeBatchPayload {
  mistakes: Array<{
    testId: string;
    testName: string;
    questionNumber: number;
    part: number;
    userAnswer?: string;
    correctAnswer: string;
  }>;
}