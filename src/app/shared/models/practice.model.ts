export interface ExerciseOption {
  text: string;
  isCorrect: boolean;
}

export interface Level1Recognition {
  question: string;
  options: ExerciseOption[];
}

export interface Level2Context {
  question: string;
  sentence: string;
  options: ExerciseOption[];
  collocationNote?: string;
}

export interface Level3Production {
  prompt: string;
  shuffledWords: string[];
  correctSentence: string;
  vietnameseMeaning?: string;
}

export interface Level4Realworld {
  situation: string;
  sampleResponse: string;
  keyTakeaways?: string;
}

export interface CardExercisePackage {
  level1Recognition?: Level1Recognition;
  level2Context?: Level2Context;
  level3Production?: Level3Production;
  level4Realworld?: Level4Realworld;
}

export interface PracticeQueueItem {
  id: string;
  word: string;
  meaning: string;
  ipa?: string;
  audio?: string;
  partOfSpeech?: string;
  deckId?: string;
  masteryLevel: number;
  status: string;
  wrongCount: number;
  nextReview?: string;
  hasExercisePackage: boolean;
  exercisePackage?: CardExercisePackage;
}

export interface PracticePromptResponse {
  deckId?: string;
  deckName?: string;
  wordCount: number;
  words: string[];
  systemPrompt: string;
  jsonTemplate: string;
}

export interface ImportPracticeJsonRequest {
  jsonContent: string;
}

export interface ImportPracticeJsonResponse {
  totalProcessed: number;
  successCount: number;
  message: string;
}

export interface SubmitLevelAnswerRequest {
  quality: number;             // 0-5 (0-2: Wrong, 3-5: Correct)
  isCorrect: boolean;
  currentLevel: number;        // 1 to 4
  confidenceScore?: number;    // 1 to 5 (for Level 4)
  answerText?: string;
}

export interface SubmitLevelAnswerResponse {
  cardId: string;
  word: string;
  oldLevel: number;
  newLevel: number;
  levelPromoted: boolean;
  status: string;
  intervalDays: number;
  nextReviewDate: string;
  wrongCount: number;
  isLeech: boolean;
  message: string;
}
