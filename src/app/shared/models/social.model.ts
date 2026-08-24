import { Comic } from './comic.model';

export interface Comment {
  id: string;
  content: string;
  userId: string;
  username?: string;
  avatarUrl?: string;
  url: string;
  createdAt?: string;
}

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

export interface SavedComic {
  id: string;
  userId: string;
  comicId: string;
  comic?: Comic;
  savedAt?: string;
}

export interface TopupRequest {
  id?: string;
  userId?: string;
  amount: number;
  diamonds?: number;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt?: string;
}

export interface Report {
  id: string;
  comicId: string;
  userId: string;
  reason: string;
  status?: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt?: string;
}

export interface Reading {
  id?: string;
  userId: string;
  comicId: string;
  chapterId: string;
  chapterNumber: number;
  readAt?: string;
}

export interface StreakReward {
  milestone: number; // 7, 14, 30 days
  claimedDate: string | null;
}
