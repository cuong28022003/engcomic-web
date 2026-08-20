// ===== AUTH & USER MODELS =====

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  username: string;
  email: string;
  roles: string[];
  avatarUrl?: string;
}

export interface CurrentUser {
  accessToken: string;
  refreshToken: string;
  userId: string;
  username: string;
  email: string;
  roles: string[];
  avatarUrl?: string;
}

// ===== COMIC MODELS =====

export interface Comic {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  coverImage?: string;
  imageUrl?: string;
  backgroundUrl?: string;
  genre?: string;
  genres?: string[];
  artist?: string;
  url?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING' | string;
  uploaderId?: string;
  uploaderName?: string;
  uploader?: {
    id?: string;
    username?: string;
    email?: string;
    fullName?: string;
    imageUrl?: string;
    roles?: string[];
  };
  views?: number;
  rating?: number;
  totalRatings?: number;
  totalChapters?: number;
  createdAt?: string;
  updatedAt?: string;
  isPremium?: boolean;
  englishLevel?: string;
  ageRating?: string;
}

export interface ComicPage {
  content: Comic[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ComicParams {
  page?: number;
  size?: number;
  sort?: string;
  keyword?: string;
  status?: string;
  genre?: string;
}

// ===== CHAPTER MODELS =====

export interface Chapter {
  id: string;
  comicId: string;
  chapterNumber: number;
  title?: string;
  images?: string[];
  isPremium?: boolean;
  createdAt?: string;
}

export interface ChapterPage {
  content: Chapter[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ===== DECK & CARD MODELS =====

export interface Deck {
  id: string;
  name: string;
  description?: string;
  userId: string;
  totalCards?: number;
  createdAt?: string;
}

export interface WordRelation {
  text: string;             // từ liên quan
  type: 'family' | 'collocation' | 'synonym';
  pos?: string;             // noun | verb | adjective | adverb (chỉ cho family)
  relatedCardId?: string;   // null nếu chưa auto-link
  // Backward compatibility
  relatedText?: string;
  relationType?: 'family' | 'collocation' | 'synonym';
  word?: string;
}

export interface ExampleSentence {
  id?: string;
  text: string;             // câu ví dụ tiếng Anh
  translation?: string;     // nghĩa tiếng Việt
  formality?: 'formal' | 'informal' | 'written';
  source?: string;
}

export interface Card {
  id: string;
  deckId?: string;
  userId?: string;
  // Nội dung từ vựng chính
  word: string;             // từ / cụm từ tiếng Anh
  meaning: string;          // nghĩa tiếng Việt
  ipa?: string;
  audio?: string;
  partOfSpeech?: string;
  definitionEn?: string;
  usageNote?: string;
  topic?: string;
  examples?: ExampleSentence[];
  relations?: WordRelation[];
  // SRS fields
  stage?: number;           // 0–5
  status?: 'new' | 'learning' | 'mature' | 'leech';
  easeFactor?: number;
  interval?: number;
  repetition?: number;
  wrongCount?: number;
  nextReview?: string;
  lastReviewed?: string;
  reviewCount?: number;
  seenExampleIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  // Legacy fields (backward compat)
  front?: string;
  back?: string;
  example?: string;
  difficulty?: number;
}

export interface CardReviewRequest {
  cardId: string;
  quality: number; // 0-5 for spaced repetition
}

// ===== VOCAB VAULT — DASHBOARD =====

export interface DashboardStats {
  total: number;
  dueToday: number;
  newCount: number;
  learningCount: number;
  matureCount: number;
  leechCount: number;
}

export interface DashboardResponse {
  totalCards: number;
  dueToday: number;
  newCount: number;
  learningCount: number;
  matureCount: number;
  leechCount: number;
  cards: PageResponse<Card>;
  stats?: DashboardStats;
}

// ===== VOCAB VAULT — BATCH IMPORT =====

export interface BatchImportRequest {
  jsonContent: string;
  deckId?: string;
}

export interface BatchImportError {
  word: string;
  missingFields?: string[];
  reason?: string;
}

export interface BatchImportResult {
  imported: Card[];
  skipped: string[];
  errors: BatchImportError[];
  importedCount?: number;
  skippedCount?: number;
  errorCount?: number;
}

// ===== VOCAB VAULT — PENDING ITEMS =====

export interface PendingItem {
  id: string;
  userId: string;
  content: string;
  sourceType?: 'family' | 'collocation' | 'synonym' | 'manual';
  sourceCardId?: string;
  status: 'pending' | 'imported';
  createdAt?: string;
}

export interface CreatePendingItemRequest {
  content: string;
  sourceType?: string;
  sourceCardId?: string;
}

// ===== VOCAB VAULT — PRACTICE =====

export interface PracticeResultRequest {
  quality: number; // 0–5 (SM-2 scale)
}

export interface CardDetailResponse {
  card: Card;
  reverseRelations?: Card[];
}

// ===== GACHA & CHARACTER MODELS =====

export interface GachaCharacter {
  id: string;
  name: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  imageUrl?: string;
  spriteUrl?: string;
  skills?: CharacterSkill[];
  description?: string;
  version?: string;
}

export interface CharacterSkill {
  id: string;
  name: string;
  description: string;
  type: string;
  value?: number;
}

export interface UserCharacter {
  id: string;
  userId: string;
  character: GachaCharacter;
  quantity?: number;
  acquiredAt?: string;
}

// ===== USER STATS MODELS =====

export interface UserStats {
  userId: string;
  xp: number;
  diamonds: number;
  streakDays: number;
  lastLoginDate?: string;
  isPremium?: boolean;
  premiumExpiry?: string;
  rank?: Rank;
}

export interface Rank {
  id: string;
  name: string;
  minXp: number;
  maxXp: number;
  badgeUrl?: string;
  color?: string;
}

// ===== COMMENT MODELS =====

export interface Comment {
  id: string;
  content: string;
  userId: string;
  username?: string;
  avatarUrl?: string;
  url: string;
  createdAt?: string;
}

// ===== RATING MODELS =====

export interface Rating {
  comicId: string;
  userId: string;
  rating: number;
}

export interface RatingSummary {
  comicId: string;
  averageRating: number;
  totalRatings: number;
  distribution?: Record<number, number>;
}

// ===== SAVED MODELS =====

export interface SavedComic {
  id: string;
  userId: string;
  comicId: string;
  comic?: Comic;
  savedAt?: string;
}

// ===== TOPUP MODELS =====

export interface TopupRequest {
  id?: string;
  userId?: string;
  amount: number;
  diamonds?: number;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt?: string;
}

// ===== REPORT MODELS =====

export interface Report {
  id: string;
  comicId: string;
  userId: string;
  reason: string;
  status?: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt?: string;
}

// ===== READING MODELS =====

export interface Reading {
  id?: string;
  userId: string;
  comicId: string;
  chapterId: string;
  chapterNumber: number;
  readAt?: string;
}

// ===== LEADERBOARD =====

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl?: string;
  xp: number;
  rank?: Rank;
  position?: number;
}

// ===== REWARD =====

export interface StreakReward {
  milestone: number; // 7, 14, 30 days
  claimedDate: string | null;
}

// ===== PAGINATION =====

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface PageParams {
  [key: string]: string | number | boolean | undefined;
  page?: number;
  size?: number;
  sort?: string;
}

// ===== API RESPONSE =====

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: string;
  success?: boolean;
}
